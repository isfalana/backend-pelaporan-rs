'use strict';

const crypto = require('crypto');
const { Op } = require('sequelize');

const {
  Laporan,
  LaporanPic,
  LaporanHistory,
  DetailTindakan,
  Unit,
  Users,
  Kategori,
  Prioritas,
  UserFcmToken,
  sequelize
} = require('../models');

let admin;

try {
  admin = require('../utils/firebase');
} catch (error) {
  console.warn('Firebase Admin tidak tersedia:', error.message);
}

// =====================================================
// HELPER
// =====================================================

const isAdmin = (user) =>
  user?.id_role === 'R-01' || user?.role === 'Admin';

const getLaporanIncludes = () => [
  {
    model: Unit,
    as: 'unit_pelapor',
    attributes: ['id_unit', 'nama_unit']
  },
  {
    model: Users,
    as: 'pelapor',
    attributes: ['id_nik', 'nama_karyawan']
  },
  {
    model: Kategori,
    as: 'kategori',
    attributes: ['id_kategori', 'nama_kategori']
  },
  {
    model: Prioritas,
    as: 'prioritas',
    attributes: [
      'id_prioritas',
      'nama_prioritas',
      'urutan',
      'batas_sisa_hari'
    ]
  },
  {
    model: LaporanPic,
    as: 'penugasan_pic',
    include: [
      {
        model: Users,
        as: 'pic',
        attributes: ['id_nik', 'nama_karyawan']
      },
      {
        model: Users,
        as: 'pemberi_tugas',
        attributes: ['id_nik', 'nama_karyawan']
      }
    ]
  },
  {
    model: DetailTindakan,
    as: 'detail_tindakan'
  },
  {
    model: LaporanHistory,
    as: 'history',
    include: [
      {
        model: Users,
        as: 'actor',
        attributes: ['id_nik', 'nama_karyawan']
      }
    ]
  }
];

const createHistory = async ({
  id_laporan,
  actor_id,
  activity_type,
  description,
  old_value = null,
  new_value = null,
  metadata = null,
  transaction
}) => {
  return LaporanHistory.create(
    {
      id_laporan,
      actor_id,
      actor_type: actor_id ? 'USER' : 'SYSTEM',
      activity_type,
      description,
      old_value,
      new_value,
      metadata
    },
    { transaction }
  );
};

const isAssignedPic = async (id_laporan, id_nik) => {
  const assignment = await LaporanPic.findOne({
    where: { id_laporan, id_nik_pic: id_nik }
  });

  return Boolean(assignment);
};

const canViewLaporan = async (laporan, user) => {
  if (isAdmin(user)) return true;

  if (laporan.id_nik_pelapor === user.id_nik) return true;

  return isAssignedPic(laporan.id_laporan, user.id_nik);
};

// =====================================================
// AUTO PRIORITAS
// =====================================================

const getAutoPriority = async (deadline, transaction) => {
  const priorities = await Prioritas.findAll({
    where: { is_active: true },
    order: [['urutan', 'ASC']],
    transaction
  });

  if (!priorities.length) {
    return null;
  }

  if (!deadline) {
    return priorities.find(
      item => item.batas_sisa_hari === null
    )?.id_prioritas || priorities[0].id_prioritas;
  }

  const today = new Date();
  const deadlineDate = new Date(deadline);

  const todayUTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const deadlineUTC = Date.UTC(
    deadlineDate.getFullYear(),
    deadlineDate.getMonth(),
    deadlineDate.getDate()
  );

  const remainingDays = Math.max(
    0,
    Math.ceil((deadlineUTC - todayUTC) / 86400000)
  );

  const thresholds = priorities
    .filter(item => item.batas_sisa_hari !== null)
    .sort(
      (a, b) => a.batas_sisa_hari - b.batas_sisa_hari
    );

  const matchedPriority = thresholds.find(
    item => remainingDays <= item.batas_sisa_hari
  );

  if (matchedPriority) {
    return matchedPriority.id_prioritas;
  }

  const basePriority = priorities.find(
    item => item.batas_sisa_hari === null
  );

  return basePriority?.id_prioritas || priorities[0].id_prioritas;
};

// =====================================================
// NOTIFIKASI PIC
// =====================================================

const notifyPics = async (id_nik_list, notification) => {
  try {
    if (!admin?.messaging || !id_nik_list.length) return;

    const records = await UserFcmToken.findAll({
      where: {
        id_nik: { [Op.in]: id_nik_list },
        is_active: true
      }
    });

    const tokens = [
      ...new Set(
        records
          .map(item => item.fcm_token)
          .filter(token =>
            token &&
            token !== 'dummy_fcm_token_web' &&
            token !== 'dummy_token_fallback'
          )
      )
    ];

    if (!tokens.length) return;

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        id_laporan: String(notification.id_laporan),
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      }
    });

    console.log(
      `[FCM] Berhasil: ${response.successCount}, Gagal: ${response.failureCount}`
    );

    // Nonaktifkan token yang sudah tidak valid.
    const invalidTokens = [];

    response.responses.forEach((result, index) => {
      const code = result.error?.code;

      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        invalidTokens.push(tokens[index]);
      }
    });

    if (invalidTokens.length) {
      await UserFcmToken.update(
        { is_active: false },
        {
          where: {
            fcm_token: { [Op.in]: invalidTokens }
          }
        }
      );
    }
  } catch (error) {
    console.error('Gagal mengirim notifikasi PIC:', error);
  }
};

// =====================================================
// GET ALL LAPORAN
// =====================================================

exports.getAllLaporan = async (req, res) => {
  try {
    const { status, prioritas, unit } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (prioritas) {
      where.id_prioritas = prioritas;
    }

    if (isAdmin(req.user)) {
      // Filter unit hanya untuk Admin.
      if (unit) {
        where.id_unit_pelapor = unit;
      }
    } else {
      // User hanya melihat laporan miliknya
      // atau laporan tempat ia ditugaskan sebagai PIC.
      const assignments = await LaporanPic.findAll({
        where: { id_nik_pic: req.user.id_nik },
        attributes: ['id_laporan']
      });

      const assignedIds = assignments.map(
        item => item.id_laporan
      );

      where[Op.or] = [
        { id_nik_pelapor: req.user.id_nik },
        { id_laporan: { [Op.in]: assignedIds } }
      ];
    }

    const laporan = await Laporan.findAll({
      where,
      include: getLaporanIncludes(),
      order: [['created_at', 'DESC']],
      distinct: true
    });

    return res.status(200).json({
      status: 'success',
      data: laporan
    });
  } catch (error) {
    console.error('Error getAllLaporan:', error);

    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data laporan'
    });
  }
};

// =====================================================
// GET LAPORAN BY ID
// =====================================================

exports.getLaporanById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Laporan.findByPk(id, {
      include: getLaporanIncludes()
    });

    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Laporan tidak ditemukan'
      });
    }

    const allowed = await canViewLaporan(item, req.user);

    if (!allowed) {
      return res.status(403).json({
        status: 'error',
        message: 'Anda tidak memiliki akses ke laporan ini'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: item
    });
  } catch (error) {
    console.error('Error getLaporanById:', error);

    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil detail laporan'
    });
  }
};

// =====================================================
// CREATE LAPORAN
// =====================================================

exports.createLaporan = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      tgl_kejadian,
      id_kategori,
      id_prioritas,
      deadline,
      perihal,
      keterangan,
      id_nik_pics = []
    } = req.body;

    if (!tgl_kejadian || !id_kategori || !perihal) {
      await transaction.rollback();

      return res.status(400).json({
        status: 'error',
        message: 'Tanggal kejadian, kategori, dan perihal wajib diisi'
      });
    }

    if (!Array.isArray(id_nik_pics)) {
      await transaction.rollback();

      return res.status(400).json({
        status: 'error',
        message: 'id_nik_pics harus berupa array'
      });
    }

    const id_nik = req.user.id_nik;

    // Identitas pelapor dan unit diambil dari database.
    const pelapor = await Users.findByPk(id_nik, {
      transaction
    });

    if (!pelapor) {
      await transaction.rollback();

      return res.status(401).json({
        status: 'error',
        message: 'Pengguna tidak ditemukan'
      });
    }

    // Validasi kategori.
    const kategori = await Kategori.findByPk(id_kategori, {
      transaction
    });

    if (!kategori || !kategori.is_active) {
      await transaction.rollback();

      return res.status(400).json({
        status: 'error',
        message: 'Kategori tidak valid atau tidak aktif'
      });
    }

    // Validasi PIC.
    const uniquePicIds = [...new Set(id_nik_pics)];

    if (uniquePicIds.includes(id_nik)) {
      await transaction.rollback();

      return res.status(400).json({
        status: 'error',
        message: 'Pelapor tidak perlu ditugaskan sebagai PIC'
      });
    }

    if (uniquePicIds.length) {
      const picUsers = await Users.findAll({
        where: {
          id_nik: { [Op.in]: uniquePicIds }
        },
        attributes: ['id_nik'],
        transaction
      });

      if (picUsers.length !== uniquePicIds.length) {
        await transaction.rollback();

        return res.status(400).json({
          status: 'error',
          message: 'Terdapat PIC yang tidak ditemukan'
        });
      }
    }

    // Tentukan prioritas.
    let selectedPriority;
    let priorityMode;

    if (id_prioritas) {
      selectedPriority = await Prioritas.findOne({
        where: {
          id_prioritas,
          is_active: true
        },
        transaction
      });

      if (!selectedPriority) {
        await transaction.rollback();

        return res.status(400).json({
          status: 'error',
          message: 'Prioritas tidak valid atau tidak aktif'
        });
      }

      priorityMode = 'MANUAL';
    } else {
      id_prioritas = undefined;
      selectedPriority = await getAutoPriority(
        deadline,
        transaction
      );

      priorityMode = 'AUTO';
    }

    // Nomor laporan dengan komponen acak untuk mengurangi
    // risiko benturan ketika beberapa laporan dibuat bersamaan.
    const now = new Date();

    const datePart = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('');

    const nomorLaporan =
      `LAP-${datePart}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const laporan = await Laporan.create(
      {
        nomor_laporan: nomorLaporan,
        tgl_kejadian,
        id_nik_pelapor: pelapor.id_nik,
        id_unit_pelapor: pelapor.id_unit,
        id_kategori,
        id_prioritas: selectedPriority,
        priority_mode: priorityMode,
        deadline: deadline || null,
        perihal,
        keterangan: keterangan || '',
        status: 'OPEN'
      },
      { transaction }
    );

    // Simpan semua penugasan PIC.
    if (uniquePicIds.length) {
      const assignments = uniquePicIds.map(id_nik_pic => ({
        id_laporan: laporan.id_laporan,
        id_nik_pic,
        assigned_by: pelapor.id_nik,
        assigned_at: new Date()
      }));

      await LaporanPic.bulkCreate(assignments, {
        transaction
      });
    }

    await createHistory({
      id_laporan: laporan.id_laporan,
      actor_id: pelapor.id_nik,
      activity_type: 'CREATE_REPORT',
      description: 'Laporan baru dibuat',
      new_value: {
        nomor_laporan: nomorLaporan,
        status: 'OPEN',
        id_prioritas: selectedPriority,
        priority_mode: priorityMode,
        id_nik_pics: uniquePicIds
      },
      transaction
    });

    await transaction.commit();

    // Notifikasi dikirim setelah transaksi berhasil.
    await notifyPics(uniquePicIds, {
      title: `Laporan Baru: ${nomorLaporan}`,
      body: `Perihal: ${perihal}`,
      id_laporan: laporan.id_laporan
    });

    const item = await Laporan.findByPk(laporan.id_laporan, {
      include: getLaporanIncludes()
    });

    return res.status(201).json({
      status: 'success',
      message: 'Laporan berhasil dibuat',
      data: item
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error('Error createLaporan:', error);

    return res.status(500).json({
      status: 'error',
      message: 'Gagal membuat laporan'
    });
  }
};

// =====================================================
// ASSIGN / UPDATE PIC
// =====================================================

exports.assignPics = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { id_nik_pics } = req.body;

    if (!Array.isArray(id_nik_pics)) {
      await transaction.rollback();

      return res.status(400).json({
        status: 'error',
        message: 'id_nik_pics harus berupa array'
      });
    }

    const laporan = await Laporan.findByPk(id, {
      transaction
    });

    if (!laporan) {
      await transaction.rollback();

      return res.status(404).json({
        status: 'error',
        message: 'Laporan tidak ditemukan'
      });
    }

    // Hanya pelapor atau Admin yang dapat mengatur PIC.
    if (
      !isAdmin(req.user) &&
      laporan.id_nik_pelapor !== req.user.id_nik
    ) {
      await transaction.rollback();

      return res.status(403).json({
        status: 'error',
        message: 'Anda tidak berhak mengatur PIC laporan ini'
      });
    }

    const uniquePicIds = [...new Set(id_nik_pics)];

    if (uniquePicIds.includes(laporan.id_nik_pelapor)) {
      await transaction.rollback();

      return res.status(400).json({
        status: 'error',
        message: 'Pelapor tidak dapat ditugaskan sebagai PIC'
      });
    }

    const picUsers = uniquePicIds.length
      ? await Users.findAll({
          where: {
            id_nik: { [Op.in]: uniquePicIds }
          },
          attributes: ['id_nik'],
          transaction
        })
      : [];

    if (picUsers.length !== uniquePicIds.length) {
      await transaction.rollback();

      return res.status(400).json({
        status: 'error',
        message: 'Terdapat PIC yang tidak ditemukan'
      });
    }

    const oldAssignments = await LaporanPic.findAll({
      where: { id_laporan: id },
      attributes: ['id_nik_pic'],
      transaction
    });

    const oldPicIds = oldAssignments.map(
      item => item.id_nik_pic
    );

    await LaporanPic.destroy({
      where: { id_laporan: id },
      transaction
    });

    if (uniquePicIds.length) {
      await LaporanPic.bulkCreate(
        uniquePicIds.map(id_nik_pic => ({
          id_laporan: id,
          id_nik_pic,
          assigned_by: req.user.id_nik,
          assigned_at: new Date()
        })),
        { transaction }
      );
    }

    await createHistory({
      id_laporan: id,
      actor_id: req.user.id_nik,
      activity_type: 'ASSIGN_PIC',
      description: 'Penugasan PIC diperbarui',
      old_value: { id_nik_pics: oldPicIds },
      new_value: { id_nik_pics: uniquePicIds },
      transaction
    });

    await transaction.commit();

    await notifyPics(
      uniquePicIds.filter(pic => !oldPicIds.includes(pic)),
      {
        title: `Penugasan Laporan`,
        body: `Anda mendapatkan penugasan laporan ${laporan.nomor_laporan}`,
        id_laporan: id
      }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Penugasan PIC berhasil diperbarui',
      data: { id_nik_pics: uniquePicIds }
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error('Error assignPics:', error);

    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui penugasan PIC'
    });
  }
};

// =====================================================
// APPROVAL / REJECTION PELAPOR
// =====================================================

exports.updateStatus = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { status, approval_note } = req.body;

    const laporan = await Laporan.findByPk(id, {
      transaction
    });

    if (!laporan) {
      await transaction.rollback();

      return res.status(404).json({
        status: 'error',
        message: 'Laporan tidak ditemukan'
      });
    }

    // Approval hanya boleh dilakukan pelapor.
    if (laporan.id_nik_pelapor !== req.user.id_nik) {
      await transaction.rollback();

      return res.status(403).json({
        status: 'error',
        message: 'Hanya pelapor yang dapat menyetujui atau menolak laporan'
      });
    }

    if (laporan.status !== 'PENDING_APPROVAL') {
      await transaction.rollback();

      return res.status(400).json({
        status: 'error',
        message: 'Laporan belum berada pada tahap menunggu approval'
      });
    }

    if (!['COMPLETED', 'RETURNED'].includes(status)) {
      await transaction.rollback();

      return res.status(400).json({
        status: 'error',
        message: 'Status approval tidak valid'
      });
    }

    if (status === 'COMPLETED') {
      const totalActions = await DetailTindakan.count({
        where: { id_laporan: id },
        transaction
      });

      const incompleteActions = await DetailTindakan.count({
        where: {
          id_laporan: id,
          is_completed: false
        },
        transaction
      });

      if (totalActions === 0 || incompleteActions > 0) {
        await transaction.rollback();

        return res.status(400).json({
          status: 'error',
          message: 'Seluruh checklist harus diselesaikan sebelum approval'
        });
      }
    }

    if (
      status === 'RETURNED' &&
      (!approval_note || !approval_note.trim())
    ) {
      await transaction.rollback();

      return res.status(400).json({
        status: 'error',
        message: 'Catatan penolakan wajib diisi'
      });
    }

    const oldStatus = laporan.status;

    laporan.status = status;
    laporan.approval_note = approval_note || null;

    if (status === 'COMPLETED') {
      laporan.approved_by = req.user.id_nik;
      laporan.approved_at = new Date();
    } else {
      laporan.approved_by = null;
      laporan.approved_at = null;
    }

    await laporan.save({ transaction });

    await createHistory({
      id_laporan: id,
      actor_id: req.user.id_nik,
      activity_type: status === 'COMPLETED'
        ? 'APPROVE_REPORT'
        : 'REJECT_REPORT',
      description: status === 'COMPLETED'
        ? 'Pelapor menyetujui penyelesaian laporan'
        : 'Pelapor mengembalikan laporan untuk perbaikan',
      old_value: { status: oldStatus },
      new_value: {
        status,
        approval_note: laporan.approval_note
      },
      transaction
    });

    await transaction.commit();

    return res.status(200).json({
      status: 'success',
      message: status === 'COMPLETED'
        ? 'Laporan berhasil diselesaikan'
        : 'Laporan dikembalikan kepada PIC',
      data: laporan
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error('Error updateStatus:', error);

    return res.status(500).json({
      status: 'error',
      message: 'Gagal memproses approval laporan'
    });
  }
};
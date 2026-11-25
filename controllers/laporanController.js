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
  Evidence,
  UserFcmToken,
  sequelize
} = require('../models');

// [MODIFIKASI] Import service terpusat notifikasi
const { sendNotification } = require('../services/notificationService');

let admin;

try {
  admin = require('../utils/firebase');
} catch (error) {
  console.warn('Firebase Admin tidak tersedia:', error.message);
}

// =====================================================
// HELPER
// =====================================================

// [MODIFIKASI] Helper normalisasi tanggal ke format ISO YYYY-MM-DD
// Memastikan Sequelize dan PostgreSQL menerima format tanggal yang valid
// Mendukung input 'YYYY-MM-DD', 'DD/MM/YYYY', 'DD-MM-YYYY', maupun objek Date
const formatToDateOnly = (val) => {
  if (!val) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return val;
};

const isAdmin = (user) => {
  if (!user) return false;
  const roleName = (user.role || '').toLowerCase();
  const roleId = (user.id_role || '').toUpperCase();
  return roleId === 'R-01' || roleId === 'ADMIN' || roleName.includes('admin');
};

const getLaporanIncludes = () => [
  {
    model: Unit,
    as: 'unit_pelapor',
    attributes: ['id_unit', 'nama_unit'],
    // [MODIFIKASI] Gunakan paranoid: false agar riwayat nama unit pelapor tetap terbaca meskipun unitnya non-aktif
    paranoid: false
  },
  {
    model: Users,
    as: 'pelapor',
    attributes: ['id_nik', 'nama_karyawan', 'id_unit'],
    paranoid: false,
    include: [
      {
        model: Unit,
        as: 'unit',
        attributes: ['id_unit', 'nama_unit'],
        paranoid: false
      }
    ]
  },
  {
    model: Kategori,
    as: 'kategori',
    attributes: ['id_kategori', 'nama_kategori'],
    paranoid: false
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
        // [MODIFIKASI] Sertakan id_unit dan relasi Unit (paranoid: false) agar unit kerja PIC dapat diakses langsung oleh front-end
        attributes: ['id_nik', 'nama_karyawan', 'id_unit'],
        paranoid: false,
        include: [
          {
            model: Unit,
            as: 'unit',
            attributes: ['id_unit', 'nama_unit'],
            paranoid: false
          }
        ]
      },
      {
        model: Users,
        as: 'pemberi_tugas',
        attributes: ['id_nik', 'nama_karyawan'],
        paranoid: false
      }
    ]
  },
  {
    model: DetailTindakan,
    as: 'detail_tindakan'
  },
  // [MODIFIKASI] Sertakan evidence laporan dan tindak lanjut
  {
    model: Evidence,
    as: 'evidence'
  },
  {
    model: LaporanHistory,
    as: 'history',
    include: [
      {
        model: Users,
        as: 'actor',
        // [MODIFIKASI] Sertakan relasi Unit pada actor history agar nama unit actor riwayat tampil (bukan hanya ID)
        attributes: ['id_nik', 'nama_karyawan', 'id_unit'],
        paranoid: false,
        include: [
          {
            model: Unit,
            as: 'unit',
            attributes: ['id_unit', 'nama_unit'],
            paranoid: false
          }
        ]
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

// [MODIFIKASI] Helper untuk memperkaya data history dengan nama karyawan PIC, unit kerja, serta menentukan last_update_by
const enrichHistoryWithPicNames = async (laporanData) => {
  if (!laporanData) return;
  const items = Array.isArray(laporanData) ? laporanData : [laporanData];
  const nikSet = new Set();

  for (const item of items) {
    if (item.id_nik_pelapor) nikSet.add(item.id_nik_pelapor);
    const histories = item.history || item.dataValues?.history;
    if (Array.isArray(histories)) {
      for (const h of histories) {
        if (h.actor_id) nikSet.add(h.actor_id);
        const newVal = h.new_value || h.dataValues?.new_value;
        const oldVal = h.old_value || h.dataValues?.old_value;
        if (newVal?.id_nik_pics && Array.isArray(newVal.id_nik_pics)) {
          newVal.id_nik_pics.forEach(nik => nik && nikSet.add(nik));
        }
        if (oldVal?.id_nik_pics && Array.isArray(oldVal.id_nik_pics)) {
          oldVal.id_nik_pics.forEach(nik => nik && nikSet.add(nik));
        }
      }
    }
  }

  const userMap = new Map();
  if (nikSet.size > 0) {
    const users = await Users.findAll({
      where: { id_nik: { [Op.in]: Array.from(nikSet) } },
      attributes: ['id_nik', 'nama_karyawan', 'id_unit'],
      include: [
        {
          model: Unit,
          as: 'unit',
          attributes: ['id_unit', 'nama_unit'],
          paranoid: false
        }
      ],
      paranoid: false
    });
    users.forEach(u => {
      userMap.set(u.id_nik, {
        nama_karyawan: u.nama_karyawan,
        id_unit: u.id_unit || '',
        nama_unit: u.unit?.nama_unit || u.id_unit || ''
      });
    });
  }

  for (const item of items) {
    const histories = item.history || item.dataValues?.history;
    if (Array.isArray(histories)) {
      for (const h of histories) {
        const newVal = h.new_value || h.dataValues?.new_value;
        if (newVal?.id_nik_pics && Array.isArray(newVal.id_nik_pics)) {
          const names = newVal.id_nik_pics.map(nik => userMap.get(nik)?.nama_karyawan || nik);
          const pics = newVal.id_nik_pics.map(nik => {
            const info = userMap.get(nik);
            return {
              id_nik: nik,
              nama_karyawan: info?.nama_karyawan || nik,
              id_unit: info?.id_unit || '',
              nama_unit: info?.nama_unit || ''
            };
          });
          const updatedNewVal = { ...newVal, nama_pics: names, pics };
          if (h.setDataValue) {
            h.setDataValue('new_value', updatedNewVal);
          } else {
            h.new_value = updatedNewVal;
          }
          // Perbarui juga description jika belum memuat nama karyawan
          let desc = h.description || h.dataValues?.description || '';
          if (desc.includes('Laporan baru dibuat') && !desc.includes('PIC:')) {
            desc = `Laporan baru dibuat. PIC: ${names.join(', ')}`;
            if (h.setDataValue) h.setDataValue('description', desc);
            else h.description = desc;
          } else if (desc === 'Penugasan PIC diperbarui') {
            desc = `Penugasan PIC diperbarui: ${names.join(', ')}`;
            if (h.setDataValue) h.setDataValue('description', desc);
            else h.description = desc;
          }
        }

        const oldVal = h.old_value || h.dataValues?.old_value;
        if (oldVal?.id_nik_pics && Array.isArray(oldVal.id_nik_pics)) {
          const names = oldVal.id_nik_pics.map(nik => userMap.get(nik)?.nama_karyawan || nik);
          const pics = oldVal.id_nik_pics.map(nik => {
            const info = userMap.get(nik);
            return {
              id_nik: nik,
              nama_karyawan: info?.nama_karyawan || nik,
              id_unit: info?.id_unit || '',
              nama_unit: info?.nama_unit || ''
            };
          });
          const updatedOldVal = { ...oldVal, nama_pics: names, pics };
          if (h.setDataValue) {
            h.setDataValue('old_value', updatedOldVal);
          } else {
            h.old_value = updatedOldVal;
          }
        }
      }
    }

    // [MODIFIKASI] Tetapkan last_update_by pada laporan berdasarkan riwayat terbaru atau pelapor
    let lastUpdater = null;
    if (Array.isArray(histories) && histories.length > 0) {
      const sortedHistory = [...histories].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const latest = sortedHistory[0];
      const actorInfo = userMap.get(latest.actor_id) || latest.actor;
      if (actorInfo) {
        const aName = actorInfo.nama_karyawan || actorInfo.id_nik || '';
        const aUnit = actorInfo.unit?.nama_unit || actorInfo.nama_unit || '';
        lastUpdater = aUnit ? `${aName} · ${aUnit}` : aName;
      } else if (latest.actor_id) {
        lastUpdater = latest.actor_id;
      } else {
        lastUpdater = 'Sistem';
      }
    }

    if (!lastUpdater && item.id_nik_pelapor) {
      const pInfo = userMap.get(item.id_nik_pelapor) || item.pelapor;
      if (pInfo) {
        const pName = pInfo.nama_karyawan || item.id_nik_pelapor;
        const pUnit = pInfo.unit?.nama_unit || pInfo.nama_unit || '';
        lastUpdater = pUnit ? `${pName} · ${pUnit}` : pName;
      }
    }

    if (lastUpdater) {
      if (item.setDataValue) {
        item.setDataValue('last_update_by', lastUpdater);
      }
      item.last_update_by = lastUpdater;
      if (item.dataValues) {
        item.dataValues.last_update_by = lastUpdater;
      }
    }

    // [MODIFIKASI] Tetapkan bukti_url dan bukti_tindakan_url dari relasi evidence
    const evidences = item.evidence || item.dataValues?.evidence;
    if (Array.isArray(evidences) && evidences.length > 0) {
      const firstEv = evidences[0];
      const evId = firstEv.id_evidence;
      const evName = firstEv.original_name || firstEv.stored_name;
      const bUrl = `/api/evidence/file/${evId}`;

      if (item.setDataValue) {
        item.setDataValue('bukti_url', bUrl);
        item.setDataValue('id_evidence', evId);
        if (!item.dataValues?.bukti) item.setDataValue('bukti', evName);
      }
      item.bukti_url = bUrl;
      item.id_evidence = evId;
      if (!item.bukti) item.bukti = evName;
      if (item.dataValues) {
        item.dataValues.bukti_url = bUrl;
        item.dataValues.id_evidence = evId;
        if (!item.dataValues.bukti) item.dataValues.bukti = evName;
      }

      // Evidence tindakan
      const actEv = evidences.find(e => e.id_detail_tindakan) || (evidences.length > 1 ? evidences[evidences.length - 1] : null);
      if (actEv && actEv.id_evidence !== evId) {
        const actUrl = `/api/evidence/file/${actEv.id_evidence}`;
        const actName = actEv.original_name || actEv.stored_name;
        if (item.setDataValue) {
          item.setDataValue('bukti_tindakan_url', actUrl);
          item.setDataValue('id_evidence_tindakan', actEv.id_evidence);
          if (!item.dataValues?.bukti_tindakan) item.setDataValue('bukti_tindakan', actName);
        }
        item.bukti_tindakan_url = actUrl;
        item.id_evidence_tindakan = actEv.id_evidence;
        if (!item.bukti_tindakan) item.bukti_tindakan = actName;
        if (item.dataValues) {
          item.dataValues.bukti_tindakan_url = actUrl;
          item.dataValues.id_evidence_tindakan = actEv.id_evidence;
          if (!item.dataValues.bukti_tindakan) item.dataValues.bukti_tindakan = actName;
        }
      }
    }
  }
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

// [MODIFIKASI] Gunakan service terpusat notifikasi agar tersimpan di database dan dikirim via FCM
const notifyPics = async (id_nik_list, notification) => {
  try {
    await sendNotification({
      id_nik_list,
      id_laporan: notification.id_laporan,
      title: notification.title,
      body: notification.body,
      type: notification.type || 'PIC_NOTIFICATION'
    });
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

    // [MODIFIKASI] Urutkan laporan created_at DESC, evidence ASC, dan history created_at DESC berdasarkan waktu update sistem/user/admin
    const laporan = await Laporan.findAll({
      where,
      include: getLaporanIncludes(),
      order: [
        ['created_at', 'DESC'],
        [{ model: Evidence, as: 'evidence' }, 'created_at', 'ASC'],
        [{ model: LaporanHistory, as: 'history' }, 'created_at', 'DESC']
      ],
      distinct: true
    });

    // [MODIFIKASI] Format history agar menampilkan nama karyawan untuk PIC, bukan hanya NIK
    await enrichHistoryWithPicNames(laporan);

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

    // [MODIFIKASI] Sertakan pengurutan evidence created_at ASC dan history created_at DESC pada getLaporanById
    const item = await Laporan.findByPk(id, {
      include: getLaporanIncludes(),
      order: [
        [{ model: Evidence, as: 'evidence' }, 'created_at', 'ASC'],
        [{ model: LaporanHistory, as: 'history' }, 'created_at', 'DESC']
      ]
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

    // [MODIFIKASI] Format history agar menampilkan nama karyawan untuk PIC, bukan hanya NIK
    await enrichHistoryWithPicNames(item);

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
  console.log('DEBUG CREATE LAPORAN:', {
    contentType: req.headers['content-type'],
    body: req.body,
    bodyType: typeof req.body
  });

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
    let selectedPriorityId;
    let priorityMode;

    if (id_prioritas) {
      const priorityObj = await Prioritas.findOne({
        where: {
          id_prioritas,
          is_active: true
        },
        transaction
      });

      if (!priorityObj) {
        await transaction.rollback();

        return res.status(400).json({
          status: 'error',
          message: 'Prioritas tidak valid atau tidak aktif'
        });
      }

      selectedPriorityId = priorityObj.id_prioritas;
      priorityMode = 'MANUAL';
    } else {
      selectedPriorityId = await getAutoPriority(
        deadline,
        transaction
      );

      priorityMode = 'AUTO';
    }

    // [MODIFIKASI] Format nomor laporan auto increment simpel: lap01-tanggalbuat (misal lap01-24112026)
    const now = new Date();
    // Gunakan tanggal dalam zona waktu Jakarta (WIB / UTC+7)
    const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const dd = String(jakartaTime.getUTCDate()).padStart(2, '0');
    const mm = String(jakartaTime.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = jakartaTime.getUTCFullYear();
    const datePart = `${dd}${mm}${yyyy}`;

    const existingReports = await Laporan.findAll({
      attributes: ['nomor_laporan'],
      paranoid: false,
      transaction
    });

    let maxNum = 0;
    for (const r of existingReports) {
      const match = (r.nomor_laporan || '').match(/^lap(\d+)-/i);
      if (match) {
        const val = parseInt(match[1], 10);
        if (!isNaN(val) && val > maxNum) {
          maxNum = val;
        }
      }
    }

    if (maxNum === 0 && existingReports.length > 0) {
      maxNum = existingReports.length;
    }

    let nextNum = maxNum + 1;
    let candidateNomor = `lap${String(nextNum).padStart(2, '0')}-${datePart}`;

    let exists = await Laporan.findOne({
      where: { nomor_laporan: candidateNomor },
      paranoid: false,
      transaction
    });

    while (exists) {
      nextNum++;
      candidateNomor = `lap${String(nextNum).padStart(2, '0')}-${datePart}`;
      exists = await Laporan.findOne({
        where: { nomor_laporan: candidateNomor },
        paranoid: false,
        transaction
      });
    }

    const nomorLaporan = candidateNomor;

    // [MODIFIKASI] Gunakan formatToDateOnly agar format YYYY-MM-DD valid untuk PostgreSQL
    const cleanTglKejadian = formatToDateOnly(tgl_kejadian);
    const cleanDeadline = formatToDateOnly(deadline);

    const laporan = await Laporan.create(
      {
        nomor_laporan: nomorLaporan,
        tgl_kejadian: cleanTglKejadian,
        id_nik_pelapor: pelapor.id_nik,
        id_unit_pelapor: pelapor.id_unit,
        id_kategori,
        id_prioritas: selectedPriorityId,
        priority_mode: priorityMode,
        deadline: cleanDeadline || null,
        perihal,
        keterangan: keterangan || '',
        status: 'OPEN'
      },
      { transaction }
    );

    // Simpan semua penugasan PIC.
    let picNames = [];
    let picDetails = [];
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

      // [MODIFIKASI] Ambil nama karyawan untuk NIK PIC agar history mencatat nama karyawan
      const picUsers = await Users.findAll({
        where: { id_nik: { [Op.in]: uniquePicIds } },
        attributes: ['id_nik', 'nama_karyawan'],
        transaction
      });
      const picMap = new Map(picUsers.map(u => [u.id_nik, u.nama_karyawan]));
      picNames = uniquePicIds.map(nik => picMap.get(nik) || nik);
      picDetails = uniquePicIds.map(nik => ({
        id_nik: nik,
        nama_karyawan: picMap.get(nik) || nik
      }));
    }

    await createHistory({
      id_laporan: laporan.id_laporan,
      actor_id: pelapor.id_nik,
      activity_type: 'CREATE_REPORT',
      description: picNames.length > 0
        ? `Laporan baru dibuat. PIC: ${picNames.join(', ')}`
        : 'Laporan baru dibuat',
      new_value: {
        nomor_laporan: nomorLaporan,
        status: 'OPEN',
        id_prioritas: selectedPriorityId,
        priority_mode: priorityMode,
        id_nik_pics: uniquePicIds,
        // [MODIFIKASI] Sertakan nama_pics dan list objek pics di new_value history
        nama_pics: picNames,
        pics: picDetails
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
      include: getLaporanIncludes(),
      order: [
        [{ model: Evidence, as: 'evidence' }, 'created_at', 'ASC'],
        [{ model: LaporanHistory, as: 'history' }, 'created_at', 'DESC']
      ]
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

    // [MODIFIKASI] Validasi: PIC yang ditugaskan pada laporan ini TIDAK BISA mengatur atau mengedit laporan dalam keadaan apapun
    const isAssignedPic = await LaporanPic.findOne({
      where: {
        id_laporan: id,
        id_nik_pic: req.user.id_nik
      },
      transaction
    });

    if (isAssignedPic) {
      await transaction.rollback();
      return res.status(403).json({
        status: 'error',
        message: 'PIC yang ditugaskan pada laporan ini tidak dapat mengedit laporan dalam keadaan apapun'
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

    // [MODIFIKASI] Ambil nama karyawan berdasarkan NIK untuk oldPicIds dan uniquePicIds
    const allPicNiks = [...new Set([...oldPicIds, ...uniquePicIds])];
    let picMap = new Map();
    if (allPicNiks.length) {
      const picUsers = await Users.findAll({
        where: { id_nik: { [Op.in]: allPicNiks } },
        attributes: ['id_nik', 'nama_karyawan'],
        transaction
      });
      picMap = new Map(picUsers.map(u => [u.id_nik, u.nama_karyawan]));
    }
    const newPicNames = uniquePicIds.map(nik => picMap.get(nik) || nik);
    const oldPicNames = oldPicIds.map(nik => picMap.get(nik) || nik);

    await createHistory({
      id_laporan: id,
      actor_id: req.user.id_nik,
      activity_type: 'ASSIGN_PIC',
      description: newPicNames.length > 0
        ? `Penugasan PIC diperbarui: ${newPicNames.join(', ')}`
        : 'Penugasan PIC dikosongkan',
      old_value: {
        id_nik_pics: oldPicIds,
        nama_pics: oldPicNames,
        pics: oldPicIds.map(nik => ({ id_nik: nik, nama_karyawan: picMap.get(nik) || nik }))
      },
      new_value: {
        id_nik_pics: uniquePicIds,
        nama_pics: newPicNames,
        pics: uniquePicIds.map(nik => ({ id_nik: nik, nama_karyawan: picMap.get(nik) || nik }))
      },
      transaction
    });

    await transaction.commit();

    // [MODIFIKASI] Notifikasi ke PIC baru yang ditugaskan
    const newPics = uniquePicIds.filter(pic => !oldPicIds.includes(pic));
    if (newPics.length > 0) {
      await notifyPics(
        newPics,
        {
          title: `Penugasan Laporan: ${laporan.nomor_laporan}`,
          body: `Anda mendapatkan penugasan laporan "${laporan.perihal || laporan.nomor_laporan}"`,
          id_laporan: id,
          type: 'ASSIGN_PIC'
        }
      );
    }

    // [MODIFIKASI] Notifikasi ke PIC yang dicabut penugasannya
    const removedPics = oldPicIds.filter(pic => !uniquePicIds.includes(pic));
    if (removedPics.length > 0) {
      try {
        await sendNotification({
          id_nik_list: removedPics,
          id_laporan: id,
          title: `Pencabutan Penugasan: ${laporan.nomor_laporan}`,
          body: `Penugasan Anda pada laporan "${laporan.perihal || laporan.nomor_laporan}" telah dicabut oleh ${req.user?.nama_karyawan || 'Admin'}.`,
          type: 'PIC_NOTIFICATION'
        });
      } catch (e) {
        console.error('Error notifikasi removed PICs:', e);
      }
    }

    // [MODIFIKASI] Notifikasi ke Pelapor jika penugasan PIC diperbarui oleh Admin
    if (laporan.id_nik_pelapor && laporan.id_nik_pelapor !== req.user.id_nik) {
      try {
        await sendNotification({
          id_nik_list: [laporan.id_nik_pelapor],
          id_laporan: id,
          title: `PIC Laporan Diperbarui: ${laporan.nomor_laporan}`,
          body: `Daftar PIC untuk laporan Anda "${laporan.perihal || laporan.nomor_laporan}" telah diperbarui menjadi: ${newPicNames.join(', ') || '-'}.`,
          type: 'PIC_NOTIFICATION'
        });
      } catch (e) {
        console.error('Error notifikasi pelapor assignPics:', e);
      }
    }

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
// APPROVAL / REJECTION / REOPEN PELAPOR
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

    // Approval / Reopen hanya boleh dilakukan pelapor.
    if (laporan.id_nik_pelapor !== req.user.id_nik) {
      await transaction.rollback();

      return res.status(403).json({
        status: 'error',
        message: 'Hanya pelapor yang dapat menyetujui, menolak, atau membuka kembali laporan'
      });
    }

    // Skenario 1: Laporan COMPLETED dibuka kembali (RETURNED)
    if (laporan.status === 'COMPLETED') {
      if (status !== 'RETURNED') {
        await transaction.rollback();

        return res.status(400).json({
          status: 'error',
          message: 'Laporan yang sudah selesai hanya dapat dibuka kembali (RETURNED)'
        });
      }

      if (!approval_note || !approval_note.trim()) {
        await transaction.rollback();

        return res.status(400).json({
          status: 'error',
          message: 'Catatan/alasan membuka kembali laporan wajib diisi'
        });
      }

      const oldStatus = laporan.status;
      laporan.status = 'RETURNED';
      laporan.approval_note = approval_note.trim();
      laporan.approved_by = null;
      laporan.approved_at = null;

      await laporan.save({ transaction });

      await createHistory({
        id_laporan: id,
        actor_id: req.user.id_nik,
        activity_type: 'REOPEN_REPORT',
        description: 'Pelapor membuka kembali laporan dengan catatan: ' + approval_note.trim(),
        old_value: { status: oldStatus },
        new_value: {
          status: 'RETURNED',
          approval_note: laporan.approval_note
        },
        transaction
      });

      await transaction.commit();

      // [MODIFIKASI] Kirim notifikasi ke PIC bahwa laporan telah dibuka kembali
      try {
        const pics = await LaporanPic.findAll({ where: { id_laporan: id } });
        const picNiks = pics.map(p => p.id_nik_pic || p.id_nik).filter(Boolean);
        if (picNiks.length > 0) {
          await sendNotification({
            id_nik_list: picNiks,
            id_laporan: id,
            title: `Laporan Dibuka Kembali: ${laporan.nomor_laporan}`,
            body: `Pelapor membuka kembali laporan "${laporan.perihal || laporan.nomor_laporan}". Catatan: ${approval_note.trim()}`,
            type: 'RETURNED'
          });
        }
      } catch (notifErr) {
        console.error('Gagal kirim notifikasi return laporan:', notifErr);
      }

      return res.status(200).json({
        status: 'success',
        message: 'Laporan berhasil dibuka kembali untuk perbaikan',
        data: laporan
      });
    }

    // Skenario 2: Laporan sedang PENDING_APPROVAL
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
    laporan.approval_note = approval_note ? approval_note.trim() : null;

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
        : 'Pelapor menolak dan mengembalikan laporan untuk perbaikan: ' + (approval_note ? approval_note.trim() : ''),
      old_value: { status: oldStatus },
      new_value: {
        status,
        approval_note: laporan.approval_note
      },
      transaction
    });

    await transaction.commit();

    // [MODIFIKASI] Notifikasi hasil approval ke PIC dan Pelapor
    try {
      const pics = await LaporanPic.findAll({ where: { id_laporan: id } });
      const picNiks = pics.map(p => p.id_nik_pic || p.id_nik).filter(Boolean);
      const actorName = req.user?.nama_karyawan || req.user.id_nik;
      const isActorPelapor = req.user.id_nik === laporan.id_nik_pelapor;
      const roleLabel = isActorPelapor ? 'Pelapor' : (isAdmin(req.user) ? 'Admin' : 'Pengguna');

      if (picNiks.length > 0) {
        if (status === 'COMPLETED') {
          await sendNotification({
            id_nik_list: picNiks,
            id_laporan: id,
            title: `Laporan Disetujui: ${laporan.nomor_laporan}`,
            body: `Laporan "${laporan.perihal || laporan.nomor_laporan}" telah disetujui dan dinyatakan selesai oleh ${roleLabel} (${actorName}).`,
            type: 'COMPLETED'
          });
        } else if (status === 'RETURNED') {
          await sendNotification({
            id_nik_list: picNiks,
            id_laporan: id,
            title: `Laporan Ditolak / Perlu Perbaikan: ${laporan.nomor_laporan}`,
            body: `${roleLabel} (${actorName}) menolak approval laporan "${laporan.perihal || laporan.nomor_laporan}". Catatan: ${approval_note ? approval_note.trim() : '-'}`,
            type: 'RETURNED'
          });
        }
      }

      // Jika yang menyetujui / menolak adalah Admin (bukan Pelapor), beri tahu juga Pelapor
      if (!isActorPelapor && laporan.id_nik_pelapor && laporan.id_nik_pelapor !== req.user.id_nik) {
        await sendNotification({
          id_nik_list: [laporan.id_nik_pelapor],
          id_laporan: id,
          title: status === 'COMPLETED' ? `Laporan Disetujui: ${laporan.nomor_laporan}` : `Laporan Perlu Perbaikan: ${laporan.nomor_laporan}`,
          body: status === 'COMPLETED'
            ? `Laporan Anda "${laporan.perihal || laporan.nomor_laporan}" telah disetujui dan diselesaikan oleh Admin (${actorName}).`
            : `Laporan Anda "${laporan.perihal || laporan.nomor_laporan}" dikembalikan oleh Admin (${actorName}). Catatan: ${approval_note ? approval_note.trim() : '-'}`,
          type: status
        });
      }
    } catch (notifErr) {
      console.error('Gagal kirim notifikasi status laporan:', notifErr);
    }

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

// =====================================================
// [MODIFIKASI] UPDATE KETERANGAN & BUKTI TINDAK LANJUT (PIC)
// =====================================================
exports.updateTindakLanjut = async (req, res) => {
  try {
    const { id } = req.params;
    const { keterangan_tindakan, bukti_tindakan } = req.body;
    const actorId = req.user?.id_nik;

    const laporan = await Laporan.findByPk(id);
    if (!laporan) {
      return res.status(404).json({
        status: 'error',
        message: 'Laporan tidak ditemukan'
      });
    }

    if (keterangan_tindakan !== undefined) {
      laporan.keterangan_tindakan = keterangan_tindakan;
    }
    if (bukti_tindakan !== undefined) {
      laporan.bukti_tindakan = bukti_tindakan;
    }

    await laporan.save();

    await createHistory({
      id_laporan: laporan.id_laporan,
      actor_id: actorId,
      activity_type: 'UPDATE_TINDAK_LANJUT',
      description: 'PIC memperbarui keterangan/bukti tindak lanjut',
      new_value: {
        keterangan_tindakan: laporan.keterangan_tindakan,
        bukti_tindakan: laporan.bukti_tindakan
      }
    });

    // [MODIFIKASI] Notifikasi ke pelapor bahwa PIC telah memperbarui keterangan & bukti tindak lanjut
    try {
      if (laporan.id_nik_pelapor && laporan.id_nik_pelapor !== actorId) {
        await sendNotification({
          id_nik_list: [laporan.id_nik_pelapor],
          id_laporan: laporan.id_laporan,
          title: `Tindak Lanjut Diperbarui: ${laporan.nomor_laporan}`,
          body: `PIC telah memperbarui keterangan & bukti tindak lanjut untuk laporan "${laporan.perihal || laporan.nomor_laporan}".`,
          type: 'PIC_NOTIFICATION'
        });
      }
    } catch (notifErr) {
      console.error('Gagal kirim notifikasi update tindak lanjut:', notifErr);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Keterangan tindak lanjut berhasil diperbarui',
      data: laporan
    });
  } catch (error) {
    console.error('Error updateTindakLanjut:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Gagal memperbarui tindak lanjut'
    });
  }
};

// =====================================================
// UPDATE LAPORAN (Hanya Pelapor / Admin, DILARANG untuk PIC)
// =====================================================
exports.updateLaporan = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      perihal,
      id_kategori,
      id_prioritas,
      deadline,
      tgl_kejadian,
      keterangan,
      id_nik_pics
    } = req.body;
    const actorId = req.user?.id_nik;

    const laporan = await Laporan.findByPk(id, { transaction });
    if (!laporan) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Laporan tidak ditemukan'
      });
    }

    if (laporan.status === 'COMPLETED') {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Laporan yang sudah selesai (COMPLETED) tidak dapat diedit'
      });
    }

    // [MODIFIKASI] Validasi: PIC yang ditugaskan pada laporan ini TIDAK BISA mengedit laporan dalam keadaan apapun di semua menu
    const isAssignedPic = await LaporanPic.findOne({
      where: {
        id_laporan: id,
        id_nik_pic: actorId
      },
      transaction
    });

    if (isAssignedPic) {
      await transaction.rollback();
      return res.status(403).json({
        status: 'error',
        message: 'PIC yang ditugaskan tidak dapat mengedit laporan dalam keadaan apapun'
      });
    }

    // Hanya pelapor atau Superadmin/Admin yang berhak mengedit laporan
    if (!isAdmin(req.user) && laporan.id_nik_pelapor !== actorId) {
      await transaction.rollback();
      return res.status(403).json({
        status: 'error',
        message: 'Hanya pelapor yang dapat mengedit laporan ini'
      });
    }

    const oldValues = {
      perihal: laporan.perihal,
      id_kategori: laporan.id_kategori,
      id_prioritas: laporan.id_prioritas,
      deadline: laporan.deadline,
      tgl_kejadian: laporan.tgl_kejadian,
      keterangan: laporan.keterangan
    };

    if (perihal !== undefined && perihal.trim()) laporan.perihal = perihal.trim();
    if (id_kategori !== undefined) laporan.id_kategori = id_kategori;
    if (id_prioritas !== undefined) laporan.id_prioritas = id_prioritas;
    if (deadline !== undefined) laporan.deadline = deadline;
    if (tgl_kejadian !== undefined) laporan.tgl_kejadian = tgl_kejadian;
    if (keterangan !== undefined) laporan.keterangan = keterangan;

    await laporan.save({ transaction });

    // Jika id_nik_pics disertakan, perbarui penugasan PIC
    if (Array.isArray(id_nik_pics) && id_nik_pics.length > 0) {
      const uniquePicIds = [...new Set(id_nik_pics)].filter(nik => nik !== laporan.id_nik_pelapor);
      if (uniquePicIds.length > 0) {
        await LaporanPic.destroy({ where: { id_laporan: id }, transaction });
        const newAssignments = uniquePicIds.map(id_nik_pic => ({
          id_laporan: id,
          id_nik_pic,
          assigned_by: actorId
        }));
        await LaporanPic.bulkCreate(newAssignments, { transaction });
      }
    }

    await createHistory({
      id_laporan: id,
      actor_id: actorId,
      activity_type: 'REPORT_UPDATED',
      description: 'Pelapor memperbarui informasi laporan: ' + laporan.perihal,
      old_value: oldValues,
      new_value: {
        perihal: laporan.perihal,
        id_kategori: laporan.id_kategori,
        id_prioritas: laporan.id_prioritas,
        deadline: laporan.deadline,
        tgl_kejadian: laporan.tgl_kejadian,
        keterangan: laporan.keterangan
      },
      transaction
    });

    await transaction.commit();

    // [MODIFIKASI] Notifikasi ke seluruh PIC yang ditugaskan dan Pelapor bahwa laporan telah diperbarui
    try {
      const pics = await LaporanPic.findAll({ where: { id_laporan: id } });
      const picNiks = pics.map(p => p.id_nik_pic || p.id_nik).filter(nik => nik && nik !== id_nik);
      const actorName = req.user?.nama_karyawan || id_nik;
      const isActorPelapor = id_nik === laporan.id_nik_pelapor;
      const actorRole = isActorPelapor ? 'Pelapor' : (isAdmin(req.user) ? 'Admin' : 'Pengguna');

      if (picNiks.length > 0) {
        await sendNotification({
          id_nik_list: picNiks,
          id_laporan: id,
          title: `Laporan Diperbarui: ${laporan.nomor_laporan}`,
          body: `${actorRole} (${actorName}) telah memperbarui informasi laporan "${laporan.perihal}". Silakan periksa perubahan.`,
          type: 'LAPORAN_UPDATED'
        });
      }

      // Jika yang mengedit adalah Admin, beri tahu Pelapor bahwa laporannya diperbarui oleh Admin
      if (!isActorPelapor && laporan.id_nik_pelapor && laporan.id_nik_pelapor !== id_nik) {
        await sendNotification({
          id_nik_list: [laporan.id_nik_pelapor],
          id_laporan: id,
          title: `Laporan Diperbarui: ${laporan.nomor_laporan}`,
          body: `Admin (${actorName}) telah memperbarui informasi laporan Anda "${laporan.perihal}".`,
          type: 'LAPORAN_UPDATED'
        });
      }
    } catch (notifErr) {
      console.error('Gagal kirim notifikasi update laporan ke PIC & Pelapor:', notifErr);
    }

    const updatedItem = await Laporan.findByPk(id, {
      include: getLaporanIncludes(),
      order: [
        [{ model: Evidence, as: 'evidence' }, 'created_at', 'ASC'],
        [{ model: LaporanHistory, as: 'history' }, 'created_at', 'DESC']
      ]
    });

    return res.status(200).json({
      status: 'success',
      message: 'Laporan berhasil diperbarui',
      data: updatedItem
    });

  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error('Error updateLaporan:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Gagal memperbarui laporan'
    });
  }
};

// =====================================================
// DELETE LAPORAN (Khusus Admin atau Pelapor)
// =====================================================
exports.deleteLaporan = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { id_nik } = req.user;

    const laporan = await Laporan.findByPk(id, { transaction });
    if (!laporan) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Laporan tidak ditemukan'
      });
    }

    // [MODIFIKASI] Validasi hak akses: Admin dapat menghapus semua laporan, User HANYA jika sebagai pelapor
    const userIsAdmin = isAdmin(req.user);
    const userIsPelapor = laporan.id_nik_pelapor === id_nik;

    if (!userIsAdmin && !userIsPelapor) {
      await transaction.rollback();
      return res.status(403).json({
        status: 'error',
        message: 'Akses ditolak. Hanya Admin atau Pelapor yang dapat menghapus laporan ini.'
      });
    }

    // Catat histori penghapusan laporan
    await createHistory({
      id_laporan: id,
      actor_id: id_nik,
      activity_type: 'DELETE_REPORT',
      description: `Laporan ${laporan.nomor_laporan || id} dihapus oleh ${userIsAdmin ? 'Admin' : 'Pelapor'}`,
      old_value: {
        nomor_laporan: laporan.nomor_laporan,
        status: laporan.status,
        perihal: laporan.perihal
      },
      transaction
    });

    // [MODIFIKASI] Ambil daftar PIC yang ditugaskan sebelum laporan dihapus
    const assignedPics = await LaporanPic.findAll({
      where: { id_laporan: id },
      transaction
    });
    const picNiks = assignedPics
      .map(p => p.id_nik_pic || p.id_nik)
      .filter(nik => nik && nik !== id_nik);
    const pelaporNik = (laporan.id_nik_pelapor && laporan.id_nik_pelapor !== id_nik) ? laporan.id_nik_pelapor : null;

    // Soft-delete laporan (Sequelize paranoid: true akan mengisi deleted_at)
    await laporan.destroy({ transaction });

    await transaction.commit();

    // [MODIFIKASI] Kirim notifikasi penghapusan laporan ke seluruh PIC terkait dan Pelapor
    try {
      const actorName = req.user?.nama_karyawan || id_nik;
      if (picNiks.length > 0) {
        await sendNotification({
          id_nik_list: picNiks,
          id_laporan: id,
          title: `Laporan Dihapus: ${laporan.nomor_laporan || 'Laporan'}`,
          body: `Laporan "${laporan.perihal || laporan.nomor_laporan}" yang ditugaskan kepada Anda telah dihapus oleh ${userIsAdmin ? 'Admin' : actorName}.`,
          type: 'REPORT_DELETED'
        });
      }
      if (pelaporNik) {
        await sendNotification({
          id_nik_list: [pelaporNik],
          id_laporan: id,
          title: `Laporan Dihapus: ${laporan.nomor_laporan || 'Laporan'}`,
          body: `Laporan Anda "${laporan.perihal || laporan.nomor_laporan}" telah dihapus oleh Admin (${actorName}).`,
          type: 'REPORT_DELETED'
        });
      }
    } catch (notifErr) {
      console.error('Error kirim notifikasi deleteLaporan:', notifErr);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Laporan berhasil dihapus'
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error('Error deleteLaporan:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Gagal menghapus laporan'
    });
  }
};

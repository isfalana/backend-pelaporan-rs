const {
  DetailTindakan,
  Laporan,
  LaporanPic,
  LaporanHistory,
  TemplateTindakan,
  TemplateTindakanDetail,
  Users,
  sequelize
} = require('../models');

// [MODIFIKASI] Import sendNotification
const { sendNotification } = require('../services/notificationService');

const crypto = require('crypto');

// ==========================================
// HELPER: CEK AKSES PIC
// ==========================================

const isAssignedPic = async (id_laporan, id_nik) => {
  const assignment = await LaporanPic.findOne({
    where: { id_laporan, id_nik_pic: id_nik }
  });

  return !!assignment;
};

const checkPicAccess = async (id_laporan, id_nik) => {
  const laporan = await Laporan.findByPk(id_laporan);

  if (!laporan) {
    return { allowed: false, laporan: null };
  }

  const assigned = await isAssignedPic(id_laporan, id_nik);

  return {
    allowed: assigned,
    laporan
  };
};

// ==========================================
// HELPER: SIMPAN HISTORY
// ==========================================

const createHistory = async ({
  id_laporan,
  id_detail_tindakan = null,
  actor_id,
  activity_type,
  description,
  old_value = null,
  new_value = null,
  transaction
}) => {
  return LaporanHistory.create({
    id_history: crypto.randomUUID(),
    id_laporan,
    id_detail_tindakan,
    actor_id,
    actor_type: 'USER',
    activity_type,
    description,
    old_value,
    new_value
  }, { transaction });
};

// ==========================================
// HELPER: UPDATE STATUS LAPORAN
// ==========================================

const updateLaporanProgress = async (id_laporan, transaction) => {
  const laporan = await Laporan.findByPk(id_laporan, { transaction });

  if (!laporan) return;

  const total = await DetailTindakan.count({
    where: { id_laporan },
    transaction
  });

  const completed = await DetailTindakan.count({
    where: {
      id_laporan,
      is_completed: true
    },
    transaction
  });

  let newStatus = laporan.status;

  if (total > 0 && total === completed) {
    newStatus = 'PENDING_APPROVAL';
  } else if (laporan.status === 'PENDING_APPROVAL') {
    newStatus = 'IN_PROGRESS';
  } else if (total > 0 && (laporan.status === 'OPEN' || laporan.status === 'RETURNED')) {
    newStatus = 'IN_PROGRESS';
  }

  if (newStatus !== laporan.status) {
    const oldStatus = laporan.status;

    laporan.status = newStatus;
    await laporan.save({ transaction });

    await createHistory({
      id_laporan,
      actor_id: null,
      activity_type: 'STATUS_CHANGED',
      description: 'Status laporan berubah otomatis berdasarkan checklist tindakan',
      old_value: { status: oldStatus },
      new_value: { status: newStatus },
      transaction
    });

    // [MODIFIKASI] Jika semua checklist selesai dan status menjadi PENDING_APPROVAL,
    // kirim notifikasi ke pelapor untuk melakukan peninjauan/approval
    if (newStatus === 'PENDING_APPROVAL') {
      transaction.afterCommit(async () => {
        try {
          await sendNotification({
            id_nik_list: [laporan.id_nik_pelapor],
            id_laporan: laporan.id_laporan,
            title: `Laporan Menunggu Approval: ${laporan.nomor_laporan}`,
            body: `Seluruh tindakan pada laporan "${laporan.perihal || laporan.nomor_laporan}" telah selesai dikerjakan. Silakan tinjau dan lakukan approval.`,
            type: 'PENDING_APPROVAL'
          });
        } catch (notifErr) {
          console.error('Gagal kirim notifikasi PENDING_APPROVAL ke pelapor:', notifErr);
        }
      });
    }
  }
};

// ==========================================
// 1. TAMBAH TINDAKAN MANUAL
// ==========================================

exports.createTindakan = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id_laporan, nama_tindakan, catatan, urutan } = req.body;
    const actorId = req.user?.id_nik;

    if (!id_laporan || !nama_tindakan || !actorId) {
      await transaction.rollback();

      return res.status(400).json({
        status: 'error',
        message: 'id_laporan dan nama_tindakan wajib diisi'
      });
    }

    const access = await checkPicAccess(id_laporan, actorId);

    if (!access.laporan) {
      await transaction.rollback();

      return res.status(404).json({
        status: 'error',
        message: 'Laporan tidak ditemukan'
      });
    }

    if (!access.allowed) {
      await transaction.rollback();

      return res.status(403).json({
        status: 'error',
        message: 'Hanya PIC yang ditugaskan dapat menambahkan tindakan'
      });
    }

    const tindakan = await DetailTindakan.create({
      id_detail_tindakan: crypto.randomUUID(),
      id_laporan,
      nama_tindakan: nama_tindakan.trim(),
      sumber: 'MANUAL',
      urutan: urutan || 1,
      is_completed: false,
      catatan: catatan || null,
      created_by: actorId,
      updated_by: actorId
    }, { transaction });

    await createHistory({
      id_laporan,
      id_detail_tindakan: tindakan.id_detail_tindakan,
      actor_id: actorId,
      activity_type: 'ACTION_CREATED',
      description: 'PIC menambahkan tindakan manual',
      new_value: {
        nama_tindakan: tindakan.nama_tindakan,
        sumber: tindakan.sumber
      },
      transaction
    });

    await updateLaporanProgress(id_laporan, transaction);

    await transaction.commit();

    return res.status(201).json({
      status: 'success',
      message: 'Tindakan berhasil ditambahkan',
      data: tindakan
    });

  } catch (error) {
    if (!transaction.finished) await transaction.rollback();

    console.error('Error createTindakan:', error);

    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// ==========================================
// 2. TERAPKAN TEMPLATE TINDAKAN
// ==========================================

exports.applyTemplate = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id_laporan, id_template } = req.body;
    const actorId = req.user?.id_nik;

    if (!id_laporan || !id_template || !actorId) {
      await transaction.rollback();

      return res.status(400).json({
        status: 'error',
        message: 'id_laporan dan id_template wajib diisi'
      });
    }

    const access = await checkPicAccess(id_laporan, actorId);

    if (!access.laporan) {
      await transaction.rollback();

      return res.status(404).json({
        status: 'error',
        message: 'Laporan tidak ditemukan'
      });
    }

    if (!access.allowed) {
      await transaction.rollback();

      return res.status(403).json({
        status: 'error',
        message: 'Hanya PIC yang ditugaskan dapat menerapkan template'
      });
    }

    const template = await TemplateTindakan.findOne({
      where: {
        id_template,
        is_active: true
      },
      include: [{
        model: TemplateTindakanDetail,
        as: 'details',
        order: [['urutan', 'ASC']]
      }],
      transaction
    });

    if (!template) {
      await transaction.rollback();

      return res.status(404).json({
        status: 'error',
        message: 'Template tindakan tidak ditemukan atau tidak aktif'
      });
    }

    if (!template.details || template.details.length === 0) {
      await transaction.rollback();

      return res.status(400).json({
        status: 'error',
        message: 'Template belum memiliki detail tindakan'
      });
    }

    const tindakanData = template.details.map((detail) => ({
      id_detail_tindakan: crypto.randomUUID(),
      id_laporan,
      id_template_detail: detail.id_template_detail,
      nama_tindakan: detail.nama_tindakan,
      sumber: 'TEMPLATE',
      urutan: detail.urutan,
      is_completed: false,
      created_by: actorId,
      updated_by: actorId
    }));

    const tindakan = await DetailTindakan.bulkCreate(tindakanData, {
      transaction
    });

    await createHistory({
      id_laporan,
      actor_id: actorId,
      activity_type: 'TEMPLATE_APPLIED',
      description: `Template tindakan "${template.nama_template}" diterapkan`,
      new_value: {
        id_template: template.id_template,
        nama_template: template.nama_template,
        jumlah_tindakan: tindakan.length
      },
      transaction
    });

    await updateLaporanProgress(id_laporan, transaction);

    await transaction.commit();

    return res.status(201).json({
      status: 'success',
      message: 'Template tindakan berhasil diterapkan',
      data: tindakan
    });

  } catch (error) {
    if (!transaction.finished) await transaction.rollback();

    console.error('Error applyTemplate:', error);

    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// ==========================================
// 3. LIHAT TINDAKAN BERDASARKAN LAPORAN
// ==========================================

exports.getTindakanByLaporan = async (req, res) => {
  try {
    const { id_laporan } = req.params;
    const actorId = req.user?.id_nik;

    const laporan = await Laporan.findByPk(id_laporan);

    if (!laporan) {
      return res.status(404).json({
        status: 'error',
        message: 'Laporan tidak ditemukan'
      });
    }

    const assigned = await isAssignedPic(id_laporan, actorId);
    const isReporter = laporan.id_nik_pelapor === actorId;
    const isAdmin =
      req.user?.id_role === 'R-01' ||
      req.user?.role?.nama_role === 'Admin';

    if (!assigned && !isReporter && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Anda tidak memiliki akses melihat tindakan laporan ini'
      });
    }

    const items = await DetailTindakan.findAll({
      where: { id_laporan },
      include: [
        {
          model: Users,
          as: 'creator',
          attributes: ['id_nik', 'nama_karyawan']
        },
        {
          model: Users,
          as: 'updater',
          attributes: ['id_nik', 'nama_karyawan']
        },
        {
          model: Users,
          as: 'completer',
          attributes: ['id_nik', 'nama_karyawan']
        }
      ],
      order: [
        ['urutan', 'ASC'],
        ['created_at', 'ASC']
      ]
    });

    return res.status(200).json({
      status: 'success',
      data: items
    });

  } catch (error) {
    console.error('Error getTindakanByLaporan:', error);

    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// ==========================================
// 4. EDIT TINDAKAN
// ==========================================

exports.updateTindakan = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id_detail } = req.params;
    const { nama_tindakan, catatan, urutan } = req.body;
    const actorId = req.user?.id_nik;

    const tindakan = await DetailTindakan.findByPk(id_detail, {
      transaction
    });

    if (!tindakan) {
      await transaction.rollback();

      return res.status(404).json({
        status: 'error',
        message: 'Tindakan tidak ditemukan'
      });
    }

    const access = await checkPicAccess(tindakan.id_laporan, actorId);

    if (!access.allowed) {
      await transaction.rollback();

      return res.status(403).json({
        status: 'error',
        message: 'Hanya PIC yang ditugaskan dapat mengubah tindakan'
      });
    }

    const oldValue = {
      nama_tindakan: tindakan.nama_tindakan,
      catatan: tindakan.catatan,
      urutan: tindakan.urutan
    };

    if (nama_tindakan !== undefined) {
      tindakan.nama_tindakan = nama_tindakan.trim();
    }

    if (catatan !== undefined) {
      tindakan.catatan = catatan;
    }

    if (urutan !== undefined) {
      tindakan.urutan = urutan;
    }

    tindakan.updated_by = actorId;

    await tindakan.save({ transaction });

    await createHistory({
      id_laporan: tindakan.id_laporan,
      id_detail_tindakan: tindakan.id_detail_tindakan,
      actor_id: actorId,
      activity_type: 'ACTION_UPDATED',
      description: 'PIC mengubah detail tindakan',
      old_value: oldValue,
      new_value: {
        nama_tindakan: tindakan.nama_tindakan,
        catatan: tindakan.catatan,
        urutan: tindakan.urutan
      },
      transaction
    });

    await transaction.commit();

    return res.status(200).json({
      status: 'success',
      message: 'Tindakan berhasil diperbarui',
      data: tindakan
    });

  } catch (error) {
    if (!transaction.finished) await transaction.rollback();

    console.error('Error updateTindakan:', error);

    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// ==========================================
// 5. CHECK / UNCHECK TINDAKAN
// ==========================================

exports.toggleTindakan = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id_detail } = req.params;
    const { is_completed } = req.body;
    const actorId = req.user?.id_nik;

    if (typeof is_completed !== 'boolean') {
      await transaction.rollback();

      return res.status(400).json({
        status: 'error',
        message: 'is_completed harus bernilai true atau false'
      });
    }

    const tindakan = await DetailTindakan.findByPk(id_detail, {
      transaction
    });

    if (!tindakan) {
      await transaction.rollback();

      return res.status(404).json({
        status: 'error',
        message: 'Tindakan tidak ditemukan'
      });
    }

    const access = await checkPicAccess(tindakan.id_laporan, actorId);

    if (!access.allowed) {
      await transaction.rollback();

      return res.status(403).json({
        status: 'error',
        message: 'Hanya PIC yang ditugaskan dapat memperbarui checklist'
      });
    }

    const oldValue = {
      is_completed: tindakan.is_completed
    };

    tindakan.is_completed = is_completed;
    tindakan.updated_by = actorId;

    if (is_completed) {
      tindakan.completed_by = actorId;
      tindakan.completed_at = new Date();
    } else {
      tindakan.completed_by = null;
      tindakan.completed_at = null;
    }

    await tindakan.save({ transaction });

    await createHistory({
      id_laporan: tindakan.id_laporan,
      id_detail_tindakan: tindakan.id_detail_tindakan,
      actor_id: actorId,
      activity_type: 'ACTION_CHECKED',
      description: is_completed
        ? 'Tindakan ditandai selesai'
        : 'Status tindakan dikembalikan menjadi belum selesai',
      old_value: oldValue,
      new_value: {
        is_completed
      },
      transaction
    });

    await updateLaporanProgress(tindakan.id_laporan, transaction);

    await transaction.commit();

    return res.status(200).json({
      status: 'success',
      message: is_completed
        ? 'Tindakan berhasil diselesaikan'
        : 'Status tindakan berhasil dikembalikan',
      data: tindakan
    });

  } catch (error) {
    if (!transaction.finished) await transaction.rollback();

    console.error('Error toggleTindakan:', error);

    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// ==========================================
// 6. HAPUS TINDAKAN
// ==========================================

exports.deleteTindakan = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id_detail } = req.params;
    const actorId = req.user?.id_nik;

    const tindakan = await DetailTindakan.findByPk(id_detail, {
      transaction
    });

    if (!tindakan) {
      await transaction.rollback();

      return res.status(404).json({
        status: 'error',
        message: 'Tindakan tidak ditemukan'
      });
    }

    const access = await checkPicAccess(tindakan.id_laporan, actorId);

    if (!access.allowed) {
      await transaction.rollback();

      return res.status(403).json({
        status: 'error',
        message: 'Hanya PIC yang ditugaskan dapat menghapus tindakan'
      });
    }

    const oldValue = {
      nama_tindakan: tindakan.nama_tindakan,
      sumber: tindakan.sumber
    };

    const id_laporan = tindakan.id_laporan;

    await createHistory({
      id_laporan,
      id_detail_tindakan: tindakan.id_detail_tindakan,
      actor_id: actorId,
      activity_type: 'ACTION_DELETED',
      description: 'PIC menghapus tindakan',
      old_value: oldValue,
      transaction
    });

    await tindakan.destroy({ transaction });

    await updateLaporanProgress(id_laporan, transaction);

    await transaction.commit();

    return res.status(200).json({
      status: 'success',
      message: 'Tindakan berhasil dihapus'
    });

  } catch (error) {
    if (!transaction.finished) await transaction.rollback();

    console.error('Error deleteTindakan:', error);

    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
const fs = require('fs/promises');
const {
  saveEvidenceFile,
  deleteEvidenceFile
} = require('../services/evidenceService');

const {
  Evidence,
  Laporan,
  LaporanPic,
  DetailTindakan,
  LaporanHistory,
  sequelize
} = require('../models');
const { sendNotification } = require('../services/notificationService');

// ==========================================
// HELPER: CEK ADMIN
// ==========================================

const isAdmin = (user) => {
  return (
    user?.id_role === 'R-01' ||
    user?.role?.nama_role === 'Admin'
  );
};

// ==========================================
// HELPER: CEK PIC
// ==========================================

const isAssignedPic = async (id_laporan, id_nik, transaction) => {
  const assignment = await LaporanPic.findOne({
    where: {
      id_laporan,
      id_nik_pic: id_nik
    },
    transaction
  });

  return !!assignment;
};

// ==========================================
// HELPER: CEK AKSES LAPORAN
// ==========================================

const canAccessLaporan = async (id_laporan, user, transaction) => {
  const laporan = await Laporan.findByPk(id_laporan, {
    transaction
  });

  if (!laporan) return false;

  if (isAdmin(user)) return true;

  if (laporan.id_nik_pelapor === user?.id_nik) {
    return true;
  }

  return isAssignedPic(
    id_laporan,
    user?.id_nik,
    transaction
  );
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
  new_value = null,
  old_value = null,
  transaction
}) => {
  return LaporanHistory.create({
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
// 1. UPLOAD EVIDENCE
// ==========================================

exports.uploadEvidence = async (req, res) => {
  const transaction = await sequelize.transaction();

  let uploadedFilePath = null;

  try {
    const { id_laporan, id_detail_tindakan } = req.body;
    const actorId = req.user?.id_nik;
    const file = req.file;

    if (!file) {
      await transaction.rollback();

      return res.status(400).json({
        status: 'error',
        message: 'Bukti wajib diunggah'
      });
    }

    uploadedFilePath = file.path;

    if (!actorId) {
      await transaction.rollback();

      return res.status(401).json({
        status: 'error',
        message: 'Identitas pengguna tidak ditemukan'
      });
    }

    // Evidence harus memiliki tepat satu target.
    const hasReport = !!id_laporan;
    const hasAction = !!id_detail_tindakan;

    if (hasReport === hasAction) {
      await transaction.rollback();

      return res.status(400).json({
        status: 'error',
        message: 'Pilih salah satu target: laporan atau detail tindakan'
      });
    }

    let reportId = id_laporan || null;

    // Jika target adalah detail tindakan,
    // ambil id_laporan dari tindakan tersebut.
    if (hasAction) {
      const tindakan = await DetailTindakan.findByPk(
        id_detail_tindakan,
        { transaction }
      );

      if (!tindakan) {
        await transaction.rollback();

        return res.status(404).json({
          status: 'error',
          message: 'Detail tindakan tidak ditemukan'
        });
      }

      reportId = tindakan.id_laporan;

      const assigned = await isAssignedPic(
        reportId,
        actorId,
        transaction
      );

      if (!assigned && !isAdmin(req.user)) {
        await transaction.rollback();

        return res.status(403).json({
          status: 'error',
          message: 'Hanya PIC yang ditugaskan dapat mengunggah bukti tindakan'
        });
      }
    } else {
      const allowed = await canAccessLaporan(
        reportId,
        req.user,
        transaction
      );

      if (!allowed) {
        await transaction.rollback();

        return res.status(403).json({
          status: 'error',
          message: 'Anda tidak memiliki akses ke laporan ini'
        });
      }
    }

    // Simpan informasi file melalui evidence service.
    const fileInfo = await saveEvidenceFile(file);

    const evidence = await Evidence.create({
      id_evidence: require('crypto').randomUUID(),
      id_laporan: hasReport ? reportId : null,
      id_detail_tindakan: hasAction ? id_detail_tindakan : null,
      uploaded_by: actorId,
      original_name: file.originalname,
      stored_name: fileInfo.stored_name,
      file_path: fileInfo.file_path,
      mime_type: file.detectedMimeType,
      file_size: file.size
    }, { transaction });

    await createHistory({
      id_laporan: reportId,
      id_detail_tindakan: hasAction ? id_detail_tindakan : null,
      actor_id: actorId,
      activity_type: 'EVIDENCE_UPLOADED',
      description: 'Pengguna telah mengunggah bukti',
      new_value: {
        id_evidence: evidence.id_evidence,
        original_name: evidence.original_name,
        mime_type: evidence.mime_type,
        file_size: evidence.file_size
      },
      transaction
    });

    await transaction.commit();

    // [MODIFIKASI] Dinonaktifkan: Notifikasi berkas/dokumen bukti diunggah tidak perlu dikirim
    /*
    try {
      const laporan = await Laporan.findByPk(reportId);
      if (laporan) {
        const actorName = req.user?.nama_karyawan || actorId;
        const pics = await LaporanPic.findAll({ where: { id_laporan: reportId } });
        const picNiks = pics.map(p => p.id_nik_pic || p.id_nik).filter(nik => nik && nik !== actorId);

        // Jika diunggah oleh Pelapor -> beri tahu seluruh PIC
        if (actorId === laporan.id_nik_pelapor && picNiks.length > 0) {
          await sendNotification({
            id_nik_list: picNiks,
            id_laporan: reportId,
            title: `Dokumen Bukti Baru: ${laporan.nomor_laporan}`,
            body: `Pelapor (${actorName}) mengunggah bukti "${evidence.original_name}" untuk laporan "${laporan.perihal || laporan.nomor_laporan}".`,
            type: 'EVIDENCE_UPLOADED'
          });
        }
        // Jika diunggah oleh PIC -> beri tahu Pelapor
        else if (laporan.id_nik_pelapor && actorId !== laporan.id_nik_pelapor) {
          await sendNotification({
            id_nik_list: [laporan.id_nik_pelapor],
            id_laporan: reportId,
            title: `Dokumen Tindak Lanjut: ${laporan.nomor_laporan}`,
            body: `PIC (${actorName}) mengunggah bukti "${evidence.original_name}" untuk laporan "${laporan.perihal || laporan.nomor_laporan}".`,
            type: 'EVIDENCE_UPLOADED'
          });
        }
      }
    } catch (notifErr) {
      console.error('Error kirim notifikasi upload evidence:', notifErr);
    }
    */

    return res.status(201).json({
      status: 'success',
      message: 'Bukti berhasil diunggah',
      data: evidence
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    // Jika penyimpanan database gagal,
    // hapus file yang sudah terlanjur diunggah.
    if (uploadedFilePath) {
      try {
        await fs.unlink(uploadedFilePath);
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') {
          console.error('Gagal membersihkan file:', cleanupError);
        }
      }
    }

    console.error('Error uploadEvidence:', error);

    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// ==========================================
// 2. AMBIL EVIDENCE BERDASARKAN LAPORAN
// ==========================================

exports.getEvidenceByLaporan = async (req, res) => {
  try {
    const { id_laporan } = req.params;

    const allowed = await canAccessLaporan(
      id_laporan,
      req.user
    );

    if (!allowed) {
      return res.status(403).json({
        status: 'error',
        message: 'Anda tidak memiliki akses ke laporan ini'
      });
    }

    const evidence = await Evidence.findAll({
      where: { id_laporan },
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      status: 'success',
      data: evidence
    });

  } catch (error) {
    console.error('Error getEvidenceByLaporan:', error);

    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// ==========================================
// [MODIFIKASI] AMBIL FILE FISIK EVIDENCE
// Mengirim file fisik berdasarkan id_evidence
// ==========================================

exports.getEvidenceFile = async (req, res) => {
  try {
    const { id_evidence } = req.params;
    const evidence = await Evidence.findByPk(id_evidence);
    if (!evidence) {
      return res.status(404).json({
        status: 'error',
        message: 'Dokumen atau File tidak ditemukan'
      });
    }

    const { resolveStoragePath } = require('../utils/storage.util');
    const absolutePath = resolveStoragePath(evidence.file_path);
    return res.sendFile(absolutePath);
  } catch (error) {
    console.error('Error getEvidenceFile:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// [MODIFIKASI] Ambil file fisik evidence langsung berdasarkan ID Laporan (fallback cerdas bila ID evidence belum terpetakan di client)
exports.getEvidenceFileByLaporan = async (req, res) => {
  try {
    const { id_laporan } = req.params;
    const isTindakan = req.query.tindakan === 'true' || req.query.type === 'tindakan';

    let whereClause = { id_laporan };
    if (isTindakan) {
      whereClause.id_detail_tindakan = { [require('sequelize').Op.ne]: null };
    }

    let evidence = await Evidence.findOne({
      where: whereClause,
      order: [['created_at', isTindakan ? 'DESC' : 'ASC']]
    });

    if (!evidence && isTindakan) {
      evidence = await Evidence.findOne({
        where: { id_laporan },
        order: [['created_at', 'DESC']]
      });
    }

    if (!evidence) {
      return res.status(404).json({
        status: 'error',
        message: 'Berkas atau File Bukti untuk laporan ini tidak ditemukan'
      });
    }

    const { resolveStoragePath } = require('../utils/storage.util');
    const absolutePath = resolveStoragePath(evidence.file_path);
    return res.sendFile(absolutePath);
  } catch (error) {
    console.error('Error getEvidenceFileByLaporan:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// ==========================================
// 3. AMBIL EVIDENCE BERDASARKAN TINDAKAN
// ==========================================

exports.getEvidenceByTindakan = async (req, res) => {
  try {
    const { id_detail_tindakan } = req.params;

    const tindakan = await DetailTindakan.findByPk(
      id_detail_tindakan
    );

    if (!tindakan) {
      return res.status(404).json({
        status: 'error',
        message: 'Detail tindakan tidak ditemukan'
      });
    }

    const allowed = await canAccessLaporan(
      tindakan.id_laporan,
      req.user
    );

    if (!allowed) {
      return res.status(403).json({
        status: 'error',
        message: 'Anda tidak memiliki akses ke tindakan ini'
      });
    }

    const evidence = await Evidence.findAll({
      where: { id_detail_tindakan },
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      status: 'success',
      data: evidence
    });

  } catch (error) {
    console.error('Error getEvidenceByTindakan:', error);

    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// ==========================================
// 4. HAPUS EVIDENCE
// ==========================================

exports.deleteEvidence = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id_evidence } = req.params;
    const actorId = req.user?.id_nik;

    const evidence = await Evidence.findByPk(
      id_evidence,
      { transaction }
    );

    if (!evidence) {
      await transaction.rollback();

      return res.status(404).json({
        status: 'error',
        message: 'Bukti tidak ditemukan'
      });
    }

    const reportId = evidence.id_laporan ||
      (await DetailTindakan.findByPk(
        evidence.id_detail_tindakan,
        { transaction }
      ))?.id_laporan;

    if (!reportId) {
      await transaction.rollback();

      return res.status(404).json({
        status: 'error',
        message: 'Berkas atau File bukti laporan terkait tidak ditemukan'
      });
    }

    const allowed = await canAccessLaporan(
      reportId,
      req.user,
      transaction
    );

    const isUploader = evidence.uploaded_by === actorId;

    if (!isAdmin(req.user) && !(allowed && isUploader)) {
      await transaction.rollback();

      return res.status(403).json({
        status: 'error',
        message: 'Anda tidak memiliki izin menghapus bukti ini'
      });
    }

    const oldValue = {
      id_evidence: evidence.id_evidence,
      original_name: evidence.original_name,
      file_path: evidence.file_path
    };

    await createHistory({
      id_laporan: reportId,
      id_detail_tindakan: evidence.id_detail_tindakan,
      actor_id: actorId,
      activity_type: 'EVIDENCE_DELETED',
      description: 'Pengguna menghapus dokumen bukti',
      old_value: oldValue,
      transaction
    });

    const relativePath = evidence.file_path;

    await evidence.destroy({ transaction });

    await transaction.commit();

    // [MODIFIKASI] Dinonaktifkan: Notifikasi berkas/dokumen bukti dihapus tidak perlu dikirim
    /*
    try {
      const laporan = await Laporan.findByPk(reportId);
      if (laporan) {
        const actorName = req.user?.nama_karyawan || actorId;
        const pics = await LaporanPic.findAll({ where: { id_laporan: reportId } });
        const picNiks = pics.map(p => p.id_nik_pic || p.id_nik).filter(nik => nik && nik !== actorId);

        // Jika pelapor yang menghapus -> beri tahu PIC
        if (actorId === laporan.id_nik_pelapor && picNiks.length > 0) {
          await sendNotification({
            id_nik_list: picNiks,
            id_laporan: reportId,
            title: `Dokumen Bukti Dihapus: ${laporan.nomor_laporan}`,
            body: `Dokumen bukti "${evidence.original_name}" pada laporan "${laporan.perihal || laporan.nomor_laporan}" telah dihapus oleh ${actorName}.`,
            type: 'EVIDENCE_DELETED'
          });
        }
        // Jika PIC yang menghapus -> beri tahu Pelapor
        else if (laporan.id_nik_pelapor && actorId !== laporan.id_nik_pelapor) {
          await sendNotification({
            id_nik_list: [laporan.id_nik_pelapor],
            id_laporan: reportId,
            title: `Dokumen Tindak Lanjut Dihapus: ${laporan.nomor_laporan}`,
            body: `Dokumen bukti "${evidence.original_name}" pada laporan "${laporan.perihal || laporan.nomor_laporan}" telah dihapus oleh ${actorName}.`,
            type: 'EVIDENCE_DELETED'
          });
        }
      }
    } catch (notifErr) {
      console.error('Error kirim notifikasi delete evidence:', notifErr);
    }
    */

    // File fisik dihapus setelah transaksi database berhasil.
    try {
        await deleteEvidenceFile(relativePath);
    } catch (fileError) {
        console.error(
            'Bukti database terhapus, tetapi file fisik gagal dihapus:',
            fileError
        );
    }

    return res.status(200).json({
      status: 'success',
      message: 'Bukti berhasil dihapus'
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error('Error deleteEvidence:', error);

    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
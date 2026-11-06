const { Laporan, Unit, Users, Kategori, TindakLanjut, DetailTindakan } = require('../models');
const admin = require('../utils/firebase'); // BARU: Import Firebase Admin SDK

exports.getAllLaporan = async (req, res) => {
  try {
    const { status, prioritas, unit } = req.query;
    const where = {};

    if (status) where.status = status;
    if (prioritas) where.prioritas = prioritas;
    if (unit) {
      where.id_unit_pic = unit;
    }

    const laporan = await Laporan.findAll({
      where,
      include: [
        { model: Unit, as: 'unit_pelapor', attributes: ['id_unit', 'nama_unit'] },
        { model: Users, as: 'user_pelapor', attributes: ['id_nik', 'nama_karyawan'] },
        { model: Unit, as: 'unit_pic', attributes: ['id_unit', 'nama_unit'] },
        { model: Users, as: 'user_pic', attributes: ['id_nik', 'nama_karyawan'] },
        { model: Kategori, as: 'kategori', attributes: ['id_kategori', 'jenis_kategori'] },
        { model: TindakLanjut, as: 'tindak_lanjut', attributes: ['id_tindak_lanjut', 'nama_tindak_lanjut'] },
        { 
          model: DetailTindakan, 
          as: 'riwayat_tindakan',
          include: [{ model: Users, as: 'pic', attributes: ['id_nik', 'nama_karyawan'] }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({ status: 'success', data: laporan });
  } catch (error) {
    console.error('Error getAllLaporan:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getLaporanById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Laporan.findByPk(id, {
      include: [
        { model: Unit, as: 'unit_pelapor', attributes: ['id_unit', 'nama_unit'] },
        { model: Users, as: 'user_pelapor', attributes: ['id_nik', 'nama_karyawan'] },
        { model: Unit, as: 'unit_pic', attributes: ['id_unit', 'nama_unit'] },
        { model: Users, as: 'user_pic', attributes: ['id_nik', 'nama_karyawan'] },
        { model: Kategori, as: 'kategori', attributes: ['id_kategori', 'jenis_kategori'] },
        { model: TindakLanjut, as: 'tindak_lanjut', attributes: ['id_tindak_lanjut', 'nama_tindak_lanjut'] },
        { 
          model: DetailTindakan, 
          as: 'riwayat_tindakan',
          include: [{ model: Users, as: 'pic', attributes: ['id_nik', 'nama_karyawan'] }]
        }
      ]
    });

    if (!item) {
      return res.status(404).json({ status: 'error', message: 'Laporan tidak ditemukan' });
    }

    return res.status(200).json({ status: 'success', data: item });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.createLaporan = async (req, res) => {
  try {
    const {
      id_unit_pelapor,
      id_nik_pelapor,
      id_unit_pic,
      id_nik_pic,
      id_kategori,
      id_tindak_lanjut,
      perihal,
      prioritas,
      keterangan
    } = req.body;

    const id_laporan = `LAP-${Date.now().toString().slice(-6)}`;

    // 1. Simpan Laporan ke PostgreSQL
    const newLaporan = await Laporan.create({
      id_laporan,
      tgl_kejadian: new Date(),
      id_unit_pelapor,
      id_nik_pelapor: id_nik_pelapor || req.user?.id_nik,
      id_unit_pic,
      id_nik_pic: id_nik_pic || null,
      id_kategori,
      id_tindak_lanjut: id_tindak_lanjut || null,
      perihal,
      prioritas: prioritas || 'Sedang',
      keterangan: keterangan || '',
      status: 'Pending'
    });

    // 2. Ambil data lengkap (termasuk JOIN nama unit) untuk JSON & Notifikasi
    const item = await Laporan.findByPk(newLaporan.id_laporan, {
      include: [
        { model: Unit, as: 'unit_pelapor' },
        { model: Users, as: 'user_pelapor' },
        { model: Unit, as: 'unit_pic' },
        { model: Users, as: 'user_pic' },
        { model: Kategori, as: 'kategori' }
      ]
    });

    // =========================================================================
    // 3. BLOK NOTIFIKASI FCM KE UNIT PIC (Tujuan)
    // =========================================================================
    try {
      // Cari semua akun petugas yang ada di unit tujuan PIC tersebut
      const targetUsers = await Users.findAll({ where: { id_unit: id_unit_pic } });

      // Filter FCM token (Buang token yang kosong atau token bypass web)
      const validTokens = targetUsers
        .map(u => u.fcm_token)
        .filter(token => token && token !== 'dummy_fcm_token_web' && token !== 'dummy_token_fallback');

      if (validTokens.length > 0) {
        const payloadNotifikasi = {
          tokens: validTokens, // Multicast (kirim ke semua HP di unit tersebut sekaligus)
          notification: {
            title: `🚨 Laporan Baru: Prioritas ${item.prioritas}`,
            body: `Dari Unit ${item.unit_pelapor.nama_unit}: ${item.perihal}`
          },
          data: {
            id_laporan: item.id_laporan,
            click_action: "FLUTTER_NOTIFICATION_CLICK"
          }
        };

        const responseFCM = await admin.messaging().sendEachForMulticast(payloadNotifikasi);
        console.log(`[FCM - Create] Berhasil: ${responseFCM.successCount}, Gagal: ${responseFCM.failureCount}`);
      }
    } catch (fcmError) {
      console.error('Gagal memproses Push Notification ke PIC:', fcmError);
      // Try-catch dipisah agar jika Firebase error, input laporan ke Postgres tetap berstatus 201 Success
    }
    // =========================================================================

    return res.status(201).json({
      status: 'success',
      message: 'Laporan berhasil dibuat',
      data: item
    });
  } catch (error) {
    console.error('Error createLaporan:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, keterangan, id_nik_pic } = req.body;

    // Tambahkan include user_pelapor agar kita bisa mengambil fcm_token pelapor
    const laporan = await Laporan.findByPk(id, {
      include: [{ model: Users, as: 'user_pelapor' }]
    });
    
    if (!laporan) {
      return res.status(404).json({ status: 'error', message: 'Laporan tidak ditemukan' });
    }

    if (status) laporan.status = status;
    if (keterangan !== undefined) laporan.keterangan = keterangan;
    if (id_nik_pic) laporan.id_nik_pic = id_nik_pic;
    if (status === 'Done' || status === 'Selesai') {
      laporan.tgl_selesai = new Date();
    }

    await laporan.save();

    // =========================================================================
    // BLOK NOTIFIKASI FCM BALASAN KE PELAPOR (Jika Status Laporan Diubah)
    // =========================================================================
    try {
      const tokenPelapor = laporan.user_pelapor?.fcm_token;
      
      // Pastikan pelapor sedang login dari Android/iOS dan memiliki token valid
      if (tokenPelapor && tokenPelapor !== 'dummy_fcm_token_web' && tokenPelapor !== 'dummy_token_fallback') {
        const payloadUpdate = {
          token: tokenPelapor,
          notification: {
            title: `✅ Update Laporan: ${laporan.id_laporan}`,
            body: `Status laporan Anda saat ini: ${laporan.status}`
          },
          data: {
            id_laporan: laporan.id_laporan,
            click_action: "FLUTTER_NOTIFICATION_CLICK"
          }
        };

        await admin.messaging().send(payloadUpdate);
        console.log(`[FCM - Update] Notifikasi berhasil dikirim ke Pelapor.`);
      }
    } catch (fcmError) {
      console.error('Gagal memproses Push Notification ke Pelapor:', fcmError);
    }
    // =========================================================================

    return res.status(200).json({
      status: 'success',
      message: 'Status laporan berhasil diperbarui',
      data: laporan
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
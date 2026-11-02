const { Laporan, Unit, Users, Kategori, TindakLanjut, DetailTindakan } = require('../models');

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

    const item = await Laporan.findByPk(newLaporan.id_laporan, {
      include: [
        { model: Unit, as: 'unit_pelapor' },
        { model: Users, as: 'user_pelapor' },
        { model: Unit, as: 'unit_pic' },
        { model: Users, as: 'user_pic' },
        { model: Kategori, as: 'kategori' }
      ]
    });

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

    const laporan = await Laporan.findByPk(id);
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

    return res.status(200).json({
      status: 'success',
      message: 'Status laporan berhasil diperbarui',
      data: laporan
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

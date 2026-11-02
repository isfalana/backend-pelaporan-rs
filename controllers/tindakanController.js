const { DetailTindakan, Laporan, Users } = require('../models');

exports.createTindakan = async (req, res) => {
  try {
    const { id_laporan, id_nik_pic, deskripsi_tindakan, file_lampiran, update_status } = req.body;

    if (!id_laporan || !deskripsi_tindakan) {
      return res.status(400).json({
        status: 'error',
        message: 'id_laporan dan deskripsi_tindakan wajib diisi'
      });
    }

    const id_detail = `ACT-${Date.now().toString().slice(-6)}`;
    const picNik = id_nik_pic || req.user?.id_nik;

    const tindakan = await DetailTindakan.create({
      id_detail,
      id_laporan,
      id_nik_pic: picNik,
      deskripsi_tindakan,
      file_lampiran: file_lampiran || null
    });

    if (update_status) {
      const laporan = await Laporan.findByPk(id_laporan);
      if (laporan) {
        laporan.status = update_status;
        if (update_status === 'Done' || update_status === 'Selesai') {
          laporan.tgl_selesai = new Date();
        }
        await laporan.save();
      }
    }

    const result = await DetailTindakan.findByPk(id_detail, {
      include: [{ model: Users, as: 'pic', attributes: ['id_nik', 'nama_karyawan'] }]
    });

    return res.status(201).json({
      status: 'success',
      message: 'Catatan tindakan berhasil disimpan',
      data: result
    });
  } catch (error) {
    console.error('Error createTindakan:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getTindakanByLaporan = async (req, res) => {
  try {
    const { id_laporan } = req.params;
    const items = await DetailTindakan.findAll({
      where: { id_laporan },
      include: [{ model: Users, as: 'pic', attributes: ['id_nik', 'nama_karyawan', 'jabatan'] }],
      order: [['created_at', 'ASC']]
    });

    return res.status(200).json({ status: 'success', data: items });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

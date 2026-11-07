const { Users, Unit, Role } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { id_nik, password } = req.body;

    if (!id_nik || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'id_nik dan password wajib diisi'
      });
    }

    const user = await Users.findOne({
      where: { id_nik },
      include: [
        {
          model: Unit,
          as: 'unitData',
          attributes: ['id_unit', 'nama_unit']
        },
        {
          model: Role,
          as: 'roleData',
          attributes: ['id_role', 'nama_role']
        }
      ]
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Username / NIK tidak ditemukan'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Password salah'
      });
    }

    const token = jwt.sign(
      {
        id_nik: user.id_nik,
        nama_karyawan: user.nama_karyawan,
        id_role: user.id_role,
        role: user.roleData?.nama_role,
        id_unit: user.id_unit,
        unit: user.unitData?.nama_unit
      },
      process.env.JWT_SECRET || 'rahasia_super_aman_rs_permata_2026',
      { expiresIn: '7d' }
    );

    // Update last login
    user.last_login = new Date();
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Login berhasil',
      token,
      data: {
        id_nik: user.id_nik,
        nama_karyawan: user.nama_karyawan,
        // jabatan: user.jabatan,
        id_unit: user.id_unit,
        nama_unit: user.unitData?.nama_unit || '-',
        id_role: user.id_role,
        nama_role: user.roleData?.nama_role || 'User'
      }
    });
  } catch (error) {
    console.error('Error saat login:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan internal server',
      error: error.message
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const id_nik = req.user.id_nik;
    const user = await Users.findOne({
      where: { id_nik },
      include: [
        { model: Unit, as: 'unitData', attributes: ['id_unit', 'nama_unit'] },
        { model: Role, as: 'roleData', attributes: ['id_role', 'nama_role'] }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }

    return res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

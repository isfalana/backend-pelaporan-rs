const { Unit, Kategori, Role, Users, TindakLanjut } = require('../models');

exports.getUnits = async (req, res) => {
  try {
    const units = await Unit.findAll({ order: [['nama_unit', 'ASC']] });
    return res.status(200).json({ status: 'success', data: units });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getKategoris = async (req, res) => {
  try {
    const kategoris = await Kategori.findAll({ order: [['jenis_kategori', 'ASC']] });
    return res.status(200).json({ status: 'success', data: kategoris });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({ order: [['nama_role', 'ASC']] });
    return res.status(200).json({ status: 'success', data: roles });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: { exclude: ['password'] },
      include: [
        { model: Unit, as: 'unitData', attributes: ['nama_unit'] },
        { model: Role, as: 'roleData', attributes: ['nama_role'] }
      ],
      order: [['nama_karyawan', 'ASC']]
    });
    return res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getTindakLanjuts = async (req, res) => {
  try {
    const list = await TindakLanjut.findAll({ order: [['nama_tindak_lanjut', 'ASC']] });
    return res.status(200).json({ status: 'success', data: list });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

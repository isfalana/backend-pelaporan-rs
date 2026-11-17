'use strict';

const {Unit, Kategori, Role, Users, TindakLanjut, Prioritas, TemplateTindakan, TemplateTindakanDetail} = require('../models');

// GET UNITS
exports.getUnits = async (req, res) => {
  try {
    const units = await Unit.findAll({
      order: [['nama_unit', 'ASC']]
    });

    return res.status(200).json({
      status: 'success',
      data: units
    });
  } catch (error) {
    console.error('Error mengambil unit:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data unit'
    });
  }
};

// GET KATEGORI
exports.getKategoris = async (req, res) => {
  try {
    const kategoris = await Kategori.findAll({
      order: [['nama_kategori', 'ASC']]
    });

    return res.status(200).json({
      status: 'success',
      data: kategoris
    });
  } catch (error) {
    console.error('Error mengambil kategori:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data kategori'
    });
  }
};

// GET ROLES
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      order: [['nama_role', 'ASC']]
    });

    return res.status(200).json({
      status: 'success',
      data: roles
    });
  } catch (error) {
    console.error('Error mengambil role:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data role'
    });
  }
};

// GET USERS
exports.getUsers = async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: {
        exclude: ['password']
      },
      include: [
        {
          model: Unit,
          as: 'unit',
          attributes: ['id_unit', 'nama_unit']
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id_role', 'nama_role']
        }
      ],
      order: [['nama_karyawan', 'ASC']]
    });

    return res.status(200).json({
      status: 'success',
      data: users
    });
  } catch (error) {
    console.error('Error mengambil pengguna:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data pengguna'
    });
  }
};

// GET TINDAK LANJUT
exports.getTindakLanjuts = async (req, res) => {
  try {
    const list = await TindakLanjut.findAll({
      order: [['nama_tindak_lanjut', 'ASC']]
    });

    return res.status(200).json({
      status: 'success',
      data: list
    });
  } catch (error) {
    console.error('Error mengambil tindak lanjut:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data tindak lanjut'
    });
  }
};

// GET PRIORITAS
exports.getPrioritas = async (req, res) => {
  try {
    const list = await Prioritas.findAll({
      order: [['urutan', 'ASC']]
    });

    return res.status(200).json({
      status: 'success',
      data: list
    });
  } catch (error) {
    console.error('Error mengambil prioritas:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data prioritas'
    });
  }
};

// GET TEMPLATE TINDAKAN
exports.getTemplates = async (req, res) => {
  try {
    const templates = await TemplateTindakan.findAll({
      include: [
        {
          model: Kategori,
          as: 'kategori',
          attributes: ['id_kategori', 'nama_kategori']
        },
        {
          model: TemplateTindakanDetail,
          as: 'details',
          attributes: [
            'id_template_detail',
            'id_template',
            'urutan',
            'nama_tindakan'
          ]
        }
      ],
      order: [
        ['nama_template', 'ASC'],
        [
          { model: TemplateTindakanDetail, as: 'details' },
          'urutan',
          'ASC'
        ]
      ]
    });

    return res.status(200).json({
      status: 'success',
      data: templates
    });
  } catch (error) {
    console.error('Error mengambil template tindakan:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data template tindakan'
    });
  }
};
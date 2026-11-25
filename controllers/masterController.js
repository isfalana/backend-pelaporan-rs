'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {Unit, Kategori, Role, Users, TindakLanjut, Prioritas, TemplateTindakan, TemplateTindakanDetail, sequelize} = require('../models');

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
          attributes: ['id_unit', 'nama_unit'],
          // [MODIFIKASI] Gunakan paranoid: false agar riwayat nama unit karyawan lama yang sudah di-soft-delete tetap terbaca untuk tampilan tabel
          paranoid: false
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id_role', 'nama_role'],
          // [MODIFIKASI] Gunakan paranoid: false agar riwayat nama role karyawan lama yang sudah di-soft-delete tetap terbaca untuk tampilan tabel
          paranoid: false
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

// ==========================================
// [MODIFIKASI] CRUD UNIT (Menjaga riwayat soft-delete, tidak menimpa data historis)
// ==========================================
exports.createUnit = async (req, res) => {
  try {
    const { id_unit, nama_unit } = req.body;
    if (!id_unit || !nama_unit) {
      return res.status(400).json({ status: 'error', message: 'ID dan nama unit wajib diisi' });
    }
    const trimmedId = id_unit.trim();
    const trimmedNama = nama_unit.trim();
    let finalId = trimmedId;

    // Cek apakah ID sudah ada di database, termasuk yang pernah di-soft delete
    const existing = await Unit.findByPk(trimmedId, { paranoid: false });
    if (existing) {
      if (!existing.deleted_at) {
        return res.status(400).json({ status: 'error', message: 'ID unit sudah terdaftar dan aktif' });
      }
      // [MODIFIKASI] Data dengan ID ini sudah ada di riwayat soft-delete (history data).
      // Sesuai prinsip audit trail, data soft-delete TIDAK BOLEH DITIMPA agar riwayat laporan lama tidak rusak.
      // Sistem secara otomatis mengalokasikan ID baru berikutnya yang belum pernah dipakai sama sekali di database.
      const allUnits = await Unit.findAll({ paranoid: false, attributes: ['id_unit'] });
      const usedNumbers = new Set();
      allUnits.forEach(u => {
        const m = (u.id_unit || '').match(/^UNIT-(\d+)$/i);
        if (m) usedNumbers.add(parseInt(m[1], 10));
      });
      let nextNum = 1;
      while (usedNumbers.has(nextNum)) nextNum++;
      finalId = `UNIT-${String(nextNum).padStart(3, '0')}`;
    }

    const unit = await Unit.create({ id_unit: finalId, nama_unit: trimmedNama });
    return res.status(201).json({
      status: 'success',
      message: finalId !== trimmedId
        ? `Unit berhasil ditambahkan dengan ID ${finalId} (menjaga data riwayat ID lama)`
        : 'Unit berhasil ditambahkan',
      data: unit
    });
  } catch (error) {
    console.error('Error createUnit:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_unit } = req.body;
    const unit = await Unit.findByPk(id);
    if (!unit) return res.status(404).json({ status: 'error', message: 'Unit tidak ditemukan' });
    if (nama_unit) unit.nama_unit = nama_unit.trim();
    await unit.save();
    return res.status(200).json({ status: 'success', message: 'Unit berhasil diperbarui', data: unit });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const unit = await Unit.findByPk(id);
    if (!unit) return res.status(404).json({ status: 'error', message: 'Unit tidak ditemukan' });
    await unit.destroy();
    return res.status(200).json({ status: 'success', message: 'Unit berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// ==========================================
// [MODIFIKASI] CRUD KATEGORI (Menjaga riwayat soft-delete, tidak menimpa data historis)
// ==========================================
exports.createKategori = async (req, res) => {
  try {
    const { id_kategori, nama_kategori, jenis_kategori, deskripsi } = req.body;
    const nama = (nama_kategori || jenis_kategori || '').trim();
    if (!id_kategori || !nama) {
      return res.status(400).json({ status: 'error', message: 'ID dan nama/jenis kategori wajib diisi' });
    }
    const trimmedId = id_kategori.trim();
    let finalId = trimmedId;

    // Cek apakah ID sudah ada di database, termasuk yang pernah di-soft delete
    const existing = await Kategori.findByPk(trimmedId, { paranoid: false });
    if (existing) {
      if (!existing.deleted_at) {
        return res.status(400).json({ status: 'error', message: 'ID kategori sudah terdaftar dan aktif' });
      }
      // [MODIFIKASI] Jangan menimpa kategori yang di-soft-delete agar riwayat laporan lama tidak rusak.
      // Alokasikan ID baru yang belum pernah digunakan di database.
      const allKats = await Kategori.findAll({ paranoid: false, attributes: ['id_kategori'] });
      const usedNumbers = new Set();
      allKats.forEach(k => {
        const m = (k.id_kategori || '').match(/^(?:KAT-|KATEGORI-)(\d+)$/i);
        if (m) usedNumbers.add(parseInt(m[1], 10));
      });
      let nextNum = 1;
      while (usedNumbers.has(nextNum)) nextNum++;
      finalId = `KAT-${String(nextNum).padStart(3, '0')}`;
    }

    const kat = await Kategori.create({
      id_kategori: finalId,
      nama_kategori: nama,
      deskripsi: deskripsi || '',
      is_active: true
    });
    return res.status(201).json({
      status: 'success',
      message: finalId !== trimmedId
        ? `Kategori berhasil ditambahkan dengan ID ${finalId} (menjaga data riwayat ID lama)`
        : 'Kategori berhasil ditambahkan',
      data: kat
    });
  } catch (error) {
    console.error('Error createKategori:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kategori, jenis_kategori, deskripsi } = req.body;
    const kat = await Kategori.findByPk(id);
    if (!kat) return res.status(404).json({ status: 'error', message: 'Kategori tidak ditemukan' });
    const nama = (nama_kategori || jenis_kategori);
    if (nama) kat.nama_kategori = nama.trim();
    if (deskripsi !== undefined) kat.deskripsi = deskripsi;
    await kat.save();
    return res.status(200).json({ status: 'success', message: 'Kategori berhasil diperbarui', data: kat });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const kat = await Kategori.findByPk(id);
    if (!kat) return res.status(404).json({ status: 'error', message: 'Kategori tidak ditemukan' });
    await kat.destroy();
    return res.status(200).json({ status: 'success', message: 'Kategori berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// ==========================================
// [MODIFIKASI] CRUD ROLE (Menjaga riwayat soft-delete, tidak menimpa data historis, mendukung penyimpanan hak akses)
// ==========================================
exports.createRole = async (req, res) => {
  try {
    const { id_role, nama_role, deskripsi, permissions } = req.body;
    if (!id_role || !nama_role) {
      return res.status(400).json({ status: 'error', message: 'ID dan nama role wajib diisi' });
    }
    const trimmedId = id_role.trim();
    const trimmedNama = nama_role.trim();
    let finalId = trimmedId;

    // Cek apakah ID sudah ada di database, termasuk yang pernah di-soft delete
    const existing = await Role.findByPk(trimmedId, { paranoid: false });
    if (existing) {
      if (!existing.deleted_at) {
        return res.status(400).json({ status: 'error', message: 'ID role sudah terdaftar dan aktif' });
      }
      // [MODIFIKASI] Jangan menimpa role yang di-soft-delete agar riwayat akun/laporan tetap aman.
      // Alokasikan ID baru berikutnya yang belum pernah digunakan di database.
      const allRoles = await Role.findAll({ paranoid: false, attributes: ['id_role'] });
      const usedNumbers = new Set();
      allRoles.forEach(r => {
        const m = (r.id_role || '').match(/^(?:ROLE-|R-)(\d+)$/i);
        if (m) usedNumbers.add(parseInt(m[1], 10));
      });
      let nextNum = 1;
      while (usedNumbers.has(nextNum)) nextNum++;
      const prefix = trimmedId.toUpperCase().startsWith('R-') ? 'R-' : 'ROLE-';
      const padLen = prefix === 'R-' ? 2 : 3;
      finalId = `${prefix}${String(nextNum).padStart(padLen, '0')}`;
    }

    // [MODIFIKASI] Simpan hak akses (permissions) ke database dalam format array JSONB
    let parsedPermissions = [];
    if (Array.isArray(permissions)) {
      parsedPermissions = permissions;
    } else if (typeof permissions === 'string' && permissions.trim()) {
      try {
        parsedPermissions = JSON.parse(permissions);
      } catch (_) {
        parsedPermissions = [permissions.trim()];
      }
    } else if (finalId === 'R-01') {
      parsedPermissions = ['*'];
    }

    const role = await Role.create({
      id_role: finalId,
      nama_role: trimmedNama,
      deskripsi: deskripsi || '',
      permissions: parsedPermissions
    });
    return res.status(201).json({
      status: 'success',
      message: finalId !== trimmedId
        ? `Role berhasil ditambahkan dengan ID ${finalId} (menjaga data riwayat ID lama)`
        : 'Role berhasil ditambahkan',
      data: role
    });
  } catch (error) {
    console.error('Error createRole:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_role, deskripsi, permissions } = req.body;
    const role = await Role.findByPk(id);
    if (!role) return res.status(404).json({ status: 'error', message: 'Role tidak ditemukan' });
    if (nama_role) role.nama_role = nama_role.trim();
    if (deskripsi !== undefined) role.deskripsi = deskripsi;

    // [MODIFIKASI] Simpan hak akses (permissions) saat update role: aktif (true) tersimpan, non-aktif (false) terhapus dari array
    if (permissions !== undefined) {
      if (Array.isArray(permissions)) {
        role.permissions = permissions;
      } else if (typeof permissions === 'string' && permissions.trim()) {
        try {
          role.permissions = JSON.parse(permissions);
        } catch (_) {
          role.permissions = [permissions.trim()];
        }
      } else {
        role.permissions = [];
      }
    }

    await role.save();
    return res.status(200).json({ status: 'success', message: 'Role berhasil diperbarui', data: role });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    if (!role) return res.status(404).json({ status: 'error', message: 'Role tidak ditemukan' });
    await role.destroy();
    return res.status(200).json({ status: 'success', message: 'Role berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// ==========================================
// [MODIFIKASI] CRUD USER / KARYAWAN (Dukungan restore soft-delete)
// ==========================================
exports.createUser = async (req, res) => {
  try {
    const { id_nik, nama_karyawan, id_unit, id_role, password } = req.body;
    if (!id_nik || !nama_karyawan || !password) {
      return res.status(400).json({ status: 'error', message: 'NIK, nama karyawan, dan password wajib diisi' });
    }
    const trimmedNik = id_nik.trim().toUpperCase();

    // Cek apakah NIK sudah ada di database, termasuk yang pernah di-soft delete
    const existing = await Users.findByPk(trimmedNik, { paranoid: false });
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing) {
      if (!existing.deleted_at) {
        return res.status(400).json({ status: 'error', message: 'NIK sudah terdaftar dan aktif' });
      }
      // [MODIFIKASI] Pulihkan karyawan yang pernah di-soft delete
      await existing.restore();
      existing.nama_karyawan = nama_karyawan.trim();
      existing.id_unit = id_unit || null;
      existing.id_role = id_role || null;
      existing.password = hashedPassword;
      await existing.save();
      const userRes = existing.toJSON();
      delete userRes.password;
      return res.status(201).json({ status: 'success', message: 'Karyawan berhasil ditambahkan', data: userRes });
    }

    const user = await Users.create({
      id_nik: trimmedNik,
      nama_karyawan: nama_karyawan.trim(),
      id_unit: id_unit || null,
      id_role: id_role || null,
      password: hashedPassword
    });
    const userRes = user.toJSON();
    delete userRes.password;
    return res.status(201).json({ status: 'success', message: 'Karyawan berhasil ditambahkan', data: userRes });
  } catch (error) {
    console.error('Error createUser:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_karyawan, id_unit, id_role, password } = req.body;
    const user = await Users.findByPk(id);
    if (!user) return res.status(404).json({ status: 'error', message: 'Karyawan tidak ditemukan' });
    if (nama_karyawan) user.nama_karyawan = nama_karyawan.trim();
    if (id_unit !== undefined) user.id_unit = id_unit || null;
    if (id_role !== undefined) user.id_role = id_role || null;
    if (password && password.trim().length >= 6) {
      user.password = await bcrypt.hash(password.trim(), 10);
    }
    await user.save();
    const userRes = user.toJSON();
    delete userRes.password;
    return res.status(200).json({ status: 'success', message: 'Data karyawan berhasil diperbarui', data: userRes });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Users.findByPk(id);
    if (!user) return res.status(404).json({ status: 'error', message: 'Karyawan tidak ditemukan' });
    await user.destroy();
    return res.status(200).json({ status: 'success', message: 'Karyawan berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// ==========================================
// [MODIFIKASI] CRUD TEMPLATE TINDAKAN (Menjaga riwayat soft-delete, tidak menimpa data historis)
// ==========================================
exports.createTemplate = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id_template, nama_template, deskripsi, id_kategori, list_tindakan } = req.body;
    if (!id_template || !nama_template) {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'ID dan nama template wajib diisi' });
    }
    const trimmedId = id_template.trim();
    const trimmedNama = nama_template.trim();
    let finalId = trimmedId;

    // Cek apakah ID sudah ada di database, termasuk yang pernah di-soft delete
    const existing = await TemplateTindakan.findByPk(trimmedId, { paranoid: false, transaction });

    if (existing) {
      if (!existing.deleted_at) {
        await transaction.rollback();
        return res.status(400).json({ status: 'error', message: 'ID template sudah terdaftar dan aktif' });
      }
      // [MODIFIKASI] Jangan menimpa template yang di-soft-delete agar riwayat audit tindakan lama aman.
      // Alokasikan ID baru yang belum pernah digunakan di database.
      const allTpls = await TemplateTindakan.findAll({ paranoid: false, attributes: ['id_template'], transaction });
      const usedNumbers = new Set();
      allTpls.forEach(t => {
        const m = (t.id_template || '').match(/^(?:TPL-|TEMPLATE-)(\d+)$/i);
        if (m) usedNumbers.add(parseInt(m[1], 10));
      });
      let nextNum = 1;
      while (usedNumbers.has(nextNum)) nextNum++;
      finalId = `TPL-${String(nextNum).padStart(3, '0')}`;
    }

    const template = await TemplateTindakan.create({
      id_template: finalId,
      nama_template: trimmedNama,
      deskripsi: deskripsi || '',
      id_kategori: id_kategori || null,
      is_active: true
    }, { transaction });

    if (Array.isArray(list_tindakan) && list_tindakan.length > 0) {
      const details = list_tindakan.map((item, idx) => ({
        id_template_detail: crypto.randomUUID(),
        id_template: template.id_template,
        urutan: idx + 1,
        nama_tindakan: typeof item === 'string' ? item : (item.nama_tindakan || item.deskripsi_tindakan || '')
      }));
      await TemplateTindakanDetail.bulkCreate(details, { transaction });
    }

    await transaction.commit();
    return res.status(201).json({
      status: 'success',
      message: finalId !== trimmedId
        ? `Template tindakan berhasil ditambahkan dengan ID ${finalId} (menjaga data riwayat ID lama)`
        : 'Template tindakan berhasil ditambahkan',
      data: template
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error('Error createTemplate:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateTemplate = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { nama_template, deskripsi, id_kategori, list_tindakan } = req.body;
    const template = await TemplateTindakan.findByPk(id, { transaction });
    if (!template) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Template tidak ditemukan' });
    }
    if (nama_template) template.nama_template = nama_template.trim();
    if (deskripsi !== undefined) template.deskripsi = deskripsi;
    if (id_kategori !== undefined) template.id_kategori = id_kategori;
    await template.save({ transaction });

    if (Array.isArray(list_tindakan)) {
      await TemplateTindakanDetail.destroy({ where: { id_template: id }, transaction });
      const details = list_tindakan.map((item, idx) => ({
        id_template_detail: crypto.randomUUID(),
        id_template: template.id_template,
        urutan: idx + 1,
        nama_tindakan: typeof item === 'string' ? item : (item.nama_tindakan || item.deskripsi_tindakan || '')
      }));
      await TemplateTindakanDetail.bulkCreate(details, { transaction });
    }

    await transaction.commit();
    return res.status(200).json({ status: 'success', message: 'Template tindakan berhasil diperbarui', data: template });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await TemplateTindakan.findByPk(id);
    if (!template) return res.status(404).json({ status: 'error', message: 'Template tidak ditemukan' });
    await template.destroy();
    return res.status(200).json({ status: 'success', message: 'Template tindakan berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
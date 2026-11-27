const express = require('express');
const router = express.Router();
const {
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  getKategoris,
  createKategori,
  updateKategori,
  deleteKategori,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getTindakLanjuts,
  getPrioritas,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getNextMasterId
} = require('../controllers/masterController');
const authMiddleware = require('../middleware/authMiddleware');

// [MODIFIKASI] Master Unit
router.get('/units', getUnits);
router.post('/units', authMiddleware, createUnit);
router.put('/units/:id', authMiddleware, updateUnit);
router.delete('/units/:id', authMiddleware, deleteUnit);

// [MODIFIKASI] Master Kategori
router.get('/kategoris', getKategoris);
router.post('/kategoris', authMiddleware, createKategori);
router.put('/kategoris/:id', authMiddleware, updateKategori);
router.delete('/kategoris/:id', authMiddleware, deleteKategori);

// [MODIFIKASI] Master Role
router.get('/roles', getRoles);
router.post('/roles', authMiddleware, createRole);
router.put('/roles/:id', authMiddleware, updateRole);
router.delete('/roles/:id', authMiddleware, deleteRole);

// [MODIFIKASI] Master Users / Karyawan
router.get('/users', getUsers);
router.post('/users', authMiddleware, createUser);
router.put('/users/:id', authMiddleware, updateUser);
router.delete('/users/:id', authMiddleware, deleteUser);

// [MODIFIKASI] Master Tindak Lanjut & Prioritas
router.get('/tindak-lanjuts', getTindakLanjuts);
router.get('/prioritas', getPrioritas);

// [MODIFIKASI] Master Template Tindakan
router.get('/templates', getTemplates);
router.post('/templates', authMiddleware, createTemplate);
router.put('/templates/:id', authMiddleware, updateTemplate);
router.delete('/templates/:id', authMiddleware, deleteTemplate);

// [MODIFIKASI] Auto Next ID Master Data (Unit, Kategori, Role, Template)
router.get('/next-id/:type', getNextMasterId);

module.exports = router;

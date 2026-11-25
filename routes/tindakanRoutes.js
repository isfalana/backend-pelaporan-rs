const express = require('express');
const router = express.Router();
const {
  createTindakan,
  getTindakanByLaporan,
  applyTemplate,
  updateTindakan,
  toggleTindakan,
  deleteTindakan
} = require('../controllers/tindakanController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createTindakan);
router.post('/apply-template', authMiddleware, applyTemplate);
router.get('/laporan/:id_laporan', authMiddleware, getTindakanByLaporan);
router.put('/:id_detail', authMiddleware, updateTindakan);
router.put('/:id_detail/toggle', authMiddleware, toggleTindakan);
router.delete('/:id_detail', authMiddleware, deleteTindakan);

module.exports = router;

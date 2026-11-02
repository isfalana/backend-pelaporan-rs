const express = require('express');
const router = express.Router();
const {
  getAllLaporan,
  getLaporanById,
  createLaporan,
  updateStatus
} = require('../controllers/laporanController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getAllLaporan);
router.get('/:id', authMiddleware, getLaporanById);
router.post('/', authMiddleware, createLaporan);
router.put('/:id/status', authMiddleware, updateStatus);

module.exports = router;

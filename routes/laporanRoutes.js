const express = require('express');
const router = express.Router();
const {
  getAllLaporan,
  getLaporanById,
  createLaporan,
  assignPics,
  updateStatus,
  // [MODIFIKASI] Import controller updateTindakLanjut & updateLaporan & deleteLaporan
  updateTindakLanjut,
  updateLaporan,
  deleteLaporan
} = require('../controllers/laporanController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getAllLaporan);
router.get('/:id', authMiddleware, getLaporanById);
router.post('/', authMiddleware, createLaporan);
// [MODIFIKASI] Route update informasi laporan (khusus pelapor/admin, diblokir untuk PIC)
router.put('/:id', authMiddleware, updateLaporan);
router.put('/:id/pics', authMiddleware, assignPics);
router.put('/:id/status', authMiddleware, updateStatus);
// [MODIFIKASI] Route simpan tindak lanjut (keterangan & bukti)
router.put('/:id/tindak-lanjut', authMiddleware, updateTindakLanjut);
// [MODIFIKASI] Route hapus laporan (khusus admin atau pelapor)
router.delete('/:id', authMiddleware, deleteLaporan);

module.exports = router;

const express = require('express');
const router = express.Router();

const evidenceController = require('../controllers/evidenceController');
const uploadEvidence = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// [MODIFIKASI] Endpoint publik / file stream untuk melihat gambar/dokumen evidence secara langsung
router.get(
  '/file/:id_evidence',
  evidenceController.getEvidenceFile
);

// [MODIFIKASI] Endpoint publik file stream berdasarkan id_laporan
router.get(
  '/file-laporan/:id_laporan',
  evidenceController.getEvidenceFileByLaporan
);

router.use(authMiddleware);

router.post(
  '/',
  uploadEvidence,
  evidenceController.uploadEvidence
);

router.get(
  '/laporan/:id_laporan',
  evidenceController.getEvidenceByLaporan
);

router.get(
  '/tindakan/:id_detail_tindakan',
  evidenceController.getEvidenceByTindakan
);

router.delete(
  '/:id_evidence',
  evidenceController.deleteEvidence
);

module.exports = router;
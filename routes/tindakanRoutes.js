const express = require('express');
const router = express.Router();
const { createTindakan, getTindakanByLaporan } = require('../controllers/tindakanController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createTindakan);
router.get('/laporan/:id_laporan', authMiddleware, getTindakanByLaporan);

module.exports = router;

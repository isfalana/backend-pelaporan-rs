require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import rute
const authRoutes = require('./routes/authRoutes');
const laporanRoutes = require('./routes/laporanRoutes');
const tindakanRoutes = require('./routes/tindakanRoutes');
const masterRoutes = require('./routes/masterRoutes');
const evidenceRoutes = require('./routes/evidenceRoutes');
// [MODIFIKASI] Import rute notifikasi
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware
app.use(cors()); // Mengizinkan akses dari aplikasi luar (Flutter)
app.use(express.json()); // Agar Express bisa membaca request body berformat JSON
app.use(express.urlencoded({ extended: true })); // Untuk menangani form-datas

// [MODIFIKASI] Static folder untuk file storage dan bukti evidence agar dapat diakses oleh frontend/browser
app.use('/storage', express.static(require('path').join(__dirname, 'storage')));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend API RS Permata Cirebon is active',
    timestamp: new Date()
  });
});

// Daftar URL Endpoint
app.use('/api/auth', authRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/tindakan', tindakanRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/evidence', evidenceRoutes);
// [MODIFIKASI] Endpoint notifikasi in-app
app.use('/api/notifications', notificationRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Terjadi kesalahan pada server'
  });
});

// Jalankan Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`=========================================`);
});

module.exports = app;

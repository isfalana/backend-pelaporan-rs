require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import rute
const authRoutes = require('./routes/authRoutes');
const laporanRoutes = require('./routes/laporanRoutes');
const tindakanRoutes = require('./routes/tindakanRoutes');
const masterRoutes = require('./routes/masterRoutes');

const app = express();

// Middleware
app.use(cors()); // Mengizinkan akses dari aplikasi luar (Flutter)
app.use(express.json()); // Agar Express bisa membaca request body berformat JSON
app.use(express.urlencoded({ extended: true })); // Untuk menangani form-data

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

// Jalankan Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`=========================================`);
});

module.exports = app;

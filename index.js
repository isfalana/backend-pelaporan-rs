require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import rute
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(cors()); // Mengizinkan akses dari aplikasi luar (Flutter)
app.use(express.json()); // Agar Express bisa membaca request body berformat JSON
app.use(express.urlencoded({ extended: true })); // Untuk menangani form-data

// Daftar URL Endpoint
app.use('/api/auth', authRoutes);

// Jalankan Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`=========================================`);
});
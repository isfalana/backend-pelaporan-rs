'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Data Role
    await queryInterface.bulkInsert('role', [
      { id_role: 'R-01', nama_role: 'Admin', created_at: new Date(), updated_at: new Date() },
      { id_role: 'R-02', nama_role: 'User/PIC', created_at: new Date(), updated_at: new Date() }
    ]);

    // 2. Data Kategori
    await queryInterface.bulkInsert('kategori', [
      { id_kategori: 'KAT-01', jenis_kategori: 'Perbaikan / Maintenance', created_at: new Date(), updated_at: new Date() },
      { id_kategori: 'KAT-02', jenis_kategori: 'Pengadaan Barang', created_at: new Date(), updated_at: new Date() },
      { id_kategori: 'KAT-03', jenis_kategori: 'Komplain Layanan', created_at: new Date(), updated_at: new Date() }
    ]);

    // 3. Data Unit
    await queryInterface.bulkInsert('unit', [
      { id_unit: 'U-IT', nama_unit: 'Information Technology', created_at: new Date(), updated_at: new Date() },
      { id_unit: 'U-UMUM', nama_unit: 'Umum & Fasilitas', created_at: new Date(), updated_at: new Date() },
      { id_unit: 'U-PENDAFTARAN', nama_unit: 'Pendaftaran & Rekam Medis', created_at: new Date(), updated_at: new Date() }
    ]);

    // 4. Data Users (Akun Login) - Password kita enkripsi dulu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt); // Password untuk test login Flutter: 123456

    await queryInterface.bulkInsert('users', [
      {
        id_nik: 'NIK-001',
        nama_karyawan: 'Admin IT',
        password: passwordHash,
        jabatan: 'Kepala IT',
        id_unit: 'U-IT', // Dari unit mana user ini berasal
        id_role: 'R-01',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id_nik: 'NIK-002',
        nama_karyawan: 'Siti Aminah', // Contoh user sebagai Pelapor
        password: passwordHash,
        jabatan: 'Staff Pendaftaran',
        id_unit: 'U-PENDAFTARAN', // Dari unit mana user ini berasal
        id_role: 'R-02',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id_nik: 'NIK-003',
        nama_karyawan: 'Budi Teknisi', // Contoh user sebagai PIC (Tujuan)
        password: passwordHash,
        jabatan: 'Teknisi Umum',
        id_unit: 'U-UMUM', // Dari unit mana user ini berasal
        id_role: 'R-02',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('unit', null, {});
    await queryInterface.bulkDelete('kategori', null, {});
    await queryInterface.bulkDelete('role', null, {});
  }
};
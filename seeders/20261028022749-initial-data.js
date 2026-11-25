
'use strict';

const bcrypt = require('bcryptjs');

const { randomUUID } = require('crypto');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // ==========================================
    // 1. DATA ROLE
    // ==========================================
    await queryInterface.bulkInsert('role', [
      {
        id_role: 'R-01',
        nama_role: 'Admin',
        deskripsi: 'Administrator sistem',
        created_at: now,
        updated_at: now
      },
      {
        id_role: 'R-02',
        nama_role: 'User',
        deskripsi: 'Pengguna sistem dan dapat ditugaskan sebagai PIC',
        created_at: now,
        updated_at: now
      }
    ]);

    // ==========================================
    // 2. DATA UNIT
    // ==========================================
    await queryInterface.bulkInsert('unit', [
      {
        id_unit: 'U-IT',
        nama_unit: 'Information Technology',
        created_at: now,
        updated_at: now
      },
      {
        id_unit: 'U-UMUM',
        nama_unit: 'Umum & Fasilitas',
        created_at: now,
        updated_at: now
      },
      {
        id_unit: 'U-PENDAFTARAN',
        nama_unit: 'Pendaftaran & Rekam Medis',
        created_at: now,
        updated_at: now
      }
    ]);

    // ==========================================
    // 3. DATA KATEGORI
    // ==========================================
    await queryInterface.bulkInsert('kategori', [
      {
        id_kategori: 'KAT-01',
        nama_kategori: 'Perbaikan / Maintenance',
        deskripsi: 'Kerusakan dan pemeliharaan fasilitas',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id_kategori: 'KAT-02',
        nama_kategori: 'Pengadaan Barang',
        deskripsi: 'Permintaan pengadaan barang',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id_kategori: 'KAT-03',
        nama_kategori: 'Komplain Layanan',
        deskripsi: 'Keluhan terhadap pelayanan',
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ]);

    // ==========================================
    // 4. DATA PRIORITAS
    // ==========================================
    await queryInterface.bulkInsert('prioritas', [
      {
        id_prioritas: 'P-01',
        nama_prioritas: 'Kritis',
        urutan: 1,
        batas_sisa_hari: 0,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id_prioritas: 'P-02',
        nama_prioritas: 'Tinggi',
        urutan: 2,
        batas_sisa_hari: 1,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id_prioritas: 'P-03',
        nama_prioritas: 'Sedang',
        urutan: 3,
        batas_sisa_hari: 3,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id_prioritas: 'P-04',
        nama_prioritas: 'Rendah',
        urutan: 4,
        batas_sisa_hari: 7,
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ]);

    // ==========================================
    // 5. DATA MASTER TINDAK LANJUT
    // ==========================================
    await queryInterface.bulkInsert('tindak_lanjut', [
      {
        id_tindak_lanjut: 'TL-01',
        nama_tindak_lanjut: 'Pemeriksaan',
        deskripsi: 'Melakukan pemeriksaan permasalahan',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id_tindak_lanjut: 'TL-02',
        nama_tindak_lanjut: 'Perbaikan',
        deskripsi: 'Melakukan perbaikan permasalahan',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id_tindak_lanjut: 'TL-03',
        nama_tindak_lanjut: 'Evaluasi',
        deskripsi: 'Melakukan evaluasi hasil tindakan',
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ]);

    // ==========================================
    // 6. DATA USERS
    // ==========================================
    const passwordHash = await bcrypt.hash('123456', 10);

    await queryInterface.bulkInsert('users', [
      {
        id_nik: 'NIK-001',
        nama_karyawan: 'Admin IT',
        password: passwordHash,
        id_unit: 'U-IT',
        id_role: 'R-01',
        created_at: now,
        updated_at: now
      },
      {
        id_nik: 'NIK-002',
        nama_karyawan: 'Siti Aminah',
        password: passwordHash,
        id_unit: 'U-PENDAFTARAN',
        id_role: 'R-02',
        created_at: now,
        updated_at: now
      },
      {
        id_nik: 'NIK-003',
        nama_karyawan: 'Budi Teknisi',
        password: passwordHash,
        id_unit: 'U-UMUM',
        id_role: 'R-02',
        created_at: now,
        updated_at: now
      },
      {
        id_nik: 'NIK-004',
        nama_karyawan: 'Andi IT',
        password: passwordHash,
        id_unit: 'U-IT',
        id_role: 'R-02',
        created_at: now,
        updated_at: now
      }
    ]);

    // ==========================================
    // 7. DATA TEMPLATE TINDAKAN
    // ==========================================
    const templatePerbaikanId = 'TPL-01';
    const templatePengadaanId = 'TPL-02';

    await queryInterface.bulkInsert('template_tindakan', [
      {
        id_template: templatePerbaikanId,
        nama_template: 'Template Perbaikan Fasilitas',
        deskripsi: 'Tahapan standar penanganan kerusakan fasilitas',
        id_kategori: 'KAT-01',
        is_active: true,
        created_by: 'NIK-001',
        created_at: now,
        updated_at: now
      },
      {
        id_template: templatePengadaanId,
        nama_template: 'Template Pengadaan Barang',
        deskripsi: 'Tahapan standar proses pengadaan barang',
        id_kategori: 'KAT-02',
        is_active: true,
        created_by: 'NIK-001',
        created_at: now,
        updated_at: now
      }
    ]);

    // ==========================================
    // 8. DETAIL TEMPLATE TINDAKAN
    // ==========================================
    await queryInterface.bulkInsert('template_tindakan_detail', [
      {
        id_template_detail: randomUUID(),
        id_template: templatePerbaikanId,
        urutan: 1,
        nama_tindakan: 'Melakukan pemeriksaan kerusakan',
        created_at: now,
        updated_at: now
      },
      {
        id_template_detail: randomUUID(),
        id_template: templatePerbaikanId,
        urutan: 2,
        nama_tindakan: 'Mengidentifikasi penyebab kerusakan',
        created_at: now,
        updated_at: now
      },
      {
        id_template_detail: randomUUID(),
        id_template: templatePerbaikanId,
        urutan: 3,
        nama_tindakan: 'Melakukan perbaikan',
        created_at: now,
        updated_at: now
      },
      {
        id_template_detail: randomUUID(),
        id_template: templatePerbaikanId,
        urutan: 4,
        nama_tindakan: 'Melakukan pengujian hasil perbaikan',
        created_at: now,
        updated_at: now
      },
      {
        id_template_detail: randomUUID(),
        id_template: templatePengadaanId,
        urutan: 1,
        nama_tindakan: 'Memeriksa kebutuhan barang',
        created_at: now,
        updated_at: now
      },
      {
        id_template_detail: randomUUID(),
        id_template: templatePengadaanId,
        urutan: 2,
        nama_tindakan: 'Mengajukan permintaan pengadaan',
        created_at: now,
        updated_at: now
      },
      {
        id_template_detail: randomUUID(),
        id_template: templatePengadaanId,
        urutan: 3,
        nama_tindakan: 'Melakukan verifikasi barang',
        created_at: now,
        updated_at: now
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Hapus berdasarkan ID data dummy.
    // Tidak menghapus seluruh isi tabel.

    await queryInterface.bulkDelete(
      'template_tindakan_detail',
      {
        id_template: ['TPL-01', 'TPL-02']
      }
    );

    await queryInterface.bulkDelete(
      'template_tindakan',
      {
        id_template: ['TPL-01', 'TPL-02']
      }
    );

    await queryInterface.bulkDelete(
      'users',
      {
        id_nik: ['NIK-001', 'NIK-002', 'NIK-003', 'NIK-004']
      }
    );

    await queryInterface.bulkDelete(
      'tindak_lanjut',
      {
        id_tindak_lanjut: ['TL-01', 'TL-02', 'TL-03']
      }
    );

    await queryInterface.bulkDelete(
      'prioritas',
      {
        id_prioritas: ['P-01', 'P-02', 'P-03', 'P-04']
      }
    );

    await queryInterface.bulkDelete(
      'kategori',
      {
        id_kategori: ['KAT-01', 'KAT-02', 'KAT-03']
      }
    );

    await queryInterface.bulkDelete(
      'unit',
      {
        id_unit: ['U-IT', 'U-UMUM', 'U-PENDAFTARAN']
      }
    );

    await queryInterface.bulkDelete(
      'role',
      {
        id_role: ['R-01', 'R-02']
      }
    );
  }
};

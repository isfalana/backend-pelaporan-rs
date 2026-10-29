# Backend API - Laporan RS Permata Cirebon 🏥

Aplikasi Laporan Internal RS Permata Cirebon adalah sistem pencatatan masalah, pengaduan, dan permintaan tindakan antar unit di rumah sakit. Repositori ini berisi **Backend RESTful API** yang bertugas sebagai pelayan data (*data server*) dan pengelola logika bisnis untuk aplikasi klien (Frontend) berbasis seluler.

---

## 🛠️ Stack Teknologi (Tech Stack)

Sistem *backend* ini dibangun menggunakan arsitektur modern standar industri:

1.  **Node.js & Express.js:** Lingkungan eksekusi dan *framework* server. Dipilih karena sangat ringan, asinkron (cocok untuk banyak *request* bersamaan), dan menggunakan format JSON secara bawaan (sangat kompatibel dengan Flutter).
2.  **PostgreSQL (via Docker):** Sistem Manajemen Basis Data Relasional (RDBMS). Sangat tangguh untuk menjaga integritas data rumah sakit yang kompleks (seperti relasi antar unit, pengguna, dan laporan).
3.  **Sequelize ORM:** Alat bantu (*Object-Relational Mapping*) di Node.js untuk berinteraksi dengan PostgreSQL menggunakan kode JavaScript, bukan *query* SQL manual. Ini sangat memudahkan proses *Migration* (pembuatan tabel) dan *Seeding* (pengisian data awal).
4.  **Bcrypt.js:** Modul untuk mengenkripsi (mengacak) kata sandi (*password*) pengguna sebelum disimpan ke *database*, sehingga data akun tetap aman meskipun *database* bocor.
5.  **JSON Web Token (JWT):** Standar keamanan untuk otentikasi. Mengubah identitas pengguna yang berhasil *login* menjadi "tiket digital" yang digunakan untuk mengakses fitur-fitur aplikasi.

---

## 🏗️ Struktur Tabel Database (Skema PostgreSQL)

Database bernama `db_laporan_rs` dirancang dengan 7 tabel utama yang saling berelasi:

1.  **`role`**: Tabel hak akses (Admin, User/PIC).
2.  **`kategori`**: Tabel jenis laporan (Perbaikan, Pengadaan, Komplain, dll).
3.  **`tindak_lanjut`**: Tabel master jenis/prosedur tindak lanjut (opsional).
4.  **`unit`**: Tabel daftar bagian di rumah sakit (IT, Umum, SDM, dll).
5.  **`users`**: Tabel akun masuk (*login*). Menyimpan NIK, sandi (terenkripsi), dan *Foreign Key* yang merujuk ke tabel `unit` dan `role`.
6.  **`laporan`**: Tabel transaksi utama pengaduan. Berisi kegiatan, prioritas, *deadline*, status (Pending/On Progress/Done), dan berelasi ke Unit pelapor.
7.  **`detail_tindakan`**: Tabel riwayat log/catatan tindakan per laporan. Mencatat ID laporan, ID *user* yang mengerjakan, deskripsi pengerjaan, dan *timestamp*.

---

## 🚀 Panduan Instalasi dan Menjalankan Server Lokal

Ikuti langkah-langkah detail berikut untuk menjalankan *backend* di komputer pengembangan (*localhost*) Anda.

### 1. Persiapan Perangkat Lunak (Prerequisites)
Pastikan aplikasi berikut sudah terinstal di komputer Anda:
*   [Node.js](https://nodejs.org/) (Sertakan juga NPM).
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Harus dalam keadaan "Running" di latar belakang).
*   *Code Editor* seperti Visual Studio Code (VS Code).
*   Alat penguji API seperti [Postman](https://www.postman.com/) atau ekstensi *Thunder Client* di VS Code.

### 2. Kloning dan Instalasi Ketergantungan (*Dependencies*)
Buka terminal (CMD/PowerShell) atau terminal terintegrasi di VS Code, arahkan ke folder proyek ini, lalu instal semua *package* npm yang dibutuhkan:
```bash
npm install
```

### 3. Konfigurasi Kredensial (.env)
Buat sebuah file baru bernama `.env` tepat di direktori terluar (*root*) proyek Anda. Salin dan tempelkan variabel berikut ke dalamnya. (File ini mengatur rahasia server dan koneksi *database*):

```env
# --- KONFIGURASI DATABASE (POSTGRESQL) ---
DB_USERNAME=postgres
DB_PASSWORD=1122
DB_DATABASE=db_laporan_rs
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DIALECT=postgres

# --- KONFIGURASI SERVER EXPRESS ---
PORT=3000

# --- KONFIGURASI KEAMANAN (JWT) ---
# Kunci ini digunakan untuk menandatangani token login. (Ubah untuk mode produksi)
JWT_SECRET=rahasia_super_aman_rs_permata_2026
```

### 4. Menghidupkan Database (Docker)
Kita akan menyalakan server PostgreSQL secara instan menggunakan Docker. Pastikan Docker Desktop terbuka, lalu jalankan perintah ini di terminal:
```bash
docker-compose up -d
```
*Catatan: Parameter `-d` (detached) membuat server database berjalan di latar belakang sehingga Anda tetap bisa menggunakan terminal tersebut.*

### 5. Membangun Tabel & Menyuntik Data (Migration & Seeding)
Setelah database menyala (biasanya di *port* `5432`), kita perlu membentuk tabel-tabelnya (Migrasi) dan memasukkan data percobaan awal (Seeding):

*   **Jalankan Migrasi (Membuat 7 Tabel):**
    
```bash
    npx sequelize-cli db:migrate
    
```
*   **Jalankan Seeder (Memasukkan data dummy):**
    
```bash
    npx sequelize-cli db:seed:all
    
```
    *Catatan Seeder: Perintah ini akan otomatis membuatkan dua akun untuk Anda coba nanti:*
    *   *Akun 1 - NIK: `NIK-001` (Admin IT) | Password: `123456`*
    *   *Akun 2 - NIK: `NIK-002` (Staff Umum) | Password: `123456`*

### 6. Menjalankan Server Node.js
Ketik perintah berikut untuk menghidupkan *backend API*:
```bash
npx nodemon index.js
```
Jika sukses, terminal akan menampilkan pesan: `🚀 Server berjalan di http://localhost:3000`. Biarkan terminal ini tetap terbuka selama Anda mengembangkan aplikasi.

---

## 🔗 Panduan Integrasi (Pemasangan) dengan Aplikasi Flutter

Bagian ini menjelaskan bagaimana menyambungkan aplikasi *frontend* Flutter Anda agar dapat mengonsumsi (menggunakan) data dari *backend* Node.js ini.

### Syarat di Sisi Flutter
Di proyek Flutter Anda (misal: proyek `laporan_rs`), pastikan Anda sudah menambahkan *package* `dio` (untuk komunikasi HTTP) dan `shared_preferences` (untuk menyimpan token lokal) di dalam `pubspec.yaml`.

### Langkah 1: Konfigurasi Base URL (di Flutter)
Karena aplikasi Node.js berjalan di komputer Anda sendiri (localhost) pada *port* 3000, Anda harus mengatur URL tujuan di dalam kode Flutter (`ApiService`).

*   **PENTING UNTUK EMULATOR ANDROID:**
    Jika Anda menjalankan Flutter di Emulator Android bawaan Android Studio, emulator tersebut **tidak mengenali** `localhost` atau `127.0.0.1` sebagai komputer fisik Anda. Anda **wajib** menggunakan IP khusus `10.0.2.2`.
*   **PENTING UNTUK CHROME/WEB:**
    Jika menjalankan Flutter di Chrome/Edge, gunakan `127.0.0.1`.

**Contoh kode di Flutter (`lib/app/data/services/api_service.dart`):**
```dart
import 'package:dio/dio.dart';

class ApiService {
  static final Dio _dio = Dio(
    BaseOptions(
      // --- PILIH SALAH SATU BERDASARKAN DEVICE YANG DIPAKAI ---
      
      // Jika Run di Chrome (Web):
      // baseUrl: 'http://127.0.0.1:3000/api', 
      
      // Jika Run di Emulator Android Studio:
      baseUrl: 'http://10.0.2.2:3000/api',
      
      // Jika Run di HP Fisik (HP dan Laptop harus satu WiFi):
      // baseUrl: 'http://<IP_ADDRESS_LAPTOP_ANDA>:3000/api',

      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
      },
    ),
  );
  // ... (kode interceptor JWT dilanjutkan di sini)
}
```

### Langkah 2: Menguji Fitur Login (Contoh Integrasi)
Berikut adalah gambaran bagaimana Controller di Flutter (`AuthController`) menembak *endpoint* Node.js yang telah kita buat:

```dart
// Contoh di Flutter (AuthController.dart)
import 'package:dio/dio.dart';

Future<void> login(String nik, String password) async {
  try {
    // 1. Flutter mengirim HTTP POST ke Node.js (http://10.0.2.2:3000/api/auth/login)
    final response = await ApiService._dio.post('/auth/login', data: {
      "id_nik": nik,
      "password": password
    });

    // 2. Jika sukses (status 200), Node.js mengembalikan JSON berisi Token JWT
    if (response.statusCode == 200) {
      String jwtToken = response.data['token']; // Ambil token dari JSON Node.js
      String namaUnit = response.data['data']['nama_unit'];
      
      // 3. Simpan token ke memori HP menggunakan SharedPreferences
      SharedPreferences prefs = await SharedPreferences.getInstance();
      await prefs.setString('jwt_token', jwtToken);
      
      // 4. Pindah ke Halaman Dashboard
      Get.offAllNamed(Routes.DASHBOARD);
    }
  } on DioException catch (e) {
    // Menangkap pesan error dari Node.js (misal: "Password Salah" atau 401 Unauthorized)
    String errorMsg = e.response?.data['message'] ?? 'Gagal menghubungi server';
    Get.snackbar('Gagal', errorMsg);
  }
}
```

## 📡 Daftar Endpoint API (Versi 1)

*Endpoint* ini yang akan dipanggil oleh *package* `dio` dari Flutter.

### 1. Autentikasi Login
*   **Metode:** `POST`
*   **URL:** `http://localhost:3000/api/auth/login` (Sesuaikan `localhost` dengan aturan IP Emulator di atas).
*   **Tujuan:** Memvalidasi `id_nik` dan `password`, lalu mengembalikan tiket akses (JWT).
*   **Format Request (Body - JSON):**
    
```json
    {
      "id_nik": "NIK-001",
      "password": "123456"
    }
    
```
*   **Contoh Response Sukses (JSON):**
    
```json
    {
        "status": "success",
        "message": "Login berhasil",
        "token": "eyJhbGciOiJIUzI1NiIsInR...", 
        "data": {
            "id_nik": "NIK-001",
            "nama_karyawan": "Admin IT",
            "jabatan": "Kepala IT",
            "nama_unit": "Information Technology",
            "nama_role": "Admin"
        }
    }
    
```

---

_Dokumentasi ini dibuat untuk memandu pengembang dalam memelihara dan mengembangkan fitur API RS Permata Cirebon secara berkelanjutan._
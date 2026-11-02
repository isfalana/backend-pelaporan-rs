# Backend Pelaporan RS

Backend API untuk mendukung sistem dashboard pelaporan rumah sakit, pengelolaan data, dan sinkronisasi informasi dari layanan terkait.

Aplikasi ini dikembangkan menggunakan Node.js dan Express.js, dengan Sequelize sebagai ORM untuk berinteraksi dengan database. Sistem juga mendukung proses sinkronisasi data terjadwal untuk membantu menjaga ketersediaan data pada dashboard.

## Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Arsitektur Singkat](#arsitektur-singkat)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi](#instalasi)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [API Dashboard](#api-dashboard)
- [Sinkronisasi Data](#sinkronisasi-data)
- [Struktur Proyek](#struktur-proyek)
- [Keamanan](#keamanan)
- [Pengembangan](#pengembangan)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

## Tentang Proyek

Backend Pelaporan RS merupakan layanan backend yang menyediakan API untuk kebutuhan dashboard pelaporan rumah sakit.

Aplikasi bertanggung jawab menangani permintaan dari frontend, mengakses database, serta menjalankan proses sinkronisasi data melalui layanan yang terintegrasi.

Proyek ini dirancang agar proses pengolahan data dan penyediaan API dapat dikelola secara terstruktur, sehingga memudahkan pengembangan, pemeliharaan, dan pengoperasian aplikasi.

## Fitur Utama

- **REST API:** Menyediakan endpoint untuk mengambil data dashboard.
- **Integrasi Database:** Menggunakan Sequelize untuk pengelolaan akses database.
- **Sinkronisasi Data:** Mendukung proses sinkronisasi data dari layanan sumber.
- **Penjadwalan Otomatis:** Mendukung cron job untuk menjalankan proses sinkronisasi terjadwal.
- **Pengelolaan Data Dashboard:** Mendukung kebutuhan data IGD, rawat jalan, rawat inap, booking, jadwal, dan laboratorium.
- **Autentikasi:** Mendukung mekanisme autentikasi berbasis token sesuai implementasi aplikasi.
- **Logging:** Mendukung pencatatan aktivitas dan informasi operasional aplikasi.
- **Konfigurasi Environment:** Mendukung pemisahan konfigurasi aplikasi dari kode sumber.

## Teknologi

Teknologi yang digunakan dalam proyek ini meliputi:

| Teknologi | Kegunaan |
|---|---|
| Node.js | Runtime JavaScript pada sisi server |
| Express.js | Framework backend dan REST API |
| Sequelize | ORM untuk interaksi dengan database |
| Redis | Dukungan penyimpanan atau mekanisme internal sesuai konfigurasi aplikasi |
| JWT | Mekanisme autentikasi berbasis token |
| Pino HTTP | Logging permintaan HTTP |
| Helmet | Security middleware untuk HTTP |
| Cron Job | Penjadwalan proses otomatis |
| npm | Manajemen dependensi Node.js |
| Git | Version control |

Teknologi dan dependensi yang benar-benar aktif mengikuti implementasi serta konfigurasi pada repositori.

## Arsitektur Singkat

Secara umum, alur kerja aplikasi adalah sebagai berikut:

1. Frontend mengirimkan permintaan HTTP ke backend.
2. Middleware memproses permintaan, termasuk autentikasi apabila diperlukan.
3. Controller menangani permintaan dan meneruskan proses ke service.
4. Service menjalankan logika bisnis, mengakses database, atau berkomunikasi dengan layanan eksternal.
5. Backend mengembalikan respons kepada frontend.
6. Proses sinkronisasi terjadwal mengambil dan memproses data sesuai konfigurasi yang berlaku.

## Persyaratan Sistem

Sebelum menjalankan aplikasi, siapkan:

- Node.js dengan versi yang kompatibel dengan proyek.
- npm.
- Database yang digunakan oleh aplikasi.
- Redis apabila dibutuhkan oleh konfigurasi aplikasi.
- Akses jaringan ke layanan sumber data apabila diperlukan.
- File environment dengan konfigurasi yang sesuai.

## Instalasi

### 1. Clone repositori

```bash
git clone https://github.com/isfalana/backend-pelaporan-rs.git
```

### 2. Masuk ke direktori proyek

```bash
cd backend-pelaporan-rs
```

### 3. Instal dependensi

```bash
npm install
```

### 4. Siapkan konfigurasi environment

Buat file `.env` berdasarkan kebutuhan konfigurasi aplikasi.

Jangan menggunakan kredensial produksi yang sebenarnya di dalam contoh konfigurasi atau dokumentasi publik.

### 5. Siapkan database

Pastikan database telah dibuat dan konfigurasi koneksinya sesuai dengan lingkungan tempat aplikasi dijalankan.

Jika proyek menggunakan migration Sequelize, jalankan migration sesuai perintah dan prosedur yang tersedia pada `package.json` serta konfigurasi proyek.

## Konfigurasi Environment

Aplikasi menggunakan konfigurasi environment untuk memisahkan pengaturan operasional dari kode sumber.

Contoh variabel berikut merupakan ilustrasi dan perlu disesuaikan dengan implementasi aktual:

```dotenv
NODE_ENV=development
PORT_EXPRESS=999

DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

JWT_SECRET=
```

**Penting:**
- Gunakan nama variabel yang sesuai dengan kode aplikasi.
- Jangan mengunggah file `.env` yang berisi kredensial asli ke GitHub.
- Simpan password, token, dan secret menggunakan environment variables atau secret manager pada lingkungan deployment.
- Pastikan `.env` tercantum dalam `.gitignore`.
- Gunakan `.env.example` untuk mendokumentasikan variabel yang dibutuhkan tanpa menyertakan nilai rahasia.

## Menjalankan Aplikasi

Setelah dependensi dan konfigurasi disiapkan, jalankan aplikasi menggunakan script yang tersedia pada `package.json`.

Periksa daftar script terlebih dahulu:

```bash
npm run
```

Kemudian gunakan perintah yang sesuai dengan lingkungan aplikasi, misalnya script pengembangan atau script produksi yang telah didefinisikan dalam proyek.

Pastikan koneksi database, konfigurasi environment, dan dependensi layanan telah tersedia sebelum menjalankan aplikasi.

## API Dashboard

Backend menyediakan endpoint untuk kebutuhan data dashboard, termasuk area berikut:

| Modul | Endpoint |
|---|---|
| IGD | `/dashboard/data/igd` |
| Rawat Jalan | `/dashboard/data/rajal` |
| Rawat Inap | `/dashboard/data/ranap` |
| Booking | `/dashboard/data/booking` |
| Jadwal | `/dashboard/data/jadwal` |

Endpoint laboratorium dan endpoint lain mengikuti route yang tersedia pada implementasi aplikasi.

### Autentikasi

Endpoint yang dilindungi autentikasi harus diakses menggunakan mekanisme autentikasi yang ditetapkan aplikasi.

Jika endpoint memerlukan JWT, klien harus mengirimkan token melalui header HTTP yang sesuai, misalnya:

```http
Authorization: Bearer <ACCESS_TOKEN>
```

Jangan menuliskan token asli dalam dokumentasi, kode contoh, atau repositori publik.

> Daftar endpoint di atas merupakan ringkasan endpoint dashboard yang diketahui. Metode HTTP, parameter, format respons, dan kebutuhan autentikasi setiap endpoint perlu mengacu pada implementasi route yang sebenarnya.

## Sinkronisasi Data

Aplikasi mendukung proses sinkronisasi data untuk memenuhi kebutuhan dashboard.

Proses sinkronisasi dapat dijalankan melalui service dan penjadwalan otomatis sesuai konfigurasi proyek.

Area data yang didukung mencakup:

- IGD.
- Rawat jalan.
- Rawat inap.
- Booking.
- Jadwal.
- Laboratorium.

Implementasi sinkronisasi perlu memperhatikan:

- Validasi data dari layanan sumber.
- Penanganan kesalahan saat permintaan API gagal.
- Konsistensi data antara sumber dan database lokal.
- Pencegahan duplikasi berdasarkan aturan masing-masing modul.
- Logging proses sinkronisasi.
- Pelaporan kegagalan agar tidak dianggap berhasil ketika proses sebenarnya gagal.

Jadwal sinkronisasi, rentang tanggal, dan aturan pemrosesan mengikuti konfigurasi aplikasi.

## Struktur Proyek

Struktur direktori utama yang digunakan dalam proyek:

```text
backend-pelaporan-rs/
├── config/
├── controllers/
├── middleware/
├── migrations/
├── models/
├── routes/
├── seeders/
├── index.js
├── package.json
├── package-lock.json
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .gitignore
└── README.md
```

Keterangan:

| Direktori/File | Fungsi |
|---|---|
| `config/` | Konfigurasi aplikasi dan layanan |
| `controllers/` | Penanganan permintaan HTTP |
| `middleware/` | Middleware untuk kebutuhan aplikasi |
| `migrations/` | Perubahan struktur database |
| `models/` | Definisi model database |
| `routes/` | Definisi endpoint API |
| `seeders/` | Data awal atau data pendukung database |
| `index.js` | Entry point aplikasi |
| `package.json` | Metadata proyek, dependensi, dan script npm |
| `Dockerfile` | Instruksi pembuatan image Docker |
| `docker-compose.yml` | Konfigurasi layanan Docker Compose |
| `.dockerignore` | Daftar file yang dikecualikan dari build context Docker |
| `.gitignore` | Daftar file yang tidak dilacak oleh Git |

Struktur di atas menggambarkan direktori utama proyek. Isi dan tanggung jawab setiap komponen mengikuti kode aktual.

## Keamanan

Keamanan menjadi bagian penting dalam pengembangan dan pengoperasian aplikasi backend.

Praktik yang perlu diterapkan meliputi:

1. **Perlindungan kredensial:** Jangan menyimpan password, token, API key, atau JWT secret di repositori publik.
2. **Autentikasi dan otorisasi:** Pastikan setiap endpoint yang memerlukan perlindungan memiliki kontrol akses yang sesuai.
3. **Validasi input:** Validasi parameter, body, dan query sebelum diproses.
4. **Keamanan database:** Gunakan akun database dengan hak akses minimum yang diperlukan.
5. **HTTPS:** Gunakan koneksi HTTPS pada deployment yang diakses melalui internet.
6. **Security headers:** Terapkan konfigurasi Helmet sesuai kebutuhan aplikasi.
7. **Pembatasan permintaan:** Lindungi endpoint sensitif dari penyalahgunaan dan permintaan berlebihan.
8. **Error handling:** Hindari mengirimkan stack trace dan informasi internal kepada klien.
9. **Keamanan dependensi:** Periksa dependensi secara berkala menggunakan audit keamanan.
10. **Logging:** Hindari mencatat kredensial dan informasi sensitif dalam log.
11. **Pengelolaan konfigurasi:** Pisahkan konfigurasi pengembangan, pengujian, dan produksi.
12. **Backup dan pemulihan:** Siapkan mekanisme backup serta prosedur pemulihan data.

Contoh pemeriksaan dependensi:

```bash
npm audit
```

Hasil audit perlu ditinjau sebelum menerapkan pembaruan dependensi.

**Catatan:** Dokumentasi praktik keamanan tidak berarti seluruh kontrol tersebut telah diterapkan atau diverifikasi pada kode saat ini. Status keamanannya perlu dipastikan melalui audit dan pengujian.

## Pengembangan

Kontribusi dan pengembangan sebaiknya mengikuti alur kerja Git yang terstruktur.

Alur yang disarankan:

1. Buat branch untuk perubahan yang dikerjakan.
2. Implementasikan perubahan sesuai kebutuhan.
3. Jalankan pengujian yang relevan.
4. Periksa perubahan sebelum melakukan commit.
5. Push branch ke GitHub.
6. Buat Pull Request menuju branch tujuan.
7. Tinjau perubahan sebelum melakukan merge.

Contoh pembuatan branch:

```bash
git switch -c feature/nama-fitur
```

Contoh pemeriksaan perubahan:

```bash
git status
git diff
```

Contoh commit:

```bash
git add .
git commit -m "feat: deskripsi perubahan"
```

Sebelum menggunakan `git add .`, pastikan file rahasia, file lokal, dan artefak yang tidak diperlukan tidak ikut dimasukkan ke commit.

## Kontribusi

Kontribusi pengembangan dapat dilakukan melalui Pull Request.

Sebelum mengajukan perubahan:

- Pastikan perubahan memiliki tujuan yang jelas.
- Hindari memasukkan kredensial atau data sensitif.
- Jalankan pengujian yang relevan.
- Sertakan penjelasan perubahan.
- Periksa dampak terhadap modul dan proses sinkronisasi lain.

Setiap perubahan perlu ditinjau sebelum digabungkan ke branch utama.

## Lisensi

Lisensi proyek belum dicantumkan dalam dokumentasi ini.

Sebelum menentukan lisensi, pastikan pemilik proyek memiliki kewenangan untuk menentukan ketentuan penggunaan dan distribusi kode.

Jika proyek akan dipublikasikan secara terbuka, tambahkan file `LICENSE` setelah lisensi yang sesuai dipilih.

---

**Backend Pelaporan RS**  
Node.js · Express.js · Sequelize
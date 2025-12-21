# API Jabir LEAD INTEGRATOR API - BWI Marketplace

Nama: Rusydi Jabir Al-Awfâ (2044)\
Peran: **Lead Integrator**\
Mata Kuliah: Interoperabilitas\
Proyek: Integration API for Banyuwangi Marketplace\
Link API: https://banyuwangi-marketplace-api.vercel.app/

---

## Pendahuluan

Pada proyek ini saya membangun sebuah REST API sebagai **Lead Integrator** untuk **BWI Marketplace**. API ini dibuat sebagai implementasi peran **Lead Integrator (Mahasiswa 4)** pada Ujian Praktikum Akhir Semester mata kuliah Interoperabilitas.

Sebagai Lead Integrator, saya memiliki tugas untuk mengintegrasikan data dari berbagai vendor yang memiliki format berbeda-beda menjadi satu format standar marketplace. Layanan ini menggabungkan data dari 3 vendor dengan karakteristik berbeda:

* **Vendor A (Warung Legacy)**: Sistem lama, semua data dalam format string termasuk harga
* **Vendor B (Distro Modern)**: Sistem modern dengan format standar internasional
* **Vendor C (Resto & Kuliner)**: Sistem kompleks dengan struktur data bersarang

API ini memberikan solusi interoperabilitas secara efektif dengan menerapkan logika bisnis seperti pemberian diskon dan penambahan label rekomendasi produk.

---

## Tujuan Proyek

Melalui pembuatan API Jabir LEAD INTEGRATOR API ini, saya memiliki tujuan untuk:

* Mengimplementasikan REST API berbasis JSON sebagai integrator data dari 3 vendor
* Menormalisasi format data yang berbeda-beda dari berbagai vendor ke dalam format standar
* Menerapkan konsep interoperabilitas antar sistem vendor
* Menerapkan logika bisnis standar seperti diskon dan rekomendasi
* Menyediakan endpoint siap konsumsi untuk aplikasi marketplace

---

## Arsitektur dan Komponen Utama

Proyek ini dibangun menggunakan Node.js dengan Express.js sebagai framework utama. Berikut komponen utama sistem:

### 1. Kelas VendorDataNormalizer

Kelas inti yang berfungsi untuk menormalisasi data dari berbagai vendor ke dalam format standar marketplace. Kelas ini menerapkan semua logika bisnis yang diperlukan.

### 2. Fungsi-Fungsi Pengambil Data (Fetcher)

Fungsi asinkron untuk mengambil data dari masing-masing API vendor secara aman dengan penanganan error.

### 3. Middleware dan Penanganan Error

Sistem yang menangani error dan mengatur alur permintaan HTTP agar aplikasi tetap stabil.

---

## Peran Saya sebagai Lead Integrator

Sesuai dengan soal UAS, saya berperan sebagai **Lead Integrator (Mahasiswa 4)** dengan ketentuan:

* Mengintegrasikan data dari 3 vendor berbeda (A, B, C)
* Menstandarisasi format data ke format marketplace
* Menerapkan logika bisnis standar
* Menyediakan endpoint siap konsumsi

### Format Data Standar Marketplace

```
[
  {
    "id": "A001",
    "nama": "Kopi Bubuk 100g",
    "harga_final": 13500,
    "status": "Tersedia",
    "sumber": "Vendor A"
  }
]
```

Struktur ini diterapkan secara konsisten oleh sistem normalisasi untuk memastikan data mudah digunakan oleh frontend dan sistem lain.

---

## Persiapan dan Pembuatan Proyek

Saya membuat proyek backend menggunakan Node.js dan Express.js, serta menyiapkan struktur dasar API. Berikut persiapan dalam pembuatan proyek:

### Inisialisasi Proyek

```bash
npm init -y
```

### Instalasi Dependensi

```bash
npm install express cors dotenv
```

Dependensi tersebut digunakan untuk:

* membuat REST API (Express),
* mengizinkan permintaan lintas domain (CORS),
* memuat variabel lingkungan dari file .env (dotenv).

---

## Logika Bisnis dan Transformasi Data

Sistem menerapkan logika bisnis yang berbeda-beda untuk masing-masing vendor:

### 1. Transformasi Vendor A (Warung Legacy)

* Konversi harga dari string ke integer
* Penerapan diskon otomatis 10%
* Konversi status stok (`ada`/`habis`) menjadi (`Tersedia`/`Habis`)
* Field mapping: `kd_produk` → `id`, `nm_brg` → `nama`, `hrg` → `harga_final`

### 2. Transformasi Vendor B (Distro Modern)

* Konversi harga menjadi integer
* Konversi boolean `isAvailable` menjadi `Tersedia`/`Habis`
* Field mapping: `sku` → `id`, `productName` → `nama`, `price` → `harga_final`

### 3. Transformasi Vendor C (Resto & Kuliner)

* Penjumlahan harga pokok dan pajak untuk mendapatkan `harga_final`
* Pemberian label `(Recommended)` untuk produk dengan kategori "Food"
* Konversi jumlah stok menjadi status `Tersedia`/`Habis`
* Field mapping dari struktur bersarang: `details.name` → `nama`, `pricing.base_price + pricing.tax` → `harga_final`

---

## Fitur API dan Penjelasan Route

### GET `/api/products`

Endpoint utama untuk mendapatkan semua produk terintegrasi dari ketiga vendor.

Logika:

* Endpoint bersifat publik
* Mengambil data dari ketiga vendor secara paralel
* Menormalisasi semua data ke format standar
* Mengembalikan data terpadu dengan metadata

Contoh response:

```
{
  "success": true,
  "data": [
    {
      "id": "A001",
      "nama": "Kopi Bubuk 100g",
      "harga_final": 13500,
      "status": "Tersedia",
      "sumber": "Vendor A"
    }
  ],
  "count": 1,
  "sources": {
    "vendorA": 5,
    "vendorB": 3,
    "vendorC": 0
  }
}
```

---

### GET `/health`

Endpoint untuk pengecekan kesehatan layanan.

Logika:

* Memberikan informasi bahwa layanan berjalan
* Menampilkan waktu terakhir permintaan

Response:
```
{
  "status": "OK",
  "message": "Banyuwangi Marketplace Integration Service is running",
  "timestamp": "2025-12-21T00:00:00.000Z"
}
```

---

## Konfigurasi Environment Variables

Layanan ini menggunakan environment variables untuk menyimpan konfigurasi API endpoint vendor:

* `VENDOR_A_API` - Alamat API Vendor A
* `VENDOR_B_API` - Alamat API Vendor B
* `VENDOR_C_API` - Alamat API Vendor C
* `PORT` - Port server (default: 3000)

Pastikan semua variabel ini sudah diset sebelum menjalankan aplikasi.

---

## Implementasi dan Testing

Sistem dilengkapi dengan unit testing untuk memastikan fungsi-fungsi normalisasi bekerja sesuai harapan. Terdapat file `test.js` yang mencakup:

* Testing transformasi data Vendor A (termasuk penerapan diskon 10%)
* Testing transformasi data Vendor B
* Testing transformasi data Vendor C (termasuk label makanan)
* Testing integrasi seluruh vendor

Selain itu, file `test_integration.js` menyediakan testing endpoint secara utuh menggunakan Supertest.

---

## Kesesuaian dengan Perintah Soal

Sebagai Lead Integrator (Mahasiswa 4), saya memastikan bahwa saya telah memenuhi seluruh kriteria perintah pada soal seperti:

* Mengintegrasikan data dari 3 vendor berbeda (A, B, C)
* Menstandardisasi format data yang berbeda-beda
* Menggunakan REST API berbasis Node.js dan Express
* Menyediakan endpoint siap konsumsi
* Menerapkan logika bisnis seperti diskon dan rekomendasi

API ini dapat langsung digunakan oleh sistem frontend sebagai sumber data marketplace terpadu.

---

## Alur Bisnis API

1. Layanan dimulai dan menunggu permintaan
2. Saat endpoint `/api/products` diakses, sistem mengambil data dari ketiga vendor API
3. Data mentah dari vendor dinormalisasi ke format standar marketplace
4. Logika bisnis diterapkan (diskon untuk Vendor A, label untuk produk makanan Vendor C)
5. Semua data terintegrasi dikembalikan dalam satu format yang konsisten
6. Sistem juga menyediakan informasi tentang jumlah produk dari masing-masing vendor

---

## Teknologi yang Digunakan

* **Node.js**: Runtime JavaScript untuk eksekusi server-side
* **Express.js**: Framework web untuk membuat REST API
* **Fetch API**: Built-in untuk melakukan HTTP requests ke vendor API
* **CORS**: Middleware untuk mengizinkan permintaan lintas domain
* **dotenv**: Manajemen environment variables

---

## Kesimpulan

Melalui proyek API ini, saya berhasil membangun sebuah sistem integrasi yang sesuai dengan peran yang saya dapatkan yaitu **Lead Integrator (Mahasiswa 4)**. Sistem ini mampu menormalisasi data dari berbagai format ke dalam satu struktur standar dengan menerapkan logika bisnis yang relevan.

Arsitektur yang dirancang memungkinkan skalabilitas dan pemeliharaan mudah. Penerapan prinsip-prinsip interoperabilitas berhasil dicapai dengan mengintegrasikan data dari ketiga vendor yang memiliki struktur dan format berbeda. API yang saya buat telah memenuhi seluruh ketentuan soal dan siap digunakan oleh sistem marketplace yang lebih besar.
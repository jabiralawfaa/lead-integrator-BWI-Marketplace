/**
 * Banyuwangi Marketplace Integration Service
 *
 * Layanan integrasi ini bertugas untuk menggabungkan data produk dari berbagai vendor
 * yang memiliki format data berbeda-beda menjadi satu format standar untuk Marketplace Banyuwangi.
 *
 * Layanan ini mengintegrasikan data dari 3 vendor:
 * - Vendor A (Warung): Sistem lama, semua tipe data string termasuk harga
 * - Vendor B (Distro Modern): Sistem modern dengan format standar internasional
 * - Vendor C (Resto & Kuliner): Sistem kompleks dengan struktur bersarang
 */

require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');

// Validate required environment variables
const requiredEnvVars = ['VENDOR_A_API', 'VENDOR_B_API', 'VENDOR_C_API'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Inisialisasi aplikasi Express
const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi middleware
app.use(cors()); // Mengizinkan permintaan dari domain manapun
app.use(express.json()); // Memungkinkan parsing JSON dari body permintaan

/**
 * Kelas VendorDataNormalizer - Layanan inti untuk integrasi data
 * 
 * Kelas ini berfungsi untuk menormalisasi data dari berbagai vendor ke dalam format standar
 * yang digunakan oleh Marketplace Banyuwangi. Kelas ini menerapkan semua logika bisnis
 * yang diperlukan seperti pemberian diskon dan penambahan label rekomendasi.
 */
class VendorDataNormalizer {
  /**
   * Menormalisasi data dari Vendor A (Warung Legacy)
   *
   * Bayangkan Vendor A ini kayak orang tua yang masih pake uang recehan dan kertas semua itemnya.
   * Segala sesuatu disimpen dalam bentuk teks (string), termasuk harga!
   * Fungsi ini ibaratkan translator yang ngebantu ngubah semua ke bentuk normal,
   * plus kasih diskon 10% kayak ada program loyalitas khusus.
   *
   * @param {Array} data - Array objek produk dalam format Vendor A
   * @returns {Array} - Array objek produk dalam format standar
   */
  static normalizeVendorA(data) {
    return data.map(item => {
      // Konversi harga dari string ke integer dan terapkan diskon 10% untuk Vendor A
      const originalPrice = parseInt(item.hrg || "0", 10);
      const discountedPrice = Math.floor(originalPrice * 0.9); // Diskon 10%

      return {
        id: item.kd_produk || "",           // Kode produk dari Vendor A
        nama: item.nm_brg || "",           // Nama barang dari Vendor A
        harga_final: discountedPrice,      // Harga setelah diskon, konversi ke integer
        status: item.ket_stok === "ada" ? "Tersedia" : "Habis", // Konversi status ke format standar
        sumber: "Vendor A"                 // Identifikasi sumber data
      };
    });
  }

  /**
   * Menormalisasi data dari Vendor B (Distro Modern)
   *
   * Ini kayak anak muda urban yang udah pake format internasional.
   * Semuanya rapi, pake bahasa Inggris dan tipenya udah bener.
   * Fungsi ini tinggal ngubah sedikit aja biar sesuai dengan standar kita.
   *
   * @param {Array} data - Array objek produk dalam format Vendor B
   * @returns {Array} - Array objek produk dalam format standar
   */
  static normalizeVendorB(data) {
    return data.map(item => {
      return {
        id: item.sku || "",                    // SKU produk dari Vendor B
        nama: item.productname || "",          // Nama produk dari Vendor B (lowercase based on actual API)
        harga_final: parseInt(item.price || 0), // Konversi harga ke integer
        status: item.isavailable ? "Tersedia" : "Habis", // Konversi boolean ke format standar (lowercase based on actual API)
        sumber: "Vendor B"                     // Identifikasi sumber data
      };
    });
  }

  /**
   * Menormalisasi data dari Vendor C (Resto & Kuliner)
   *
   * Vendor C ini kayak orang yang terlalu detail, datanya bersarang2 gitu.
   * Harga dipisah dari pajak, jadi kita harus jumlahin dulu kayak ngitung total makanan + pajak.
   * Plus kalo produknya makanan, kita tambahin label '(Recommended)' biar keliatan mantep.
   *
   * @param {Array} data - Array objek produk dalam format Vendor C
   * @returns {Array} - Array objek produk dalam format standar
   */
  static normalizeVendorC(data) {
    return data.map(item => {
      // Handle field names with spaces (like " id ", " details ", etc.)
      const id = item.id || item[' id '] || '';
      const details = item.details || item[' details '] || {};
      const pricing = item.pricing || item[' pricing '] || {};

      // Extract base price and tax from pricing object, handling possible spacing
      const basePrice = pricing.base_price || pricing[' base_price '] || 0;
      const tax = pricing.tax || pricing[' tax '] || 0;
      const finalPrice = basePrice + tax;       // Harga akhir

      // Extract category and name, handling possible spacing in nested objects
      const category = (details.category || details[' category '] || '').trim();
      let name = (details.name || details[' name '] || '').trim();

      // Tambahkan label (Recommended) jika kategori adalah "Food"
      if (category.toLowerCase() === "food") {
        name = `${name} (Recommended)`;         // Tambahkan label untuk produk makanan
      }

      return {
        id: String(id),                         // Konversi ID ke string
        nama: name,                             // Nama produk (mungkin dengan label rekomendasi)
        harga_final: parseInt(finalPrice),      // Pastikan harga dalam bentuk integer
        status: ((item.stock || item[' stock ']) && (item.stock || item[' stock ']) > 0) ? "Tersedia" : "Habis", // Konversi stok ke status
        sumber: "Vendor C"                      // Identifikasi sumber data
      };
    });
  }

  /**
   * Mengintegrasikan data dari ketiga vendor ke dalam satu format terpadu
   *
   * Fungsi ini kayak chef yang ngebikin menu komplit.
   * Ambil semua produk dari ketiga vendor, udah dinormalisasi dulu,
   * trus digabung jadi satu kesatuan yang siap disajikan ke marketplace.
   *
   * @param {Array} vendorAData - Data produk dari Vendor A
   * @param {Array} vendorBData - Data produk dari Vendor B
   * @param {Array} vendorCData - Data produk dari Vendor C
   * @returns {Array} - Array terpadu dari semua produk dalam format standar
   */
  static integrateAllVendors(vendorAData, vendorBData, vendorCData) {
    const allNormalizedData = [];
    
    // Proses data dari masing-masing vendor dan tambahkan ke array gabungan
    allNormalizedData.push(...this.normalizeVendorA(vendorAData));
    allNormalizedData.push(...this.normalizeVendorB(vendorBData));
    allNormalizedData.push(...this.normalizeVendorC(vendorCData));
    
    return allNormalizedData;
  }
}

/**
 * Fungsi untuk mengambil data dari API Vendor A
 *
 * Ini kayak mampir ke warung langganan buat liat stok barangnya.
 * Kita hubungi warungnya, kalo ada yang error ya kita tetep bawa pulang hasilnya (meskipun kosong).
 *
 * @returns {Promise<Array>} - Promise yang mengembalikan array produk atau array kosong jika gagal
 */
async function fetchVendorAData() {
  try {
    // Mengambil data dari API Vendor A menggunakan environment variable
    const response = await fetch(process.env.VENDOR_A_API);
    if (!response.ok) {
      // Jika permintaan API gagal, lempar error
      throw new Error(`Vendor A API error: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : []; // Kembalikan data jika array, jika tidak kembalikan array kosong
  } catch (error) {
    // Log error ke konsol jika terjadi kesalahan
    console.error('Error fetching Vendor A data:', error);
    return []; // Kembalikan array kosong jika terjadi error
  }
}

/**
 * Fungsi untuk mengambil data dari API Vendor B
 *
 * Ini kayak kita mampir ke toko baju buat liat barang-barangnya.
 * Kita ambil semua produk dari API Dino Clothes, kalo ada error ya kita return kosong aja.
 *
 * @returns {Promise<Array>} - Promise yang mengembalikan array produk atau array kosong jika gagal
 */
async function fetchVendorBData() {
  try {
    // Gunakan endpoint produk yang benar berdasarkan pengujian langsung dari environment variable
    const response = await fetch(process.env.VENDOR_B_API);
    if (!response.ok) {
      throw new Error(`Vendor B API error: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    // Log error ke konsol jika terjadi kesalahan
    console.error('Error fetching Vendor B data:', error);
    return []; // Kembalikan array kosong jika terjadi error
  }
}

/**
 * Fungsi untuk mengambil data dari API Vendor C
 *
 * Ini kayak mampir ke resto buat liat menu makanannya.
 * Kita ambil semua menu dari resto, kalo ada error ya kita pulang dengan tangan kosong.
 *
 * @returns {Promise<Array>} - Promise yang mengembalikan array produk atau array kosong jika gagal
 */
async function fetchVendorCData() {
  try {
    // Mengambil data dari API Vendor C menggunakan environment variable
    const response = await fetch(process.env.VENDOR_C_API);
    if (!response.ok) {
      // Jika permintaan API gagal, lempar error
      throw new Error(`Vendor C API error: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : []; // Kembalikan data jika array, jika tidak kembalikan array kosong
  } catch (error) {
    // Log error ke konsol jika terjadi kesalahan
    console.error('Error fetching Vendor C data:', error);
    return []; // Kembalikan array kosong jika terjadi error
  }
}

// Rute-rute API untuk layanan integrasi

// Endpoint utama untuk mendapatkan semua produk terintegrasi
// Ini kayak pasar raya, semua barang dari berbagai toko digabung jadi satu
app.get('/api/products', async (req, res) => {
  try {
    // Ambil data dari API vendor aktual secara paralel untuk efisiensi
    // Kita jemput barang dari ketiga toko sekaligus biar cepet
    const [vendorAData, vendorBData, vendorCData] = await Promise.all([
      fetchVendorAData(),    // Ambil data dari Vendor A
      fetchVendorBData(),     // Ambil data dari Vendor B
      fetchVendorCData()      // Ambil data dari Vendor C
    ]);

    // Integrasi semua data dari ketiga vendor ke dalam format standar
    // Kayak ngegabungin semua barang ke dalam satu katalog
    const normalizedData = VendorDataNormalizer.integrateAllVendors(
      vendorAData,
      vendorBData,
      vendorCData
    );

    // Kembalikan data terintegrasi dalam format standar
    res.json({
      success: true,                    // Status sukses
      data: normalizedData,             // Data produk terintegrasi
      count: normalizedData.length,     // Jumlah total produk
      sources: {                        // Jumlah produk dari masing-masing vendor
        vendorA: vendorAData.length,
        vendorB: vendorBData.length,
        vendorC: vendorCData.length
      }
    });
  } catch (error) {
    // Tangani kesalahan saat normalisasi data
    res.status(500).json({
      success: false,
      message: "Error normalizing vendor data",
      error: error.message
    });
  }
});


// Endpoint untuk pengecekan kesehatan layanan
// Kayak nanya "Masih hidup ga nih servernya?"
app.get('/health', (req, res) => {
  // Kembalikan status kesehatan layanan
  res.json({
    status: 'OK',
    message: 'Banyuwangi Marketplace Integration Service is running',
    timestamp: new Date().toISOString()  // Waktu saat permintaan
  });
});

// Middleware untuk penanganan error
app.use((err, req, res, next) => {
  // Log error ke konsol untuk debugging
  console.error(err.stack);
  // Kembalikan respons error dalam format standar
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}  // Sembunyikan detail error di produksi
  });
});

// Handler untuk rute 404 (tidak ditemukan)
app.use('*', (req, res) => {
  // Kembalikan error 404 jika rute tidak ditemukan
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Ekspor aplikasi dan kelas VendorDataNormalizer untuk keperluan testing
module.exports = { app, VendorDataNormalizer };

// Hanya mulai server jika file ini dijalankan secara langsung, bukan diimpor
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Banyuwangi Marketplace Integration Service is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API endpoint: http://localhost:${PORT}/api/products`);
  });
}

// Untuk kompatibilitas Vercel, tambahkan juga sebagai default export
module.exports.default = app;

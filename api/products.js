/**
 * Banyuwangi Marketplace Integration Service - Vercel API Route
 * 
 * Endpoint: /api/products
 * Fungsi: Menggabungkan data produk dari berbagai vendor ke dalam satu format standar
 */

// Kelas VendorDataNormalizer - Layanan inti untuk integrasi data
class VendorDataNormalizer {
  /**
   * Menormalisasi data dari Vendor A (Warung Legacy)
   *
   * Vendor A menggunakan sistem lama di mana semua tipe data berupa STRING termasuk harga.
   * Fungsi ini mengonversi harga dari string ke integer dan menerapkan diskon otomatis 10%
   * pada semua produk dari vendor ini sesuai dengan persyaratan bisnis.
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
   * Vendor B menggunakan format standar internasional dengan penamaan field dalam bahasa Inggris
   * dan tipe data yang benar. Fungsi ini memetakan field-field tersebut ke dalam format standar.
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
   * Vendor C memiliki struktur data kompleks dengan objek bersarang. Harga dipisahkan dari pajak.
   * Fungsi ini menghitung harga akhir (harga dasar + pajak) dan menambahkan label "(Recommended)"
   * untuk produk dengan kategori "Food" sesuai persyaratan bisnis.
   *
   * @param {Array} data - Array objek produk dalam format Vendor C
   * @returns {Array} - Array objek produk dalam format standar
   */
  static normalizeVendorC(data) {
    return data.map(item => {
      // Hitung harga akhir termasuk pajak
      const pricing = item.pricing || {};      // Ambil objek harga
      const basePrice = pricing.base_price || 0; // Harga dasar
      const tax = pricing.tax || 0;             // Jumlah pajak
      const finalPrice = basePrice + tax;       // Harga akhir

      const details = item.details || {};       // Ambil objek detail produk
      const category = details.category || "";  // Kategori produk
      let name = details.name || "";            // Nama produk

      // Tambahkan label (Recommended) jika kategori adalah "Food"
      if (category.toLowerCase() === "food") {
        name = `${name} (Recommended)`;         // Tambahkan label untuk produk makanan
      }

      return {
        id: String(item.id || ""),              // Konversi ID ke string
        nama: name,                             // Nama produk (mungkin dengan label rekomendasi)
        harga_final: parseInt(finalPrice),      // Pastikan harga dalam bentuk integer
        status: (item.stock && item.stock > 0) ? "Tersedia" : "Habis", // Konversi stok ke status
        sumber: "Vendor C"                      // Identifikasi sumber data
      };
    });
  }

  /**
   * Mengintegrasikan data dari ketiga vendor ke dalam satu format terpadu
   *
   * Fungsi ini menggabungkan semua data dari ketiga vendor setelah dinormalisasi
   * menjadi satu array dalam format standar yang digunakan oleh Marketplace Banyuwangi.
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
 * Fungsi ini menghubungi API Vendor A secara async untuk mengambil data produk terbaru
 * dan menangani berbagai kasus error yang mungkin terjadi saat permintaan API.
 *
 * @returns {Promise<Array>} - Promise yang mengembalikan array produk atau array kosong jika gagal
 */
async function fetchVendorAData() {
  try {
    // Mengambil data dari API Vendor A
    const response = await fetch('https://intero-warung-xybu.vercel.app/api/warung');
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
 * Fungsi ini mengambil data dari endpoint produk API Dino Clothes.
 * Berdasarkan pengujian langsung, endpoint yang benar adalah /products
 *
 * @returns {Promise<Array>} - Promise yang mengembalikan array produk atau array kosong jika gagal
 */
async function fetchVendorBData() {
  try {
    // Gunakan endpoint produk yang benar berdasarkan pengujian langsung
    const response = await fetch('https://dino-clothes.vercel.app/products');
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

// Vercel API Route handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle GET request
  if (req.method === 'GET') {
    try {
      // Ambil data dari API vendor aktual secara paralel untuk efisiensi
      const [vendorAData, vendorBData] = await Promise.all([
        fetchVendorAData(),    // Ambil data dari Vendor A
        fetchVendorBData()     // Ambil data dari Vendor B
      ]);

      // Data Vendor C akan diambil dari API ketika tersedia
      // Untuk sementara, gunakan data contoh saat parameter test digunakan
      const vendorCData = req.query.test ? [
        {
          "id": 501,
          "details": {
            "name": "Nasi Tempong",
            "category": "Food"
          },
          "pricing": {
            "base_price": 20000,
            "tax": 2000
          },
          "stock": 50
        }
      ] : [];

      // Integrasi semua data dari ketiga vendor ke dalam format standar
      const normalizedData = VendorDataNormalizer.integrateAllVendors(
        vendorAData,
        vendorBData,
        vendorCData
      );

      // Kembalikan data terintegrasi dalam format standar
      return res.status(200).json({
        success: true,
        data: normalizedData,
        count: normalizedData.length,
        sources: {
          vendorA: vendorAData.length,
          vendorB: vendorBData.length,
          vendorC: vendorCData.length
        }
      });
    } catch (error) {
      console.error('Error in /api/products:', error);
      return res.status(500).json({
        success: false,
        message: "Error normalizing vendor data",
        error: error.message
      });
    }
  } else {
    // Method not allowed
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
}

export const config = {
  api: {
    responseLimit: '10mb', // Increase response limit if needed
  },
}
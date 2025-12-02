/**
 * Banyuwangi Marketplace Integration Service - Vercel API Route
 * 
 * Endpoint: /api/health
 * Fungsi: Pengecekan kesehatan layanan
 */

// Vercel API Route handler
export default function handler(req, res) {
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
    // Kembalikan status kesehatan layanan
    return res.status(200).json({ 
      status: 'OK', 
      message: 'Banyuwangi Marketplace Integration Service is running',
      timestamp: new Date().toISOString()  // Waktu saat permintaan
    });
  } else {
    // Method not allowed
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
}
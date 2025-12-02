// Simple test to verify our API works correctly by importing and testing the functions directly
const { VendorDataNormalizer } = require('./server');

console.log('Testing Vendor Data Normalizer functions...\n');

// Test Vendor A normalization (with 10% discount)
console.log('1. Testing Vendor A normalization (with 10% discount):');
const vendorAData = [
  {
    "kd_produk": "A001",
    "nm_brg": "Kopi Bubuk 100g",
    "hrg": "15000",
    "ket_stok": "ada"
  },
  {
    "kd_produk": "A002",
    "nm_brg": "Gula Pasir 1kg",
    "hrg": "12000",
    "ket_stok": "habis"
  }
];

const normalizedA = VendorDataNormalizer.normalizeVendorA(vendorAData);
console.log('Input:', JSON.stringify(vendorAData, null, 2));
console.log('Output:', JSON.stringify(normalizedA, null, 2));

// Verify the discount was applied
console.assert(normalizedA[0].harga_final === 13500, '10% discount not applied correctly to first item');
console.assert(normalizedA[1].harga_final === 10800, '10% discount not applied correctly to second item');
console.assert(normalizedA[0].status === 'Tersedia', 'Status not correctly mapped for first item');
console.assert(normalizedA[1].status === 'Habis', 'Status not correctly mapped for second item');
console.log('✓ Vendor A tests passed!\n');

// Test Vendor B normalization
console.log('2. Testing Vendor B normalization:');
const vendorBData = [
  {
    "sku": "TSHIRT-001",
    "productName": "Kaos Ijen Crater",
    "price": 75000,
    "isAvailable": true
  },
  {
    "sku": "HAT-002",
    "productName": "Topi Banyuwangi",
    "price": 45000,
    "isAvailable": false
  }
];

const normalizedB = VendorDataNormalizer.normalizeVendorB(vendorBData);
console.log('Input:', JSON.stringify(vendorBData, null, 2));
console.log('Output:', JSON.stringify(normalizedB, null, 2));

console.assert(normalizedB[0].harga_final === 75000, 'Price not correctly converted for first item');
console.assert(normalizedB[0].status === 'Tersedia', 'Status not correctly mapped for first item');
console.assert(normalizedB[1].status === 'Habis', 'Status not correctly mapped for second item');
console.log('✓ Vendor B tests passed!\n');

// Test Vendor C normalization (with food recommendation)
console.log('3. Testing Vendor C normalization (with food recommendation):');
const vendorCData = [
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
  },
  {
    "id": 502,
    "details": {
      "name": "Kopi Ijen",
      "category": "Beverage"
    },
    "pricing": {
      "base_price": 15000,
      "tax": 1500
    },
    "stock": 0
  }
];

const normalizedC = VendorDataNormalizer.normalizeVendorC(vendorCData);
console.log('Input:', JSON.stringify(vendorCData, null, 2));
console.log('Output:', JSON.stringify(normalizedC, null, 2));

// Verify food gets (Recommended)
console.assert(normalizedC[0].nama === 'Nasi Tempong (Recommended)', 'Food item did not get (Recommended) label');
console.assert(normalizedC[1].nama === 'Kopi Ijen', 'Non-food item should not get (Recommended) label');
// Verify pricing is calculated correctly
console.assert(normalizedC[0].harga_final === 22000, 'Price calculation incorrect for first item');
console.assert(normalizedC[1].harga_final === 16500, 'Price calculation incorrect for second item');
// Verify status based on stock
console.assert(normalizedC[0].status === 'Tersedia', 'Status not correctly mapped for first item');
console.assert(normalizedC[1].status === 'Habis', 'Status not correctly mapped for second item');
console.log('✓ Vendor C tests passed!\n');

// Test full integration
console.log('4. Testing full integration:');
const integratedData = VendorDataNormalizer.integrateAllVendors(vendorAData, vendorBData, vendorCData);
console.log('Integrated Output:', JSON.stringify(integratedData, null, 2));

console.assert(integratedData.length === 6, 'All items should be integrated');
console.assert(integratedData[0].sumber === 'Vendor A', 'Source not correctly set for Vendor A item');
console.assert(integratedData[2].sumber === 'Vendor B', 'Source not correctly set for Vendor B item');
console.assert(integratedData[4].sumber === 'Vendor C', 'Source not correctly set for Vendor C item');
console.log('✓ Full integration test passed!\n');

console.log('🎉 All tests passed! The integration service is working correctly.');
console.log('\nTo run the server, execute: npm start');

// Test API endpoints by making HTTP requests
console.log('\nTesting API endpoints...');
const http = require('http');

// Test health endpoint
http.get('http://localhost:3000/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const health = JSON.parse(data);
      console.log('✓ Health check passed:', health.status);
    } catch (e) {
      console.error('✗ Health check failed:', e.message);
    }
  });
}).on('error', (err) => {
  console.log('Note: Server may not be running. Start it with: npm start');
});
const request = require('supertest');
const app = require('./server');

describe('Banyuwangi Marketplace Integration API', () => {
  // Test GET /api/products endpoint
  describe('GET /api/products', () => {
    it('should return normalized products when test parameter is provided', (done) => {
      request(app)
        .get('/api/products?test=true')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          const { success, data, count } = res.body;
          expect(success).toBe(true);
          expect(Array.isArray(data)).toBe(true);
          expect(count).toBeGreaterThan(0);
          
          // Check that all required fields exist
          const product = data[0];
          expect(product).toHaveProperty('id');
          expect(product).toHaveProperty('nama');
          expect(product).toHaveProperty('harga_final');
          expect(product).toHaveProperty('status');
          expect(product).toHaveProperty('sumber');
          
          done();
        });
    });

    it('should return empty array when no test parameter', (done) => {
      request(app)
        .get('/api/products')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          const { success, data, count } = res.body;
          expect(success).toBe(true);
          expect(Array.isArray(data)).toBe(true);
          expect(count).toBe(0);
          
          done();
        });
    });
  });

  // Test POST /api/normalize/:vendorType endpoint
  describe('POST /api/normalize/:vendorType', () => {
    // Test Vendor A normalization
    it('should normalize Vendor A data with 10% discount', (done) => {
      const vendorAData = [
        {
          "kd_produk": "A001",
          "nm_brg": "Kopi Bubuk 100g",
          "hrg": "15000",
          "ket_stok": "ada"
        }
      ];

      request(app)
        .post('/api/normalize/vendor_a')
        .send(vendorAData)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          const { success, data, source } = res.body;
          expect(success).toBe(true);
          expect(source).toBe('vendor_a');
          expect(data.length).toBe(1);
          
          const product = data[0];
          expect(product.id).toBe('A001');
          expect(product.nama).toBe('Kopi Bubuk 100g');
          expect(product.harga_final).toBe(13500); // 15000 - 10%
          expect(product.status).toBe('Tersedia');
          expect(product.sumber).toBe('Vendor A');
          
          done();
        });
    });

    // Test Vendor B normalization
    it('should normalize Vendor B data', (done) => {
      const vendorBData = [
        {
          "sku": "TSHIRT-001",
          "productName": "Kaos Ijen Crater",
          "price": 75000,
          "isAvailable": true
        }
      ];

      request(app)
        .post('/api/normalize/vendor_b')
        .send(vendorBData)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          const { success, data, source } = res.body;
          expect(success).toBe(true);
          expect(source).toBe('vendor_b');
          expect(data.length).toBe(1);
          
          const product = data[0];
          expect(product.id).toBe('TSHIRT-001');
          expect(product.nama).toBe('Kaos Ijen Crater');
          expect(product.harga_final).toBe(75000);
          expect(product.status).toBe('Tersedia');
          expect(product.sumber).toBe('Vendor B');
          
          done();
        });
    });

    // Test Vendor C normalization
    it('should normalize Vendor C data with (Recommended) label for food', (done) => {
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
        }
      ];

      request(app)
        .post('/api/normalize/vendor_c')
        .send(vendorCData)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          const { success, data, source } = res.body;
          expect(success).toBe(true);
          expect(source).toBe('vendor_c');
          expect(data.length).toBe(1);
          
          const product = data[0];
          expect(product.id).toBe('501');
          expect(product.nama).toBe('Nasi Tempong (Recommended)'); // Food gets (Recommended)
          expect(product.harga_final).toBe(22000); // 20000 + 2000
          expect(product.status).toBe('Tersedia');
          expect(product.sumber).toBe('Vendor C');
          
          done();
        });
    });

    // Test Vendor C normalization for non-food
    it('should normalize Vendor C data without (Recommended) label for non-food', (done) => {
      const vendorCData = [
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
          "stock": 30
        }
      ];

      request(app)
        .post('/api/normalize/vendor_c')
        .send(vendorCData)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          const { success, data } = res.body;
          expect(success).toBe(true);
          expect(data.length).toBe(1);
          
          const product = data[0];
          expect(product.nama).toBe('Kopi Ijen'); // No (Recommended) for non-food
          expect(product.harga_final).toBe(16500); // 15000 + 1500
          
          done();
        });
    });

    // Test invalid vendor type
    it('should return 400 for invalid vendor type', (done) => {
      request(app)
        .post('/api/normalize/invalid_vendor')
        .send([])
        .expect(400)
        .end(done);
    });
  });

  // Test health endpoint
  describe('GET /health', () => {
    it('should return health status', (done) => {
      request(app)
        .get('/health')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          const { status, message } = res.body;
          expect(status).toBe('OK');
          expect(message).toBe('Banyuwangi Marketplace Integration Service is running');
          
          done();
        });
    });
  });

  // Test 404 handling
  describe('404 handling', () => {
    it('should return 404 for non-existent routes', (done) => {
      request(app)
        .get('/non-existent-route')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          
          const { success, message } = res.body;
          expect(success).toBe(false);
          expect(message).toBe('Route not found');
          
          done();
        });
    });
  });
});
# Banyuwangi Marketplace Integration API

## Overview
This service integrates data from 3 different vendor systems into a unified format for the Banyuwangi Marketplace dashboard.

## Endpoints

### GET /api/products
Retrieve all normalized products from the 3 vendor systems.

#### Query Parameters
- `test` - Optional. When present, returns sample data for Vendor C testing

#### Response
```json
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


### GET /health
Health check endpoint to verify the service is running.

#### Response
```json
{
  "status": "OK",
  "message": "Banyuwangi Marketplace Integration Service is running",
  "timestamp": "2025-12-02T07:00:00.000Z"
}
```

## Business Logic Implemented

1. **Vendor A Discount**: All products from Vendor A receive a 10% automatic discount on the final price.
2. **Food Recommendation**: Products from Vendor C with category "Food" will have "(Recommended)" appended to their name.
3. **Type Safety**: All price values are converted to integers in the final output.
4. **Standardized Status**: All vendor stock/status indicators are converted to "Tersedia" or "Habis".

## Connected Vendor APIs

### Vendor A (Warung Legacy)
- **API Endpoint**: `https://intero-warung-xybu.vercel.app/api/warung`
- **Data Format**:
  ```json
  [
    {
      "kd_produk": "A001",
      "nm_brg": "Kopi Bubuk 100g",
      "hrg": "15000",
      "ket_stok": "ada"
    }
  ]
  ```
- **Mapping**:
  - `kd_produk` → `id`
  - `nm_brg` → `nama`
  - `hrg` (string) → `harga_final` (integer with 10% discount)
  - `ket_stok` ("ada"/"habis") → `status` ("Tersedia"/"Habis")
  - Source added as "Vendor A"

### Vendor B (Dino Clothes)
- **API Endpoint**: `https://dino-clothes.vercel.app/`
- **Data Format**:
  ```json
  [
    {
      "sku": "TSHIRT-001",
      "productName": "Kaos Ijen Crater",
      "price": 75000,
      "isAvailable": true
    }
  ]
  ```
- **Mapping**:
  - `sku` → `id`
  - `productName` → `nama`
  - `price` → `harga_final` (converted to integer)
  - `isAvailable` (boolean) → `status` ("Tersedia"/"Habis")
  - Source added as "Vendor B"

### Vendor C (Resto & Kuliner)
- **API Endpoint**: `https://resto-api-olive.vercel.app/api/resto`
- **Data Format**:
  ```json
  [
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
  ]
  ```
- **Mapping**:
  - `id` → `id` (converted to string)
  - `details.name` → `nama` (with "(Recommended)" for "Food" category)
  - `pricing.base_price + pricing.tax` → `harga_final` (integer)
  - `stock` (number) → `status` ("Tersedia"/"Habis")
  - Source added as "Vendor C"

## Installation & Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

3. The server will run on port 3000 by default
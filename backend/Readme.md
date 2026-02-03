<<<<<<< HEAD
# Statify Backend (Express)

Backend Express untuk membaca file SPSS `.sav` dan membuat `.sav` dari JSON.

- Endpoint berada di router `/api/sav`
- Validasi payload menggunakan Zod
- Upload multipart menggunakan Formidable
- Rate limiting global pada prefix `/api`; CORS dibatasi

Dokumentasi API lengkap: lihat `docs/API.md`.

## Prasyarat
- Node.js 18+
- npm 9+

## Instalasi
=======
# Statify Backend

Backend RESTful API untuk platform analisis data Statify, menyediakan layanan pemrosesan file SPSS (.sav) dan manajemen data statistik.

## 📋 Daftar Isi

- [Gambaran Umum Proyek](#-gambaran-umum-proyek)
- [Persyaratan Sistem](#-persyaratan-sistem)
- [Panduan Instalasi](#-panduan-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Struktur Proyek](#-struktur-proyek)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Panduan Penggunaan](#-panduan-penggunaan)
- [Pengujian](#-pengujian)
- [Deployment](#-deployment)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)
- [Kontak](#-kontak)

## 🎯 Gambaran Umum Proyek

Statify Backend adalah RESTful API yang dirancang untuk:
- **Pemrosesan file SPSS (.sav)**: Upload, parsing, dan ekstraksi data dari file SPSS
- **Manajemen data statistik**: Transformasi dan validasi data variabel
- **Integrasi frontend**: Menyediakan endpoints untuk aplikasi web Statify
- **Keamanan**: Rate limiting dan validasi input yang ketat

### Fitur Utama
- Upload file SPSS (.sav) dengan validasi tipe file
- Parsing otomatis metadata dan data dari file SPSS
- Pembuatan file SPSS baru berdasarkan input JSON
- Validasi input dengan Zod schema
- Rate limiting untuk proteksi API
- Error handling yang komprehensif

## 🖥️ Persyaratan Sistem

### Prasyarat Perangkat Lunak
| Software | Versi Minimum | Catatan |
|----------|---------------|---------|
| Node.js | 18.x.x | Direkomendasikan versi LTS |
| npm | 9.x.x | Sudah termasuk dengan Node.js |
| TypeScript | 5.x.x | Sudah termasuk dalam devDependencies |

### Dependensi Utama
```json
{
  "dependencies": {
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^7.0.0",
    "formidable": "^3.5.2",
    "sav-reader": "^2.0.8",
    "sav-writer": "^1.0.0",
    "zod": "^4.0.17"
  }
}
```

## 🚀 Panduan Instalasi

### 1. Clone Repository
```bash
git clone [repository-url]
cd statify/backend
```

### 2. Install Dependensi
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
```bash
npm install
```

<<<<<<< HEAD
## Skrip
- Dev: `npm run dev` (hot-reload TS via tsx)
- Build: `npm run build` (TypeScript -> dist)
- Start: `npm start` (jalan dari dist)
- Test: `npm test` (Jest)
- Lint: `npm run lint`
- Lint fix: `npm run lint:fix`

## ENV
- `PORT`: default 5000
- `MAX_UPLOAD_SIZE_MB`: default 10
- `TEMP_DIR`:
  - Dev (tsx): `server/temp`
  - Prod/Docker: `dist/temp`
- `DEBUG_SAV` (opsional): aktifkan log debug saat proses `/api/sav/create` di `server/controllers/savController.ts`. Nilai truthy yang diterima: `1`, `true`, `yes`, `on` (tidak peka huruf besar/kecil). Default non-aktif.
- `RATE_LIMIT_ENABLED` (opsional): toggle rate limiting global pada prefix `/api`.
  - Nilai truthy yang diterima: `1`, `true`, `yes`, `on` (tidak peka huruf besar/kecil)
  - Default: aktif. Untuk mematikan saat load testing, set ke `0` atau `false`.

## Quickstart
- Dev: `npm run dev`
- Health: `curl http://localhost:5000/` ⇒ `Backend is running!`
- Router: `curl http://localhost:5000/api/sav/` ⇒ `OK`

## Docker
- Build:
  ```bash
  docker build -f Dockerfile.backend -t statify-backend:latest \
    --build-arg NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000 .
  ```
- Run:
  ```bash
  docker run -p 5000:5000 \
    -e PORT=5000 -e MAX_UPLOAD_SIZE_MB=10 -e TEMP_DIR=/app/backend/temp \
    --name statify-backend statify-backend:latest
  ```
- Catatan: `NEXT_PUBLIC_FRONTEND_URL` ditulis ke `.env` oleh Dockerfile, tetapi backend saat ini hanya memakai `PORT`, `MAX_UPLOAD_SIZE_MB`, `TEMP_DIR`.

## CORS & Rate Limiting
- Origins di `server/config/constants.ts` (hard-coded)
- Rate limit: 100/15 menit; kunci dari header `X-User-Id` (jika ada) atau IP

## Troubleshooting
- 429 Too Many Requests: gunakan `X-User-Id` yang konsisten; lihat header `RateLimit-*`
- 400 Payload tidak valid: cek `issues` dari Zod pada respons

---

# Legacy: SAV writer library docs

Tentu, berikut adalah dokumentasi lengkap untuk library ini, dengan fokus pada tipe data yang dapat disimpan dan parameter-parameternya, berdasarkan file kode yang Anda berikan.

### **Ringkasan Umum**

Library ini adalah utilitas Node.js yang dirancang untuk menulis file data statistik dalam format SPSS (`.sav`). Library ini memungkinkan Anda untuk mendefinisikan variabel (kolom) dengan tipe data, label, dan format tertentu, lalu menulis data baris-demi-baris atau sekaligus ke dalam file `.sav`.

Ada dua cara utama untuk menggunakan library ini:

1.  `saveToFile()`: Fungsi sederhana untuk menyimpan array data JavaScript langsung ke file `.sav`.
2.  `createStream()`: Pendekatan yang lebih canggih untuk membuat `WriteStream` yang dapat Anda gunakan untuk menulis data dalam potongan-potongan (chunks), ideal untuk dataset yang sangat besar.

-----

### **Konsep Inti**

Penggunaan library ini bergantung pada dua konsep utama:

1.  **Variabel (`SavVariable[]`)**: Ini adalah array objek yang mendefinisikan "skema" atau struktur data Anda. Setiap objek dalam array ini mewakili sebuah kolom di file SPSS Anda, lengkap dengan nama, tipe data, label, lebar, dan atribut lainnya.
2.  **Rekaman (`recs: Array<{ [key: string]: any }>`)**: Ini adalah data Anda, yang direpresentasikan sebagai array objek JavaScript. Setiap objek dalam array adalah sebuah baris (rekaman), di mana *key* adalah nama variabel dan *value* adalah data untuk sel tersebut.

-----

## **Dokumentasi API**

### `saveToFile(path, recs, vars)`

Menyimpan satu set data lengkap ke file `.sav` yang ditentukan.

  * **`path`**: `string` - Path file output tempat file `.sav` akan disimpan.
  * **`recs`**: `Array<object>` - Array yang berisi baris data Anda.
  * **`vars`**: `SavVariable[]` - Array konfigurasi variabel yang mendefinisikan setiap kolom.

**Contoh Penggunaan:**

```javascript
const { saveToFile, VariableType, VariableMeasure } = require('./index'); // Sesuaikan path

const variables = [
  { name: 'ID', label: 'ID Responden', type: VariableType.Numeric, decimal: 0 },
  { name: 'Nama', label: 'Nama Lengkap', type: VariableType.String, width: 50 },
  { name: 'TglLahir', label: 'Tanggal Lahir', type: VariableType.Date },
  { 
    name: 'Gender', 
    label: 'Jenis Kelamin', 
    type: VariableType.Numeric,
    measure: VariableMeasure.Nominal,
    valueLabels: [
      { value: 1, label: 'Laki-laki' },
      { value: 2, label: 'Perempuan' }
    ]
  }
];

const records = [
  { ID: 1, Nama: 'Budi Santoso', TglLahir: '25-08-1990', Gender: 1 },
  { ID: 2, Nama: 'Citra Lestari', TglLahir: '12-05-1992', Gender: 2 },
  { ID: 3, Nama: 'Agus Wijaya', TglLahir: '01-01-2000', Gender: 1 }
];

saveToFile('output_data.sav', records, variables);

console.log('File berhasil disimpan!');
```

\<br/\>

### `createStream(options)`

Membuat stream yang dapat ditulis untuk menangani dataset besar.

  * **`options`**: `WriteStreamOptions` - Objek konfigurasi dengan properti berikut:
      * **`path`**: `string` - Path file output.
      * **`variables`**: `SavVariable[]` - Array konfigurasi variabel.
      * **`length`**: `number` - Jumlah total rekaman/baris yang akan ditulis.

Fungsi ini mengembalikan instance `WriteStream` yang memiliki dua metode utama:

  * **`write(records: any[])`**: Menulis sebagian data ke stream.
  * **`end()`**: Menyelesaikan penulisan dan menutup file.

**Contoh Penggunaan:**

```javascript
const { createStream, VariableType } = require('./index'); // Sesuaikan path

const variables = [
    { name: 'LogData', type: VariableType.String, width: 200 }
];

// Asumsikan kita akan menulis 1000 log
const totalRecords = 1000;
const stream = createStream({ path: 'large_log.sav', variables, length: totalRecords });

for (let i = 0; i < totalRecords; i++) {
    stream.write([{ LogData: `Ini adalah log ke-${i + 1}` }]);
}

stream.end().then(() => {
    console.log('Stream selesai, file berhasil disimpan.');
});
```

-----

## **Tipe Data (`VariableType`) dan Parameternya**

Ini adalah bagian terpenting dari konfigurasi Anda. Tipe data didefinisikan dalam enum `VariableType`.

### **`VariableType.Numeric`**

Tipe data untuk angka, baik integer maupun desimal.

  * **Deskripsi**: Digunakan untuk menyimpan nilai numerik.
  * **Input JavaScript yang Diharapkan**: `number`.
  * **Parameter `SavVariable` yang Relevan**:
      * **`width`**: `number` (opsional, default: 8). Lebar total kolom (termasuk titik desimal dan tanda). Harus lebih besar dari `decimal`.
      * **`decimal`**: `number` (opsional, default: 2). Jumlah digit di belakang koma. Harus antara 0 dan 16.
      * **`valueLabels`**: `Array<{value: number, label: string}>` (opsional). Digunakan untuk memberi label pada nilai numerik tertentu (misalnya, `1` = 'Sangat Setuju').

### **`VariableType.String`**

Tipe data untuk teks.

  * **Deskripsi**: Digunakan untuk menyimpan data teks (string).
  * **Input JavaScript yang Diharapkan**: `string`.
  * **Parameter `SavVariable` yang Relevan**:
      * **`width`**: `number` (opsional, default: 8). Jumlah **byte** maksimum yang dapat disimpan. Teks yang lebih panjang akan dipotong secara otomatis. Lebar maksimum adalah 32767.
      * **`valueLabels`**: `Array<{value: string, label: string}>` (opsional). Digunakan untuk memberi label pada nilai string tertentu.

### **`VariableType.Date`**

Tipe data khusus untuk tanggal.

  * **Deskripsi**: Menyimpan nilai tanggal saja.
  * **Input JavaScript yang Diharapkan**: `string` dengan format **`'DD-MM-YYYY'`**. Contoh: `'25-12-2023'`. Nilai yang tidak valid akan disimpan sebagai nilai kosong (system-missing) di SPSS.
  * **Parameter `SavVariable` yang Relevan**:
      * Parameter `width` dan `decimal` diatur secara otomatis (`width: 10`, `decimal: 0`). Anda tidak perlu menentukannya.

### **`VariableType.DateTime`**

Tipe data khusus untuk tanggal dan waktu.

  * **Deskripsi**: Menyimpan nilai tanggal dan waktu.
  * **Input JavaScript yang Diharapkan**: `string` dengan format **`'DD-MM-YYYY HH:mm:SS'`**. Contoh: `'25-12-2023 14:30:00'`. Nilai yang tidak valid akan disimpan sebagai nilai kosong.
  * **Parameter `SavVariable` yang Relevan**:
      * Parameter `width` dan `decimal` diatur secara otomatis (`width: 19`, `decimal: 0`). Anda tidak perlu menentukannya.

-----

## **Antarmuka `SavVariable` (Parameter Lengkap)**

Berikut adalah daftar lengkap semua properti yang dapat Anda tentukan untuk setiap objek variabel.

| Properti | Tipe | Wajib? | Deskripsi |
| :--- | :--- | :--- | :--- |
| **`name`** | `string` | **Ya** | Nama unik variabel. Maksimal 64 karakter dan harus mengikuti aturan penamaan variabel SPSS. |
| **`label`** | `string` | Opsional | Label deskriptif untuk variabel. Jika tidak disediakan, akan menggunakan nilai dari `name`. |
| **`type`** | `VariableType` | **Ya** | Tipe data variabel. Lihat bagian di atas. |
| **`width`** | `number` | Opsional | Lebar kolom. Perilakunya bergantung pada `type`. Defaultnya diatur berdasarkan tipe jika tidak ditentukan. |
| **`decimal`** | `number` | Opsional | Jumlah angka desimal untuk `VariableType.Numeric`. Defaultnya 2. |
| **`alignment`**| `VariableAlignment`| Opsional | Perataan teks/nilai dalam kolom (`Left`, `Right`, `Centre`). Defaultnya `Right`. |
| **`measure`** | `VariableMeasure`| Opsional | Tingkat pengukuran variabel (`Nominal`, `Ordinal`, `Continuous`). Defaultnya `Continuous`. |
| **`columns`** | `number` | Opsional | Lebar kolom seperti yang ditampilkan di SPSS Data View. Biasanya dihitung otomatis. |
| **`valueLabels`**| `Array` | Opsional | Array objek `{ value, label }` untuk memberikan deskripsi pada nilai tertentu. |

-----

## **Enum Tambahan**

Selain `VariableType`, ada juga enum lain yang dapat Anda impor dan gunakan:

### **`VariableAlignment`**

Untuk mengatur perataan kolom.

  * `Left` (0)
  * `Right` (1)
  * `Centre` (2)

### **`VariableMeasure`**

Untuk mengatur skala pengukuran data.

  * `Nominal` (1): Kategori tanpa urutan (contoh: Jenis Kelamin, Agama).
  * `Ordinal` (2): Kategori dengan urutan (contoh: Tingkat Pendidikan, Skala Kepuasan).
  * `Continuous` (3): Data numerik berkelanjutan (contoh: Usia, Tinggi Badan).
=======
### 3. Build Project
```bash
npm run build
```

### 4. Jalankan Server

#### Mode Development (dengan hot reload)
```bash
npm run dev
```

#### Mode Production
```bash
npm run build
npm start
```

Server akan berjalan di `http://localhost:5000`

## ⚙️ Konfigurasi

### File Konfigurasi
Backend menggunakan konfigurasi statis yang terletak di `server/config/constants.ts`

### Variabel Konfigurasi
| Variabel | Default | Deskripsi |
|----------|---------|-----------|
| `PORT` | 5000 | Port untuk server Express |
| `MAX_UPLOAD_SIZE_MB` | 10 | Ukuran maksimum upload file (MB) |
| `RATE_LIMIT_ENABLED` | false | Enable/disable rate limiting |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Jendela waktu rate limit (15 menit) |
| `RATE_LIMIT_MAX` | 100 | Maksimum request per jendela |
| `DEBUG_SAV` | false | Mengaktifkan log debug proses pembuatan SAV |

#### Direktori Sementara
Direktori sementara ditentukan oleh fungsi `getTempDir()` yang mengembalikan `path.join(os.tmpdir(), 'statify')`. Contoh (Windows):

```
C:\\Users\\<user>\\AppData\\Local\\Temp\\statify
```

Catatan: File sementara dibersihkan per-operasi (setelah upload dibaca atau setelah unduhan selesai), tidak ada job pembersihan terjadwal.

### CORS Configuration
```typescript
export const ALLOWED_ORIGINS: string[] = [
  'https://statify-dev.student.stis.ac.id',
  'http://statify-dev.student.stis.ac.id',
  'http://localhost:3001',
  'http://localhost:3000',
];
```

## 📁 Struktur Proyek

```
backend/
├── server/
│   ├── app.ts                 # Express app setup
│   ├── index.ts              # Entry point
│   ├── config/
│   │   └── constants.ts      # Static configuration
│   ├── controllers/
│   │   └── savController.ts  # SAV file controllers
│   ├── routes/
│   │   └── savRoutes.ts      # API routes
│   ├── services/
│   │   └── savService.ts     # Business logic
│   └── types/
│       └── sav.types.ts      # TypeScript definitions
├── docs/
│   └── API.md               # API documentation
├── package.json
├── tsconfig.json
├── jest.config.js
└── eslint.config.mjs
```

## 🌐 API Endpoints

### Base URL
```
http://localhost:5000/api
```

### 1. Upload File SPSS
**Endpoint:** `POST /api/sav/upload`

#### Request
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Body:**
  - `file`: File SPSS (.sav)

#### Response Success (200)
```json
{
  "meta": {
    "header": {
      "n_cases": 150,
      "n_vars": 5
    },
    "sysvars": [
      {
        "name": "age",
        "label": "Age of respondent",
        "type": 0,
        "measurementLevel": "scale"
      }
    ]
  },
  "rows": [
    {
      "age": 25,
      "gender": "Male",
      "income": 50000
    }
  ]
}
```

#### Response Error (400/500)
```json
{
  "error": "Invalid file format or processing error"
}
```

### 2. Create File SPSS
**Endpoint:** `POST /api/sav/create`

#### Request
- **Method:** POST
- **Content-Type:** application/json
- **Body:**
```json
{
  "variables": [
    {
      "name": "age",
      "label": "Age of respondent",
      "type": "NUMERIC",
      "width": 8,
      "decimal": 0,
      "alignment": "right",
      "measure": "continuous",
      "valueLabels": [
        {
          "value": 99,
          "label": "No answer"
        }
      ]
    }
  ],
  "data": [
    {
      "age": 25
    },
    {
      "age": 30
    }
  ]
}
```

#### Response Success (200)
- **Content-Type:** application/octet-stream
- **Body:** Binary file SPSS (.sav)

### 3. Health Check
**Endpoint:** `GET /`

#### Response
```
Backend is running!
```

### 4. API Status Check
**Endpoint:** `GET /api/sav/`

#### Response
```
OK
```

## 🗄️ Database Schema

Backend tidak menggunakan database persistent, namun menggunakan:
- **File system temporary** untuk upload file
- **Memory processing** untuk parsing file SPSS
- **Auto-cleanup** file temporary setelah diproses

### Struktur Data SPSS
#### SavMeta
```typescript
interface SavMeta {
  header?: {
    n_cases?: number;
    n_vars?: number;
  };
  sysvars?: SavSysVar[];
  valueLabels?: SavValueLabelsForVariable[];
}
```

#### SavVariable
```typescript
interface SavVariable {
  name: string;
  label: string;
  type: SPSSVariableType;
  width: number;
  decimal: number;
  alignment: string;
  measure: string;
  columns: number;
  valueLabels?: Array<{
    value: string | number;
    label: string;
  }>;
}
```

## 📖 Panduan Penggunaan

### Contoh Penggunaan dengan cURL

#### Upload File SPSS
```bash
curl -X POST http://localhost:5000/api/sav/upload \
  -F "file=@data.sav" \
  -H "Content-Type: multipart/form-data"
```

#### Create File SPSS
```bash
curl -X POST http://localhost:5000/api/sav/create \
  -H "Content-Type: application/json" \
  -d @variables.json \
  --output output.sav
```

### Contoh dengan JavaScript/Node.js
```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Upload file
const form = new FormData();
form.append('file', fs.createReadStream('./data.sav'));

axios.post('http://localhost:5000/api/sav/upload', form, {
  headers: form.getHeaders()
}).then(response => {
  console.log(response.data);
});

// Create file
const variables = {
  variables: [
    { name: 'test', type: 'NUMERIC', width: 8 }
  ],
  data: [{ test: 123 }]
};

axios.post('http://localhost:5000/api/sav/create', variables, {
  responseType: 'arraybuffer'
}).then(response => {
  fs.writeFileSync('output.sav', response.data);
});
```

## 🧪 Pengujian

### Menjalankan Unit Tests
```bash
# Semua tests
npm test

# Dengan coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Structure
```
__tests__/
├── app.test.ts          # App-level tests
├── controllers/         # Controller tests
├── services/           # Service tests
└── fixtures/           # Test data
```

### Contoh Test Case
```typescript
describe('POST /api/sav/upload', () => {
  it('should upload valid SPSS file', async () => {
    const response = await request(app)
      .post('/api/sav/upload')
      .attach('file', './test-data/valid.sav');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('meta');
    expect(response.body).toHaveProperty('rows');
  });
});
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -f Dockerfile.backend -t statify-backend .

# Run container
docker run -p 5000:5000 statify-backend
```

Jika Anda mengubah nilai di `server/config/constants.ts`, lakukan rebuild image sebelum deploy ulang.

### Mengubah Konfigurasi untuk Production
Konfigurasi backend tidak dibaca dari environment variables. Untuk menyesuaikan port, batas upload, CORS, atau rate limiting:

1. Edit nilai pada `server/config/constants.ts`.
2. Rebuild: `npm run build` (atau rebuild Docker image).
3. Deploy ulang aplikasi/container.

### Deployment Checklist
- [ ] Build production: `npm run build`
- [ ] Test production: `npm test`
- [ ] Setup reverse proxy (nginx)
- [ ] Configure SSL certificates
- [ ] Setup monitoring (PM2)
- [ ] Configure firewall rules

### PM2 Configuration
```javascript
// ecosystem.config.js (contoh minimal)
module.exports = {
  apps: [{
    name: 'statify-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster'
  }]
};
```

## 🤝 Kontribusi

### Pedoman Kontribusi
1. **Fork** repository ini
2. **Create** branch fitur (`git checkout -b feature/AmazingFeature`)
3. **Commit** perubahan (`git commit -m 'Add: AmazingFeature'`)
4. **Push** ke branch (`git push origin feature/AmazingFeature`)
5. **Open** Pull Request

### Code Standards
- Gunakan TypeScript strict mode
- Ikuti ESLint configuration
- Tulis unit tests untuk fitur baru
- Dokumentasikan API endpoints
- Gunakan conventional commits

### Development Workflow
```bash
# Setup development
npm install
npm run dev

# Before commit
npm run lint
npm run test
npm run build
```

## 📄 Lisensi

Proyek ini dilisensikan di bawah **MIT License** - lihat file [LICENSE](../LICENSE) untuk detail.

## 📞 Kontak

### Tim Pengembang
- **Email:** [statify@student.stis.ac.id](mailto:statify@student.stis.ac.id)
- **Website:** [https://statify-dev.student.stis.ac.id](https://statify-dev.student.stis.ac.id)
- **Repository:** [GitHub Repository](https://github.com/your-org/statify)

### Dukungan
Untuk pertanyaan atau masalah teknis:
1. **Issues:** Gunakan GitHub Issues
2. **Discussions:** Gunakan GitHub Discussions
3. **Email:** Hubungi tim pengembang

### Status Proyek
- **Status:** Active Development
- **Versi:** 1.0.0
- **Last Updated:** $(date)

---

**Catatan:** Dokumentasi ini akan diperbarui secara berkala sesuai dengan perkembangan proyek.
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52

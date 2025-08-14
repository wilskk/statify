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
```bash
npm install
```

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
├── temp/                     # Temporary files (auto-cleaned)
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

### Environment Variables Production
```typescript
// Override constants via environment variables
PORT=5000
MAX_UPLOAD_SIZE_MB=50
RATE_LIMIT_ENABLED=true
```

### Deployment Checklist
- [ ] Build production: `npm run build`
- [ ] Test production: `npm test`
- [ ] Setup reverse proxy (nginx)
- [ ] Configure SSL certificates
- [ ] Setup monitoring (PM2)
- [ ] Configure firewall rules

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'statify-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
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
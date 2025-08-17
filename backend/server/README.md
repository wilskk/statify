# Statify Server Documentation

Server backend untuk platform analisis data Statify, menyediakan RESTful API untuk pemrosesan file SPSS (.sav) dan manajemen data statistik.

## 📋 Table of Contents

- [Arsitektur Server](#-arsitektur-server)
- [Struktur Direktori](#-struktur-direktori)
- [Entry Point](#-entry-point)
- [Express Application](#-express-application)
- [Konfigurasi](#-konfigurasi)
- [Controllers](#-controllers)
- [Services](#-services)
- [Routes](#-routes)
- [Types](#-types)
- [Testing](#-testing)
- [Error Handling](#-error-handling)
- [Security](#-security)
- [Performance](#-performance)
- [Development Guide](#-development-guide)

## 🏗️ Arsitektur Server

Server ini dibangun menggunakan pola arsitektur **MVC (Model-View-Controller)** dengan pendekatan service-oriented:

```
┌─────────────────┐
│   Client (FE)   │
└────────┬────────┘
         │ HTTP/HTTPS
┌────────┴────────┐
│   Express.js    │
│   Middleware    │
└────────┬────────┘
         │
┌────────┴────────┐
│   Controllers   │
│   (Handlers)    │
└────────┬────────┘
         │
┌────────┴────────┐
│    Services     │
│  (Business Logic)│
└────────┬────────┘
         │
┌────────┴────────┐
│   SAV Libraries │
│ (sav-reader,    │
│  sav-writer)    │
└─────────────────┘
```

## 📁 Struktur Direktori

```
server/
├── __tests__/                    # Unit tests
│   └── app.test.ts              # App-level tests
├── app.ts                       # Express application setup
├── index.ts                     # Server entry point
├── config/
│   └── constants.ts             # Centralized configuration
├── controllers/
│   ├── __tests__/               # Controller tests
│   │   ├── accidents.sav        # Test file sample
│   │   ├── savController.*.test.ts
│   │   └── savController.unit.test.ts
│   └── savController.ts         # Request handlers
├── routes/
│   └── savRoutes.ts             # API route definitions
├── services/
│   ├── __tests__/               # Service tests
│   │   └── savService.test.ts
│   └── savService.ts            # Business logic layer
└── types/
    ├── external.d.ts            # External type definitions
    └── sav.types.ts             # Core TypeScript types
```

## 🚀 Entry Point

### `index.ts`
Entry point utama server yang menangani:
- Port binding dan server startup
- Error handling pada level server
- Graceful shutdown

```typescript
// Key features:
- Port configuration: menggunakan `PORT` dari `server/config/constants.ts` (tanpa process.env)
- Start: `app.listen(PORT)` di `server/index.ts`
```

## 🌐 Express Application

### `app.ts`
Konfigurasi Express application dengan middleware security dan routing:

#### Security Middleware Stack
```typescript
// 1. Helmet - Security headers
app.use(helmet());

// 2. CORS - Cross-origin resource sharing
app.use(cors({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
}));

// 3. JSON body parsing
app.use(express.json());

// 4. (Opsional) Rate Limiting - API protection pada prefix /api
if (RATE_LIMIT_ENABLED) {
  const apiLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,    // 15 minutes
    max: RATE_LIMIT_MAX,               // 100 requests
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const userIdHeader = req.headers['x-user-id'];
      const id = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;
      return String(id ?? req.ip);
    }
  });
  app.use('/api', apiLimiter);
}
```

#### Routes
- **GET /** - Health check endpoint
- **POST /api/sav/upload** - File upload handler
- **POST /api/sav/create** - Create new SAV file
- **GET /api/sav/** - API status check

## ⚙️ Konfigurasi

### `config/constants.ts`
Konfigurasi statis terpusat:

```typescript
export const PORT: number = 5000;
export const MAX_UPLOAD_SIZE_MB: number = 10;
export const getTempDir = (): string => path.join(os.tmpdir(), 'statify');

// Feature flags
export const RATE_LIMIT_ENABLED: boolean = false; // Nonaktif secara default
export const DEBUG_SAV: boolean = false; // Log detail untuk proses pembuatan SAV

export const ALLOWED_ORIGINS: string[] = [
  'https://statify-dev.student.stis.ac.id',
  'http://statify-dev.student.stis.ac.id',
  'http://localhost:3001',
  'http://localhost:3000',
];

export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 min
export const RATE_LIMIT_MAX = 100;
```

## 🎯 Controllers

### `controllers/savController.ts`
Handler untuk semua operasi SAV file.

#### Upload Handler (`uploadSavFile`)
**Responsibilities:**
- Validasi file upload (format, size)
- Parsing multipart/form-data
- Error handling dan cleanup
- Delegasi ke service layer

**Validation Rules:**
- File extension: `.sav` only
- MIME type: `application/octet-stream` or `application/x-spss-sav`
- Max size: 10MB
- Auto-cleanup on error

#### Create Handler (`createSavFile`)
**Responsibilities:**
- Validasi input JSON dengan Zod schema
- Transformasi variable types
- Generate SAV file dari data JSON
- Stream response sebagai download

#### Helper Functions
- `transformVariable()` - Konversi variable format
- `transformRecord()` - Transformasi data records
- Schema validation dengan Zod

### Controller Testing
Comprehensive test suite mencakup:
- Unit tests untuk helper functions
- Integration tests untuk upload/create
- Error scenario testing
- File validation testing

## 🔧 Services

### `services/savService.ts`
Business logic layer untuk pemrosesan SAV:

#### Core Functions
- `processUploadedSav(filePath: string): Promise<SavResponse>`
  - Membaca file SAV dengan sav-reader
  - Ekstraksi metadata dan data
  - Auto-cleanup temporary files
  - Error handling dengan stack trace

#### Service Features
- Async file processing
- Memory-efficient reading
- Comprehensive error handling
- Automatic resource cleanup

## 🛣️ Routes

### `routes/savRoutes.ts`
Route definitions yang clean dan modular:

```typescript
const router = Router();

router.post('/upload', uploadSavFile);   // File upload
router.post('/create', createSavFile);   // Create SAV
router.get('/', (req, res) => {          // Status check
    res.status(200).send('OK');
});
```

## 📋 Types

### `types/sav.types.ts`
TypeScript definitions yang komprehensif:

#### Core Types
- `SavResponse` - Response structure
- `SavMeta` - Metadata structure
- `SavVariable` - Variable definition
- `VariableInput` - Client input format
- `TransformedVariable` - sav-writer format

#### SPSS Variable Types
```typescript
type SPSSVariableType = 
  'NUMERIC' | 'STRING' | 'DATE' | 'ADATE' | 'EDATE' |
  'SDATE' | 'JDATE' | 'QYR' | 'MOYR' | 'WKYR' |
  'WKDAY' | 'MONTH' | 'DATETIME' | 'TIME' | 'DTIME' |
  'DOLLAR' | 'DOT' | 'COMMA' | 'SCIENTIFIC' | 'CUSTOM_CURRENCY';
```

#### Date Formats
Predefined date formats untuk konsistensi:
- DATE formats (dd-mmm-yyyy, mm/dd/yyyy, etc.)
- DATETIME formats
- TIME formats
- MONTH/DAY formats

## 🧪 Testing

### Test Structure
```
__tests__/
├── app.test.ts              # App-level integration
├── controllers/
│   ├── savController.unit.test.ts
│   ├── savController.upload.integration.test.ts
│   ├── savController.create.integration.test.ts
│   └── fixtures/
│       └── accidents.sav    # Test data
└── services/
    └── savService.test.ts   # Service unit tests
```

### Test Coverage
- **Unit Tests**: Helper functions, validation
- **Integration Tests**: API endpoints, file processing
- **Error Handling**: Invalid inputs, edge cases
- **Performance Tests**: Large file handling

### Running Tests
```bash
# All tests
npm test

# Specific test file
npm test -- savController.unit.test.ts

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 🛡️ Error Handling

### Global Error Handling
Saat ini tidak ada global error middleware yang diregistrasikan di `app.ts`. Error ditangani di level controller/service dan respons terarah dikirimkan (mis. 400, 500). Penambahan middleware global dapat dipertimbangkan ke depan.

### Service Layer Errors
- File read/write errors
- SAV parsing errors
- Memory allocation errors
- Auto-cleanup on failure

### Validation Errors
- Zod schema validation
- File format validation
- Size limit validation
- Content type validation

## 🔒 Security

### Security Features
- **Helmet**: Security headers
- **CORS**: Origin whitelist
- **Rate Limiting**: API protection
- **Input Validation**: Zod schemas
- **File Validation**: Type and size checks

### Security Headers
```typescript
helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
})
```

## ⚡ Performance

### Optimization Strategies
- **Streaming**: Large file processing
- **Memory Management**: Auto-cleanup
- **Caching**: No persistent cache (stateless)
- **Compression**: Not enabled (handled by reverse proxy)

### Performance Monitoring
- Request logging
- Error tracking
- Memory usage monitoring
- Response time tracking

### Resource Limits
- **File Size**: 10MB max upload
- **Memory**: Process-based (no streaming)
- **Temp Storage**: OS temp directory
- **Rate Limit**: 100 req/15min

## 👨‍💻 Development Guide

### Development Setup
```bash
# Clone and setup
git clone [repo]
cd statify/backend
npm install

# Development server
npm run dev

# Build for production
npm run build
npm start
```

### Development Workflow
1. **Code Style**: Follow ESLint rules
2. **Type Checking**: Strict TypeScript
3. **Testing**: Write tests for new features
4. **Documentation**: Update this README
5. **Review**: Code review before merge

### Debug Mode
Aktifkan debug logging dengan mengubah `DEBUG_SAV` menjadi `true` di `server/config/constants.ts`, kemudian rebuild/jalankan ulang.

### Common Development Tasks

#### Adding New Endpoints
1. Define route in `routes/savRoutes.ts`
2. Implement controller in `controllers/savController.ts`
3. Add service method in `services/savService.ts`
4. Write tests in appropriate `__tests__` directory
5. Update API documentation

#### Debugging File Processing
- Cek direktori sementara yang digunakan: `console.log('Temp dir:', getTempDir());`
- Pastikan file sementara terhapus setelah proses selesai. Jika tidak, cek log error di controller/service.

### Static Config Changes (Development)
- Semua konfigurasi runtime berada di `server/config/constants.ts` (tanpa environment variables).
- Untuk mengubah nilai seperti `PORT`, `ALLOWED_ORIGINS`, `RATE_LIMIT_*`, `DEBUG_SAV`, edit file tersebut lalu rebuild (`npm run build`) dan jalankan ulang server.

## 📊 Monitoring & Logging

### Log Levels
- **Error**: Server errors, file processing failures
- **Warn**: Validation warnings, rate limit hits
- **Info**: Server startup, successful operations
- **Debug**: Detailed processing steps (when enabled)

### Health Check
```bash
# Server health
curl http://localhost:5000/

# API health
curl http://localhost:5000/api/sav/
```

### Metrics to Monitor
- **Request Rate**: Requests per second
- **Error Rate**: 4xx/5xx responses
- **Response Time**: P95, P99 latencies
- **Memory Usage**: RSS, heap usage
- **File Processing**: Success/failure rates

## 🔄 Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

Catatan: Backend tidak membaca environment variables untuk konfigurasi runtime. Jika Anda mengubah `server/config/constants.ts`, rebuild image Docker sebelum deploy ulang.

### Production Checklist
- [ ] Static configuration reviewed (`server/config/constants.ts`)
- [ ] Rate limiting enabled
- [ ] Security headers verified
- [ ] SSL/TLS configured
- [ ] Monitoring setup
- [ ] Backup strategy
- [ ] Rollback procedure

---

**📚 Next Steps:**
- Review the [API Documentation](../docs/API.md)
- Check [Backend Development Guide](../../docs/05. Backend Development.md)
- Explore [Testing Strategy](../../docs/09. Testing Strategy.md)
- See [Deployment Guide](../../docs/10. Deployment.md)
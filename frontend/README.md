# Statify Frontend

**Statify** adalah aplikasi web untuk analisis data statistik yang modern dan intuitif, dibangun dengan Next.js, TypeScript, dan teknologi web terkini.

## Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Teknologi & Arsitektur](#teknologi--arsitektur)
- [Setup Development](#setup-development)
- [Struktur Proyek](#struktur-proyek)
- [Panduan Development](#panduan-development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Dokumentasi](#dokumentasi)

## Gambaran Umum

Statify Frontend adalah **alternatif modern berbasis web untuk SPSS** yang menggunakan **client-side processing**. Platform ini memungkinkan pengguna melakukan analisis statistik profesional langsung di browser tanpa perlu menginstall software desktop atau mengirim data ke server.

### Keunggulan sebagai Alternatif SPSS
- **Berbasis Web**: Tidak perlu instalasi, dapat diakses dari browser mana saja
- **Client-Side Processing**: Semua pemrosesan data dilakukan di browser pengguna, memastikan privasi dan keamanan data
- **Real-time Analysis**: Analisis data langsung tanpa upload ke server
- **Cost-effective**: Alternatif gratis untuk software statistik berbayar
- **Cross-platform**: Dapat digunakan di Windows, Mac, Linux, bahkan tablet

### Fitur Utama
- **Import data** dari berbagai format (CSV, Excel, SPSS .sav files)
- **Analisis statistik** deskriptif, eksplorasi, dan inferensial
- **Visualisasi data** dengan berbagai jenis chart interaktif
- **Manajemen data** dan transformasi variabel
- **Export hasil** analisis dan visualisasi
- **Interface intuitif** yang familiar bagi pengguna SPSS

## Teknologi & Arsitektur

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **State Management**: Zustand
- **Data Processing**: Web Workers (client-side processing)
- **Charts**: D3.js + custom chart builders
- **Tables**: Handsontable (seperti interface SPSS)
- **Testing**: Jest + React Testing Library
- **Build Tools**: SWC, ESLint, Prettier

### Client-Side Processing Architecture
Statify menggunakan **Web Workers** untuk memproses data langsung di browser pengguna:
- **Main Thread**: UI rendering dan interaksi pengguna
- **Worker Threads**: Pemrosesan data, kalkulasi statistik, dan transformasi
- **IndexedDB**: Penyimpanan lokal data di browser
- **No Server Upload**: Data tidak pernah meninggalkan perangkat pengguna

### Arsitektur Aplikasi
```
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand state management
├── services/               # Business logic & API services
├── utils/                  # Utility functions
├── types/                  # TypeScript type definitions
├── repositories/           # Data access layer
└── public/                # Static assets & web workers
```

## Setup Development

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- Git

### Installation
```bash
# Clone repository
git clone <repository-url>
cd statify/frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Run development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # ESLint check
npm run type-check   # TypeScript check
```

## Struktur Proyek

### Core Directories

#### `/app` - Next.js App Router
- **dashboard/**: Main application dashboard
  - **data/**: Data management interface
  - **variable/**: Variable management
  - **result/**: Analysis results
- **help/**: Help and documentation system
- **landing/**: Landing page

#### `/components` - UI Components
- **ui/**: Base UI components (Shadcn/ui)
- **Common/**: Shared application components
- **Modals/**: Modal dialogs
- **Output/**: Data visualization components

#### `/stores` - State Management
- **useDataStore**: Data management state
- **useVariableStore**: Variable management state
- **useResultStore**: Analysis results state
- **useModalStore**: Modal management state

#### `/services` - Business Logic
- **api/**: API integration services
- **chart/**: Chart generation services
- **data/**: Data processing services
- **worker/**: Web worker management

#### `/hooks` - Custom Hooks
- React hooks untuk berbagai functionality
- Performance optimization hooks
- Data fetching hooks

### Key Features

#### Data Management
- Import/Export berbagai format data
- Data cleaning dan transformation
- Variable management
- Missing values handling

#### Statistical Analysis
- Descriptive statistics
- Frequency analysis
- Crosstabs analysis
- Explore data analysis
- Chart generation

#### User Interface
- Responsive design
- Dark/Light theme
- Modal system
- Tour guide system
- Help documentation

## Panduan Development

### Code Style & Standards
- Menggunakan ESLint + Prettier untuk code formatting
- TypeScript strict mode enabled
- Conventional commit messages
- Component naming: PascalCase
- File naming: camelCase untuk utilities, PascalCase untuk components

### State Management Pattern
```typescript
// Zustand store example
interface DataStore {
  data: TableData[];
  isLoading: boolean;
  setData: (data: TableData[]) => void;
  clearData: () => void;
}

const useDataStore = create<DataStore>((set) => ({
  data: [],
  isLoading: false,
  setData: (data) => set({ data }),
  clearData: () => set({ data: [] })
}));
```

### Component Development
- Gunakan TypeScript interfaces untuk props
- Implement error boundaries untuk komponen kritis
- Gunakan React.memo untuk optimisasi performa
- Dokumentasi dengan JSDoc

### Web Workers
- Heavy computations dijalankan di Web Workers
- Located di `/public/workers/`
- Communication via message passing

### Modal System
- Centralized modal management dengan `useModalStore`
- Dynamic modal registration
- Type-safe modal props

## Testing

### Testing Strategy
- Unit tests untuk utilities dan hooks
- Component tests untuk UI components
- Integration tests untuk flows kritis
- E2E tests untuk user journeys penting

### Test Structure
```
__tests__/
├── components/     # Component tests
├── hooks/         # Custom hooks tests
├── services/      # Business logic tests
└── utils/         # Utility function tests
```

### Running Tests
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

## Deployment

### Build Process
```bash
npm run build            # Create production build
npm run start           # Start production server
```

### Environment Variables
```bash
NEXT_PUBLIC_API_URL=     # API base URL
NEXT_PUBLIC_APP_ENV=     # Environment (development/production)
```

### Docker Deployment
```bash
docker build -f Dockerfile.frontend -t statify-frontend .
docker run -p 3000:3000 statify-frontend
```

## Dokumentasi

### Developer Resources
- [FDD Documentation](./docs/FDD/) - Feature-Driven Development process
- [Component Documentation](./components/) - Individual component docs
- [API Documentation](./services/) - Service layer documentation
- [Architecture Guide](./docs/ARCHITECTURE.md) - System architecture
- [Performance Guide](./OPTIMIZATION_GUIDE.md) - Performance optimization

### User Documentation
- [Help System](./app/help/) - In-app help documentation
- [User Guide](./docs/USER_GUIDE.md) - Comprehensive user manual

## 🤝 Contributing

### Development Workflow
1. Create feature branch dari `main`
2. Implement feature dengan tests
3. Run quality checks: `npm run lint && npm run type-check && npm run test`
4. Create pull request dengan descriptive message
5. Code review dan approval
6. Merge ke main branch

### Code Review Checklist
- [ ] TypeScript compilation berhasil
- [ ] Tests passing
- [ ] ESLint checks passing
- [ ] Performance implications considered
- [ ] Documentation updated
- [ ] Breaking changes documented

## 📝 Notes

- Project menggunakan Feature-Driven Development (FDD)
- Component library berbasis Shadcn/ui
- State management dengan Zustand untuk simplicity
- Web Workers untuk heavy computations
- Responsive design dengan mobile-first approach

## 📞 Support

Untuk bantuan development:
- Baca dokumentasi di `/docs`
- Check existing issues dan solutions
- Konsultasi dengan team lead untuk architectural decisions

---

**Statify Frontend** - Building powerful statistical analysis tools for everyone.

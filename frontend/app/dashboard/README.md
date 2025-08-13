# Dashboard Directory - Statify Main Application Interface

Direktori `dashboard/` merupakan komponen inti dari aplikasi Statify yang menyediakan interface utama untuk analisis data statistik. Dashboard menggunakan Next.js App Router dengan layout yang responsif dan performa yang dioptimalkan.

## 📁 Struktur

```
dashboard/
├── layout.tsx                    # Dashboard layout dengan resizable panels
├── loading.tsx                   # Loading UI untuk dashboard
├── page.tsx                     # Dashboard landing page
├── components/                  # Komponen shared dashboard
│   ├── landing/                # Landing page components
│   │   ├── DashboardLanding.tsx
│   │   ├── DataActionCard.tsx
│   │   ├── ResourceCard.tsx
│   │   ├── types.ts
│   │   └── hooks/
│   │       └── useExampleDatasetLoader.ts
│   └── layout/                 # Layout components
│       ├── Footer.tsx
│       ├── Header.tsx
│       ├── HamburgerMenu.tsx
│       └── Navbar.tsx
├── data/                       # Data management interface
│   ├── page.tsx
│   ├── loading.tsx
│   └── components/
│       ├── Toolbar.tsx
│       └── dataTable/         # Advanced data table component
├── variable/                   # Variable metadata management
│   ├── page.tsx
│   ├── loading.tsx
│   └── components/
│       └── variableTable/     # Variable properties editor
└── result/                     # Analysis results display
    ├── page.tsx
    ├── loading.tsx
    └── components/
        ├── ResultOutput.tsx
        └── Sidebar.tsx
```

## 🎯 Dashboard Overview

### Core Functionality
Dashboard Statify menyediakan tiga workspace utama:
1. **Data View**: Import, view, dan edit datasets
2. **Variable View**: Manage variable properties dan metadata
3. **Result View**: Display dan export analysis results

### Architecture Patterns
- **Client-Side Rendering**: Semua pages menggunakan `"use client"` untuk interaktivity
- **Lazy Loading**: Components dimuat secara lazy dengan Suspense untuk performance
- **Responsive Design**: Layout adaptif dengan resizable panels
- **State Management**: Terintegrasi dengan Zustand stores
- **Performance Optimization**: Skeleton loading states dan code splitting

## 🏗 Layout System (`layout.tsx`)

### Features
- **Resizable Panels**: Menggunakan RadixUI Resizable components
- **Responsive Navigation**: Mobile-friendly dengan hamburger menu
- **Modal Management**: Lazy-loaded modal system
- **Performance Monitoring**: Sync status dan navigation observers
- **Loading States**: Comprehensive loading overlays

### Key Components
```typescript
interface DashboardLayout {
  children: React.ReactNode;
  // Resizable panel system
  sidebar: ResizablePanel;
  content: ResizablePanel;
  // Navigation components
  header: Header;
  footer: Footer;
  // Overlay systems
  modals: ModalManager;
  notifications: Toaster;
}
```

### Technical Implementation
- **Panel Management**: Default sidebar width 30%, persistent resize state
- **Modal System**: Lazy-loaded dengan fallback loading component
- **Mobile Detection**: `useMobile` hook untuk responsive behavior
- **State Integration**: Connected ke multiple Zustand stores

## 📄 Pages Architecture

### Landing Page (`page.tsx`)
**Purpose**: Entry point dan project selection interface

**Features**:
- Auto-redirect ke data view jika project sudah loaded
- Quick actions untuk open/create projects
- Example dataset loading
- Resource links dan documentation

**State Management**:
- `useMetaStore`: Project metadata management
- `useDataStore` & `useVariableStore`: Data reset capabilities
- `useModal`: Project opening workflow

### Data Page (`data/page.tsx`)
**Purpose**: Dataset viewing dan editing interface

**Features**:
- Spreadsheet-like data table (Handsontable)
- Real-time data editing
- Column/row operations
- Data validation
- Export capabilities

**Components**:
- `DataTable`: Advanced table dengan context menus
- `Toolbar`: Actions dan data operations
- Comprehensive loading states

### Variable Page (`variable/page.tsx`)
**Purpose**: Variable metadata management

**Features**:
- Variable properties editing
- Type definitions
- Value labels management
- Missing values configuration
- Measurement levels

**Components**:
- `VariableTable`: Metadata editing interface
- Dialog-driven complex inputs
- Inline validation

### Result Page (`result/page.tsx`)
**Purpose**: Analysis results display

**Features**:
- Results sidebar navigation
- Output visualization
- Export capabilities
- Result comparison

**Layout**:
- Grid-based layout dengan sidebar
- Responsive content area
- Suspense boundaries

## 🧩 Shared Components

### Landing Components (`components/landing/`)

#### DashboardLanding
**Purpose**: Main landing interface dengan action cards

**Props**:
```typescript
interface DashboardLandingProps {
  dataActions: DataAction[];
  resources: ResourceItem[];
  onDataAction: (action: DataAction) => void;
  onResourceClick: (resource: ResourceItem) => void;
}
```

#### DataActionCard
**Purpose**: Quick action cards untuk data operations

**Features**:
- Icon-based actions
- Hover states
- Keyboard navigation
- Loading states

#### ResourceCard
**Purpose**: Documentation dan resource links

#### useExampleDatasetLoader
**Purpose**: Hook untuk loading example datasets

```typescript
interface ExampleDatasetLoader {
  loadDataset: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
```

### Layout Components (`components/layout/`)

#### Header
**Features**:
- Application branding
- Navigation breadcrumbs
- User actions
- Theme toggle

#### Navbar
**Features**:
- Primary navigation
- Active state indicators
- Responsive collapse
- Keyboard navigation

#### Footer
**Features**:
- Status information
- Secondary links
- Version information

#### HamburgerMenu
**Features**:
- Mobile navigation
- Slide-out menu
- Touch gestures
- Focus management

## 📊 Data Management (`data/`)

### DataTable Component
**Purpose**: Advanced spreadsheet interface untuk data editing

**Key Features**:
- **Handsontable Integration**: Full-featured spreadsheet functionality
- **Dynamic Dimensions**: Auto-sizing berdasarkan data
- **Context Menus**: Right-click operations
- **Validation**: Real-time data validation
- **Performance**: Optimized untuk large datasets

**Architecture**:
```typescript
interface DataTableFeatures {
  // Core functionality
  cellEditing: boolean;
  contextMenus: ContextMenuConfig;
  validation: ValidationRules;
  
  // Data operations
  rowOperations: ['insert', 'delete', 'move'];
  columnOperations: ['insert', 'delete', 'resize'];
  
  // Performance
  virtualization: boolean;
  lazyLoading: boolean;
  batchUpdates: boolean;
}
```

**Hooks System**:
- `useDataTableLogic`: Core table logic
- `useColumnConfigs`: Column configuration
- `useTableUpdates`: Data persistence
- `useContextMenuLogic`: Menu operations
- `useDisplayData`: Data formatting

### Technical Implementation
- **Store Integration**: Direct connection ke `useDataStore`
- **Event Handling**: Comprehensive event system
- **Memory Optimization**: Efficient data structures
- **Error Handling**: Graceful error recovery

## 🔧 Variable Management (`variable/`)

### VariableTable Component
**Purpose**: Interface untuk editing variable metadata

**Features**:
- **Inline Editing**: Direct cell editing
- **Dialog System**: Complex property editing
- **Validation**: Property validation
- **Type Management**: Variable type definitions

**Dialog Components**:
- `VariableTypeDialog`: Type selection dan configuration
- `ValueLabelsDialog`: Value labels management
- `MissingValuesDialog`: Missing values definition

**Data Model**:
```typescript
interface VariableMetadata {
  id: string;
  name: string;
  type: VariableType;
  measure: MeasureLevel;
  format: VariableFormat;
  labels: ValueLabel[];
  missingValues: MissingValue[];
}
```

## 📈 Results Display (`result/`)

### Result Architecture
**Components**:
- `Sidebar`: Navigation dan result selection
- `ResultOutput`: Main output display area

**Features**:
- **Multi-format Output**: Tables, charts, statistics
- **Export Options**: PDF, Excel, images
- **Result Comparison**: Side-by-side comparison
- **Print Optimization**: Print-friendly layouts

**Data Flow**:
```typescript
interface ResultDisplay {
  results: AnalysisResult[];
  currentResult: string | null;
  displayMode: 'table' | 'chart' | 'combined';
  exportOptions: ExportConfig;
}
```

## ⚡ Performance Optimizations

### Loading Strategies
- **Suspense Boundaries**: Page-level dan component-level
- **Lazy Loading**: Modal system dan heavy components
- **Code Splitting**: Route-based splitting
- **Skeleton States**: Meaningful loading indicators

### State Management
- **Selective Subscriptions**: Minimal re-renders
- **Memoization**: Expensive computations
- **Debouncing**: User input handling
- **Batching**: State updates

### Memory Management
- **Component Cleanup**: Proper useEffect cleanup
- **Store Persistence**: Selective persistence
- **Data Virtualization**: Large dataset handling
- **Image Optimization**: Chart dan visualization caching

## 📱 Responsive Design

### Breakpoint Strategy
```typescript
const breakpoints = {
  mobile: '0-767px',
  tablet: '768-1023px',
  desktop: '1024px+',
};
```

### Adaptive Features
- **Panel Collapse**: Mobile-friendly navigation
- **Touch Gestures**: Mobile table interactions
- **Responsive Tables**: Horizontal scrolling
- **Contextual Menus**: Touch-appropriate menus

## 🧪 Testing Strategy

### Component Tests
- **Page Rendering**: Smoke tests untuk semua pages
- **User Interactions**: Click, input, navigation
- **State Management**: Store integration
- **Error Boundaries**: Error handling

### Integration Tests
- **Data Flow**: End-to-end data operations
- **Navigation**: Route transitions
- **Modal Workflows**: Complete user journeys
- **Performance**: Load testing

### Test Structure
```
__tests__/
├── pages/           # Page component tests
├── components/      # Individual component tests
├── integration/     # Cross-component tests
└── e2e/            # End-to-end tests
```

## 🔒 Security Considerations

### Data Protection
- **Client-Side Validation**: Input sanitization
- **XSS Prevention**: Output encoding
- **CSRF Protection**: Form token validation
- **Data Encryption**: Sensitive data handling

### Access Control
- **Route Protection**: Authentication checks
- **Permission Validation**: Feature access control
- **Session Management**: Secure session handling

## 🎨 UI/UX Design

### Design System
- **Consistent Spacing**: 8px grid system
- **Color Palette**: Semantic color usage
- **Typography**: Consistent font hierarchy
- **Icons**: Lucide icon library

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels dan descriptions
- **Color Contrast**: WCAG AA compliance
- **Focus Management**: Logical focus flow

### User Experience
- **Progressive Disclosure**: Gradual feature exposure
- **Feedback Systems**: Loading states, notifications
- **Error Prevention**: Validation dan confirmation
- **Help Integration**: Contextual help system

## 📋 Development Guidelines

### Code Organization
- **Component Colocation**: Related files together
- **Index Exports**: Clean import paths
- **Type Definitions**: Comprehensive TypeScript
- **Documentation**: Inline comments

### Performance Guidelines
- **Render Optimization**: Minimize unnecessary renders
- **Bundle Size**: Keep imports lean
- **Memory Usage**: Monitor memory consumption
- **Network Requests**: Efficient data fetching

### Best Practices
- **Error Handling**: Comprehensive error boundaries
- **Loading States**: Meaningful feedback
- **Code Splitting**: Lazy loading strategies
- **State Management**: Minimal global state

## 🚀 Future Enhancements

### Planned Features
- **Real-time Collaboration**: Multi-user editing
- **Advanced Visualizations**: Interactive charts
- **Plugin System**: Extensible functionality
- **Mobile App**: Native mobile interface

### Technical Improvements
- **Performance Monitoring**: Real-time metrics
- **Advanced Caching**: Intelligent cache strategies
- **Offline Support**: Progressive Web App features
- **API Integration**: Server-side processing

---

Dashboard Statify menyediakan interface yang powerful dan user-friendly untuk analisis data statistik, dengan emphasis pada performance, accessibility, dan developer experience yang optimal.

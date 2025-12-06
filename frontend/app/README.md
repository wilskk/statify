# Ap## Directory Structure

```
app/
├── globals.css  ## Development Guidelines

### File Naming Conventions      # Global Tailwind CSS styles and custom properties
├── layout.tsx           # Root layout with providers and metadata
├── page.tsx            # Home page with routing logic
├── favicon.ico         # Application favicon
├── dashboard/          # Main dashboard application (protected routes)
├── help/              # Help system and documentation pages
└── landing/           # Public landing page and marketing content
```

## Architecture OverviewNext.js App Router

> **Developer Documentation**: Core application routing and page structure for Statify using Next.js 13+ App Router pattern.

## 📁 Directory Structure

```
app/
├── globals.css           # Global Tailwind CSS styles and custom properties
├── layout.tsx           # Root layout with providers and metadata
├── page.tsx            # Home page with routing logic
├── favicon.ico         # Application favicon
├── dashboard/          # Main dashboard application (protected routes)
├── help/              # Help system and documentation pages
└── landing/           # Public landing page and marketing content
```

## � Architecture Overview

### App Router Implementation
- **Framework**: Next.js 13+ App Router with TypeScript
- **Rendering**: Server Components by default, Client Components marked with 'use client'
- **Layouts**: Nested layout system with shared UI components
- **Loading**: Concurrent features with Suspense boundaries
- **Error Handling**: Error boundaries with fallback UI

### Route Organization
```
app/
├── layout.tsx                    # Root layout (providers, metadata)
├── page.tsx                     # Homepage (redirect logic)
├── dashboard/
│   ├── layout.tsx               # Dashboard layout (auth, navigation)
│   ├── loading.tsx              # Dashboard loading state
│   ├── page.tsx                 # Dashboard landing
│   ├── data/page.tsx            # Data management interface
│   ├── variable/page.tsx        # Variable metadata editor
│   └── result/page.tsx          # Analysis results viewer
├── help/
│   └── page.tsx                 # Help system entry point
└── landing/
    ├── layout.tsx               # Landing page layout
    └── page.tsx                 # Marketing/landing content
```

## � Development Guidelines

### File Naming Conventions
- **Pages**: `page.tsx` for route components
- **Layouts**: `layout.tsx` for layout components
- **Loading**: `loading.tsx` for loading UI
- **Error**: `error.tsx` for error boundaries
- **Not Found**: `not-found.tsx` for 404 pages

### Component Organization
```typescript
// Standard page component structure
export default function PageName() {
  return (
    <div>
      {/* Page content */}
    </div>
  );
}

// Metadata export (SEO)
export const metadata = {
  title: 'Page Title',
  description: 'Page description'
};
```

### State Management
- **Global State**: Zustand stores in `/stores`
- **Server State**: React Query in API routes
- **Local State**: React hooks (useState, useReducer)

## Route Documentation

### Root Route (`/`)
- **File**: `app/page.tsx`
- **Type**: Server Component
- **Purpose**: Application entry point and routing logic
- **Redirect**: Authenticated users → `/dashboard`, others → `/landing`

### Dashboard Routes (`/dashboard/*`)
Protected application area requiring authentication:

#### Data Management (`/dashboard/data`)
- **Component**: DataTable with Handsontable integration
- **Features**: Import/export, cell editing, data validation
- **State**: useDataStore, useTableRefStore
- **Performance**: Virtual scrolling, optimized rendering

#### Variable Management (`/dashboard/variable`)
- **Component**: VariableTable for metadata editing
- **Features**: Bulk editing, property validation, SPSS compatibility
- **State**: useVariableStore, useMetaStore
- **Performance**: Optimized table rendering, lazy loading

#### Results Display (`/dashboard/result`)
- **Component**: ResultOutput with hierarchical navigation
- **Features**: Chart rendering, export capabilities, result navigation
- **State**: useResultStore, useTimeSeriesStore
- **Performance**: Chart virtualization, progressive loading

#### 🔧 Variable Management (`/dashboard/variable`)
- **Purpose**: Manage variable properties dan metadata
- **Components**: VariableTable, dialogs untuk variable properties
- **Features**: Variable types, labels, missing values

#### 📈 Results (`/dashboard/result`)
- **Purpose**: Display analysis results dan visualizations
- **Components**: ResultOutput, Sidebar navigation
- **Features**: Chart display, export results

### 📚 Help System (`/help`)
- **Purpose**: Documentation dan user guides
- **Components**: Guide components, search, navigation
- **Features**: Statistics guides, data guides, file guides

### 🚀 Landing (`/landing`)
- **Purpose**: Marketing/welcome page
- **Components**: Hero, features, CTA
- **Features**: Product introduction, getting started

## 🎨 Layout System

### Root Layout (`layout.tsx`)
```typescript
// Global providers, theme, metadata
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Dashboard Layout (`dashboard/layout.tsx`)
```typescript
// Dashboard-specific layout dengan navigation
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-layout">
      <Header />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
```

## 🔄 Loading & Error States

### Loading UI
- `loading.tsx` files untuk loading states
- Suspense boundaries
- Skeleton components

### Error Handling
- `error.tsx` files untuk error boundaries
- Graceful error recovery
- User-friendly error messages

## 🌐 Metadata & SEO

### Dynamic Metadata
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: 'Statify - Statistical Analysis',
    description: 'Modern statistical analysis platform',
  }
}
```

## 🚀 Performance

### Optimization Strategies
- Server Components untuk initial render
- Client Components untuk interactivity
- Dynamic imports untuk code splitting
- Image optimization dengan next/image

### Caching
- Static generation where possible
- ISR untuk dynamic content
- Client-side caching dengan SWR/React Query

## 🧪 Testing

### Testing Strategy
- Page component tests
- Layout component tests
- Navigation flow tests
- E2E tests untuk critical paths

### Test Files
```
app/
├── __tests__/
│   ├── page.test.tsx
│   └── layout.test.tsx
└── dashboard/
    ├── __tests__/
    └── data/
        └── __tests__/
```

## 📱 Responsive Design

### Breakpoints
- Mobile: 640px dan bawah
- Tablet: 641px - 1024px
- Desktop: 1025px dan atas

### Mobile-First Approach
- Base styles untuk mobile
- Progressive enhancement untuk larger screens
- Touch-friendly interactions

## 🔒 Security

### Data Protection
- Client-side data encryption
- Secure cookie handling
- HTTPS enforcement
- CSRF protection

## 📋 Best Practices

### File Naming
- `page.tsx` untuk route pages
- `layout.tsx` untuk layouts
- `loading.tsx` untuk loading UI
- `error.tsx` untuk error boundaries
- `not-found.tsx` untuk 404 pages

### Component Organization
- Co-locate related components
- Separate containers dari presentational components
- Use Server Components default, Client Components when needed

### Data Fetching
- Server Components untuk initial data
- Client-side fetching untuk interactivity
- Error handling untuk network failures

## 🔄 State Management

### Global State
- Zustand stores untuk application state
- Context providers untuk theme, auth
- URL state untuk shareable state

### Local State
- useState untuk component-specific state
- useReducer untuk complex state logic
- Custom hooks untuk reusable state logic

## 📝 Development Notes

### Adding New Pages
1. Create `page.tsx` dalam directory yang sesuai
2. Add layout jika diperlukan (`layout.tsx`)
3. Implement loading states (`loading.tsx`)
4. Add error boundaries (`error.tsx`)
5. Update navigation components
6. Add tests

### Route Protection
- Implement auth checks dalam layouts
- Redirect unauthorized users
- Loading states during auth verification

---

Direktori `app/` adalah entry point untuk semua user interactions dalam Statify. Setiap page dan layout dirancang untuk memberikan user experience yang optimal dengan performance yang baik.

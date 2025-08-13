# App Directory - Next.js App Router

Direktori `app/` berisi semua routing dan pages untuk aplikasi Statify menggunakan Next.js App Router.

## 📁 Struktur

```
app/
├── globals.css           # Global styles
├── layout.tsx           # Root layout
├── page.tsx            # Home page
├── favicon.ico         # Favicon
├── dashboard/          # Main application dashboard
├── help/              # Help and documentation system
└── landing/           # Landing page
```

## 🎯 Konsep Routing

### App Router Pattern
- File-based routing dengan Next.js 13+ App Router
- Server Components by default
- Nested layouts dan loading states
- Error boundaries terintegrasi

### Layout Hierarchy
```
app/layout.tsx (Root)
├── dashboard/layout.tsx (Dashboard)
│   ├── data/page.tsx
│   ├── variable/page.tsx
│   └── result/page.tsx
├── help/page.tsx
└── landing/layout.tsx (Landing)
```

## 📄 Pages Overview

### 🏠 Root (`/`)
- **File**: `page.tsx`
- **Purpose**: Homepage/redirect ke dashboard
- **Features**: Initial routing logic

### 🏗 Dashboard (`/dashboard`)
Main application interface dengan sub-routes:

#### 📊 Data Management (`/dashboard/data`)
- **Purpose**: Import, view, dan manage datasets
- **Components**: DataTable, Toolbar, Import modals
- **Features**: CSV/Excel import, data editing, export

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

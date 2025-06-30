# Panduan Implementasi Feature Tour pada Aplikasi Statify

Dokumen ini menjelaskan cara mengimplementasikan fitur product tour/panduan interaktif pada komponen-komponen di aplikasi Statify.

## Pengantar

Feature tour (tur fitur) adalah panduan interaktif langkah demi langkah yang membantu pengguna memahami fitur dan fungsi sebuah aplikasi. Pada Statify, fitur tour diimplementasikan secara native tanpa ketergantungan pada library eksternal, memberikan kontrol penuh atas perilaku, tampilan, dan pengalaman pengguna.

### Tujuan dan Manfaat

- **Onboarding Pengguna** - Membantu pengguna baru memahami fitur aplikasi dengan cepat
- **Pengenalan Fitur Baru** - Memperkenalkan perubahan atau penambahan fitur kepada pengguna yang sudah ada
- **Mengurangi Learning Curve** - Memberikan petunjuk kontekstual saat pengguna menggunakan fitur yang kompleks
- **Konsistensi Pengalaman** - Memastikan pengalaman panduan yang konsisten di seluruh aplikasi

## Arsitektur Tour

Fitur tour pada Statify menggunakan pendekatan komponen yang bersih dan modular, terdiri dari beberapa bagian utama:

1. **Data Tour** - Definisi langkah-langkah tour berupa array objek.
2. **Komponen TourPopup** - Tampilan visual popup penjelasan untuk setiap langkah.
3. **Komponen ActiveElementHighlight** - Penyorotan elemen yang aktif/sedang dijelaskan.
4. **State Management** - Pengelolaan status tour (aktif/tidak, langkah saat ini) melalui custom hook `useTourGuide`.
5. **Event Handlers** - Fungsi navigasi dan interaksi (next, previous, close) yang disediakan oleh hook.
6. **Portal** - Rendering popup di luar hierarki DOM untuk menghindari masalah z-index.
7. **Tab Navigation** - Navigasi otomatis antar tab yang dikelola oleh `useTourGuide`.
8. **Highlighting Presisi** - Teknik untuk menyorot area spesifik, bahkan di dalam komponen kompleks.

### Komponen Terpusat

Untuk memastikan konsistensi di seluruh aplikasi, komponen tour diimplementasikan secara terpusat dalam `components/Common/TourComponents.tsx`, yang menyediakan:

1. `TourPopupPortal` - Portal untuk merender popup di luar hierarki DOM normal.
2. `TourPopup` - Komponen popup tour utama dengan penempatan yang cerdas.
3. `ActiveElementHighlight` - Komponen untuk menyoroti elemen target.

### Adaptasi Responsif

Tour dapat ditampilkan dengan beberapa pendekatan berbeda berdasarkan konteks:

- **Mode Dialog** - Popup di atas/bawah elemen target, dengan penempatan cerdas berdasarkan ruang yang tersedia.
- **Mode Sidebar/Panel** - Popup di sebelah kiri elemen, di luar area panel yang resizable.
- **Posisi Horizontal** - Mendukung penempatan khusus di kiri atau kanan elemen target.

## Implementasi Dasar

### 1. Tipe Data dan Struktur

Tipe data yang diekspor dari hook tour guide (`useTourGuide`) mendefinisikan struktur tour.

```tsx
// File: components/Modals/Analyze/.../hooks/useTourGuide.ts

// Tipe untuk tab yang berbeda dalam satu modal
export type TabType = 'variables' | 'statistics' | 'charts';

// Tipe dasar untuk satu langkah tour dari @/types/tourTypes
import { TourStep as BaseTourStep } from '@/types/tourTypes';

// Tipe langkah tour yang diperluas dengan fungsionalitas tab
export type TourStep = BaseTourStep & {
  requiredTab?: TabType;     // Tab yang harus aktif untuk langkah ini
  forceChangeTab?: boolean;  // Paksa pindah tab setelah langkah ini
};

// Interface untuk mengontrol tab dari komponen induk
export interface TabControlProps {
  setActiveTab: (tab: TabType) => void;
  currentActiveTab: TabType;
}
```

### 2. Custom Hook `useTourGuide`

Custom hook ini adalah inti dari fungsionalitas tour, mengelola semua state dan logika, termasuk navigasi tab otomatis.

```tsx
// File: components/Modals/Analyze/.../hooks/useTourGuide.ts

export const useTourGuide = (
  containerType: "dialog" | "sidebar" = "dialog",
  tabControl?: TabControlProps // Kontrol tab bersifat opsional
): UseTourGuideResult => {
  const [tourActive, setTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});
  
  const lastTabRef = useRef<TabType | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);
  
  // Mengolah langkah-langkah tour berdasarkan tipe container
  const tourSteps = useMemo(() => baseTourSteps.map(step => ({
    ...step,
    horizontalPosition: containerType === "sidebar" 
      ? "left" as HorizontalPosition 
      : step.defaultHorizontalPosition as HorizontalPosition | null,
    position: containerType === "sidebar" ? undefined : step.defaultPosition,
  })), [containerType]);

  // Fungsi untuk menemukan elemen target
  const findTargetElement = useCallback((stepId: string): HTMLElement | null => {
    // ... implementasi pencarian elemen
  }, []);

  // Membersihkan timeout
  const clearTimeout = useCallback(() => {
    // ... implementasi clearTimeout
  }, []);

  // Merefresh elemen target
  const refreshTargetElements = useCallback(() => {
    // ... implementasi refresh elemen
  }, [tourActive, tourSteps, findTargetElement]);

  // Menentukan tab yang diperlukan untuk langkah tertentu
  const getRequiredTabForStep = useCallback((stepIndex: number): TabType | undefined => {
    const step = tourSteps[stepIndex];
    return step?.requiredTab;
  }, [tourSteps]);

  // Logika untuk berpindah tab jika diperlukan
  const switchTabIfNeeded = useCallback((requiredTab?: TabType) => {
    if (!tabControl || !requiredTab || tabControl.currentActiveTab === requiredTab) {
      return;
    }
    tabControl.setActiveTab(requiredTab);
    lastTabRef.current = requiredTab;
    clearTimeout();
    timeoutRef.current = window.setTimeout(refreshTargetElements, 200); // 200ms delay
  }, [tabControl, refreshTargetElements, clearTimeout]);

  // Efek untuk mengelola logika tour
  useEffect(() => {
    // ... logika untuk menangani pembaruan, perpindahan tab, dan pembersihan
  }, [currentStep, tourActive, tabControl, /* ... dependensi lain */]);

  // Fungsi kontrol tour
  const startTour = useCallback(() => { /* ... */ }, [tabControl]);
  const nextStep = useCallback(() => { /* ... */ }, [currentStep, tourSteps.length]);
  const prevStep = useCallback(() => { /* ... */ }, [currentStep]);
  const endTour = useCallback(() => { /* ... */ }, []);

  // Menghitung elemen target saat ini
  const currentTargetElement = useMemo(() => {
    // ... logika untuk mendapatkan elemen target
  }, [tourActive, tourSteps, currentStep, targetElements]);

  return {
    tourActive,
    currentStep,
    tourSteps,
    currentTargetElement,
    startTour,
    nextStep,
    prevStep,
    endTour
  };
};
```

### 3. Definisi Langkah-Langkah Tour

Setiap modal yang memiliki tour mendefinisikan langkah-langkahnya sendiri dalam file `useTourGuide.ts` lokal.

**Contoh dari Frequencies Modal:**
```tsx
// File: frontend/components/Modals/Analyze/Descriptive/Frequencies/hooks/useTourGuide.ts

const baseTourSteps: TourStep[] = [
  {
    title: "Variables Selection",
    content: "Drag variables from the available list...",
    targetId: "frequencies-available-variables", // ID unik untuk highlight presisi
    defaultPosition: 'bottom',
    icon: "📊",
    requiredTab: TABS.VARIABLES // Langkah ini memerlukan tab 'variables'
  },
  {
    title: "Selected Variables",
    content: "Variables in this list will be analyzed.",
    targetId: "frequencies-selected-variables", // ID unik untuk highlight presisi
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'left',
    icon: "📋",
    requiredTab: TABS.VARIABLES
  },
  {
    title: "Statistics Tab",
    content: "Click on this tab to configure descriptive statistics...",
    targetId: "statistics-tab-trigger",
    defaultPosition: 'bottom',
    icon: "📈",
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true // Pindah tab setelah langkah ini
  },
  // ... langkah-langkah untuk tab 'statistics' dan 'charts'
];
```

**Contoh dari Descriptive Modal:**
```tsx
// File: frontend/components/Modals/Analyze/Descriptive/Descriptive/hooks/useTourGuide.ts

const baseTourSteps: TourStep[] = [
  // ... langkah untuk seleksi variabel
  {
    title: "Statistics Tab",
    content: "Click on this tab to configure which statistics...",
    targetId: "descriptive-statistics-tab-trigger",
    icon: "📈",
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true
  },
  {
    title: "Central Tendency",
    content: "Calculate measures like mean, median, and sum...",
    targetId: "descriptive-central-tendency", // Target ID untuk grup checkbox
    icon: "🎯",
    requiredTab: TABS.STATISTICS // Langkah ini memerlukan tab 'statistics'
  },
  // ... langkah-langkah lain untuk 'Dispersion', 'Distribution', dll.
];
```

## Integrasi dengan Komponen Induk

Komponen induk (misalnya, `Frequencies/index.tsx`) bertanggung jawab untuk mengintegrasikan hook tour dan komponen UI.

```tsx
// File: frontend/components/Modals/Analyze/.../index.tsx

const MainContentComponent: FC<BaseModalProps> = ({ onClose, containerType }) => {
  const [activeTab, setActiveTab] = useState<TabType>("variables");

  // Buat objek kontrol tab untuk diberikan ke hook tour
  const tabControl = useMemo((): TabControlProps => ({
    setActiveTab,
    currentActiveTab: activeTab,
  }), [activeTab]);

  // Inisialisasi hook tour dengan tabControl
  const { 
    tourActive, 
    currentStep, 
    tourSteps,
    currentTargetElement, 
    startTour, 
    nextStep, 
    prevStep, 
    endTour 
  } = useTourGuide(containerType, tabControl);

  return (
    <>
      {/* Tombol untuk memulai tour */}
      <Button onClick={startTour}>
        <HelpCircle /> Bantuan
      </Button>
      
      {/* Navigasi Tabs dari ShadCN */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger id="variables-tab-trigger" value="variables">Variables</TabsTrigger>
          <TabsTrigger id="statistics-tab-trigger" value="statistics">Statistics</TabsTrigger>
          {/* Tambahkan trigger lain jika ada */}
        </TabsList>
        
        <TabsContent value="variables">
          <VariablesTab 
            {...props} 
            tourActive={tourActive} 
            currentStep={currentStep} 
            tourSteps={tourSteps} 
          />
        </TabsContent>
        <TabsContent value="statistics">
          <StatisticsTab 
            {...props}
            tourActive={tourActive} 
            currentStep={currentStep} 
            tourSteps={tourSteps}
          />
        </TabsContent>
      </Tabs>
      
      {/* Render popup tour */}
      <AnimatePresence>
        {tourActive && (
          <TourPopup
            step={tourSteps[currentStep]}
            currentStep={currentStep}
            totalSteps={tourSteps.length}
            onNext={nextStep}
            onPrev={prevStep}
            onClose={endTour}
            targetElement={currentTargetElement}
          />
        )}
      </AnimatePresence>
    </>
  );
};
```

## Praktik Terbaik dan Optimasi

### 1. Highlighting yang Presisi

Untuk menyorot area spesifik dalam komponen yang kompleks (seperti `VariableListManager`), gunakan `div` overlay yang diposisikan secara absolut. Ini menghindari penyorotan yang tidak diinginkan pada elemen-elemen di sekitarnya.

```tsx
// File: VariablesTab.tsx

const VariablesTab: FC<VariablesTabProps> = ({ tourActive, currentStep, tourSteps = [] }) => {
  const availableStepIndex = tourSteps.findIndex(step => step.targetId === 'descriptive-available-variables');
  const selectedStepIndex = tourSteps.findIndex(step => step.targetId === 'descriptive-selected-variables');

  return (
    <div className="relative">
      <VariableListManager {...props} />
      
      {/* Overlay untuk menyorot area 'Available Variables' */}
      <div 
        id="descriptive-available-variables" 
        className="absolute top-0 left-0 w-[48%] h-full pointer-events-none rounded-md"
      >
        <ActiveElementHighlight active={tourActive && currentStep === availableStepIndex} />
      </div>

      {/* Overlay untuk menyorot area 'Selected Variables' */}
      <div 
        id="descriptive-selected-variables" 
        className="absolute top-0 right-0 w-[48%] h-full pointer-events-none rounded-md"
      >
        <ActiveElementHighlight active={tourActive && currentStep === selectedStepIndex} />
      </div>
    </div>
  );
};
```

### 2. Mengelompokkan Elemen untuk Highlighting

Untuk menyorot sekelompok elemen terkait (seperti beberapa checkbox), bungkus mereka dalam satu `div` dengan ID target dan posisikan `ActiveElementHighlight` di dalamnya.

```tsx
// File: StatisticsTab.tsx

const StatisticsTab: FC<StatisticsTabProps> = ({ tourActive, currentStep, tourSteps = [] }) => {
  const centralTendencyStepIndex = tourSteps.findIndex(step => step.targetId === 'descriptive-central-tendency');
  
  return (
    <div id="descriptive-central-tendency" className="bg-card border rounded-md p-5 relative">
      <div className="text-sm font-medium mb-3">Central Tendency</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {/* Checkbox untuk Mean, Median, Sum */}
      </div>
      <ActiveElementHighlight active={tourActive && currentStep === centralTendencyStepIndex} />
    </div>
  );
};
```

### 3. Penggunaan `useMemo` dan `useCallback`

Gunakan `useMemo` dan `useCallback` di dalam `useTourGuide` dan komponen induk untuk mengoptimalkan performa dan menghindari re-render yang tidak perlu.

### 4. Manajemen State Terpusat

Dengan memusatkan hampir semua logika di dalam `useTourGuide`, komponen UI tetap bersih dan hanya bertanggung jawab untuk menampilkan data dan meneruskan event. Ini membuat pemeliharaan lebih mudah.

## Kesimpulan

Arsitektur feature tour pada Statify telah berevolusi menjadi solusi yang matang, fleksibel, dan dapat digunakan kembali. Dengan pendekatan ini, implementasi tour di berbagai modal menjadi konsisten, mudah dikelola, dan berperforma tinggi.

Kunci utamanya adalah:
1. **Custom Hook `useTourGuide`**: Mengabstraksi semua logika kompleks.
2. **Navigasi Tab Otomatis**: Memberikan pengalaman pengguna yang mulus.
3. **Highlighting yang Presisi**: Menargetkan elemen dengan akurat.
4. **Struktur Data yang Jelas**: Memisahkan data tour dari logika komponen.
5. **Pola yang Konsisten**: Memudahkan implementasi di fitur-fitur baru. 
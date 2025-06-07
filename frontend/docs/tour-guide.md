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

1. **Data Tour** - Definisi langkah-langkah tour berupa array objek
2. **Komponen TourPopup** - Tampilan visual popup penjelasan untuk setiap langkah
3. **Komponen ActiveElementHighlight** - Penyorotan elemen yang aktif/sedang dijelaskan
4. **State Management** - Pengelolaan status tour (aktif/tidak, langkah saat ini)
5. **Event Handlers** - Fungsi navigasi dan interaksi (next, previous, close)
6. **Portal** - Rendering popup di luar hirarki DOM untuk menghindari masalah z-index

### Adaptasi Responsif

Tour dapat ditampilkan dengan dua pendekatan berbeda berdasarkan jenis container:

- **Mode Dialog** - Popup di atas/bawah elemen target, dengan penempatan cerdas berdasarkan ruang yang tersedia
- **Mode Sidebar/Panel** - Popup di sebelah kiri elemen, di luar area panel yang resizable

## Implementasi Dasar

### 1. Tipe Data dan Struktur

Pertama, definisikan tipe data untuk langkah-langkah tour:

```tsx
// Posisi vertikal popup
type PopupPosition = 'top' | 'bottom';

// Posisi horizontal popup
type HorizontalPosition = 'left' | 'right';

// Struktur langkah tour
type TourStep = {
    title: string;         // Judul langkah
    content: string;       // Konten/deskripsi penjelasan
    targetId: string;      // ID elemen HTML yang menjadi target
    defaultPosition: PopupPosition;  // Posisi default (vertikal)
    defaultHorizontalPosition: HorizontalPosition;  // Posisi default (horizontal)
    position?: PopupPosition;        // Posisi aktual (setelah disesuaikan)
    horizontalPosition?: HorizontalPosition | null;  // Posisi horizontal aktual (null untuk dialog)
    icon: string;          // Emoji atau icon untuk langkah ini
};
```

### 2. Komponen TourPopupPortal

Komponen ini memastikan popup tour di-render di luar hirarki DOM normal menggunakan `createPortal` dari React, sehingga menghindari masalah z-index dan clipping:

```tsx
import { createPortal } from "react-dom";

// Portal wrapper untuk memastikan popup selalu berada di atas elemen lain
const TourPopupPortal: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    
    return mounted && typeof window !== "undefined" ? createPortal(children, document.body) : null;
};
```

### 3. Komponen TourPopup

Ini adalah komponen visual utama yang menampilkan popup untuk setiap langkah:

```tsx
const TourPopup: FC<{
    step: TourStep;
    currentStep: number;
    totalSteps: number;
    onNext: () => void;
    onPrev: () => void;
    onClose: () => void;
    targetElement: HTMLElement | null;
}> = ({ step, currentStep, totalSteps, onNext, onPrev, onClose, targetElement }) => {
    const position = step.position || step.defaultPosition;
    const horizontalPosition = step.horizontalPosition;
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const popupRef = useRef<HTMLDivElement>(null);
    
    // Perhitungan posisi secara dinamis
    useEffect(() => {
        if (!targetElement) return;
        
        const updatePosition = () => {
            const rect = targetElement.getBoundingClientRect();
            const popupHeight = popupRef.current?.offsetHeight || 170;
            const popupWidth = 280;
            const popupBuffer = 20;
            let top: number, left: number;
            
            // Menentukan posisi berdasarkan mode (sidebar/panel vs dialog)
            if (horizontalPosition === 'left') {
                // Mode sidebar/panel: posisi di sebelah kiri
                left = Math.max(10, rect.left - 300);
                top = rect.top + (rect.height / 2) - 100;
            } else {
                // Mode dialog: posisi atas/bawah
                // Menentukan posisi vertikal
                if (position === 'top') {
                    top = rect.top - (popupHeight + popupBuffer);
                    // Jika tidak cukup ruang di atas, pindahkan ke bawah
                    if (top < 20) {
                        top = rect.bottom + popupBuffer;
                        step.position = 'bottom'; // Update untuk panah
                    }
                } else {
                    top = rect.bottom + popupBuffer;
                }
                
                // Menentukan posisi horizontal
                const elementWidth = rect.width;
                left = rect.left + (elementWidth / 2) - (popupWidth / 2);
                
                // Menyesuaikan posisi untuk elemen kecil
                if (elementWidth < 100) {
                    const rightSpace = window.innerWidth - rect.right;
                    const leftSpace = rect.left;
                    
                    // Pilih sisi dengan ruang yang lebih besar
                    if (rightSpace >= popupWidth + popupBuffer) {
                        left = rect.right + popupBuffer;
                    } else if (leftSpace >= popupWidth + popupBuffer) {
                        left = rect.left - (popupWidth + popupBuffer);
                    }
                }

                // Override untuk posisi horizontal kanan jika ditentukan
                if (horizontalPosition === 'right') {
                    left = rect.right - popupWidth;
                }
                
                // Mencegah popup keluar dari viewport
                if (left < 10) {
                    left = 10;
                }
                if (left + popupWidth > window.innerWidth - 10) {
                    left = window.innerWidth - (popupWidth + 10);
                }
            }
            
            setPopupPosition({ top, left });
        };
        
        // Update posisi
        updatePosition();
        const timer = setTimeout(updatePosition, 100);
        
        // Listener untuk scroll dan resize
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [targetElement, position, horizontalPosition]);

    // Styling untuk arrows/panah
    const getArrowStyles = () => {
        const arrowClasses = "w-3 h-3 bg-white dark:bg-gray-800";
        const borderClasses = "border-primary/10 dark:border-primary/20";
        
        // Arrow untuk mode dialog (atas/bawah)
        if (horizontalPosition !== 'left') {
            if (position === 'top') {
                return (
                    <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 ${arrowClasses} border-b border-r ${borderClasses}`} />
                );
            }
            if (position === 'bottom') {
                return (
                    <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 ${arrowClasses} border-t border-l ${borderClasses}`} />
                );
            }
        }
        // Arrow untuk mode sidebar (kiri)
        else if (horizontalPosition === 'left') {
            return (
                <div className={`absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 rotate-45 ${arrowClasses} border-t border-r ${borderClasses}`} />
            );
        }
        
        return null;
    };

    return (
        <TourPopupPortal>
            <motion.div
                initial={{ opacity: 0, y: position === 'top' ? 10 : -10, x: horizontalPosition === 'left' ? -10 : 0 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                    position: 'fixed',
                    top: `${popupPosition.top}px`,
                    left: `${popupPosition.left}px`,
                    width: '280px',
                    zIndex: 99999,
                    pointerEvents: 'auto'
                }}
                className="popup-tour-fixed"
            >
                <Card 
                    ref={popupRef}
                    className={cn(
                    "shadow-lg border-primary/10 dark:border-primary/20 rounded-lg",
                    "relative backdrop-blur-sm bg-white/90 dark:bg-gray-800/90"
                )}>
                    {/* Panah dinamis sesuai posisi */}
                    {getArrowStyles()}
                    
                    <CardHeader className="p-3 pb-2 border-b border-primary/10 dark:border-primary/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {step.icon && <span className="text-lg">{step.icon}</span>}
                                <CardTitle className="text-base font-medium">{step.title}</CardTitle>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded-full hover:bg-primary/10">
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Langkah {currentStep + 1} dari {totalSteps}
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-3 text-sm">
                        <div className="flex space-x-2">
                            <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <p>{step.content}</p>
                        </div>
                    </CardContent>
                    
                    <CardFooter className="flex justify-between p-3 pt-2 border-t border-primary/10 dark:border-primary/20">
                        <div>
                            {currentStep !== 0 && (
                                <Button variant="outline" size="sm" onClick={onPrev} className="h-7 px-2 py-0">
                                    <ChevronLeft className="mr-1 h-3 w-3" />
                                    <span className="text-xs">Sebelumnya</span>
                                </Button>
                            )}
                        </div>
                        <div>
                            {currentStep + 1 !== totalSteps ? (
                                <Button size="sm" onClick={onNext} className="h-7 px-2 py-0">
                                    <span className="text-xs">Lanjut</span>
                                    <ChevronRight className="ml-1 h-3 w-3" />
                                </Button>
                            ) : (
                                <Button size="sm" onClick={onClose} className="h-7 px-2 py-0 bg-green-600 hover:bg-green-700">
                                    <span className="text-xs">Selesai</span>
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </TourPopupPortal>
    );
};
```

### 4. Komponen ActiveElementHighlight

Komponen yang menyoroti elemen yang sedang aktif:

```tsx
const ActiveElementHighlight: FC<{active: boolean}> = ({active}) => {
    if (!active) return null;
    
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-md ring-2 ring-primary ring-offset-2 pointer-events-none"
        />
    );
};
```

### 5. Integrasi pada Komponen Target

Berikut adalah langkah-langkah untuk mengintegrasikan tour pada komponen target:

#### 5.1 Definisikan Langkah-langkah Tour

```tsx
// Data langkah tour
const baseTourSteps: TourStep[] = [
    {
        title: "Nama File",
        content: "Tentukan nama file untuk hasil ekspor CSV Anda di sini.",
        targetId: "csv-filename-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📝",
    },
    // Tambahkan langkah-langkah lainnya...
];
```

#### 5.2 Tambahkan State dan Callbacks

```tsx
// State untuk tour
const [tourActive, setTourActive] = useState(false);
const [currentStep, setCurrentStep] = useState(0);
const [tourSteps, setTourSteps] = useState<TourStep[]>([]);

// Efisiensi dengan menggunakan callback untuk fungsi-fungsi tour
const startTour = useCallback(() => {
    setCurrentStep(0);
    setTourActive(true);
}, []);

const nextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
    }
}, [currentStep, tourSteps.length]);

const prevStep = useCallback(() => {
    if (currentStep > 0) {
        setCurrentStep(prev => prev - 1);
    }
}, [currentStep]);

const endTour = useCallback(() => {
    setTourActive(false);
}, []);
```

#### 5.3 Menyesuaikan Tour Berdasarkan Container

```tsx
// Menyesuaikan langkah-langkah tour berdasarkan tipe container
useEffect(() => {
    const adjustedSteps = baseTourSteps.map(step => {
        if (containerType === "sidebar" || containerType === "panel") {
            // Untuk sidebar/panel: posisi di sebelah kiri elemen
            return {
                ...step,
                horizontalPosition: "left" as HorizontalPosition,
                position: undefined
            };
        } else {
            // Untuk dialog: posisi di atas/bawah elemen, tanpa posisi horizontal khusus
            return {
                ...step,
                horizontalPosition: null, // Gunakan null untuk dialog
                position: step.defaultPosition,
            };
        }
    });
    
    setTourSteps(adjustedSteps);
}, [containerType]);
```

#### 5.4 Mendapatkan Referensi ke Elemen Target

```tsx
// Mendapatkan referensi elemen DOM saat tour aktif
const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});

useEffect(() => {
    if (!tourActive) return;
    
    const elements: Record<string, HTMLElement | null> = {};
    baseTourSteps.forEach(step => {
        elements[step.targetId] = document.getElementById(step.targetId);
    });
    
    setTargetElements(elements);
}, [tourActive]);

// Referensi ke elemen target saat ini
const currentTargetElement = useMemo(() => {
    if (!tourActive || !tourSteps.length || currentStep >= tourSteps.length) {
        return null;
    }
    return targetElements[tourSteps[currentStep].targetId] || null;
}, [tourActive, tourSteps, currentStep, targetElements]);
```

#### 5.5 Render Tour dan Sorotan

```tsx
return (
    <div className="flex flex-col h-full" id="component-container">
        {/* Tour popup */}
        <AnimatePresence>
            {tourActive && tourSteps.length > 0 && currentStep < tourSteps.length && (
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
        
        {/* Konten komponen dengan elemen yang dapat di-highlight */}
        <div className="space-y-1.5 relative" id="example-element-wrapper">
            <Label htmlFor="example-input" className={cn(tourActive && currentStep === 0 ? "text-primary font-medium" : "")}>
                Label Contoh
            </Label>
            <div className="relative">
                <Input
                    id="example-input"
                    placeholder="Placeholder..."
                />
                <ActiveElementHighlight active={tourActive && currentStep === 0} />
            </div>
        </div>
        
        {/* Footer dengan tombol bantuan */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
            {/* Kiri: Tour button (icon only) */}
            <div className="flex items-center text-muted-foreground">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={startTour}
                                className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                            >
                                <HelpCircle className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p className="text-xs">Mulai tour fitur</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            {/* Tombol aksi lainnya */}
        </div>
    </div>
);
```

## Praktik Terbaik dan Tips

### 1. Struktur ID dan Target Elemen

- Berikan ID yang deskriptif dan konsisten untuk setiap elemen target
- Gunakan wrapper dengan ID untuk elemen yang kompleks atau tersusun dari beberapa bagian
- Pastikan elemen target dapat diakses melalui `document.getElementById()`

### 2. Penempatan Popup yang Cerdas

- Gunakan useRef untuk mengukur ukuran popup secara dinamis
- Pertimbangkan ruang yang tersedia di viewport saat menentukan posisi
- Buat logika alternatif jika posisi default tidak memiliki ruang yang cukup 
- Gunakan buffer/margin yang cukup agar popup tidak terlalu dekat dengan elemen target

### 3. Optimasi Performa

- Gunakan `useCallback` dan `useMemo` untuk memastikan performa optimal
- Bersihkan event listeners dan timer pada cleanup function di useEffect
- Pastikan perhitungan ulang posisi hanya terjadi saat perubahan yang relevan
- Gunakan setTimeout untuk memperbarui posisi setelah popup benar-benar dirender

### 4. Responsif dan Aksesibilitas

- Pastikan popup tour terlihat jelas pada berbagai ukuran layar
- Hindari overlap dengan elemen UI lain yang penting 
- Pastikan popup tidak keluar dari viewport dengan cek batas layar
- Tambahkan pointerEvents: 'auto' agar popup dapat diinteraksi
- Gunakan warna yang kontras untuk menyoroti elemen target

### 5. Konsistensi UI/UX

- Untuk tombol bantuan/tour, gunakan icon saja dengan tooltip untuk UI yang bersih
- Posisikan tombol bantuan di area yang konsisten (biasanya di footer kiri)
- Gunakan ukuran dan padding yang konsisten untuk semua popup tour
- Terapkan animasi yang halus dan konsisten untuk transisi antar langkah

## Integrasi dengan Sistem Modal

Pada Statify, tour dapat diintegrasikan dengan sistem modal yang ada, dengan mempertimbangkan:

1. **Posisi Berdasarkan Container**
   - Untuk modal dalam mode panel/sidebar, tampilkan popup di luar panel (sebelah kiri)
   - Untuk modal dialog, posisikan popup di atas/bawah elemen dengan penempatan cerdas
   - Gunakan horizontalPosition: null untuk mode dialog (memungkinkan penempatan otomatis)

2. **Z-Index Management**
   - Popup tour harus memiliki z-index yang lebih tinggi dari modal (99999)
   - Gunakan Portal untuk memastikan popup di-render di luar hirarki DOM normal
   - Tambahkan pointerEvents: 'auto' untuk memastikan popup dapat diinteraksi

3. **Deteksi Tipe Container**
   - Periksa properti `containerType` untuk menentukan jenis container modal
   - Sesuaikan posisi tour berdasarkan tipe container tersebut
   - Perbarui posisi saat ukuran container atau viewport berubah

## Contoh Kasus Penggunaan

### 1. Tour untuk Modal Dialog

```tsx
// Di dalam komponen modal:
<Button 
    variant="ghost" 
    size="icon"
    onClick={startTour}
    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
>
    <HelpCircle className="h-4 w-4" />
</Button>
```

### 2. Tour untuk Halaman Dashboard dengan Persistensi

```tsx
// Pada komponen dashboard utama
const DashboardPage: FC = () => {
  const [showTour, setShowTour] = useState(false);
  
  // Cek apakah ini kunjungan pertama user
  useEffect(() => {
    const isFirstVisit = localStorage.getItem('dashboard_tour_completed') !== 'true';
    if (isFirstVisit) {
      setShowTour(true);
    }
  }, []);
  
  const completeTour = useCallback(() => {
    setShowTour(false);
    localStorage.setItem('dashboard_tour_completed', 'true');
  }, []);
  
  return (
    <div>
      {/* Konten dashboard */}
      {showTour && <DashboardTour onComplete={completeTour} />}
    </div>
  );
};
```

## Kesimpulan

Dengan mengikuti panduan ini, Anda dapat mengimplementasikan fitur tour yang interaktif, responsif, dan user-friendly pada aplikasi Statify. Feature tour ini dapat secara signifikan meningkatkan pengalaman pengguna dan mempercepat adopsi fitur baru.

Beberapa poin penting dalam implementasi:

1. **Penempatan Cerdas** - Menggunakan pengukuran dinamis untuk penempatan popup yang optimal
2. **Responsif** - Menyesuaikan posisi berdasarkan ukuran layar dan tipe container
3. **Efisien** - Menggunakan useRef, useCallback, dan useMemo untuk performa yang baik
4. **Konsisten** - Menjaga konsistensi UI di semua komponen tour
5. **Aksesibel** - Memastikan tour dapat digunakan oleh semua pengguna

Feature tour pada Statify adalah contoh yang baik dari komponen yang sederhana namun kuat, yang meningkatkan pengalaman pengguna tanpa menambahkan ketergantungan eksternal. 
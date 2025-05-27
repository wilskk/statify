# Integrasi Sistem Modal Statify

Dokumen ini menjelaskan cara kerja sistem modal pada Statify dan bagaimana berbagai komponen terintegrasi.

## Arsitektur Modal

Sistem modal Statify menggunakan pendekatan berlapis:

1. **Zustand Store** - Mengelola state modal (mana yang terbuka, propertinya)
2. **Registry Modal** - Memetakan jenis modal ke komponen React
3. **Manager Modal** - Menampilkan modal yang aktif dengan container yang tepat
4. **Renderer Modal** - Merender modal dengan format yang sesuai (dialog/sidebar)
5. **Template Modal** - Template untuk konsistensi visual dalam kategori modal tertentu
6. **Komponen Modal** - Implementasi actual dari setiap modal

## Container Modal

Modal dapat ditampilkan dalam dua container:

- **Dialog** - Modal popup tengah yang menutupi konten utama (ideal untuk mobile)
- **Sidebar** - Panel samping yang memungkinkan interaksi dengan konten utama (desktop)

Tipe container ditentukan berdasarkan:
1. Preferensi yang ditetapkan di `MODAL_CONTAINER_PREFERENCES`
2. Device yang digunakan (mobile selalu dialog)
3. Permintaan eksplisit saat membuka modal

## Cara Membuka Modal

```tsx
// Dari komponen React
import { useModal } from "@/hooks/useModal";
import { ModalType } from "@/types/modalTypes";

const MyComponent: React.FC = () => {
  const { openModal } = useModal();
  
  const handleOpenModal = () => {
    openModal(ModalType.ImportCSV);
    
    // Dengan props tambahan
    openModal(ModalType.ImportCSV, { initialData: someData });
    
    // Jika perlu mengganti container
    // (Catatan: ini hanya saran, preferensi di ModalRegistry tetap didahulukan)
    openModal(ModalType.ImportCSV, { containerOverride: "dialog" });
  };
  
  return <button onClick={handleOpenModal}>Open Import CSV</button>;
};
```

## Bagaimana Menambahkan Modal Baru

### 1. Daftarkan Tipe Modal

Di `types/modalTypes.ts`:

```tsx
export enum ModalType {
  // Modal yang ada
  ImportCSV = "ImportCSV",
  
  // Tambahkan modal baru
  MyNewModal = "MyNewModal",
}

// Tetapkan kategori modal
export const MODAL_CATEGORIES: Record<ModalType, ModalCategory> = {
  // Entri yang ada
  [ModalType.ImportCSV]: ModalCategory.File,
  
  // Tambahkan ke kategori yang sesuai
  [ModalType.MyNewModal]: ModalCategory.Data,
};
```

### 2. Buat Komponen Modal

Buat file modal di direktori yang sesuai dengan kategorinya:

```tsx
// components/Modals/Data/MyNewModal.tsx
import React from "react";
import { BaseModalProps } from "@/types/modalTypes";

const MyNewModal: React.FC<BaseModalProps> = ({ 
  onClose, 
  containerType = "dialog",
  ...props 
}) => {
  return (
    <FileModalTemplate
      title="My New Modal"
      onClose={onClose}
      containerType={containerType}
    >
      <div>Modal content goes here</div>
    </FileModalTemplate>
  );
};

export default MyNewModal;
```

### 3. Daftarkan di Registry

Di `components/Modals/ModalRegistry.tsx`:

```tsx
// Import komponen modal
import MyNewModal from '@/components/Modals/Data/MyNewModal';

export const MODAL_COMPONENTS: ModalComponentRegistry = {
  // Modal yang ada
  [ModalType.ImportCSV]: ImportCsv,
  
  // Tambahkan modal baru
  [ModalType.MyNewModal]: MyNewModal as React.ComponentType<BaseModalProps>,
};

// Opsional: Tetapkan preferensi container
export const MODAL_CONTAINER_PREFERENCES = {
  // Preferensi yang ada
  [ModalType.ImportCSV]: "dialog",
  
  // Preferensi untuk modal baru (jika perlu)
  [ModalType.MyNewModal]: "sidebar",
};
```

## Tips dan Best Practices

1. **Gunakan Template** - Untuk kategori modal tertentu (seperti File), gunakan template yang sesuai untuk konsistensi UI
2. **Lazy Loading** - Modal kompleks lebih baik di-lazy load untuk performa
3. **Modal Multi-Tahap** - Gunakan state internal untuk modal yang memiliki beberapa tahap, hindari membuka modal baru
4. **Hindari Recursive Modals** - Jangan buka modal dari dalam modal lain jika tidak diperlukan
5. **Type Safety** - Selalu gunakan `BaseModalProps` dan type assertion jika diperlukan

# Performa dan Optimasi

## Lazy Loading

Modal besar seperti modal regresi, analisis, dan chart, sekarang menggunakan lazy loading untuk meningkatkan performa:

```tsx
// Contoh implementasi lazy loading di ModalRegistry
const ChartBuilderModal = lazy(() => import('@/components/Modals/Graphs/ChartBuilder/ChartBuilderModal'));

// Penggunaan dengan HOC wrapper
[ModalType.ChartBuilderModal]: withSuspense(ChartBuilderModal as any) as React.ComponentType<BaseModalProps>,
```

Manfaat utama:
- Bundle JavaScript lebih kecil untuk initial load
- Modal dimuat hanya saat dibutuhkan
- Loading state otomatis dengan Suspense
- Aplikasi terasa lebih responsif

## Responsif terhadap Perangkat

Sistem modal sekarang secara otomatis menyesuaikan container berdasarkan perangkat:

```tsx
// Implementasi di ModalRenderer
useEffect(() => {
  // Preferensi dari registry
  const preferredContainer = getModalContainerType(modalType, requestedContainer);
  
  // Tentukan container optimal berdasarkan perangkat dan preferensi
  const optimalContainer = getDeviceOptimalContainer(preferredContainer);
  setFinalContainerType(optimalContainer);
  
  // Responsif terhadap perubahan ukuran
  window.addEventListener("resize", handleResize);
}, [modalType, requestedContainer]);
```

Aturan dasar untuk container:
- Mobile selalu menggunakan dialog
- Desktop menggunakan sidebar untuk modal kompleks (default preference)
- Desktop menggunakan dialog untuk modal sederhana
- Perubahan ukuran window direspons secara real-time

# Penggunaan Efektif

## Menentukan Container untuk Modal

Ada 3 level prioritas untuk menentukan container modal:

1. **containerOverride** - Prioritas tertinggi, memaksa penggunaan container tertentu:
   ```tsx
   openModal(ModalType.ModalLinear, { containerOverride: "dialog" });
   ```

2. **MODAL_CONTAINER_PREFERENCES** - Preferensi default untuk setiap modal:
   ```tsx
   // Di ModalRegistry.tsx
   export const MODAL_CONTAINER_PREFERENCES = {
     [ModalType.ChartBuilderModal]: "dialog",
     [ModalType.ModalLinear]: "sidebar",
   };
   ```

3. **Device Detection** - Fallback berdasarkan perangkat:
   - Mobile selalu dialog 
   - Desktop mengikuti preferensi

## Praktik Terbaik

1. **Mengoptimalkan Modal Baru**
   - Daftarkan sebagai lazy loaded component jika modal jarang digunakan
   - Tentukan preferensi container yang sesuai
   - Gunakan FileModalTemplate untuk modal File

2. **Type Safety**
   - Gunakan `BaseModalProps` sebagai basis semua props modal
   - Gunakan `as any` hanya saat diperlukan untuk komponen lazy

3. **Performa**
   - Hindari meletakkan data besar di props modal
   - Gunakan context untuk data yang dibutuhkan oleh banyak modal 
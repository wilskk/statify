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

Buat file modal di direktori yang sesuai dengan kategorinya. Komponen modal harus bertanggung jawab atas tata letak dan padding internalnya sendiri, karena `ModalRenderer` menyediakan shell minimal (terutama untuk dialog, di mana `DialogContent` kini tidak memiliki padding default).

**Struktur yang Direkomendasikan (mengikuti pola `GoTo.tsx`):**

1.  **Komponen Konten Internal (misalnya, `YourModalContent.tsx` atau langsung di dalam file modal utama):**
    *   Komponen ini berisi semua elemen UI inti (input, tombol, teks, dll.).
    *   **PENTING**: Definisikan padding yang konsisten untuk konten ini (misalnya, menggunakan kelas Tailwind seperti `p-6` untuk area utama dan `px-6 py-4` untuk footer jika ada).
    *   Komponen ini harus dirancang agar terlihat benar baik di dalam dialog maupun sidebar.

2.  **Komponen Modal Utama (misalnya, `YourModal.tsx`):**
    *   Menerima `BaseModalProps` (termasuk `onClose` dan `containerType`).
    *   Berdasarkan `containerType`:
        *   **Jika `containerType === "dialog"`**: Langsung render komponen Konten Internal Anda. `ModalRenderer` akan membungkusnya dengan `<Dialog>` dan `<DialogContent>` (yang sekarang tidak memiliki padding sendiri). Padding dari Konten Internal Anda akan diterapkan.
        *   **Jika `containerType === "sidebar"`**: Buat elemen pembungkus dasar jika diperlukan (misalnya, `div` dengan `flex flex-col h-full`) untuk memastikan Konten Internal Anda mengisi ruang sidebar dengan benar. `ModalRenderer` menyediakan shell sidebar dasar dengan header. Render Konten Internal Anda di dalam pembungkus ini.

**Contoh (`components/Modals/MyCategory/MyNewModal.tsx`):**

```tsx
// components/Modals/MyCategory/MyNewModal.tsx
import React from "react";
import { BaseModalProps } from "@/types/modalTypes";
// Asumsikan Anda memiliki Button, dll. dari library UI Anda

// Ini adalah bagian konten inti dari modal Anda
const MyNewModalContent: React.FC<Omit<BaseModalProps, 'containerType'>> = ({ 
  onClose, 
  ...props 
}) => {
  // props lainnya bisa di-destructure di sini jika spesifik untuk modal ini
  
  return (
    <>
      {/* Area Konten Utama dengan Padding */}
      <div className="p-6 flex-grow overflow-auto">
        {/* 
          Ganti bagian ini dengan konten modal Anda yang sebenarnya.
          Misalnya, form, informasi, dll.
        */}
        <h3 className="text-lg font-medium">Konten Modal Baru</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Ini adalah isi dari modal baru Anda. Pastikan untuk mengatur semua elemen UI
          dan logika yang diperlukan di sini.
        </p>
        <div className="mt-4">
          {/* Contoh elemen interaktif */}
          <label htmlFor="myInput" className="block text-sm font-medium text-gray-700">
            Input Contoh:
          </label>
          <input
            type="text"
            id="myInput"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Ketik sesuatu..."
          />
        </div>
      </div>

      {/* Footer dengan Padding dan Tombol Aksi */}
      <div className="px-6 py-4 border-t border-border bg-muted flex-shrink-0 flex justify-end space-x-2">
        {/* Ganti dengan tombol yang relevan untuk modal Anda */}
        <button 
          type="button"
          onClick={() => alert("Tombol Bantuan Diklik!")}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Bantuan
        </button>
        <button 
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={() => {
            alert("Aksi Utama Dilakukan!");
            onClose(); // Tutup modal setelah aksi
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Simpan Perubahan
        </button>
      </div>
    </>
  );
};


const MyNewModal: React.FC<BaseModalProps> = ({ 
  onClose, 
  containerType = "dialog", // Default ke dialog, tapi akan di-resolve oleh ModalRenderer
  ...props 
}) => {
  if (containerType === "sidebar") {
    return (
      <div className="flex flex-col h-full bg-background text-foreground">
        {/* 
          ModalRenderer akan menyediakan header untuk sidebar (judul, tombol close global).
          MyNewModalContent akan mengisi sisa ruang.
        */}
        <MyNewModalContent onClose={onClose} {...props} />
      </div>
    );
  }

  // Untuk containerType === "dialog"
  // ModalRenderer menyediakan <Dialog> dan <DialogContent> (tanpa padding).
  // MyNewModalContent menyediakan paddingnya sendiri.
  return (
    <MyNewModalContent onClose={onClose} {...props} />
  );
};

export default MyNewModal;
```

**Penggunaan Template (misalnya `FileModalTemplate`):**

Jika Anda menggunakan komponen template seperti `FileModalTemplate`, pastikan template tersebut juga mengikuti prinsip ini:
*   Template harus menangani paddingnya sendiri secara internal, ATAU
*   Template harus dirancang untuk membungkus konten yang sudah memiliki paddingnya sendiri.

Contoh jika `FileModalTemplate` menangani shell dan Anda memasukkan konten:
```tsx
// components/Modals/Data/MyNewModalWithTemplate.tsx
import React from "react";
import { BaseModalProps } from "@/types/modalTypes";
// import FileModalTemplate from "@/components/Modals/Templates/FileModalTemplate"; // Path contoh

const MyNewModalWithTemplate: React.FC<BaseModalProps> = ({ 
  onClose, 
  containerType = "dialog", // Akan di-resolve oleh ModalRenderer
  ...props 
}) => {
  // Konten spesifik untuk modal ini, yang mungkin perlu paddingnya sendiri
  // jika FileModalTemplate tidak menyediakannya untuk area konten.
  const modalSpecificContent = (
    <div className="p-4"> {/* Padding di sini jika FileModalTemplate tidak memberi padding untuk slot konten */}
      Konten spesifik modal saya.
    </div>
  );

  return (
    <FileModalTemplate // Asumsikan FileModalTemplate sudah adaptif terhadap containerType
      title="My New Modal with Template"
      onClose={onClose}
      containerType={containerType} // Teruskan containerType ke template
      // Props lain untuk FileModalTemplate
    >
      {modalSpecificContent}
    </FileModalTemplate>
  );
};

export default MyNewModalWithTemplate;
```
Penting untuk memeriksa implementasi `FileModalTemplate` untuk memastikan ia berintegrasi dengan benar dengan sistem padding yang baru.

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
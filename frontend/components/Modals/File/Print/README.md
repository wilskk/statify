# Print Modal (Print to PDF)

Modul ini menyediakan fitur ekspor/print data ke PDF pada aplikasi Statify. Komponen ini digunakan sebagai modal untuk mengatur opsi ekspor dan menghasilkan file PDF dari data, variabel, dan hasil analisis.

---

## Struktur Folder

```
Print/
├── Print.tsx                     # Komponen utama modal print
├── index.ts                      # Entry point & re-eksport modul
├── components/
│   └── PrintOptions.tsx          # Komponen UI untuk opsi print
├── hooks/
│   └── usePrintLogic.ts          # Custom hook untuk logika print
├── services/
│   └── pdfPrintService.ts        # Service untuk generate PDF (menggunakan jsPDF)
├── types/
│   └── index.ts                  # Tipe TypeScript untuk props, state, dsb
└── utils/
    └── index.ts                  # Utility functions terkait print
```

---

## Fitur

- **Pilih Data yang Akan Diekspor:**  
  Pengguna dapat memilih bagian data (data, variabel, hasil) yang ingin dimasukkan ke PDF.
- **Pengaturan Nama File:**  
  Nama file PDF dapat diubah sebelum diekspor.
- **Pilihan Ukuran Kertas:**  
  Mendukung beberapa ukuran kertas: `a4`, `a3`, `letter`, `legal`.
- **Mode Portrait/Landscape & Responsif:**  
  Tampilan modal dan opsi menyesuaikan perangkat (mobile/desktop).
- **Ekspor PDF:**  
  Menggunakan [jsPDF](https://github.com/parallax/jsPDF) untuk generate PDF, dengan dukungan tabel otomatis.

---

## Cara Pakai

### Import dan Gunakan Modal

```tsx
import { PrintModal } from "@/components/Modals/File/Print";

// ...
<PrintModal onClose={handleClose} containerType="dialog" />
```

### Props

Lihat tipe [`PrintProps`](./types/index.ts):

- `onClose: () => void`  
  Callback ketika modal ditutup.
- `containerType?: ContainerType`  
  (Opsional) Tipe kontainer/modal.

---

## Komponen Utama

- [`PrintModal`](./Print.tsx):  
  Komponen utama modal print.
- [`PrintOptions`](./components/PrintOptions.tsx):  
  Komponen UI untuk pengaturan opsi print.
- [`usePrintLogic`](./hooks/usePrintLogic.ts):  
  Custom hook untuk state & handler print.
- [`pdfPrintService`](./services/pdfPrintService.ts):  
  Service untuk generate PDF.

---

## Tipe Data

Lihat [`types/index.ts`](./types/index.ts) untuk detail tipe:

- `PaperSize`
- `SelectedOptions`
- `PrintProps`
- `PrintOptionsProps`
- dll.

---

## Dependensi

- [jsPDF](https://github.com/parallax/jsPDF)
- [React](https://react.dev/)
- Komponen UI internal (`@/components/ui`)

---

## Pengembangan

1. **Edit UI Opsi Print:**  
   Ubah [`PrintOptions.tsx`](./components/PrintOptions.tsx).
2. **Logika Print:**  
   Modifikasi [`usePrintLogic.ts`](./hooks/usePrintLogic.ts).
3. **Ekspor PDF:**  
   Tambahkan/ubah fungsi di [`pdfPrintService.ts`](./services/pdfPrintService.ts).

---

## Lisensi

Lihat [LICENSE](../../../../LICENSE) di root proyek.

# PrintModal Component

## Overview

The `PrintModal` component offers a user interface for configuring print settings before generating a document for printing. Users can specify a filename, select which sections of content to include, choose a paper size, and then trigger the print generation.

## Features

-   **File Name**: Allows users to set a custom file name for the generated print output.
-   **Content Selection**: Users can choose which parts of the application's content to include in the printout. Based on `SelectedOptions` type, this likely includes:
    -   Data (e.g., the main dataset)
    -   Variable information (e.g., variable list, properties)
    -   Results (e.g., output from analyses or operations)
-   **Paper Size**: Users can select from various standard paper sizes:
    -   A4
    -   A3
    -   Letter
    -   Legal
-   **Print Action**: Initiates the generation of the print document with the chosen settings.
-   **Cancel Action**: Closes the print modal.
-   **Reset Options**: Allows users to revert print settings to their default values.
-   **Loading State**: Indicates when the print document is being generated.
-   **Responsive Design**: UI adapts based on mobile and portrait/landscape orientations.

## Component Structure

The `PrintModal` component (exported from `index.tsx`) acts as a container that utilizes:

-   **`usePrintLogic` hook**: This custom hook manages all the state related to print options (filename, content selections, paper size), loading state (`isGenerating`), screen orientation flags (`isMobile`, `isPortrait`), and provides handlers for print, close, and reset actions.
-   **`PrintOptions` sub-component**: (Likely located in `components/PrintOptions.tsx`) This component receives state and handlers from `usePrintLogic` as props and renders the actual UI for all the configurable print settings and action buttons.

## Component Props

The main `PrintModal` component accepts the following props:

-   `onClose: () => void`: A mandatory function that is called when the print modal is to be closed (e.g., via the "Cancel" button or after print generation is initiated).
-   `containerType?: "dialog" | "sidebar"`: (Optional, based on `ContainerType`) Specifies the rendering context, which can influence layout or styling.

## Usage

The `PrintModal` is typically invoked as part of a modal system within the application.

```tsx
import PrintModal from "./PrintModal"; // Adjust path as necessary

// Example:
const MyAppPage = () => {
    const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false);

    const handleOpenPrintModal = () => setIsPrintModalOpen(true);
    const handleClosePrintModal = () => {
        setIsPrintModalOpen(false);
        // Any actions after closing the print modal
    };

    return (
        <>
            <Button onClick={handleOpenPrintModal}>Print</Button>
            {isPrintModalOpen && (
                <PrintModal
                    onClose={handleClosePrintModal}
                    containerType="dialog"
                />
            )}
        </>
    );
};
```

## Dependencies

-   React
-   `./hooks/usePrintLogic.ts` (core logic and state management)
-   `./components/PrintOptions.tsx` (UI for settings)
-   `./types.ts` (for `PrintProps`, `SelectedOptions`, `PaperSize`, etc.)
-   `@/types/ui` (for `ContainerType`)
-   (Likely) UI component libraries such as `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/select`, `@/components/ui/checkbox` used within `PrintOptions.tsx`.
-   (Likely) `lucide-react` for icons used in `PrintOptions.tsx`.

## Structure within the Module

-   `index.tsx`: The main `PrintModal` component.
-   `types.ts`: Defines TypeScript interfaces for props, print options, and hook return types.
-   `hooks/`: Contains `usePrintLogic.ts`.
-   `components/`: Contains `PrintOptions.tsx`.
-   `services/`: (Potentially) If print generation involves complex backend calls or specific service interactions.
-   `utils/`: (Potentially) For utility functions related to document generation or formatting if not handled by a dedicated service or library.

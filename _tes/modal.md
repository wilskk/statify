Berikut adalah ringkasan file yang diubah dan tanggung jawab masing-masing dalam sistem baru ini:

1.  **`frontend/app/dashboard/layout.tsx`**:
    *   **Tanggung Jawab**: File ini mengatur tata letak utama untuk dashboard.
    *   **Perubahan**:
        *   Menggunakan `ResizablePanelGroup`, `ResizablePanel`, dan `ResizableHandle` dari `shadcn/ui` untuk membuat area konten utama dan area sidebar yang dapat diubah ukurannya di tampilan desktop.
        *   Menampilkan `SidebarContainer` di panel sidebar hanya jika ada modal yang aktif (`hasOpenModal` true) dan pengguna tidak di perangkat mobile.
        *   Menampilkan `ModalContainer` (untuk dialog standar) jika ada modal yang aktif dan pengguna berada di perangkat mobile.
        *   Mengelola lebar sidebar (`sidebarWidth`) dan mengatur ulang `ResizablePanelGroup` menggunakan `key` untuk memastikan ukuran default diterapkan dengan benar saat beralih antara mode dengan/tanpa sidebar atau mobile/desktop.

2.  **`frontend/components/layout/dashboard/SidebarContainer.tsx`**:
    *   **Tanggung Jawab**: Komponen ini bertanggung jawab untuk merender konten modal di dalam struktur sidebar.
    *   **Perubahan**:
        *   Dibuat untuk menampung modal yang aktif ketika `containerType` diatur ke "sidebar".
        *   Menampilkan judul modal dan tombol tutup di bagian header sidebar.
        *   Memanggil komponen modal yang sesuai (misalnya, `DescriptiveModal`) dengan prop `containerType="sidebar"`.

3.  **`frontend/components/Modals/ModalContainer.tsx`**:
    *   **Tanggung Jawab**: Komponen ini bertugas merender modal sebagai dialog tradisional yang muncul di tengah layar.
    *   **Perubahan (Implisit/Penggunaan)**:
        *   Digunakan secara spesifik ketika `containerType` adalah "dialog", terutama pada perangkat mobile atau ketika perilaku dialog standar diinginkan di desktop.
        *   Dashboard layout (`frontend/app/dashboard/layout.tsx`) sekarang secara eksplisit menggunakan `ModalContainer` dengan `containerType="dialog"` untuk kasus mobile.

4.  **`frontend/components/Modals/Descriptive/index.tsx`** (Contoh Modal Spesifik):
    *   **Tanggung Jawab**: Ini adalah salah satu komponen modal individual (misalnya, untuk analisis deskriptif).
    *   **Perubahan**:
        *   Direfaktor secara signifikan untuk memisahkan logika tampilan konten inti dari logika container (dialog vs sidebar).
        *   Memperkenalkan komponen internal baru `DescriptiveContent` yang berisi elemen UI aktual dari modal (tab, tombol, input, dll.) tanpa pembungkus spesifik dialog.
        *   Komponen utama `Descriptives` sekarang bertindak sebagai pembungkus:
            *   Jika `containerType` adalah `"sidebar"`, ia merender `DescriptiveContent` di dalam struktur `div` sederhana yang cocok untuk sidebar.
            *   Jika `containerType` adalah `"dialog"`, ia merender `DescriptiveContent` di dalam komponen standar `shadcn/ui` seperti `DialogContent`, `DialogHeader`, dll.
        *   Menerima prop `containerType` untuk menentukan cara merendernya.

5.  **`frontend/components/Modals/DescriptiveModal.tsx`** (Contoh Modal Grup/Router):
    *   **Tanggung Jawab**: Komponen ini bertindak sebagai "router" atau pengelola untuk sekelompok modal terkait (misalnya, berbagai jenis analisis deskriptif seperti `Descriptives`, `Explore`, `Frequencies`).
    *   **Perubahan**:
        *   Dimodifikasi untuk menerima dan meneruskan prop `containerType` ke komponen modal spesifik yang direndernya.
        *   Ketika `containerType` adalah `"sidebar"`, ia langsung merender komponen modal anak yang dipilih (misalnya, `Descriptives`) dengan `containerType="sidebar"`. Komponen anak ini kemudian bertanggung jawab untuk merender tanpa pembungkus `Dialog` dari `shadcn/ui`.
        *   Ketika `containerType` adalah `"dialog"`, ia mungkin masih perlu membungkus output dari komponen modal anak dalam `<Dialog>` jika anak tersebut tidak sudah merender `DialogContent` penuh. Ini adalah area yang memerlukan penanganan hati-hati untuk menghindari `Dialog` bersarang dan error terkait.

6.  **`frontend/types/ui.ts`**:
    *   **Tanggung Jawab**: File ini mendefinisikan tipe TypeScript yang digunakan di seluruh UI.
    *   **Perubahan**:
        *   Dibuat untuk mendefinisikan tipe `ContainerType` (`"dialog" | "sidebar"`).
        *   Mendefinisikan interface `ContainerProps` yang menyertakan `containerType` opsional, yang dapat digunakan oleh komponen modal.

7.  **Komponen Modal Individual Lainnya (misalnya, `Frequencies`, `Explore` di bawah `frontend/components/Modals/Descriptive/`)**:
    *   **Tanggung Jawab**: Menyediakan UI dan logika untuk fungsionalitas modal spesifik mereka.
    *   **Perubahan (Dibutuhkan/Implikasi)**:
        *   Komponen-komponen ini perlu dimodifikasi (mirip dengan `Descriptives`) untuk menerima prop `containerType`.
        *   Mereka harus secara kondisional merender konten mereka. Jika `containerType` adalah `"sidebar"`, mereka TIDAK BOLEH merender sub-komponen `Dialog` dari `shadcn/ui` (seperti `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogClose`). Sebaliknya, mereka harus merender konten inti mereka dalam struktur dasar yang sesuai untuk disematkan di `SidebarContainer`.
        *   Jika `containerType` adalah `"dialog"`, mereka dapat terus menggunakan sub-komponen `Dialog` seperti sebelumnya.

Tujuan utama dari perubahan ini adalah untuk membuat komponen modal cukup fleksibel sehingga konten intinya dapat ditampilkan baik dalam dialog tradisional maupun dalam sidebar, tergantung pada prop `containerType` yang diterimanya. Ini memungkinkan `frontend/app/dashboard/layout.tsx` untuk memutuskan mekanisme presentasi berdasarkan ukuran layar dan status modal.

**Strategi Utama untuk Komponen Modal:**

Inti dari perubahannya adalah membuat setiap komponen modal individual (seperti `Descriptives`, `Frequencies`, `Explore`, dll.) bertanggung jawab atas bagaimana ia menampilkan dirinya berdasarkan prop `containerType` yang diterimanya.

Berikut adalah detailnya:

1.  **Penerimaan Prop `containerType`**:
    *   Setiap komponen modal yang dapat ditampilkan baik sebagai dialog maupun di sidebar sekarang harus menerima prop baru, misalnya `containerType?: "dialog" | "sidebar"`. Jika prop ini tidak disediakan, ia bisa default ke `"dialog"` untuk kompatibilitas mundur.

2.  **Pemisahan Konten Inti dari Kontainer (Pembungkus)**:
    *   Ini adalah langkah kunci. Untuk setiap modal, kita perlu memisahkan UI sebenarnya (input, tombol, tab, dll.) dari komponen-komponen `Dialog` milik `shadcn/ui`.
    *   **Contoh: `Descriptive/index.tsx`**
        *   Sebuah komponen internal baru, `DescriptiveContent`, telah dibuat.
        *   `DescriptiveContent` hanya berisi elemen-elemen UI murni dari modal "Descriptives" (misalnya, daftar variabel, pilihan statistik, tombol "OK", "Cancel", dll.).
        *   Yang terpenting, `DescriptiveContent` *tidak* menyertakan komponen seperti `<Dialog>`, `<DialogContent>`, `<DialogHeader>`, `<DialogFooter>`, atau `<DialogClose>` dari `shadcn/ui`.

3.  **Logika Rendering Bersyarat di Komponen Modal Utama**:
    *   Komponen modal utama (misalnya, `Descriptives` dalam `frontend/components/Modals/Descriptive/index.tsx`) sekarang bertindak sebagai "pembungkus" atau "pabrik" yang memutuskan bagaimana `DescriptiveContent` (atau konten inti serupa) akan disajikan.
    *   **Jika `containerType === "sidebar"`**:
        *   Komponen modal utama akan merender komponen konten intinya (misalnya, `<DescriptiveContent />`) secara langsung, mungkin hanya di dalam sebuah `<div>` atau elemen struktural dasar lainnya jika diperlukan.
        *   Tidak ada komponen `Dialog...` dari `shadcn/ui` yang digunakan dalam mode ini. Judul modal dan tombol tutup global akan ditangani oleh `SidebarContainer`. Tombol-tombol aksi spesifik modal (seperti "OK", "Cancel") tetap menjadi bagian dari komponen konten inti.
    *   **Jika `containerType === "dialog"` (atau default)**:
        *   Komponen modal utama akan merender struktur dialog `shadcn/ui` yang lengkap, menyematkan komponen konten intinya di dalam.
        *   Contoh untuk `Descriptives`:
            ```tsx
            // Di dalam komponen Descriptives
            if (containerType === "sidebar") {
                return <DescriptiveContent {...props} />;
            } else {
                // containerType === "dialog" atau tidak terdefinisi
                return (
                    <Dialog open={isOpen} onOpenChange={handleClose}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Descriptives</DialogTitle>
                                {/* <DialogDescription>...</DialogDescription> */}
                            </DialogHeader>
                            <DescriptiveContent {...props} /> {/* Menyematkan konten inti */}
                            {/* <DialogFooter>
                                Tombol-tombol bisa tetap di DescriptiveContent
                                atau didefinisikan di sini jika desainnya begitu.
                                Idealnya di DescriptiveContent untuk konsistensi.
                            </DialogFooter> */}
                        </DialogContent>
                    </Dialog>
                );
            }
            ```

4.  **Peran Komponen Modal Grup/Router (Contoh: `DescriptiveModal.tsx`)**:
    *   Komponen seperti `DescriptiveModal` bertindak sebagai perantara atau pemilih, menentukan modal spesifik mana (misalnya, `Descriptives`, `Frequencies`, `Explore`) yang akan dirender berdasarkan state aplikasi.
    *   **Meneruskan `containerType`**: Komponen ini harus menerima `containerType` dari atasannya (`SidebarContainer` atau `ModalContainer`).
    *   Ketika ia merender modal anak yang dipilih, ia harus meneruskan prop `containerType` tersebut ke anak:
        ```tsx
        // Di dalam DescriptiveModal.tsx
        const ModalComponentToRender = getModalComponentBasedOnType(modal.type); // Misal, mengembalikan komponen Descriptives

        return <ModalComponentToRender {...modal.props} containerType={containerType} />;
        ```
    *   **Menghindari Dialog Bersarang**: Kesalahan awal (`DialogPortal must be used within Dialog`) kemungkinan besar terjadi karena `DescriptiveModal` *dan* modal anak yang direndernya (misalnya `Frequencies` sebelum direfaktor) sama-sama mencoba merender bagian-bagian dari komponen `Dialog` `shadcn/ui`. Dengan strategi baru, hanya modal anak individual yang bertanggung jawab atas pembungkus `Dialog`nya sendiri ketika `containerType` adalah "dialog". `DescriptiveModal` hanya meneruskan `containerType`.

5.  **Modifikasi untuk Semua Modal Individual Lainnya**:
    *   Pola yang diterapkan pada `Descriptives` perlu diterapkan pada semua komponen modal lain yang ingin mendukung tampilan sidebar (misalnya, `Frequencies`, `Explore`, `Crosstabs`, semua modal di bawah `Analyze`, `Regression`, `Graphs`, dll.).
    *   Setiap modal ini harus:
        *   Menerima prop `containerType`.
        *   Memisahkan konten UI-nya menjadi sub-komponen `[NamaModal]Content`.
        *   Secara kondisional membungkus `[NamaModal]Content` tersebut dengan komponen `Dialog` `shadcn/ui` hanya jika `containerType` adalah "dialog".
        *   **Poin Kritis**: Ketika `containerType` adalah "sidebar", komponen modal *tidak boleh* merender *bagian apa pun* dari `Dialog` `shadcn/ui` (seperti `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogClose`). Jika, misalnya, `DialogClose` dirender tanpa `Dialog` dan `DialogContent` sebagai leluhurnya (yang akan terjadi dalam mode sidebar jika tidak ditangani dengan benar), ini akan menyebabkan error.

**Ringkasan Tanggung Jawab Komponen Modal dalam Sistem Baru:**

1.  **Sadar Konteks**: Setiap modal harus tahu apakah ia dirender dalam konteks "dialog" atau "sidebar" melalui prop `containerType`.
2.  **Konten Terpisah**: Elemen UI inti dari modal (formulir, tab, tombol aksi) harus berada dalam sub-komponen yang terpisah dan agnostik terhadap cara ia ditampilkan.
3.  **Rendering Kontainer Bersyarat**: Komponen modal utama memutuskan bagaimana "membingkai" komponen kontennya:
    *   Untuk "sidebar": Tidak ada pembungkus `Dialog` `shadcn/ui`. `SidebarContainer` menyediakan bingkai keseluruhan.
    *   Untuk "dialog": Gunakan komponen `Dialog` `shadcn/ui` standar untuk membungkus konten.
4.  **Meneruskan `containerType`**: Komponen router/grup modal bertanggung jawab untuk meneruskan `containerType` ke modal spesifik yang mereka render.

Pendekatan ini memastikan bahwa komponen `Dialog` dari `shadcn/ui` hanya digunakan ketika dialog benar-benar dimaksudkan, mencegah error, dan memungkinkan konten ditampilkan secara fleksibel dalam berbagai jenis kontainer. Ini adalah kunci untuk memperbaiki error `DialogPortal` dan mencapai fungsionalitas yang diinginkan.

Ada beberapa poin yang mungkin bisa diperjelas atau ditambahkan untuk memastikan pemahaman yang lebih mendalam, terutama terkait interaksi antar komponen modal dan aliran prop `containerType`:

1.  **Peran Eksklusif Komponen Modal Individual dalam Merender Pembungkus `Dialog`**:
    *   Penting untuk ditekankan bahwa hanya komponen modal *individual dan paling akhir* dalam rantai pemanggilan (misalnya, `Descriptives`, `Frequencies`, bukan `DescriptiveModal`) yang bertanggung jawab untuk merender pembungkus `<Dialog>`, `<DialogContent>`, dll., dari `shadcn/ui`, dan ini *hanya* jika `containerType` adalah `"dialog"`.
    *   Komponen "grup" atau "router" modal seperti `DescriptiveModal` seharusnya **tidak** mencoba membungkus anak-anaknya dengan komponen `<Dialog>` dari `shadcn/ui`. Tugas utamanya adalah memilih modal anak yang benar untuk dirender dan *meneruskan* prop `containerType` ke modal anak tersebut. Jika `DescriptiveModal` juga mencoba merender `Dialog`, dan kemudian `Descriptives` (anaknya) juga melakukannya untuk `containerType="dialog"`, ini akan menyebabkan `Dialog` bersarang dan potensi error.

2.  **Aliran Prop `containerType` dari Hulu ke Hilir**:
    *   `DashboardLayout`: Memutuskan apakah akan menggunakan `SidebarContainer` atau `ModalContainer`.
    *   `SidebarContainer`: *Selalu* memanggil komponen modal grup/router (misalnya `DescriptiveModal`) dengan `containerType="sidebar"`.
    *   `ModalContainer`: *Selalu* memanggil komponen modal grup/router (misalnya `DescriptiveModal`) dengan `containerType="dialog"` (atau modal anak akan default ke "dialog" jika `ModalContainer` tidak secara eksplisit meneruskannya, meskipun meneruskannya secara eksplisit lebih baik).
    *   Komponen Modal Grup/Router (misalnya `DescriptiveModal`): Menerima `containerType` dari `SidebarContainer` atau `ModalContainer` dan meneruskannya tanpa perubahan ke komponen modal individual yang dipilihnya (misalnya `Descriptives`).
    *   Komponen Modal Individual (misalnya `Descriptives`): Menerima `containerType` dan menggunakannya untuk memutuskan apakah akan merender dirinya dengan atau tanpa pembungkus `Dialog` `shadcn/ui`.

3.  **Absolut Tidak Adanya Komponen `Dialog` `shadcn/ui` dalam Mode Sidebar**:
    *   Untuk menghindari error seperti `DialogPortal must be used within Dialog`, sangat penting bahwa ketika sebuah modal dirender dengan `containerType="sidebar"`, komponen tersebut (dan sub-komponen kontennya) **tidak boleh** merender *bagian apa pun* dari `shadcn/ui Dialog system`. Ini termasuk `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, dan yang paling penting, `DialogClose`. Jika `DialogClose`, misalnya, dirender tanpa `DialogContent` sebagai leluhurnya (yang akan terjadi dalam mode sidebar jika tidak ditangani), error akan muncul. Semua fungsionalitas penutupan dalam mode sidebar harus ditangani oleh `SidebarContainer` atau tombol dalam konten modal yang secara langsung memanggil `useModalStore.closeModal()`.

4.  **Logika Penutupan Modal**:
    *   Di `SidebarContainer`, sudah ada tombol tutup global. Ini harus memicu fungsi penutupan modal dari `useModalStore`.
    *   Tombol aksi di dalam konten modal itu sendiri (misalnya, "OK", "Cancel", "Apply") juga harus berinteraksi dengan `useModalStore` untuk menutup modal atau memperbarui state jika perlu. Logika ini harus tetap konsisten baik saat modal ditampilkan sebagai dialog maupun di sidebar.

5.  **Props untuk Komponen `Content`**:
    *   Ketika Anda memisahkan logika UI menjadi komponen `XxxContent` (misalnya, `DescriptiveContent`), pastikan semua props yang diperlukan (seperti data, state, dan handler fungsi) yang sebelumnya dikelola atau diakses oleh komponen modal utama (`Descriptives`) sekarang diteruskan dengan benar ke `DescriptiveContent`.

Secara keseluruhan, penjelasan Anda sudah sangat solid. Poin-poin di atas lebih bersifat penajaman dan penekanan pada detail implementasi kritis untuk memastikan sistem berfungsi seperti yang diharapkan tanpa error. Fokus utama adalah memastikan bahwa tanggung jawab untuk merender komponen `Dialog` dari `shadcn/ui` ditempatkan dengan benar (hanya di modal individual saat `containerType="dialog"`) dan bahwa `containerType` dialirkan secara konsisten.

## Troubleshooting dan Implementasi Lanjutan

### Menghindari Error "DialogPortal must be used within Dialog"

Error ini terjadi ketika komponen yang menggunakan `DialogPortal` (seperti `DialogContent`) dirender tanpa parent `Dialog`. Untuk menghindari ini:

1. Pastikan dalam mode sidebar, TIDAK ADA komponen Dialog shadcn/ui yang dirender.
2. Dalam mode dialog, selalu bungkus `DialogContent` dengan komponen `Dialog`.
3. Jika menggunakan komponen perantara (seperti `DescriptiveModal`), pastikan komponen tersebut mengembalikan output yang konsisten dengan containerType.

```jsx
// Pattern yang benar untuk modal dialog
const MyModal = ({ containerType = "dialog" }) => {
  if (containerType === "sidebar") {
    return (
      <div className="...">
        <MyModalContent /> {/* TIDAK menggunakan komponen Dialog shadcn/ui */}
      </div>
    );
  }
  
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>...</DialogHeader>
        <MyModalContent />
      </DialogContent>
    </Dialog>
  );
};
```

### Aliran Props dalam Komponen Berjenjang

Ketika menggunakan pola Router/Group Modal (seperti `DescriptiveModal`), sangat penting untuk meneruskan prop `containerType` ke semua komponen anak:

```jsx
// Contoh komponen router/group modal
export const AnalyzeModal = ({ modalType, onClose, containerType = "dialog" }) => {
  const renderComponent = () => {
    switch (modalType) {
      case "frequencies":
        return <Frequencies onClose={onClose} containerType={containerType} />;
      case "descriptives":
        return <Descriptives onClose={onClose} containerType={containerType} />;
      // ...kasus lainnya
    }
  };

  // Hanya render komponen, tanpa wrapper tambahan
  // containerType akan menentukan apakah komponen anak 
  // merender dialog atau konten sederhana
  return renderComponent();
};
```

### Checklist Debugging Modal

Jika mengalami masalah dengan implementasi modal:

1. **Periksa aliran `containerType`**: Pastikan prop diteruskan melalui semua lapisan komponen.
2. **Inspeksi struktur komponen**: Dalam mode sidebar, pastikan TIDAK ada komponen Dialog, DialogPortal, dll.
3. **Pastikan `Dialog` dirender dengan benar**: Dalam mode dialog, pastikan DialogContent dibungkus dengan Dialog.
4. **State `open`**: Pastikan prop `open` pada Dialog diatur dengan benar.
5. **Listener `onOpenChange`**: Handel perubahan status open/close dengan benar.

### Contoh Implementasi Lengkap

Untuk memastikan implementasi yang benar, ikuti pola berikut:

1. Komponen modal tingkat rendah (seperti `Frequencies`, `Descriptives`) bertanggung jawab untuk:
   - Menerima prop `containerType`
   - Merender konten yang berbeda berdasarkan `containerType`
   - Hanya menggunakan Dialog shadcn/ui dalam mode dialog

2. Komponen perantara/router (seperti `DescriptiveModal`) bertanggung jawab untuk:
   - Meneruskan `containerType` ke semua komponen yang dirender
   - TIDAK membungkus output dengan Dialog tambahan


# Aturan Modal Title yang Baru

Berdasarkan implementasi terbaru, berikut adalah aturan-aturan untuk pengelolaan judul (title) modal:

## 1. Satu Sumber Kebenaran (Single Source of Truth)
- Semua judul modal didefinisikan di file `frontend/constants/modalTitles.ts`
- Menggunakan konstanta `MODAL_TITLES` yang memetakan `ModalType` ke string judul

```typescript
export const MODAL_TITLES: Partial<Record<ModalType, string>> = {
  [ModalType.ExportCSV]: "Export Data to CSV",
  [ModalType.ImportCSV]: "Import Data from CSV",
  // ...lainnya
};
```

## 2. Konsistensi Antar Tampilan
- Judul yang sama harus digunakan baik di tampilan sidebar maupun dialog
- Modal harus mengambil judul dari `getModalTitle()` atau konstanta `MODAL_TITLES`
- Menghindari hardcoded title di berbagai komponen

## 3. Fungsi Pembantu
- Gunakan fungsi `getModalTitle()` untuk mendapatkan judul modal:
  ```typescript
  const modalTitle = getModalTitle(currentModal.type);
  ```

## 4. Fallback Otomatis
- Jika judul tidak didefinisikan di `MODAL_TITLES`, fungsi `getModalTitle()` akan memformat nilai enum
- Format enum: menambahkan spasi sebelum huruf kapital dan kapitalisasi huruf pertama

## 5. Penggunaan dalam Komponen
- Dalam komponen SidebarContainer, gunakan:
  ```typescript
  const modalTitle = getModalTitle(currentModal.type);
  ```
- Dalam komponen modal individu, gunakan:
  ```typescript
  const modalTitle = MODAL_TITLES[ModalType.ExportCSV] || "Default Title";
  ```

## 6. Pemeliharaan
- Saat menambahkan modal baru, tambahkan entri baru ke `MODAL_TITLES`
- Gunakan nama yang seragam dan deskriptif
- Pastikan judul konsisten dengan fungsi modal

## 7. Integrasi dengan Sistem Container
- Tidak perlu logika kondisional berbeda untuk judul berdasarkan containerType
- Judul yang sama ditampilkan di kedua mode, hanya penempatan UI yang berbeda

Dengan aturan-aturan ini, sistem judul modal akan terpusat, konsisten, dan mudah dipelihara seiring pertumbuhan aplikasi.

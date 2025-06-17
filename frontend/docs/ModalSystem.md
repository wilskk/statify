# Dokumentasi Sistem Modal Statify

Dokumen ini menjelaskan cara menggunakan sistem modal di aplikasi Statify, termasuk fitur stacking modal.

## Pengantar

Sistem modal Statify mendukung dua jenis tampilan:
1. **Dialog** - Modal yang muncul di tengah layar
2. **Sidebar** - Panel yang muncul dari sisi kanan layar

Secara default, modal **tidak di-stack** (menumpuk), yang berarti ketika membuka modal baru, modal yang sebelumnya terbuka akan ditutup secara otomatis.

## Cara Membuka Modal

### Cara Standar (Tanpa Stacking)
```jsx
import { useModal } from '@/hooks/useModal';

// Di dalam komponen React Anda
const { openModal } = useModal();

// Membuka modal tanpa props
openModal(ModalType.Print);

// Membuka modal dengan props
openModal(ModalType.ImportCSV, { dataSource: 'example.csv' });
```

### Menggunakan Container Override
```jsx
// Memaksa modal muncul sebagai dialog
openModal(ModalType.Print, { containerOverride: "dialog" });

// Memaksa modal muncul sebagai sidebar
openModal(ModalType.ImportCSV, { containerOverride: "sidebar" });

// Menggunakan mode otomatis (sidebar di desktop, dialog di mobile)
openModal(ModalType.ExportCSV, { containerOverride: "auto" });
```

## Fitur Stacking Modal

### Mengaktifkan Stacking
Secara default, modal tidak akan di-stack (menumpuk). Ketika membuka modal baru, modal sebelumnya akan ditutup secara otomatis.

Untuk **mengizinkan stacking** (menumpuk beberapa modal sekaligus):
```jsx
openModal(ModalType.ImportCSV, { allowStacking: true });
```

Dengan opsi ini, modal baru akan muncul di samping modal yang sudah ada (jika kedua modal adalah tipe sidebar) atau di atas modal yang ada (jika dialog).

### Kasus Penggunaan Stacking

Stacking berguna dalam beberapa skenario:
1. **Wizard multi-langkah** - Mempertahankan konteks sementara pengguna menelusuri beberapa langkah
2. **Referensi cepat** - Membiarkan pengguna melihat data di satu modal sambil mengisi form di modal lain
3. **Flow kerja kompleks** - Ketika pengguna perlu mengakses beberapa alat terkait secara bersamaan

### Pertimbangan UI/UX
- Hindari terlalu banyak modal bertumpuk karena dapat membingungkan pengguna
- Pastikan modal tersedia cukup ruang ketika di-stack (terutama jika kedua modal adalah sidebar)
- Modal dialog tetap muncul di tengah, tetapi dapat menumpuk dengan z-index lebih tinggi

## Tips dan Praktik Terbaik

1. **Default Non-Stack**: Untuk sebagian besar kasus, gunakan perilaku default (non-stacking) untuk menghindari kebingungan pengguna.
2. **Stack dengan Bijak**: Gunakan stacking hanya ketika pengguna benar-benar perlu melihat konten dari dua modal secara bersamaan.
3. **Responsif**: Pertimbangkan bahwa stacking beberapa sidebar mungkin tidak bekerja dengan baik di tampilan mobile.

## Contoh Kasus Penggunaan

### Contoh 1: Preview dan Edit Bersamaan
```jsx
// Membuka modal preview data
openModal(ModalType.DataPreview, { 
  data: selectedData,
  allowStacking: true    // Mengizinkan stacking
});

// Kemudian pengguna dapat membuka modal edit sambil tetap melihat preview
openModal(ModalType.DataEdit, { 
  id: selectedItem.id,
  allowStacking: true    // Mengizinkan stacking 
});
```

### Contoh 2: Wizard dengan Referensi
```jsx
// Langkah 1 wizard: Pilih variabel
openModal(ModalType.SelectVariables);

// Langkah 2: Pengguna memerlukan data referensi tanpa kehilangan pilihan sebelumnya
openModal(ModalType.DataReference, { 
  allowStacking: true    // Mengizinkan stacking agar langkah 1 tidak tertutup
});
``` 
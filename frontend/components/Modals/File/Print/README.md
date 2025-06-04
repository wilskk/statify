# Print Modal (Print to PDF)

**Print Modal** adalah fitur Statify yang memudahkan pengguna mengekspor data, variabel, dan hasil analisis ke dalam file PDF secara interaktif. Komponen ini dirancang agar mudah digunakan, responsif, dan siap untuk kebutuhan presentasi atau dokumentasi hasil analisis.

---

## 🚩 Ringkasan Fitur
- **Ekspor Data ke PDF**: Pilih bagian data, variabel, atau hasil analisis yang ingin diekspor.
- **Pengaturan Nama File**: Ubah nama file PDF sesuai kebutuhan.
- **Pilihan Ukuran Kertas**: Tersedia A4, A3, Letter, dan Legal.
- **Mode Portrait/Landscape**: Otomatis menyesuaikan perangkat dan orientasi layar.
- **Reset & Cancel**: Mudah mengatur ulang atau membatalkan proses.
- **Proses Cepat**: Indikator loading saat PDF sedang dibuat.
- **Teknologi**: Menggunakan [jsPDF](https://github.com/parallax/jsPDF) untuk hasil PDF yang rapi dan siap cetak.

---

## 📦 Struktur Folder
```
Print/
├── Print.tsx           # Komponen utama modal print
├── index.ts            # Entry point & re-eksport modul
├── components/
│   └── PrintOptions.tsx# UI opsi print
├── hooks/
│   └── usePrintLogic.ts# Logika print
├── services/
│   └── pdfPrintService.ts # PDF generator
├── types/
│   └── index.ts        # Tipe TypeScript
└── utils/
    └── index.ts        # Utility functions
```

---

## 🎬 Cara Cepat Menggunakan
1. **Import komponen**
   ```tsx
   import { PrintModal } from "@/components/Modals/File/Print";
   ```
2. **Panggil di aplikasi**
   ```tsx
   const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
   <Button onClick={() => setIsPrintModalOpen(true)}>Print</Button>
   {isPrintModalOpen && (
     <PrintModal onClose={() => setIsPrintModalOpen(false)} containerType="dialog" />
   )}
   ```
3. **Atur opsi print**
   - Pilih bagian yang ingin diekspor (data, variabel, hasil)
   - Ubah nama file jika perlu
   - Pilih ukuran kertas & orientasi
   - Klik **Print** untuk ekspor PDF

---

## 🧩 Props Utama
- `onClose: () => void`  
  Callback saat modal ditutup.
- `containerType?: ContainerType`  
  (Opsional) Tipe kontainer/modal (`dialog` | `sidebar`).

Lihat detail tipe di [`types/index.ts`](./types/index.ts):
- `PaperSize` (`a4`, `a3`, `letter`, `legal`)
- `SelectedOptions` (opsi bagian yang diekspor)
- `PrintOptionsProps` (props untuk komponen opsi print)

---

## 🛠️ Alur Kerja Komponen
1. **PrintModal**: Mengelola state & merender UI.
2. **usePrintLogic**: Mengatur logika, state, dan handler print.
3. **PrintOptions**: Menampilkan form opsi print & tombol aksi.
4. **pdfPrintService**: Membuat file PDF dari data & opsi terpilih.

---

## 🔗 Dependensi
- [jsPDF](https://github.com/parallax/jsPDF)
- [React](https://react.dev/)
- Komponen UI internal (`@/components/ui`)
- (Opsional) [lucide-react](https://lucide.dev/) untuk ikon

---

## 👩‍💻 Tips Pengembangan
- Edit UI opsi print di [`PrintOptions.tsx`](./components/PrintOptions.tsx)
- Ubah logika di [`usePrintLogic.ts`](./hooks/usePrintLogic.ts)
- Tambah/ubah fungsi PDF di [`pdfPrintService.ts`](./services/pdfPrintService.ts)
- Update tipe di [`types/index.ts`](./types/index.ts) jika ada perubahan

---

## 💡 Best Practice & Saran Product Tour

- **Mulai dari Data**: Tunjukkan bagaimana pengguna dapat membuka Print Modal dari halaman data, variabel, atau hasil analisis.
- **Eksplorasi Opsi**: Jelaskan setiap opsi (pilihan bagian data, nama file, ukuran kertas, orientasi) dengan contoh visual jika memungkinkan.
- **Preview & Ekspor**: Simulasikan proses klik Print dan tampilkan hasil PDF yang dihasilkan.
- **Responsif**: Tunjukkan tampilan Print Modal di desktop dan mobile.
- **Integrasi Mudah**: Tekankan bahwa Print Modal bisa dipanggil dari berbagai bagian aplikasi Statify hanya dengan satu baris kode.
- **Aksesibilitas**: Pastikan navigasi keyboard dan screen reader didukung (bisa ditambahkan pada pengembangan selanjutnya).

---

## 📞 Kontak & Kontribusi

Jika ingin berkontribusi, silakan buat pull request atau hubungi maintainer melalui [GitHub Issues](https://github.com/yourusername/statify/issues).

---

## 📚 Lisensi
Lihat [LICENSE](../../../../LICENSE) di root proyek.

---

> **Catatan untuk Product Tour:**
> - Tunjukkan kemudahan memilih bagian data yang ingin diekspor.
> - Sorot fitur pengaturan nama file & ukuran kertas.
> - Tampilkan proses ekspor PDF yang cepat dan hasil yang siap cetak.
> - Tekankan kemudahan integrasi Print Modal di berbagai bagian aplikasi Statify.

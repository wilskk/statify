<<<<<<< HEAD
# Skripsi

**Nama**            : Guswana Adventus  
**NIM**             : 222112082  
**Judul Skripsi**   : Pengembangan Statify: Aplikasi Analisis Statistik Modul Analisis Time Series  
**Dosen Pembimbing**: Ibnu Santoso, S.S.T., M.T.  

**Deskripsi Singkat**
---

### 1. Statify
Aplikasi analisis statistik berbasis web yang dikembangkan menggunakan **Next.js** dan **WebAssembly (Rust)**.  
Aplikasi dapat diakses melalui tautan berikut:  
👉 [https://statify-dev.student.stis.ac.id/](https://statify-dev.student.stis.ac.id/)

### 2. Modul Analisis Time Series
Statify pada modul ini menyediakan lima menu analisis time series, yaitu:
1. **Smoothing**
2. **Decomposition**
3. **Autocorrelation**
4. **Unit Root Test**
5. **Box-Jenkins Model**

### 3. Dokumentasi
Pengguna dapat membaca dokumentasi rumus dan panduan penggunaan Statify Modul Analisis Time Series melalui tautan berikut:
- [Dokumentasi Rumus](https://drive.google.com/file/d/1KGKAv_QS7ln2mFK5v3800vyzi9ypKzft/view?usp=drive_link)  
- [Panduan Penggunaan](https://drive.google.com/file/d/1RkrwpeQQqO3YDJdSKxtcos2fdMax49ML/view?usp=drive_link)

---

**Struktur Direktori**
---
### 1. Struktur Direktori Inti

```
TimeSeries/
  index.ts                // Re-exports / util integrasi
  TimeSeriesModal.tsx     // Modal utama
  TimeSeriesMenu.tsx      // Navigasi antar analisis
  TimeSeriesInput.tsx     // Input dataset / parameter umum
  TimeSeriesGenerateDate.ts // Generator rentang tanggal
  TimeSeriesTimeHook.tsx  // Hook manajemen state waktu
  TimeSeriesTimeTab.tsx   // Tab kontrol waktu

  Autocorrelation/
  BoxJenkinsModel/
  Decomposition/
  Smoothing/
  UnitRootTest/
    index.tsx
    OptionTab.tsx
    VariablesTab.tsx
    analyze/analyze.ts
    hooks/
      analyzeHook.tsx
      optionHook.tsx
    test/*.test.ts

  wasm/                   // Rust + WebAssembly sumber perhitungan
```

### 2. Pola Submodul Analisis Time Series

Setiap submodul (contoh: `Autocorrelation/`):

| File | Fungsi |
|------|--------|
| `index.tsx` | Komponen wrapper utama analisis (komposisi tab + eksekusi) |
| `VariablesTab.tsx` | Pilih variabel target, opsi frekuensi, transformasi pra-analisis |
| `OptionTab.tsx` | Parameter metode (lag max, model order, smoothing factor, dll.) |
| `hooks/optionHook.tsx` | State & validasi parameter (schema / default) |
| `hooks/analyzeHook.tsx` | Orkestrasi eksekusi: kumpulkan variabel + opsi → panggil `analyze.ts` |
| `analyze/analyze.ts` | Fungsi pemanggil backend / wasm; normalisasi input & mapping output |
| `test/*.test.ts` | Unit test perilaku hook/analyze (mock data) |

### 3. Struktur Folder Penghitungan Menggunakan WebAssembly (Rust)

Lokasi: `TimeSeries/wasm/`

Struktur ringkas Rust:
```
src/
  lib.rs                  // Entry poin
  regression/...          // (Regresi pendukung)
  time_series/
    mod.rs
    arima/
    autocorrelation/
    decomposition/
    difference/
    evaluation/
    smoothing/
    unit_root_test/
```
---
=======
disuruh bikin repo
>>>>>>> 1d8230058ecd8ed7521a352ead372ff2d1838cb3

# Kategori Modal Analisis

> **Peringatan:** Arsitektur untuk semua modal di bawah kategori ini diatur oleh [Panduan Arsitektur Utama Modal](../README.md). Dokumen ini hanya berfungsi sebagai ringkasan kategori.

## Tujuan

Direktori ini berisi semua fitur modal yang berhubungan dengan **analisis statistik**, mulai dari statistik deskriptif dasar hingga pemodelan regresi yang kompleks.

## Daftar Fitur (Tidak Lengkap)

-   **Descriptive Statistics**:
    -   `Descriptives`: Statistik univariat dasar.
    -   `Frequencies`: Tabel frekuensi dan chart.
    -   `Explore`: Analisis data eksplorasi.
    -   `Crosstabs`: Analisis tabulasi silang.
-   **Compare Means**:
    -   `One-Sample T-Test`
    -   `Independent-Samples T-Test`
    -   `Paired-Samples T-Test`
    -   `One-Way ANOVA`
-   **Regression**:
    -   `Linear`: Regresi linear.
    -   `Curve Estimation`: Estimasi kurva.
-   **Dan lain-lain...**

## Registrasi Fitur

Semua modal dalam kategori ini didaftarkan melalui `AnalyzeRegistry.tsx`, yang kemudian digabungkan ke dalam sistem modal utama.

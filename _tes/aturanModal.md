## Spesifikasi Teknis AI: Struktur & Penamaan Komponen dalam Folder `modals/` di Next.js (Komprehensif V2)

Dokumen ini adalah **spesifikasi teknis yang ketat** yang harus diikuti oleh AI untuk menghasilkan struktur kode komponen antarmuka pengguna (dengan fokus pada komponen yang berfungsi sebagai modal atau dialog) dalam aplikasi Next.js. Setiap aturan dan konvensi yang dijelaskan di sini bersifat **wajib** dan harus diimplementasikan secara presisi untuk memastikan kualitas, konsistensi, kemudahan pengelolaan, dan reusabilitas kode yang maksimal.

### Filosofi Dasar Pembuatan Kode 🎯

AI harus menghasilkan kode yang mematuhi prinsip-prinsip berikut:

* **Pemisahan Tanggung Jawab (Separation of Concerns) Tegas**: Setiap berkas dan modul harus memiliki satu tujuan spesifik. Logika tampilan (UI), logika bisnis, dan pengelolaan state harus terisolasi.
* **Modularitas Tinggi**: Komponen dan logika harus dibangun sebagai unit independen yang dapat dikembangkan, diuji, dan dipahami secara terpisah.
* **Keterbacaan Kode Maksimal (Maximum Readability)**: Kode harus mudah dibaca dan dimengerti. Gunakan nama variabel dan fungsi yang deskriptif.
* **Kemudahan Pengelolaan (High Maintainability)**: Struktur harus memfasilitasi pembaruan, perbaikan bug, dan penambahan fitur tanpa risiko regresi yang signifikan.
* **Reusabilitas Maksimal**: Setiap bagian inti dari modul (UI, Logika, Kontainer) harus dapat diakses dan digunakan kembali secara independen jika diperlukan.

### Struktur Folder & Penamaan Umum Wajib 📂

AI harus menghasilkan struktur direktori dan berkas berikut untuk setiap komponen fitur yang ditempatkan dalam direktori `modals/`.

```
src/
└── components/  # Atau direktori 'features', 'modules' sesuai konfigurasi proyek global
    └── modals/  # Direktori khusus untuk semua komponen yang berfungsi sebagai modal/dialog
        └── [FeatureName]/  # WAJIB: Folder spesifik fitur, nama menggunakan PascalCase (misal: UserProfile, ProductDetail)
            ├── index.ts                     # WAJIB: Titik masuk (entry point) & API publik modul fitur
            ├── [FeatureName].tsx            # WAJIB: Komponen Presentasi (UI)
            ├── [FeatureName]Container.tsx   # WAJIB: Komponen Kontainer
            ├── use[FeatureName]Logic.ts     # WAJIB: Custom Hook utama untuk state & logika fitur
            ├── [FeatureName].types.ts       # WAJIB: Definisi Tipe TypeScript untuk fitur
            ├── [FeatureName].constants.ts   # WAJIB jika ada: Konstanta spesifik fitur
            └── utils/                       # OPSIONAL: Jika ada fungsi utilitas murni spesifik fitur
                └── [utilityName].ts
```

**Aturan Penamaan Folder `[FeatureName]/` (Wajib PascalCase):**
Nama folder fitur (misalnya, `UserProfile`, `OrderSummary`) **harus** menggunakan **PascalCase**.

**Peran dan Isi Wajib Berkas `index.ts` (Fasad Publik Modul):**
Berkas `index.ts` **harus** dibuat untuk setiap modul fitur dan berfungsi sebagai **satu-satunya titik masuk (entry point) yang mendefinisikan antarmuka publik (Public API)** modul tersebut. Tujuannya adalah untuk memaksimalkan fleksibilitas dan reusabilitas dengan mengekspor semua bagian inti secara terstruktur.

1.  **Tujuan Utama `index.ts`**:
    * Menyederhanakan jalur impor: `import { UserProfile, UserProfileUI, useUserProfileLogic } from '@/components/modals/UserProfile';`
    * Menyediakan akses terstruktur ke Komponen Kontainer (penggunaan standar), Komponen Presentasi (UI terpisah), dan Custom Hook (logika terpisah).
    * Mendukung enkapsulasi dengan jelas memisahkan apa yang publik dan apa yang privat (berkas yang tidak diekspor dari `index.ts` dianggap privat untuk modul).

2.  **Isi Wajib dan Struktur Ekspor (Contoh untuk Fitur `UserProfile`):**
    AI **harus** menghasilkan isi `index.ts` yang mengekspor bagian-bagian berikut:
    ```typescript
    // src/components/modals/UserProfile/index.ts

    // 1. WAJIB: Ekspor Komponen Kontainer Utama
    // Ini adalah cara standar untuk menggunakan fitur secara keseluruhan.
    // Nama ekspor HARUS sama dengan [FeatureName].
    export { default as UserProfile } from './UserProfileContainer';

    // 2. WAJIB: Ekspor Komponen Presentasi (UI)
    // Untuk memungkinkan penggunaan UI secara terpisah dengan logika kustom atau di Storybook.
    // Nama ekspor HARUS [FeatureName]UI.
    export { default as UserProfileUI } from './UserProfile';
    // Alternatif jika [FeatureName].tsx memiliki named export utama:
    // export { UserProfile as UserProfileUI } from './UserProfile';

    // 3. WAJIB: Ekspor Custom Hook Utama
    // Untuk memungkinkan penggunaan kembali logika stateful dengan UI yang berbeda.
    // Nama ekspor HARUS sama dengan nama berkas hook-nya.
    export { useUserProfileLogic } from './useUserProfileLogic';

    // 4. WAJIB: Ekspor semua tipe dan antarmuka publik
    // Untuk memastikan type safety saat menggunakan bagian-bagian modul.
    export * from './UserProfile.types';
    ```
    Dengan strategi ekspor ini, modul menjadi sangat fleksibel. Misalnya, `ModalB` dapat mengimpor `UserProfileUI` dan `useSomeOtherLogic` untuk menciptakan perilaku baru dengan tampilan `UserProfile`.

---

### Spesifikasi Detail Komponen Penyusun dalam Fitur 🧱

AI harus menghasilkan setiap berkas sesuai dengan peran, tanggung jawab, dan konvensi penamaan berikut:

#### 1. Komponen Presentasi (UI) - `[FeatureName].tsx`
* **Tanggung Jawab Utama**: Fokus **eksklusif pada rendering UI** berdasarkan `props`. **Tidak boleh** berisi logika bisnis atau state aplikasi. Semua data dan *event handler* diterima via `props`.
* **Karakteristik Kode**: Struktur JSX murni; state internal minimal (hanya untuk UI sangat lokal); *pure component* sebisa mungkin; siap untuk diuji/ditampilkan di Storybook.
* **Penamaan Berkas**: `[FeatureName].tsx` (PascalCase, contoh: `UserProfile.tsx`).

#### 2. Komponen Kontainer - `[FeatureName]Container.tsx`
* **Tanggung Jawab Utama**: **Orkestrator** antara logika aplikasi dan Komponen Presentasi `[FeatureName].tsx`. Menangani pengambilan data, pengelolaan state kompleks (via `use[FeatureName]Logic.ts`), dan meneruskan `props` yang relevan ke UI.
* **Karakteristik Kode**: **Tidak boleh** berisi banyak markup JSX. Mengimpor dan menggunakan `use[FeatureName]Logic.ts`. Merender `[FeatureName].tsx`.
* **Penamaan Berkas**: `[FeatureName]Container.tsx` (PascalCase dengan sufiks `Container`, contoh: `UserProfileContainer.tsx`).

#### 3. Custom Hook (Logika & State) - `use[FeatureName]Logic.ts`
* **Tanggung Jawab Utama**: Mengenkapsulasi **semua logika stateful** dan efek samping spesifik fitur. Menyediakan antarmuka (state dan fungsi) yang stabil untuk Komponen Kontainer atau untuk penggunaan langsung jika diimpor dari `index.ts`.
* **Karakteristik Kode**: Menggunakan hook React (`useState`, `useEffect`, `useCallback`, dll.); fungsi yang dikembalikan di-memoize dengan `useCallback` jika perlu.
* **Penamaan Berkas**: `use[FeatureName]Logic.ts` (camelCase, prefiks `use`, sufiks `Logic`, contoh: `useUserProfileLogic.ts`).

#### 4. Definisi Tipe (TypeScript) - `[FeatureName].types.ts`
* **Tanggung Jawab Utama**: Mendefinisikan **semua tipe dan antarmuka** TypeScript untuk fitur (props, state, objek data). Sebagai "kontrak data" dan dokumentasi hidup.
* **Karakteristik Kode**: Ekspor semua tipe/antarmuka yang relevan; nama tipe/antarmuka PascalCase.
* **Penamaan Berkas**: `[FeatureName].types.ts` (sufiks `.types`, contoh: `UserProfile.types.ts`).

#### 5. Konstanta - `[FeatureName].constants.ts`
* **Tanggung Jawab Utama**: Mengisolasi **nilai literal tetap (konstanta)** internal modul. Mencegah "magic values".
* **Karakteristik Kode**: Ekspor semua konstanta; nama konstanta `UPPER_SNAKE_CASE`. Dibuat hanya jika ada konstanta.
* **Penamaan Berkas**: `[FeatureName].constants.ts` (sufiks `.constants`, contoh: `UserProfile.constants.ts`).

#### 6. Fungsi Utilitas (Utils) - `utils/[utilityName].ts` (Opsional)
* **Tanggung Jawab Utama**: Berisi **fungsi murni (pure functions)** pendukung yang spesifik, tanpa state/efek samping.
* **Karakteristik Kode**: Fungsi murni, reusable, testable. Dibuat hanya jika ada fungsi utilitas yang sesuai.
* **Penamaan Berkas**: Dalam `utils/`, nama berkas `camelCase` atau `kebab-case`.

---

### Aturan Penulisan Komentar Kode Wajib untuk AI ✍️

AI **harus** mematuhi aturan komentar berikut:

1.  **Prioritaskan Kode Self-Documenting**: Hasilkan kode yang jelas untuk meminimalkan kebutuhan komentar.
2.  **Komentar Minimalis dan Bernilai Tambah**: AI **tidak boleh** menghasilkan komentar yang mengulang kode.
3.  **Komentar untuk Fungsi/Metode Kompleks atau Publik (TSDoc/JSDoc)**:
    * Untuk fungsi yang diekspor (terutama dari `index.ts`) atau fungsi internal kompleks, AI **harus** menghasilkan komentar TSDoc/JSDoc (tujuan, `@param`, `@returns`). Fokus pada "mengapa" atau "apa" yang kompleks.
4.  **Komentar untuk Blok Logika Non-Trivial**: AI **harus** menyertakan komentar ringkas *sebelum* blok kode yang menjelaskan pendekatan atau rasionalnya.
5.  **Penanda Khusus**: `// TODO:`, `// FIXME:` dapat digunakan jika relevan dengan *prompt* awal.
6.  **Komentar yang Dilarang**: Komentar yang menjelaskan sintaks dasar; kode yang dinonaktifkan.

---

### Prinsip Desain yang Harus Tercermin dalam Kode AI ✅

Kode yang dihasilkan AI harus secara inheren mendukung:

* **Single Responsibility Principle (SRP)**.
* **Reusability** (difasilitasi oleh strategi ekspor `index.ts` yang komprehensif).
* **Composability**.

AI harus menggunakan spesifikasi ini sebagai panduan utama untuk menghasilkan kode komponen yang terstruktur, konsisten, fleksibel, dan berkualitas tinggi.
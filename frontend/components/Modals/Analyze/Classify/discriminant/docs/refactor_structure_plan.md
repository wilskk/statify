# Refactoring Plan: Discriminant Module — Pola #2 to Pola #3

## Overview

Mengkonversi struktur folder discriminant dari Pola #2 (Rust + Services campur aduk) ke Pola #3 (Rust + Services + Hooks hybrid), konsisten dengan modul lain seperti `BinaryLogistic`, `k-means-cluster`, dll.

## Kondisi Awal (Pola #2)

```
discriminant/
├── rust/          ← WASM computation (OK, tidak disentuh)
├── services/      ← MASALAH: tanggung jawab campur aduk
│   ├── discriminant-analysis.ts          ← execute + state management
│   ├── discriminant-analysis-formatter.ts ← semua formatting logic
│   └── discriminant-analysis-output.ts    ← simpan ke result store
├── dialogs/
│   └── discriminant-main.tsx              ← MASALAH: state + UI jadi satu
├── types/
├── constants/
└── (no hooks/)
```

**3 masalah utama:**

1. **`discriminant-analysis.ts`** — satu file = execute + slicing data + init WASM + state. Ini seharusnya di `hooks/` karena itu state management.

2. **`discriminant-main.tsx`** — komponen React seharusnya hanya rendering UI, tapi sekarang juga manage semua form state, open/close dialog, IndexedDB.违反 single responsibility principle.

3. **`discriminant-analysis-output.ts`** — 400+ baris kode business logic ada di `services/`, harusnya di `hooks/` atau `services/` pure functions.

---

## Target (Pola #3)

```
discriminant/
├── rust/                      ← TETAP (tidak disentuh)
├── services/                 ← REFACTOR: hanya pure functions (formatter + utilitas)
│   ├── formatter.ts           ← semua transformasi data → Table[]
│   └── store.ts              ← utilitas simpan ke result store
├── hooks/                    ← BARU
│   ├── tourConfig.ts         ← konfigurasi tour guide (dipindah dari dialog)
│   └── useDiscriminantState.ts ← semua state management
├── dialogs/                  ← REFACTOR: hanya presentational components
│   ├── DiscriminantMain.tsx  ←瘦了一圈 (tanpa state management internal)
│   ├── VariablesTab.tsx
│   ├── StatisticsTab.tsx
│   ├── MethodTab.tsx
│   ├── ClassifyTab.tsx
│   ├── SaveTab.tsx
│   ├── BootstrapTab.tsx
│   ├── DefineRangeTab.tsx
│   └── SetValueTab.tsx
├── types/
│   ├── discriminant.ts
│   └── discriminant-worker.ts
└── constants/
    └── discriminant-default.ts
```

---

## Detail Perubahan

### hooks/useDiscriminantState.ts (BARU)
Bertanggung jawab untuk:
- Form state (DiscriminantType)
- Load/save IndexedDB
- Execute analysis (memanggil WASM via services)
- Simpan result ke store
- Reset form

Berpindah dari:
- `services/discriminant-analysis.ts` (execute logic)
- `services/discriminant-analysis-output.ts` (store logic)
- `dialogs/discriminant-main.tsx` (state management)

### services/formatter.ts (REFACTOR)
- Rename + merge dari `discriminant-analysis-formatter.ts`
- Pure function: menerima raw WASM result → `ResultJson` (Table[])
- Tidak ada side effects, tidak ada store access

### services/store.ts (BARU)
- Helper untuk simpan hasil ke `useResultStore`
- Berpindah dari logic di `discriminant-analysis-output.ts`

### dialogs/DiscriminantMain.tsx (REFACTOR)
- Hapus semua `useState` untuk form data
- Terima semua state dari `useDiscriminantState` via props
- Hapus semua IndexedDB load/save logic
- Fokus pada: tab navigation, render sub-components, pass events up

### hooks/tourConfig.ts (BARU)
- Tour step definitions
- Dipisah dari dialog untuk reusable

### Tab Components (REFACTOR)
- `dialogs/dialog.tsx` → rename `DiscriminantDialog.tsx`, tetap sama fungsinya
- Sub-tab components (`statistics.tsx`, `method.tsx`, dll.) → terima props, tanpa internal state untuk data

---

## Prinsip

1. **`rust/`** — TIDAK PERNAH disentuh. Core WASM computation.
2. **`services/`** — Hanya pure functions (formatter, helpers). Zero side effects.
3. **`hooks/`** — Semua state management, async operations, business logic.
4. **`dialogs/`** — Hanya render. Menerima props. Tidak punya `useState` untuk data.

## Status

- [x] Buat `hooks/useDiscriminantState.ts`
- [x] Buat `hooks/tourConfig.ts`
- [x] Buat `services/store.ts`
- [x] Buat `services/formatter.ts` (re-export)
- [x] Refactor `dialogs/discriminant-main.tsx` → gunakan hook
- [x] Refactor `dialogs/dialog.tsx` → hapus useModal, terima onClose
- [x] Update `types/discriminant.ts` → tambah onClose, isLoading, error
- [ ] Hapus file lama (setelah verifikasi) `discriminant-analysis.ts`, `discriminant-analysis-output.ts`

## Known Changes

- `discriminant-main.tsx` sekarang komponen utama dengan Dialog pembungkus
- `DiscriminantDialog` menerima `onClose` prop (dari parent, bukan useModal)
- State management central di `useDiscriminantState` hook
- Sub-dialogs (define-range, set-value, statistics, method, classify, save, bootstrap) tetap lokal

## Referensi Pola

Modul yang sudah menggunakan Pola #3:
- `Regression/BinaryLogistic/` — hooks + rust + services
- `Classify/k-means-cluster/` — hooks + rust + services
- `general-linear-model/univariate/` — hooks + rust + services
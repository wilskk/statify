# Progres Implementasi "String to Word Vector"

Branch: `Dija`

## 📊 Status Keseluruhan
- [x] Fase 1: Registrasi Modal (100%)
- [x] Fase 2: Komponen UI & Worker Interface (100%)
- [ ] Fase 3: Mesin Rust & WASM (0%)
- [ ] Fase 4: Integrasi & Build (0%)

---

## ✅ Fase 1: Registrasi Modal
- [x] Tambah `StringToWordVector` ke `ModalType` di `modalTypes.ts`
- [x] Tambah kategori modal ke `MODAL_CATEGORIES` di `modalTypes.ts`
- [x] Tambah menu item ke `TransformMenu.tsx`
- [x] Registrasi komponen di `TransformRegistry.ts` (menggunakan konfigurasi `"sidebar"`)
- [x] Tambah judul spesifik di `getModalTitle` (`modalTypes.ts`)

## ✅ Fase 2: Pembuatan Komponen UI
- [x] Buat folder struktur
- [x] Implementasi `hooks/useStringToWordVector.ts` dengan Context Variable & Options
- [x] Implementasi Mode UI Sidebar 2-Tab (`Variables` & `Options`) yang *seamless*
- [x] Implementasi `VariablesTab.tsx` (Logic Filter Kolom Nominal/String & Select Target)
- [x] Implementasi `OptionsTab.tsx` (Parameter Pre-Processing Text)
- [x] Implementasi `StringToWordVectorModal.tsx` sebagai *wrapper*
- [x] Inisiasi kerangka `vectorizer.worker.js` (Web Worker)

## 🛠️ Fase 3: Rust & WASM Engine
- [ ] Setup `Cargo.toml`
- [ ] Implementasi `src/lib.rs` (WASM Entry)
- [ ] Implementasi `src/tokenizer.rs`
- [ ] Implementasi `src/stemmer.rs` (Sastrawi & Porter)
- [ ] Implementasi `src/stopwords.rs` (ID & EN)
- [ ] Implementasi `src/vectorizer.rs` (TF-IDF & Term Matrix calculation)

## 🚀 Fase 4: Build & Integrasi
- [ ] Update `build-wasm.sh`
- [ ] Simulasi payload & Data flow dari UI ke Web Worker
- [ ] Pengujian manual di UI (Update Datagrid Statify)
- [ ] Unit test Rust logika NLP

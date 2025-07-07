# Daftar Kepemilikan Kelas (Class Ownership List)

**Petunjuk Pengisian:**
-   Petakan setiap kelas/modul kunci ke seorang developer yang akan menjadi "pemilik"-nya.
-   Pemilik bertanggung jawab penuh atas implementasi dan pemeliharaan modul tersebut.

---

| Nama Modul (Module Name) | Pemilik (Owner) | Keterangan |
| :--- | :--- | :--- |
| **Layanan Inti (Services)** | | |
| DataService | AP | Logika bisnis untuk data mentah |
| VariableService | AP | Logika bisnis untuk metadata variabel |
| ResultService | AP | Logika bisnis untuk hasil analisis |
| MetaService | AP | Logika bisnis untuk metadata proyek |
| SavService (Client & Server) | AP | Interaksi dengan backend .sav |
| **Manajemen State (Stores)** | | |
| useDataStore | AP | State untuk data mentah |
| useMetaStore | AP | State untuk metadata variabel & proyek |
| useResultStore | AP | State untuk hasil analisis |
| useModalStore | AP | State untuk semua modal UI |
| **Lapisan Data (Repositories)** | | |
| DataRepository | AP | Akses IndexedDB untuk Data |
| VariableRepository | AP | Akses IndexedDB untuk Variabel |
| ResultRepository | AP | Akses IndexedDB untuk Hasil |
| MetaRepository | AP | Akses IndexedDB untuk Meta |
| **Komponen UI Utama** | | |
| DashboardLayout | AP | Layout utama dashboard |
| ModalManager | AP | Koordinator semua modal |
| DataTable | AP | Grid interaktif untuk data |
| VariableTable | AP | Grid interaktif untuk variabel |
| ResultOutput | AP | Kontainer untuk semua output analisis |
| **Logika Analisis (Hooks)** | | |
| useCrosstabsAnalysis | AP | Logika untuk analisis Crosstabs |
| useDescriptivesAnalysis | AP | Logika untuk analisis Deskriptif |
| useExploreAnalysis | AP | Logika untuk analisis Eksplorasi |
| useFrequenciesAnalysis | AP | Logika untuk analisis Frekuensi |
| | | | 
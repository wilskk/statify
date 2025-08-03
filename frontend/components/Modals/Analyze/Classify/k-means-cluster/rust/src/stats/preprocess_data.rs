use crate::models::{
    config::KMeansConfig,
    data::{ AnalysisData, DataValue },
    result::ProcessedData,
};

/// Fungsi `preprocess_data` bertanggung jawab untuk mempersiapkan data mentah sebelum proses klastering K-Means.
/// Proses ini mencakup pemilihan variabel, penanganan data yang hilang (missing values), dan transformasi data ke format matriks.
///
/// # Metode Penanganan Missing Values
///
/// ## 1. List-wise Deletion (Complete Case Analysis)
/// ```
/// Jika ∃x_ij = missing, maka hapus seluruh baris i
/// ```
/// ## 2. Pair-wise Deletion (Available Case Analysis)
/// ```
/// Gunakan semua data yang tersedia untuk setiap perhitungan
/// ```
pub fn preprocess_data(
    data: &AnalysisData,
    config: &KMeansConfig
) -> Result<ProcessedData, String> {
    // Langkah 1: Penentuan Variabel untuk Clustering
    //
    // Menentukan variabel yang akan digunakan untuk klastering berdasarkan `target_var` dari konfigurasi.
    // Variabel ini akan menjadi dimensi dalam ruang multidimensi untuk analisis clustering.
    let variables = config.main.target_var.as_ref().cloned().unwrap_or_default();

    // Langkah 2: Inisialisasi Proses dan Validasi Data
    //
    // Mendapatkan jumlah total kasus (baris data) dari dataset pertama.
    // Validasi bahwa dataset tidak kosong sebelum memulai preprocessing.
    let num_cases = data.target_data.first().map_or(0, |ds| ds.len());
    if num_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    // Inisialisasi struktur data untuk menyimpan hasil preprocessing
    //
    // - data_matrix: Matriks numerik untuk analisis clustering
    // - case_numbers: Melacak nomor baris asli dari data yang valid
    // - case_names: Nama kasus untuk identifikasi (opsional)
    let mut data_matrix = Vec::new();
    let mut case_numbers = Vec::new();

    // Langkah 3: Penanganan Data Hilang (Missing Values)
    //
    // Menentukan metode eksklusi data yang hilang berdasarkan konfigurasi.
    //
    // Metode List-wise (exclude_list_wise = true):
    // - Jika satu nilai saja hilang, seluruh kasus (baris) akan dihapus
    // - Menghasilkan matriks data yang "bersih" tanpa missing values
    //
    // Metode Pair-wise (exclude_pair_wise = true):
    // - Kasus tetap disertakan, perhitungan hanya dilakukan pada variabel yang lengkap
    // - Menggunakan NaN untuk menandai missing values
    let use_list_wise = config.options.exclude_list_wise;
    let use_pair_wise = config.options.exclude_pair_wise;

    // Langkah 4: Iterasi dan Pengolahan Data
    //
    // Memproses setiap kasus (baris) dalam data sesuai dengan metode penanganan missing values
    // yang dipilih.
    for case_idx in 0..num_cases {
        let mut row = Vec::with_capacity(variables.len());
        let mut has_missing = false;
        let mut non_missing_count = 0;

        // Langkah 4a: Untuk setiap variabel yang telah ditentukan, cari nilainya di semua dataset
        //
        // Strategi pencarian: Cari nilai variabel di semua dataset yang tersedia
        // sampai ditemukan nilai yang valid atau semua dataset telah diperiksa
        for var in &variables {
            let mut var_found = false;

            // Cari nilai variabel di semua dataset yang tersedia
            for dataset in &data.target_data {
                if case_idx < dataset.len() {
                    if let Some(value) = dataset[case_idx].values.get(var) {
                        // Langkah 4b: Konversi nilai ke format numerik yang sesuai
                        //
                        // K-Means memerlukan data numerik untuk perhitungan jarak Euclidean.
                        // Berbagai tipe data dikonversi ke f64 untuk konsistensi.
                        let numeric_value = match value {
                            DataValue::Number(v) => Some(*v as f64), // Integer → f64
                            DataValue::NumberFloat(v) => Some(*v), // Float → f64
                            DataValue::Currency(v) => Some(*v), // Currency → f64
                            DataValue::Scientific(v) => Some(*v), // Scientific notation → f64
                            DataValue::Percentage(v) => Some(*v), // Percentage → f64
                            _ => None, // Tipe lain tidak didukung
                        };

                        // Jika konversi berhasil, tambahkan ke baris data
                        if let Some(val) = numeric_value {
                            row.push(val);
                            non_missing_count += 1;
                            var_found = true;
                            break; // Lanjut ke variabel berikutnya setelah nilai ditemukan
                        }
                    }
                }
            }

            // Langkah 4c: Jika variabel tidak ditemukan atau bukan numerik, tangani sesuai metode
            //
            // Strategi penanganan missing values berdasarkan konfigurasi:
            // - List-wise: Hentikan pemrosesan baris ini jika ada missing value
            // - Pair-wise: Tambahkan NaN untuk mempertahankan struktur matriks
            if !var_found {
                has_missing = true;
                if use_list_wise {
                    // List-wise deletion: Hentikan pemrosesan baris ini
                    break;
                } else if use_pair_wise {
                    // Pair-wise deletion: Tambahkan NaN untuk mempertahankan struktur rectangular
                    row.push(f64::NAN);
                }
            }
        }

        // Langkah 4d: Memasukkan Data ke Matriks Berdasarkan Metode Eksklusi
        //
        // Keputusan memasukkan baris data ke matriks final berdasarkan metode yang dipilih
        if use_list_wise {
            // List-wise deletion: Hanya kasus yang lengkap (tanpa data hilang) yang dimasukkan
            if !has_missing {
                data_matrix.push(row);
                case_numbers.push((case_idx + 1) as i32);
            }
        } else if use_pair_wise {
            // Pair-wise deletion: Kasus hanya dihapus jika semua variabelnya hilang
            if non_missing_count > 0 {
                data_matrix.push(row);
                case_numbers.push((case_idx + 1) as i32);
            }
        }
    }

    // Langkah 5: Validasi Hasil Preprocessing
    //
    // Memastikan matriks data tidak kosong setelah pemrosesan.
    // Jika semua data dihapus karena missing values, proses tidak dapat dilanjutkan.
    if data_matrix.is_empty() {
        return Err("No valid data records after preprocessing".to_string());
    }

    // Langkah 6: Ekstraksi Nama Kasus (Opsional)
    //
    // Jika `case_target` (kolom untuk nama kasus) ditentukan, ekstrak nama untuk setiap kasus yang valid.
    // Nama kasus berguna untuk identifikasi dan interpretasi hasil clustering.
    let case_names = if let Some(case_target) = &config.main.case_target {
        let mut names = Vec::with_capacity(case_numbers.len());

        for &case_idx in &case_numbers {
            // Konversi kembali ke indeks berbasis 0 untuk akses ke dataset
            let idx = (case_idx - 1) as usize;
            let mut name = None;

            // Cari nama kasus di dalam `case_data`
            //
            // Strategi: Cari di semua dataset case_data sampai ditemukan nama yang valid
            for dataset in &data.case_data {
                if idx < dataset.len() {
                    if let Some(value) = dataset[idx].values.get(case_target) {
                        // Konversi nilai (teks, angka, boolean, dll.) menjadi string
                        //
                        // Berbagai tipe data dikonversi ke string untuk konsistensi
                        name = Some(match value {
                            DataValue::Text(text) => text.clone(), // Text → String
                            DataValue::Number(num) => num.to_string(), // Number → String
                            DataValue::NumberFloat(num) => num.to_string(), // Float → String
                            DataValue::Boolean(b) => b.to_string(), // Boolean → String
                            DataValue::Date(d) => d.clone(), // Date → String
                            DataValue::DateTime(dt) => dt.clone(), // DateTime → String
                            DataValue::Time(t) => t.clone(), // Time → String
                            DataValue::Currency(c) => c.to_string(), // Currency → String
                            DataValue::Scientific(s) => s.to_string(), // Scientific → String
                            DataValue::Percentage(p) => p.to_string(), // Percentage → String
                            DataValue::Null => String::new(), // Null → Empty String
                        });
                        if name.is_some() {
                            break; // Lanjut ke kasus berikutnya setelah nama ditemukan
                        }
                    }
                }
            }
            // Tambahkan nama yang ditemukan, atau string kosong jika tidak ditemukan
            names.push(name.unwrap_or_default());
        }
        Some(names)
    } else {
        None
    };

    // Langkah 7: Menghitung Statistik Preprocessing
    //
    // Menghitung jumlah kasus yang hilang untuk evaluasi kualitas preprocessing
    let missing_cases = num_cases - data_matrix.len();

    // Langkah 8: Mengembalikan data yang sudah diproses dan siap untuk analisis klaster
    //
    // Struktur ProcessedData berisi:
    // - variables: Daftar variabel yang digunakan untuk clustering
    // - data_matrix: Matriks numerik untuk analisis clustering
    // - case_numbers: Nomor urut kasus yang valid
    // - case_names: Nama kasus untuk identifikasi (opsional)
    // - total_cases: Jumlah total kasus dalam dataset asli
    // - missing_cases: Jumlah kasus yang dihapus karena missing values
    Ok(ProcessedData {
        variables,
        data_matrix,
        case_numbers,
        case_names,
        total_cases: num_cases,
        missing_cases,
    })
}

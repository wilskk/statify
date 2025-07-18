use crate::models::{
    config::ClusterConfig,
    data::{ AnalysisData, DataValue },
    result::ProcessedData,
};

/// Fungsi `preprocess_data` bertanggung jawab untuk mempersiapkan data mentah sebelum proses klastering K-Means.
/// Proses ini mencakup pemilihan variabel, penanganan data yang hilang (missing values), dan transformasi data ke format matriks.
pub fn preprocess_data(
    data: &AnalysisData,
    config: &ClusterConfig
) -> Result<ProcessedData, String> {
    // --- Penentuan Variabel ---
    // Menentukan variabel yang akan digunakan untuk klastering berdasarkan `target_var` dari konfigurasi.
    let variables = config.main.target_var.as_ref().cloned().unwrap_or_default();

    // Memastikan ada variabel yang valid untuk klastering setelah proses seleksi.
    if variables.is_empty() {
        return Err("No valid clustering variables found".to_string());
    }

    // --- Inisialisasi Proses ---
    // Mendapatkan jumlah total kasus (baris data) dari dataset pertama.
    let num_cases = data.target_data.first().map_or(0, |ds| ds.len());
    if num_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    // Inisialisasi `data_matrix` untuk menyimpan data numerik yang akan dianalisis
    // dan `case_numbers` untuk melacak nomor baris asli dari data yang valid.
    let mut data_matrix = Vec::new();
    let mut case_numbers = Vec::new();

    // --- Penanganan Data Hilang (Missing Values) ---
    // Menentukan metode eksklusi data yang hilang berdasarkan konfigurasi.
    // `exclude_list_wise`: Jika satu nilai saja hilang, seluruh kasus (baris) akan dihapus.
    // `exclude_pair_wise`: Kasus tetap disertakan, perhitungan hanya dilakukan pada variabel yang lengkap.
    let use_list_wise = config.options.exclude_list_wise;
    let use_pair_wise = config.options.exclude_pair_wise;

    // --- Iterasi dan Pengolahan Data ---
    // Memproses setiap kasus (baris) dalam data.
    for case_idx in 0..num_cases {
        let mut row = Vec::with_capacity(variables.len());
        let mut has_missing = false;
        let mut non_missing_count = 0;

        // Untuk setiap variabel yang telah ditentukan, cari nilainya di semua dataset.
        for var in &variables {
            let mut var_found = false;

            for dataset in &data.target_data {
                if case_idx < dataset.len() {
                    if let Some(DataValue::Number(val)) = dataset[case_idx].values.get(var) {
                        row.push(*val);
                        non_missing_count += 1;
                        var_found = true;
                        break; // Lanjut ke variabel berikutnya setelah nilai ditemukan.
                    }
                }
            }

            // Jika variabel tidak ditemukan atau bukan numerik, tangani sesuai metode.
            if !var_found {
                has_missing = true;
                if use_list_wise {
                    // Jika menggunakan list-wise, hentikan pemrosesan baris ini.
                    break;
                } else if use_pair_wise {
                    // Untuk pairwise, tambahkan NaN agar matriks tetap rectangular.
                    row.push(f64::NAN);
                }
            }
        }

        // --- Memasukkan Data ke Matriks Berdasarkan Metode Eksklusi ---
        if use_list_wise {
            // List-wise: Hanya kasus yang lengkap (tanpa data hilang) yang dimasukkan.
            if !has_missing {
                data_matrix.push(row);
                case_numbers.push((case_idx + 1) as i32);
            }
        } else if use_pair_wise {
            // Pair-wise: Kasus hanya dihapus jika semua variabelnya hilang.
            if non_missing_count > 0 {
                data_matrix.push(row);
                case_numbers.push((case_idx + 1) as i32);
            }
        }
    }

    // Memastikan matriks data tidak kosong setelah pemrosesan.
    if data_matrix.is_empty() {
        return Err("No valid data records after preprocessing".to_string());
    }

    // --- Ekstraksi Nama Kasus ---
    // Jika `case_target` (kolom untuk nama kasus) ditentukan, ekstrak nama untuk setiap kasus yang valid.
    let case_names = if let Some(case_target) = &config.main.case_target {
        let mut names = Vec::with_capacity(case_numbers.len());

        for &case_idx in &case_numbers {
            // Konversi kembali ke indeks berbasis 0.
            let idx = (case_idx - 1) as usize;
            let mut name = None;

            // Cari nama kasus di dalam `case_data`.
            for dataset in &data.case_data {
                if idx < dataset.len() {
                    if let Some(value) = dataset[idx].values.get(case_target) {
                        // Konversi nilai (teks, angka, boolean) menjadi string.
                        name = match value {
                            DataValue::Text(text) => Some(text.clone()),
                            DataValue::Number(num) => Some(num.to_string()),
                            DataValue::Boolean(b) => Some(b.to_string()),
                            _ => None,
                        };
                        if name.is_some() {
                            break;
                        }
                    }
                }
            }
            // Tambahkan nama yang ditemukan, atau string kosong jika tidak ditemukan.
            names.push(name.unwrap_or_default());
        }
        Some(names)
    } else {
        None
    };

    let missing_cases = num_cases - data_matrix.len();

    // Mengembalikan data yang sudah diproses dan siap untuk analisis klaster.
    Ok(ProcessedData {
        variables,
        data_matrix,
        case_numbers,
        case_names,
        total_cases: num_cases,
        missing_cases,
    })
}

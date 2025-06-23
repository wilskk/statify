use std::collections::HashSet;

use crate::kmeans::models::{
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
    // Memastikan ada data target yang disediakan untuk diproses.
    if data.target_data.is_empty() {
        return Err("No target data provided".to_string());
    }

    // --- Penentuan Variabel ---
    // Menentukan variabel yang akan digunakan untuk klastering.
    // Jika `target_var` ditentukan dalam konfigurasi, maka variabel tersebut yang akan digunakan.
    // Jika tidak, fungsi akan secara otomatis mengumpulkan semua variabel numerik dari dataset.
    let variables = if let Some(target_var) = &config.main.target_var {
        target_var.clone()
    } else {
        // Mengumpulkan semua variabel unik yang bertipe numerik dari seluruh dataset.
        // `HashSet` digunakan untuk memastikan tidak ada duplikasi nama variabel.
        data.target_data
            .iter()
            .flat_map(|dataset| {
                dataset.iter().flat_map(|record| {
                    record.values
                        .iter()
                        .filter(|(_, value)| matches!(value, DataValue::Number(_)))
                        .map(|(key, _)| key.clone())
                })
            })
            .collect::<HashSet<String>>()
            .into_iter()
            .collect()
    };

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
    // Metode list-wise menjadi prioritas jika kedua opsi diaktifkan.
    let use_list_wise = config.options.exclude_list_wise;
    let use_pair_wise = config.options.exclude_pair_wise && !use_list_wise;

    // --- Iterasi dan Pengolahan Data ---
    // Memproses setiap kasus (baris) dalam data.
    for case_idx in 0..num_cases {
        let mut row = Vec::with_capacity(variables.len());
        let mut has_missing = false;
        let mut complete_variables = Vec::new();

        // Untuk setiap variabel yang telah ditentukan, cari nilainya di semua dataset.
        for var in &variables {
            let mut var_found = false;

            for dataset in &data.target_data {
                if case_idx < dataset.len() {
                    if let Some(DataValue::Number(val)) = dataset[case_idx].values.get(var) {
                        row.push(*val);
                        complete_variables.push(var.clone());
                        var_found = true;
                        break; // Lanjut ke variabel berikutnya setelah nilai ditemukan.
                    }
                }
            }

            // Jika variabel tidak ditemukan atau bukan numerik, tandai sebagai data hilang.
            if !var_found {
                has_missing = true;
                if use_list_wise {
                    // Jika menggunakan list-wise, hentikan pemrosesan baris ini dan lanjut ke kasus berikutnya.
                    break;
                } else if !use_pair_wise {
                    // Jika tidak ada metode eksklusi, isi nilai yang hilang dengan 0.0.
                    row.push(0.0);
                }
                // Untuk pair-wise, variabel yang hilang akan diabaikan dan tidak ditambahkan ke `row`.
            }
        }

        // --- Memasukkan Data ke Matriks Berdasarkan Metode Eksklusi ---
        if use_list_wise {
            // List-wise: Hanya kasus yang lengkap (tanpa data hilang) yang dimasukkan.
            if !has_missing && row.len() == variables.len() {
                data_matrix.push(row);
                case_numbers.push((case_idx + 1) as i32);
            }
        } else if use_pair_wise {
            // Pair-wise: Kasus dimasukkan jika memiliki setidaknya satu variabel yang valid.
            // `row` hanya akan berisi nilai dari variabel yang tidak hilang.
            if !complete_variables.is_empty() {
                data_matrix.push(row);
                case_numbers.push((case_idx + 1) as i32);
            }
        } else {
            // Tanpa eksklusi: Semua kasus dimasukkan, nilai yang hilang diisi dengan default (0.0).
            if row.len() == variables.len() {
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

    // Mengembalikan data yang sudah diproses dan siap untuk analisis klaster.
    Ok(ProcessedData {
        variables,
        data_matrix,
        case_numbers,
        case_names,
    })
}

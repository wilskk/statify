use crate::models::{ config::KMeansConfig, result::{ ClusterPlot, ProcessedData } };

use crate::stats::core::*;

/// Membuat visualisasi plot cluster untuk analisis K-Means.
///
/// Fungsi ini menghasilkan data untuk membuat scatter plot 2D yang menampilkan
/// distribusi titik data dan pusat cluster dalam ruang variabel.
///
/// # Visualisasi Cluster Analysis
///
/// Plot cluster adalah alat visualisasi penting untuk mengevaluasi hasil clustering.
/// Visualisasi ini membantu dalam:
/// 1. **Evaluasi Kualitas Clustering**: Melihat seberapa baik cluster terpisah
/// 2. **Identifikasi Outlier**: Titik yang jauh dari pusat cluster
/// 3. **Validasi Hasil**: Memastikan cluster masuk akal secara visual
/// 4. **Komunikasi Hasil**: Menyampaikan hasil clustering kepada stakeholder
///
/// # Metode Visualisasi
///
/// ## Dimensionality Reduction untuk Plot 2D:
///
/// Karena data mungkin memiliki lebih dari 2 variabel, visualisasi menggunakan
/// proyeksi ke 2 dimensi dengan memilih 2 variabel pertama sebagai sumbu.
///
/// ### Proyeksi Linear:
/// ```
/// x_coord = variable_1
/// y_coord = variable_2
/// ```
///
/// ### Alternatif Metode (untuk data multidimensi):
/// - **Principal Component Analysis (PCA)**: Proyeksi ke 2 komponen utama
/// - **t-SNE**: Non-linear dimensionality reduction
/// - **UMAP**: Uniform Manifold Approximation and Projection
///
/// ## Representasi Visual:
///
/// ### Titik Data:
/// - **Posisi**: (x_coord, y_coord) berdasarkan nilai variabel
/// - **Warna**: Berdasarkan cluster assignment
/// - **Ukuran**: Seragam untuk semua titik data
///
/// ### Pusat Cluster:
/// - **Posisi**: Koordinat pusat cluster dalam ruang 2D
/// - **Simbol**: Biasanya lebih besar atau berbeda dari titik data
/// - **Warna**: Sesuai dengan cluster yang direpresentasikan
///
/// # Interpretasi Visual
///
/// ## Kualitas Clustering yang Baik:
/// - **Cluster Terpisah**: Jarak antar pusat cluster besar
/// - **Cluster Kompak**: Titik dalam cluster berkumpul dekat pusat
/// - **Batas Jelas**: Tidak ada overlap antar cluster
///
/// ## Masalah Clustering:
/// - **Cluster Tumpang Tindih**: Pusat cluster terlalu dekat
/// - **Cluster Terfragmentasi**: Titik dalam cluster tersebar jauh
/// - **Outlier**: Titik yang jauh dari semua pusat cluster
///
/// # Metrik Visual
///
/// Dari plot dapat dihitung:
/// - **Separation Index**: min(d_centers) / max(d_centers)
/// - **Cohesion Index**: rata-rata jarak titik ke pusat cluster
/// - **Silhouette Width**: (b-a)/max(a,b) untuk setiap titik
///
/// # Sumber:
/// - Cleveland, W. S. (1993). "Visualizing Data"
/// - Tufte, E. R. (2001). "The Visual Display of Quantitative Information"
/// - van der Maaten, L., & Hinton, G. (2008). "Visualizing Data using t-SNE"
/// - McInnes, L., Healy, J., & Melville, J. (2018). "UMAP: Uniform Manifold Approximation and Projection"
pub fn create_cluster_plot(
    data: &ProcessedData,
    config: &KMeansConfig
) -> Result<ClusterPlot, String> {
    // Keterbatasan: Visualisasi 2D hanya 2 variabel pertama yang digunakan.
    if data.variables.len() < 2 {
        return Err("Data must have at least 2 variables to create a plot.".to_string());
    }

    // Langkah 1: Menghasilkan pusat cluster final menggunakan algoritma K-Means
    //
    // Pusat cluster ini akan digunakan sebagai referensi untuk menampilkan
    // "prototype" atau "centroid" dari setiap cluster dalam visualisasi.
    let final_centers_result = generate_final_cluster_centers(data, config)?;
    let centers_matrix = convert_map_to_matrix(&final_centers_result.centers, &data.variables);

    // Langkah 2: Menentukan variabel untuk sumbu x dan y
    //
    // Strategi: Menggunakan 2 variabel pertama sebagai sumbu x dan y.
    // Alternatif: Bisa menggunakan PCA atau metode dimensionality reduction lainnya
    // untuk data multidimensi.
    let x_variable = data.variables[0].clone(); // Variabel pertama sebagai sumbu x
    let y_variable = data.variables[1].clone(); // Variabel kedua sebagai sumbu y
    let x_col_index = 0; // Indeks kolom untuk variabel x
    let y_col_index = 1; // Indeks kolom untuk variabel y

    // Langkah 3: Inisialisasi vektor untuk menyimpan koordinat plot
    //
    // Kapasitas: data_matrix.len() + centers_matrix.len()
    // - data_matrix.len(): Jumlah titik data
    // - centers_matrix.len(): Jumlah pusat cluster
    let mut x_coords: Vec<f64> = Vec::with_capacity(data.data_matrix.len() + centers_matrix.len());
    let mut y_coords: Vec<f64> = Vec::with_capacity(data.data_matrix.len() + centers_matrix.len());
    let mut clusters: Vec<i32> = Vec::with_capacity(data.data_matrix.len() + centers_matrix.len());
    let mut is_center: Vec<bool> = Vec::with_capacity(
        data.data_matrix.len() + centers_matrix.len()
    );

    // Langkah 4a: Menambahkan titik data ke plot
    //
    // Untuk setiap titik data:
    // 1. Ekstrak koordinat x dan y dari nilai variabel
    // 2. Tentukan cluster assignment berdasarkan jarak Euclidean
    // 3. Tandai sebagai titik data (bukan pusat cluster)
    for case in &data.data_matrix {
        // Ekstrak koordinat dari nilai variabel pertama dan kedua
        x_coords.push(case[x_col_index]); // Koordinat x = nilai variabel pertama
        y_coords.push(case[y_col_index]); // Koordinat y = nilai variabel kedua

        // Tentukan cluster assignment menggunakan jarak Euclidean
        let (cluster_index, _) = find_nearest_cluster(case, &centers_matrix);
        clusters.push((cluster_index + 1) as i32); // Konversi ke 1-based index untuk kemudahan interpretasi
        is_center.push(false); // Tandai sebagai titik data biasa
    }

    // Langkah 4b: Menambahkan pusat cluster ke plot
    //
    // Pusat cluster ditampilkan sebagai titik khusus yang merepresentasikan
    // "prototype" dari setiap cluster. Biasanya ditampilkan dengan ukuran
    // atau simbol yang berbeda dari titik data biasa.
    for (i, center) in centers_matrix.iter().enumerate() {
        // Koordinat pusat cluster dalam ruang 2D
        x_coords.push(center[x_col_index]); // Koordinat x pusat cluster
        y_coords.push(center[y_col_index]); // Koordinat y pusat cluster
        clusters.push((i + 1) as i32); // Cluster ID (1-based)
        is_center.push(true); // Tandai sebagai pusat cluster
    }

    // Langkah 5: Membuat label untuk setiap titik dalam plot
    //
    // Label membantu dalam identifikasi titik data dan pusat cluster
    // dalam visualisasi.
    let mut cluster_labels: Vec<String> = Vec::with_capacity(clusters.len());
    let num_points = data.data_matrix.len();

    // Label untuk titik data: Gunakan nama kasus jika tersedia, atau format default
    if let Some(case_names) = &data.case_names {
        // Jika nama kasus tersedia, gunakan nama tersebut
        cluster_labels.extend(case_names.iter().cloned());
    } else {
        // Jika tidak ada nama kasus, gunakan format "Cluster X"
        for i in 0..num_points {
            cluster_labels.push(format!("Cluster {}", clusters[i]));
        }
    }

    // Label untuk pusat cluster: Format "Center X"
    for i in 0..centers_matrix.len() {
        cluster_labels.push(format!("Center {}", clusters[num_points + i]));
    }

    // Langkah 6: Membungkus hasil dalam struktur ClusterPlot
    //
    // Struktur ini berisi semua data yang diperlukan untuk membuat
    // visualisasi scatter plot dengan clustering.
    Ok(ClusterPlot {
        x: x_coords, // Koordinat x semua titik
        x_label: x_variable, // Label sumbu x
        y: y_coords, // Koordinat y semua titik
        y_label: y_variable, // Label sumbu y
        cluster: clusters, // Assignment cluster untuk setiap titik
        cluster_label: cluster_labels, // Label untuk setiap titik
        cluster_center: is_center, // Flag untuk membedakan titik data dan pusat cluster
        note: None,
        interpretation: Some(
            "This plot visualizes the clusters using the first two variables as axes. Each point represents a case, colored by its assigned cluster. The larger points mark the final cluster centers. This visualization helps to assess the separation and cohesion of the formed clusters.".to_string()
        ),
    })
}

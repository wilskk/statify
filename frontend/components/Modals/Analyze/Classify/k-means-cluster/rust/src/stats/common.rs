use std::collections::HashMap;
use ndarray::{ Array1, ArrayView1 };

use statrs::distribution::{ FisherSnedecor, ContinuousCDF };

/**
 * Menghitung nilai rata-rata (mean) dari sebuah slice f64.
 *
 * # Arguments
 * * `values` - Slice yang berisi nilai-nilai numerik.
 *
 * # Returns
 * Nilai rata-rata. Mengembalikan 0.0 jika slice kosong.
 */
pub fn mean(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    values.iter().sum::<f64>() / (values.len() as f64)
}

/**
 * Menghitung jumlah kuadrat deviasi (sum of squared deviations) dari setiap nilai dalam slice
 * terhadap sebuah nilai referensi (biasanya mean).
 * Ini adalah komponen kunci dalam perhitungan varians.
 *
 * # Arguments
 * * `values` - Slice yang berisi nilai-nilai data.
 * * `from_value` - Nilai referensi (misalnya, rata-rata) untuk menghitung deviasi.
 *
 * # Returns
 * Jumlah dari kuadrat selisih antara setiap nilai dan `from_value`.
 */
pub fn sum_squared_deviations(values: &[f64], from_value: f64) -> f64 {
    values
        .iter()
        .map(|x| (x - from_value).powi(2))
        .sum()
}

/**
 * Menghitung varians (variance) dari sebuah slice f64.
 * Varians adalah ukuran seberapa jauh data tersebar dari rata-rata.
 *
 * # Arguments
 * * `values` - Slice yang berisi nilai-nilai data.
 *
 * # Returns
 * Nilai varians.
 */
pub fn variance(values: &[f64]) -> f64 {
    if values.len() <= 1 {
        return 0.0;
    }
    let m = mean(values);
    sum_squared_deviations(values, m) / ((values.len() - 1) as f64)
}

/**
 * Menghitung deviasi standar (standard deviation) dari sebuah slice f64.
 * Deviasi standar adalah akar kuadrat dari varians, dan mengukur jumlah variasi atau
 * dispersi dari sekumpulan nilai data dalam unit yang sama dengan data aslinya.
 *
 * # Arguments
 * * `values` - Slice yang berisi sampel data.
 *
 * # Returns
 * Nilai deviasi standar.
 */
pub fn standard_deviation(values: &[f64]) -> f64 {
    variance(values).sqrt()
}

/**
 * Menghitung p-value dari statistik F (F-statistic) menggunakan distribusi Fisher-Snedecor.
 * F-test digunakan untuk membandingkan model statistik, seringkali untuk menguji apakah varians
 * dari dua populasi adalah sama.
 * P-value yang rendah (misalnya < 0.05) menunjukkan bahwa perbedaan varians signifikan secara statistik.
 *
 * # Arguments
 * * `f_stat` - Nilai statistik F yang dihitung.
 * * `df1` - Derajat kebebasan (degrees of freedom) untuk numerator.
 * * `df2` - Derajat kebebasan (degrees of freedom) untuk denominator.
 *
 * # Returns
 * P-value yang terkait. Mengembalikan 1.0 jika input tidak valid, menunjukkan tidak ada signifikansi.
 */
pub fn f_test_p_value(f_stat: f64, df1: i32, df2: i32) -> f64 {
    if df1 <= 0 || df2 <= 0 || f_stat <= 0.0 {
        return 1.0;
    }

    match FisherSnedecor::new(df1 as f64, df2 as f64) {
        Ok(dist) => 1.0 - dist.cdf(f_stat),
        Err(_) => 0.5,
    }
}

/**
 * Menghitung jarak Euclidean antara dua titik (direpresentasikan sebagai slice f64).
 * Jarak Euclidean adalah jarak "garis lurus" antara dua titik dalam ruang Euclidean.
 *
 * # Arguments
 * * `a` - Titik pertama.
 * * `b` - Titik kedua.
 *
 * # Returns
 * Jarak Euclidean antara titik a dan b.
 */
pub fn euclidean_distance(a: &[f64], b: &[f64]) -> f64 {
    a.iter()
        .zip(b.iter())
        .map(|(x, y)| (x - y).powi(2))
        .sum::<f64>()
        .sqrt()
}

/**
 * Menghitung jarak Euclidean antara dua vektor `ndarray`.
 * Versi ini dioptimalkan untuk performa menggunakan operasi vektor dari `ndarray`.
 *
 * # Arguments
 * * `a` - Vektor pertama (`ArrayView1`).
 * * `b` - Vektor kedua (`ArrayView1`).
 *
 * # Returns
 * Jarak Euclidean antara vektor a dan b.
 */
pub fn euclidean_distance_ndarray(a: ArrayView1<f64>, b: ArrayView1<f64>) -> f64 {
    (&a - &b)
        .mapv(|x| x.powi(2))
        .sum()
        .sqrt()
}

/**
 * Menemukan cluster terdekat untuk sebuah titik data dari daftar pusat cluster.
 *
 * # Arguments
 * * `point` - Titik data.
 * * `centers` - Slice dari pusat-pusat cluster.
 *
 * # Returns
 * Sebuah tuple yang berisi:
 * - `usize`: Indeks dari cluster terdekat.
 * - `f64`: Jarak ke cluster terdekat tersebut.
 */
pub fn find_nearest_cluster(point: &[f64], centers: &[Vec<f64>]) -> (usize, f64) {
    centers
        .iter()
        .enumerate()
        .map(|(i, center)| (i, euclidean_distance(point, center)))
        .min_by(|a, b| a.1.partial_cmp(&b.1).unwrap())
        .unwrap_or((0, f64::MAX))
}

/**
 * Fungsi pembantu (helper function) untuk menemukan indeks cluster terdekat.
 *
 * # Arguments
 * * `point` - Titik data.
 * * `centers` - Slice dari pusat-pusat cluster.
 *
 * # Returns
 * Indeks dari cluster terdekat.
 */
pub fn find_closest_cluster(point: &[f64], centers: &[Vec<f64>]) -> usize {
    find_nearest_cluster(point, centers).0
}

/**
 * Menemukan cluster terdekat kedua untuk sebuah titik data.
 * Berguna untuk metrik evaluasi cluster seperti Silhouette Score.
 *
 * # Arguments
 * * `point` - Titik data.
 * * `centers` - Slice dari pusat-pusat cluster.
 * * `closest` - Indeks dari cluster terdekat pertama, yang akan dikecualikan dari pencarian.
 *
 * # Returns
 * Indeks dari cluster terdekat kedua.
 */
pub fn find_second_closest_cluster(point: &[f64], centers: &[Vec<f64>], closest: usize) -> usize {
    centers
        .iter()
        .enumerate()
        .filter(|(i, _)| *i != closest)
        .map(|(i, center)| (i, euclidean_distance(point, center)))
        .min_by(|a, b| a.1.partial_cmp(&b.1).unwrap())
        .map(|(i, _)| i)
        .unwrap_or_else(|| if closest == 0 { 1 } else { 0 })
}

/**
 * Menemukan jarak minimum antara dua pusat cluster dalam satu set.
 * Ini bisa digunakan untuk mengevaluasi seberapa baik pemisahan antar cluster.
 *
 * # Arguments
 * * `centers` - Slice dari pusat-pusat cluster.
 *
 * # Returns
 * Sebuah tuple yang berisi:
 * - `f64`: Jarak minimum.
 * - `usize`: Indeks cluster pertama.
 * - `usize`: Indeks cluster kedua.
 */
pub fn min_distance_between_centers(centers: &[Vec<f64>]) -> (f64, usize, usize) {
    (0..centers.len())
        .flat_map(|i|
            (i + 1..centers.len()).map(move |j| (
                i,
                j,
                euclidean_distance(&centers[i], &centers[j]),
            ))
        )
        .min_by(|a, b| a.2.partial_cmp(&b.2).unwrap())
        .map(|(i, j, dist)| (dist, i, j))
        .unwrap_or((f64::MAX, 0, 1))
}

/**
 * Menghitung jarak terpendek dari satu cluster tertentu ke cluster lain yang terdekat.
 *
 * # Arguments
 * * `centers` - Slice dari pusat-pusat cluster.
 * * `cluster_idx` - Indeks dari cluster yang menjadi titik acuan.
 *
 * # Returns
 * Jarak minimum ke cluster tetangga.
 */
pub fn min_distance_from_cluster(centers: &[Vec<f64>], cluster_idx: usize) -> f64 {
    centers
        .iter()
        .enumerate()
        .filter(|(i, _)| *i != cluster_idx)
        .map(|(_, center)| euclidean_distance(&centers[cluster_idx], center))
        .min_by(|a, b| a.partial_cmp(b).unwrap())
        .unwrap_or(f64::MAX)
}

/**
 * Mengubah representasi pusat cluster dari `HashMap` ke format matriks (`Vec<Vec<f64>>`).
 * Matriks yang dihasilkan memiliki baris untuk setiap cluster dan kolom untuk setiap variabel.
 *
 * # Arguments
 * * `centers_map` - `HashMap` dimana kunci adalah nama variabel dan nilai adalah `Vec<f64>`
 *                    dari nilai pusat cluster untuk variabel tersebut.
 * * `variables` - Slice dari `String` yang menentukan urutan kolom (variabel) dalam matriks output.
 *
 * # Returns
 * Representasi matriks dari pusat cluster.
 */
pub fn convert_map_to_matrix(
    centers_map: &HashMap<String, Vec<f64>>,
    variables: &[String]
) -> Vec<Vec<f64>> {
    let num_clusters = centers_map
        .values()
        .next()
        .map_or(0, |v| v.len());
    if num_clusters == 0 {
        return Vec::new();
    }

    let mut matrix = vec![vec![0.0; variables.len()]; num_clusters];

    for (var_idx, var) in variables.iter().enumerate() {
        if let Some(values) = centers_map.get(var) {
            for (cluster_idx, value) in values.iter().enumerate().take(matrix.len()) {
                matrix[cluster_idx][var_idx] = *value;
            }
        }
    }

    matrix
}

/**
 * Mengonversi data dari slice `Vec<f64>` ke format `Vec<Array1<f64>>` dari `ndarray`.
 * Berguna untuk mempersiapkan data untuk operasi numerik yang efisien.
 *
 * # Arguments
 * * `data` - Data dalam format `Vec<Vec<f64>>`.
 *
 * # Returns
 * Data dalam format `Vec<Array1<f64>>`.
 */
pub fn to_ndarray(data: &[Vec<f64>]) -> Vec<Array1<f64>> {
    data.iter()
        .map(|v| Array1::from_vec(v.to_vec()))
        .collect()
}

/**
 * Mengonversi data dari format `ndarray` (`Vec<Array1<f64>>`) kembali ke `Vec<Vec<f64>>`.
 *
 * # Arguments
 * * `data` - Data dalam format `Vec<Array1<f64>>`.
 *
 * # Returns
 * Data dalam format `Vec<Vec<f64>>`.
 */
pub fn from_ndarray(data: &[Array1<f64>]) -> Vec<Vec<f64>> {
    data.iter()
        .map(|a| a.to_vec())
        .collect()
}

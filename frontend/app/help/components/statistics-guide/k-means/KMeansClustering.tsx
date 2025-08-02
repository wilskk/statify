import React from "react";
import { HelpContentWrapper } from "../../HelpContentWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    HelpCircle,
    Calculator,
    BarChart3,
    TrendingUp,
    Target,
    Layers,
    Repeat,
} from "lucide-react";

export const KMeansClustering: React.FC = () => {
    return (
        <HelpContentWrapper
            title="K-Means Clustering"
            description="Penjelasan lengkap tentang algoritma K-Means clustering untuk pengelompokan data."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            K-Means Clustering
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Algoritma K-Means secara iteratif memperbarui posisi
                            pusat cluster untuk meminimalkan jarak total antara
                            titik data dan pusat cluster terdekatnya.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    Konsep Dasar K-Means
                </h2>

                <p>
                    K-Means adalah algoritma clustering yang membagi data
                    menjadi K kelompok berdasarkan kemiripan. Setiap kelompok
                    memiliki pusat (centroid) yang merepresentasikan rata-rata
                    dari semua titik data dalam kelompok tersebut.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Tujuan K-Means
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• Meminimalkan within-cluster variance</li>
                            <li>• Memaksimalkan between-cluster separation</li>
                            <li>• Mengelompokkan data yang mirip</li>
                            <li>• Menemukan pola tersembunyi</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            Karakteristik
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Algoritma iteratif</li>
                            <li>• Berbasis jarak Euclidean</li>
                            <li>• Konvergen ke minimum lokal</li>
                            <li>• Sensitif terhadap inisialisasi</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <Calculator className="h-6 w-6" />
                    Algoritma K-Means
                </h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Langkah-langkah dalam generate_final_cluster_centers:
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>1. Inisialisasi Pusat Cluster:</strong>{" "}
                            Tentukan posisi awal pusat cluster
                        </li>
                        <li>
                            <strong>2. Hitung Ambang Batas Konvergensi:</strong>{" "}
                            Berdasarkan jarak minimum antar pusat awal
                        </li>
                        <li>
                            <strong>3. Iterasi Assignment & Update:</strong>{" "}
                            Assign titik ke cluster terdekat dan update pusat
                        </li>
                        <li>
                            <strong>4. Cek Konvergensi:</strong> Bandingkan
                            perubahan posisi pusat dengan ambang batas
                        </li>
                        <li>
                            <strong>5. Format Hasil:</strong> Konversi matriks
                            ke HashMap untuk kemudahan penggunaan
                        </li>
                    </ol>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    Metode Inisialisasi
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            Random Initialization
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• Pilih K titik secara acak</li>
                            <li>• Sederhana dan cepat</li>
                            <li>• Hasil tidak konsisten</li>
                            <li>• Dapat terjebak di minimum lokal</li>
                        </ul>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-bold text-purple-800 mb-2">
                            K-Means++
                        </h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                            <li>• Probabilistik selection</li>
                            <li>• Pusat awal lebih terpisah</li>
                            <li>• Konvergensi lebih cepat</li>
                            <li>• Hasil lebih konsisten</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <TrendingUp className="h-6 w-6" />
                    Perhitungan Jarak
                </h2>

                <h3>Jarak Euclidean</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>d(x, y) = √(Σ(xᵢ - yᵢ)²)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>x, y</strong> = vektor data
                        </li>
                        <li>
                            <strong>i</strong> = dimensi ke-i
                        </li>
                        <li>
                            <strong>d</strong> = jarak Euclidean
                        </li>
                    </ul>
                </div>

                <h3>Assignment Rule</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>c(x) = argmin_k ||x - μ_k||²</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Setiap titik data di-assign ke cluster dengan pusat
                        terdekat
                    </p>
                </div>

                <h3>Update Rule</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>μ_k = (1/|C_k|) × Σ_{"x∈C_k"} x</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Pusat cluster diperbarui sebagai rata-rata dari semua
                        titik dalam cluster
                    </p>
                </div>

                <h2 className="mt-8">Implementasi dalam Statify</h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Fungsi-fungsi Utama:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>
                            <strong>generate_final_cluster_centers:</strong>{" "}
                            Fungsi utama orkestrasi
                        </li>
                        <li>
                            <strong>initialize_clusters:</strong> Inisialisasi
                            pusat cluster awal
                        </li>
                        <li>
                            <strong>find_nearest_cluster:</strong> Temukan
                            cluster terdekat untuk titik
                        </li>
                        <li>
                            <strong>euclidean_distance:</strong> Hitung jarak
                            Euclidean
                        </li>
                        <li>
                            <strong>min_distance_between_centers:</strong>{" "}
                            Hitung jarak minimum antar pusat
                        </li>
                        <li>
                            <strong>convert_map_to_matrix:</strong> Konversi
                            format data
                        </li>
                    </ul>
                </div>

                <h3>Parameter Konfigurasi</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Parameter yang dapat dikonfigurasi:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>
                            <strong>num_clusters:</strong> Jumlah cluster (K)
                        </li>
                        <li>
                            <strong>max_iterations:</strong> Maksimum iterasi
                        </li>
                        <li>
                            <strong>convergence_criterion:</strong> Kriteria
                            konvergensi
                        </li>
                        <li>
                            <strong>use_running_means:</strong> Gunakan running
                            means
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Dua Mode Update</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Running Means (Online)
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• Update pusat secara incremental</li>
                            <li>• μ_new = μ_old + (x - μ_old) / n</li>
                            <li>• Lebih efisien memori</li>
                            <li>• Cocok untuk data besar</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            Batch Update (Offline)
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Update pusat setelah semua assignment</li>
                            <li>• μ = (1/|C|) x Σ_{"x∈C"} x</li>
                            <li>• Lebih akurat</li>
                            <li>• Standar K-Means</li>
                        </ul>
                    </div>
                </div>

                <h3>Running Means Algorithm</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">
                        Pseudocode Running Means:
                    </h4>
                    <div className="text-sm font-mono space-y-2">
                        <div>for each case in data:</div>
                        <div>
                            {" "}
                            closest = find_nearest_cluster(case, centers)
                        </div>
                        <div> cluster_counts[closest] += 1</div>
                        <div> count = cluster_counts[closest]</div>
                        <div> for each dimension j:</div>
                        <div>
                            {" "}
                            centers[closest][j] += (case[j] -
                            centers[closest][j]) / count
                        </div>
                    </div>
                </div>

                <h3>Batch Update Algorithm</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">Pseudocode Batch Update:</h4>
                    <div className="text-sm font-mono space-y-2">
                        <div>new_centers = zeros(k, dimensions)</div>
                        <div>cluster_counts = zeros(k)</div>
                        <div>for each case in data:</div>
                        <div>
                            {" "}
                            closest = find_nearest_cluster(case, centers)
                        </div>
                        <div> cluster_counts[closest] += 1</div>
                        <div> new_centers[closest] += case</div>
                        <div>for each cluster i:</div>
                        <div> if cluster_counts[i] {">"} 0:</div>
                        <div> new_centers[i] /= cluster_counts[i]</div>
                    </div>
                </div>

                <h2 className="mt-8">Kriteria Konvergensi</h2>

                <h3>Perhitungan Ambang Batas</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            threshold = convergence_criterion × min_center_dist
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Ambang batas dihitung berdasarkan jarak minimum antar
                        pusat cluster awal
                    </p>
                </div>

                <h3>Kondisi Berhenti</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Algoritma berhenti ketika:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• max_change ≤ threshold (konvergensi tercapai)</li>
                        <li>
                            • iterasi ≥ max_iterations (maksimum iterasi
                            tercapai)
                        </li>
                        <li>
                            • Tidak ada perubahan assignment (konvergensi
                            sempurna)
                        </li>
                    </ul>
                </div>

                <h3>Perhitungan Perubahan Maksimum</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>max_change = max(||μ_new - μ_old||)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Perubahan maksimum adalah jarak Euclidean terbesar
                        antara pusat lama dan baru
                    </p>
                </div>

                <h2 className="mt-8">Jarak Antar Pusat Cluster</h2>

                <h3>Matriks Jarak</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>D[i][j] = ||μ_i - μ_j||</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Matriks simetris yang menunjukkan jarak Euclidean antar
                        pusat cluster
                    </p>
                </div>

                <h3>Interpretasi Matriks Jarak</h3>
                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Interpretasi nilai jarak:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>
                            • <strong>D[i][j] = 0:</strong> i = j (jarak ke diri
                            sendiri)
                        </li>
                        <li>
                            • <strong>D[i][j] kecil:</strong> Cluster i dan j
                            berdekatan
                        </li>
                        <li>
                            • <strong>D[i][j] besar:</strong> Cluster i dan j
                            terpisah jauh
                        </li>
                        <li>
                            • <strong>D[i][j] = D[j][i]:</strong> Matriks
                            simetris
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Struktur Hasil</h2>

                <h3>FinalClusterCenters</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">
                        Struktur hasil clustering:
                    </h4>
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>centers:</strong> HashMap&lt;String,
                            Vec&lt;f64&gt;&gt;
                        </div>
                        <div> • Key: nama variabel</div>
                        <div>
                            {" "}
                            • Value: koordinat pusat untuk setiap cluster
                        </div>
                        <div>
                            <strong>note:</strong> Catatan tambahan
                        </div>
                        <div>
                            <strong>interpretation:</strong> Interpretasi hasil
                        </div>
                    </div>
                </div>

                <h3>DistancesBetweenCenters</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Struktur matriks jarak:
                    </h4>
                    <div className="text-sm text-yellow-700 space-y-2">
                        <div>
                            <strong>distances:</strong>{" "}
                            Vec&lt;Vec&lt;f64&gt;&gt;
                        </div>
                        <div> • Matriks K × K</div>
                        <div> • distances[i][j] = jarak cluster i ke j</div>
                        <div> • Diagonal = 0 (jarak ke diri sendiri)</div>
                        <div>
                            {" "}
                            • Simetris: distances[i][j] = distances[j][i]
                        </div>
                    </div>
                </div>

                <h2 className="mt-8">Optimasi dan Penanganan Khusus</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Penanganan Cluster Kosong
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• Deteksi cluster dengan count = 0</li>
                            <li>• Pertahankan posisi pusat lama</li>
                            <li>• Hindari pembagian dengan nol</li>
                            <li>• Mencegah konvergensi palsu</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            Optimasi Memori
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Reuse matriks untuk iterasi</li>
                            <li>• Minimal alokasi memori baru</li>
                            <li>• Efisien untuk data besar</li>
                            <li>• Parallel processing ready</li>
                        </ul>
                    </div>
                </div>

                <h2 className="mt-8">Interpretasi Hasil</h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Tabel Final Cluster Centers:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>
                            <strong>Baris:</strong> Setiap variabel dalam
                            dataset
                        </li>
                        <li>
                            <strong>Kolom:</strong> Setiap cluster (1, 2, ...,
                            K)
                        </li>
                        <li>
                            <strong>Nilai:</strong> Koordinat pusat cluster
                            untuk variabel tersebut
                        </li>
                        <li>
                            <strong>Interpretasi:</strong> Profil tipikal
                            anggota cluster
                        </li>
                    </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Tabel Distances Between Centers:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>
                            <strong>Baris/Kolom:</strong> Indeks cluster (0, 1,
                            ..., K-1)
                        </li>
                        <li>
                            <strong>Nilai:</strong> Jarak Euclidean antar pusat
                        </li>
                        <li>
                            <strong>Diagonal:</strong> Selalu 0 (jarak ke diri
                            sendiri)
                        </li>
                        <li>
                            <strong>Interpretasi:</strong> Seberapa terpisah
                            antar cluster
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Keunggulan dan Keterbatasan</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Keunggulan K-Means
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• Sederhana dan mudah dipahami</li>
                            <li>• Efisien untuk data besar</li>
                            <li>• Konvergen dengan cepat</li>
                            <li>• Hasil mudah diinterpretasi</li>
                            <li>• Garansi konvergensi</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            Keterbatasan K-Means
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Sensitif terhadap inisialisasi</li>
                            <li>• Hanya menemukan minimum lokal</li>
                            <li>• Memerlukan jumlah K yang diketahui</li>
                            <li>• Asumsi cluster berbentuk bola</li>
                            <li>• Sensitif terhadap outlier</li>
                        </ul>
                    </div>
                </div>

                <h2 className="mt-8">Praktik Terbaik</h2>

                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Tips untuk hasil optimal:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-2">
                        <li>
                            <strong>1. Normalisasi Data:</strong> Standarisasi
                            variabel untuk menghindari bias skala
                        </li>
                        <li>
                            <strong>2. Multiple Runs:</strong> Jalankan
                            algoritma beberapa kali dengan inisialisasi berbeda
                        </li>
                        <li>
                            <strong>3. Elbow Method:</strong> Gunakan untuk
                            menentukan K optimal
                        </li>
                        <li>
                            <strong>4. Validasi Silhouette:</strong> Evaluasi
                            kualitas clustering
                        </li>
                        <li>
                            <strong>5. Interpretasi Domain:</strong>{" "}
                            Pertimbangkan konteks bisnis
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">File Terkait</h2>
                <ul>
                    <li>
                        <code>rust/src/stats/cluster_centers.rs</code> -
                        Implementasi K-Means clustering
                    </li>
                    <li>
                        <code>rust/src/models/config.rs</code> - Konfigurasi
                        K-Means
                    </li>
                    <li>
                        <code>rust/src/models/result.rs</code> - Struktur hasil
                        clustering
                    </li>
                    <li>
                        <code>rust/src/stats/core.rs</code> - Fungsi bantu
                        perhitungan
                    </li>
                    <li>
                        <code>
                            components/Modals/Analyze/Classify/k-means-cluster/
                        </code>
                    </li>
                </ul>
            </div>
        </HelpContentWrapper>
    );
};

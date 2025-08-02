import React from "react";
import { HelpContentWrapper } from "../../HelpContentWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    HelpCircle,
    Calculator,
    BarChart3,
    TrendingUp,
    LayoutDashboard,
} from "lucide-react";

export const DesignMatrix: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate: Design Matrix & Sweep Operations"
            description="Penjelasan lengkap tentang konstruksi matriks desain dan operasi sweep dalam analisis GLM Univariate."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            Design Matrix & Sweep Operations
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Matriks desain adalah komponen fundamental dalam GLM
                            yang merepresentasikan model linear dalam bentuk
                            matriks. Operasi sweep Gauss-Jordan digunakan untuk
                            menyelesaikan sistem persamaan dan mengekstrak
                            estimasi parameter.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <LayoutDashboard className="h-6 w-6" />
                    Konsep Dasar Design Matrix
                </h2>

                <p>
                    Design Matrix (X) adalah matriks yang merepresentasikan
                    model linear dalam bentuk matriks. Setiap baris
                    merepresentasikan satu observasi, dan setiap kolom
                    merepresentasikan satu prediktor atau kombinasi prediktor.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">
                        Model Linear dalam Bentuk Matriks:
                    </h4>
                    <div className="text-center text-lg font-mono">
                        <strong>Y = Xβ + ε</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>Y</strong> = vektor respons (n × 1)
                        </li>
                        <li>
                            <strong>X</strong> = matriks desain (n × p)
                        </li>
                        <li>
                            <strong>β</strong> = vektor parameter (p × 1)
                        </li>
                        <li>
                            <strong>ε</strong> = vektor error (n × 1)
                        </li>
                    </ul>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <Calculator className="h-6 w-6" />
                    Konstruksi Design Matrix
                </h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Langkah-langkah dalam create_design_response_weights:
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>1. Ekstraksi Data:</strong> Mengambil
                            variabel dependen dan WLS weights
                        </li>
                        <li>
                            <strong>2. Validasi Data:</strong> Memastikan semua
                            nilai numerik dan valid
                        </li>
                        <li>
                            <strong>3. Generasi Term Model:</strong> Membuat
                            daftar term berdasarkan konfigurasi
                        </li>
                        <li>
                            <strong>4. Cache Data:</strong> Pre-cache faktor
                            levels dan kovariat untuk efisiensi
                        </li>
                        <li>
                            <strong>5. Konstruksi Kolom:</strong> Membuat kolom
                            untuk setiap term model
                        </li>
                        <li>
                            <strong>6. Assembly Matrix:</strong> Menggabungkan
                            semua kolom menjadi matriks desain
                        </li>
                    </ol>
                </div>

                <h3>Komponen Design Matrix</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">
                        Struktur DesignMatrixInfo:
                    </h4>
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>x:</strong> Matriks desain (n × p)
                        </div>
                        <div>
                            <strong>y:</strong> Vektor respons (n × 1)
                        </div>
                        <div>
                            <strong>w:</strong> Vektor bobot opsional (n × 1)
                        </div>
                        <div>
                            <strong>n_samples:</strong> Jumlah sampel efektif
                        </div>
                        <div>
                            <strong>p_parameters:</strong> Jumlah parameter
                            dalam model
                        </div>
                        <div>
                            <strong>r_x_rank:</strong> Rank dari matriks desain
                        </div>
                        <div>
                            <strong>term_column_indices:</strong> Peta indeks
                            kolom untuk setiap term
                        </div>
                        <div>
                            <strong>intercept_column:</strong> Indeks kolom
                            intercept (jika ada)
                        </div>
                        <div>
                            <strong>term_names:</strong> Nama-nama term dalam
                            model
                        </div>
                        <div>
                            <strong>case_indices_to_keep:</strong> Indeks kasus
                            yang digunakan
                        </div>
                        <div>
                            <strong>fixed_factor_indices:</strong> Peta indeks
                            untuk faktor tetap
                        </div>
                        <div>
                            <strong>random_factor_indices:</strong> Peta indeks
                            untuk faktor acak
                        </div>
                        <div>
                            <strong>covariate_indices:</strong> Peta indeks
                            untuk kovariat
                        </div>
                    </div>
                </div>

                <h3>Jenis Term dalam Model</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Intercept
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>
                                • Kolom dengan nilai 1 untuk semua observasi
                            </li>
                            <li>• Merepresentasikan konstanta dalam model</li>
                            <li>
                                • Biasanya kolom pertama dalam matriks desain
                            </li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            Kovariat
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Variabel kontinu</li>
                            <li>• Nilai asli dari data</li>
                            <li>• Tidak memerlukan dummy coding</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            Faktor (Main Effects)
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• Dummy coding untuk setiap level</li>
                            <li>
                                • Satu kolom per level (kecuali level referensi)
                            </li>
                            <li>
                                • Nilai 1 jika observasi pada level tersebut, 0
                                jika tidak
                            </li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            Interaksi
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Produk dari kolom-kolom komponen</li>
                            <li>• Merepresentasikan efek interaksi</li>
                            <li>• Dapat melibatkan faktor dan kovariat</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    Cross-Product Matrix Z'WZ
                </h2>

                <p>
                    Matriks Z'WZ adalah matriks hasil perkalian silang yang
                    menjadi pusat operasi sweep Gauss-Jordan. Z dibentuk dengan
                    menggabungkan matriks desain X dan vektor respons Y.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">Konstruksi Matriks Z:</h4>
                    <div className="text-center text-lg font-mono">
                        <strong>Z = [X Y]</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Matriks Z menggabungkan matriks desain X dengan vektor
                        respons Y
                    </p>
                </div>

                <h3>Struktur Matriks Z'WZ</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Matriks Z'WZ memiliki struktur:
                    </h4>
                    <div className="text-center text-lg font-mono">
                        <strong>
                            [ X'WX X'WY ]<br />[ Y'WX Y'WY ]
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>X'WX:</strong> Matriks p×p (p = jumlah
                            parameter)
                        </li>
                        <li>
                            <strong>X'WY:</strong> Vektor p×1
                        </li>
                        <li>
                            <strong>Y'WX:</strong> Vektor 1×p (transpose dari
                            X'WY)
                        </li>
                        <li>
                            <strong>Y'WY:</strong> Skalar (jumlah kuadrat total)
                        </li>
                    </ul>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <TrendingUp className="h-6 w-6" />
                    Operasi Sweep Gauss-Jordan
                </h2>

                <p>
                    Operasi sweep adalah algoritma fundamental untuk
                    menyelesaikan sistem persamaan linear dan mengekstrak
                    estimasi parameter dari matriks Z'WZ.
                </p>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Algoritma Sweep (AS 178):
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>1. Deteksi Kolinearitas:</strong> Periksa
                            elemen pivot c[k,k]
                        </li>
                        <li>
                            <strong>2. Validasi Pivot:</strong> Jika |c[k,k]| ≤
                            ε × |s_k|, parameter kolinear
                        </li>
                        <li>
                            <strong>3. Operasi Sweep:</strong> Untuk setiap
                            baris/kolom k yang valid
                        </li>
                        <li>
                            <strong>4. Update Matriks:</strong> Terapkan
                            transformasi sweep
                        </li>
                        <li>
                            <strong>5. Ekstraksi Hasil:</strong> Ambil G⁻¹, β̂,
                            dan S dari matriks yang di-sweep
                        </li>
                    </ol>
                </div>

                <h3>Operasi Sweep Standar</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">
                        Untuk setiap baris/kolom k:
                    </h4>
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>1. c[k,k] = -1/c[k,k]</strong>
                        </div>
                        <div>
                            <strong>2. c[k,j] = c[k,j]/c[k,k] (j ≠ k)</strong>
                        </div>
                        <div>
                            <strong>3. c[i,k] = c[i,k]/c[k,k] (i ≠ k)</strong>
                        </div>
                        <div>
                            <strong>
                                4. c[i,j] = c[i,j] + c[i,k] × c[k,j] × c[k,k]
                                (i,j ≠ k)
                            </strong>
                        </div>
                    </div>
                </div>

                <h3>Hasil Setelah Sweep</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Matriks setelah sweep pada p baris/kolom pertama:
                    </h4>
                    <div className="text-center text-lg font-mono">
                        <strong>
                            [ -G B̂ ]<br />[ B̂' S ]
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>G:</strong> Generalized inverse dari X'WX
                            (p×p)
                        </li>
                        <li>
                            <strong>B̂:</strong> Estimasi parameter (p×1)
                        </li>
                        <li>
                            <strong>B̂':</strong> Transpose dari B̂ (1×p)
                        </li>
                        <li>
                            <strong>S:</strong> Matriks residual (1×1, berisi
                            SSE)
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Deteksi Kolinearitas</h2>

                <p>
                    Algoritma sweep mendeteksi kolinearitas dengan memeriksa
                    elemen pivot. Parameter yang kolinear tidak dapat diestimasi
                    secara unik.
                </p>

                <div className="bg-red-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-red-800 mb-2">
                        Kondisi Kolinearitas:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                        <li>• |c[k,k]| ≤ ε × |s_k| (pivot terlalu kecil)</li>
                        <li>• Inconsistency dalam swept flags</li>
                        <li>• Parameter aliased (tidak dapat diestimasi)</li>
                        <li>
                            • Estimasi parameter = 0 untuk parameter kolinear
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Estimasi Parameter</h2>

                <h3>Ordinary Least Squares (OLS)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>β̂ = (X'X)⁻¹X'y</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Estimasi parameter menggunakan metode kuadrat terkecil
                    </p>
                </div>

                <h3>Weighted Least Squares (WLS)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>β̂ = (X'WX)⁻¹X'Wy</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Estimasi parameter dengan bobot untuk
                        heteroskedastisitas
                    </p>
                </div>

                <h3>Generalized Inverse</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>G⁻¹ = -G (dari hasil sweep)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Generalized inverse untuk kasus matriks singular
                    </p>
                </div>

                <h2 className="mt-8">Sum of Squares Error (SSE)</h2>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SSE = S[0,0] (dari hasil sweep)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Sum of Squares Error diekstrak dari elemen S[0,0]
                        matriks hasil sweep
                    </p>
                </div>

                <h3>Degrees of Freedom Error</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>df_error = n - rank(X)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Degrees of freedom untuk error
                    </p>
                </div>

                <h3>Mean Square Error (MSE)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>MSE = SSE / df_error</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Estimasi varians error
                    </p>
                </div>

                <h2 className="mt-8">Implementasi dalam Statify</h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Fungsi-fungsi Utama:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>
                            <strong>create_design_response_weights:</strong>{" "}
                            Membuat matriks desain dan vektor respons
                        </li>
                        <li>
                            <strong>create_cross_product_matrix:</strong>{" "}
                            Membuat matriks Z'WZ
                        </li>
                        <li>
                            <strong>perform_sweep_and_extract_results:</strong>{" "}
                            Melakukan operasi sweep dan mengekstrak hasil
                        </li>
                        <li>
                            <strong>create_groups_from_design_matrix:</strong>{" "}
                            Membuat grup untuk Levene's test
                        </li>
                    </ul>
                </div>

                <h3>Struktur SweptMatrixInfo</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">
                        Hasil dari perform_sweep_and_extract_results:
                    </h4>
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>g_inv:</strong> Matriks G⁻¹ (generalized
                            inverse)
                        </div>
                        <div>
                            <strong>beta_hat:</strong> Vektor estimasi parameter
                            β̂
                        </div>
                        <div>
                            <strong>s_rss:</strong> Sum of Squares Error (SSE)
                        </div>
                    </div>
                </div>

                <h3>Optimasi Implementasi</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Fitur Optimasi:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Pre-caching data untuk menghindari re-reading</li>
                        <li>• Parallel processing untuk perhitungan besar</li>
                        <li>• Deteksi kolinearitas otomatis</li>
                        <li>• Penanganan matriks singular</li>
                        <li>• Validasi dimensi matriks</li>
                    </ul>
                </div>

                <h2 className="mt-8">Aplikasi Praktis</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Keuntungan Sweep Operations
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• Deteksi kolinearitas otomatis</li>
                            <li>• Penanganan matriks singular</li>
                            <li>• Ekstraksi semua statistik sekaligus</li>
                            <li>• Numerically stable</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            Kapan Menggunakan
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Model dengan interaksi kompleks</li>
                            <li>• Data dengan kolinearitas</li>
                            <li>• Model dengan kovariat</li>
                            <li>• Analisis yang memerlukan G⁻¹</li>
                        </ul>
                    </div>
                </div>

                <h2 className="mt-8">Referensi</h2>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">Algoritma AS 178:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>
                            • Clarke, M.R.B. (1982) "Algorithm AS 178: The
                            Gauss-Jordan Sweep Operator with Detection of
                            Collinearity"
                        </li>
                        <li>
                            • Ridout, M.S. dan Cobby, J.M. (1989) "Algorithm AS
                            R78: A Remark on Algorithm AS 178"
                        </li>
                        <li>
                            • Journal of the Royal Statistical Society. Series C
                            (Applied Statistics)
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">File Terkait</h2>
                <ul>
                    <li>
                        <code>rust/src/stats/design_matrix.rs</code> -
                        Implementasi matriks desain dan sweep
                    </li>
                    <li>
                        <code>rust/src/models/result.rs</code> - Struktur
                        DesignMatrixInfo dan SweptMatrixInfo
                    </li>
                    <li>
                        <code>rust/src/stats/core.rs</code> - Fungsi bantu
                        perhitungan
                    </li>
                    <li>
                        <code>
                            components/Modals/Analyze/general-linear-model/univariate/
                        </code>
                    </li>
                </ul>
            </div>
        </HelpContentWrapper>
    );
};

import React from "react";
import { HelpContentWrapper } from "../../HelpContentWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    HelpCircle,
    Calculator,
    BarChart3,
    TrendingUp,
    AlertTriangle,
    TestTube,
} from "lucide-react";

export const HeteroscedasticityTests: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate: Heteroscedasticity Tests"
            description="Penjelasan lengkap tentang uji heteroskedastisitas dalam analisis GLM Univariate."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            Heteroscedasticity Tests
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Uji heteroskedastisitas memeriksa apakah varians
                            error konstan di semua level prediktor. Pelanggaran
                            asumsi ini dapat mempengaruhi validitas inferensi
                            statistik.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <TestTube className="h-6 w-6" />
                    Konsep Dasar Heteroscedasticity
                </h2>

                <p>
                    Heteroscedasticity adalah kondisi dimana varians error tidak
                    konstan di semua level prediktor. Ini melanggar asumsi
                    homoscedasticity yang diperlukan untuk validitas inferensi
                    statistik dalam model linear.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Homoscedasticity (H₀)
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• Varians error konstan</li>
                            <li>• Var(εᵢ) = σ² untuk semua i</li>
                            <li>• Asumsi terpenuhi</li>
                            <li>• Inferensi statistik valid</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            Heteroscedasticity (H₁)
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Varians error tidak konstan</li>
                            <li>• Var(εᵢ) ≠ σ² untuk beberapa i</li>
                            <li>• Asumsi dilanggar</li>
                            <li>• Inferensi statistik bias</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <Calculator className="h-6 w-6" />
                    Metode Uji Heteroscedasticity
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            White Test
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Deteksi umum heteroskedastisitas</li>
                            <li>• Tidak memerlukan asumsi bentuk</li>
                            <li>• Menggunakan kuadrat dan interaksi</li>
                            <li>• Statistik: LM = n × R²</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            Breusch-Pagan Test
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• Deteksi heteroskedastisitas linear</li>
                            <li>• Berdasarkan nilai prediksi</li>
                            <li>• Mengasumsikan normalitas</li>
                            <li>• Statistik: BP = ESS / (2 × σ̂⁴)</li>
                        </ul>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-bold text-purple-800 mb-2">
                            Modified Breusch-Pagan
                        </h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                            <li>• Versi robust dari BP test</li>
                            <li>• Tahan terhadap non-normalitas</li>
                            <li>• Koenker-Bassett version</li>
                            <li>• Statistik: LM = n × R²</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">F-Test</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Alternatif untuk uji Chi-kuadrat</li>
                            <li>• Performa lebih baik pada sampel kecil</li>
                            <li>• Berdasarkan nilai prediksi</li>
                            <li>• Statistik: F = (R²/df₁) / ((1-R²)/df₂)</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    Algoritma Umum
                </h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Langkah-langkah dalam
                        calculate_heteroscedasticity_tests:
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>1. Fit Model Utama:</strong> Buat matriks
                            desain dan lakukan sweep
                        </li>
                        <li>
                            <strong>2. Hitung Residual:</strong> ε = y - ŷ
                        </li>
                        <li>
                            <strong>3. Kuadratkan Residual:</strong> ε² sebagai
                            variabel dependen
                        </li>
                        <li>
                            <strong>4. Buat Model Pembantu:</strong> Regresi ε²
                            pada prediktor
                        </li>
                        <li>
                            <strong>5. Hitung Statistik:</strong> Berdasarkan
                            metode yang dipilih
                        </li>
                        <li>
                            <strong>6. Uji Signifikansi:</strong> Bandingkan
                            dengan distribusi teoritis
                        </li>
                    </ol>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <TrendingUp className="h-6 w-6" />
                    White Test
                </h2>

                <p>
                    White test adalah uji heteroskedastisitas yang paling umum
                    digunakan karena tidak memerlukan asumsi tentang bentuk
                    spesifik heteroskedastisitas.
                </p>

                <h3>Konstruksi Model Pembantu</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">Matriks Pembantu White:</h4>
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>1. Intercept:</strong> Kolom dengan nilai 1
                        </div>
                        <div>
                            <strong>2. Prediktor Asli:</strong> X₁, X₂, ..., Xₚ
                        </div>
                        <div>
                            <strong>3. Kuadrat Prediktor:</strong> X₁², X₂²,
                            ..., Xₚ²
                        </div>
                        <div>
                            <strong>4. Interaksi:</strong> X₁×X₂, X₁×X₃, ...,
                            Xₚ₋₁×Xₚ
                        </div>
                    </div>
                </div>

                <h3>Statistik White Test</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>LM = n × R²</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>n</strong> = jumlah observasi
                        </li>
                        <li>
                            <strong>R²</strong> = koefisien determinasi dari
                            regresi pembantu
                        </li>
                        <li>
                            <strong>df</strong> = jumlah prediktor dalam model
                            pembantu - 1
                        </li>
                    </ul>
                </div>

                <h3>Distribusi dan Interpretasi</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        White Test mengikuti distribusi Chi-kuadrat:
                    </h4>
                    <div className="text-sm text-yellow-700 space-y-1">
                        <li>• LM ~ χ²(df) di bawah H₀</li>
                        <li>• p-value = P(χ²(df) {">"} LM)</li>
                        <li>
                            • p {">"} 0.05: Tolak H₀, ada heteroskedastisitas
                        </li>
                        <li>• p ≥ 0.05: Gagal tolak H₀, homoskedastisitas</li>
                    </div>
                </div>

                <h2 className="mt-8">Breusch-Pagan Test</h2>

                <p>
                    Breusch-Pagan test mengasumsikan bahwa varians error adalah
                    fungsi linear dari variabel penjelas.
                </p>

                <h3>Model Pembantu BP</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">Regresi Pembantu:</h4>
                    <div className="text-center text-lg font-mono">
                        <strong>ε² = α₀ + α₁ŷ + u</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Dimana ε² adalah kuadrat residual dan ŷ adalah nilai
                        prediksi
                    </p>
                </div>

                <h3>Statistik Breusch-Pagan</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>BP = ESS / (2 × σ̂⁴)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>ESS</strong> = Explained Sum of Squares dari
                            regresi pembantu
                        </li>
                        <li>
                            <strong>σ̂²</strong> = RSS/n (estimasi varians error
                            model utama)
                        </li>
                        <li>
                            <strong>df</strong> = 1 (karena hanya ŷ sebagai
                            prediktor)
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Modified Breusch-Pagan Test</h2>

                <p>
                    Modified Breusch-Pagan test (Koenker-Bassett) adalah versi
                    yang lebih robust terhadap pelanggaran asumsi normalitas.
                </p>

                <h3>Statistik Modified BP</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>LM = n × R²</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Sama dengan White test, tetapi model pembantu hanya
                        menggunakan ŷ
                    </p>
                </div>

                <h3>Keunggulan Modified BP</h3>
                <div className="bg-green-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-green-800 mb-2">
                        Keunggulan dibanding BP klasik:
                    </h4>
                    <ul className="text-sm text-green-700 space-y-1">
                        <li>• Lebih robust terhadap non-normalitas</li>
                        <li>• Tidak memerlukan asumsi distribusi</li>
                        <li>• Performa lebih baik pada sampel kecil</li>
                        <li>• Lebih konsisten secara asimptotik</li>
                    </ul>
                </div>

                <h2 className="mt-8">F-Test untuk Heteroscedasticity</h2>

                <p>
                    F-test adalah alternatif untuk uji Chi-kuadrat yang sering
                    memiliki performa lebih baik pada sampel kecil.
                </p>

                <h3>Statistik F</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>F = (R²/df₁) / ((1-R²)/df₂)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>df₁</strong> = jumlah prediktor dalam model
                            pembantu - 1
                        </li>
                        <li>
                            <strong>df₂</strong> = n - jumlah prediktor dalam
                            model pembantu
                        </li>
                        <li>
                            <strong>R²</strong> = koefisien determinasi dari
                            regresi pembantu
                        </li>
                    </ul>
                </div>

                <h3>Distribusi F</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        F-test mengikuti distribusi F:
                    </h4>
                    <div className="text-sm text-yellow-700 space-y-1">
                        <li>• F ~ F(df₁, df₂) di bawah H₀</li>
                        <li>• p-value = P(F(df₁, df₂) {">"} F_observed)</li>
                        <li>
                            • p {">"} 0.05: Tolak H₀, ada heteroskedastisitas
                        </li>
                        <li>• p ≥ 0.05: Gagal tolak H₀, homoskedastisitas</li>
                    </div>
                </div>

                <h2 className="mt-8">Implementasi dalam Statify</h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Fungsi-fungsi Utama:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>
                            <strong>calculate_heteroscedasticity_tests:</strong>{" "}
                            Fungsi utama orkestrasi
                        </li>
                        <li>
                            <strong>run_simple_ols:</strong> Regresi OLS
                            menggunakan dekomposisi QR
                        </li>
                        <li>
                            <strong>create_white_aux_matrix:</strong> Membuat
                            matriks pembantu White
                        </li>
                        <li>
                            <strong>create_predicted_aux_matrix:</strong>{" "}
                            Membuat matriks pembantu BP
                        </li>
                        <li>
                            <strong>calculate_white_test:</strong> Implementasi
                            White test
                        </li>
                        <li>
                            <strong>calculate_bp_test:</strong> Implementasi
                            Breusch-Pagan test
                        </li>
                        <li>
                            <strong>calculate_modified_bp_test:</strong>{" "}
                            Implementasi Modified BP
                        </li>
                        <li>
                            <strong>calculate_f_test:</strong> Implementasi
                            F-test
                        </li>
                    </ul>
                </div>

                <h3>Optimasi Implementasi</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Fitur Optimasi:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Dekomposisi QR untuk stabilitas numerik</li>
                        <li>• Parallel processing untuk interaksi</li>
                        <li>• Deteksi matriks singular</li>
                        <li>• Penanganan kasus khusus</li>
                        <li>• Validasi dimensi matriks</li>
                    </ul>
                </div>

                <h2 className="mt-8">Interpretasi Hasil</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            p-value ≥ 0.05
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• Gagal menolak H₀</li>
                            <li>• Homoskedastisitas</li>
                            <li>• Asumsi terpenuhi</li>
                            <li>• Inferensi statistik valid</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            p-value {">"} 0.05
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Menolak H₀</li>
                            <li>• Heteroskedastisitas</li>
                            <li>• Asumsi dilanggar</li>
                            <li>• Pertimbangkan solusi</li>
                        </ul>
                    </div>
                </div>

                <h2 className="mt-8">Solusi untuk Heteroscedasticity</h2>

                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Ketika Heteroskedastisitas Terdeteksi:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-2">
                        <li>
                            <strong>1. Weighted Least Squares (WLS):</strong>{" "}
                            Gunakan bobot yang berbanding terbalik dengan
                            varians
                        </li>
                        <li>
                            <strong>2. Robust Standard Errors:</strong> Gunakan
                            standard error yang tahan terhadap
                            heteroskedastisitas
                        </li>
                        <li>
                            <strong>3. Transformasi Data:</strong> Log, square
                            root, atau transformasi lain
                        </li>
                        <li>
                            <strong>4. Generalized Least Squares (GLS):</strong>{" "}
                            Estimasi varians error secara eksplisit
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">File Terkait</h2>
                <ul>
                    <li>
                        <code>rust/src/stats/heteroscedasticity.rs</code> -
                        Implementasi uji heteroskedastisitas
                    </li>
                    <li>
                        <code>rust/src/models/result.rs</code> - Struktur hasil
                        uji
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

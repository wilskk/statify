import React from "react";
import { HelpContentWrapper } from "../../HelpContentWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    HelpCircle,
    Calculator,
    BarChart3,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
} from "lucide-react";

export const LackOfFitTests: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate: Lack of Fit Tests"
            description="Penjelasan lengkap tentang uji lack of fit untuk mengevaluasi kecukupan model dalam analisis GLM Univariate."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            Lack of Fit Tests
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Uji lack of fit menentukan apakah model yang dipilih
                            sudah cukup baik dalam menjelaskan hubungan antara
                            prediktor dan respons. Uji ini membandingkan error
                            total dengan pure error.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6" />
                    Konsep Dasar Lack of Fit
                </h2>

                <p>
                    Lack of fit test adalah uji untuk menentukan apakah model
                    yang dipilih sudah cukup baik dalam menjelaskan hubungan
                    antara variabel prediktor (X) dan variabel respons (Y). Uji
                    ini membandingkan variasi di sekitar rata-rata model dengan
                    variasi murni dalam data.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Model Cukup (H₀)
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• Model sudah sesuai dengan data</li>
                            <li>• Tidak ada lack of fit</li>
                            <li>• Error hanya random error</li>
                            <li>• F-value tidak signifikan</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            Model Tidak Cukup (H₁)
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Model tidak sesuai dengan data</li>
                            <li>• Ada lack of fit</li>
                            <li>• Error termasuk systematic error</li>
                            <li>• F-value signifikan</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <Calculator className="h-6 w-6" />
                    Komponen Lack of Fit Test
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            Error Total
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Variasi yang tidak dapat dijelaskan model</li>
                            <li>• SSE = Σ(yᵢ - ŷᵢ)²</li>
                            <li>• df = n - p</li>
                            <li>• Mengandung random + systematic error</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            Pure Error
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• Variasi murni dalam data</li>
                            <li>• SS_PE = ΣΣ(yᵢⱼ - ȳᵢ)²</li>
                            <li>• df = n - c</li>
                            <li>• Hanya random error</li>
                        </ul>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-bold text-purple-800 mb-2">
                            Lack of Fit
                        </h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                            <li>• Variasi systematic</li>
                            <li>• SS_LOF = SS_Error - SS_PE</li>
                            <li>• df = c - p</li>
                            <li>• Mengukur ketidakcukupan model</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            Replikasi
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Observasi dengan X yang sama</li>
                            <li>• Diperlukan untuk pure error</li>
                            <li>• Minimal 2 observasi per kombinasi</li>
                            <li>• Tanpa replikasi, uji tidak valid</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    Algoritma Lack of Fit Test
                </h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Langkah-langkah dalam calculate_lack_of_fit_tests:
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>1. Fit Model Utama:</strong> Buat matriks
                            desain dan lakukan sweep
                        </li>
                        <li>
                            <strong>2. Hitung Error Total:</strong> SSE = Σ(yᵢ -
                            ŷᵢ)²
                        </li>
                        <li>
                            <strong>3. Kelompokkan Data:</strong> Berdasarkan
                            kombinasi unik X
                        </li>
                        <li>
                            <strong>4. Hitung Pure Error:</strong> SS_PE =
                            ΣΣ(yᵢⱼ - ȳᵢ)²
                        </li>
                        <li>
                            <strong>5. Hitung Lack of Fit:</strong> SS_LOF = SSE
                            - SS_PE
                        </li>
                        <li>
                            <strong>6. Hitung Statistik F:</strong> F = MS_LOF /
                            MS_PE
                        </li>
                        <li>
                            <strong>7. Uji Signifikansi:</strong> Bandingkan
                            dengan F(df_LOF, df_PE)
                        </li>
                    </ol>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <TrendingUp className="h-6 w-6" />
                    Perhitungan Matematika
                </h2>

                <h3>Error Total (SSE)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SSE = Σ(yᵢ - ŷᵢ)²</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>yᵢ</strong> = nilai observasi ke-i
                        </li>
                        <li>
                            <strong>ŷᵢ</strong> = nilai prediksi ke-i
                        </li>
                        <li>
                            <strong>df_error</strong> = n - p (n = jumlah
                            observasi, p = jumlah parameter)
                        </li>
                    </ul>
                </div>

                <h3>Pure Error (SS_PE)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SS_PE = ΣΣ(yᵢⱼ - ȳᵢ)²</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>yᵢⱼ</strong> = observasi ke-j dalam grup
                            ke-i
                        </li>
                        <li>
                            <strong>ȳᵢ</strong> = rata-rata grup ke-i
                        </li>
                        <li>
                            <strong>df_pure_error</strong> = n - c (c = jumlah
                            kombinasi unik X)
                        </li>
                    </ul>
                </div>

                <h3>Lack of Fit (SS_LOF)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SS_LOF = SSE - SS_PE</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>df_lack_of_fit</strong> = c - p
                        </li>
                        <li>
                            <strong>MS_LOF</strong> = SS_LOF / df_lack_of_fit
                        </li>
                        <li>
                            <strong>MS_PE</strong> = SS_PE / df_pure_error
                        </li>
                    </ul>
                </div>

                <h3>Statistik F</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>F = MS_LOF / MS_PE</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>df₁</strong> = df_lack_of_fit = c - p
                        </li>
                        <li>
                            <strong>df₂</strong> = df_pure_error = n - c
                        </li>
                        <li>
                            <strong>F ~ F(df₁, df₂)</strong> di bawah H₀
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Pengelompokan Data</h2>

                <p>
                    Pengelompokan data berdasarkan kombinasi unik dari nilai
                    prediktor adalah langkah kritis dalam lack of fit test.
                    Setiap kombinasi unik X membentuk satu grup.
                </p>

                <h3>Algoritma Pengelompokan</h3>
                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Langkah-langkah pengelompokan:
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>1. Hash Baris X:</strong> Setiap baris X
                            di-hash untuk identifikasi unik
                        </li>
                        <li>
                            <strong>2. Kelompokkan Y:</strong> Y dengan hash X
                            yang sama dikelompokkan
                        </li>
                        <li>
                            <strong>3. Hitung Rata-rata:</strong> ȳᵢ untuk
                            setiap grup
                        </li>
                        <li>
                            <strong>4. Hitung Pure Error:</strong> Deviasi dari
                            rata-rata grup
                        </li>
                    </ol>
                </div>

                <h3>Contoh Pengelompokan</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Contoh data dengan replikasi:
                    </h4>
                    <div className="text-sm text-yellow-700 space-y-2">
                        <div>
                            <strong>Grup 1 (X = [1, 2]):</strong> Y = [10, 12,
                            11] → ȳ₁ = 11
                        </div>
                        <div>
                            <strong>Grup 2 (X = [1, 3]):</strong> Y = [15, 16] →
                            ȳ₂ = 15.5
                        </div>
                        <div>
                            <strong>Grup 3 (X = [2, 2]):</strong> Y = [20, 21,
                            19] → ȳ₃ = 20
                        </div>
                        <div>
                            <strong>SS_PE:</strong> ΣΣ(yᵢⱼ - ȳᵢ)²
                        </div>
                    </div>
                </div>

                <h2 className="mt-8">Effect Size dan Power</h2>

                <h3>Partial Eta Squared</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>η²ₚ = SS_LOF / (SS_LOF + SS_PE)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Effect size untuk lack of fit, menunjukkan proporsi
                        varians dalam error total yang disebabkan oleh
                        ketidakcukupan model
                    </p>
                </div>

                <h3>Noncentrality Parameter</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>λ = df_lack_of_fit × F</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Parameter noncentral untuk perhitungan power
                    </p>
                </div>

                <h3>Observed Power</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            Power = P(F(df₁, df₂, λ) {">"} F_critical)
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Power observasi untuk mendeteksi lack of fit
                    </p>
                </div>

                <h2 className="mt-8">Interpretasi Hasil</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            p-value ≥ 0.05
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• Gagal menolak H₀</li>
                            <li>• Model sudah cukup</li>
                            <li>• Tidak ada lack of fit</li>
                            <li>• Model dapat digunakan</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            p-value {"<"} 0.05
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Menolak H₀</li>
                            <li>• Model tidak cukup</li>
                            <li>• Ada lack of fit</li>
                            <li>• Pertimbangkan model lain</li>
                        </ul>
                    </div>
                </div>

                <h2 className="mt-8">Kondisi Validitas</h2>

                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Uji Lack of Fit memerlukan:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-2">
                        <li>
                            <strong>1. Replikasi:</strong> Minimal 2 observasi
                            dengan X yang sama
                        </li>
                        <li>
                            <strong>2. df_lack_of_fit {">"} 0:</strong> c {">"}{" "}
                            p (jumlah kombinasi {">"} parameter)
                        </li>
                        <li>
                            <strong>3. df_pure_error {">"} 0:</strong> n {">"} c
                            (observasi {">"} kombinasi)
                        </li>
                        <li>
                            <strong>4. MS_PE {">"} 0:</strong> Ada variasi dalam
                            replikasi
                        </li>
                    </ul>
                </div>

                <h3>Kasus Khusus</h3>
                <div className="bg-red-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-red-800 mb-2">
                        Ketika uji tidak valid:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                        <li>• Tidak ada replikasi (c = n)</li>
                        <li>• Model jenuh (p ≥ c)</li>
                        <li>• MS_PE = 0 (tidak ada variasi dalam replikasi)</li>
                        <li>• df_lack_of_fit ≤ 0</li>
                    </ul>
                </div>

                <h2 className="mt-8">Solusi untuk Lack of Fit</h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Ketika Lack of Fit Terdeteksi:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>1. Tambah Prediktor:</strong> Masukkan
                            variabel yang relevan
                        </li>
                        <li>
                            <strong>2. Transformasi:</strong> Transformasi
                            variabel dependen atau prediktor
                        </li>
                        <li>
                            <strong>3. Interaksi:</strong> Tambahkan interaksi
                            antar prediktor
                        </li>
                        <li>
                            <strong>4. Model Non-linear:</strong> Gunakan model
                            polinomial atau non-linear
                        </li>
                        <li>
                            <strong>5. Outlier:</strong> Periksa dan tangani
                            outlier
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">File Terkait</h2>
                <ul>
                    <li>
                        <code>rust/src/stats/lack_of_fit.rs</code> -
                        Implementasi lack of fit tests
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

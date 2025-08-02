import React from "react";
import { HelpContentWrapper } from "../../HelpContentWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    HelpCircle,
    Calculator,
    BarChart3,
    TrendingUp,
    Layers,
} from "lucide-react";

export const EMMeans: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate: Estimated Marginal Means (EM Means)"
            description="Penjelasan lengkap tentang perhitungan Estimated Marginal Means dalam analisis GLM Univariate."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            Estimated Marginal Means (EM Means)
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            EM Means adalah rata-rata yang disesuaikan untuk
                            setiap level faktor, mengontrol efek variabel lain
                            dalam model. Ini memberikan perbandingan yang adil
                            antar kelompok dengan menghilangkan bias dari desain
                            tidak seimbang.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <Calculator className="h-6 w-6" />
                    Konsep Dasar EM Means
                </h2>

                <p>
                    Estimated Marginal Means (EM Means) adalah rata-rata yang
                    diprediksi untuk setiap kombinasi level faktor setelah
                    mengontrol efek variabel lain dalam model. EM Means dihitung
                    sebagai kombinasi linear dari parameter model menggunakan
                    vektor-L.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">Formula Umum EM Means:</h4>
                    <div className="text-center text-lg font-mono">
                        <strong>EM Mean = L' × β̂</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>L'</strong> = transpose dari vektor-L
                            (koefisien kombinasi linear)
                        </li>
                        <li>
                            <strong>β̂</strong> = vektor estimasi parameter dari
                            model
                        </li>
                        <li>
                            <strong>EM Mean</strong> = Estimated Marginal Mean
                            untuk kombinasi level tertentu
                        </li>
                    </ul>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <Layers className="h-6 w-6" />
                    Alur Proses Perhitungan EM Means
                </h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Langkah-langkah dalam calculate_EM Means:
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>1. Persiapan Desain:</strong> Membuat
                            matriks desain, vektor respons, dan bobot
                        </li>
                        <li>
                            <strong>2. Ekstraksi Informasi Model:</strong>{" "}
                            Mendapatkan nama parameter dan mempersiapkan data
                            kovariat
                        </li>
                        <li>
                            <strong>3. Perhitungan Matriks:</strong> Membuat
                            matriks cross-product (Z'Z)
                        </li>
                        <li>
                            <strong>4. Solusi Model:</strong> Melakukan SWEEP
                            untuk mendapatkan β̂, G⁻¹, dan SSE
                        </li>
                        <li>
                            <strong>5. Perhitungan Statistik Dasar:</strong>{" "}
                            Menghitung MSE dan df_error
                        </li>
                        <li>
                            <strong>6. Ekstraksi Faktor:</strong>{" "}
                            Mengidentifikasi semua faktor dan levelnya
                        </li>
                        <li>
                            <strong>7. Iterasi & Perhitungan EM Means:</strong>{" "}
                            Untuk setiap efek yang diminta
                        </li>
                        <li>
                            <strong>8. Agregasi Hasil:</strong> Mengumpulkan
                            semua hasil ke dalam struktur EM MeansResult
                        </li>
                    </ol>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    Konstruksi Vektor-L untuk EM Means
                </h2>

                <p>
                    Vektor-L mendefinisikan cara menghitung satu EM Mean
                    spesifik. Setiap vektor-L memiliki panjang yang sama dengan
                    jumlah parameter model dan menentukan koefisien untuk setiap
                    parameter.
                </p>

                <h3>Aturan Konstruksi Vektor-L</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>Intercept:</strong> Koefisien selalu 1.0
                        </div>
                        <div>
                            <strong>Kovariat:</strong> Koefisien adalah nilai
                            rata-rata kovariat
                        </div>
                        <div>
                            <strong>Faktor yang dispesifikasikan:</strong>{" "}
                            Koefisien 1.0 jika level cocok, 0.0 jika tidak
                        </div>
                        <div>
                            <strong>Faktor yang dirata-ratakan:</strong>{" "}
                            Koefisien adalah 1.0 / jumlah level
                        </div>
                        <div>
                            <strong>Interaksi:</strong> Koefisien adalah produk
                            dari koefisien komponennya
                        </div>
                    </div>
                </div>

                <h3>Contoh Konstruksi Vektor-L</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Untuk EM Mean: gender=Pria, pendidikan=SMA
                    </h4>
                    <div className="text-sm text-yellow-700 space-y-1">
                        <div>• Intercept: 1.0</div>
                        <div>• gender=Pria: 1.0 (level cocok)</div>
                        <div>• gender=Wanita: 0.0 (level tidak cocok)</div>
                        <div>• pendidikan=SMA: 1.0 (level cocok)</div>
                        <div>• pendidikan=S1: 0.0 (level tidak cocok)</div>
                        <div>• kovariat: rata-rata kovariat</div>
                        <div>• interaksi: produk dari koefisien komponen</div>
                    </div>
                </div>

                <h2 className="mt-8">Perhitungan Statistik EM Means</h2>

                <h3>Estimated Marginal Mean (EM Mean)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>EM Mean = L' × β̂</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Nilai rata-rata marginal yang diprediksi untuk kombinasi
                        level tertentu
                    </p>
                </div>

                <h3>Standard Error (SE) dari EM Mean</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SE = √(L' × G⁻¹ × L × MSE)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>G⁻¹</strong> = generalized inverse dari
                            matriks (X'X)
                        </li>
                        <li>
                            <strong>MSE</strong> = Mean Squared Error
                        </li>
                        <li>
                            <strong>SE</strong> = mengukur variabilitas atau
                            ketidakpastian dari estimasi EM Mean
                        </li>
                    </ul>
                </div>

                <h3>Confidence Interval (CI)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>CI = EM Mean ± (t_critical × SE)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>t_critical</strong> = nilai t kritis dari
                            distribusi-t
                        </li>
                        <li>
                            <strong>df</strong> = degrees of freedom error
                        </li>
                        <li>
                            <strong>α</strong> = tingkat signifikansi
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Pairwise Comparisons</h2>

                <p>
                    Perbandingan berpasangan membandingkan EM Means dari setiap
                    pasangan level dalam suatu efek utama untuk mengetahui
                    apakah ada perbedaan yang signifikan.
                </p>

                <h3>Mean Difference</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            Mean Difference = EM Meanᵢ - EM Meanⱼ = (Lᵢ - Lⱼ)' ×
                            β̂
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Selisih estimasi rata-rata antara dua level
                    </p>
                </div>

                <h3>Standard Error of the Difference</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            SE_diff = √((Lᵢ - Lⱼ)' × G⁻¹ × (Lᵢ - Lⱼ) × MSE)
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Mengukur ketidakpastian dari selisih rata-rata
                    </p>
                </div>

                <h3>Significance (p-value)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>
                                t-statistic = Mean Difference / SE_diff
                            </strong>
                        </div>
                        <div>
                            <strong>
                                p-value = P(|t| {">"} t_observed | H₀)
                            </strong>
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Dilakukan penyesuaian untuk perbandingan ganda
                        menggunakan metode Bonferroni, Sidak, atau LSD
                    </p>
                </div>

                <h3>Multiple Comparison Adjustments</h3>
                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Metode Penyesuaian:
                    </h4>
                    <div className="text-sm text-blue-700 space-y-2">
                        <div>
                            <strong>Bonferroni:</strong> α' = α / C (C = jumlah
                            perbandingan)
                        </div>
                        <div>
                            <strong>Sidak:</strong> α' = 1 - (1 - α)^(1/C)
                        </div>
                        <div>
                            <strong>LSD (No adjustment):</strong> α' = α
                        </div>
                    </div>
                </div>

                <h2 className="mt-8">Univariate Tests</h2>

                <p>
                    Uji univariat melakukan uji-F untuk efek utama, menguji
                    hipotesis nol bahwa semua EM Means untuk level-level dari
                    efek tersebut adalah sama.
                </p>

                <h3>Sum of Squares for Hypothesis (SSH)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SSH = (Lβ̂)' × (L × G⁻¹ × L')⁻¹ × (Lβ̂)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        L adalah matriks kontras yang menguji perbedaan antar EM
                        Means
                    </p>
                </div>

                <h3>Mean Square for Hypothesis (MSH)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>MSH = SSH / df_hypothesis</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        df_hypothesis = jumlah level - 1
                    </p>
                </div>

                <h3>F-value</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>F = MSH / MSE</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Statistik uji yang membandingkan variasi antar grup
                        dengan variasi dalam grup
                    </p>
                </div>

                <h3>Partial Eta Squared (η²ₚ)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>η²ₚ = SSH / (SSH + SSE)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Ukuran efek yang menunjukkan proporsi variasi yang dapat
                        dijelaskan oleh efek utama
                    </p>
                </div>

                <h3>Observed Power</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            Power = P(F {">"} F_critical | F ~ F(df₁, df₂, λ))
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>λ</strong> = parameter non-sentralitas = F ×
                            df_hypothesis
                        </li>
                        <li>
                            <strong>F_critical</strong> = nilai F kritis untuk α
                            dan df
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Grand Mean</h2>

                <p>
                    Grand Mean adalah rata-rata keseluruhan yang dihitung dengan
                    merata-ratakan semua efek faktor dan menggunakan rata-rata
                    kovariat.
                </p>

                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Konstruksi Vektor-L untuk Grand Mean:
                    </h4>
                    <div className="text-sm text-yellow-700 space-y-1">
                        <div>• Intercept: 1.0</div>
                        <div>• Kovariat: rata-rata kovariat</div>
                        <div>
                            • Faktor: 1.0 / jumlah level (untuk merata-ratakan)
                        </div>
                        <div>• Interaksi: produk dari koefisien komponen</div>
                    </div>
                </div>

                <h2 className="mt-8">Non-Estimable EM Means</h2>

                <p>
                    EM Mean yang tidak dapat diestimasi terjadi ketika vektor-L
                    berisi semua nol, yang berarti kombinasi level tersebut
                    tidak dapat dihitung secara unik dari data.
                </p>

                <div className="bg-red-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-red-800 mb-2">
                        Kondisi Non-Estimable:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                        <li>
                            • Kombinasi level yang tidak ada dalam data (missing
                            cells)
                        </li>
                        <li>• Desain yang tidak seimbang dengan sel kosong</li>
                        <li>• Model yang overparameterized</li>
                        <li>• Kovariat dengan nilai yang tidak valid</li>
                    </ul>
                </div>

                <h2 className="mt-8">Interpretasi Hasil</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            EM Mean Signifikan
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• CI tidak mengandung 0</li>
                            <li>• SE relatif kecil</li>
                            <li>• Estimasi stabil</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            EM Mean Non-Estimable
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Ditampilkan sebagai NaN</li>
                            <li>• Vektor-L semua nol</li>
                            <li>• Kombinasi level tidak ada dalam data</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            Pairwise Comparison
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• p-value {"<"} 0.05: signifikan</li>
                            <li>• CI tidak mengandung 0</li>
                            <li>• Perbedaan praktis penting</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            Univariate Test
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• F-value {">"} F_critical</li>
                            <li>• p-value {"<"} 0.05</li>
                            <li>• η²ₚ menunjukkan effect size</li>
                        </ul>
                    </div>
                </div>

                <h2 className="mt-8">Aplikasi Praktis</h2>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">
                        Kapan Menggunakan EM Means:
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>
                            • <strong>Desain tidak seimbang:</strong> Ketika
                            jumlah observasi berbeda antar sel
                        </li>
                        <li>
                            • <strong>Model dengan kovariat:</strong> Untuk
                            mengontrol efek variabel kontinu
                        </li>
                        <li>
                            • <strong>Interaksi signifikan:</strong> Untuk
                            memahami efek utama dalam konteks interaksi
                        </li>
                        <li>
                            • <strong>Missing cells:</strong> Ketika beberapa
                            kombinasi level tidak ada dalam data
                        </li>
                        <li>
                            • <strong>Perbandingan adil:</strong> Untuk
                            membandingkan kelompok dengan cara yang fair
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">File Terkait</h2>
                <ul>
                    <li>
                        <code>rust/src/stats/EM Means.rs</code> - Implementasi
                        perhitungan EM Means
                    </li>
                    <li>
                        <code>rust/src/models/result.rs</code> - Struktur hasil
                        EM Means
                    </li>
                    <li>
                        <code>rust/src/stats/core.rs</code> - Fungsi bantu
                        perhitungan
                    </li>
                </ul>
            </div>
        </HelpContentWrapper>
    );
};

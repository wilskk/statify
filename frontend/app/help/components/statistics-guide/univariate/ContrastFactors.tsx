import React from "react";
import { HelpContentWrapper } from "../../HelpContentWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    HelpCircle,
    Calculator,
    BarChart3,
    TrendingUp,
    Layers,
    Target,
} from "lucide-react";

export const ContrastFactors: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate: Contrast Factors"
            description="Penjelasan lengkap tentang contrast factors, metode kontras, dan pengujian hipotesis dalam analisis GLM Univariate."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            Contrast Factors
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Contrast factors memungkinkan pengujian hipotesis
                            spesifik tentang perbedaan antar level faktor.
                            Metode kontras yang berbeda memberikan cara yang
                            berbeda untuk membandingkan level-level dalam
                            faktor.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    Konsep Dasar Contrast Factors
                </h2>

                <p>
                    Contrast factors adalah teknik untuk menguji hipotesis
                    spesifik tentang perbedaan antar level dalam faktor. Kontras
                    memungkinkan kita untuk menguji perbandingan yang bermakna
                    secara teoritis daripada hanya menguji perbedaan umum.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">Model Kontras Umum:</h4>
                    <div className="text-center text-lg font-mono">
                        <strong>ψ = L'β</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>ψ</strong> = nilai kontras
                        </li>
                        <li>
                            <strong>L'</strong> = vektor koefisien kontras
                        </li>
                        <li>
                            <strong>β</strong> = vektor parameter model
                        </li>
                    </ul>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <Calculator className="h-6 w-6" />
                    Metode Kontras
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Deviation
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• Membandingkan level dengan grand mean</li>
                            <li>
                                • Koefisien: 1 untuk level fokus, -1/k untuk
                                lainnya
                            </li>
                            <li>• Referensi: First atau Last</li>
                            <li>• Jumlah kontras: k-1</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">Simple</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>
                                • Membandingkan level dengan level referensi
                            </li>
                            <li>
                                • Koefisien: 1 untuk level fokus, -1 untuk
                                referensi
                            </li>
                            <li>• Referensi: First atau Last</li>
                            <li>• Jumlah kontras: k-1</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            Difference
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• Level_i vs mean level sebelumnya</li>
                            <li>
                                • Koefisien: 1 untuk level_i, -1/i untuk level
                                1..i-1
                            </li>
                            <li>• Tidak memerlukan referensi</li>
                            <li>• Jumlah kontras: k-1</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">Helmert</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Level_i vs mean level berikutnya</li>
                            <li>
                                • Koefisien: 1 untuk level_i, -1/(k-i) untuk
                                level i+1..k
                            </li>
                            <li>• Tidak memerlukan referensi</li>
                            <li>• Jumlah kontras: k-1</li>
                        </ul>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-bold text-purple-800 mb-2">
                            Repeated
                        </h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                            <li>• Level_i vs level_{`i + 1`}</li>
                            <li>
                                • Koefisien: 1 untuk level_i, -1 untuk level_
                                {`i + 1`}
                            </li>
                            <li>• Tidak memerlukan referensi</li>
                            <li>• Jumlah kontras: k-1</li>
                        </ul>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <h4 className="font-bold text-indigo-800 mb-2">
                            Polynomial
                        </h4>
                        <ul className="text-sm text-indigo-700 space-y-1">
                            <li>• Trend linear (hanya degree 1)</li>
                            <li>
                                • Koefisien: nilai terpusat dan ternormalisasi
                            </li>
                            <li>• Tidak memerlukan referensi</li>
                            <li>• Jumlah kontras: 1 (jika k ≥ 2)</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    Konstruksi L-Matrix
                </h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Langkah-langkah dalam
                        generate_l_matrix_and_descriptions:
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>1. Parse Spesifikasi:</strong> Ekstrak nama
                            faktor, metode, dan referensi
                        </li>
                        <li>
                            <strong>2. Tentukan Jumlah Kontras:</strong>{" "}
                            Berdasarkan metode dan jumlah level
                        </li>
                        <li>
                            <strong>3. Inisialisasi Matriks L:</strong> Matriks
                            kosong dengan dimensi yang sesuai
                        </li>
                        <li>
                            <strong>4. Generate Koefisien:</strong> Untuk setiap
                            kontras berdasarkan metode
                        </li>
                        <li>
                            <strong>5. Averaging Logic:</strong> Untuk faktor
                            lain dalam parameter
                        </li>
                        <li>
                            <strong>6. Generate Deskripsi:</strong> Label dan
                            deskripsi untuk setiap kontras
                        </li>
                    </ol>
                </div>

                <h3>Formula Koefisien Kontras</h3>

                <h4>Deviation Contrast</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>Untuk k = 2:</strong>
                        </div>
                        <div>
                            • Level target: 0.5 (jika ref = Last) atau -0.5
                            (jika ref = First)
                        </div>
                        <div>• Level lainnya: -0.5 atau 0.5</div>
                        <div>
                            <strong>Untuk k {">"} 2:</strong>
                        </div>
                        <div>• Level fokus: 1 - 1/k</div>
                        <div>• Level lainnya: -1/k</div>
                    </div>
                </div>

                <h4>Simple Contrast</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>Koefisien:</strong>
                        </div>
                        <div>• Level fokus: 1.0</div>
                        <div>• Level referensi: -1.0</div>
                        <div>• Level lainnya: 0.0</div>
                    </div>
                </div>

                <h4>Difference Contrast</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>Untuk level_{`i + 1`}:</strong>
                        </div>
                        <div>• Level_{`i + 1`}: 1.0</div>
                        <div>• Level 1..i: -1/i</div>
                        <div>• Level i+2..k: 0.0</div>
                    </div>
                </div>

                <h4>Helmert Contrast</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>Untuk level_i:</strong>
                        </div>
                        <div>• Level_i: 1.0</div>
                        <div>• Level i+1..k: -1/(k-i)</div>
                        <div>• Level 1..i-1: 0.0</div>
                    </div>
                </div>

                <h4>Repeated Contrast</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>Untuk level_i vs level_{`i + 1`}:</strong>
                        </div>
                        <div>• Level_i: 1.0</div>
                        <div>• Level_{`i + 1`}: -1.0</div>
                        <div>• Level lainnya: 0.0</div>
                    </div>
                </div>

                <h4>Polynomial Contrast</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>Linear Trend:</strong>
                        </div>
                        <div>• x_i = i - (k-1)/2 (nilai terpusat)</div>
                        <div>• Normalisasi: x_i / √(Σx_i²)</div>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <TrendingUp className="h-6 w-6" />
                    Pengujian Hipotesis Kontras
                </h2>

                <h3>Estimasi Kontras</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>ψ̂ = L'β̂</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Estimasi kontras menggunakan estimasi parameter dari
                        model
                    </p>
                </div>

                <h3>Standard Error</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SE(ψ̂) = √(L'G⁻¹L × MSE)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Standard error kontras menggunakan generalized inverse
                        dan MSE
                    </p>
                </div>

                <h3>Statistik t</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>t = ψ̂ / SE(ψ̂)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Statistik t untuk menguji H₀: ψ = 0
                    </p>
                </div>

                <h3>Confidence Interval</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>CI = ψ̂ ± t_critical × SE(ψ̂)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Confidence interval untuk nilai kontras yang sebenarnya
                    </p>
                </div>

                <h2 className="mt-8">Pengujian F untuk Set Kontras</h2>

                <h3>Sum of Squares Hypothesis (SSH)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SSH = (Lβ̂)'(LG⁻¹L')⁻¹(Lβ̂)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Sum of squares untuk set kontras
                    </p>
                </div>

                <h3>Mean Square Hypothesis (MSH)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>MSH = SSH / df_hypothesis</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Dimana df_hypothesis = jumlah kontras
                    </p>
                </div>

                <h3>Statistik F</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>F = MSH / MSE</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Statistik F untuk menguji signifikansi set kontras
                    </p>
                </div>

                <h2 className="mt-8">Effect Size dan Power</h2>

                <h3>Partial Eta Squared</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>η²ₚ = SSH / (SSH + SSE)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Effect size untuk set kontras
                    </p>
                </div>

                <h3>Noncentrality Parameter</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>λ = F × df_hypothesis</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Parameter noncentral untuk perhitungan power
                    </p>
                </div>

                <h3>Observed Power</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Power = P(F {">"} F_critical | λ)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Power observasi untuk set kontras
                    </p>
                </div>

                <h2 className="mt-8">Implementasi dalam Statify</h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Fungsi-fungsi Utama:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>
                            <strong>parse_contrast_factor_spec:</strong> Parse
                            string spesifikasi kontras
                        </li>
                        <li>
                            <strong>generate_l_matrix_and_descriptions:</strong>{" "}
                            Generate L-matrix dan deskripsi
                        </li>
                        <li>
                            <strong>create_contrast_result:</strong> Hasil
                            pengujian kontras individual
                        </li>
                        <li>
                            <strong>create_contrast_test_result:</strong> Hasil
                            pengujian F untuk set kontras
                        </li>
                        <li>
                            <strong>calculate_contrast_coefficients:</strong>{" "}
                            Fungsi utama untuk semua perhitungan
                        </li>
                    </ul>
                </div>

                <h3>Format Spesifikasi Kontras</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Format: "FactorName (Method, Ref: First/Last)"
                    </h4>
                    <div className="text-sm text-yellow-700 space-y-2">
                        <div>
                            <strong>Contoh:</strong>
                        </div>
                        <div>• "Treatment (Deviation, Ref: Last)"</div>
                        <div>• "Group (Simple, Ref: First)"</div>
                        <div>• "Factor (Helmert)"</div>
                        <div>• "Variable (Polynomial)"</div>
                    </div>
                </div>

                <h3>Struktur Hasil</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">ContrastCoefficients:</h4>
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>information:</strong> Informasi umum tentang
                            kontras
                        </div>
                        <div>
                            <strong>factor_names:</strong> Nama-nama faktor yang
                            dikontras
                        </div>
                        <div>
                            <strong>contrast_coefficients:</strong> Matriks
                            koefisien kontras (L-matrix)
                        </div>
                        <div>
                            <strong>contrast_result:</strong> Hasil pengujian
                            kontras individual
                        </div>
                        <div>
                            <strong>contrast_test_result:</strong> Hasil
                            pengujian F untuk set kontras
                        </div>
                    </div>
                </div>

                <h2 className="mt-8">Aplikasi Praktis</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Kapan Menggunakan Deviation
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>
                                • Ingin membandingkan dengan rata-rata
                                keseluruhan
                            </li>
                            <li>
                                • Level referensi tidak memiliki makna khusus
                            </li>
                            <li>• Fokus pada deviasi dari grand mean</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            Kapan Menggunakan Simple
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Ada level kontrol atau baseline</li>
                            <li>• Ingin membandingkan dengan level tertentu</li>
                            <li>• Level referensi memiliki makna teoritis</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            Kapan Menggunakan Helmert
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• Level memiliki urutan natural</li>
                            <li>
                                • Ingin membandingkan dengan level berikutnya
                            </li>
                            <li>• Cocok untuk variabel ordinal</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            Kapan Menggunakan Polynomial
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Level memiliki urutan numerik</li>
                            <li>• Ingin menguji trend linear</li>
                            <li>• Variabel interval atau rasio</li>
                        </ul>
                    </div>
                </div>

                <h2 className="mt-8">Interpretasi Hasil</h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Tabel Contrast Result:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>
                            <strong>Contrast Estimate:</strong> Nilai estimasi
                            kontras
                        </li>
                        <li>
                            <strong>Standard Error:</strong> Standard error
                            estimasi
                        </li>
                        <li>
                            <strong>Significance:</strong> p-value untuk
                            pengujian t
                        </li>
                        <li>
                            <strong>Confidence Interval:</strong> Interval
                            kepercayaan
                        </li>
                    </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Tabel Contrast Test:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>
                            <strong>Sum of Squares:</strong> SSH untuk set
                            kontras
                        </li>
                        <li>
                            <strong>F Value:</strong> Statistik F untuk set
                            kontras
                        </li>
                        <li>
                            <strong>Significance:</strong> p-value untuk
                            pengujian F
                        </li>
                        <li>
                            <strong>Partial Eta Squared:</strong> Effect size
                        </li>
                        <li>
                            <strong>Observed Power:</strong> Power observasi
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">File Terkait</h2>
                <ul>
                    <li>
                        <code>rust/src/stats/contrast_factors.rs</code> -
                        Implementasi contrast factors
                    </li>
                    <li>
                        <code>rust/src/models/result.rs</code> - Struktur hasil
                        contrast
                    </li>
                    <li>
                        <code>rust/src/models/config.rs</code> - Konfigurasi
                        contrast methods
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

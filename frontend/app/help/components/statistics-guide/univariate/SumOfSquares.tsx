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

export const SumOfSquares: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate: Sum of Squares"
            description="Penjelasan lengkap tentang perhitungan Sum of Squares dalam analisis GLM Univariate."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            Sum of Squares dalam GLM
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Sum of Squares adalah komponen fundamental dalam
                            analisis varians yang mengukur variabilitas dalam
                            data. GLM menggunakan empat tipe SS yang berbeda
                            untuk berbagai tujuan analisis.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <Calculator className="h-6 w-6" />
                    Konsep Dasar Sum of Squares
                </h2>

                <p>
                    Sum of Squares (SS) mengukur total variabilitas dalam data
                    dan dapat dipecah menjadi beberapa komponen. Dalam GLM, SS
                    dihitung menggunakan matriks hipotesis L:
                </p>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">
                        Formula Umum Sum of Squares:
                    </h4>
                    <div className="text-center text-lg font-mono">
                        <strong>
                            SS(H) = (L × β̂)ᵀ × (L × G⁻¹ × Lᵀ)⁻¹ × (L × β̂)
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>L</strong> = matriks hipotesis
                            (menggambarkan hipotesis yang diuji)
                        </li>
                        <li>
                            <strong>β̂</strong> = vektor estimasi parameter
                        </li>
                        <li>
                            <strong>G⁻¹</strong> = generalized inverse dari
                            matriks (X'WX)
                        </li>
                        <li>
                            <strong>SS(H)</strong> = Sum of Squares untuk
                            hipotesis H
                        </li>
                    </ul>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <Layers className="h-6 w-6" />
                    Tipe Sum of Squares
                </h2>

                <p>
                    GLM menggunakan empat tipe Sum of Squares yang berbeda,
                    masing-masing dengan karakteristik dan kegunaan yang
                    spesifik:
                </p>

                <h3>Type I Sum of Squares (Sequential)</h3>
                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Karakteristik Type I SS:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>
                            • <strong>Sekuensial:</strong> Bergantung pada
                            urutan term dalam model
                        </li>
                        <li>
                            • <strong>Hierarkis:</strong> Setiap term dievaluasi
                            setelah term sebelumnya
                        </li>
                        <li>
                            • <strong>Kumulatif:</strong> Efek term sebelumnya
                            dikontrol
                        </li>
                        <li>
                            • <strong>Aplikasi:</strong> Model dengan urutan
                            teoretis yang jelas
                        </li>
                    </ul>
                </div>

                <h4>Konstruksi Matriks L untuk Type I</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>
                                1. Ambil L₀ = submatriks p×p dari Z'WZ
                            </strong>
                        </div>
                        <div>
                            <strong>
                                2. Lakukan SWEEP pada kolom-kolom sebelum term
                                Fⱼ
                            </strong>
                        </div>
                        <div>
                            <strong>
                                3. Nol-kan baris dan kolom untuk efek sebelum Fⱼ
                            </strong>
                        </div>
                        <div>
                            <strong>
                                4. Nol-kan baris untuk efek setelah Fⱼ
                            </strong>
                        </div>
                        <div>
                            <strong>5. Hapus baris yang bernilai nol</strong>
                        </div>
                        <div>
                            <strong>6. Ekstrak basis baris independen</strong>
                        </div>
                    </div>
                </div>

                <h4>Formula Type I SS</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SS₁(Fⱼ) = SS(Fⱼ | F₁, F₂, ..., Fⱼ₋₁)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Sum of Squares untuk term Fⱼ setelah mengontrol efek
                        term F₁ hingga Fⱼ₋₁
                    </p>
                </div>

                <h3>Type II Sum of Squares (Marginal)</h3>
                <div className="bg-green-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-green-800 mb-2">
                        Karakteristik Type II SS:
                    </h4>
                    <ul className="text-sm text-green-700 space-y-1">
                        <li>
                            • <strong>Marginal:</strong> Menguji efek term
                            setelah term lain yang tidak mengandungnya
                        </li>
                        <li>
                            • <strong>Prinsip Marginalitas:</strong> Menghormati
                            hierarki model
                        </li>
                        <li>
                            • <strong>Independen Urutan:</strong> Tidak
                            bergantung pada urutan dalam model
                        </li>
                        <li>
                            • <strong>Aplikasi:</strong> Model tanpa interaksi
                            signifikan
                        </li>
                    </ul>
                </div>

                <h4>Konstruksi Matriks L untuk Type II</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>
                                L = [0 | C × (X₂ᵀ × W^½ × M₁ × W^½ × X₂) | C ×
                                (X₂ᵀ × W^½ × M₁ × W^½ × X₃)]
                            </strong>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                        <ul className="text-sm text-gray-600 mt-1">
                            <li>
                                <strong>X₁:</strong> Kolom untuk efek yang tidak
                                mengandung F
                            </li>
                            <li>
                                <strong>X₂:</strong> Kolom untuk efek F (term of
                                interest)
                            </li>
                            <li>
                                <strong>X₃:</strong> Kolom untuk efek yang
                                mengandung F
                            </li>
                            <li>
                                <strong>M₁:</strong> Matriks proyeksi ortogonal
                                ke ruang kolom X₁
                            </li>
                            <li>
                                <strong>C:</strong> Generalized inverse dari
                                (X₂ᵀ × W^½ × M₁ × W^½ × X₂)
                            </li>
                        </ul>
                    </div>
                </div>

                <h4>Formula Type II SS</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            SS₂(F) = SS(F | semua term yang tidak mengandung F)
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Sum of Squares untuk term F setelah mengontrol semua
                        term yang tidak mengandung F
                    </p>
                </div>

                <h3>Type III Sum of Squares (Partial)</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Karakteristik Type III SS:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>
                            • <strong>Partial:</strong> Menguji efek term
                            setelah SEMUA term lain dalam model
                        </li>
                        <li>
                            • <strong>Equal-Weighted:</strong> Menggunakan
                            rata-rata sel berbobot sama
                        </li>
                        <li>
                            • <strong>Marginal:</strong> Menguji hipotesis
                            marginal
                        </li>
                        <li>
                            • <strong>Aplikasi:</strong> Model dengan interaksi,
                            desain tidak seimbang
                        </li>
                    </ul>
                </div>

                <h4>Konstruksi Matriks L untuk Type III</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>Intercept:</strong> L = rata-rata dari semua
                            parameter berbasis faktor
                        </div>
                        <div>
                            <strong>Kovariat:</strong> L = [0, 0, ..., 1, 0,
                            ...] (1 pada posisi kovariat)
                        </div>
                        <div>
                            <strong>Efek Utama Faktor:</strong> Kontras antar
                            level, dirata-ratakan terhadap level faktor lain
                        </div>
                        <div>
                            <strong>Interaksi:</strong> Produk dari kontras efek
                            utama yang terlibat
                        </div>
                    </div>
                </div>

                <h4>Formula Type III SS</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            SS₃(F) = SS(F | semua term lain dalam model)
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Sum of Squares untuk term F setelah mengontrol semua
                        term lain dalam model
                    </p>
                </div>

                <h3>Type IV Sum of Squares (Balanced)</h3>
                <div className="bg-red-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-red-800 mb-2">
                        Karakteristik Type IV SS:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                        <li>
                            • <strong>Balanced:</strong> Dirancang untuk desain
                            dengan sel kosong
                        </li>
                        <li>
                            • <strong>Distributed:</strong> Kontras
                            didistribusikan secara seimbang di sel yang ada
                        </li>
                        <li>
                            • <strong>Modified Type III:</strong> Modifikasi
                            dari Type III untuk data tidak lengkap
                        </li>
                        <li>
                            • <strong>Aplikasi:</strong> Desain faktorial dengan
                            missing cells
                        </li>
                    </ul>
                </div>

                <h4>Konstruksi Matriks L untuk Type IV</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>1. Mulai dengan matriks L Type III</strong>
                        </div>
                        <div>
                            <strong>
                                2. Identifikasi efek yang mengandung term of
                                interest
                            </strong>
                        </div>
                        <div>
                            <strong>
                                3. Sesuaikan koefisien berdasarkan sel yang ada
                            </strong>
                        </div>
                        <div>
                            <strong>
                                4. Distribusikan kontras secara seimbang
                            </strong>
                        </div>
                        <div>
                            <strong>5. Ekstrak basis baris independen</strong>
                        </div>
                    </div>
                </div>

                <h4>Formula Type IV SS</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            SS₄(F) = SS₃(F) dengan penyesuaian untuk sel kosong
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Sum of Squares Type III yang disesuaikan untuk menangani
                        missing cells
                    </p>
                </div>

                <h2 className="mt-8">Perbandingan Tipe Sum of Squares</h2>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2 text-left">Tipe</th>
                                <th className="border p-2 text-left">
                                    Karakteristik
                                </th>
                                <th className="border p-2 text-left">
                                    Kontrol
                                </th>
                                <th className="border p-2 text-left">
                                    Aplikasi
                                </th>
                                <th className="border p-2 text-left">Urutan</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border p-2 font-bold">Type I</td>
                                <td className="border p-2">Sekuensial</td>
                                <td className="border p-2">Term sebelumnya</td>
                                <td className="border p-2">Model hierarkis</td>
                                <td className="border p-2">Bergantung</td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold">
                                    Type II
                                </td>
                                <td className="border p-2">Marginal</td>
                                <td className="border p-2">
                                    Term yang tidak mengandung F
                                </td>
                                <td className="border p-2">
                                    Model tanpa interaksi
                                </td>
                                <td className="border p-2">Independen</td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold">
                                    Type III
                                </td>
                                <td className="border p-2">Partial</td>
                                <td className="border p-2">Semua term lain</td>
                                <td className="border p-2">
                                    Model dengan interaksi
                                </td>
                                <td className="border p-2">Independen</td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold">
                                    Type IV
                                </td>
                                <td className="border p-2">Balanced</td>
                                <td className="border p-2">Semua term lain</td>
                                <td className="border p-2">
                                    Desain dengan sel kosong
                                </td>
                                <td className="border p-2">Independen</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h3>Algoritma Perhitungan SS</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">
                        Langkah-langkah dalam calculate_ss_for_term:
                    </h4>
                    <ol className="text-sm text-gray-600 space-y-1">
                        <li>1. Validasi dimensi matriks L dan β̂</li>
                        <li>
                            2. Hitung L × β̂ (estimasi kombinasi linier
                            hipotesis)
                        </li>
                        <li>3. Hitung L × G⁻¹ × Lᵀ (matriks kovarians)</li>
                        <li>
                            4. Hitung rank dari matriks kovarians (degrees of
                            freedom)
                        </li>
                        <li>5. Hitung pseudo-inverse dari matriks kovarians</li>
                        <li>6. Hitung SS = (L×β̂)ᵀ × (L×G⁻¹×Lᵀ)⁻¹ × (L×β̂)</li>
                        <li>
                            7. Pastikan SS ≥ 0 (ambil nilai maksimal dengan 0)
                        </li>
                    </ol>
                </div>

                <h2 className="mt-8">Degrees of Freedom</h2>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>df = rank(L × G⁻¹ × Lᵀ)</strong>
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Degrees of freedom untuk setiap tipe SS ditentukan oleh
                        rank dari matriks kovarians hipotesis
                    </p>
                </div>

                <h2 className="mt-8">Mean Squares dan F-Statistics</h2>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>MS = SS / df</strong>
                        </div>
                        <div>
                            <strong>F = MS / MSE</strong>
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Mean Squares dan F-statistics dihitung menggunakan SS
                        dan df yang sesuai
                    </p>
                </div>

                <h2 className="mt-8">Effect Size</h2>

                <h3>Eta Squared (η²)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>η² = SS / SST</strong>
                        </div>
                    </div>
                </div>

                <h3>Partial Eta Squared (η²ₚ)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>η²ₚ = SS / (SS + SSE)</strong>
                        </div>
                    </div>
                </div>

                <h2 className="mt-8">File Terkait</h2>
                <ul>
                    <li>
                        <code>rust/src/stats/sum_of_squares.rs</code> -
                        Implementasi perhitungan SS
                    </li>
                    <li>
                        <code>rust/src/stats/hypothesis_matrix.rs</code> -
                        Konstruksi matriks L
                    </li>
                    <li>
                        <code>rust/src/models/result.rs</code> - Struktur hasil
                        analisis
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

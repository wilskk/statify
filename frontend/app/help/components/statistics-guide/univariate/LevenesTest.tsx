import React from "react";
import { HelpContentWrapper } from "../../HelpContentWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    HelpCircle,
    Calculator,
    BarChart3,
    TrendingUp,
    AlertTriangle,
} from "lucide-react";

export const LevenesTest: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate: Levene's Test"
            description="Penjelasan lengkap tentang uji Levene untuk homogenitas varians dalam analisis GLM Univariate."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            Levene's Test
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Uji Levene digunakan untuk memeriksa apakah varians
                            dari variabel dependen sama di semua kelompok.
                            Asumsi homogenitas varians penting untuk ANOVA.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <Calculator className="h-6 w-6" />
                    Konsep Dasar Levene's Test
                </h2>

                <p>
                    Levene's Test menguji hipotesis nol bahwa varians populasi
                    sama di semua kelompok. Ini adalah asumsi penting untuk
                    analisis parametrik seperti ANOVA.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Hipotesis Nol (H₀)
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• σ₁² = σ₂² = ... = σₖ²</li>
                            <li>• Varians sama di semua kelompok</li>
                            <li>• Asumsi homogenitas terpenuhi</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            Hipotesis Alternatif (H₁)
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• σᵢ² ≠ σⱼ² untuk setidaknya satu pasangan</li>
                            <li>• Varians tidak sama di semua kelompok</li>
                            <li>• Asumsi homogenitas dilanggar</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    Variasi Levene's Test
                </h2>

                <p>
                    Levene's Test memiliki beberapa variasi yang berbeda dalam
                    cara menghitung titik pusat (center) untuk deviasi absolut:
                </p>

                <h3>1. Berdasarkan Rata-rata (Mean)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Zᵢⱼ = |Yᵢⱼ - Ȳᵢ|</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Menggunakan rata-rata sebagai pengganti median
                    </p>
                </div>

                <h3>2. Berdasarkan Median</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Zᵢⱼ = |Yᵢⱼ - Mᵢ|</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Menggunakan median (sama dengan Levene's Test standar)
                    </p>
                </div>

                <h3>3. Berdasarkan Median dengan Adjusted df</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Zᵢⱼ = |Yᵢⱼ - Mᵢ|</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Menggunakan median dengan penyesuaian degrees of freedom
                        (Brown-Forsythe)
                    </p>
                </div>

                <h3>4. Berdasarkan Trimmed Mean</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Zᵢⱼ = |Yᵢⱼ - Ȳᵢ(trimmed)|</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Menggunakan trimmed mean (rata-rata setelah
                        menghilangkan outlier)
                    </p>
                </div>

                <h2 className="mt-8">Langkah-langkah Perhitungan</h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Algoritma Levene's Test:
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>1. Menghitung Median Kelompok</strong>
                            <br />
                            Mᵢ = median dari kelompok ke-i
                        </li>
                        <li>
                            <strong>2. Menghitung Absolute Deviations</strong>
                            <br />
                            Zᵢⱼ = |Yᵢⱼ - Mᵢ|
                        </li>
                        <li>
                            <strong>3. Menghitung Rata-rata Deviations</strong>
                            <br />
                            Z̄ᵢ = rata-rata Zᵢⱼ untuk kelompok ke-i
                        </li>
                        <li>
                            <strong>4. Menghitung Statistik F</strong>
                            <br />F = MSB / MSW untuk Zᵢⱼ
                        </li>
                    </ol>
                </div>

                <h2 className="mt-8">Formula Matematika</h2>

                <h3>Statistik F</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>F = MSB / MSW</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>MSB</strong> = Mean Square Between (antar
                            kelompok)
                        </li>
                        <li>
                            <strong>MSW</strong> = Mean Square Within (dalam
                            kelompok)
                        </li>
                    </ul>
                </div>

                <h3>Sum of Squares</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>SSB = Σnᵢ(Z̄ᵢ - Z̄)²</strong>
                        </div>
                        <div>
                            <strong>SSW = ΣΣ(Zᵢⱼ - Z̄ᵢ)²</strong>
                        </div>
                        <div>
                            <strong>SST = SSB + SSW</strong>
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>nᵢ</strong> = jumlah observasi dalam
                            kelompok ke-i
                        </li>
                        <li>
                            <strong>Z̄ᵢ</strong> = rata-rata deviasi absolut
                            kelompok ke-i
                        </li>
                        <li>
                            <strong>Z̄</strong> = rata-rata deviasi absolut
                            keseluruhan
                        </li>
                        <li>
                            <strong>Zᵢⱼ</strong> = deviasi absolut observasi
                            ke-j dalam kelompok ke-i
                        </li>
                    </ul>
                </div>

                <h3>Degrees of Freedom</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>df₁ = k - 1</strong> (antar kelompok)
                        </div>
                        <div>
                            <strong>df₂ = N - k</strong> (dalam kelompok)
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>k</strong> = jumlah kelompok
                        </li>
                        <li>
                            <strong>N</strong> = total observasi
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Interpretasi Hasil</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            p-value {">"} 0.05
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• Gagal menolak H₀</li>
                            <li>• Varians homogen</li>
                            <li>• ANOVA dapat digunakan</li>
                            <li>• Asumsi terpenuhi</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            p-value {"<"} 0.05
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Menolak H₀</li>
                            <li>• Varians tidak homogen</li>
                            <li>• Pertimbangkan alternatif</li>
                            <li>• Asumsi dilanggar</li>
                        </ul>
                    </div>
                </div>

                <h2 className="mt-8">
                    Alternatif Ketika Varians Tidak Homogen
                </h2>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Solusi untuk Heteroskedastisitas:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-2">
                        <li>
                            <strong>1. Welch's ANOVA:</strong> Tidak memerlukan
                            asumsi homogenitas varians
                        </li>
                        <li>
                            <strong>2. Transformasi Data:</strong> Log, square
                            root, atau transformasi lain
                        </li>
                        <li>
                            <strong>3. Robust Methods:</strong> Menggunakan
                            metode yang tahan terhadap pelanggaran asumsi
                        </li>
                        <li>
                            <strong>4. Non-parametric Tests:</strong>{" "}
                            Kruskal-Wallis atau Mann-Whitney U
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Welch's ANOVA</h2>

                <p>
                    Ketika asumsi homogenitas tidak terpenuhi, Welch's ANOVA
                    dapat digunakan:
                </p>

                <h3>Statistik F Welch</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            F = Σwᵢ(x̄ᵢ - x̄*)² / (k-1) / [1 +
                            2(k-2)Σ(1-wᵢ/W)²/(nᵢ-1)]
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>wᵢ</strong> = nᵢ/sᵢ² (weight untuk kelompok
                            i)
                        </li>
                        <li>
                            <strong>W</strong> = Σwᵢ
                        </li>
                        <li>
                            <strong>x̄*</strong> = Σwᵢx̄ᵢ/W (weighted grand mean)
                        </li>
                    </ul>
                </div>

                <h3>Degrees of Freedom Welch</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            df = (k-1) / [1 + 2(k-2)Σ(1-wᵢ/W)²/(nᵢ-1)]
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana W = Σwᵢ</p>
                </div>

                <h2 className="mt-8">Power Analysis</h2>

                <h3>Faktor yang Mempengaruhi Power</h3>
                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Determinan Power:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>
                            <strong>Sample Size:</strong> Semakin besar n,
                            semakin tinggi power
                        </li>
                        <li>
                            <strong>Effect Size:</strong> Semakin besar
                            perbedaan varians, semakin tinggi power
                        </li>
                        <li>
                            <strong>Number of Groups:</strong> Semakin banyak
                            kelompok, semakin tinggi power
                        </li>
                        <li>
                            <strong>Alpha Level:</strong> Semakin besar α,
                            semakin tinggi power
                        </li>
                    </ul>
                </div>

                <h3>Effect Size</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>ω² = (SSB - (k-1)MSW) / (SST + MSW)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Effect size untuk perbedaan varians antar kelompok
                    </p>
                </div>

                <h2 className="mt-8">Tabel Hasil</h2>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2 text-left">
                                    Function
                                </th>
                                <th className="border p-2 text-left">
                                    Levene Statistic
                                </th>
                                <th className="border p-2 text-left">df1</th>
                                <th className="border p-2 text-left">df2</th>
                                <th className="border p-2 text-left">Sig.</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="text-left p-2">Based on Mean</td>
                                <td className="text-left p-2">F-value</td>
                                <td className="text-left p-2">k-1</td>
                                <td className="text-left p-2">N-k</td>
                                <td className="text-left p-2">p-value</td>
                            </tr>
                            <tr className="border-b">
                                <td className="text-left p-2">
                                    Based on Median
                                </td>
                                <td className="text-left p-2">F-value</td>
                                <td className="text-left p-2">k-1</td>
                                <td className="text-left p-2">N-k</td>
                                <td className="text-left p-2">p-value</td>
                            </tr>
                            <tr className="border-b">
                                <td className="text-left p-2">
                                    Based on Median and with adjusted df
                                </td>
                                <td className="text-left p-2">F-value</td>
                                <td className="text-left p-2">k-1</td>
                                <td className="text-left p-2">adjusted df</td>
                                <td className="text-left p-2">p-value</td>
                            </tr>
                            <tr className="border-b">
                                <td className="text-left p-2">
                                    Based on trimmed mean
                                </td>
                                <td className="text-left p-2">F-value</td>
                                <td className="text-left p-2">k-1</td>
                                <td className="text-left p-2">N-k</td>
                                <td className="text-left p-2">p-value</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h2 className="mt-8">File Terkait</h2>
                <ul>
                    <li>
                        <code>rust/src/wasm/function.rs</code> - Fungsi
                        calculate_levene_test
                    </li>
                    <li>
                        <code>rust/src/stats/core.rs</code> - Implementasi
                        perhitungan Levene's Test
                    </li>
                    <li>
                        <code>rust/src/models/result.rs</code> - Struktur hasil
                        Levene's Test
                    </li>
                    <li>
                        <code>
                            components/Modals/Analyze/general-linear-model/univariate/dialogs/
                        </code>
                    </li>
                </ul>
            </div>
        </HelpContentWrapper>
    );
};

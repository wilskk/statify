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

export const ParameterEstimates: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate: Parameter Estimates"
            description="Penjelasan lengkap tentang estimasi parameter dalam analisis GLM Univariate."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            Parameter Estimates
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Estimasi parameter memberikan koefisien untuk setiap
                            prediktor dalam model, menunjukkan hubungan antara
                            prediktor dan variabel dependen.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <Calculator className="h-6 w-6" />
                    Konsep Dasar Parameter Estimates
                </h2>

                <p>
                    Parameter estimates adalah koefisien yang diperoleh dari
                    model GLM yang menunjukkan:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Komponen Parameter
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• Intercept (β₀)</li>
                            <li>• Koefisien faktor (αᵢ, βⱼ)</li>
                            <li>• Koefisien kovariat (γ)</li>
                            <li>• Koefisien interaksi (αβᵢⱼ)</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            Interpretasi
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Besarnya efek prediktor</li>
                            <li>• Arah hubungan</li>
                            <li>• Signifikansi statistik</li>
                            <li>• Standard error</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    Model Matematika
                </h2>

                <h3>Model GLM Umum</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Y = Xβ + ε</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>Y = vektor variabel dependen (n × 1)</li>
                        <li>X = matriks desain (n × p)</li>
                        <li>β = vektor parameter (p × 1)</li>
                        <li>ε = vektor error (n × 1)</li>
                    </ul>
                </div>

                <h3>Estimasi Parameter dengan OLS</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>β̂ = (X'X)⁻¹X'y</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Estimator least squares untuk parameter β
                    </p>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <TrendingUp className="h-6 w-6" />
                    Komponen Parameter
                </h2>

                <h3>Intercept (β₀)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>β₀ = ȳ - Σβᵢx̄ᵢ</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Nilai prediksi Y ketika semua prediktor = 0
                    </p>
                </div>

                <h3>Koefisien Faktor (αᵢ, βⱼ)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>αᵢ = μᵢ - μ</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>μᵢ = rata-rata untuk level ke-i</li>
                        <li>μ = rata-rata keseluruhan</li>
                    </ul>
                </div>

                <h3>Koefisien Kovariat (γ)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>γ = Cov(Y,X) / Var(X)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Perubahan Y per unit perubahan X
                    </p>
                </div>

                <h3>Koefisien Interaksi (αβᵢⱼ)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>(αβ)ᵢⱼ = μᵢⱼ - μᵢ. - μ.ⱼ + μ..</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Efek interaksi antara faktor A level i dan faktor B
                        level j
                    </p>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <Layers className="h-6 w-6" />
                    Standard Errors dan Inferensi
                </h2>

                <h3>Covariance Matrix</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Var(β̂) = σ²(X'X)⁻¹</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Dimana σ² = MSE (Mean Square Error)
                    </p>
                </div>

                <h3>Standard Error</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SE(β̂ᵢ) = √[MSE × Cᵢᵢ]</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Dimana Cᵢᵢ adalah elemen diagonal ke-i dari (X'X)⁻¹
                    </p>
                </div>

                <h3>t-Statistic</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>t = β̂ᵢ / SE(β̂ᵢ)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Mengikuti distribusi t dengan df = n-p-1
                    </p>
                </div>

                <h3>Confidence Interval</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>CI = β̂ᵢ ± t₍α/2,df₎ × SE(β̂ᵢ)</strong>
                    </div>
                </div>

                <h2 className="mt-8">Interpretasi Parameter</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            Koefisien Positif
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• Peningkatan prediktor → peningkatan Y</li>
                            <li>• Efek positif pada variabel dependen</li>
                            <li>• Hubungan searah</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            Koefisien Negatif
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Peningkatan prediktor → penurunan Y</li>
                            <li>• Efek negatif pada variabel dependen</li>
                            <li>• Hubungan berlawanan arah</li>
                        </ul>
                    </div>
                </div>

                <h3>Interpretasi Koefisien Faktor</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <p className="text-sm text-gray-600">
                        Untuk faktor dengan k level:
                    </p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>• Level 1: baseline (tidak ada koefisien)</li>
                        <li>
                            • Level i: koefisien αᵢ menunjukkan perbedaan dari
                            baseline
                        </li>
                        <li>• Interpretasi: Y untuk level i = baseline + αᵢ</li>
                    </ul>
                </div>

                <h3>Interpretasi Koefisien Kovariat</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <p className="text-sm text-gray-600">
                        Untuk kovariat kontinu:
                    </p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            • Koefisien γ menunjukkan perubahan Y per unit
                            perubahan X
                        </li>
                        <li>
                            • Interpretasi: peningkatan 1 unit X → peningkatan γ
                            unit Y
                        </li>
                        <li>• Mengontrol efek variabel lain dalam model</li>
                    </ul>
                </div>

                <h2 className="mt-8">Output Parameter Estimates</h2>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">
                        Tabel Parameter Estimates:
                    </h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Parameter</th>
                                    <th className="text-left p-2">Estimate</th>
                                    <th className="text-left p-2">
                                        Std. Error
                                    </th>
                                    <th className="text-left p-2">t-value</th>
                                    <th className="text-left p-2">p-value</th>
                                    <th className="text-left p-2">95% CI</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b">
                                    <td className="p-2">Intercept</td>
                                    <td className="p-2">β̂₀</td>
                                    <td className="p-2">SE(β̂₀)</td>
                                    <td className="p-2">t₀</td>
                                    <td className="p-2">p₀</td>
                                    <td className="p-2">[L₀, U₀]</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="p-2">Factor A[1]</td>
                                    <td className="p-2">α̂₁</td>
                                    <td className="p-2">SE(α̂₁)</td>
                                    <td className="p-2">t₁</td>
                                    <td className="p-2">p₁</td>
                                    <td className="p-2">[L₁, U₁]</td>
                                </tr>
                                <tr>
                                    <td className="p-2">Covariate</td>
                                    <td className="p-2">γ̂</td>
                                    <td className="p-2">SE(γ̂)</td>
                                    <td className="p-2">tᵧ</td>
                                    <td className="p-2">pᵧ</td>
                                    <td className="p-2">[Lᵧ, Uᵧ]</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <h2 className="mt-8">File Terkait</h2>
                <ul>
                    <li>
                        <code>rust/src/wasm/function.rs</code> - Fungsi
                        calculate_parameter_estimates
                    </li>
                    <li>
                        <code>rust/src/stats/core.rs</code> - Implementasi
                        perhitungan parameter
                    </li>
                    <li>
                        <code>rust/src/models/result.rs</code> - Struktur hasil
                        parameter estimates
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

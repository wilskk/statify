import React from "react";
import { HelpContentWrapper } from "../../HelpContentWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    HelpCircle,
    Calculator,
    TrendingUp,
    BarChart3,
    Layers,
} from "lucide-react";

export const UnivariateGuide: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate"
            description="Analisis General Linear Model (GLM) Univariate untuk regresi, ANOVA, dan ANCOVA dengan rumus matematika lengkap."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            Ringkasan GLM Univariate
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            GLM Univariate adalah framework statistik yang
                            menyatukan regresi, ANOVA, dan ANCOVA dalam satu
                            model matematika yang komprehensif.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <Calculator className="h-6 w-6" />
                    Model Matematika Umum GLM
                </h2>

                <p>GLM Univariate menggunakan model linear umum:</p>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">Model GLM Univariate:</h4>
                    <div className="text-center text-lg font-mono">
                        <strong>Y = Xβ + ε</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>Y</strong> = vektor variabel dependen (n ×
                            1)
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

                <p>
                    Dengan asumsi: <strong>ε ~ N(0, σ²I)</strong>
                </p>

                <h2 className="flex items-center gap-2 mt-8">
                    <TrendingUp className="h-6 w-6" />
                    Analisis Regresi
                </h2>

                <p>
                    Regresi linear memodelkan hubungan antara variabel dependen
                    kontinu dengan satu atau lebih variabel independen.
                </p>

                <h3>Regresi Linear Sederhana</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Y = β₀ + β₁X + ε</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Estimasi parameter:
                    </p>
                    <div className="text-sm font-mono">
                        <div>β₁ = Σ(xᵢ - x̄)(yᵢ - ȳ) / Σ(xᵢ - x̄)²</div>
                        <div>β₀ = ȳ - β₁x̄</div>
                    </div>
                </div>

                <h3>Regresi Linear Berganda</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Y = β₀ + β₁X₁ + β₂X₂ + ... + βₖXₖ + ε</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Estimasi dengan OLS:
                    </p>
                    <div className="text-sm font-mono">
                        <div>
                            <strong>β̂ = (X'X)⁻¹X'y</strong>
                        </div>
                    </div>
                </div>

                <h3>Koefisien Determinasi (R²)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>R² = 1 - (SSE/SST)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>SSE = Σ(yᵢ - ŷᵢ)² (Sum of Squares Error)</li>
                        <li>SST = Σ(yᵢ - ȳ)² (Total Sum of Squares)</li>
                    </ul>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    Analisis Varians (ANOVA)
                </h2>

                <p>
                    ANOVA digunakan untuk membandingkan rata-rata dari tiga atau
                    lebih kelompok dengan menguji hipotesis nol bahwa semua
                    rata-rata populasi sama.
                </p>

                <h3>ANOVA Satu Arah (One-Way ANOVA)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Yᵢⱼ = μ + αᵢ + εᵢⱼ</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>Yᵢⱼ = observasi ke-j dalam kelompok ke-i</li>
                        <li>μ = rata-rata keseluruhan</li>
                        <li>αᵢ = efek kelompok ke-i</li>
                        <li>εᵢⱼ = error random</li>
                    </ul>
                </div>

                <h4>Statistik F untuk One-Way ANOVA:</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>F = MSB / MSW</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>MSB = SSB / (k-1) (Mean Square Between)</li>
                        <li>MSW = SSW / (N-k) (Mean Square Within)</li>
                        <li>SSB = Σnᵢ(x̄ᵢ - x̄)² (Sum of Squares Between)</li>
                        <li>SSW = ΣΣ(xᵢⱼ - x̄ᵢ)² (Sum of Squares Within)</li>
                    </ul>
                </div>

                <h3>ANOVA Dua Arah (Two-Way ANOVA)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Yᵢⱼₖ = μ + αᵢ + βⱼ + (αβ)ᵢⱼ + εᵢⱼₖ</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>αᵢ = efek faktor A level ke-i</li>
                        <li>βⱼ = efek faktor B level ke-j</li>
                        <li>(αβ)ᵢⱼ = efek interaksi</li>
                    </ul>
                </div>

                <h4>Sum of Squares untuk Two-Way ANOVA:</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>SSA = bnΣ(x̄ᵢ.. - x̄...)²</strong>
                        </div>
                        <div>
                            <strong>SSB = anΣ(x̄.ⱼ. - x̄...)²</strong>
                        </div>
                        <div>
                            <strong>
                                SSAB = nΣ(x̄ᵢⱼ. - x̄ᵢ.. - x̄.ⱼ. + x̄...)²
                            </strong>
                        </div>
                        <div>
                            <strong>SSE = ΣΣΣ(xᵢⱼₖ - x̄ᵢⱼ.)²</strong>
                        </div>
                        <div>
                            <strong>SST = ΣΣΣ(xᵢⱼₖ - x̄...)²</strong>
                        </div>
                    </div>
                </div>

                <h3>ANOVA N-Arah (N-Way ANOVA)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            Y = μ + Σαᵢ + Σ(αβ)ᵢⱼ + Σ(αβγ)ᵢⱼₖ + ... + ε
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Model ini mencakup:
                    </p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>Efek utama untuk setiap faktor</li>
                        <li>Efek interaksi dua arah</li>
                        <li>Efek interaksi tiga arah</li>
                        <li>Dan seterusnya hingga interaksi N-arah</li>
                    </ul>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <Layers className="h-6 w-6" />
                    Analisis Kovarians (ANCOVA)
                </h2>

                <p>
                    ANCOVA menggabungkan ANOVA dengan regresi untuk mengontrol
                    efek variabel kovariat yang tidak dapat dimanipulasi.
                </p>

                <h3>Model ANCOVA Satu Arah</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Yᵢⱼ = μ + αᵢ + β(Xᵢⱼ - X̄) + εᵢⱼ</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>Yᵢⱼ = variabel dependen</li>
                        <li>Xᵢⱼ = kovariat</li>
                        <li>αᵢ = efek kelompok</li>
                        <li>β = koefisien regresi kovariat</li>
                    </ul>
                </div>

                <h3>Model ANCOVA Dua Arah</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            Yᵢⱼₖ = μ + αᵢ + βⱼ + (αβ)ᵢⱼ + γ(Xᵢⱼₖ - X̄) + εᵢⱼₖ
                        </strong>
                    </div>
                </div>

                <h3>Adjusted Means dalam ANCOVA</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Ȳᵢ(adj) = Ȳᵢ - b(X̄ᵢ - X̄)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            Ȳᵢ(adj) = rata-rata yang disesuaikan untuk kelompok
                            i
                        </li>
                        <li>Ȳᵢ = rata-rata observasi kelompok i</li>
                        <li>b = koefisien regresi kovariat</li>
                        <li>X̄ᵢ = rata-rata kovariat kelompok i</li>
                        <li>X̄ = rata-rata kovariat keseluruhan</li>
                    </ul>
                </div>

                <h2 className="mt-8">Asumsi GLM Univariate</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            1. Normalitas
                        </h4>
                        <p className="text-sm text-yellow-700">
                            Residual harus berdistribusi normal:{" "}
                            <strong>ε ~ N(0, σ²)</strong>
                        </p>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            2. Homoskedastisitas
                        </h4>
                        <p className="text-sm text-yellow-700">
                            Varians residual konstan:{" "}
                            <strong>Var(εᵢ) = σ²</strong>
                        </p>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            3. Independensi
                        </h4>
                        <p className="text-sm text-yellow-700">
                            Residual saling independen:{" "}
                            <strong>Cov(εᵢ, εⱼ) = 0</strong>
                        </p>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            4. Linearitas
                        </h4>
                        <p className="text-sm text-yellow-700">
                            Hubungan linear antara variabel:{" "}
                            <strong>E(Y) = Xβ</strong>
                        </p>
                    </div>
                </div>

                <h2 className="mt-8">Uji Hipotesis</h2>

                <h3>Uji F untuk Signifikansi Model</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>F = (SSR/p) / (SSE/(n-p-1))</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>SSR = Sum of Squares Regression</li>
                        <li>SSE = Sum of Squares Error</li>
                        <li>p = jumlah parameter (tidak termasuk intercept)</li>
                        <li>n = jumlah observasi</li>
                    </ul>
                </div>

                <h3>Uji t untuk Koefisien Individual</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>t = β̂ᵢ / SE(β̂ᵢ)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>SE(β̂ᵢ) = √(MSE × Cᵢᵢ)</li>
                        <li>Cᵢᵢ = elemen diagonal ke-i dari (X'X)⁻¹</li>
                    </ul>
                </div>

                <h2 className="mt-8">Effect Size</h2>

                <h3>Eta Squared (η²)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>η² = SSB / SST</strong>
                    </div>
                </div>

                <h3>Partial Eta Squared (η²ₚ)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>η²ₚ = SSB / (SSB + SSE)</strong>
                    </div>
                </div>

                <h2 className="mt-8">Power Analysis</h2>

                <h3>Power untuk ANOVA</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            Power = P(F {">"} F₍α,k-1,N-k₎ | F ~ F₍k-1,N-k,λ₎)
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Dimana:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            λ = n × Σ(μᵢ - μ)² / σ² (noncentrality parameter)
                        </li>
                        <li>F₍α,k-1,N-k₎ = critical value F</li>
                    </ul>
                </div>

                <h2 className="mt-8">File Terkait</h2>
                <ul>
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

import React from "react";
import { HelpGuideTemplate } from "../../ui/HelpGuideTemplate";
import { HelpCard, HelpAlert } from "../../ui/HelpLayout";
import {
    BarChart3,
    Calculator,
    Search,
    Grid3X3,
    BookOpen,
    TrendingUp,
} from "lucide-react";
import { Crosstabs } from "./crosstabs";
import { DescriptiveAnalysis } from "./descriptive/DescriptiveAnalysis";
import { Explore } from "./explore";
import { Frequencies } from "./frequencies";
import { UnivariateGuide } from "./univariate/UnivariateGuide";
import { KMeansClustering } from "./k-means/KMeansClustering";
import {
    SumOfSquares,
    EMMeans,
    ParameterEstimates,
    LevenesTest,
    DesignMatrix,
    ContrastFactors,
    HeteroscedasticityTests,
    LackOfFitTests,
} from "./univariate";

type StatisticsGuideProps = {
    section?: string;
};

export const StatisticsGuide: React.FC<StatisticsGuideProps> = ({
    section,
}) => {
    const renderContent = () => {
        // When no specific sub-section is provided, default to Frequencies guide
        if (!section) {
            return <Frequencies />;
        }

        switch (section) {
            case "frequencies":
                return <Frequencies />;
            case "descriptives":
                return <DescriptiveAnalysis />;
            case "explore":
                return <Explore />;
            case "crosstabs":
                return <Crosstabs />;
            case "univariate":
                return <UnivariateGuide />;
            case "univariate-sum-of-squares":
                return <SumOfSquares />;
            case "univariate-em-means":
                return <EMMeans />;
            case "univariate-parameter-estimates":
                return <ParameterEstimates />;
            case "univariate-levenes-test":
                return <LevenesTest />;
            case "univariate-design-matrix":
                return <DesignMatrix />;
            case "univariate-contrast-factors":
                return <ContrastFactors />;
            case "univariate-heteroscedasticity-tests":
                return <HeteroscedasticityTests />;
            case "univariate-lack-of-fit-tests":
                return <LackOfFitTests />;
            case "k-means-clustering":
                return <KMeansClustering />;
            default:
                return (
                    <HelpGuideTemplate
                        title="Statistics Guide"
                        description="Panduan lengkap untuk analisis statistik dalam Statify"
                        category="Statistics"
                        lastUpdated="2024-01-15"
                        sections={[
                            {
                                id: "overview",
                                title: "Gambaran Umum",
                                description:
                                    "Pilih topik dari sidebar untuk melihat panduan analisis statistik spesifik",
                                icon: BookOpen,
                                content: (
                                    <div className="space-y-6">
                                        <HelpAlert
                                            variant="info"
                                            title="Panduan Analisis Statistik"
                                        >
                                            <p className="text-sm mt-2">
                                                Pilih salah satu topik dari
                                                sidebar untuk melihat panduan
                                                detail tentang berbagai jenis
                                                analisis statistik yang
                                                tersedia.
                                            </p>
                                        </HelpAlert>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <HelpCard
                                                title="Frequencies"
                                                icon={BarChart3}
                                                variant="feature"
                                            >
                                                <p className="text-sm text-muted-foreground">
                                                    Analisis distribusi
                                                    frekuensi untuk memahami
                                                    pola data kategorikal dan
                                                    numerik.
                                                </p>
                                            </HelpCard>

                                            <HelpCard
                                                title="Descriptives"
                                                icon={Calculator}
                                                variant="feature"
                                            >
                                                <p className="text-sm text-muted-foreground">
                                                    Statistik deskriptif seperti
                                                    mean, median, standar
                                                    deviasi, dan ukuran sebaran
                                                    lainnya.
                                                </p>
                                            </HelpCard>

                                            <HelpCard
                                                title="Explore"
                                                icon={Search}
                                                variant="feature"
                                            >
                                                <p className="text-sm text-muted-foreground">
                                                    Eksplorasi data mendalam
                                                    dengan deteksi outlier dan
                                                    analisis distribusi.
                                                </p>
                                            </HelpCard>

                                            <HelpCard
                                                title="Crosstabs"
                                                icon={Grid3X3}
                                                variant="feature"
                                            >
                                                <p className="text-sm text-muted-foreground">
                                                    Analisis tabulasi silang
                                                    untuk melihat hubungan antar
                                                    variabel kategorikal.
                                                </p>
                                            </HelpCard>
                                        </div>
                                    </div>
                                ),
                            },
                        ]}
                        quickActions={[
                            {
                                label: "Frequencies",
                                onClick: () =>
                                    console.log("Navigate to frequencies"),
                                variant: "default" as const,
                                icon: BarChart3,
                            },
                            {
                                label: "Descriptives",
                                onClick: () =>
                                    console.log("Navigate to descriptives"),
                                variant: "outline" as const,
                                icon: Calculator,
                            },
                        ]}
                        tips={[
                            {
                                type: "tip" as const,
                                title: "Pemilihan Analisis",
                                content:
                                    "Pilih jenis analisis berdasarkan tipe data dan tujuan penelitian Anda.",
                            },
                            {
                                type: "info" as const,
                                title: "Interpretasi Hasil",
                                content:
                                    "Selalu perhatikan asumsi statistik dan konteks data saat menginterpretasi hasil.",
                            },
                        ]}
                        relatedTopics={[
                            {
                                title: "Data Management",
                                href: "/help/data-guide",
                            },
                            {
                                title: "File Management",
                                href: "/help/file-guide",
                            },
                            {
                                title: "Getting Started",
                                href: "/help/getting-started",
                            },
                            { title: "FAQ", href: "/help/faq" },
                        ]}
                    />
                );
        }
    };

    return renderContent();
};

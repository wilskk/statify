import { transformDiscriminantResult } from "@/components/Modals/Analyze/Classify/discriminant/services/formatter";
import { useResultStore } from "@/stores/useResultStore";
import type { Table } from "@/types/Table";

export async function saveDiscriminantResult(rawResults: unknown) {
    const formattedResult = transformDiscriminantResult(rawResults);
    const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

    const findTable = (key: string) => {
        const foundTable = formattedResult.tables.find(
            (table: Table) => table.key === key
        );
        return foundTable ? JSON.stringify({ tables: [foundTable] }) : null;
    };

    const titleMessage = "Discriminant Analysis";
    const logId = await addLog({ log: titleMessage });
    const analyticId = await addAnalytic(logId, {
        title: `Discriminant Analysis Result`,
        note: "",
    });

    const sections = [
        { key: "processing_summary", title: "Analysis Case Processing Summary" },
        { key: "classification_processing_summary", title: "Classification Processing Summary" },
        { key: "group_statistics", title: "Group Statistics" },
        { key: "equality_tests", title: "Tests of Equality of Group Means" },
        { key: "pooled_covariance_matrix", title: "Pooled Within-Groups Covariance Matrix" },
        { key: "pooled_correlation_matrix", title: "Pooled Within-Groups Correlation Matrix" },
        { key: "covariance_matrices", title: "Covariance Matrices" },
        { key: "log_determinants", title: "Log Determinants" },
        { key: "box_m_test", title: "Box's M Test Results" },
        { key: "prior_probabilities", title: "Prior Probabilities for Groups" },
        { key: "classification_function_coefficients", title: "Classification Function Coefficients" },
        { key: "canonical_discriminant_function_coefficients", title: "Canonical Discriminant Function Coefficients" },
        { key: "standardized_coefficients", title: "Standardized Canonical Discriminant Function Coefficients" },
        { key: "functions_at_group_centroids", title: "Functions at Group Centroids" },
        { key: "structure_matrix", title: "Structure Matrix" },
        { key: "stepwise_statistics", title: "Stepwise Statistics" },
        { key: "variables_in_analysis", title: "Variables in the Analysis" },
        { key: "variables_not_in_analysis", title: "Variables Not in the Analysis" },
        { key: "stepwise_wilks_lambda", title: "Wilks' Lambda" },
        { key: "wilks_lambda_test", title: "Wilks' Lambda Test" },
        { key: "eigenvalues", title: "Eigenvalues" },
        { key: "casewise_statistics", title: "Casewise Statistics" },
        { key: "classification_results", title: "Classification Results" },
        {
            key: "bootstrap_standardized_coefficients",
            title: "Bootstrap for Standardized Canonical Discriminant Function Coefficients",
        },
    ];

    for (const section of sections) {
        const data = findTable(section.key);
        if (data) {
            const sectionId = await addAnalytic(logId, {
                title: section.title,
                note: "",
            });
            await addStatistic(sectionId, {
                title: section.title,
                description: section.title,
                output_data: data,
                components: section.title,
            });
        }
    }

    // ── Scatter plots (Combined-Groups + Separate-Groups) ──────────────────
    const scatterCharts = formattedResult.charts ?? [];

    const combinedChart = scatterCharts.find(
        (c: any) => c.chartMetadata?.description === "Combined-Groups Plot"
    );
    if (combinedChart) {
        const sectionId = await addAnalytic(logId, {
            title: "Combined-Groups Plot",
            note: "",
        });
        await addStatistic(sectionId, {
            title: "Combined-Groups Plot",
            description: "Combined-Groups Plot",
            output_data: JSON.stringify({ charts: [combinedChart] }),
            components: "Combined-Groups Plot",
        });
    }

    const separateCharts = scatterCharts.filter(
        (c: any) => (c.chartMetadata?.description as string)?.startsWith("Separate-Groups Plot:")
    );
    if (separateCharts.length > 0) {
        const sectionId = await addAnalytic(logId, {
            title: "Separate-Groups Plots",
            note: "",
        });
        await addStatistic(sectionId, {
            title: "Separate-Groups Plots",
            description: "Separate-Groups Plots",
            output_data: JSON.stringify({ charts: separateCharts }),
            components: "Separate-Groups Plots",
        });
    }
}
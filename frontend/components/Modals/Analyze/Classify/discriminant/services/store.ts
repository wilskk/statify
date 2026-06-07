import { transformDiscriminantResult } from "@/components/Modals/Analyze/Classify/discriminant/services/formatter";
import { useResultStore } from "@/stores/useResultStore";
import type { Table } from "@/types/Table";

export async function saveDiscriminantResult(rawResults: unknown) {
    const formattedResult = transformDiscriminantResult(rawResults);
    const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

    const titleMessage = "Discriminant Analysis";
    const logId = await addLog({ log: titleMessage });
    await addAnalytic(logId, {
        title: `Discriminant Analysis Result`,
        note: "",
    });

    // For these assumption-check tables the interpretation note (the table
    // footer) is surfaced as the section "Description" instead — and stripped
    // from the table so it is not shown twice.
    const ASSUMPTION_KEYS = new Set([
        "assumption_summary",
        "assumption_multicollinearity",
        "assumption_multivariate_normality",
        "assumption_univariate_normality",
        "box_m_test",
    ]);

    const renderSection = async (key: string, title: string) => {
        const tableObj = formattedResult.tables.find(
            (t: Table) => t.key === key
        );
        if (!tableObj) return;

        let description = title;
        let outputTable: Table = tableObj;
        const footer = (tableObj as Table & { footer?: string }).footer;
        if (ASSUMPTION_KEYS.has(key) && typeof footer === "string" && footer.length > 0) {
            description = footer;
            const { footer: _omit, ...rest } = tableObj as Table & { footer?: string };
            outputTable = rest as Table;
        }

        const sectionId = await addAnalytic(logId, { title, note: "" });
        await addStatistic(sectionId, {
            title,
            description,
            output_data: JSON.stringify({ tables: [outputTable] }),
            components: title,
        });
    };

    // Output order follows the actual workflow of a discriminant analysis so the
    // reader can follow each step from assumptions → data → model → classification.
    const sections = [
        // ── Assumption checks (run first, before fitting anything) ──
        // Order: multicollinearity → multivariate normality → univariate
        // normality → homogeneity of covariance (Log Determinants feed Box's M).
        { key: "assumption_summary", title: "Assumption Checks Summary" },
        { key: "assumption_multicollinearity", title: "Multicollinearity (Tolerance and VIF)" },
        { key: "assumption_multivariate_normality", title: "Multivariate Normality (Henze-Zirkler Test)" },
        { key: "assumption_univariate_normality", title: "Univariate Normality (Anderson-Darling)" },
        { key: "log_determinants", title: "Log Determinants" },
        { key: "box_m_test", title: "Box's M Test Results" },

        // ── 1. Data & group description ──
        { key: "processing_summary", title: "Analysis Case Processing Summary" },
        { key: "group_statistics", title: "Group Statistics" },
        { key: "equality_tests", title: "Tests of Equality of Group Means" },

        // ── 2. Within-groups covariance structure ──
        { key: "pooled_covariance_matrix", title: "Pooled Within-Groups Covariance Matrix" },
        { key: "pooled_correlation_matrix", title: "Pooled Within-Groups Correlation Matrix" },
        { key: "covariance_matrices", title: "Covariance Matrices" },

        // ── 3. Stepwise variable selection (stepwise method only) ──
        { key: "stepwise_statistics", title: "Variables Entered/Removed" },
        { key: "variables_in_analysis", title: "Variables in the Analysis" },
        { key: "variables_not_in_analysis", title: "Variables Not in the Analysis" },
        { key: "stepwise_wilks_lambda", title: "Wilks' Lambda (Stepwise)" },

        // ── 4. Discriminant functions (the fitted model) ──
        { key: "eigenvalues", title: "Eigenvalues" },
        { key: "wilks_lambda_test", title: "Wilks' Lambda Test" },

        // ── 5. Function coefficients & interpretation ──
        { key: "standardized_coefficients", title: "Standardized Canonical Discriminant Function Coefficients" },
        { key: "structure_matrix", title: "Structure Matrix" },
        { key: "canonical_discriminant_function_coefficients", title: "Canonical Discriminant Function Coefficients" },
        { key: "functions_at_group_centroids", title: "Functions at Group Centroids" },

        // ── 6. Classification ──
        { key: "prior_probabilities", title: "Prior Probabilities for Groups" },
        { key: "classification_function_coefficients", title: "Classification Function Coefficients" },
        { key: "classification_processing_summary", title: "Classification Processing Summary" },
        { key: "casewise_statistics", title: "Casewise Statistics" },
        { key: "classification_results", title: "Classification Results" },
    ];

    for (const section of sections) {
        await renderSection(section.key, section.title);
    }

    // ── 7. Discriminant-space plots (visualize the fitted functions) ──
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

    // ── 8. Bootstrap robustness check (enter-together method only) — rendered
    // last as an optional add-on to the fitted model. ──
    await renderSection(
        "bootstrap_standardized_coefficients",
        "Bootstrap for Standardized Canonical Discriminant Function Coefficients"
    );
}
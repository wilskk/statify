// Ini file Service Layer utama yang bertugas sebagai orkestrator atau jembatan antara Frontend Next.js dan logika Rust WASM
// Refactored to use the same data processing pattern as Linear Regression

import {FactorAnalysisType} from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor-worker";
import {transformFactorAnalysisResult} from "./factor-analysis-formatter";
import {resultFactorAnalysis} from "./factor-analysis-output";
import init, {
    FactorAnalysis,
} from "@/components/Modals/Analyze/dimension-reduction/factor/rust/pkg";
import {Variable} from "@/types/Variable";
import {DataRow} from "@/types/Data";

// Helper function to extract data for selected variables using column indices
// Similar to how Linear Regression extracts data
function extractVariableData(
    dataRows: DataRow[],
    variables: Variable[],
    selectedVarNames: string[]
): { data: Record<string, number | null>[], varDefs: any[][] } {
    const selectedVars = selectedVarNames
        .map(name => variables.find(v => v.name === name))
        .filter((v): v is Variable => v !== undefined);

    if (selectedVars.length === 0) {
        return { data: [], varDefs: [[]] };
    }

    // Extract data for each row, creating records with variable names as keys
    const data: Record<string, number | null>[] = dataRows.map(row => {
        const record: Record<string, number | null> = {};
        for (const variable of selectedVars) {
            const rawValue = row[variable.columnIndex];
            if (rawValue === null || rawValue === undefined || rawValue === "") {
                record[variable.name] = null;
            } else {
                const numValue = typeof rawValue === 'number' 
                    ? rawValue 
                    : parseFloat(String(rawValue).replace(",", "."));
                record[variable.name] = isNaN(numValue) ? null : numValue;
            }
        }
        return record;
    });

    // Create variable definitions in the format expected by WASM
    const varDefs = [selectedVars.map(v => ({
        columnIndex: Number(v.columnIndex ?? 0),
        name: v.name,
        type: String(v.type ?? "NUMERIC").toUpperCase(),
        width: Number(v.width ?? 8),
        decimals: Number(v.decimals ?? 2),
        label: v.label || "",
        values: v.values || [],
        missing: v.missing || [],
        columns: Number(v.columns ?? 64),
        align: String(v.align ?? "right").toLowerCase(),
        measure: String(v.measure ?? "scale").toLowerCase(),
        role: String(v.role ?? "input").toLowerCase(),
    }))];

    return { data, varDefs };
}

export async function analyzeFactor({
    configData,
    dataRows,
    variables,
}: FactorAnalysisType) {
    const targetVariables = configData.main.TargetVar || [];
    const valueTarget = configData.main.ValueTarget
        ? [configData.main.ValueTarget]
        : [];

    console.log("=== FACTOR ANALYSIS DEBUG START ===");
    console.log("configData:", JSON.stringify(configData, null, 2));
    console.log("dataRows length:", dataRows?.length);
    console.log("dataRows first row:", dataRows?.[0]);
    console.log("variables count:", variables?.length);
    console.log("variables names:", variables?.map(v => v.name));
    console.log("targetVariables:", targetVariables);

    // Validation
    if (!variables || variables.length === 0) {
        throw new Error("No variable definitions found. Please ensure variables are loaded.");
    }

    if (!dataRows || dataRows.length === 0) {
        throw new Error("No data available. Please ensure data is loaded.");
    }

    if (targetVariables.length === 0) {
        throw new Error("No target variables selected for factor analysis.");
    }

    // Extract data for target variables (similar to Linear Regression pattern)
    const { data: targetData, varDefs: varDefsForTarget } = extractVariableData(
        dataRows,
        variables,
        targetVariables
    );

    // Extract data for value target (if specified)
    const { data: valueData, varDefs: varDefsForValue } = extractVariableData(
        dataRows,
        variables,
        valueTarget
    );

    // Wrap data in the format expected by WASM (Vec<Vec<DataRecord>>)
    const slicedDataForTarget = [targetData];
    const slicedDataForValue = valueTarget.length > 0 ? [valueData] : [[]];

    console.log("slicedDataForTarget structure:");
    console.log(`  Dataset 0: ${targetData.length} records`);
    if (targetData.length > 0) {
        console.log(`  First record keys: ${Object.keys(targetData[0]).join(", ")}`);
        console.log(`  First record:`, targetData[0]);
    }
    console.log("varDefsForTarget:", JSON.stringify(varDefsForTarget, null, 2));
    console.log("=== FACTOR ANALYSIS DEBUG END ===");

    // Validation before WASM call
    if (targetData.length === 0) {
        throw new Error("No data available for selected variables. Please ensure data is loaded and variables are selected.");
    }

    // Check if we have valid numeric data
    const hasValidData = targetData.some(record => 
        Object.values(record).some(val => val !== null && typeof val === 'number')
    );
    if (!hasValidData) {
        throw new Error("Selected variables have no valid numeric data. Please check if the data contains numeric values.");
    }

    // Di dalam blok try, file ini menjalankan await init (fungsi dari paket rust/pkg yang memuat modul WebAssembly 
    // ke dalam memori browser agar fungsi-fungsi Rust bisa dipanggil oleh JavaScript)
    try {
        await init();
        const factor = new FactorAnalysis(
            slicedDataForTarget, 
            slicedDataForValue,
            varDefsForTarget,
            varDefsForValue,
            configData
        );

        const results = factor.get_formatted_results();
        const error = factor.get_all_errors();

        console.log("WASM results", results);
        console.log("WASM error", error);

        // Teruskan configData ke formatter agar bisa mengakses extraction.Method
        const formattedResults = transformFactorAnalysisResult(results, configData);
        console.log("formattedResults", formattedResults);

        /*
         * 🎉 Final Result Process 🎯
         * */
        await resultFactorAnalysis({
            formattedResult: formattedResults ?? [],
            configData,
        });
    } catch (error) {
        console.error("Error in analyzeFactor:", error);
        throw error;
    }
}

// Ini file Service Layer utama yang bertugas sebagai orkestrator atau jembatan antara Frontend Next.js dan logika Rust WASM

import {getSlicedData, getVarDefs} from "@/hooks/useVariable"; // getSlicedData: Mengambil hanya data variabel yang dipilih oleh pengguna dari dataset besar di UI.
import {FactorAnalysisType} from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor-worker";
import {transformFactorAnalysisResult} from "./factor-analysis-formatter";
import {resultFactorAnalysis} from "./factor-analysis-output";
import init, {
    FactorAnalysis,
} from "@/components/Modals/Analyze/dimension-reduction/factor/rust/pkg";

// Fungsi memastikan kolom seperti columnIndex, width, dan decimals benar-benar bertipe Number. 
// Tanpa ini, jika JavaScript mengirimkan angka dalam bentuk string, Rust akan mengalami error karena Rust sangat ketat terhadap tipe data (strongly typed).

function sanitizeVarDefs(varDefs: any[][]): any[][] {
    return varDefs.map((varDefGroup) =>
        varDefGroup.map((varDef: any) => ({
            ...varDef,
            columnIndex: Number(varDef.columnIndex ?? 0),
            width: Number(varDef.width ?? 0),
            decimals: Number(varDef.decimals ?? 0),
            columns: Number(varDef.columns ?? 0),
            id: varDef.id ? Number(varDef.id) : undefined,
            // Ensure enum-like fields are strings in the correct format
            type: String(varDef.type ?? "STRING"),
            align: String(varDef.align ?? "left").toLowerCase(),
            measure: String(varDef.measure ?? "unknown").toLowerCase(),
            role: String(varDef.role ?? "none").toLowerCase(),
        }))
    );
}

// Helper function to create synthetic variable definitions when metadata is missing
// This parses variable names like "VAR1", "VAR2", etc. to extract the column index
function createSyntheticVariables(varNames: string[], dataRow: string[] | null): { name: string; columnIndex: number; type: string; width: number; decimals: number; label: string; values: any[]; missing: any; columns: number; align: string; measure: string; role: string }[] {
    return varNames.map((name) => {
        // Try to extract column index from variable name (e.g., "VAR1" -> 0, "VAR2" -> 1)
        const match = name.match(/^VAR(\d+)$/i);
        // columnIndex is 0-based, so VAR1 -> 0, VAR2 -> 1, etc.
        const columnIndex = match ? parseInt(match[1], 10) - 1 : 0;
        
        return {
            name,
            columnIndex,
            type: "NUMERIC",
            width: 8,
            decimals: 2,
            label: "",
            values: [],
            missing: null,
            columns: 64,
            align: "right",
            measure: "unknown",
            role: "input",
        };
    });
}

export async function analyzeFactor({
    configData,
    dataVariables,
    variables,
}: FactorAnalysisType) {
    const targetVariables = configData.main.TargetVar || [];
    const valueTarget = configData.main.ValueTarget
        ? [configData.main.ValueTarget]
        : [];

    // If variables metadata is missing, create synthetic variables from the target variable names
    // This handles the case when variables table in IndexedDB is empty but data exists
    let effectiveVariables = variables;
    if (!variables || variables.length === 0) {
        console.warn("[analyzeFactor] Variables metadata is empty! Creating synthetic variables from target variable names.");
        const allVarNames = [...targetVariables, ...(valueTarget.length > 0 ? valueTarget : [])];
        effectiveVariables = createSyntheticVariables(allVarNames, dataVariables?.[0] ?? null) as any;
        console.log("[analyzeFactor] Created synthetic variables:", effectiveVariables);
    }

    const slicedDataForTarget = getSlicedData({
        dataVariables: dataVariables,
        variables: effectiveVariables,
        selectedVariables: targetVariables,
    });

    const slicedDataForValue = getSlicedData({
        dataVariables: dataVariables,
        variables: effectiveVariables,
        selectedVariables: valueTarget,
    });

    const varDefsForTarget = sanitizeVarDefs(
        getVarDefs(effectiveVariables, targetVariables)
    );
    const varDefsForValue = sanitizeVarDefs(
        getVarDefs(effectiveVariables, valueTarget)
    );

    console.log("=== FACTOR ANALYSIS DEBUG START ===");
    console.log("configData:", JSON.stringify(configData, null, 2));
    console.log("dataVariables length:", dataVariables?.length);
    console.log("dataVariables first row:", dataVariables?.[0]);
    console.log("variables count:", variables?.length);
    console.log("variables names:", variables?.map(v => v.name));
    console.log("targetVariables:", targetVariables);
    console.log("slicedDataForTarget:", JSON.stringify(slicedDataForTarget?.slice(0, 2), null, 2)); // First 2 vars
    console.log("slicedDataForTarget structure:");
    slicedDataForTarget?.forEach((varData, idx) => {
        console.log(`  Variable ${idx}: ${varData?.length} records, first record:`, varData?.[0]);
    });
    console.log("varDefsForTarget:", JSON.stringify(varDefsForTarget, null, 2));
    console.log("=== FACTOR ANALYSIS DEBUG END ===");

    // Validation before WASM call
    if (!slicedDataForTarget || slicedDataForTarget.length === 0) {
        throw new Error("No data available for selected variables. Please ensure data is loaded and variables are selected.");
    }
    
    if (slicedDataForTarget[0]?.length === 0) {
        throw new Error("Selected variables have no valid data records. Please check if data is loaded correctly.");
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

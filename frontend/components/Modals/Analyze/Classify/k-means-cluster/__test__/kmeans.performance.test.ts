/** @jest-environment node */

import { Variable } from "@/types/Variable";
import * as fs from "fs";
import * as path from "path";
import { KMeansClusterType } from "../types/k-means-cluster";
import { performance } from "perf_hooks"; // Use Node.js performance hooks for more accurate timing in a Node environment

// Asumsikan path ini benar di lingkungan Jest Anda.
import { getSlicedData, getVarDefs } from "@/hooks/useVariable";
import init, {
    KMeansClusterAnalysis,
} from "@/components/Modals/Analyze/Classify/k-means-cluster/rust/pkg/wasm";

// Path untuk menyimpan file JSON hasil kinerja.
const performanceResultsPath = path.join(
    __dirname,
    "performance-results-constructor-all-runs.json" // Nama file diubah untuk mencerminkan konten baru
);

/**
 * Menghasilkan data dummy untuk pengujian kinerja.
 * @param rowCount - Jumlah baris (titik data) yang akan dibuat.
 * @param varCount - Jumlah variabel (kolom) yang akan dibuat.
 * @returns Sebuah objek yang berisi data yang dihasilkan dan definisi variabel.
 */
const generateDummyData = (
    rowCount: number,
    varCount: number
): {
    dataVariables: string[][];
    variables: Variable[];
    caseTargetVarName: string;
} => {
    const variables: Variable[] = [];
    for (let i = 0; i < varCount; i++) {
        variables.push({
            name: `VAR${i + 1}`,
            type: "NUMERIC",
            columnIndex: i,
            width: 8,
            decimals: 2,
            label: `Variable ${i + 1}`,
            values: [],
            missing: null,
            columns: 1,
            align: "right",
            measure: "scale",
            role: "input",
        });
    }

    const caseTargetVarName = "CaseLabel";
    variables.push({
        name: caseTargetVarName,
        type: "STRING",
        columnIndex: varCount,
        width: 12,
        decimals: 0,
        label: "Case Label",
        values: [],
        missing: null,
        columns: 1,
        align: "left",
        measure: "nominal",
        role: "input",
    });

    const dataVariables: string[][] = [];
    for (let i = 0; i < rowCount; i++) {
        const row: string[] = [];
        for (let j = 0; j < varCount; j++) {
            row.push((Math.random() * 100).toFixed(2));
        }
        row.push(`Case ${i + 1}`);
        dataVariables.push(row);
    }
    return { dataVariables, variables, caseTargetVarName };
};

// Suite pengujian utama untuk kinerja konstruktor KMeansClusterAnalysis
describe("KMeansClusterAnalysis Constructor Performance Test", () => {
    const ROW_COUNTS = [10, 100, 1000];
    const VAR_COUNTS = [5, 10];
    const NUM_RUNS = 100; // Jumlah eksekusi untuk setiap pengujian
    const performanceResults: Record<number, Record<number, number[]>> = {};

    // Inisialisasi modul WebAssembly sekali sebelum semua pengujian berjalan.
    beforeAll(async () => {
        const wasmPath = path.resolve(__dirname, "../rust/pkg/wasm_bg.wasm");
        const wasmBuffer = fs.readFileSync(wasmPath);
        await init(wasmBuffer);
    }, 60000); // Timeout 1 menit untuk inisialisasi Wasm

    // Setelah semua pengujian selesai, tulis hasilnya ke file.
    afterAll(() => {
        console.log(
            "\nSemua uji kinerja konstruktor selesai. Menulis hasil..."
        );
        fs.writeFileSync(
            performanceResultsPath,
            JSON.stringify(performanceResults, null, 2)
        );
        console.log(`Hasil disimpan ke ${performanceResultsPath}`);
    });

    ROW_COUNTS.forEach((rowCount) => {
        describe(`dengan ${rowCount} baris`, () => {
            VAR_COUNTS.forEach((varCount) => {
                test(`harus mengukur kinerja konstruktor untuk ${varCount} variabel selama ${NUM_RUNS} eksekusi`, async () => {
                    const { dataVariables, variables, caseTargetVarName } =
                        generateDummyData(rowCount, varCount);

                    const allVars = variables
                        .filter((v) => v.name !== caseTargetVarName)
                        .map((v) => v.name);

                    // Objek konfigurasi sekarang ditulis sepenuhnya.
                    const configData: KMeansClusterType = {
                        main: {
                            TargetVar: allVars,
                            CaseTarget: caseTargetVarName,
                            IterateClassify: false,
                            ClassifyOnly: false,
                            Cluster: 10,
                            OpenDataset: false,
                            ExternalDatafile: false,
                            NewDataset: false,
                            DataFile: false,
                            ReadInitial: false,
                            WriteFinal: false,
                            OpenDatasetMethod: null,
                            NewData: null,
                            InitialData: null,
                            FinalData: null,
                        },
                        iterate: {
                            MaximumIterations: 10,
                            ConvergenceCriterion: 0.02,
                            UseRunningMeans: true,
                        },
                        save: {
                            ClusterMembership: true,
                            DistanceClusterCenter: true,
                        },
                        options: {
                            InitialCluster: true,
                            ANOVA: true,
                            ClusterInfo: true,
                            ClusterPlot: false,
                            ExcludeListWise: true,
                            ExcludePairWise: false,
                        },
                    };

                    // --- PERSIAPAN DATA (di luar bagian yang diukur waktunya) ---
                    const TargetVariables = configData.main.TargetVar || [];
                    const CaseTargetVariable = configData.main.CaseTarget
                        ? [configData.main.CaseTarget]
                        : [];

                    const slicedDataForTarget = getSlicedData({
                        dataVariables: dataVariables,
                        variables: variables,
                        selectedVariables: TargetVariables,
                    });

                    const slicedDataForCaseTarget = getSlicedData({
                        dataVariables: dataVariables,
                        variables: variables,
                        selectedVariables: CaseTargetVariable,
                    });

                    const varDefsForTarget = getVarDefs(
                        variables,
                        TargetVariables
                    );
                    const varDefsForCaseTarget = getVarDefs(
                        variables,
                        CaseTargetVariable
                    );

                    const executionTimes: number[] = [];
                    for (let i = 0; i < NUM_RUNS; i++) {
                        // --- PENGUKURAN KINERJA (fokus pada konstruktor) ---
                        const startTime = performance.now();

                        new KMeansClusterAnalysis(
                            slicedDataForTarget,
                            slicedDataForCaseTarget,
                            varDefsForTarget,
                            varDefsForCaseTarget,
                            configData
                        );

                        const endTime = performance.now();
                        executionTimes.push(endTime - startTime);
                    }

                    if (!performanceResults[rowCount]) {
                        performanceResults[rowCount] = {};
                    }
                    // Simpan array lengkap dari waktu eksekusi
                    performanceResults[rowCount][varCount] = executionTimes;

                    // Hapus perhitungan rata-rata dan perbarui pesan log
                    console.log(
                        `Waktu Konstruktor -> Baris: ${rowCount}, Var: ${varCount}. Selesai ${NUM_RUNS} eksekusi. Semua waktu telah dicatat.`
                    );
                }, 300000); // Timeout 5 menit per pengujian
            });
        });
    });
});

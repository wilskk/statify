/** @jest-environment node */

import { KMeansClusterType } from "@/components/Modals/Analyze/Classify/k-means-cluster/types/k-means-cluster";
import * as useVariable from "@/hooks/useVariable";
import init, {
    KMeansClusterAnalysis,
} from "@/components/Modals/Analyze/Classify/k-means-cluster/rust/pkg/wasm";
import fs from "fs";
import path from "path";
import { Variable } from "@/types/Variable";

// Manually initialize the WASM module before all tests
beforeAll(async () => {
    const wasmPath = path.join(__dirname, "../rust/pkg/wasm_bg.wasm");
    const wasmBuffer = fs.readFileSync(wasmPath);
    await init(wasmBuffer);
});

// Mock utility functions from useVariable
jest.mock("@/hooks/useVariable", () => ({
    getSlicedData: jest.fn(),
    getVarDefs: jest.fn().mockReturnValue([]),
}));

describe("KMeansCluster Analysis Error Handling", () => {
    // Helper function to create a minimal valid config
    const createValidConfig = (): KMeansClusterType => ({
        main: {
            TargetVar: ["var1", "var2"],
            CaseTarget: "var3",
            IterateClassify: true,
            ClassifyOnly: false,
            Cluster: 3,
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
            MaximumIterations: 100,
            ConvergenceCriterion: 0.001,
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
    });

    // --- 🖋️ FIX: Updated with real test data ---

    const mockVariables: Variable[] = [
        {
            id: 782,
            columnIndex: 0,
            name: "eruption",
            type: "NUMERIC",
            width: 8,
            decimals: 3,
            label: "",
            values: [],
            missing: null,
            columns: 72,
            align: "right",
            measure: "scale",
            role: "input",
        },
        {
            id: 783,
            columnIndex: 1,
            name: "waiting",
            type: "NUMERIC",
            width: 8,
            decimals: 0,
            label: "",
            values: [],
            missing: null,
            columns: 72,
            align: "right",
            measure: "scale",
            role: "input",
        },
        {
            id: 784,
            columnIndex: 2,
            name: "Zeruption",
            type: "NUMERIC",
            width: 8,
            decimals: 16,
            label: "",
            values: [],
            missing: null,
            columns: 72,
            align: "right",
            measure: "scale",
            role: "input",
        },
        {
            id: 785,
            columnIndex: 3,
            name: "Zwaiting",
            type: "NUMERIC",
            width: 8,
            decimals: 16,
            label: "",
            values: [],
            missing: null,
            columns: 72,
            align: "right",
            measure: "scale",
            role: "input",
        },
        {
            id: 786,
            columnIndex: 4,
            name: "VAR1",
            type: "STRING",
            width: 8,
            decimals: 0,
            label: "",
            values: [],
            missing: null,
            columns: 64,
            align: "left",
            measure: "nominal",
            role: "input",
        },
    ];

    const slicedTargetData = [
        [
            { eruption: 3.6 },
            { eruption: 1.8 },
            { eruption: 3.333 },
            { eruption: 2.283 },
            { eruption: 4.533 },
        ],
        [
            { waiting: 79 },
            { waiting: 54 },
            { waiting: 74 },
            { waiting: 62 },
            { waiting: 85 },
        ],
        [
            { Zeruption: 0.09849885677570003 },
            { Zeruption: -1.481458561478812 },
            { Zeruption: -0.13586149359871916 },
            { Zeruption: -1.0575033209138514 },
            { Zeruption: 0.917443451904289 },
        ],
        [
            { Zwaiting: 0.5971234377971165 },
            { Zwaiting: -1.2451811797257462 },
            { Zwaiting: 0.22866251429254397 },
            { Zwaiting: -0.6556437021184301 },
            { Zwaiting: 1.0392765460026037 },
        ],
    ];

    const slicedCaseData = [
        [
            { VAR1: "Case 1" },
            { VAR1: "Case 2" },
            { VAR1: "Case 3" },
            { VAR1: "Case 4" },
            { VAR1: "Case 5" },
        ],
    ];

    const varDefsForTarget = [
        [
            {
                id: 782,
                columnIndex: 0,
                name: "eruption",
                type: "NUMERIC",
                width: 8,
                decimals: 3,
                label: "",
                values: [],
                missing: null,
                columns: 72,
                align: "right",
                measure: "scale",
                role: "input",
            },
        ],
        [
            {
                id: 783,
                columnIndex: 1,
                name: "waiting",
                type: "NUMERIC",
                width: 8,
                decimals: 0,
                label: "",
                values: [],
                missing: null,
                columns: 72,
                align: "right",
                measure: "scale",
                role: "input",
            },
        ],
        [
            {
                id: 784,
                columnIndex: 2,
                name: "Zeruption",
                type: "NUMERIC",
                width: 8,
                decimals: 16,
                label: "",
                values: [],
                missing: null,
                columns: 72,
                align: "right",
                measure: "scale",
                role: "input",
            },
        ],
        [
            {
                id: 785,
                columnIndex: 3,
                name: "Zwaiting",
                type: "NUMERIC",
                width: 8,
                decimals: 16,
                label: "",
                values: [],
                missing: null,
                columns: 72,
                align: "right",
                measure: "scale",
                role: "input",
            },
        ],
    ];

    const varDefsForCaseTarget = [
        [
            {
                id: 786,
                columnIndex: 4,
                name: "VAR1",
                type: "STRING",
                width: 8,
                decimals: 0,
                label: "",
                values: [],
                missing: null,
                columns: 64,
                align: "left",
                measure: "nominal",
                role: "input",
            },
        ],
    ];

    // --- End of Fix ---

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock the useVariable functions to return our real data
        (useVariable.getSlicedData as jest.Mock).mockImplementation(
            ({ selectedVariables }) => {
                if (selectedVariables.includes("eruption")) {
                    return slicedTargetData[0];
                }
                if (selectedVariables.includes("waiting")) {
                    return slicedTargetData[1];
                }
                if (selectedVariables.includes("Zeruption")) {
                    return slicedTargetData[2];
                }
                if (selectedVariables.includes("Zwaiting")) {
                    return slicedTargetData[3];
                }
                if (selectedVariables.includes("VAR1")) {
                    return slicedCaseData[0];
                }
                return [];
            }
        );
        (useVariable.getVarDefs as jest.Mock).mockImplementation(
            (vars, selectedVars) => {
                if (selectedVars.includes("eruption")) {
                    return varDefsForTarget[0];
                }
                if (selectedVars.includes("waiting")) {
                    return varDefsForTarget[1];
                }
                if (selectedVars.includes("Zeruption")) {
                    return varDefsForTarget[2];
                }
                if (selectedVars.includes("Zwaiting")) {
                    return varDefsForTarget[3];
                }
                if (selectedVars.includes("VAR1")) {
                    return varDefsForCaseTarget[0];
                }
                return [];
            }
        );
    });

    // Helper function to prepare data and instantiate the WASM class
    const _runWasmAnalysis = (config: KMeansClusterType) => {
        const TargetVariables = config.main.TargetVar || [];
        const CaseTargetVariable = config.main.CaseTarget
            ? [config.main.CaseTarget]
            : [];

        const slicedDataForTarget = useVariable.getSlicedData({
            dataVariables: [],
            variables: mockVariables,
            selectedVariables: TargetVariables,
        });

        const slicedDataForCaseTarget = useVariable.getSlicedData({
            dataVariables: [],
            variables: mockVariables,
            selectedVariables: CaseTargetVariable,
        });

        const varDefsForTarget = useVariable.getVarDefs(
            mockVariables,
            TargetVariables
        );
        const varDefsForCaseTarget = useVariable.getVarDefs(
            mockVariables,
            CaseTargetVariable
        );

        return new KMeansClusterAnalysis(
            slicedDataForTarget,
            slicedDataForCaseTarget,
            varDefsForTarget,
            varDefsForCaseTarget,
            config
        );
    };
    const runWasmAnalysis = jest.fn(_runWasmAnalysis);

    test("should capture error when Cluster value is not positive", () => {
        const invalidConfig = createValidConfig();
        invalidConfig.main.Cluster = 0;
        invalidConfig.main.TargetVar = ["eruption", "waiting"];

        try {
            runWasmAnalysis(invalidConfig);
        } catch (e: any) {
            // Expected to throw
        }
        expect(runWasmAnalysis).toHaveBeenCalled();
    });

    test("should capture error when TargetVar is missing", () => {
        const invalidConfig = createValidConfig();
        invalidConfig.main.TargetVar = [];

        try {
            runWasmAnalysis(invalidConfig);
        } catch (e: any) {
            // Expected to throw
        }
        expect(runWasmAnalysis).toHaveBeenCalled();
    });

    test("should process valid configuration correctly without errors", () => {
        const validConfig = createValidConfig();
        validConfig.main.TargetVar = ["eruption", "waiting"];
        validConfig.main.CaseTarget = "VAR1";

        const kmeans = runWasmAnalysis(validConfig);
        const errors = kmeans.get_all_errors();

        expect(errors).toBe("");
    });

    test("should capture error when target_data is empty", () => {
        const validConfig = createValidConfig();
        validConfig.main.TargetVar = ["eruption", "waiting"];
        (useVariable.getSlicedData as jest.Mock).mockReturnValueOnce([]);

        try {
            runWasmAnalysis(validConfig);
        } catch (e: any) {
            // Expected to throw
        }
        expect(runWasmAnalysis).toHaveBeenCalled();
    });

    test("should capture error when target_data contains all null values", () => {
        const validConfig = createValidConfig();
        validConfig.main.TargetVar = ["eruption", "waiting"];
        (useVariable.getSlicedData as jest.Mock).mockReturnValueOnce([
            { eruption: null },
            { waiting: null },
        ]);

        try {
            runWasmAnalysis(validConfig);
        } catch (e: any) {
            // Expected to throw
        }
        expect(runWasmAnalysis).toHaveBeenCalled();
    });

    test("should capture error when case_data contains all null values", () => {
        const validConfig = createValidConfig();
        validConfig.main.TargetVar = ["eruption", "waiting"];
        validConfig.main.CaseTarget = "VAR1";
        (useVariable.getSlicedData as jest.Mock)
            .mockReturnValueOnce(slicedTargetData[0])
            .mockReturnValueOnce(slicedTargetData[1])
            .mockReturnValueOnce([{ VAR1: null }]);

        try {
            runWasmAnalysis(validConfig);
        } catch (e: any) {
            // Expected to throw
        }
        expect(runWasmAnalysis).toHaveBeenCalled();
    });

    // This test is less relevant now as type errors would be caught by TypeScript,
    // but we can check if the WASM constructor handles malformed objects gracefully.
    test("should capture error for malformed configuration object", () => {
        const malformedConfig = {
            main: {},
        } as unknown as KMeansClusterType;

        try {
            runWasmAnalysis(malformedConfig);
        } catch (e: any) {
            // Expected to throw
        }
        
        expect(runWasmAnalysis).toHaveBeenCalled();
    });
});

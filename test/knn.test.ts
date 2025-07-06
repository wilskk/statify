import { analyzeKNN } from "@/services/analyze/classify/nearest-neighbor/nearest-neighbor-analysis";
import init, { KNNAnalysis } from "@/wasm/pkg/wasm";

// Mock the wasm init function
jest.mock("@/wasm/pkg/wasm", () => {
    const mockKNNAnalysis = jest.fn();
    mockKNNAnalysis.mockImplementation(
        (
            target_data,
            features_data,
            focal_case_data,
            case_data,
            target_data_defs,
            features_data_defs,
            focal_case_data_defs,
            case_data_defs,
            config_data
        ) => {
            // This implementation mimics the behavior of the actual Rust constructor
            // It will validate inputs and throw errors for invalid data

            // Check if at least one target or feature variable must be selected
            if (
                (!config_data?.main?.DepVar ||
                    config_data.main.DepVar === null) &&
                (!config_data?.main?.FeatureVar ||
                    config_data.main.FeatureVar === null ||
                    config_data.main.FeatureVar.length === 0)
            ) {
                throw new Error(
                    "At least one target or feature variable must be selected"
                );
            }

            // Mock method implementations
            return {
                get_results: jest.fn().mockReturnValue({}),
                get_formatted_results: jest.fn().mockReturnValue({}),
                get_all_errors: jest.fn().mockReturnValue([]),
                get_executed_functions: jest.fn().mockReturnValue([]),
                clear_errors: jest.fn(),
            };
        }
    );

    return {
        __esModule: true,
        default: jest.fn().mockResolvedValue(true),
        KNNAnalysis: mockKNNAnalysis,
    };
});

// Mock utility functions from useVariable
jest.mock("@/hooks/useVariable", () => ({
    getSlicedData: jest.fn().mockReturnValue([]),
    getVarDefs: jest.fn().mockReturnValue([]),
}));

describe("KNN Analysis Constructor Error Handling", () => {
    // Helper function to create a minimal valid config
    const createValidConfig = () => ({
        main: {
            DepVar: "var1",
            FeatureVar: ["var2", "var3"],
            CaseIdenVar: "var4",
            FocalCaseIdenVar: "var5",
            NormCovar: true,
        },
        neighbors: {
            Specify: true,
            AutoSelection: false,
            SpecifyK: 5,
            MinK: 1,
            MaxK: 10,
            MetricEucli: true,
            MetricManhattan: false,
            Weight: true,
            PredictionsMean: true,
            PredictionsMedian: false,
        },
        features: {
            ForwardSelection: null,
            ForcedEntryVar: null,
            FeaturesToEvaluate: 3,
            ForcedFeatures: 1,
            PerformSelection: false,
            MaxReached: false,
            BelowMin: false,
            MaxToSelect: 3,
            MinChange: 0.001,
        },
        partition: {
            SrcVar: null,
            PartitioningVariable: null,
            UseRandomly: true,
            UseVariable: false,
            VFoldPartitioningVariable: null,
            VFoldUseRandomly: true,
            VFoldUsePartitioningVar: false,
            TrainingNumber: 70,
            NumPartition: 3,
            SetSeed: true,
            Seed: 12345,
        },
        save: {
            AutoName: true,
            CustomName: false,
            MaxCatsToSave: 25,
            HasTargetVar: true,
            IsCateTargetVar: false,
            RandomAssignToPartition: false,
            RandomAssignToFold: false,
        },
        output: {
            CaseSummary: true,
            ChartAndTable: true,
            ExportModelXML: false,
            XMLFilePath: null,
            ExportDistance: false,
            CreateDataset: false,
            WriteDataFile: false,
            NewDataFilePath: null,
            DatasetName: null,
        },
        options: {
            Exclude: true,
            Include: false,
        },
    });

    // Setup mock for analysis function dependencies
    const mockAddLog = jest.fn().mockResolvedValue(1);
    const mockAddAnalytic = jest.fn().mockResolvedValue(1);
    const mockAddStatistic = jest.fn().mockResolvedValue(1);
    const mockVariables = [
        { name: "var1" },
        { name: "var2" },
        { name: "var3" },
        { name: "var4" },
        { name: "var5" },
    ];
    const mockDataVariables = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10, 11, 12],
        [13, 14, 15],
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should throw error when both DepVar and FeatureVar are missing", async () => {
        // Setup invalid config with missing DepVar and FeatureVar
        const invalidConfig = createValidConfig();
        invalidConfig.main.DepVar = null;
        invalidConfig.main.FeatureVar = null;

        // Call the function and expect it to throw
        await expect(
            analyzeKNN({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "At least one target or feature variable must be selected"
        );

        // Verify the constructor was called with the invalid config
        expect(KNNAnalysis).toHaveBeenCalled();
    });

    test("should throw error when DepVar is null and FeatureVar is empty array", async () => {
        // Setup invalid config with null DepVar and empty FeatureVar
        const invalidConfig = createValidConfig();
        invalidConfig.main.DepVar = null;
        invalidConfig.main.FeatureVar = [];

        // Call the function and expect it to throw
        await expect(
            analyzeKNN({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "At least one target or feature variable must be selected"
        );

        // Verify the constructor was called with the invalid config
        expect(KNNAnalysis).toHaveBeenCalled();
    });

    test("should process valid configuration with only DepVar set", async () => {
        // Setup valid config with only DepVar
        const validConfig = createValidConfig();
        validConfig.main.FeatureVar = null;

        // Call the function
        await analyzeKNN({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(KNNAnalysis).toHaveBeenCalled();
        expect(KNNAnalysis).toHaveBeenCalledWith(
            expect.any(Array), // slicedDataForTarget
            expect.any(Array), // slicedDataForFeatures
            expect.any(Array), // slicedDataForFocalCaseIdentifier
            expect.any(Array), // slicedDataForCaseIdentifier
            expect.any(Array), // varDefsForTarget
            expect.any(Array), // varDefsForFeatures
            expect.any(Array), // varDefsForFocalCaseIdentifier
            expect.any(Array), // varDefsForCaseIdentifier
            validConfig // config
        );
    });

    test("should process valid configuration with only FeatureVar set", async () => {
        // Setup valid config with only FeatureVar
        const validConfig = createValidConfig();
        validConfig.main.DepVar = null;

        // Call the function
        await analyzeKNN({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(KNNAnalysis).toHaveBeenCalled();
    });

    test("should process valid configuration with both DepVar and FeatureVar set", async () => {
        // Setup valid config with both DepVar and FeatureVar
        const validConfig = createValidConfig();

        // Call the function
        await analyzeKNN({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(KNNAnalysis).toHaveBeenCalled();
    });

    test("should handle data type mismatches in constructor arguments", async () => {
        // Create a spy on console.log to capture error messages
        const consoleLogSpy = jest.spyOn(console, "log");

        // Setup test with incorrectly typed data
        const validConfig = createValidConfig();

        // Modify getSlicedData to return incorrect data type
        const { getSlicedData } = require("@/hooks/useVariable");
        getSlicedData.mockReturnValueOnce("invalid data type"); // String instead of expected array

        // Call the function (it should catch the error internally)
        await analyzeKNN({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Check if an error was logged
        expect(consoleLogSpy).toHaveBeenCalled();
        // Restore the spy
        consoleLogSpy.mockRestore();
    });

    test("should handle malformed configuration object", async () => {
        // Setup a malformed config that's missing required nested properties
        const malformedConfig = {
            main: {}, // Missing all required properties
            // Missing other required sections
        };

        // Call the function and expect it to throw
        await expect(
            analyzeKNN({
                configData: malformedConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow();

        // Verify the constructor was called with the malformed config
        expect(KNNAnalysis).toHaveBeenCalled();
    });
});

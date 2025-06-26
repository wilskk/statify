import { analyzeTwoStepCluster } from "@/services/analyze/classify/two-step-cluster/two-step-cluster-analysis";
import init, { TwoStepClusterAnalysis } from "@/wasm/pkg/wasm";

// Mock the wasm init function
jest.mock("@/wasm/pkg/wasm", () => {
    const mockTwoStepClusterAnalysis = jest.fn();
    mockTwoStepClusterAnalysis.mockImplementation(
        (
            categorical_data,
            continuous_data,
            categorical_data_defs,
            continuous_data_defs,
            config_data
        ) => {
            // This implementation mimics the behavior of the actual Rust constructor
            // It will validate inputs and throw errors for invalid data

            // Check if at least one categorical or continuous variable is selected
            if (
                (!config_data?.main?.CategoricalVar ||
                    config_data.main.CategoricalVar.length === 0) &&
                (!config_data?.main?.ContinousVar ||
                    config_data.main.ContinousVar.length === 0)
            ) {
                throw new Error(
                    "At least one categorical or continuous variable must be selected"
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
        TwoStepClusterAnalysis: mockTwoStepClusterAnalysis,
    };
});

// Mock utility functions from useVariable
jest.mock("@/hooks/useVariable", () => ({
    getSlicedData: jest.fn().mockReturnValue([]),
    getVarDefs: jest.fn().mockReturnValue([]),
}));

describe("TwoStepCluster Analysis Constructor Error Handling", () => {
    // Helper function to create a minimal valid config
    const createValidConfig = () => ({
        main: {
            CategoricalVar: ["var1", "var2"],
            ContinousVar: ["var3", "var4"],
            Log: true,
            Euclidean: true,
            Auto: true,
            MaxCluster: 15,
            Fixed: false,
            NumCluster: null,
            Aic: true,
            Bic: false,
            ToStandardized: 1,
            AssumedStandardized: null,
        },
        options: {
            SrcVar: null,
            TargetVar: null,
            Noise: false,
            NoiseCluster: null,
            NoiseThreshold: null,
            MxBranch: 8,
            MxDepth: 3,
            MemoryValue: 64,
            MaxNodes: 1000,
            ImportCFTree: false,
            CFTreeName: null,
        },
        output: {
            SrcVar: null,
            TargetVar: null,
            PivotTable: true,
            ChartTable: true,
            ClustVar: true,
            ExportModel: false,
            ExportCFTree: false,
            ModelName: null,
            CFTreeName: null,
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
    ];
    const mockDataVariables = [
        [1, 2, 3, 4],
        [4, 5, 6, 7],
        [7, 8, 9, 10],
        [10, 11, 12, 13],
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should throw error when both CategoricalVar and ContinousVar are missing", async () => {
        // Setup invalid config with missing variables
        const invalidConfig = createValidConfig();
        invalidConfig.main.CategoricalVar = null;
        invalidConfig.main.ContinousVar = null;

        // Call the function and expect it to throw
        await expect(
            analyzeTwoStepCluster({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "At least one categorical or continuous variable must be selected"
        );

        // Verify the constructor was called with the invalid config
        expect(TwoStepClusterAnalysis).toHaveBeenCalled();
    });

    test("should throw error when both CategoricalVar and ContinousVar are empty arrays", async () => {
        // Setup invalid config with empty arrays
        const invalidConfig = createValidConfig();
        invalidConfig.main.CategoricalVar = [];
        invalidConfig.main.ContinousVar = [];

        // Call the function and expect it to throw
        await expect(
            analyzeTwoStepCluster({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "At least one categorical or continuous variable must be selected"
        );

        // Verify the constructor was called with the invalid config
        expect(TwoStepClusterAnalysis).toHaveBeenCalled();
    });

    test("should process valid configuration with only categorical variables", async () => {
        // Setup valid config with only categorical variables
        const validConfig = createValidConfig();
        validConfig.main.ContinousVar = null;

        // Call the function
        await analyzeTwoStepCluster({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(TwoStepClusterAnalysis).toHaveBeenCalled();

        // Check that TwoStepClusterAnalysis was called with the correct parameters
        expect(TwoStepClusterAnalysis).toHaveBeenCalledWith(
            expect.any(Array), // slicedDataForCategorical
            expect.any(Array), // slicedDataForContinous
            expect.any(Array), // varDefsForCategorical
            expect.any(Array), // varDefsForContinous
            validConfig // config
        );
    });

    test("should process valid configuration with only continuous variables", async () => {
        // Setup valid config with only continuous variables
        const validConfig = createValidConfig();
        validConfig.main.CategoricalVar = null;

        // Call the function
        await analyzeTwoStepCluster({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(TwoStepClusterAnalysis).toHaveBeenCalled();

        // Check that TwoStepClusterAnalysis was called with the correct parameters
        expect(TwoStepClusterAnalysis).toHaveBeenCalledWith(
            expect.any(Array), // slicedDataForCategorical
            expect.any(Array), // slicedDataForContinous
            expect.any(Array), // varDefsForCategorical
            expect.any(Array), // varDefsForContinous
            validConfig // config
        );
    });

    test("should process valid configuration with both variable types", async () => {
        // Setup valid config with both categorical and continuous variables
        const validConfig = createValidConfig();

        // Call the function
        await analyzeTwoStepCluster({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(TwoStepClusterAnalysis).toHaveBeenCalled();

        // Check that TwoStepClusterAnalysis was called with the correct parameters
        expect(TwoStepClusterAnalysis).toHaveBeenCalledWith(
            expect.any(Array), // slicedDataForCategorical
            expect.any(Array), // slicedDataForContinous
            expect.any(Array), // varDefsForCategorical
            expect.any(Array), // varDefsForContinous
            validConfig // config
        );
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
        await analyzeTwoStepCluster({
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
            analyzeTwoStepCluster({
                configData: malformedConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "At least one categorical or continuous variable must be selected"
        );

        // Verify the constructor was called with the malformed config
        expect(TwoStepClusterAnalysis).toHaveBeenCalled();
    });
});

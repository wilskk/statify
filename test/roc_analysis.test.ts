import { analyzeRocAnalysis } from "@/services/analyze/classify/roc-analysis/roc-analysis-analysis";
import init, { RocAnalysis } from "@/wasm/pkg/wasm";

// Mock the wasm init function
jest.mock("@/wasm/pkg/wasm", () => {
    const mockRocAnalysis = jest.fn();
    mockRocAnalysis.mockImplementation(
        (
            test_data,
            state_data,
            group_data,
            test_data_defs,
            state_data_defs,
            group_data_defs,
            config_data
        ) => {
            // This implementation mimics the behavior of the actual Rust constructor
            // It will validate inputs and throw errors for invalid data

            // Check if state_target_variable is selected
            if (!config_data?.main?.StateTargetVariable) {
                throw new Error(
                    "State target variable must be selected for ROC Analysis"
                );
            }

            // Check if test_target_variable is selected
            if (
                !config_data?.main?.TestTargetVariable ||
                config_data.main.TestTargetVariable.length === 0
            ) {
                throw new Error(
                    "Test target variable must be selected for ROC Analysis"
                );
            }

            // Mock method implementations
            return {
                get_results: jest.fn().mockReturnValue({}),
                get_formatted_results: jest.fn().mockReturnValue({}),
                get_all_errors: jest.fn().mockReturnValue([]),
                get_all_log: jest.fn().mockReturnValue([]),
            };
        }
    );

    return {
        __esModule: true,
        default: jest.fn().mockResolvedValue(true),
        RocAnalysis: mockRocAnalysis,
    };
});

// Mock utility functions from useVariable
jest.mock("@/hooks/useVariable", () => ({
    getSlicedData: jest.fn().mockReturnValue([]),
    getVarDefs: jest.fn().mockReturnValue([]),
}));

describe("RocAnalysis Constructor Error Handling", () => {
    // Helper function to create a minimal valid config
    const createValidConfig = () => ({
        main: {
            TestTargetVariable: ["var1", "var2"],
            StateTargetVariable: "var3",
            StateVarVal: "positive",
            TargetGroupVar: "group1",
            PairedSample: false,
        },
        defineGroups: {
            SpecifiedValues: true,
            Group1: "group1",
            Group2: "group2",
            UseMidValue: false,
            CutPoint: true,
            CutPointValue: 0.5,
        },
        options: {
            IncludeCutoff: true,
            ExcludeCutoff: false,
            LargerTest: true,
            SmallerTest: false,
            DistAssumptMethod: "nonparametric",
            ConfLevel: 95,
            ExcludeMissValue: true,
            MissValueAsValid: false,
        },
        display: {
            RocCurve: true,
            Refline: true,
            PRC: true,
            IntepolateTrue: true,
            IntepolateFalse: false,
            Overall: true,
            SECI: true,
            ROCPoint: true,
            PRCPoint: true,
            EvalMetrics: true,
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
        { name: "group1" },
    ];
    const mockDataVariables = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10, 11, 12],
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should throw error when StateTargetVariable is missing", async () => {
        // Setup invalid config with missing StateTargetVariable
        const invalidConfig = createValidConfig();
        invalidConfig.main.StateTargetVariable = null;

        // Call the function and expect it to throw
        await expect(
            analyzeRocAnalysis({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "State target variable must be selected for ROC Analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(RocAnalysis).toHaveBeenCalled();
    });

    test("should throw error when TestTargetVariable is missing", async () => {
        // Setup invalid config with missing TestTargetVariable
        const invalidConfig = createValidConfig();
        invalidConfig.main.TestTargetVariable = null;

        // Call the function and expect it to throw
        await expect(
            analyzeRocAnalysis({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "Test target variable must be selected for ROC Analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(RocAnalysis).toHaveBeenCalled();
    });

    test("should throw error when TestTargetVariable is empty array", async () => {
        // Setup invalid config with empty TestTargetVariable
        const invalidConfig = createValidConfig();
        invalidConfig.main.TestTargetVariable = [];

        // Call the function and expect it to throw
        await expect(
            analyzeRocAnalysis({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "Test target variable must be selected for ROC Analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(RocAnalysis).toHaveBeenCalled();
    });

    test("should process valid configuration correctly", async () => {
        // Setup valid config
        const validConfig = createValidConfig();

        // Call the function
        await analyzeRocAnalysis({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(RocAnalysis).toHaveBeenCalled();

        // Check that RocAnalysis was called with the correct parameters
        expect(RocAnalysis).toHaveBeenCalledWith(
            expect.any(Array), // slicedDataForTest
            expect.any(Array), // slicedDataForState
            expect.any(Array), // slicedDataForTargetGroup
            expect.any(Array), // varDefsForTest
            expect.any(Array), // varDefsForState
            expect.any(Array), // varDefsForTargetGroup
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
        await analyzeRocAnalysis({
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
            analyzeRocAnalysis({
                configData: malformedConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow();

        // Verify the constructor was called with the malformed config
        expect(RocAnalysis).toHaveBeenCalled();
    });
});

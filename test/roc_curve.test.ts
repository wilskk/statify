import { analyzeRocCurve } from "@/services/analyze/classify/roc-curve/roc-curve-analysis";
import init, { RocCurve } from "@/wasm/pkg/wasm";

// Mock the wasm init function
jest.mock("@/wasm/pkg/wasm", () => {
    const mockRocCurve = jest.fn();
    mockRocCurve.mockImplementation(
        (
            test_data,
            state_data,
            test_data_defs,
            state_data_defs,
            config_data
        ) => {
            // This implementation mimics the behavior of the actual Rust constructor
            // It will validate inputs and throw errors for invalid data

            // Check if state target variable is selected
            if (!config_data?.main?.StateTargetVariable) {
                throw new Error(
                    "State target variable must be selected for ROC Analysis"
                );
            }

            // Check if test target variable is selected
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
                get_executed_functions: jest.fn().mockReturnValue([]),
                clear_errors: jest.fn(),
            };
        }
    );

    return {
        __esModule: true,
        default: jest.fn().mockResolvedValue(true),
        RocCurve: mockRocCurve,
    };
});

// Mock utility functions from useVariable
jest.mock("@/hooks/useVariable", () => ({
    getSlicedData: jest.fn().mockReturnValue([]),
    getVarDefs: jest.fn().mockReturnValue([]),
}));

describe("RocCurve Analysis Constructor Error Handling", () => {
    // Helper function to create a minimal valid config
    const createValidConfig = () => ({
        main: {
            TestTargetVariable: ["var1"],
            StateTargetVariable: "var2",
            StateVarVal: "1",
            RocCurve: true,
            DiagRef: true,
            ErrInterval: true,
            CoordPt: true,
        },
        options: {
            IncludeCutoff: true,
            ExcludeCutoff: false,
            LargerTest: true,
            SmallerTest: false,
            DistAssumptMethod: "normal",
            ConfLevel: 0.95,
            ExcludeMissValue: true,
            MissValueAsValid: false,
        },
    });

    // Setup mock for analysis function dependencies
    const mockAddLog = jest.fn().mockResolvedValue(1);
    const mockAddAnalytic = jest.fn().mockResolvedValue(1);
    const mockAddStatistic = jest.fn().mockResolvedValue(1);
    const mockVariables = [{ name: "var1" }, { name: "var2" }];
    const mockDataVariables = [
        [1, 2, 3],
        [4, 5, 6],
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
            analyzeRocCurve({
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
        expect(RocCurve).toHaveBeenCalled();
    });

    test("should throw error when TestTargetVariable is missing", async () => {
        // Setup invalid config with missing TestTargetVariable
        const invalidConfig = createValidConfig();
        invalidConfig.main.TestTargetVariable = null;

        // Call the function and expect it to throw
        await expect(
            analyzeRocCurve({
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
        expect(RocCurve).toHaveBeenCalled();
    });

    test("should throw error when TestTargetVariable is empty array", async () => {
        // Setup invalid config with empty TestTargetVariable
        const invalidConfig = createValidConfig();
        invalidConfig.main.TestTargetVariable = [];

        // Call the function and expect it to throw
        await expect(
            analyzeRocCurve({
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
        expect(RocCurve).toHaveBeenCalled();
    });

    test("should process valid configuration correctly", async () => {
        // Setup valid config
        const validConfig = createValidConfig();

        // Call the function
        await analyzeRocCurve({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(RocCurve).toHaveBeenCalled();

        // Check that RocCurve was called with the correct parameters
        expect(RocCurve).toHaveBeenCalledWith(
            expect.any(Array), // slicedDataForTest
            expect.any(Array), // slicedDataForState
            expect.any(Array), // varDefsForTest
            expect.any(Array), // varDefsForState
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
        await analyzeRocCurve({
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
            analyzeRocCurve({
                configData: malformedConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow();

        // Verify the constructor was called with the malformed config
        expect(RocCurve).toHaveBeenCalled();
    });

    test("should handle malformed config JSON data", async () => {
        // Create a spy on console.log to capture error messages
        const consoleLogSpy = jest.spyOn(console, "log");

        // This test simulates the case where serde_wasm_bindgen fails to parse config data
        // by mocking RocCurve to throw an error for this specific config
        RocCurve.mockImplementationOnce(() => {
            throw new Error(
                "Failed to parse configuration: field names don't match expected format"
            );
        });

        const validConfig = createValidConfig();

        // Call the function and expect it to throw
        await expect(
            analyzeRocCurve({
                configData: validConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("Failed to parse configuration");

        // Verify the constructor was called
        expect(RocCurve).toHaveBeenCalled();

        // Restore the spy
        consoleLogSpy.mockRestore();
    });
});

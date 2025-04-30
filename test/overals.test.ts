import { analyzeOptScaOverals } from "@/services/analyze/dimension-reduction/optimal-scaling/overals/optimal-scaling-overals-analysis";
import init, { OVERALSAnalysis } from "@/wasm/pkg/wasm";

// Mock the wasm init function
jest.mock("@/wasm/pkg/wasm", () => {
    const mockOVERALSAnalysis = jest.fn();
    mockOVERALSAnalysis.mockImplementation(
        (
            setTargetData,
            plotsTargetData,
            setTargetDataDefs,
            plotsTargetDataDefs,
            configData
        ) => {
            // This implementation mimics the behavior of the actual Rust constructor
            // It will validate inputs and throw errors for invalid data

            // Check if set_target_variable is missing or empty
            if (
                !configData?.main?.SetTargetVariable ||
                configData.main.SetTargetVariable.length === 0
            ) {
                throw new Error(
                    "Set target variables must be selected for OVERALS analysis"
                );
            }

            // Mock method implementations
            return {
                get_results: jest.fn().mockReturnValue({}),
                get_all_errors: jest.fn().mockReturnValue([]),
                get_executed_functions: jest.fn().mockReturnValue([]),
                clear_errors: jest.fn().mockReturnValue([]),
            };
        }
    );

    return {
        __esModule: true,
        default: jest.fn().mockResolvedValue(true),
        OVERALSAnalysis: mockOVERALSAnalysis,
    };
});

// Mock utility functions from useVariable
jest.mock("@/hooks/useVariable", () => ({
    getSlicedData: jest.fn().mockReturnValue([]),
    getVarDefs: jest.fn().mockReturnValue([]),
}));

describe("OVERALS Analysis Constructor Error Handling", () => {
    // Helper function to create a minimal valid config
    const createValidConfig = () => ({
        main: {
            SetTargetVariable: [["var1"], ["var2"]],
            PlotsTargetVariable: ["var3"],
            Dimensions: 2,
        },
        defineRangeScale: {
            Minimum: 1,
            Maximum: 5,
            Ordinal: true,
            SingleNominal: false,
            MultipleNominal: false,
            DiscreteNumeric: false,
        },
        defineRange: {
            Minimum: 1,
            Maximum: 5,
        },
        options: {
            Freq: true,
            Centroid: true,
            IterHistory: false,
            WeightCompload: true,
            SingMult: true,
            CategoryQuant: false,
            ObjScore: false,
            CategCoord: false,
            PlotObjScore: true,
            Compload: true,
            CategCentroid: false,
            Trans: false,
            SaveObjscore: false,
            UseRandconf: false,
            MaxIter: 100,
            Conv: 0.00001,
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
    ];
    const mockDataVariables = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should throw error when SetTargetVariable is missing", async () => {
        // Setup invalid config with missing SetTargetVariable
        const invalidConfig = createValidConfig();
        invalidConfig.main.SetTargetVariable = null;

        // Call the function and expect it to throw
        await expect(
            analyzeOptScaOverals({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "Set target variables must be selected for OVERALS analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(OVERALSAnalysis).toHaveBeenCalled();
    });

    test("should throw error when SetTargetVariable is empty", async () => {
        // Setup invalid config with empty SetTargetVariable
        const invalidConfig = createValidConfig();
        invalidConfig.main.SetTargetVariable = [];

        // Call the function and expect it to throw
        await expect(
            analyzeOptScaOverals({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "Set target variables must be selected for OVERALS analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(OVERALSAnalysis).toHaveBeenCalled();
    });

    test("should process valid configuration correctly", async () => {
        // Setup valid config
        const validConfig = createValidConfig();

        // Call the function
        await analyzeOptScaOverals({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(OVERALSAnalysis).toHaveBeenCalled();
        // Verify that get_results was called (indicating successful constructor execution)
        expect(
            OVERALSAnalysis.mock.results[0].value.get_results
        ).toHaveBeenCalled();
    });

    // Add additional tests for other potential error cases

    test("should handle data type mismatches in constructor arguments", async () => {
        // Create a spy on console.log to capture error messages
        const consoleLogSpy = jest.spyOn(console, "log");

        // Setup test with incorrectly typed data
        const validConfig = createValidConfig();

        // Modify getSlicedData to return incorrect data type
        const { getSlicedData } = require("@/hooks/useVariable");
        getSlicedData.mockReturnValueOnce("invalid data type"); // String instead of expected array

        // Call the function (it should catch the error internally)
        await analyzeOptScaOverals({
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
        };

        // Call the function and expect it to throw
        await expect(
            analyzeOptScaOverals({
                configData: malformedConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow();

        // Verify the constructor was called with the malformed config
        expect(OVERALSAnalysis).toHaveBeenCalled();
    });
});

import { analyzeOptScaOverals } from "@/services/analyze/dimension-reduction/optimal-scaling/overals/optimal-scaling-overals-analysis";
import init, { OVERALSAnalysis } from "@/wasm/pkg/wasm";

// Mock the wasm init function
jest.mock("@/wasm/pkg/wasm", () => {
    const mockOVERALSAnalysis = jest.fn();
    mockOVERALSAnalysis.mockImplementation(
        (
            set_target_data,
            plots_target_data,
            set_target_data_defs,
            plots_target_data_defs,
            config_data
        ) => {
            // This implementation mimics the behavior of the actual Rust constructor
            // It will validate inputs and throw errors for invalid data

            // Check if set_target_variable is missing or empty
            if (
                !config_data?.main?.SetTargetVariable ||
                config_data.main.SetTargetVariable.length === 0 ||
                (Array.isArray(config_data.main.SetTargetVariable) &&
                    config_data.main.SetTargetVariable.every(
                        (set) => set.length === 0
                    ))
            ) {
                throw new Error(
                    "Set target variables must be selected for OVERALS analysis"
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
            SetTargetVariable: [
                ["var1", "var2"],
                ["var3", "var4"],
            ],
            PlotsTargetVariable: ["var5", "var6"],
            Dimensions: 2,
        },
        defineRangeScale: {
            Minimum: 1,
            Maximum: 10,
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
            SingMult: false,
            CategoryQuant: true,
            ObjScore: true,
            CategCoord: false,
            PlotObjScore: true,
            Compload: true,
            CategCentroid: false,
            Trans: false,
            SaveObjscore: true,
            UseRandconf: false,
            MaxIter: 100,
            Conv: 0.001,
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
        { name: "var6" },
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

    test("should throw error when SetTargetVariable is empty array", async () => {
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

    test("should throw error when SetTargetVariable contains only empty sets", async () => {
        // Setup invalid config with SetTargetVariable containing only empty arrays
        const invalidConfig = createValidConfig();
        invalidConfig.main.SetTargetVariable = [[], []];

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

        // Check that OVERALSAnalysis was called with the correct parameters
        expect(OVERALSAnalysis).toHaveBeenCalledWith(
            expect.any(Array), // slicedDataSets
            expect.any(Array), // slicedDataForPlotsTarget
            expect.any(Array), // varDefsSets
            expect.any(Array), // varDefsForPlotsTarget
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
            // Missing other required sections
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

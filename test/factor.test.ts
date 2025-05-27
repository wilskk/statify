import { analyzeFactor } from "@/services/analyze/dimension-reduction/factor/factor-analysis";
import init, { FactorAnalysis } from "@/wasm/pkg/wasm";

// Mock the wasm init function
jest.mock("@/wasm/pkg/wasm", () => {
    const mockFactorAnalysis = jest.fn();
    mockFactorAnalysis.mockImplementation(
        (
            target_data,
            value_target_data,
            target_data_defs,
            value_target_data_defs,
            config_data
        ) => {
            // This implementation mimics the behavior of the actual Rust constructor
            // It will validate inputs and throw errors for invalid data

            // Check if target variables are selected
            if (
                !config_data?.main?.TargetVar ||
                config_data.main.TargetVar.length === 0
            ) {
                throw new Error(
                    "No target variables selected for factor analysis"
                );
            }

            // Mock method implementations
            return {
                get_results: jest.fn().mockReturnValue({}),
                get_formatted_results: jest.fn().mockReturnValue({}),
                get_all_errors: jest.fn().mockReturnValue([]),
                clear_errors: jest.fn(),
            };
        }
    );

    return {
        __esModule: true,
        default: jest.fn().mockResolvedValue(true),
        FactorAnalysis: mockFactorAnalysis,
    };
});

// Mock utility functions from useVariable
jest.mock("@/hooks/useVariable", () => ({
    getSlicedData: jest.fn().mockReturnValue([]),
    getVarDefs: jest.fn().mockReturnValue([]),
}));

describe("Factor Analysis Constructor Error Handling", () => {
    // Helper function to create a minimal valid config
    const createValidConfig = () => ({
        main: {
            TargetVar: ["var1", "var2"],
            ValueTarget: "var3",
        },
        value: {
            Selection: "component",
        },
        descriptives: {
            UnivarDesc: true,
            InitialSol: true,
            Coefficient: true,
            SignificanceLvl: false,
            Determinant: true,
            KMO: true,
            Inverse: false,
            Reproduced: false,
            AntiImage: false,
        },
        extraction: {
            Method: "pca",
            Correlation: true,
            Covariance: false,
            Unrotated: true,
            Scree: true,
            Eigen: true,
            Factor: true,
            EigenVal: 1.0,
            MaxFactors: 5,
            MaxIter: 25,
        },
        rotation: {
            None: false,
            Quartimax: false,
            Varimax: true,
            Equimax: false,
            Oblimin: false,
            Promax: false,
            Delta: 0,
            Kappa: 4,
            RotatedSol: true,
            LoadingPlot: true,
            MaxIter: 25,
        },
        scores: {
            SaveVar: true,
            Regression: true,
            Bartlett: false,
            Anderson: false,
            DisplayFactor: true,
        },
        options: {
            ExcludeListWise: true,
            ExcludePairWise: false,
            ReplaceMean: false,
            SortSize: true,
            SuppressValues: false,
            SuppressValuesNum: 0.1,
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

    test("should throw error when TargetVar is missing", async () => {
        // Setup invalid config with missing TargetVar
        const invalidConfig = createValidConfig();
        invalidConfig.main.TargetVar = null;

        // Call the function and expect it to throw
        await expect(
            analyzeFactor({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("No target variables selected for factor analysis");

        // Verify the constructor was called with the invalid config
        expect(FactorAnalysis).toHaveBeenCalled();
    });

    test("should throw error when TargetVar is empty array", async () => {
        // Setup invalid config with empty TargetVar
        const invalidConfig = createValidConfig();
        invalidConfig.main.TargetVar = [];

        // Call the function and expect it to throw
        await expect(
            analyzeFactor({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("No target variables selected for factor analysis");

        // Verify the constructor was called with the invalid config
        expect(FactorAnalysis).toHaveBeenCalled();
    });

    test("should process valid configuration correctly", async () => {
        // Setup valid config
        const validConfig = createValidConfig();

        // Call the function
        await analyzeFactor({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(FactorAnalysis).toHaveBeenCalled();

        // Check that FactorAnalysis was called with the correct parameters
        expect(FactorAnalysis).toHaveBeenCalledWith(
            expect.any(Array), // slicedDataForTarget
            expect.any(Array), // slicedDataForValue
            expect.any(Array), // varDefsForTarget
            expect.any(Array), // varDefsForValue
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
        await analyzeFactor({
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
            analyzeFactor({
                configData: malformedConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow();

        // Verify the constructor was called with the malformed config
        expect(FactorAnalysis).toHaveBeenCalled();
    });
});

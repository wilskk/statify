import { analyzeVarianceComps } from "@/services/analyze/general-linear-model/variance-components/variance-components-analysis";
import init, { VarianceComponentsAnalysis } from "@/wasm/pkg/wasm";

// Mock the wasm init function
jest.mock("@/wasm/pkg/wasm", () => {
    const mockVarianceComponentsAnalysis = jest.fn();
    mockVarianceComponentsAnalysis.mockImplementation(
        (
            dependent_data,
            fix_factor_data,
            random_factor_data,
            covar_data,
            wls_data,
            dependent_data_defs,
            fix_factor_data_defs,
            random_factor_data_defs,
            covar_data_defs,
            wls_data_defs,
            config_data
        ) => {
            // This implementation mimics the behavior of the actual Rust constructor
            // It will validate inputs and throw errors for invalid data

            // Check if dependent variable is selected
            if (
                !config_data?.main?.dep_var ||
                config_data.main.dep_var.length === 0
            ) {
                throw new Error(
                    "A dependent variable must be selected for variance components analysis"
                );
            }

            // Check if at least one random factor is selected
            if (
                !config_data?.main?.rand_factor ||
                config_data.main.rand_factor.length === 0
            ) {
                throw new Error(
                    "At least one random factor must be selected for variance components analysis"
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
        VarianceComponentsAnalysis: mockVarianceComponentsAnalysis,
    };
});

// Mock utility functions from useVariable
jest.mock("@/hooks/useVariable", () => ({
    getSlicedData: jest.fn().mockReturnValue([]),
    getVarDefs: jest.fn().mockReturnValue([]),
}));

describe("Variance Components Analysis Constructor Error Handling", () => {
    // Helper function to create a minimal valid config
    const createValidConfig = () => ({
        main: {
            DepVar: "dependent1",
            FixFactor: ["factor1", "factor2"],
            RandFactor: ["random1"],
            Covar: ["covar1"],
            WlsWeight: "weight1",
        },
        model: {
            NonCust: true,
            Custom: false,
            BuildCustomTerm: false,
            FactorsVar: ["factor1", "factor2", "random1"],
            BuildTermMethod: "Enter",
            Intercept: true,
        },
        options: {
            Minque: true,
            Anova: false,
            MaxLikelihood: false,
            ResMaxLikelihood: false,
            Uniform: true,
            Zero: false,
            TypeI: true,
            TypeIII: false,
            ConvergenceMethod: "Default",
            MaxIter: 100,
            SumOfSquares: true,
            ExpectedMeanSquares: true,
            IterationHistory: false,
            InStepsOf: 1,
        },
        save: {
            VarCompEst: true,
            CompCovar: false,
            CovMatrix: false,
            CorMatrix: false,
            CreateNewDataset: false,
            DatasetName: null,
            WriteNewDataFile: false,
            FilePath: null,
        },
    });

    // Setup mock for analysis function dependencies
    const mockAddLog = jest.fn().mockResolvedValue(1);
    const mockAddAnalytic = jest.fn().mockResolvedValue(1);
    const mockAddStatistic = jest.fn().mockResolvedValue(1);
    const mockVariables = [
        { name: "dependent1" },
        { name: "factor1" },
        { name: "factor2" },
        { name: "random1" },
        { name: "covar1" },
        { name: "weight1" },
    ];
    const mockDataVariables = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10, 11, 12],
        [13, 14, 15],
        [16, 17, 18],
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should throw error when dependent variable is missing", async () => {
        // Setup invalid config with missing dependent variable
        const invalidConfig = createValidConfig();
        invalidConfig.main.DepVar = null;

        // Call the function and expect it to throw
        await expect(
            analyzeVarianceComps({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "A dependent variable must be selected for variance components analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(VarianceComponentsAnalysis).toHaveBeenCalled();

        // Setup another invalid config with empty dependent variable
        const invalidConfig2 = createValidConfig();
        invalidConfig2.main.DepVar = "";

        // Call the function and expect it to throw
        await expect(
            analyzeVarianceComps({
                configData: invalidConfig2,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "A dependent variable must be selected for variance components analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(VarianceComponentsAnalysis).toHaveBeenCalled();
    });

    test("should throw error when random factor is missing", async () => {
        // Setup invalid config with missing random factor
        const invalidConfig = createValidConfig();
        invalidConfig.main.RandFactor = null;

        // Call the function and expect it to throw
        await expect(
            analyzeVarianceComps({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "At least one random factor must be selected for variance components analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(VarianceComponentsAnalysis).toHaveBeenCalled();

        // Setup another invalid config with empty random factor array
        const invalidConfig2 = createValidConfig();
        invalidConfig2.main.RandFactor = [];

        // Call the function and expect it to throw
        await expect(
            analyzeVarianceComps({
                configData: invalidConfig2,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "At least one random factor must be selected for variance components analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(VarianceComponentsAnalysis).toHaveBeenCalled();
    });

    test("should process valid configuration correctly", async () => {
        // Setup valid config
        const validConfig = createValidConfig();

        // Call the function
        await analyzeVarianceComps({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(VarianceComponentsAnalysis).toHaveBeenCalled();

        // Check that VarianceComponentsAnalysis was called with the correct parameters
        expect(VarianceComponentsAnalysis).toHaveBeenCalledWith(
            expect.any(Array), // dependent_data
            expect.any(Array), // fix_factor_data
            expect.any(Array), // random_factor_data
            expect.any(Array), // covar_data
            expect.any(Array), // wls_data
            expect.any(Array), // dependent_data_defs
            expect.any(Array), // fix_factor_data_defs
            expect.any(Array), // random_factor_data_defs
            expect.any(Array), // covar_data_defs
            expect.any(Array), // wls_data_defs
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
        await analyzeVarianceComps({
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
            analyzeVarianceComps({
                configData: malformedConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow();

        // Verify the constructor was called with the malformed config
        expect(VarianceComponentsAnalysis).toHaveBeenCalled();
    });
});

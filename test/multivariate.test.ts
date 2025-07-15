import { analyzeMultivariate } from "@/services/analyze/general-linear-model/multivariate/multivariate-analysis";
import init, { MultivariateAnalysis } from "@/wasm/pkg/wasm";

// Mock the wasm init function
jest.mock("@/wasm/pkg/wasm", () => {
    const mockMultivariateAnalysis = jest.fn();
    mockMultivariateAnalysis.mockImplementation(
        (
            dep_data,
            fix_factor_data,
            covar_data,
            wls_data,
            dep_data_defs,
            fix_factor_data_defs,
            covar_data_defs,
            wls_data_defs,
            config_data
        ) => {
            // This implementation mimics the behavior of the actual Rust constructor
            // It will validate inputs and throw errors for invalid data

            // Check if dependent variable is selected for univariate analysis
            if (
                !config_data?.main?.DepVar ||
                config_data.main.DepVar.length === 0
            ) {
                throw new Error(
                    "Dependent variable must be selected for univariate analysis"
                );
            }

            // Validate model configuration
            if (
                !config_data?.model?.NonCust &&
                !config_data?.model?.Custom &&
                !config_data?.model?.BuildCustomTerm
            ) {
                throw new Error("Model specification method must be selected");
            }

            // Validate fixed factors if using post-hoc tests
            if (
                config_data?.posthoc?.SrcList &&
                config_data.posthoc.SrcList.length > 0
            ) {
                if (
                    !config_data?.main?.FixFactor ||
                    config_data.main.FixFactor.length === 0
                ) {
                    throw new Error(
                        "Fixed factors must be specified for post-hoc tests"
                    );
                }
            }

            // Validate bootstrap settings
            if (config_data?.bootstrap?.PerformBootStrapping) {
                if (
                    config_data.bootstrap.Stratified &&
                    (!config_data.bootstrap.StrataVariables ||
                        config_data.bootstrap.StrataVariables.length === 0)
                ) {
                    throw new Error(
                        "Strata variables must be specified for stratified bootstrap"
                    );
                }
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
        MultivariateAnalysis: mockMultivariateAnalysis,
    };
});

// Mock utility functions from useVariable
jest.mock("@/hooks/useVariable", () => ({
    getSlicedData: jest.fn().mockReturnValue([]),
    getVarDefs: jest.fn().mockReturnValue([]),
}));

describe("Multivariate Analysis Constructor Error Handling", () => {
    // Helper function to create a minimal valid config
    const createValidConfig = () => ({
        main: {
            DepVar: ["var1", "var2"],
            FixFactor: ["factor1", "factor2"],
            Covar: ["covar1"],
            WlsWeight: "weight1",
        },
        model: {
            NonCust: true,
            Custom: false,
            BuildCustomTerm: false,
            FactorsVar: ["factor1", "factor2"],
            BuildTermMethod: "Enter",
            FactorsModel: null,
            TermsVar: null,
            CovModel: null,
            RandomModel: null,
            TermText: null,
            SumOfSquareMethod: "Type III",
            Intercept: true,
        },
        contrast: {
            FactorList: null,
            ContrastMethod: null,
            Last: false,
            First: false,
        },
        plots: {
            SrcList: null,
            AxisList: null,
            LineList: null,
            PlotList: null,
            FixFactorVars: null,
            RandFactorVars: null,
            LineChartType: true,
            BarChartType: false,
            IncludeErrorBars: false,
            ConfidenceInterval: true,
            StandardError: false,
            Multiplier: 95,
            IncludeRefLineForGrandMean: false,
            YAxisStart0: true,
        },
        posthoc: {
            SrcList: [],
            FixFactorVars: null,
            Lsd: false,
            Bonfe: false,
            Sidak: false,
            Scheffe: false,
            Regwf: false,
            Regwq: false,
            Snk: false,
            Tu: false,
            Tub: false,
            Dun: false,
            Hoc: false,
            Gabriel: false,
            Waller: false,
            ErrorRatio: null,
            Dunnett: false,
            CategoryMethod: null,
            Twosided: true,
            LtControl: false,
            GtControl: false,
            Tam: false,
            Dunt: false,
            Games: false,
            Dunc: false,
        },
        emmeans: {
            SrcList: null,
            TargetList: null,
            CompMainEffect: false,
            ConfiIntervalMethod: null,
        },
        save: {
            ResWeighted: false,
            PreWeighted: false,
            StdStatistics: false,
            CooksD: false,
            Leverage: false,
            UnstandardizedRes: false,
            WeightedRes: false,
            StandardizedRes: false,
            StudentizedRes: false,
            DeletedRes: false,
            CoeffStats: false,
            NewDataSet: false,
            DatasetName: null,
            WriteNewDataSet: false,
            FilePath: null,
        },
        options: {
            DescStats: true,
            EstEffectSize: false,
            ObsPower: false,
            ParamEst: false,
            SscpMat: false,
            ResSscpMat: false,
            HomogenTest: true,
            SprVsLevel: false,
            ResPlot: false,
            LackOfFit: false,
            GeneralFun: false,
            SigLevel: 0.05,
            CoefficientMatrix: false,
            TransformMat: false,
        },
        bootstrap: {
            PerformBootStrapping: false,
            NumOfSamples: 1000,
            Seed: false,
            SeedValue: null,
            Level: 95,
            Percentile: true,
            BCa: false,
            Simple: true,
            Stratified: false,
            Variables: null,
            StrataVariables: null,
        },
    });

    // Setup mock for analysis function dependencies
    const mockAddLog = jest.fn().mockResolvedValue(1);
    const mockAddAnalytic = jest.fn().mockResolvedValue(1);
    const mockAddStatistic = jest.fn().mockResolvedValue(1);
    const mockVariables = [
        { name: "var1" },
        { name: "var2" },
        { name: "factor1" },
        { name: "factor2" },
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
            analyzeMultivariate({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "Dependent variable must be selected for univariate analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(MultivariateAnalysis).toHaveBeenCalled();

        // Setup another invalid config with empty dependent variable array
        const invalidConfig2 = createValidConfig();
        invalidConfig2.main.DepVar = [];

        // Call the function and expect it to throw
        await expect(
            analyzeMultivariate({
                configData: invalidConfig2,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "Dependent variable must be selected for univariate analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(MultivariateAnalysis).toHaveBeenCalled();
    });

    test("should throw error when model specification method is not selected", async () => {
        // Setup invalid config with all model specification methods set to false
        const invalidConfig = createValidConfig();
        invalidConfig.model.NonCust = false;
        invalidConfig.model.Custom = false;
        invalidConfig.model.BuildCustomTerm = false;

        // Call the function and expect it to throw
        await expect(
            analyzeMultivariate({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("Model specification method must be selected");

        // Verify the constructor was called with the invalid config
        expect(MultivariateAnalysis).toHaveBeenCalled();
    });

    test("should throw error when fixed factors are not specified for post-hoc tests", async () => {
        // Setup invalid config with post-hoc SrcList but no fixed factors
        const invalidConfig = createValidConfig();
        invalidConfig.posthoc.SrcList = ["factor1"];
        invalidConfig.main.FixFactor = [];

        // Call the function and expect it to throw
        await expect(
            analyzeMultivariate({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("Fixed factors must be specified for post-hoc tests");

        // Verify the constructor was called with the invalid config
        expect(MultivariateAnalysis).toHaveBeenCalled();

        // Setup another invalid config with post-hoc SrcList but null fixed factors
        const invalidConfig2 = createValidConfig();
        invalidConfig2.posthoc.SrcList = ["factor1"];
        invalidConfig2.main.FixFactor = null;

        // Call the function and expect it to throw
        await expect(
            analyzeMultivariate({
                configData: invalidConfig2,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("Fixed factors must be specified for post-hoc tests");

        // Verify the constructor was called with the invalid config
        expect(MultivariateAnalysis).toHaveBeenCalled();
    });

    test("should throw error when strata variables are not specified for stratified bootstrap", async () => {
        // Setup invalid config with stratified bootstrap but no strata variables
        const invalidConfig = createValidConfig();
        invalidConfig.bootstrap.PerformBootStrapping = true;
        invalidConfig.bootstrap.Stratified = true;
        invalidConfig.bootstrap.StrataVariables = [];

        // Call the function and expect it to throw
        await expect(
            analyzeMultivariate({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "Strata variables must be specified for stratified bootstrap"
        );

        // Verify the constructor was called with the invalid config
        expect(MultivariateAnalysis).toHaveBeenCalled();

        // Setup another invalid config with stratified bootstrap but null strata variables
        const invalidConfig2 = createValidConfig();
        invalidConfig2.bootstrap.PerformBootStrapping = true;
        invalidConfig2.bootstrap.Stratified = true;
        invalidConfig2.bootstrap.StrataVariables = null;

        // Call the function and expect it to throw
        await expect(
            analyzeMultivariate({
                configData: invalidConfig2,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "Strata variables must be specified for stratified bootstrap"
        );

        // Verify the constructor was called with the invalid config
        expect(MultivariateAnalysis).toHaveBeenCalled();
    });

    test("should process valid configuration correctly", async () => {
        // Setup valid config
        const validConfig = createValidConfig();

        // Call the function
        await analyzeMultivariate({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(MultivariateAnalysis).toHaveBeenCalled();

        // Check that MultivariateAnalysis was called with the correct parameters
        expect(MultivariateAnalysis).toHaveBeenCalledWith(
            expect.any(Array), // slicedDataForDependent
            expect.any(Array), // slicedDataForFixFactor
            expect.any(Array), // slicedDataForCovariate
            expect.any(Array), // slicedDataForWlsWeight
            expect.any(Array), // varDefsForDependent
            expect.any(Array), // varDefsForFixFactor
            expect.any(Array), // varDefsForCovariate
            expect.any(Array), // varDefsForWlsWeight
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
        await analyzeMultivariate({
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
            analyzeMultivariate({
                configData: malformedConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow();

        // Verify the constructor was called with the malformed config
        expect(MultivariateAnalysis).toHaveBeenCalled();
    });
});

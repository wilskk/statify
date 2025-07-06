import { analyzeUnivariate } from "@/services/analyze/general-linear-model/univariate/univariate-analysis";
import init, { UnivariateAnalysis } from "@/wasm/pkg/wasm";

// Mock the wasm init function
jest.mock("@/wasm/pkg/wasm", () => {
    const mockUnivariateAnalysis = jest.fn();
    mockUnivariateAnalysis.mockImplementation(
        (
            dep_data,
            fix_factor_data,
            rand_factor_data,
            covar_data,
            wls_data,
            dep_data_defs,
            fix_factor_data_defs,
            rand_factor_data_defs,
            covar_data_defs,
            wls_data_defs,
            config_data
        ) => {
            // This implementation mimics the behavior of the actual Rust constructor
            // It will validate inputs and throw errors for invalid data

            // Check if dependent variable is selected
            if (!config_data?.main?.DepVar) {
                throw new Error(
                    "Dependent variable must be selected for univariate analysis"
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
        UnivariateAnalysis: mockUnivariateAnalysis,
    };
});

// Mock utility functions from useVariable
jest.mock("@/hooks/useVariable", () => ({
    getSlicedData: jest.fn().mockReturnValue([]),
    getVarDefs: jest.fn().mockReturnValue([]),
}));

describe("Univariate Analysis Constructor Error Handling", () => {
    // Helper function to create a minimal valid config
    const createValidConfig = () => ({
        main: {
            DepVar: "dependent1",
            FixFactor: ["factor1", "factor2"],
            RandFactor: null,
            Covar: null,
            WlsWeight: null,
        },
        model: {
            NonCust: true,
            Custom: false,
            BuildCustomTerm: false,
            FactorsVar: ["factor1", "factor2"],
            TermsVar: null,
            FactorsModel: null,
            CovModel: null,
            RandomModel: null,
            BuildTermMethod: null,
            TermText: null,
            SumOfSquareMethod: "Type III",
            Intercept: true,
        },
        contrast: {
            FactorList: null,
            ContrastMethod: null,
            Last: true,
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
            IncludeErrorBars: true,
            ConfidenceInterval: true,
            StandardError: false,
            Multiplier: 2,
            IncludeRefLineForGrandMean: false,
            YAxisStart0: true,
        },
        posthoc: {
            SrcList: null,
            FixFactorVars: null,
            ErrorRatio: null,
            Twosided: true,
            LtControl: false,
            GtControl: false,
            CategoryMethod: null,
            Waller: false,
            Dunnett: false,
            Lsd: true,
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
            Tam: false,
            Dunt: false,
            Games: false,
            Dunc: false,
        },
        emmeans: {
            SrcList: null,
            TargetList: null,
            CompMainEffect: true,
            ConfiIntervalMethod: null,
        },
        save: {
            ResWeighted: false,
            PreWeighted: false,
            StdStatistics: true,
            CooksD: false,
            Leverage: false,
            UnstandardizedRes: true,
            WeightedRes: false,
            StandardizedRes: false,
            StudentizedRes: false,
            DeletedRes: false,
            CoeffStats: true,
            StandardStats: true,
            Heteroscedasticity: false,
            NewDataSet: false,
            FilePath: null,
            DatasetName: null,
            WriteNewDataSet: false,
        },
        options: {
            DescStats: true,
            HomogenTest: true,
            EstEffectSize: true,
            SprVsLevel: false,
            ObsPower: true,
            ResPlot: false,
            ParamEst: true,
            LackOfFit: false,
            TransformMat: false,
            GeneralFun: false,
            ModBruschPagan: false,
            FTest: true,
            BruschPagan: false,
            WhiteTest: false,
            ParamEstRobStdErr: false,
            HC0: false,
            HC1: false,
            HC2: false,
            HC3: false,
            HC4: false,
            CoefficientMatrix: true,
            SigLevel: 0.05,
        },
        bootstrap: {
            PerformBootStrapping: false,
            NumOfSamples: 1000,
            Seed: false,
            SeedValue: 2000000,
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
        { name: "dependent1" },
        { name: "factor1" },
        { name: "factor2" },
    ];
    const mockDataVariables = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
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
            analyzeUnivariate({
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
        expect(UnivariateAnalysis).toHaveBeenCalled();
    });

    test("should process valid configuration correctly", async () => {
        // Setup valid config
        const validConfig = createValidConfig();

        // Call the function
        await analyzeUnivariate({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(UnivariateAnalysis).toHaveBeenCalled();

        // Check that UnivariateAnalysis was called with the correct parameters
        expect(UnivariateAnalysis).toHaveBeenCalledWith(
            expect.any(Array), // slicedDataForDependent
            expect.any(Array), // slicedDataForFixFactor
            expect.any(Array), // slicedDataForRandomFactor
            expect.any(Array), // slicedDataForCovariate
            expect.any(Array), // slicedDataForWlsWeight
            expect.any(Array), // varDefsForDependent
            expect.any(Array), // varDefsForFixFactor
            expect.any(Array), // varDefsForRandomFactor
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
        await analyzeUnivariate({
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
            main: {}, // Missing DepVar property
            // Missing other required sections
        };

        // Call the function and expect it to throw
        await expect(
            analyzeUnivariate({
                configData: malformedConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "Dependent variable must be selected for univariate analysis"
        );

        // Verify the constructor was called with the malformed config
        expect(UnivariateAnalysis).toHaveBeenCalled();
    });
});

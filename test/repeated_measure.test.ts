import { analyzeRepeatedMeasures } from "@/services/analyze/general-linear-model/repeated-measures/repeated-measures-analysis";
import init, { RepeatedMeasureAnalysis } from "@/wasm/pkg/wasm";

// Mock the wasm init function
jest.mock("@/wasm/pkg/wasm", () => {
    const mockRepeatedMeasureAnalysis = jest.fn();
    mockRepeatedMeasureAnalysis.mockImplementation(
        (
            subject_data,
            factors_data,
            covar_data,
            subject_data_defs,
            factors_data_defs,
            covar_data_defs,
            config_data
        ) => {
            // This implementation mimics the behavior of the actual Rust constructor
            // It will validate inputs and throw errors for invalid data

            // Check if subject variable is selected for repeated measures analysis
            if (
                !config_data?.main?.sub_var ||
                config_data.main.sub_var.length === 0
            ) {
                throw new Error(
                    "At least one subject variable must be selected for repeated measures analysis"
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
        RepeatedMeasureAnalysis: mockRepeatedMeasureAnalysis,
    };
});

// Mock utility functions from useVariable
jest.mock("@/hooks/useVariable", () => ({
    getSlicedData: jest.fn().mockReturnValue([]),
    getVarDefs: jest.fn().mockReturnValue([]),
}));

describe("Repeated Measures Analysis Constructor Error Handling", () => {
    // Helper function to create a minimal valid config
    const createValidConfig = () => ({
        main: {
            sub_var: ["subject1", "subject2"],
            factors_var: ["factor1", "factor2"],
            covariates: ["covar1"],
        },
        model: {
            NonCust: true,
            Custom: false,
            BuildCustomTerm: false,
            BetSubVar: ["subject1", "subject2"],
            BetSubModel: null,
            WithSubVar: "factor1",
            WithSubModel: null,
            DefFactors: null,
            BetFactors: null,
            CovModel: null,
            BuildTermMethod: "Enter",
            SumOfSquareMethod: "Type III",
            TermText: null,
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
            IncludeRefLineForGrandMean: false,
            YAxisStart0: true,
            Multiplier: 95,
        },
        posthoc: {
            SrcList: [],
            FixFactorVars: null,
            ErrorRatio: null,
            Twosided: true,
            LtControl: false,
            GtControl: false,
            CategoryMethod: null,
            Waller: false,
            Dunnett: false,
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
            FilePath: null,
            DatasetName: null,
            WriteNewDataSet: false,
        },
        options: {
            DescStats: true,
            HomogenTest: true,
            EstEffectSize: false,
            SprVsLevel: false,
            ObsPower: false,
            ResPlot: false,
            ParamEst: false,
            LackOfFit: false,
            SscpMat: false,
            GeneralFun: false,
            ResSscpMat: false,
            CoefficientMatrix: false,
            TransformMat: false,
            SigLevel: 0.05,
        },
    });

    // Setup mock for analysis function dependencies
    const mockAddLog = jest.fn().mockResolvedValue(1);
    const mockAddAnalytic = jest.fn().mockResolvedValue(1);
    const mockAddStatistic = jest.fn().mockResolvedValue(1);
    const mockVariables = [
        { name: "subject1" },
        { name: "subject2" },
        { name: "factor1" },
        { name: "factor2" },
        { name: "covar1" },
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

    test("should throw error when subject variable is missing", async () => {
        // Setup invalid config with missing subject variable
        const invalidConfig = createValidConfig();
        invalidConfig.main.sub_var = null;

        // Call the function and expect it to throw
        await expect(
            analyzeRepeatedMeasures({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "At least one subject variable must be selected for repeated measures analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(RepeatedMeasureAnalysis).toHaveBeenCalled();

        // Setup another invalid config with empty subject variable array
        const invalidConfig2 = createValidConfig();
        invalidConfig2.main.sub_var = [];

        // Call the function and expect it to throw
        await expect(
            analyzeRepeatedMeasures({
                configData: invalidConfig2,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "At least one subject variable must be selected for repeated measures analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(RepeatedMeasureAnalysis).toHaveBeenCalled();
    });

    test("should process valid configuration correctly", async () => {
        // Setup valid config
        const validConfig = createValidConfig();

        // Call the function
        await analyzeRepeatedMeasures({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(RepeatedMeasureAnalysis).toHaveBeenCalled();

        // Check that RepeatedMeasureAnalysis was called with the correct parameters
        expect(RepeatedMeasureAnalysis).toHaveBeenCalledWith(
            expect.any(Array), // slicedDataForSubject
            expect.any(Array), // slicedDataForFactors
            expect.any(Array), // slicedDataForCovariate
            expect.any(Array), // varDefsForSubject
            expect.any(Array), // varDefsForFactors
            expect.any(Array), // varDefsForCovariate
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
        await analyzeRepeatedMeasures({
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
            analyzeRepeatedMeasures({
                configData: malformedConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "At least one subject variable must be selected for repeated measures analysis"
        );

        // Verify the constructor was called with the malformed config
        expect(RepeatedMeasureAnalysis).toHaveBeenCalled();
    });

    test("should handle parsing errors for data inputs", async () => {
        // Setup valid config
        const validConfig = createValidConfig();

        // Set up RepeatedMeasureAnalysis to throw a parsing error
        RepeatedMeasureAnalysis.mockImplementationOnce(() => {
            throw new Error("Failed to parse subject data");
        });

        // Call the function and expect it to throw
        await expect(
            analyzeRepeatedMeasures({
                configData: validConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("Failed to parse subject data");

        // Verify the constructor was called
        expect(RepeatedMeasureAnalysis).toHaveBeenCalled();
    });
});

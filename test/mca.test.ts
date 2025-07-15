import { analyzeOptScaMCA } from "@/services/analyze/dimension-reduction/optimal-scaling/mca/optimal-scaling-mca-analysis";
import init, { MultipleCorrespondenceAnalysis } from "@/wasm/pkg/wasm";

// Mock the wasm init function
jest.mock("@/wasm/pkg/wasm", () => {
    const mockMultipleCorrespondenceAnalysis = jest.fn();
    mockMultipleCorrespondenceAnalysis.mockImplementation(
        (
            analysis_data,
            supplement_data,
            labeling_data,
            analysis_data_defs,
            supplement_data_defs,
            labeling_data_defs,
            config_data
        ) => {
            // This implementation mimics the behavior of the actual Rust constructor
            // It will validate inputs and throw errors for invalid data

            // Check if analysis variables are selected
            if (
                !config_data?.main?.AnalysisVars ||
                config_data.main.AnalysisVars.length === 0
            ) {
                throw new Error(
                    "At least one analysis variable must be selected for MCA"
                );
            }

            // Check if dimensions is greater than 0
            if (
                !config_data?.main?.Dimensions ||
                config_data.main.Dimensions <= 0
            ) {
                throw new Error("Number of dimensions must be greater than 0");
            }

            // Mock method implementations
            return {
                get_results: jest.fn().mockReturnValue({}),
                get_executed_functions: jest.fn().mockReturnValue([]),
                get_all_errors: jest.fn().mockReturnValue([]),
                clear_errors: jest.fn(),
            };
        }
    );

    return {
        __esModule: true,
        default: jest.fn().mockResolvedValue(true),
        MultipleCorrespondenceAnalysis: mockMultipleCorrespondenceAnalysis,
    };
});

// Mock utility functions from useVariable
jest.mock("@/hooks/useVariable", () => ({
    getSlicedData: jest.fn().mockReturnValue([]),
    getVarDefs: jest.fn().mockReturnValue([]),
}));

describe("MultipleCorrespondenceAnalysis Constructor Error Handling", () => {
    // Helper function to create a minimal valid config
    const createValidConfig = () => ({
        main: {
            AnalysisVars: ["var1", "var2"],
            SuppleVars: ["var3"],
            LabelingVars: ["var4"],
            Dimensions: 2,
        },
        defineVariable: {
            VariableWeight: 1,
        },
        discretize: {
            VariablesList: null,
            Method: null,
            NumberOfCategories: false,
            NumberOfCategoriesValue: null,
            DistributionNormal: false,
            DistributionUniform: false,
            EqualIntervals: false,
            EqualIntervalsValue: null,
        },
        missing: {
            CurrentTargetList: null,
            AnalysisVariables: null,
            SupplementaryVariables: null,
            MissingValuesExclude: true,
            ExcludeMode: true,
            ExcludeExtraCat: false,
            ExcludeRandomCat: false,
            MissingValuesImpute: false,
            ImputeMode: false,
            ImputeExtraCat: false,
            ImputeRandomCat: false,
            ExcludeObjects: true,
        },
        options: {
            RangeOfCases: false,
            First: null,
            Last: null,
            SingleCase: false,
            SingleCaseValue: null,
            NormalizationMethod: "Variable Principal",
            NormCustomValue: null,
            Convergence: 0.00001,
            MaximumIterations: 100,
            VariableLabels: true,
            LimitForLabel: 20,
            VariableNames: false,
            PlotDimDisplayAll: true,
            PlotDimRestrict: false,
            PlotDimLoDim: null,
            PlotDimHiDim: null,
            ConfigurationMethod: null,
            ConfigFile: null,
            None: true,
            Varimax: false,
            Oblimin: false,
            DeltaFloat: null,
            Quartimax: false,
            Equimax: false,
            Promax: false,
            KappaFloat: null,
            Kaiser: false,
        },
        output: {
            QuantifiedVars: null,
            LabelingVars: null,
            CatQuantifications: null,
            DescStats: null,
            ObjScoresIncludeCat: null,
            ObjScoresLabelBy: null,
            ObjectScores: true,
            DiscMeasures: true,
            IterationHistory: false,
            CorreOriginalVars: false,
            CorreTransVars: false,
        },
        save: {
            Discretized: false,
            DiscNewdata: false,
            DiscDataset: null,
            DiscWriteNewdata: false,
            DiscretizedFile: null,
            SaveTrans: false,
            Trans: false,
            TransNewdata: false,
            TransDataset: null,
            TransWriteNewdata: false,
            TransformedFile: null,
            SaveObjScores: false,
            ObjScores: false,
            ObjNewdata: false,
            ObjDataset: null,
            ObjWriteNewdata: false,
            ObjScoresFile: null,
            All: false,
            First: false,
            MultiNomDim: null,
        },
        objectPlots: {
            ObjectPoints: true,
            Biplot: false,
            BTIncludeAllVars: false,
            BTIncludeSelectedVars: false,
            BTAvailableVars: null,
            BTSelectedVars: null,
            LabelObjLabelByCaseNumber: true,
            LabelObjLabelByVar: false,
            LabelObjAvailableVars: null,
            LabelObjSelectedVars: null,
        },
        variablePlots: {
            DimensionsForMultiNom: null,
            SourceVar: null,
            CatPlotsVar: null,
            JointCatPlotsVar: null,
            TransPlotsVar: null,
            InclResidPlots: false,
            DiscMeasuresVar: null,
            DisplayPlot: true,
            UseAllVars: true,
            UseSelectedVars: false,
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
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10, 11, 12],
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should throw error when AnalysisVars are missing or empty", async () => {
        // Setup invalid config with missing AnalysisVars
        const invalidConfig = createValidConfig();
        invalidConfig.main.AnalysisVars = null;

        // Call the function and expect it to throw
        await expect(
            analyzeOptScaMCA({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "At least one analysis variable must be selected for MCA"
        );

        // Verify the constructor was called with the invalid config
        expect(MultipleCorrespondenceAnalysis).toHaveBeenCalled();

        // Setup another invalid config with empty AnalysisVars array
        const invalidConfig2 = createValidConfig();
        invalidConfig2.main.AnalysisVars = [];

        // Call the function and expect it to throw
        await expect(
            analyzeOptScaMCA({
                configData: invalidConfig2,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "At least one analysis variable must be selected for MCA"
        );

        // Verify the constructor was called with the invalid config
        expect(MultipleCorrespondenceAnalysis).toHaveBeenCalledTimes(2);
    });

    test("should throw error when Dimensions is missing or not positive", async () => {
        // Setup invalid config with missing Dimensions
        const invalidConfig = createValidConfig();
        invalidConfig.main.Dimensions = null;

        // Call the function and expect it to throw
        await expect(
            analyzeOptScaMCA({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("Number of dimensions must be greater than 0");

        // Verify the constructor was called with the invalid config
        expect(MultipleCorrespondenceAnalysis).toHaveBeenCalled();

        // Setup another invalid config with zero dimensions
        const invalidConfig2 = createValidConfig();
        invalidConfig2.main.Dimensions = 0;

        // Call the function and expect it to throw
        await expect(
            analyzeOptScaMCA({
                configData: invalidConfig2,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("Number of dimensions must be greater than 0");

        // Verify the constructor was called with the invalid config
        expect(MultipleCorrespondenceAnalysis).toHaveBeenCalledTimes(2);
    });

    test("should process valid configuration correctly", async () => {
        // Setup valid config
        const validConfig = createValidConfig();

        // Call the function
        await analyzeOptScaMCA({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(MultipleCorrespondenceAnalysis).toHaveBeenCalled();

        // Check that MultipleCorrespondenceAnalysis was called with the correct parameters
        expect(MultipleCorrespondenceAnalysis).toHaveBeenCalledWith(
            expect.any(Array), // slicedDataForAnalysis
            expect.any(Array), // slicedDataForSupplement
            expect.any(Array), // slicedDataForLabeling
            expect.any(Array), // varDefsForAnalysis
            expect.any(Array), // varDefsForSupplement
            expect.any(Array), // varDefsForLabeling
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

        // Call the function - let's catch the error for this test
        try {
            await analyzeOptScaMCA({
                configData: validConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            });
        } catch (error) {
            // Expected to fail
        }

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
            analyzeOptScaMCA({
                configData: malformedConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow();

        // Verify the constructor was called with the malformed config
        expect(MultipleCorrespondenceAnalysis).toHaveBeenCalled();
    });
});

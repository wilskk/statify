import { analyzeOptScaCatpca } from "@/services/analyze/dimension-reduction/optimal-scaling/catpca/optimal-scaling-catpca-analysis";
import init, { OptimalScalingCatpca } from "@/wasm/pkg/wasm";

// Mock the wasm init function
jest.mock("@/wasm/pkg/wasm", () => {
    const mockOptimalScalingCatpca = jest.fn();
    mockOptimalScalingCatpca.mockImplementation(
        (
            analysis_data,
            supplement_data,
            labeling_data,
            config_data,
            analysis_data_defs,
            supplement_data_defs,
            labeling_data_defs
        ) => {
            // This implementation mimics the behavior of the actual Rust constructor
            // It will validate inputs and throw errors for invalid data

            // Check if analysis variables are selected
            if (
                !config_data?.main?.analysis_vars ||
                config_data.main.analysis_vars.length === 0
            ) {
                throw new Error(
                    "At least one analysis variable must be selected"
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
        OptimalScalingCatpca: mockOptimalScalingCatpca,
    };
});

// Mock utility functions from useVariable
jest.mock("@/hooks/useVariable", () => ({
    getSlicedData: jest.fn().mockReturnValue([]),
    getVarDefs: jest.fn().mockReturnValue([]),
}));

describe("OptimalScalingCatpca Analysis Constructor Error Handling", () => {
    // Helper function to create a minimal valid config
    const createValidConfig = () => ({
        main: {
            analysis_vars: ["var1", "var2"],
            supple_vars: ["var3"],
            labeling_vars: ["var4"],
            dimensions: 2,
        },
        defineRangeScale: {
            weight: 1,
            splineOrdinal: false,
            splineNominal: false,
            multipleNominal: false,
            ordinal: true,
            nominal: false,
            numeric: false,
            degree: 2,
            interiorKnots: 2,
        },
        defineScale: {
            splineOrdinal: false,
            splineNominal: false,
            multipleNominal: false,
            ordinal: true,
            nominal: false,
            numeric: false,
            degree: 2,
            interiorKnots: 2,
        },
        discretize: {
            variablesList: [],
            method: null,
            numberOfCategories: false,
            numberOfCategoriesValue: null,
            distributionNormal: false,
            distributionUniform: false,
            equalIntervals: false,
            equalIntervalsValue: null,
        },
        missing: {
            currentTargetList: [],
            analysisVariables: [],
            supplementaryVariables: [],
            missingValuesExclude: true,
            excludeMode: false,
            excludeExtraCat: false,
            excludeRandomCat: false,
            missingValuesImpute: false,
            imputeMode: false,
            imputeExtraCat: false,
            imputeRandomCat: false,
            excludeObjects: false,
        },
        options: {
            rangeOfCases: false,
            first: null,
            last: null,
            singleCase: false,
            singleCaseValue: null,
            normalizationMethod: "Variable Principal",
            normCustomValue: null,
            convergence: 0.00001,
            maximumIterations: 100,
            variableLabels: true,
            limitForLabel: 25,
            variableNames: false,
            plotDimDisplayAll: true,
            plotDimRestrict: false,
            plotDimLoDim: null,
            plotDimHiDim: null,
            configurationMethod: null,
            configFile: null,
            none: true,
            varimax: false,
            oblimin: false,
            delta: null,
            quartimax: false,
            equimax: false,
            promax: false,
            kappa: null,
            kaiser: false,
        },
        output: {
            objectScores: true,
            componentLoadings: true,
            sortBySize: true,
            iterationHistory: false,
            correOriginalVars: false,
            correTransVars: false,
            variance: true,
            quantifiedVars: [],
            labelingVars: [],
            catQuantifications: [],
            descStats: [],
            objScoresIncludeCat: [],
            objScoresLabelBy: [],
        },
        save: {
            discretized: false,
            discNewdata: false,
            discDataset: null,
            discWriteNewdata: false,
            discretizedFile: null,
            saveTrans: false,
            trans: false,
            transNewdata: false,
            transDataset: null,
            transWriteNewdata: false,
            transformedFile: null,
            saveObjScores: false,
            objScores: false,
            objNewdata: false,
            objDataset: null,
            objWriteNewdata: false,
            objScoresFile: null,
            saveApprox: false,
            approx: false,
            approxNewdata: false,
            approxDataset: null,
            approxWriteNewdata: false,
            approximationsFile: null,
            btLoading: false,
            btObject: false,
            btCategories: false,
            btEllipseCoord: false,
            btNewDataset: false,
            btDatasetName: null,
            btWriteDataFile: false,
            btFileText: null,
            all: false,
            first: false,
            multiNomDim: null,
        },
        bootstrap: {
            performBT: false,
            balanced: false,
            unbalanced: false,
            numberSamples: null,
            confLevel: null,
            procrustes: false,
            reflection: false,
            thresholdLoading: null,
            thresholdObject: null,
            thresholdCategory: null,
            operatorLoading: null,
            operatorObject: null,
            operatorCategory: null,
            valueLoading: null,
            valueObject: null,
            valueCategory: null,
            numberPoints: null,
        },
        objectPlots: {
            objectPoints: true,
            biplot: false,
            biLoadings: false,
            biCentroids: false,
            triplot: false,
            btIncludeAllVars: true,
            btIncludeSelectedVars: false,
            btAvailableVars: [],
            btSelectedVars: [],
            labelObjLabelByCaseNumber: true,
            labelObjLabelByVar: false,
            labelObjAvailableVars: [],
            labelObjSelectedVars: [],
        },
        categoryPlots: {
            sourceVar: [],
            catPlotsVar: [],
            jointCatPlotsVar: [],
            transPlotsVar: [],
            dimensionsForMultiNom: null,
            inclResidPlots: false,
            prjCentroidsOfVar: null,
            prjCentroidsOntoVar: [],
        },
        loadingPlots: {
            variance: true,
            displayCompLoadings: true,
            loadingIncludeAllVars: true,
            loadingIncludeSelectedVars: false,
            loadingAvailableVars: [],
            loadingSelectedVars: [],
            includeCentroids: false,
            includeCentroidsIncludeAllVars: true,
            includeCentroidsIncludeSelectedVars: false,
            includeCentroidsAvailableVars: [],
            includeCentroidsSelectedVars: [],
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

    test("should throw error when analysis_vars is missing", async () => {
        // Setup invalid config with missing analysis_vars
        const invalidConfig = createValidConfig();
        invalidConfig.main.analysis_vars = null;

        // Call the function and expect it to throw
        await expect(
            analyzeOptScaCatpca({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("At least one analysis variable must be selected");

        // Verify the constructor was called with the invalid config
        expect(OptimalScalingCatpca).toHaveBeenCalled();
    });

    test("should throw error when analysis_vars is empty array", async () => {
        // Setup invalid config with empty analysis_vars
        const invalidConfig = createValidConfig();
        invalidConfig.main.analysis_vars = [];

        // Call the function and expect it to throw
        await expect(
            analyzeOptScaCatpca({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("At least one analysis variable must be selected");

        // Verify the constructor was called with the invalid config
        expect(OptimalScalingCatpca).toHaveBeenCalled();
    });

    test("should process valid configuration correctly", async () => {
        // Setup valid config
        const validConfig = createValidConfig();

        // Call the function
        await analyzeOptScaCatpca({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(OptimalScalingCatpca).toHaveBeenCalled();

        // Check that OptimalScalingCatpca was called with the correct parameters
        expect(OptimalScalingCatpca).toHaveBeenCalledWith(
            expect.any(Array), // slicedDataForAnalysis
            expect.any(Array), // slicedDataForSupplement
            expect.any(Array), // slicedDataForLabeling
            validConfig, // config
            expect.any(Array), // varDefsForAnalysis
            expect.any(Array), // varDefsForSupplement
            expect.any(Array) // varDefsForLabeling
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
        await analyzeOptScaCatpca({
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
            analyzeOptScaCatpca({
                configData: malformedConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow();

        // Verify the constructor was called with the malformed config
        expect(OptimalScalingCatpca).toHaveBeenCalled();
    });
});

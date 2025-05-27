import { analyzeDiscriminant } from "@/services/analyze/classify/discriminant/discriminant-analysis";
import init, { DiscriminantAnalysis } from "@/wasm/pkg/wasm";

// Mock the wasm init function
jest.mock("@/wasm/pkg/wasm", () => {
    const mockDiscriminantAnalysis = jest.fn();
    mockDiscriminantAnalysis.mockImplementation(
        (
            group_data,
            independent_data,
            selection_data,
            group_data_defs,
            independent_data_defs,
            selection_data_defs,
            config_data
        ) => {
            // This implementation mimics the behavior of the actual Rust constructor
            // It will validate inputs and throw errors for invalid data

            // Check if grouping variable is selected
            if (
                !config_data?.main?.GroupingVariable ||
                config_data.main.GroupingVariable === ""
            ) {
                throw new Error(
                    "Grouping variable must be selected for discriminant analysis"
                );
            }

            // Check if independent variables are selected
            if (
                !config_data?.main?.IndependentVariables ||
                config_data.main.IndependentVariables.length === 0
            ) {
                throw new Error(
                    "At least one independent variable must be selected"
                );
            }

            // Mock method implementations
            return {
                get_results: jest.fn().mockReturnValue({}),
                get_formatted_results: jest.fn().mockReturnValue({}),
                get_all_errors: jest.fn().mockReturnValue([]),
                get_all_log: jest.fn().mockReturnValue([]),
            };
        }
    );

    return {
        __esModule: true,
        default: jest.fn().mockResolvedValue(true),
        DiscriminantAnalysis: mockDiscriminantAnalysis,
    };
});

// Mock utility functions from useVariable
jest.mock("@/hooks/useVariable", () => ({
    getSlicedData: jest.fn().mockReturnValue([]),
    getVarDefs: jest.fn().mockReturnValue([]),
}));

describe("Discriminant Analysis Constructor Error Handling", () => {
    // Helper function to create a minimal valid config
    const createValidConfig = () => ({
        main: {
            GroupingVariable: "group1",
            IndependentVariables: ["var1", "var2"],
            Together: true,
            Stepwise: false,
            SelectionVariable: null,
        },
        defineRange: {
            minRange: 0,
            maxRange: 100,
        },
        setValue: {
            Value: 0.5,
        },
        statistics: {
            Means: true,
            ANOVA: true,
            BoxM: false,
            Fisher: true,
            Unstandardized: true,
            WGCorrelation: true,
            WGCovariance: false,
            SGCovariance: false,
            TotalCovariance: false,
        },
        method: {
            Wilks: true,
            Unexplained: false,
            Mahalonobis: false,
            FRatio: true,
            Raos: false,
            FValue: false,
            FProbability: false,
            Summary: true,
            Pairwise: false,
            VEnter: 0.05,
            FEntry: 3.84,
            FRemoval: 2.71,
            PEntry: 0.05,
            PRemoval: 0.1,
        },
        classify: {
            AllGroupEqual: true,
            GroupSize: false,
            WithinGroup: true,
            SepGroup: false,
            Case: true,
            Limit: false,
            LimitValue: null,
            Summary: true,
            Leave: true,
            Combine: false,
            SepGrp: false,
            Terr: false,
            Replace: false,
        },
        save: {
            Predicted: true,
            Discriminant: true,
            Probabilities: false,
            XmlFile: null,
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
        { name: "group1" },
        { name: "var1" },
        { name: "var2" },
    ];
    const mockDataVariables = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should throw error when GroupingVariable is missing", async () => {
        // Setup invalid config with missing GroupingVariable
        const invalidConfig = createValidConfig();
        invalidConfig.main.GroupingVariable = null;

        // Call the function and expect it to throw
        await expect(
            analyzeDiscriminant({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "Grouping variable must be selected for discriminant analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(DiscriminantAnalysis).toHaveBeenCalled();
    });

    test("should throw error when GroupingVariable is empty string", async () => {
        // Setup invalid config with empty GroupingVariable
        const invalidConfig = createValidConfig();
        invalidConfig.main.GroupingVariable = "";

        // Call the function and expect it to throw
        await expect(
            analyzeDiscriminant({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "Grouping variable must be selected for discriminant analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(DiscriminantAnalysis).toHaveBeenCalled();
    });

    test("should throw error when IndependentVariables is missing", async () => {
        // Setup invalid config with missing IndependentVariables
        const invalidConfig = createValidConfig();
        invalidConfig.main.IndependentVariables = null;

        // Call the function and expect it to throw
        await expect(
            analyzeDiscriminant({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("At least one independent variable must be selected");

        // Verify the constructor was called with the invalid config
        expect(DiscriminantAnalysis).toHaveBeenCalled();
    });

    test("should throw error when IndependentVariables is empty array", async () => {
        // Setup invalid config with empty IndependentVariables array
        const invalidConfig = createValidConfig();
        invalidConfig.main.IndependentVariables = [];

        // Call the function and expect it to throw
        await expect(
            analyzeDiscriminant({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("At least one independent variable must be selected");

        // Verify the constructor was called with the invalid config
        expect(DiscriminantAnalysis).toHaveBeenCalled();
    });

    test("should process valid configuration correctly", async () => {
        // Setup valid config
        const validConfig = createValidConfig();

        // Call the function
        await analyzeDiscriminant({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(DiscriminantAnalysis).toHaveBeenCalled();

        // Check that DiscriminantAnalysis was called with the correct parameters
        expect(DiscriminantAnalysis).toHaveBeenCalledWith(
            expect.any(Array), // slicedDataForGrouping
            expect.any(Array), // slicedDataForIndependent
            expect.any(Array), // slicedDataForSelection
            expect.any(Array), // varDefsForGrouping
            expect.any(Array), // varDefsForIndependent
            expect.any(Array), // varDefsForSelection
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
        await analyzeDiscriminant({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Check if the config was logged
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
            analyzeDiscriminant({
                configData: malformedConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow();

        // Verify the constructor was called with the malformed config
        expect(DiscriminantAnalysis).toHaveBeenCalled();
    });
});

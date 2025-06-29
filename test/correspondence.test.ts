import { analyzeCorrespondence } from "@/services/analyze/dimension-reduction/correspondence-analysis/correspondence-analysis-analysis";
import init, { CorrespondenceAnalysis } from "@/wasm/pkg/wasm";

// Mock the wasm init function
jest.mock("@/wasm/pkg/wasm", () => {
    const mockCorrespondenceAnalysis = jest.fn();
    mockCorrespondenceAnalysis.mockImplementation(
        (
            row_data,
            col_data,
            weight_data,
            row_data_defs,
            col_data_defs,
            weight_data_defs,
            config_data
        ) => {
            // This implementation mimics the behavior of the actual Rust constructor
            // It will validate inputs and throw errors for invalid data

            // Check if row target variable is selected
            if (
                !config_data?.main?.RowTargetVar ||
                config_data.main.RowTargetVar === ""
            ) {
                throw new Error(
                    "Row target variable must be selected for correspondence analysis"
                );
            }

            // Check if column target variable is selected
            if (
                !config_data?.main?.ColTargetVar ||
                config_data.main.ColTargetVar === ""
            ) {
                throw new Error(
                    "Column target variable must be selected for correspondence analysis"
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
        CorrespondenceAnalysis: mockCorrespondenceAnalysis,
    };
});

// Mock utility functions from useVariable
jest.mock("@/hooks/useVariable", () => ({
    getSlicedData: jest.fn().mockReturnValue([]),
    getVarDefs: jest.fn().mockReturnValue([]),
}));

describe("CorrespondenceAnalysis Constructor Error Handling", () => {
    // Helper function to create a minimal valid config
    const createValidConfig = () => ({
        main: {
            RowTargetVar: "row_var",
            ColTargetVar: "col_var",
        },
        defineRangeRow: {
            MinValue: null,
            MaxValue: null,
            ConstraintsList: null,
            None: true,
            CategoryEqual: false,
            CategorySupplemental: false,
            DefaultListModel: null,
        },
        defineRangeColumn: {
            MinValue: null,
            MaxValue: null,
            ConstraintsList: null,
            None: true,
            CategoryEqual: false,
            CategorySupplemental: false,
            DefaultListModel: null,
        },
        model: {
            ChiSquare: true,
            Euclidean: false,
            RNCRemoved: false,
            RowRemoved: false,
            ColRemoved: false,
            RowTotals: false,
            ColTotals: false,
            Symmetrical: true,
            RowPrincipal: false,
            Custom: false,
            Principal: false,
            ColPrincipal: false,
            Dimensions: 2,
            CustomDimensions: null,
            CustomQ: null,
        },
        statistics: {
            CorrTable: true,
            StatRowPoints: true,
            StatColPoints: true,
            PermutationTest: false,
            MaxPermutations: null,
            RowProfile: false,
            ColProfile: false,
            RowPoints: true,
            ColPoints: true,
        },
        plots: {
            Biplot: true,
            RowPts: true,
            ColPts: true,
            IdScatter: null,
            TransRow: false,
            TransCol: false,
            IdLine: null,
            DisplayAll: true,
            RestrictDim: false,
            Lowest: null,
            Highest: null,
        },
    });

    // Setup mock for analysis function dependencies
    const mockAddLog = jest.fn().mockResolvedValue(1);
    const mockAddAnalytic = jest.fn().mockResolvedValue(1);
    const mockAddStatistic = jest.fn().mockResolvedValue(1);
    const mockVariables = [
        { name: "row_var" },
        { name: "col_var" },
        { name: "weight_var" },
    ];
    const mockDataVariables = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
    ];
    const mockMeta = { weight: null };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should throw error when RowTargetVar is missing", async () => {
        // Setup invalid config with missing RowTargetVar
        const invalidConfig = createValidConfig();
        invalidConfig.main.RowTargetVar = null;

        // Call the function and expect it to throw
        await expect(
            analyzeCorrespondence({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                meta: mockMeta,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "Row target variable must be selected for correspondence analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(CorrespondenceAnalysis).toHaveBeenCalled();
    });

    test("should throw error when RowTargetVar is empty string", async () => {
        // Setup invalid config with empty RowTargetVar
        const invalidConfig = createValidConfig();
        invalidConfig.main.RowTargetVar = "";

        // Call the function and expect it to throw
        await expect(
            analyzeCorrespondence({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                meta: mockMeta,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "Row target variable must be selected for correspondence analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(CorrespondenceAnalysis).toHaveBeenCalled();
    });

    test("should throw error when ColTargetVar is missing", async () => {
        // Setup invalid config with missing ColTargetVar
        const invalidConfig = createValidConfig();
        invalidConfig.main.ColTargetVar = null;

        // Call the function and expect it to throw
        await expect(
            analyzeCorrespondence({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                meta: mockMeta,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "Column target variable must be selected for correspondence analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(CorrespondenceAnalysis).toHaveBeenCalled();
    });

    test("should throw error when ColTargetVar is empty string", async () => {
        // Setup invalid config with empty ColTargetVar
        const invalidConfig = createValidConfig();
        invalidConfig.main.ColTargetVar = "";

        // Call the function and expect it to throw
        await expect(
            analyzeCorrespondence({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                meta: mockMeta,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "Column target variable must be selected for correspondence analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(CorrespondenceAnalysis).toHaveBeenCalled();
    });

    test("should process valid configuration correctly", async () => {
        // Setup valid config
        const validConfig = createValidConfig();

        // Call the function
        await analyzeCorrespondence({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            meta: mockMeta,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(CorrespondenceAnalysis).toHaveBeenCalled();

        // Check that CorrespondenceAnalysis was called with the correct parameters
        expect(CorrespondenceAnalysis).toHaveBeenCalledWith(
            expect.any(Array), // slicedDataForRow
            expect.any(Array), // slicedDataForCol
            expect.any(Array), // slicedDataForWeight
            expect.any(Array), // varDefsForRow
            expect.any(Array), // varDefsForCol
            expect.any(Array), // varDefsForWeight
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
        await analyzeCorrespondence({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            meta: mockMeta,
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
            analyzeCorrespondence({
                configData: malformedConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                meta: mockMeta,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow();

        // Verify the constructor was called with the malformed config
        expect(CorrespondenceAnalysis).toHaveBeenCalled();
    });
});

import { analyzeKMeansCluster } from "@/services/analyze/classify/k-means-cluster/k-means-cluster-analysis";
import init, { KMeansClusterAnalysis } from "@/wasm/pkg/wasm";

// Mock the wasm init function
jest.mock("@/wasm/pkg/wasm", () => {
    const mockKMeansClusterAnalysis = jest.fn();
    mockKMeansClusterAnalysis.mockImplementation(
        (
            target_data,
            case_data,
            target_data_defs,
            case_data_defs,
            config_data
        ) => {
            // This implementation mimics the behavior of the actual Rust constructor
            // It will validate inputs and throw errors for invalid data

            // Check if cluster number is positive
            if (!config_data?.main?.Cluster || config_data.main.Cluster <= 0) {
                throw new Error("Number of clusters must be positive");
            }

            // Check if target variables are selected
            if (
                !config_data?.main?.TargetVar ||
                config_data.main.TargetVar.length === 0
            ) {
                throw new Error(
                    "Target variables must be selected for K-Means Cluster analysis"
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
        KMeansClusterAnalysis: mockKMeansClusterAnalysis,
    };
});

// Mock utility functions from useVariable
jest.mock("@/hooks/useVariable", () => ({
    getSlicedData: jest.fn().mockReturnValue([]),
    getVarDefs: jest.fn().mockReturnValue([]),
}));

describe("KMeansCluster Analysis Constructor Error Handling", () => {
    // Helper function to create a minimal valid config
    const createValidConfig = () => ({
        main: {
            TargetVar: ["var1", "var2"],
            CaseTarget: "var3",
            IterateClassify: true,
            ClassifyOnly: false,
            Cluster: 3,
            OpenDataset: false,
            ExternalDatafile: false,
            NewDataset: false,
            DataFile: false,
            ReadInitial: false,
            WriteFinal: false,
            OpenDatasetMethod: null,
            NewData: null,
            InitialData: null,
            FinalData: null,
        },
        iterate: {
            MaximumIterations: 100,
            ConvergenceCriterion: 0.001,
            UseRunningMeans: true,
        },
        save: {
            ClusterMembership: true,
            DistanceClusterCenter: true,
        },
        options: {
            InitialCluster: true,
            ANOVA: true,
            ClusterInfo: true,
            ExcludeListWise: true,
            ExcludePairWise: false,
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

    test("should throw error when Cluster value is missing or not positive", async () => {
        // Setup invalid config with missing Cluster value
        const invalidConfig = createValidConfig();
        invalidConfig.main.Cluster = null;

        // Call the function and expect it to throw
        await expect(
            analyzeKMeansCluster({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("Number of clusters must be positive");

        // Verify the constructor was called with the invalid config
        expect(KMeansClusterAnalysis).toHaveBeenCalled();

        // Setup another invalid config with non-positive Cluster value
        const invalidConfig2 = createValidConfig();
        invalidConfig2.main.Cluster = 0;

        // Call the function and expect it to throw
        await expect(
            analyzeKMeansCluster({
                configData: invalidConfig2,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("Number of clusters must be positive");

        // Verify the constructor was called with the invalid config
        expect(KMeansClusterAnalysis).toHaveBeenCalled();
    });

    test("should throw error when TargetVar is missing", async () => {
        // Setup invalid config with missing TargetVar
        const invalidConfig = createValidConfig();
        invalidConfig.main.TargetVar = null;

        // Call the function and expect it to throw
        await expect(
            analyzeKMeansCluster({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "Target variables must be selected for K-Means Cluster analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(KMeansClusterAnalysis).toHaveBeenCalled();
    });

    test("should throw error when TargetVar is empty array", async () => {
        // Setup invalid config with empty TargetVar
        const invalidConfig = createValidConfig();
        invalidConfig.main.TargetVar = [];

        // Call the function and expect it to throw
        await expect(
            analyzeKMeansCluster({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow(
            "Target variables must be selected for K-Means Cluster analysis"
        );

        // Verify the constructor was called with the invalid config
        expect(KMeansClusterAnalysis).toHaveBeenCalled();
    });

    test("should process valid configuration correctly", async () => {
        // Setup valid config
        const validConfig = createValidConfig();

        // Call the function
        await analyzeKMeansCluster({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(KMeansClusterAnalysis).toHaveBeenCalled();

        // Check that KMeansClusterAnalysis was called with the correct parameters
        expect(KMeansClusterAnalysis).toHaveBeenCalledWith(
            expect.any(Array), // slicedDataForTarget
            expect.any(Array), // slicedDataForCaseTarget
            expect.any(Array), // varDefsForTarget
            expect.any(Array), // varDefsForCaseTarget
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
        await analyzeKMeansCluster({
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
            analyzeKMeansCluster({
                configData: malformedConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow();

        // Verify the constructor was called with the malformed config
        expect(KMeansClusterAnalysis).toHaveBeenCalled();
    });
});

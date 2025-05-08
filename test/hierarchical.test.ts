import { analyzeHierClus } from "@/services/analyze/classify/hierarchical-cluster/hierarchical-cluster-analysis";
import init, { HierarchicalCluster } from "@/wasm/pkg/wasm";

// Mock the wasm init function
jest.mock("@/wasm/pkg/wasm", () => {
    const mockHierarchicalCluster = jest.fn();
    mockHierarchicalCluster.mockImplementation(
        (
            cluster_data,
            label_data,
            cluster_data_defs,
            label_data_defs,
            config_data
        ) => {
            // This implementation mimics the behavior of the Rust constructor
            // It validates inputs and throws errors for invalid data

            // Validate cluster_data is not empty
            if (
                !cluster_data ||
                (Array.isArray(cluster_data) && cluster_data.length === 0)
            ) {
                throw new Error("Cluster data cannot be empty");
            }

            // Mock method implementations
            return {
                get_results: jest.fn().mockReturnValue({}),
                get_formatted_results: jest.fn().mockReturnValue({}),
                get_all_errors: jest.fn().mockReturnValue(""),
                clear_errors: jest.fn(),
            };
        }
    );

    return {
        __esModule: true,
        default: jest.fn().mockResolvedValue(true),
        HierarchicalCluster: mockHierarchicalCluster,
    };
});

// Mock utility functions from useVariable
jest.mock("@/hooks/useVariable", () => ({
    getSlicedData: jest.fn().mockImplementation((params) => {
        // Return empty array if selected variables are empty or null
        if (
            !params.selectedVariables ||
            params.selectedVariables.length === 0
        ) {
            return [];
        }
        // Otherwise return mock data
        return [
            [{ value: 1 }, { value: 2 }],
            [{ value: 3 }, { value: 4 }],
        ];
    }),
    getVarDefs: jest
        .fn()
        .mockReturnValue([
            [{ name: "var1", type: "numeric" }],
            [{ name: "var2", type: "numeric" }],
        ]),
}));

// Mock the result processing functions
jest.mock(
    "@/services/analyze/classify/hierarchical-cluster/hierarchical-cluster-analysis-formatter",
    () => ({
        transformHierClusResult: jest.fn().mockReturnValue({}),
    })
);

jest.mock(
    "@/services/analyze/classify/hierarchical-cluster/hierarchical-cluster-analysis-output",
    () => ({
        resultHierarchicalCluster: jest.fn().mockResolvedValue(true),
    })
);

describe("Hierarchical Cluster Analysis Constructor Error Handling", () => {
    // Helper function to create a minimal valid config
    const createValidConfig = () => ({
        main: {
            Variables: ["var1", "var2"],
            LabelCases: "varLabel",
            ClusterCases: true,
            ClusterVar: false,
            DispStats: true,
            DispPlots: true,
        },
        statistics: {
            AgglSchedule: true,
            ProxMatrix: true,
            NoneSol: false,
            SingleSol: true,
            RangeSol: false,
            NoOfCluster: 3,
            MaxCluster: null,
            MinCluster: null,
        },
        plots: {
            Dendrograms: true,
            AllClusters: false,
            RangeClusters: false,
            NoneClusters: true,
            StartCluster: null,
            StopCluster: null,
            StepByCluster: null,
            VertOrien: true,
            HoriOrien: false,
        },
        save: {
            NoneSol: false,
            SingleSol: true,
            RangeSol: false,
            NoOfCluster: 3,
            MaxCluster: null,
            MinCluster: null,
        },
        method: {
            ClusMethod: "average",
            Interval: true,
            IntervalMethod: "euclidean",
            Power: "2",
            Root: "2",
            Counts: false,
            CountsMethod: null,
            Binary: false,
            BinaryMethod: null,
            Present: null,
            Absent: null,
            StandardizeMethod: "none",
            ByVariable: false,
            ByCase: false,
            AbsValue: false,
            ChangeSign: false,
            RescaleRange: false,
        },
    });

    // Setup mock for analysis function dependencies
    const mockAddLog = jest.fn().mockResolvedValue(1);
    const mockAddAnalytic = jest.fn().mockResolvedValue(1);
    const mockAddStatistic = jest.fn().mockResolvedValue(1);
    const mockVariables = [
        { name: "var1" },
        { name: "var2" },
        { name: "varLabel" },
    ];
    const mockDataVariables = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should throw error when Variables are missing", async () => {
        // Setup invalid config with missing Variables
        const invalidConfig = createValidConfig();
        invalidConfig.main.Variables = null;

        // Call the function and expect it to throw
        await expect(
            analyzeHierClus({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("Cluster data cannot be empty");

        // Verify the constructor was called with empty cluster data
        expect(HierarchicalCluster).toHaveBeenCalled();
        expect(HierarchicalCluster).toHaveBeenCalledWith(
            [], // Empty cluster data due to null Variables
            expect.any(Array),
            expect.any(Array),
            expect.any(Array),
            expect.any(Object)
        );
    });

    test("should throw error when Variables is empty array", async () => {
        // Setup invalid config with empty Variables array
        const invalidConfig = createValidConfig();
        invalidConfig.main.Variables = [];

        // Call the function and expect it to throw
        await expect(
            analyzeHierClus({
                configData: invalidConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("Cluster data cannot be empty");

        // Verify the constructor was called with empty cluster data
        expect(HierarchicalCluster).toHaveBeenCalled();
    });

    test("should process valid configuration correctly", async () => {
        // Setup valid config
        const validConfig = createValidConfig();

        // Call the function
        await analyzeHierClus({
            configData: validConfig,
            dataVariables: mockDataVariables,
            variables: mockVariables,
            addLog: mockAddLog,
            addAnalytic: mockAddAnalytic,
            addStatistic: mockAddStatistic,
        });

        // Verify the constructor was called with the valid config
        expect(HierarchicalCluster).toHaveBeenCalled();
        expect(HierarchicalCluster).toHaveBeenCalledWith(
            expect.any(Array), // slicedDataForCluster
            expect.any(Array), // slicedDataForLabelCases
            expect.any(Array), // varDefsForCluster
            expect.any(Array), // varDefsForLabelCases
            validConfig // config
        );

        // Verify that get_formatted_results and other methods were called
        const mockInstance = HierarchicalCluster.mock.results[0].value;
        expect(mockInstance.get_formatted_results).toHaveBeenCalled();
        expect(mockInstance.get_results).toHaveBeenCalled();
        expect(mockInstance.get_all_errors).toHaveBeenCalled();
    });

    test("should handle data type mismatches in constructor arguments", async () => {
        // Create a spy on console.log to capture error messages
        const consoleLogSpy = jest.spyOn(console, "log");

        // Setup test with incorrectly typed data
        const validConfig = createValidConfig();

        // Modify getSlicedData to return incorrect data type
        const { getSlicedData } = require("@/hooks/useVariable");
        getSlicedData.mockReturnValueOnce("invalid data type"); // String instead of expected array

        // Mock the constructor to throw an error for invalid data type
        HierarchicalCluster.mockImplementationOnce(() => {
            throw new Error("Failed to parse cluster data");
        });

        // Call the function and expect it to throw
        await expect(
            analyzeHierClus({
                configData: validConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("Failed to parse cluster data");

        // Check if HierarchicalCluster was called
        expect(HierarchicalCluster).toHaveBeenCalled();

        // Restore the spy
        consoleLogSpy.mockRestore();
    });

    test("should handle malformed configuration object", async () => {
        // Setup a malformed config that's missing required nested properties
        const malformedConfig = {
            main: {}, // Missing all required properties
            // Missing other required sections
        };

        // Mock the constructor to throw an error for malformed config
        HierarchicalCluster.mockImplementationOnce(() => {
            throw new Error("Failed to parse configuration");
        });

        // Call the function and expect it to throw
        await expect(
            analyzeHierClus({
                configData: malformedConfig,
                dataVariables: mockDataVariables,
                variables: mockVariables,
                addLog: mockAddLog,
                addAnalytic: mockAddAnalytic,
                addStatistic: mockAddStatistic,
            })
        ).rejects.toThrow("Failed to parse configuration");

        // Verify the constructor was called with the malformed config
        expect(HierarchicalCluster).toHaveBeenCalled();
    });
});

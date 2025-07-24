/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import { useAnalyzeHook } from '@/components/Modals/Analyze/TimeSeries/Smoothing/hooks/analyzeHook';
import { Variable } from '@/types/Variable';

// Mock semua store yang dipakai
jest.mock("@/stores/useResultStore", () => ({
  useResultStore: () => ({
    addLog: jest.fn(),
    addAnalytic: jest.fn(),
    addStatistic: jest.fn(),
  }),
}));

jest.mock("@/stores/useVariableStore", () => ({
  useVariableStore: () => ({
    addVariable: jest.fn(),
    variables: [
    ],
  }),
}));

jest.mock("@/stores/useDataStore", () => ({
  useDataStore: () => ({
    updateCells: jest.fn(),
  }),
}));

jest.mock("@/stores/useTimeSeriesStore", () => ({
  useTimeSeriesStore: () => ({
    getTypeDate: () => "d", // bebas
    getHour: () => 10,
    getDay: () => 1,
    getMonth: () => 7,
    getYear: () => 2024,
    getDayName: () => "Monday",
  }),
}));

jest.mock("@/hooks/useIndexedDB", () => ({
  getFormData: jest.fn(() => null),
  saveFormData: jest.fn(),
  clearFormData: jest.fn(),
}));

jest.mock("../../timeSeriesTimeHook", () => ({
  useTimeHook: () => ({
    periods: [],
    selectedPeriod: ["1", "Valid"],
    initialType: "",
    handleSelectedPeriod: jest.fn(),
    resetTime: jest.fn(),
    inputPeriods: [],
  }),
}));

const createMockVar = (type: "NUMERIC" | "STRING" = "NUMERIC"): Variable => ({
  id: 1,
  name: "Test Var",
  columnIndex: 0,
  type,
  width: 8,
  decimals: 2,
  label: "",
  values: [],
  missing: null,
  columns: 10,
  align: "right",
  measure: "scale",
  role: "input",
});

const periodNotDated = ["0", "Not Dated"];
const periodMonthly = ["12", "Years-Months"];

const dataEmpty: any[][] = [];
const dataBelow20Obs = Array.from({ length: 5 }, () => [3]);
const data25Obs = Array.from({ length: 25 }, () => [3]);
const data50Obs = Array.from({ length: 50 }, () => [3]);

const runAnalyze = async (selectedMethod: string[], parameters: number[], period: string[], storeVariables: Variable[], data: any[][]) => {
  const { result } = renderHook(() =>
    useAnalyzeHook(
      selectedMethod,
      parameters,
      period,
      storeVariables,
      data,
      false,
      jest.fn()
    )
  );

  await act(async () => {
    await result.current.handleAnalyzes();
  });

  return result;
};

describe("useAnalyzeHook - Error Cases", () => {
  it("TCS01: Returns error if selected variable is empty", async () => {
    const result = await runAnalyze(["sma"], [3], periodMonthly, [], dataEmpty);
    expect(result.current.errorMsg).toBe(`Please select at least one variable.`);
  });

  it("TCS02: Returns error if selected variable is not numeric", async () => {
    const result = await runAnalyze(["sma"], [3], periodMonthly, [createMockVar("STRING")], [dataBelow20Obs]);
    expect(result.current.errorMsg).toBe(`Selected variable is not numeric.`);
  });

  it("TCS03: Returns error if selected variable data is empty", async () => {
    const result = await runAnalyze(["sma"], [3], periodMonthly, [createMockVar()], dataEmpty);
    expect(result.current.errorMsg).toBe(`No data available for the selected variables.`);
  });

  it("TCS04: Returns error if data observations are less than 20", async () => {
    const result = await runAnalyze(["sma"], [3], periodMonthly, [createMockVar()], [dataBelow20Obs]);
    expect(result.current.errorMsg).toBe(`Data length must be at least 20 observations.`);
  });

  it("TCS05: Returns an error value if the simple moving average parameter is out of range.", async () => {
    const result = await runAnalyze(["sma"], [12], periodMonthly, [createMockVar()], [data25Obs]);
    expect(result.current.errorMsg).toBe(`Simple Moving Average period must be between 2 and 11.`);
  });

  it("TCS06: Returns an error value if simple moving average is used without configuring the time settings", async () => {
    const result = await runAnalyze(["sma"], [3], periodNotDated, [createMockVar()], [data25Obs]);
    expect(result.current.errorMsg).toBe(`Please select another time specification.`);
  });

  it("TCS09: Returns error if observations are less than 3 × double moving average parameter", async () => {
    const result = await runAnalyze(
      ["dma"],
      [9],
      periodMonthly,
      [createMockVar()],
      data25Obs
    );
    expect(result.current.errorMsg).toBe(`Data length is too short for distance 9 Double Moving Average.`);
  });
});

// Mock implementasi smoothing success
jest.mock('@/components/Modals/Analyze/TimeSeries/Smoothing/analyze/analyze', () => ({
  handleSmoothing: jest.fn(() => Promise.resolve([
    "success", // resultMessage
    {
      tables: [
        {
          title: "Description Table",
          columnHeaders: [{ header: "" }, { header: "description" }],
          rows: [
            { rowHeader: ["Smoothing Method"], description: "sma" },
            { rowHeader: ["Parameter"], description: "3" },
            { rowHeader: ["Series Name"], description: "TestVar" },
            { rowHeader: ["Series Period"], description: "2024-01-01 - 2024-01-25" },
            { rowHeader: ["Periodicity"], description: "None" },
            { rowHeader: ["Series Length"], description: "25" },
            { rowHeader: ["Smoothing Length"], description: "22" },
          ],
        },
      ],
    },
  ])),
}));

describe("useAnalyzeHook - Success Case", () => {
  it("TCS_SUCCESS: Should produce correct descriptionTable on successful smoothing", async () => {
    const mockVariable: Variable = {
      id: 1,
      name: "TestVar",
      columnIndex: 0,
      type: "NUMERIC",
      width: 8,
      decimals: 2,
      label: "",
      values: [],
      missing: null,
      columns: 10,
      align: "right",
      measure: "scale",
      role: "input",
    };

    const mockData = Array.from({ length: 25 }, (_, i) => [i + 1]);

    const { result } = renderHook(() =>
      useAnalyzeHook(
        ["sma", "Simple Moving Average"],
        [3],
        ["1", "Valid"],
        [mockVariable],
        mockData,
        false,
        jest.fn()
      )
    );

    await act(async () => {
      await result.current.handleAnalyzes();
    });

    expect(result.current.errorMsg).toBe(null);
    // Validasi bisa dilakukan melalui mock call terhadap addStatistic
    // Import the mocked module to access the mock function directly
    const useResultStoreModule = await import('@/stores/useResultStore');
    const addStatistic = useResultStoreModule.useResultStore().addStatistic as jest.Mock;

    // Pengecekan bahwa addStatistic dipanggil dengan Description Table
    const descriptionCall = addStatistic.mock.calls.find(call => call[1]?.title === "Description Table");
    expect(descriptionCall).toBeDefined();
    expect(descriptionCall[1].output_data.tables[0].title).toBe("Description Table");
    expect(descriptionCall[1].output_data.tables[0].rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rowHeader: ["Smoothing Method"], description: "sma" }),
        expect.objectContaining({ rowHeader: ["Series Name"], description: "TestVar" }),
        expect.objectContaining({ rowHeader: ["Series Length"], description: "25" }),
      ])
    );
  });
});


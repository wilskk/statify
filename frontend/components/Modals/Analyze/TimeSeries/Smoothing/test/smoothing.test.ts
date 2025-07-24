/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import { useAnalyzeHook } from '../hooks/analyzeHook';
import { Variable } from '@/types/Variable';
import { da } from 'date-fns/locale';

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

const dataEmpty: any[][] = [];
const dataBelow20Obs = Array.from({ length: 5 }, () => [3]);
const data25Obs = Array.from({ length: 25 }, () => [3]);
const data50Obs = Array.from({ length: 50 }, () => [3]);

const runAnalyze = async (selectedMethod: string[], parameters: number[], storeVariables: Variable[], data: any[][]) => {
  const { result } = renderHook(() =>
    useAnalyzeHook(
      selectedMethod,
      parameters,
      ["1", "Valid"],
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
    const result = await runAnalyze(["sma"], [3], [], dataEmpty);
    expect(result.current.errorMsg).toBe(`Please select at least one variable.`);
  });

  it("TCS02: Returns error if selected variable is not numeric", async () => {
    const result = await runAnalyze(["sma"], [3], [createMockVar("STRING")], [dataBelow20Obs]);
    expect(result.current.errorMsg).toBe(`Selected variable is not numeric.`);
  });

  it("TCS03: Returns error if selected variable data is empty", async () => {
    const result = await runAnalyze(["sma"], [3], [createMockVar()], dataEmpty);
    expect(result.current.errorMsg).toBe(`No data available for the selected variables.`);
  });

  it("TCS04: Returns error if data observations are less than 20", async () => {
    const result = await runAnalyze(["sma"], [3], [createMockVar()], [dataBelow20Obs]);
    expect(result.current.errorMsg).toBe(`Data length must be at least 20 observations.`);
  });

  it("TCS05: Returns an error value if the simple moving average parameter is out of range.", async () => {
    const result = await runAnalyze(["sma"], [12], [createMockVar()], [data25Obs]);
    expect(result.current.errorMsg).toBe(`Simple Moving Average period must be between 2 and 11.`);
  });

  it("TCS06: Returns an error value if the simple moving average parameter is out of range.", async () => {
    const result = await runAnalyze(["dma"], [12], [createMockVar()], [data50Obs]);
    expect(result.current.errorMsg).toBe(`Double Moving Average period must be between 2 and 11.`);
  });

  it("TCS09: Returns error if observations are less than 3 × double moving average parameter", async () => {
    const result = await runAnalyze(
      ["dma"],
      [9],
      [createMockVar()],
      data25Obs
    );
    expect(result.current.errorMsg).toBe(`Data length is too short for distance 9 Double Moving Average.`);
  });
});

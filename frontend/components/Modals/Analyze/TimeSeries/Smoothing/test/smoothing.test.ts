/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import { useAnalyzeHook } from '../hook/analyzeHook';
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

describe("useAnalyzeHook - Error Case", () => {
  it("TCS01: Returns an error value if the selected variable is empty.", async () => {
    const mockVar: Variable = {
      id: 1,
      name: "Test Var",
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

    const { result } = renderHook(() =>
      useAnalyzeHook(
        ["sma"],         // selectedMethod
        [3],             // parameters -> artinya butuh minimal 9 * 3 = 27 data
        ["1", "Valid"],  // selectedPeriod
        [],       // storeVariables
        [], // data kosong
        false,           // saveForecasting
        jest.fn()        // onClose
      )
    );

    await act(async () => {
      await result.current.handleAnalyzes();
    });

    expect(result.current.errorMsg).toBe(`Please select at least one variable.`);
  });
});

describe("useAnalyzeHook - Error Case", () => {
  it("TCS02: Returns an error value if the selected variable type is not numeric.", async () => {
    const mockVar: Variable = {
      id: 1,
      name: "Test Var",
      columnIndex: 0,
      type: "STRING",
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

    const { result } = renderHook(() =>
      useAnalyzeHook(
        ["sma"],         // selectedMethod
        [3],             // parameters -> artinya butuh minimal 9 * 3 = 27 data
        ["1", "Valid"],  // selectedPeriod
        [],       // storeVariables
        [[1], [2], [3], [4], [5],], // data berisi 5 observasi
        false,           // saveForecasting
        jest.fn()        // onClose
      )
    );

    await act(async () => {
      await result.current.handleAnalyzes();
    });

    expect(result.current.errorMsg).toBe(`Selected variable is not numeric.`);
  });
});

describe("useAnalyzeHook - Error Case", () => {
  it("TCS03: Returns an error value if the selected variable data is empty.", async () => {
    const mockVar: Variable = {
      id: 1,
      name: "Test Var",
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

    const { result } = renderHook(() =>
      useAnalyzeHook(
        ["sma"],         // selectedMethod
        [3],             // parameters -> artinya butuh minimal 9 * 3 = 27 data
        ["1", "Valid"],  // selectedPeriod
        [mockVar],       // storeVariables
        [], // data kosong
        false,           // saveForecasting
        jest.fn()        // onClose
      )
    );

    await act(async () => {
      await result.current.handleAnalyzes();
    });

    expect(result.current.errorMsg).toBe(`No data available for the selected variables.`);
  });
});

describe("useAnalyzeHook - Error Case", () => {
  it("TCS04: Returns an error value if the number of data observations is less than 20.", async () => {
    const mockVar: Variable = {
      id: 1,
      name: "Test Var",
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

    const { result } = renderHook(() =>
      useAnalyzeHook(
        ["sma"],         // selectedMethod
        [3],             // parameters -> artinya butuh minimal 9 * 3 = 27 data
        ["1", "Valid"],  // selectedPeriod
        [],       // storeVariables
        [[1], [2], [3], [4], [5],], // data berisi 5 observasi
        false,           // saveForecasting
        jest.fn()        // onClose
      )
    );

    await act(async () => {
      await result.current.handleAnalyzes();
    });

    expect(result.current.errorMsg).toBe(`Data length must be at least 20 observations.`);
  });
});

describe("useAnalyzeHook - Error Case", () => {
  it("TCS09: Returns an error value if the number of data observations is less than three times the 'dma' parameter.", async () => {
    const mockVar: Variable = {
      id: 1,
      name: "Test Var",
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

    const { result } = renderHook(() =>
      useAnalyzeHook(
        ["dma"],         // selectedMethod
        [9],             // parameters -> artinya butuh minimal 9 * 3 = 27 data
        ["1", "Valid"],  // selectedPeriod
        [mockVar],       // storeVariables
        [
          [1], [2], [3], [4], [5], 
          [1], [2], [3], [4], [5], 
          [1], [2], [3], [4], [5], 
          [1], [2], [3], [4], [5], 
          [1], [2], [3], [4], [5]
        ], // hanya 25 observasi data kurang dari 9
        false,           // saveForecasting
        jest.fn()        // onClose
      )
    );

    await act(async () => {
      await result.current.handleAnalyzes();
    });

    expect(result.current.errorMsg).toBe(`Data length is too short for distance 9 Double Moving Average.`);
  });
});

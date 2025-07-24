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

jest.mock("../hook/optionHook", () => ({
  useOptionHook: () => ({
    selectedMethod: ["dma"],
    parameters: [5],
    methods: [],
    inputParameters: [],
    handleSelectedMethod: jest.fn(),
    resetOptions: jest.fn(),
  }),
}));

describe("useAnalyzeHook - Error Case", () => {
  it("returns error when using 'dma' with too few data points", async () => {
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
        [5],             // parameters -> artinya butuh minimal 5 * 3 = 15 data
        ["1", "Valid"],  // selectedPeriod
        [mockVar],       // storeVariables
        [[1], [2], [3], [4], [5]], // hanya 5 data point → tidak cukup
        false,           // saveForecasting
        jest.fn()        // onClose
      )
    );

    await act(async () => {
      await result.current.handleAnalyzes();
    });

    expect(result.current.errorMsg).toBe("Data length must be at least 20 observations.");
  });
});

import {
  formatNumber,
  formatPValue,
  formatDF,
  formatTestStatisticsTable,
  formatFrequenciesTable,
  formatErrorTable
} from '../utils/formatters';
import { ChiSquareResult } from '../types';
import { Variable } from '@/types/Variable';

describe('Chi-Square Formatters', () => {
  describe('formatNumber', () => {
    it('should format a number with specified precision', () => {
      expect(formatNumber(10.12345, 2)).toBe('10.12');
      expect(formatNumber(0, 3)).toBe('0.000');
      expect(formatNumber(-5.6789, 1)).toBe('-5.7');
    });

    it('should handle null or undefined values', () => {
      expect(formatNumber(null, 2)).toBeNull();
      expect(formatNumber(undefined, 2)).toBeNull();
    });
  });

  describe('formatPValue', () => {
    it('should format p-values less than 0.001 as <.001', () => {
      expect(formatPValue(0.0001)).toBe('<.001');
      expect(formatPValue(0.00099)).toBe('<.001');
    });

    it('should format p-values greater than or equal to 0.001 with 3 decimal places', () => {
      expect(formatPValue(0.001)).toBe('0.001');
      expect(formatPValue(0.1234)).toBe('0.123');
      expect(formatPValue(1)).toBe('1.000');
    });

    it('should handle null or undefined values', () => {
      expect(formatPValue(null)).toBeNull();
      expect(formatPValue(undefined)).toBeNull();
    });
  });

  describe('formatDF', () => {
    it('should return integer degrees of freedom as is', () => {
      expect(formatDF(5)).toBe(5);
      expect(formatDF(0)).toBe(0);
    });

    it('should format non-integer degrees of freedom with 3 decimal places', () => {
      expect(formatDF(5.123456)).toBe('5.123');
      expect(formatDF(0.5)).toBe('0.500');
    });

    it('should handle null or undefined values', () => {
      expect(formatDF(null)).toBeNull();
      expect(formatDF(undefined)).toBeNull();
    });
  });

  describe('formatTestStatisticsTable', () => {
    const mockVariable: Variable = {
      name: 'testVar',
      label: 'Test Variable',
      columnIndex: 0,
      type: 'NUMERIC',
      tempId: '1',
      width: 8,
      decimals: 0,
      values: [],
      missing: {},
      align: 'left',
      measure: 'nominal',
      role: 'input',
      columns: 8
    };

    const mockResults: ChiSquareResult[] = [
      {
        variable: mockVariable,
        frequencies: {
          categoryList: ['1', '2', '3'],
          observedN: [10, 15, 5],
          expectedN: 10,
          residual: [0, 5, -5],
          N: 30
        },
        testStatistics: {
          ChiSquare: 5.0,
          DF: 2,
          PValue: 0.082
        },
        metadata: {
          hasInsufficientData: false,
          totalData1: 30,
          validData1: 30,
          variable1Name: 'testVar'
        }
      }
    ];

    it('should format chi-square test table with valid data', () => {
      const result = formatTestStatisticsTable(mockResults);

      expect(result).toEqual({
        title: 'Chi-Square Test',
        columnHeaders: [
          { header: '', key: 'rowHeader' },
          { header: 'Test Variable', key: 'var_0' }
        ],
        rows: [
          { rowHeader: ['Chi-Square'], var_0: '5.000' },
          { rowHeader: ['df'], var_0: 2 },
          { rowHeader: ['Asymp. Sig.'], var_0: '0.082' }
        ]
      });
    });

    it('should handle null values in results', () => {
      const resultsWithNulls: ChiSquareResult[] = [
        {
          variable: mockVariable,
          frequencies: {
            categoryList: ['1', '2'],
            observedN: [10, 15],
            expectedN: 12.5,
            residual: [-2.5, 2.5],
            N: 25
          },
          testStatistics: {
            ChiSquare: 0,
            DF: 0,
            PValue: 1
          },
          metadata: {
            hasInsufficientData: false,
            totalData1: 25,
            validData1: 25,
            variable1Name: 'testVar'
          }
        }
      ];

      const result = formatTestStatisticsTable(resultsWithNulls);

      expect(result).toEqual({
        title: 'Chi-Square Test',
        columnHeaders: [
          { header: '', key: 'rowHeader' },
          { header: 'Test Variable', key: 'var_0' }
        ],
        rows: [
          { rowHeader: ['Chi-Square'], var_0: '0.000' },
          { rowHeader: ['df'], var_0: 0 },
          { rowHeader: ['Asymp. Sig.'], var_0: '1.000' }
        ]
      });
    });

    it('should handle empty results array', () => {
      const result = formatTestStatisticsTable([]);

      expect(result).toEqual({
        title: 'No Data',
        columnHeaders: [{ header: 'No Data', key: 'noData' }],
        rows: []
      });
    });
  });

  describe('formatFrequenciesTable', () => {
    const mockVariable: Variable = {
      name: 'testVar',
      label: 'Test Variable',
      columnIndex: 0,
      type: 'NUMERIC',
      tempId: '1',
      width: 8,
      decimals: 0,
      values: [],
      missing: {},
      align: 'left',
      measure: 'nominal',
      role: 'input',
      columns: 8
    };

    const mockResults: ChiSquareResult[] = [
      {
        variable: mockVariable,
        frequencies: {
          categoryList: ['1', '2', '3'],
          observedN: [10, 15, 5],
          expectedN: 10,
          residual: [0, 5, -5],
          N: 30
        },
        testStatistics: {
          ChiSquare: 5.0,
          DF: 2,
          PValue: 0.082
        },
        metadata: {
          hasInsufficientData: false,
          totalData1: 30,
          validData1: 30,
          variable1Name: 'testVar'
        }
      }
    ];

    it('should format frequencies table with valid data', () => {
      const result = formatFrequenciesTable(mockResults);

      expect(result).toEqual([{
        title: 'Test Variable',
        columnHeaders: [
          { header: '', key: 'rowHeader' },
          { header: 'Observed N', key: 'observedN' },
          { header: 'Expected N', key: 'expectedN' },
          { header: 'Residual', key: 'residual' }
        ],
        rows: [
          { rowHeader: ['1'], observedN: 10, expectedN: '10.0', residual: '0.0' },
          { rowHeader: ['2'], observedN: 15, expectedN: '10.0', residual: '5.0' },
          { rowHeader: ['3'], observedN: 5, expectedN: '10.0', residual: '-5.0' },
          { rowHeader: ['Total'], observedN: 30, expectedN: '', residual: '' }
        ]
      }]);
    });

    it('should handle custom expected values', () => {
      const resultsWithCustomExpected: ChiSquareResult[] = [
        {
          variable: mockVariable,
          frequencies: {
            categoryList: ['1', '2', '3'],
            observedN: [10, 15, 5],
            expectedN: [8, 12, 10], // Array of custom expected values
            residual: [2, 3, -5],
            N: 30
          },
          testStatistics: {
            ChiSquare: 5.0,
            DF: 2,
            PValue: 0.082
          },
          metadata: {
            hasInsufficientData: false,
            totalData1: 30,
            validData1: 30,
            variable1Name: 'testVar'
          }
        }
      ];

      const result = formatFrequenciesTable(resultsWithCustomExpected);

      expect(result).toEqual([{
        title: 'Test Variable',
        columnHeaders: [
          { header: '', key: 'rowHeader' },
          { header: 'Observed N', key: 'observedN' },
          { header: 'Expected N', key: 'expectedN' },
          { header: 'Residual', key: 'residual' }
        ],
        rows: [
          { rowHeader: ['1'], observedN: 10, expectedN: '8.0', residual: '2.0' },
          { rowHeader: ['2'], observedN: 15, expectedN: '12.0', residual: '3.0' },
          { rowHeader: ['3'], observedN: 5, expectedN: '10.0', residual: '-5.0' },
          { rowHeader: ['Total'], observedN: 30, expectedN: '', residual: '' }
        ]
      }]);
    });

    it('should handle null values in frequencies', () => {
      const resultsWithNulls: ChiSquareResult[] = [
        {
          variable: mockVariable,
          frequencies: {
            categoryList: ['1', '2'],
            observedN: [10, 0],
            expectedN: 10,
            residual: [0, 0],
            N: 10
          },
          testStatistics: {
            ChiSquare: 5.0,
            DF: 2,
            PValue: 0.082
          },
          metadata: {
            hasInsufficientData: false,
            totalData1: 10,
            validData1: 10,
            variable1Name: 'testVar'
          }
        }
      ];

      const result = formatFrequenciesTable(resultsWithNulls);

      expect(result).toEqual([{
        title: 'Test Variable',
        columnHeaders: [
          { header: '', key: 'rowHeader' },
          { header: 'Observed N', key: 'observedN' },
          { header: 'Expected N', key: 'expectedN' },
          { header: 'Residual', key: 'residual' }
        ],
        rows: [
          { rowHeader: ['1'], observedN: 10, expectedN: '10.0', residual: '0.0' },
          { rowHeader: ['2'], observedN: 0, expectedN: '10.0', residual: '0.0' },
          { rowHeader: ['Total'], observedN: 10, expectedN: '', residual: '' }
        ]
      }]);
    });
  });

  describe('formatErrorTable', () => {
    it('should format error table', () => {
      const result = formatErrorTable();

      expect(result).toEqual({
        title: "",
        columnHeaders: [{ header: "No Data", key: "noData" }],
        rows: []
      });
    });
  });

  describe('formatFrequenciesUseSpecifiedRange', () => {
    const mockVariable: Variable = {
      name: 'testVar',
      label: 'Test Variable',
      columnIndex: 0,
      type: 'NUMERIC',
      tempId: '1',
      width: 8,
      decimals: 0,
      values: [],
      missing: {},
      align: 'left',
      measure: 'nominal',
      role: 'input',
      columns: 8
    };

    const mockResults: ChiSquareResult[] = [
      {
        variable: mockVariable,
        frequencies: {
          categoryList: ['1', '2', '3'],
          observedN: [10, 15, 5],
          expectedN: 10,
          residual: [0, 5, -5],
          N: 30
        },
        testStatistics: {
          ChiSquare: 5.0,
          DF: 2,
          PValue: 0.082
        },
        metadata: {
          hasInsufficientData: false,
          totalData1: 30,
          validData1: 30,
          variable1Name: 'testVar'
        }
      }
    ];

    it('should format frequencies table with specified range', () => {
      const result = formatFrequenciesTable(mockResults, true);

      expect(result).toEqual({
        title: 'Frequencies',
        columnHeaders: [
          { header: '', key: 'rowHeader' },
          { header: 'Test Variable', key: 'var_0', children: [
            { header: 'Category', key: 'category0' },
            { header: 'Observed N', key: 'observedN0' },
            { header: 'Expected N', key: 'expectedN0' },
            { header: 'Residual', key: 'residual0' }
          ]}
        ],
        rows: [
          { rowHeader: [1], category0: '1', observedN0: 10, expectedN0: '10.0', residual0: '0.0' },
          { rowHeader: [2], category0: '2', observedN0: 15, expectedN0: '10.0', residual0: '5.0' },
          { rowHeader: [3], category0: '3', observedN0: 5, expectedN0: '10.0', residual0: '-5.0' },
          { rowHeader: ['Total'], observedN0: 30 }
        ]
      });
    });

    it('should handle range with no observed data', () => {
      const result = formatFrequenciesTable([], true);

      expect(result).toEqual({
        title: 'Frequencies',
        columnHeaders: [{ header: 'No Data', key: 'noData' }],
        rows: []
      });
    });
  });
}); 
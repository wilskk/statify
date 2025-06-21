import { generateExcelWorkbook } from '../utils/excelExporter';
import { DataRow } from '@/types/Data';
import { Variable } from '@/types/Variable';
import { ExcelUtilOptions } from '../types';
import * as XLSX from 'xlsx';

// Mock the XLSX library to inspect its usage without creating actual files
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({ SheetNames: [], Sheets: {} })),
    aoa_to_sheet: jest.fn(data => ({ '!ref': `A1:B${data.length}` })),
    book_append_sheet: jest.fn(),
  },
}));

const mockedXLSXUtils = XLSX.utils as jest.Mocked<typeof XLSX.utils>;

describe('generateExcelWorkbook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockVariables: Variable[] = [
    { name: 'ID', columnIndex: 0, type: 'numeric', measure: 'nominal', values: [] },
    { name: 'Name', columnIndex: 1, type: 'string', measure: 'nominal', values: [] },
  ];
  const mockData: DataRow[] = [
    { 0: 1, 1: 'Alice' },
    { 0: 2, 1: 'Bob' },
  ];
  const mockMeta = { project: 'Test Project' };
  const defaultOptions: ExcelUtilOptions = {
    includeHeaders: true,
    includeVariablePropertiesSheet: true,
    includeMetadataSheet: true,
    includeDataLabels: false,
    applyHeaderStyling: true,
  };

  it('should create a new workbook', () => {
    generateExcelWorkbook(mockData, mockVariables, mockMeta, defaultOptions);
    expect(mockedXLSXUtils.book_new).toHaveBeenCalledTimes(1);
  });

  it('should create Data sheet with headers if specified', () => {
    generateExcelWorkbook(mockData, mockVariables, mockMeta, { ...defaultOptions, includeHeaders: true });
    expect(mockedXLSXUtils.aoa_to_sheet).toHaveBeenCalledWith([
      ['ID', 'Name'],
      [1, 'Alice'],
      [2, 'Bob'],
    ]);
    expect(mockedXLSXUtils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'Data');
  });

  it('should create Data sheet without headers if not specified', () => {
    generateExcelWorkbook(mockData, mockVariables, mockMeta, { ...defaultOptions, includeHeaders: false });
    expect(mockedXLSXUtils.aoa_to_sheet).toHaveBeenCalledWith([
      [1, 'Alice'],
      [2, 'Bob'],
    ]);
  });

  it('should create Variable Properties sheet if specified', () => {
    generateExcelWorkbook(mockData, mockVariables, mockMeta, { ...defaultOptions, includeVariablePropertiesSheet: true });
    expect(mockedXLSXUtils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'VariableProperties');
  });

  it('should not create Variable Properties sheet if not specified', () => {
    generateExcelWorkbook(mockData, mockVariables, mockMeta, { ...defaultOptions, includeVariablePropertiesSheet: false });
    expect(mockedXLSXUtils.book_append_sheet).not.toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'VariableProperties');
  });

  it('should create Metadata sheet if specified and meta is available', () => {
    generateExcelWorkbook(mockData, mockVariables, mockMeta, { ...defaultOptions, includeMetadataSheet: true });
    expect(mockedXLSXUtils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'Metadata');
  });

  it('should not create Metadata sheet if not specified', () => {
    generateExcelWorkbook(mockData, mockVariables, mockMeta, { ...defaultOptions, includeMetadataSheet: false });
    expect(mockedXLSXUtils.book_append_sheet).not.toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'Metadata');
  });

  it('should not create Metadata sheet if meta is null', () => {
    generateExcelWorkbook(mockData, mockVariables, null, { ...defaultOptions, includeMetadataSheet: true });
    expect(mockedXLSXUtils.book_append_sheet).not.toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'Metadata');
  });

  it('should represent missing data with SYSMIS text when option is true', () => {
    const dataWithMissing: DataRow[] = [{ 0: 1, 1: undefined }];
    generateExcelWorkbook(dataWithMissing, mockVariables, null, { ...defaultOptions, includeDataLabels: true, includeHeaders: false });
    expect(mockedXLSXUtils.aoa_to_sheet).toHaveBeenCalledWith([
        [1, 'SYSMIS'],
    ]);
  });
}); 
import { renderHook, act } from '@testing-library/react';
import { useExportExcelLogic } from '../hooks/useExportExcelLogic';
import * as excelExporter from '../utils/excelExporter';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useMetaStore } from '@/stores/useMetaStore';
import { DEFAULT_FILENAME } from '../utils/constants';

// Mock dependencies
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useMetaStore');
jest.mock('../utils/excelExporter');
jest.mock('xlsx', () => ({
  writeFile: jest.fn(),
}));

const mockedUseToast = useToast as jest.Mock;
const mockedToast = jest.fn();
const mockedUseDataStore = useDataStore as jest.Mock;
const mockedUseVariableStore = useVariableStore as jest.Mock;
const mockedUseMetaStore = useMetaStore as jest.Mock;
const mockedGenerateExcelWorkbook = excelExporter.generateExcelWorkbook as jest.Mock;
const mockedXLSXWriteFile = XLSX.writeFile as jest.Mock;

describe('useExportExcelLogic', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseToast.mockReturnValue({ toast: mockedToast });

    // Default store mocks
    mockedUseDataStore.mockReturnValue({ data: [{ '0': 'a', '1': 1 }] });
    mockedUseVariableStore.mockReturnValue({ variables: [{ name: 'var1', columnIndex: 0 }, { name: 'var2', columnIndex: 1 }] });
    mockedUseMetaStore.mockReturnValue({ meta: { name: 'test-project' } });
  });

  it('should initialize with filename from metaStore', () => {
    const { result } = renderHook(() => useExportExcelLogic({ onClose: mockOnClose }));
    expect(result.current.exportOptions.filename).toBe('test-project');
  });

  it('should initialize with default filename if meta name is not available', () => {
    mockedUseMetaStore.mockReturnValue({ meta: { name: '' } });
    const { result } = renderHook(() => useExportExcelLogic({ onClose: mockOnClose }));
    expect(result.current.exportOptions.filename).toBe(DEFAULT_FILENAME);
  });

  it('should handle filename change and sanitize it', () => {
    const { result } = renderHook(() => useExportExcelLogic({ onClose: mockOnClose }));
    act(() => {
      result.current.handleFilenameChange('my/file?name*');
    });
    expect(result.current.exportOptions.filename).toBe('myfilename');
  });

  it('should handle options change', () => {
    const { result } = renderHook(() => useExportExcelLogic({ onClose: mockOnClose }));
    act(() => {
      result.current.handleChange('includeHeaders', false);
    });
    expect(result.current.exportOptions.includeHeaders).toBe(false);

    act(() => {
      result.current.handleChange('format', 'xls');
    });
    expect(result.current.exportOptions.format).toBe('xls');
  });
  
  it('should not export and show toast if data is empty', async () => {
    mockedUseDataStore.mockReturnValue({ data: [] });
    const { result } = renderHook(() => useExportExcelLogic({ onClose: mockOnClose }));

    await act(async () => {
      await result.current.handleExport();
    });

    expect(mockedToast).toHaveBeenCalledWith({
      title: "No data to export",
      description: "There is no data available to export to Excel.",
      variant: "destructive",
    });
    expect(mockedGenerateExcelWorkbook).not.toHaveBeenCalled();
    expect(mockedXLSXWriteFile).not.toHaveBeenCalled();
  });

  it('should call exporter, write file, and show success toast on successful export', async () => {
    const mockWorkbook = { SheetNames: [], Sheets: {} };
    mockedGenerateExcelWorkbook.mockReturnValue(mockWorkbook);
    const { result } = renderHook(() => useExportExcelLogic({ onClose: mockOnClose }));

    await act(async () => {
        await result.current.handleExport();
    });

    expect(mockedGenerateExcelWorkbook).toHaveBeenCalledTimes(1);
    expect(mockedXLSXWriteFile).toHaveBeenCalledWith(mockWorkbook, 'test-project.xlsx');
    expect(mockedToast).toHaveBeenCalledWith({
      title: "Export Successful",
      description: `Data successfully exported to test-project.xlsx`,
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should handle export error and show error toast', async () => {
    const error = new Error('Export failed');
    mockedGenerateExcelWorkbook.mockImplementation(() => {
      throw error;
    });
    const { result } = renderHook(() => useExportExcelLogic({ onClose: mockOnClose }));

    await act(async () => {
      await result.current.handleExport();
    });

    expect(mockedToast).toHaveBeenCalledWith({
      title: 'Export Failed',
      description: 'Export failed',
      variant: 'destructive',
    });
    expect(mockOnClose).not.toHaveBeenCalled();
  });
}); 
import { renderHook, act } from '@testing-library/react';
import { useFindReplaceForm } from '../useFindReplaceForm';
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';
import { useTableRefStore } from '@/stores/useTableRefStore';

// Mock Zustand stores
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useTableRefStore');

// Define mock types
const mockUseVariableStore = useVariableStore as unknown as jest.Mock;
const mockUseDataStore = useDataStore as unknown as jest.Mock;
const mockUseTableRefStore = useTableRefStore as unknown as jest.Mock;

const mockVariables = [
  { name: 'Var1', columnIndex: 0 },
  { name: 'Var2', columnIndex: 1 },
];

const mockData = [
  ['A', 'B'],
  ['a', 'C'],
  ['Apple', 'Banana'],
];

const mockUpdateCell = jest.fn();
const mockUpdateCells = jest.fn();
const mockSelectCell = jest.fn();
const mockDeselectCell = jest.fn();
const mockScrollViewportTo = jest.fn();

describe('useFindReplaceForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseVariableStore.mockImplementation(selector => selector({ variables: mockVariables }));
    mockUseDataStore.mockImplementation(selector => selector({
      data: mockData,
      updateCell: mockUpdateCell,
      updateCells: mockUpdateCells,
    }));
    mockUseTableRefStore.mockImplementation(selector => selector({
      dataTableRef: {
        current: {
          hotInstance: {
            selectCell: mockSelectCell,
            deselectCell: mockDeselectCell,
            scrollViewportTo: mockScrollViewportTo,
          },
        },
      },
    }));
  });

  afterEach(() => {
    // No longer using fake timers
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFindReplaceForm({}));

    expect(result.current.findText).toBe('');
    expect(result.current.replaceText).toBe('');
    expect(result.current.matchCase).toBe(false);
    expect(result.current.findError).toBe('');
    expect(result.current.searchResultsCount).toBe(0);
    expect(result.current.columnNames).toEqual(['Var1', 'Var2']);
    expect(result.current.selectedColumnName).toBe('Var1');
  });

  it('should clear results if find text is empty', async () => {
    const { result } = renderHook(() => useFindReplaceForm({}));

    // First find something
    await act(async () => {
      result.current.handleFindChange('a');
    });
    expect(result.current.searchResultsCount).toBe(2);

    // Then clear it
    await act(async () => {
      result.current.handleFindChange('');
    });

    expect(result.current.findError).toBe('');
    expect(result.current.searchResultsCount).toBe(0);
  });

  it('should perform a case-insensitive search correctly', async () => {
    const { result } = renderHook(() => useFindReplaceForm({}));

    await act(async () => {
      result.current.setSelectedColumnName('Var1');
      result.current.handleFindChange('a');
    });

    expect(result.current.findError).toBe('');
    expect(result.current.searchResultsCount).toBe(2); // 'A' and 'a'
  });

  it('should perform a case-sensitive search correctly', async () => {
    const { result } = renderHook(() => useFindReplaceForm({}));

    await act(async () => {
      result.current.setSelectedColumnName('Var1');
      result.current.setMatchCase(true);
      result.current.handleFindChange('a');
    });

    expect(result.current.findError).toBe('');
    expect(result.current.searchResultsCount).toBe(1); // only 'a'
  });

  it('should show no results found message', async () => {
    const { result } = renderHook(() => useFindReplaceForm({}));

    await act(async () => {
      result.current.handleFindChange('nonexistent');
    });

    expect(result.current.findError).toBe('No results found.');
    expect(result.current.searchResultsCount).toBe(0);
  });
});

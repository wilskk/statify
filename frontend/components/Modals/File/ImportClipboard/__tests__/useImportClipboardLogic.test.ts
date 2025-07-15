import { renderHook, act } from '@testing-library/react';
import { useImportClipboardLogic } from '../hooks/useImportClipboardLogic';

// Mock the useMobile hook
jest.mock('@/hooks/useMobile', () => ({
  useMobile: () => ({ isMobile: false, isPortrait: false }),
}));

describe('useImportClipboardLogic', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values and "paste" stage', () => {
    const { result } = renderHook(() => useImportClipboardLogic({ onClose: mockOnClose }));
    expect(result.current.stage).toBe('paste');
    expect(result.current.pastedText).toBeNull();
    expect(result.current.parsedData).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should update pastedText and parsedData on handleTextPaste', () => {
    const { result } = renderHook(() => useImportClipboardLogic({ onClose: mockOnClose }));
    const testText = 'a\tb\nc\td';

    act(() => {
      result.current.handleTextPaste(testText);
    });

    expect(result.current.pastedText).toBe(testText);
    expect(result.current.parsedData).toEqual([['a', 'b'], ['c', 'd']]);
    expect(result.current.error).toBeNull();
  });
  
  it('should clear error on new text paste', () => {
    const { result } = renderHook(() => useImportClipboardLogic({ onClose: mockOnClose }));
    
    act(() => {
      result.current.handleContinueToConfigure(); // This will set an error
    });
    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.handleTextPaste('new data');
    });
    expect(result.current.error).toBeNull();
  });

  it('should transition from "paste" to "configure" stage', () => {
    const { result } = renderHook(() => useImportClipboardLogic({ onClose: mockOnClose }));
    
    act(() => {
      result.current.handleTextPaste('a\tb');
    });
    
    act(() => {
      result.current.handleContinueToConfigure();
    });

    expect(result.current.stage).toBe('configure');
  });

  it('should not transition to "configure" if there is no pasted text', () => {
    const { result } = renderHook(() => useImportClipboardLogic({ onClose: mockOnClose }));
    
    act(() => {
      result.current.handleContinueToConfigure();
    });

    expect(result.current.stage).toBe('paste');
    expect(result.current.error).toBe('Please paste some data first.');
  });
  
  it('should transition back from "configure" to "paste" stage', () => {
    const { result } = renderHook(() => useImportClipboardLogic({ onClose: mockOnClose }));

    // Go to configure stage first
    act(() => {
      result.current.handleTextPaste('a\tb');
    });
    act(() => {
      result.current.handleContinueToConfigure();
    });
    expect(result.current.stage).toBe('configure');
    
    // Go back
    act(() => {
      result.current.handleBackToPaste();
    });

    expect(result.current.stage).toBe('paste');
  });

  it('should call onClose when handleModalClose is called', () => {
    const { result } = renderHook(() => useImportClipboardLogic({ onClose: mockOnClose }));
    
    act(() => {
      result.current.handleModalClose();
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
}); 
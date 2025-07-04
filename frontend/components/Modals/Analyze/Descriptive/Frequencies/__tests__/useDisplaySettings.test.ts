import { renderHook, act } from '@testing-library/react';
import { useDisplaySettings } from '../hooks/useDisplaySettings';

describe('useDisplaySettings', () => {
  it('should initialize with showFrequencyTables as true by default', () => {
    const { result } = renderHook(() => useDisplaySettings());
    expect(result.current.showFrequencyTables).toBe(true);
  });

  it('should initialize with a given initial setting', () => {
    const { result } = renderHook(() => useDisplaySettings({ showFrequencyTables: false }));
    expect(result.current.showFrequencyTables).toBe(false);
  });

  it('should update the showFrequencyTables state', () => {
    const { result } = renderHook(() => useDisplaySettings());

    act(() => {
      result.current.setShowFrequencyTables(false);
    });

    expect(result.current.showFrequencyTables).toBe(false);
  });

  it('should reset the state to the default value', () => {
    // Start with a non-default value
    const { result } = renderHook(() => useDisplaySettings({ showFrequencyTables: false }));
    
    // Reset it
    act(() => {
      result.current.resetDisplaySettings();
    });

    // Should be back to the default
    expect(result.current.showFrequencyTables).toBe(true);
  });
}); 
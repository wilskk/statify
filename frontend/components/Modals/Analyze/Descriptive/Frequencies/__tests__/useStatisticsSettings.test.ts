import { renderHook, act } from '@testing-library/react';
import { useStatisticsSettings } from '../hooks/useStatisticsSettings';

describe('useStatisticsSettings', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useStatisticsSettings());
    expect(result.current.showStatistics).toBe(true);
    expect(result.current.meanChecked).toBe(false);
    expect(result.current.percentileValues).toEqual([]);
  });

  it('should initialize with provided initial values', () => {
    const { result } = renderHook(() => useStatisticsSettings({
      initialShowStatistics: false,
      initialMean: true,
      initialPercentileValues: ['25', '75'],
    }));
    expect(result.current.showStatistics).toBe(false);
    expect(result.current.meanChecked).toBe(true);
    expect(result.current.percentileValues).toEqual(['25', '75']);
  });

  it('should update a value', () => {
    const { result } = renderHook(() => useStatisticsSettings());
    
    act(() => {
      result.current.setMeanChecked(true);
    });

    expect(result.current.meanChecked).toBe(true);
  });

  it('should reset all settings to their default values', () => {
    const { result } = renderHook(() => useStatisticsSettings({ initialMean: true }));

    act(() => {
      result.current.resetStatisticsSettings();
    });

    expect(result.current.meanChecked).toBe(false);
    expect(result.current.showStatistics).toBe(true);
  });

  it('should return null for options when showStatistics is false', () => {
    const { result } = renderHook(() => useStatisticsSettings({ initialShowStatistics: false }));
    
    const options = result.current.getCurrentStatisticsOptions();
    
    expect(options).toBeNull();
  });

  it('should return correct options object when showStatistics is true', () => {
    const { result } = renderHook(() => useStatisticsSettings());
    
    act(() => {
      result.current.setMeanChecked(true);
      result.current.setStdDevChecked(true);
      result.current.setEnablePercentiles(true);
      result.current.setPercentileValues(['50']);
    });

    const options = result.current.getCurrentStatisticsOptions();

    expect(options).not.toBeNull();
    expect(options?.centralTendency.mean).toBe(true);
    expect(options?.dispersion.stddev).toBe(true);
    expect(options?.percentileValues.enablePercentiles).toBe(true);
    expect(options?.percentileValues.percentilesList).toEqual(['50']);
    expect(options?.distribution.skewness).toBe(false);
  });
  
  it('should manage percentile values correctly', () => {
    const { result } = renderHook(() => useStatisticsSettings());

    act(() => {
      result.current.setCurrentPercentileInput('25');
    });
    // This part of the logic is in the component, so we just test the state changes here.
    // The component would call setPercentileValues.
    act(() => {
        result.current.setPercentileValues([...result.current.percentileValues, result.current.currentPercentileInput]);
        result.current.setCurrentPercentileInput('');
    });
    
    expect(result.current.percentileValues).toEqual(['25']);
    expect(result.current.currentPercentileInput).toBe('');
  });
}); 
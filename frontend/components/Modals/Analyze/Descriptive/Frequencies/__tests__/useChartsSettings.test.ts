import { renderHook, act } from '@testing-library/react';
import { useChartsSettings } from '../hooks/useChartsSettings';
import type { ChartOptions } from '../types';

describe('useChartsSettings', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useChartsSettings());

    expect(result.current.showCharts).toBe(false);
    expect(result.current.chartType).toBe('none');
    expect(result.current.chartValues).toBe('frequencies');
    expect(result.current.showNormalCurve).toBe(false);
  });

  it('should initialize with provided initial values', () => {
    const { result } = renderHook(() => useChartsSettings({
      initialShowCharts: true,
      initialChartType: 'barCharts',
      initialChartValues: 'percentages',
    }));

    expect(result.current.showCharts).toBe(true);
    expect(result.current.chartType).toBe('barCharts');
    expect(result.current.chartValues).toBe('percentages');
  });

  it('should update chart type', () => {
    const { result } = renderHook(() => useChartsSettings());

    act(() => {
      result.current.setChartType('pieCharts');
    });

    expect(result.current.chartType).toBe('pieCharts');
  });

  it('should reset settings to default', () => {
    const { result } = renderHook(() => useChartsSettings({ initialShowCharts: true, initialChartType: 'histograms' }));

    act(() => {
      result.current.resetChartsSettings();
    });

    expect(result.current.showCharts).toBe(false);
    expect(result.current.chartType).toBe('none');
  });

  it('should return null from getCurrentChartOptions when showCharts is false', () => {
    const { result } = renderHook(() => useChartsSettings({ initialShowCharts: false }));
    const options = result.current.getCurrentChartOptions();
    expect(options).toBeNull();
  });

  it('should return correct options from getCurrentChartOptions when showCharts is true', () => {
    const { result } = renderHook(() => useChartsSettings({ initialShowCharts: true }));

    act(() => {
      result.current.setChartType('barCharts');
      result.current.setChartValues('percentages');
    });

    const options = result.current.getCurrentChartOptions();
    
    expect(options).toEqual<ChartOptions>({
      type: 'barCharts',
      values: 'percentages',
      showNormalCurveOnHistogram: false,
    });
  });

  it('should correctly handle the normal curve option for histograms', () => {
    const { result } = renderHook(() => useChartsSettings({ initialShowCharts: true }));

    act(() => {
      result.current.setChartType('histograms');
      result.current.setShowNormalCurve(true);
    });

    const options = result.current.getCurrentChartOptions();
    expect(options?.showNormalCurveOnHistogram).toBe(true);

    // Should be false for other chart types
    act(() => {
      result.current.setChartType('barCharts');
    });

    const options2 = result.current.getCurrentChartOptions();
    expect(options2?.showNormalCurveOnHistogram).toBe(false);
  });
  
  it('should return null for chart type if "none" is selected', () => {
    const { result } = renderHook(() => useChartsSettings({ initialShowCharts: true, initialChartType: 'none' }));
    const options = result.current.getCurrentChartOptions();
    expect(options?.type).toBeNull();
  });
}); 
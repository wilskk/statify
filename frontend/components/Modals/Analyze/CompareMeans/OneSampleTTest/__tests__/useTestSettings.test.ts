import { renderHook, act } from '@testing-library/react';
import { useTestSettings } from '../hooks/useTestSettings';

describe('useTestSettings hook', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useTestSettings());

    const { testValue, estimateEffectSize } = result.current;

    expect(testValue).toBe(0);
    expect(estimateEffectSize).toBe(false);
  });

  it('initializes with provided values', () => {
    const { result } = renderHook(() => useTestSettings({
      initialTestValue: 10,
      initialEstimateEffectSize: true
    }));

    expect(result.current.testValue).toBe(10);
    expect(result.current.estimateEffectSize).toBe(true);
  });

  it('allows updating test value', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setTestValue(5);
    });

    expect(result.current.testValue).toBe(5);
  });

  it('allows updating estimate effect size flag', () => {
    const { result } = renderHook(() => useTestSettings());

    act(() => {
      result.current.setEstimateEffectSize(true);
    });

    expect(result.current.estimateEffectSize).toBe(true);
  });

  it('resets to default values', () => {
    const { result } = renderHook(() => useTestSettings({
      initialTestValue: 0,
      initialEstimateEffectSize: false
    }));

    act(() => {
      result.current.setTestValue(5);
      result.current.setEstimateEffectSize(true);
    });

    act(() => {
      result.current.resetTestSettings();
    });

    expect(result.current.testValue).toBe(0);
    expect(result.current.estimateEffectSize).toBe(false);
  });
}); 
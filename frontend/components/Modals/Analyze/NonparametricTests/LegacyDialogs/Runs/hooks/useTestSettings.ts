import { useState, useCallback } from 'react';
import { TestSettingsProps, TestSettingsResult } from '../types';

export const useTestSettings = (props?: TestSettingsProps): TestSettingsResult => {
  const [cutPoint, setCutPoint] = useState<{
    median: boolean;
    mode: boolean;
    mean: boolean;
    custom: boolean;
  }>(props?.initialCutPoint ?? {
    median: true,
    mode: false,
    mean: false,
    custom: false
  });
  
  const [customValue, setCustomValue] = useState<number>(props?.initialCustomValue ?? 0);
  
  const [displayStatistics, setDisplayStatistics] = useState<{
    descriptive: boolean;
    quartiles: boolean;
  }>(props?.initialDisplayStatistics ?? {
    descriptive: false,
    quartiles: false,
  });

  // Reset function
  const resetTestSettings = useCallback(() => {
    setCutPoint(props?.initialCutPoint ?? {
      median: true,
      mode: false,
      mean: false,
      custom: false
    });
    setCustomValue(props?.initialCustomValue ?? 0);
    setDisplayStatistics(props?.initialDisplayStatistics ?? {
      descriptive: false,
      quartiles: false,
    });
  }, [props?.initialCutPoint, props?.initialCustomValue, props?.initialDisplayStatistics]);

  return {
    cutPoint,
    setCutPoint,
    customValue,
    setCustomValue,
    displayStatistics,
    setDisplayStatistics,
    resetTestSettings
  };
};

export default useTestSettings; 
import { useState, useCallback } from 'react';
import { TestSettingsProps, TestSettingsResult } from '../types';

export const useTestSettings = (props?: TestSettingsProps): TestSettingsResult => {
  const [testValue, setTestValue] = useState<number>(props?.initialTestValue ?? 0);
  const [estimateEffectSize, setEstimateEffectSize] = useState<boolean>(props?.initialEstimateEffectSize ?? false);

  // Reset function
  const resetTestSettings = useCallback(() => {
    setTestValue(props?.initialTestValue ?? 0);
    setEstimateEffectSize(props?.initialEstimateEffectSize ?? false);
  }, [props?.initialTestValue, props?.initialEstimateEffectSize]);

  return {
    testValue,
    setTestValue,
    estimateEffectSize,
    setEstimateEffectSize,
    resetTestSettings
  };
};

export default useTestSettings; 
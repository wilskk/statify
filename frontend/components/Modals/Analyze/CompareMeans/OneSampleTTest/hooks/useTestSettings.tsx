import { useState, useCallback } from 'react';
import { TestSettingsProps, TestSettingsResult, TestSettingsOptions } from '../types';

export const useTestSettings = (): TestSettingsResult => {
  const [testValue, setTestValue] = useState<number>(0);
  const [estimateEffectSize, setEstimateEffectSize] = useState<boolean>(true);

  // Reset function
  const resetTestSettings = useCallback(() => {
    setTestValue(0);
    setEstimateEffectSize(true);
  }, []);

  // Generic update function for any test setting
  const updateTestSettings = useCallback(<T extends boolean | number>(key: keyof TestSettingsOptions, value: T) => {
    if (key === 'testValue' && typeof value === 'number') {
      setTestValue(value);
    } else if (key === 'estimateEffectSize' && typeof value === 'boolean') {
      setEstimateEffectSize(value);
    }
  }, []);

  return {
    testValue,
    setTestValue,
    estimateEffectSize,
    setEstimateEffectSize,
    resetTestSettings,
    updateTestSettings
  };
};

export default useTestSettings; 
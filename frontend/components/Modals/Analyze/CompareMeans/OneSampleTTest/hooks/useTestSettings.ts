import { useState, useCallback } from 'react';
<<<<<<< HEAD
import {
=======
import type {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
  TestSettingsProps
} from '../types';

export const useTestSettings = ({
  initialTestValue = 0,
  initialEstimateEffectSize = false
}: Omit<TestSettingsProps, 'resetTestSettings'> = {}) => {
  const [testValue, setTestValue] = useState<number>(initialTestValue);
  const [estimateEffectSize, setEstimateEffectSize] = useState<boolean>(initialEstimateEffectSize);

  const resetTestSettings = useCallback(() => {
    setTestValue(initialTestValue);
    setEstimateEffectSize(initialEstimateEffectSize);
  }, [initialTestValue, initialEstimateEffectSize]);

  return {
    testValue,
    setTestValue,
    estimateEffectSize,
    setEstimateEffectSize,
    resetTestSettings
  };
};

export default useTestSettings; 
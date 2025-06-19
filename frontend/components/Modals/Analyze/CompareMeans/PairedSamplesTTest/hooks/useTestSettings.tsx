import { useState, useCallback, useEffect } from 'react';
import { TestSettingsProps, TestSettingsResult, TestSettings } from '../types';

export const useTestSettings = (props?: TestSettingsProps): TestSettingsResult => {
  const [estimateEffectSize, setEstimateEffectSize] = useState<boolean>(false);
  const [calculateStandardizer, setCalculateStandardizer] = useState<{
    standardDeviation: boolean;
    correctedStandardDeviation: boolean;
    averageOfVariances: boolean;
  }>({
    standardDeviation: true,
    correctedStandardDeviation: false,
    averageOfVariances: false
  });

  // Reset function
  const resetTestSettings = useCallback(() => {
    setEstimateEffectSize(false);
    setCalculateStandardizer({
      standardDeviation: true,
      correctedStandardDeviation: false,
      averageOfVariances: false
    });
  }, []);

  // Notify parent component of changes if onChange is provided
  useEffect(() => {
    if (props?.onChange) {
      const settings: TestSettings = {
        estimateEffectSize,
        calculateStandardizer
      };
      props.onChange(settings);
    }
  }, [props, estimateEffectSize, calculateStandardizer]);

  return {
    estimateEffectSize,
    setEstimateEffectSize,
    calculateStandardizer,
    setCalculateStandardizer,
    resetTestSettings
  };
};

export default useTestSettings; 
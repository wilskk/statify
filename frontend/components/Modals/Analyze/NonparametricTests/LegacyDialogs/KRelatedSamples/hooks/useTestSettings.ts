import { useState, useCallback } from 'react';
<<<<<<< HEAD
import {
=======
import type {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
  TestSettingsProps,
  TestTypeOptions,
  DisplayStatisticsOptions,
} from '../types';

export const useTestSettings = ({
  initialTestType = {
    friedman: true,
    kendallsW: false,
    cochransQ: false
  },
  initialDisplayStatistics = {
    descriptive: false,
    quartiles: false
  }
}: Omit<TestSettingsProps, 'resetTestSettings'> = {}) => {
  const [testType, setTestType] = useState<TestTypeOptions>(initialTestType);
  const [displayStatistics, setDisplayStatistics] = useState<DisplayStatisticsOptions>(initialDisplayStatistics);

  const resetTestSettings = useCallback(() => {
    setTestType(initialTestType);
    setDisplayStatistics(initialDisplayStatistics);
  }, [initialTestType, initialDisplayStatistics]);

  return {
    testType,
    setTestType,
    displayStatistics,
    setDisplayStatistics,
    resetTestSettings
  };
};

export default useTestSettings; 
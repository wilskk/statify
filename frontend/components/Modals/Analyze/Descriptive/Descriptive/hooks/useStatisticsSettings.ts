import { useState } from 'react';

export interface DescriptiveStatisticsOptions {
  mean: boolean;
  stdDev: boolean;
  minimum: boolean;
  maximum: boolean;
  variance: boolean;
  range: boolean;
  sum: boolean;
  median: boolean;
  skewness: boolean;
  kurtosis: boolean;
  standardError: boolean;
}

export type DisplayOrderType = 'variableList' | 'alphabetic' | 'ascendingMeans' | 'descendingMeans';

interface UseStatisticsSettingsProps {
  initialDisplayStatistics?: Partial<DescriptiveStatisticsOptions>;
  initialDisplayOrder?: DisplayOrderType;
  initialSaveStandardized?: boolean;
}

export const useStatisticsSettings = ({
  initialDisplayStatistics = {},
  initialDisplayOrder = 'variableList',
  initialSaveStandardized = false
}: UseStatisticsSettingsProps = {}) => {
  const defaultStatistics: DescriptiveStatisticsOptions = {
    mean: true,
    stdDev: true,
    minimum: true,
    maximum: true,
    variance: false,
    range: false,
    sum: false,
    median: false,
    skewness: false,
    kurtosis: false,
    standardError: false,
    ...initialDisplayStatistics
  };

  const [displayStatistics, setDisplayStatistics] = useState<DescriptiveStatisticsOptions>(defaultStatistics);
  const [displayOrder, setDisplayOrder] = useState<DisplayOrderType>(initialDisplayOrder);
  const [saveStandardized, setSaveStandardized] = useState(initialSaveStandardized);

  const resetStatisticsSettings = () => {
    setDisplayStatistics(defaultStatistics);
    setDisplayOrder('variableList');
    setSaveStandardized(false);
  };

  const updateStatistic = (key: keyof DescriptiveStatisticsOptions, value: boolean) => {
    setDisplayStatistics(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return {
    displayStatistics,
    setDisplayStatistics,
    updateStatistic,
    displayOrder,
    setDisplayOrder,
    saveStandardized,
    setSaveStandardized,
    resetStatisticsSettings
  };
}; 
import { useState, useCallback } from 'react';
import { TestSettingsProps, TestSettingsResult } from '../types';

export const useTestSettings = (props?: TestSettingsProps): TestSettingsResult => {
  // Expected Range settings
  const [expectedRange, setExpectedRange] = useState<{
    getFromData: boolean;
    useSpecificRange: boolean;
  }>(props?.initialExpectedRange ?? {
    getFromData: true,
    useSpecificRange: false
  });

  // Range Value settings
  const [rangeValue, setRangeValue] = useState<{
    lowerValue: number | null;
    upperValue: number | null;
  }>(props?.initialRangeValue ?? {
    lowerValue: null,
    upperValue: null
  });

  // Expected Value settings
  const [expectedValue, setExpectedValue] = useState<{
    allCategoriesEqual: boolean;
    values: boolean;
    inputValue: number | null;
  }>(props?.initialExpectedValue ?? {
    allCategoriesEqual: true,
    values: false,
    inputValue: null
  });

  // Expected Value List
  const [expectedValueList, setExpectedValueList] = useState<string[]>(
    props?.initialExpectedValueList ?? []
  );

  // Highlighted Expected Value
  const [highlightedExpectedValue, setHighlightedExpectedValue] = useState<string | null>(null);

  // Display Statistics settings
  const [displayStatistics, setDisplayStatistics] = useState<{
    descriptive: boolean;
    quartiles: boolean;
  }>(props?.initialDisplayStatistics ?? {
    descriptive: false,
    quartiles: false
  });

  // Handler for adding expected value
  const handleAddExpectedValue = useCallback(() => {
    if (expectedValue.inputValue !== null && expectedValue.inputValue !== 0) {
      const stringValue = expectedValue.inputValue.toString();
      setExpectedValueList(prev => [...prev, stringValue]);
      setExpectedValue(prev => ({ ...prev, inputValue: null }));
    }
  }, [expectedValue]);

  // Handler for removing expected value
  const handleRemoveExpectedValue = useCallback((value: string) => {
    setExpectedValueList(prev => prev.filter(v => v !== value));
    setHighlightedExpectedValue(null);
  }, []);

  // Handler for changing expected value
  const handleChangeExpectedValue = useCallback((oldValue: string) => {
    if (expectedValue.inputValue !== null) {
      const stringValue = expectedValue.inputValue.toString();
      setExpectedValueList(prev => prev.map(value => 
        value === oldValue ? stringValue : value
      ));
      setHighlightedExpectedValue(null);
      setExpectedValue(prev => ({ ...prev, inputValue: null }));
    }
  }, [expectedValue]);

  // Reset function
  const resetTestSettings = useCallback(() => {
    setExpectedRange(props?.initialExpectedRange ?? {
      getFromData: true,
      useSpecificRange: false
    });
    setRangeValue(props?.initialRangeValue ?? {
      lowerValue: null,
      upperValue: null
    });
    setExpectedValue(props?.initialExpectedValue ?? {
      allCategoriesEqual: true,
      values: false,
      inputValue: null
    });
    setExpectedValueList(props?.initialExpectedValueList ?? []);
    setHighlightedExpectedValue(null);
    setDisplayStatistics(props?.initialDisplayStatistics ?? {
      descriptive: false,
      quartiles: false
    });
  }, [props?.initialExpectedRange, props?.initialRangeValue, props?.initialExpectedValue, props?.initialExpectedValueList, props?.initialDisplayStatistics]);

  return {
    expectedRange,
    setExpectedRange,
    rangeValue,
    setRangeValue,
    expectedValue,
    setExpectedValue,
    expectedValueList,
    setExpectedValueList,
    highlightedExpectedValue,
    setHighlightedExpectedValue,
    displayStatistics,
    setDisplayStatistics,
    handleAddExpectedValue,
    handleRemoveExpectedValue,
    handleChangeExpectedValue,
    resetTestSettings
  };
};

export default useTestSettings; 
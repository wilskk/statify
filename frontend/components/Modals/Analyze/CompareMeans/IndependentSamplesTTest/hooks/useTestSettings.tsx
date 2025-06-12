import { useState, useCallback } from 'react';
import { TestSettingsProps, TestSettingsResult, DefineGroupsOptions } from '../types';

export const useTestSettings = (props?: TestSettingsProps): TestSettingsResult => {
  const [estimateEffectSize, setEstimateEffectSize] = useState<boolean>(
    props?.initialEstimateEffectSize ?? false
  );
  
  const [defineGroups, setDefineGroups] = useState<DefineGroupsOptions>(
    props?.initialDefineGroups ?? { useSpecifiedValues: true, cutPoint: false }
  );
  
  const [group1, setGroup1] = useState<number | null>(props?.initialGroup1 ?? null);
  const [group2, setGroup2] = useState<number | null>(props?.initialGroup2 ?? null);
  const [cutPointValue, setCutPointValue] = useState<number | null>(props?.initialCutPointValue ?? null);

  // Reset function
  const resetTestSettings = useCallback(() => {
    setEstimateEffectSize(props?.initialEstimateEffectSize ?? false);
    setDefineGroups(props?.initialDefineGroups ?? { useSpecifiedValues: true, cutPoint: false });
    setGroup1(props?.initialGroup1 ?? null);
    setGroup2(props?.initialGroup2 ?? null);
    setCutPointValue(props?.initialCutPointValue ?? null);
  }, [
    props?.initialEstimateEffectSize,
    props?.initialDefineGroups,
    props?.initialGroup1,
    props?.initialGroup2,
    props?.initialCutPointValue
  ]);

  return {
    estimateEffectSize,
    setEstimateEffectSize,
    defineGroups,
    setDefineGroups,
    group1,
    setGroup1,
    group2,
    setGroup2,
    cutPointValue,
    setCutPointValue,
    resetTestSettings
  };
};

export default useTestSettings; 
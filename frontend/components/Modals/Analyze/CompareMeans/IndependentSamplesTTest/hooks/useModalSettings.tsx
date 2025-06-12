import { useState, useCallback, useEffect } from 'react';
import { ModalSettingsProps, ModalSettingsResult, DefineGroupsOptions } from '../types';

export const useModalSettings = (
  props: ModalSettingsProps,
  defineGroups: DefineGroupsOptions,
  setDefineGroups: React.Dispatch<React.SetStateAction<DefineGroupsOptions>>,
  group1: number | null,
  setGroup1: React.Dispatch<React.SetStateAction<number | null>>,
  group2: number | null,
  setGroup2: React.Dispatch<React.SetStateAction<number | null>>,
  cutPointValue: number | null,
  setCutPointValue: React.Dispatch<React.SetStateAction<number | null>>
): ModalSettingsResult => {
  const [showDefineGroupsModal, setShowDefineGroupsModal] = useState<boolean>(false);
  const [tempDefineGroups, setTempDefineGroups] = useState<DefineGroupsOptions>(defineGroups);
  const [tempGroup1, setTempGroup1] = useState<number | null>(group1);
  const [tempGroup2, setTempGroup2] = useState<number | null>(group2);
  const [tempCutPointValue, setTempCutPointValue] = useState<number | null>(cutPointValue);
  const [groupRangeError, setGroupRangeError] = useState<string | null>(null);

  // When modal is shown, update temporary values
  useEffect(() => {
    if (showDefineGroupsModal) {
      setTempGroup1(group1);
      setTempGroup2(group2);
      setTempCutPointValue(cutPointValue);
      setTempDefineGroups(defineGroups);
      setGroupRangeError(null);
    }
  }, [showDefineGroupsModal, group1, group2, cutPointValue, defineGroups]);

  // Update temp values when external values change
  useEffect(() => {
    setTempDefineGroups(defineGroups);
  }, [defineGroups]);

  useEffect(() => {
    setTempGroup1(group1);
  }, [group1]);

  useEffect(() => {
    setTempGroup2(group2);
  }, [group2]);

  useEffect(() => {
    setTempCutPointValue(cutPointValue);
  }, [cutPointValue]);

  // Reset modal settings
  const resetModalSettings = useCallback(() => {
    setShowDefineGroupsModal(false);
    setTempDefineGroups(defineGroups);
    setTempGroup1(group1);
    setTempGroup2(group2);
    setTempCutPointValue(cutPointValue);
    setGroupRangeError(null);
  }, [defineGroups, group1, group2, cutPointValue]);

  // Apply group settings from temporary values
  const applyGroupSettings = useCallback(() => {
    if (tempDefineGroups.useSpecifiedValues) {
      if (tempGroup1 !== null && !Number.isInteger(tempGroup1)) {
        setGroupRangeError("Minimum value must be an integer");
        return;
      }
      
      if (tempGroup2 !== null && !Number.isInteger(tempGroup2)) {
        setGroupRangeError("Maximum value must be an integer");
        return;
      }
      
      if (tempGroup1 !== null && tempGroup2 !== null && tempGroup1 >= tempGroup2) {
        setGroupRangeError("Group 1 value must be less than Group 2 value");
        return;
      }
      
      // Ensure values are integers by rounding them
      const group1Value = tempGroup1 !== null ? Math.floor(tempGroup1) : null;
      const group2Value = tempGroup2 !== null ? Math.floor(tempGroup2) : null;
      
      setGroup1(group1Value);
      setGroup2(group2Value);
    } else {
      if (tempCutPointValue !== null && !Number.isInteger(tempCutPointValue)) {
        setGroupRangeError("Cut point must be an integer");
        return;
      }
      
      setCutPointValue(tempCutPointValue);
    }
    
    setDefineGroups(tempDefineGroups);
    setShowDefineGroupsModal(false);
  }, [
    tempDefineGroups,
    tempGroup1,
    tempGroup2,
    tempCutPointValue,
    setDefineGroups,
    setGroup1,
    setGroup2,
    setCutPointValue
  ]);

  return {
    showDefineGroupsModal,
    setShowDefineGroupsModal,
    tempDefineGroups,
    setTempDefineGroups,
    tempGroup1,
    setTempGroup1,
    tempGroup2,
    setTempGroup2,
    tempCutPointValue,
    setTempCutPointValue,
    groupRangeError,
    setGroupRangeError,
    resetModalSettings,
    applyGroupSettings
  };
};

export default useModalSettings; 
import { useState, useCallback } from 'react';
import type { DefineGroupsOptions } from '../types';

export interface GroupSettingsProps {
    initialUseSpecifiedValues: boolean;
    initialCutPoint: boolean;
    initialGroup1: number | null;
    initialGroup2: number | null;
    initialCutPointValue: number | null;
}

export interface GroupSettingsResult {
    useSpecifiedValues: boolean;
    setUseSpecifiedValues: React.Dispatch<React.SetStateAction<boolean>>;
    cutPoint: boolean;
    setCutPoint: React.Dispatch<React.SetStateAction<boolean>>;
    group1: number | null;
    setGroup1: React.Dispatch<React.SetStateAction<number | null>>;
    group2: number | null;
    setGroup2: React.Dispatch<React.SetStateAction<number | null>>;
    cutPointValue: number | null;
    setCutPointValue: React.Dispatch<React.SetStateAction<number | null>>;
    
    getCurrentDefineGroups: () => DefineGroupsOptions;
    resetDefineGroups: () => void;
}

export const useGroupSettings = ({
    initialUseSpecifiedValues = false,
    initialCutPoint = false,
    initialGroup1 = null,
    initialGroup2 = null,
    initialCutPointValue = null
}: Partial<GroupSettingsProps> = {}): GroupSettingsResult => {
    const [useSpecifiedValues, setUseSpecifiedValues] = useState<boolean>(initialUseSpecifiedValues);
    const [cutPoint, setCutPoint] = useState<boolean>(initialCutPoint);
    const [group1, setGroup1] = useState<number | null>(initialGroup1);
    const [group2, setGroup2] = useState<number | null>(initialGroup2);
    const [cutPointValue, setCutPointValue] = useState<number | null>(initialCutPointValue);

    const getCurrentDefineGroups = useCallback(() => ({
        useSpecifiedValues,
        cutPoint,
        group1,
        group2,
        cutPointValue
    }), [useSpecifiedValues, cutPoint, group1, group2, cutPointValue]);
    const resetDefineGroups = useCallback(() => {
        setUseSpecifiedValues(initialUseSpecifiedValues);
        setGroup1(initialGroup1);
        setGroup2(initialGroup2);
        setCutPointValue(initialCutPointValue);
    }, [initialUseSpecifiedValues, initialCutPoint, initialGroup1, initialGroup2, initialCutPointValue]);
    
    return {
        useSpecifiedValues,
        setUseSpecifiedValues,
        cutPoint,
        setCutPoint,
        group1,
        setGroup1,
        group2,
        setGroup2,
        cutPointValue,
        setCutPointValue,
        getCurrentDefineGroups,
        resetDefineGroups
    };
}
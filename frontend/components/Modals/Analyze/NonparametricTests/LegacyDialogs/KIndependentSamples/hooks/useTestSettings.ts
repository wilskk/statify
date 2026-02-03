import { useState, useCallback } from 'react';
<<<<<<< HEAD
import {
=======
import type {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    TestSettingsProps,
    TestType,
    DisplayStatisticsOptions
} from '../types';

export const useTestSettings = ({
    initialMinimum = null,
    initialMaximum = null,
    initialTestType = {
        kruskalWallisH: true,
        median: false,
        jonckheereTerpstra: false
    },
    initialDisplayStatistics = {
        descriptive: false,
        quartiles: false
    }
}: Omit<TestSettingsProps, 'resetTestSettings'> = {}) => {
    const [minimum, setMinimum] = useState<number | null>(initialMinimum);
    const [maximum, setMaximum] = useState<number | null>(initialMaximum);
    const [testType, setTestType] = useState<TestType>(initialTestType);
    const [displayStatistics, setDisplayStatistics] = useState<DisplayStatisticsOptions>(initialDisplayStatistics);
    
    const resetTestSettings = useCallback(() => {
        setTestType(initialTestType);
        setDisplayStatistics(initialDisplayStatistics);
    }, [initialTestType, initialDisplayStatistics]);
    
    return {
        minimum,
        setMinimum,
        maximum,
        setMaximum,
        testType,
        setTestType,
        displayStatistics,
        setDisplayStatistics,
        resetTestSettings
    };
};

export default useTestSettings;
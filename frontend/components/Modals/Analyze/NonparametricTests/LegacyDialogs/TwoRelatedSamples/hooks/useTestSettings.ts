import { useState, useCallback } from 'react';
<<<<<<< HEAD
import {
=======
import type {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    TestSettingsProps,
    TestType,
    DisplayStatistics,
} from '../types';

export const useTestSettings = ({
    initialTestType = {
        wilcoxon: true,
        sign: false,
        mcNemar: false,
        marginalHomogeneity: false
    },
    initialDisplayStatistics = {
        descriptive: false,
        quartiles: false
    },
}: Omit<TestSettingsProps, 'resetTestSettings'> = {}) => {
    const [testType, setTestType] = useState<TestType>(initialTestType);
    const [displayStatistics, setDisplayStatistics] = useState<DisplayStatistics>(initialDisplayStatistics);
    
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
import { useState, useCallback } from 'react';
<<<<<<< HEAD
import {
=======
import type {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    TestSettingsProps,
    StatisticsOptions,
    EqualVariancesAssumedOptions
} from '../types';

export const useTestSettings = ({
    initialEstimateEffectSize = false,
    initialEqualVariancesAssumed = {
        tukey: false,
        duncan: false
    },
    initialStatisticsOptions = {
        descriptive: false,
        homogeneityOfVariance: false
    }
}: Omit<TestSettingsProps, 'resetTestSettings'> = {}) => {
    const [estimateEffectSize, setEstimateEffectSize] = useState<boolean>(initialEstimateEffectSize);
    const [equalVariancesAssumed, setEqualVariancesAssumed] = useState<EqualVariancesAssumedOptions>(initialEqualVariancesAssumed);
    const [statisticsOptions, setStatisticsOptions] = useState<StatisticsOptions>(initialStatisticsOptions);
    
    const resetTestSettings = useCallback(() => {
        setEstimateEffectSize(initialEstimateEffectSize);
        setEqualVariancesAssumed(initialEqualVariancesAssumed);
        setStatisticsOptions(initialStatisticsOptions);
    }, [initialEstimateEffectSize, initialEqualVariancesAssumed, initialStatisticsOptions]);
    
    return {
        estimateEffectSize,
        setEstimateEffectSize,
        equalVariancesAssumed,
        setEqualVariancesAssumed,
        statisticsOptions,
        setStatisticsOptions,
        resetTestSettings
    };
};

export default useTestSettings;
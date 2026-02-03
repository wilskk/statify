import { useState, useCallback } from 'react';
<<<<<<< HEAD
import {
=======
import type {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    TestSettingsProps,
    CalculateStandardizer,
} from '../types';

export const useTestSettings = ({
    initialEstimateEffectSize = false,
    initialCalculateStandardizer = {
        standardDeviation: true,
        correctedStandardDeviation: false,
        averageOfVariances: false
    },
}: Omit<TestSettingsProps, 'resetTestSettings'> = {}) => {
    const [estimateEffectSize, setEstimateEffectSize] = useState<boolean>(initialEstimateEffectSize);
    const [calculateStandardizer, setCalculateStandardizer] = useState<CalculateStandardizer>(initialCalculateStandardizer);
    
    const resetTestSettings = useCallback(() => {
        setEstimateEffectSize(initialEstimateEffectSize);
        setCalculateStandardizer(initialCalculateStandardizer);
    }, [initialEstimateEffectSize, initialCalculateStandardizer]);
    
    return {
        estimateEffectSize,
        setEstimateEffectSize,
        calculateStandardizer,
        setCalculateStandardizer,
        resetTestSettings
    };
};

export default useTestSettings;
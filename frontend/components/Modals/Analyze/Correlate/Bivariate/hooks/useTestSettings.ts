import { useState, useCallback } from 'react';
import {
    TestSettingsProps,
    CorrelationCoefficient,
    TestOfSignificance,
    StatisticsOptions,
} from '../types';

export const useTestSettings = ({
    initialCorrelationCoefficient = {
        pearson: true,
        kendallsTauB: false,
        spearman: false
    },
    initialTestOfSignificance = {
        oneTailed: false,
        twoTailed: true
    },
    initialFlagSignificantCorrelations = true,
    initialShowOnlyTheLowerTriangle = false,
    initialShowDiagonal = true,
    initialPartialCorrelationKendallsTauB = false,
    initialStatisticsOptions = {
        meansAndStandardDeviations: false,
        crossProductDeviationsAndCovariances: false
    }
}: Omit<TestSettingsProps, 'resetTestSettings'> = {}) => {
    const [correlationCoefficient, setCorrelationCoefficient] = useState<CorrelationCoefficient>(initialCorrelationCoefficient);
    const [testOfSignificance, setTestOfSignificance] = useState<TestOfSignificance>(initialTestOfSignificance);
    const [flagSignificantCorrelations, setFlagSignificantCorrelations] = useState<boolean>(initialFlagSignificantCorrelations);
    const [showOnlyTheLowerTriangle, setShowOnlyTheLowerTriangle] = useState<boolean>(initialShowOnlyTheLowerTriangle);
    const [showDiagonal, setShowDiagonal] = useState<boolean>(initialShowDiagonal);
    const [statisticsOptions, setStatisticsOptions] = useState<StatisticsOptions>(initialStatisticsOptions);
    const [partialCorrelationKendallsTauB, setPartialCorrelationKendallsTauB] = useState<boolean>(initialPartialCorrelationKendallsTauB);

    const resetTestSettings = useCallback(() => {
        setCorrelationCoefficient(initialCorrelationCoefficient);
        setTestOfSignificance(initialTestOfSignificance);
        setFlagSignificantCorrelations(initialFlagSignificantCorrelations);
        setShowOnlyTheLowerTriangle(initialShowOnlyTheLowerTriangle);
        setShowDiagonal(initialShowDiagonal);
        setPartialCorrelationKendallsTauB(initialPartialCorrelationKendallsTauB);
        setStatisticsOptions(initialStatisticsOptions);
    }, [initialCorrelationCoefficient, initialTestOfSignificance, initialFlagSignificantCorrelations, initialShowOnlyTheLowerTriangle, initialShowDiagonal, initialStatisticsOptions, initialPartialCorrelationKendallsTauB]);
    
    return {
        correlationCoefficient,
        setCorrelationCoefficient,
        testOfSignificance,
        setTestOfSignificance,
        flagSignificantCorrelations,
        setFlagSignificantCorrelations,
        showOnlyTheLowerTriangle,
        setShowOnlyTheLowerTriangle,
        showDiagonal,
        setShowDiagonal,
        partialCorrelationKendallsTauB,
        setPartialCorrelationKendallsTauB,
        statisticsOptions,
        setStatisticsOptions,
        resetTestSettings
    };
};

export default useTestSettings;
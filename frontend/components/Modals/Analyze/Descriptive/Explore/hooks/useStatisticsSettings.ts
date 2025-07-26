import { useState, useCallback } from 'react';

export interface StatisticsSettings {
    showDescriptives: boolean;
    confidenceInterval: string;

    showOutliers: boolean;
}

export interface StatisticsSettingsHandlers {
    setShowDescriptives: (value: boolean) => void;
    setConfidenceInterval: (value: string) => void;

    setShowOutliers: (value: boolean) => void;
    resetStatisticsSettings: () => void;
}

export type UseStatisticsSettingsResult = StatisticsSettings & StatisticsSettingsHandlers;

const initialSettings: StatisticsSettings = {
    showDescriptives: true,
    confidenceInterval: '95',

    showOutliers: false,
};

export const useStatisticsSettings = (): UseStatisticsSettingsResult => {
    const [showDescriptives, setShowDescriptives] = useState<boolean>(initialSettings.showDescriptives);
    const [confidenceInterval, setConfidenceInterval] = useState<string>(initialSettings.confidenceInterval);

    const [showOutliers, setShowOutliers] = useState<boolean>(initialSettings.showOutliers);

    const resetStatisticsSettings = useCallback(() => {
        setShowDescriptives(initialSettings.showDescriptives);
        setConfidenceInterval(initialSettings.confidenceInterval);

        setShowOutliers(initialSettings.showOutliers);
    }, []);

    return {
        showDescriptives,
        setShowDescriptives,
        confidenceInterval,
        setConfidenceInterval,

        showOutliers,
        setShowOutliers,
        resetStatisticsSettings
    };
}; 
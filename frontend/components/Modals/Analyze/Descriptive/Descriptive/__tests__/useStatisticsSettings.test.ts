import { renderHook, act } from '@testing-library/react';
import { useStatisticsSettings } from '../hooks/useStatisticsSettings';

describe('useStatisticsSettings', () => {
    it('should initialize with default statistics', () => {
        const { result } = renderHook(() => useStatisticsSettings());
        expect(result.current.displayStatistics.mean).toBe(true);
        expect(result.current.displayStatistics.stdDev).toBe(true);
        expect(result.current.displayStatistics.minimum).toBe(true);
        expect(result.current.displayStatistics.maximum).toBe(true);
        expect(result.current.displayStatistics.variance).toBe(false);
        expect(result.current.displayOrder).toBe('variableList');
        expect(result.current.saveStandardized).toBe(false);
    });

    it('should initialize with provided initial values', () => {
        const { result } = renderHook(() => useStatisticsSettings({
            initialDisplayStatistics: { mean: false, variance: true },
            initialDisplayOrder: 'alphabetic',
            initialSaveStandardized: true,
        }));
        expect(result.current.displayStatistics.mean).toBe(false);
        expect(result.current.displayStatistics.variance).toBe(true);
        expect(result.current.displayOrder).toBe('alphabetic');
        expect(result.current.saveStandardized).toBe(true);
    });

    it('should update a single statistic value', () => {
        const { result } = renderHook(() => useStatisticsSettings());
        
        act(() => {
            result.current.updateStatistic('sum', true);
        });
        
        expect(result.current.displayStatistics.sum).toBe(true);
        
        act(() => {
            result.current.updateStatistic('mean', false);
        });
        
        expect(result.current.displayStatistics.mean).toBe(false);
    });

    it('should reset all settings to their default values', () => {
        const { result } = renderHook(() => useStatisticsSettings());

        act(() => {
            result.current.updateStatistic('sum', true);
            result.current.setDisplayOrder('ascendingMeans');
            result.current.setSaveStandardized(true);
        });

        expect(result.current.displayStatistics.sum).toBe(true);
        expect(result.current.displayOrder).toBe('ascendingMeans');
        expect(result.current.saveStandardized).toBe(true);

        act(() => {
            result.current.resetStatisticsSettings();
        });

        expect(result.current.displayStatistics.sum).toBe(false);
        expect(result.current.displayOrder).toBe('variableList');
        expect(result.current.saveStandardized).toBe(false);
    });
}); 
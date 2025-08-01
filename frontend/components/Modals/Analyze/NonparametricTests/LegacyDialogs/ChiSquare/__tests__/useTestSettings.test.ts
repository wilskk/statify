import { renderHook, act } from '@testing-library/react';
import { useTestSettings } from '../hooks/useTestSettings';

describe('useTestSettings', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderTestHook = (initialSettings = {}) => {
    return renderHook(() => useTestSettings({
      displayStatistics: {
        descriptive: false,
        quartiles: false,
        ...initialSettings
      },
      onChange: mockOnChange
    }));
  };

  describe('Initial State', () => {
    it('should initialize with default settings', () => {
      const { result } = renderTestHook();

      expect(result.current.displayStatistics).toEqual({
        descriptive: false,
        quartiles: false
      });
    });

    it('should initialize with custom settings', () => {
      const { result } = renderTestHook({
        descriptive: true,
        quartiles: true
      });

      expect(result.current.displayStatistics).toEqual({
        descriptive: true,
        quartiles: true
      });
    });
  });

  describe('Setting Updates', () => {
    it('should update descriptive setting', () => {
      const { result } = renderTestHook();

      act(() => {
        result.current.updateSetting('descriptive', true);
      });

      expect(result.current.displayStatistics).toEqual({
        descriptive: true,
        quartiles: false
      });
      expect(mockOnChange).toHaveBeenCalledWith({
        descriptive: true,
        quartiles: false
      });
    });

    it('should update quartiles setting', () => {
      const { result } = renderTestHook();

      act(() => {
        result.current.updateSetting('quartiles', true);
      });

      expect(result.current.displayStatistics).toEqual({
        descriptive: false,
        quartiles: true
      });
      expect(mockOnChange).toHaveBeenCalledWith({
        descriptive: false,
        quartiles: true
      });
    });

    it('should update multiple settings', () => {
      const { result } = renderTestHook();

      act(() => {
        result.current.updateSetting('descriptive', true);
        result.current.updateSetting('quartiles', true);
      });

      expect(result.current.displayStatistics).toEqual({
        descriptive: true,
        quartiles: true
      });
      expect(mockOnChange).toHaveBeenCalledWith({
        descriptive: true,
        quartiles: false
      });
      expect(mockOnChange).toHaveBeenCalledWith({
        descriptive: true,
        quartiles: true
      });
    });

    it('should toggle boolean settings', () => {
      const { result } = renderTestHook({
        descriptive: true,
        quartiles: false
      });

      act(() => {
        result.current.toggleSetting('descriptive');
      });

      expect(result.current.displayStatistics).toEqual({
        descriptive: false,
        quartiles: false
      });
      expect(mockOnChange).toHaveBeenCalledWith({
        descriptive: false,
        quartiles: false
      });
    });

    it('should toggle from false to true', () => {
      const { result } = renderTestHook();

      act(() => {
        result.current.toggleSetting('quartiles');
      });

      expect(result.current.displayStatistics).toEqual({
        descriptive: false,
        quartiles: true
      });
      expect(mockOnChange).toHaveBeenCalledWith({
        descriptive: false,
        quartiles: true
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should enable all settings', () => {
      const { result } = renderTestHook();

      act(() => {
        result.current.enableAll();
      });

      expect(result.current.displayStatistics).toEqual({
        descriptive: true,
        quartiles: true
      });
      expect(mockOnChange).toHaveBeenCalledWith({
        descriptive: true,
        quartiles: true
      });
    });

    it('should disable all settings', () => {
      const { result } = renderTestHook({
        descriptive: true,
        quartiles: true
      });

      act(() => {
        result.current.disableAll();
      });

      expect(result.current.displayStatistics).toEqual({
        descriptive: false,
        quartiles: false
      });
      expect(mockOnChange).toHaveBeenCalledWith({
        descriptive: false,
        quartiles: false
      });
    });

    it('should reset to defaults', () => {
      const { result } = renderTestHook({
        descriptive: true,
        quartiles: true
      });

      act(() => {
        result.current.resetToDefaults();
      });

      expect(result.current.displayStatistics).toEqual({
        descriptive: false,
        quartiles: false
      });
      expect(mockOnChange).toHaveBeenCalledWith({
        descriptive: false,
        quartiles: false
      });
    });
  });

  describe('Setting Queries', () => {
    it('should check if setting is enabled', () => {
      const { result } = renderTestHook({
        descriptive: true,
        quartiles: false
      });

      expect(result.current.isEnabled('descriptive')).toBe(true);
      expect(result.current.isEnabled('quartiles')).toBe(false);
    });

    it('should check if any setting is enabled', () => {
      const { result } = renderTestHook({
        descriptive: true,
        quartiles: false
      });

      expect(result.current.hasAnyEnabled()).toBe(true);
    });

    it('should check if all settings are enabled', () => {
      const { result } = renderTestHook({
        descriptive: true,
        quartiles: true
      });

      expect(result.current.areAllEnabled()).toBe(true);
    });

    it('should check if all settings are disabled', () => {
      const { result } = renderTestHook({
        descriptive: false,
        quartiles: false
      });

      expect(result.current.areAllDisabled()).toBe(true);
    });

    it('should get enabled settings count', () => {
      const { result } = renderTestHook({
        descriptive: true,
        quartiles: false
      });

      expect(result.current.getEnabledCount()).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined onChange', () => {
      const { result } = renderHook(() => useTestSettings({
        displayStatistics: {
          descriptive: false,
          quartiles: false
        },
        onChange: undefined
      }));

      // Should not throw when updating setting
      act(() => {
        expect(() => result.current.updateSetting('descriptive', true)).not.toThrow();
      });

      expect(result.current.displayStatistics).toEqual({
        descriptive: true,
        quartiles: false
      });
    });

    it('should handle null displayStatistics', () => {
      const { result } = renderHook(() => useTestSettings({
        displayStatistics: null as any,
        onChange: mockOnChange
      }));

      // Should use default values
      expect(result.current.displayStatistics).toEqual({
        descriptive: false,
        quartiles: false
      });
    });

    it('should handle partial displayStatistics object', () => {
      const { result } = renderHook(() => useTestSettings({
        displayStatistics: {
          descriptive: true
          // quartiles is missing
        },
        onChange: mockOnChange
      }));

      expect(result.current.displayStatistics).toEqual({
        descriptive: true,
        quartiles: false
      });
    });

    it('should handle invalid setting names', () => {
      const { result } = renderTestHook();

      act(() => {
        result.current.updateSetting('invalidSetting' as any, true);
      });

      // Should not change the state
      expect(result.current.displayStatistics).toEqual({
        descriptive: false,
        quartiles: false
      });
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle rapid updates efficiently', () => {
      const { result } = renderTestHook();

      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.toggleSetting('descriptive');
          result.current.toggleSetting('quartiles');
        }
      });

      const endTime = performance.now();

      // Should handle rapid updates efficiently (less than 50ms)
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('State Consistency', () => {
    it('should maintain state consistency across updates', () => {
      const { result } = renderTestHook();

      act(() => {
        result.current.updateSetting('descriptive', true);
        result.current.updateSetting('quartiles', true);
        result.current.updateSetting('descriptive', false);
      });

      expect(result.current.displayStatistics).toEqual({
        descriptive: false,
        quartiles: true
      });
      expect(result.current.isEnabled('descriptive')).toBe(false);
      expect(result.current.isEnabled('quartiles')).toBe(true);
      expect(result.current.getEnabledCount()).toBe(1);
    });

    it('should update when props change', () => {
      const { result, rerender } = renderTestHook({
        descriptive: false,
        quartiles: false
      });

      // Initially all disabled
      expect(result.current.areAllDisabled()).toBe(true);

      // Update props
      rerender(() => useTestSettings({
        displayStatistics: {
          descriptive: true,
          quartiles: true
        },
        onChange: mockOnChange
      }));

      expect(result.current.areAllEnabled()).toBe(true);
      expect(result.current.getEnabledCount()).toBe(2);
    });
  });

  describe('Callback Invocation', () => {
    it('should call onChange with correct parameters', () => {
      const { result } = renderTestHook();

      act(() => {
        result.current.updateSetting('descriptive', true);
      });

      expect(mockOnChange).toHaveBeenCalledWith({
        descriptive: true,
        quartiles: false
      });
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should call onChange for toggle operations', () => {
      const { result } = renderTestHook();

      act(() => {
        result.current.toggleSetting('quartiles');
      });

      expect(mockOnChange).toHaveBeenCalledWith({
        descriptive: false,
        quartiles: true
      });
    });

    it('should call onChange for bulk operations', () => {
      const { result } = renderTestHook();

      act(() => {
        result.current.enableAll();
      });

      expect(mockOnChange).toHaveBeenCalledWith({
        descriptive: true,
        quartiles: true
      });

      act(() => {
        result.current.disableAll();
      });

      expect(mockOnChange).toHaveBeenCalledWith({
        descriptive: false,
        quartiles: false
      });
    });
  });
}); 
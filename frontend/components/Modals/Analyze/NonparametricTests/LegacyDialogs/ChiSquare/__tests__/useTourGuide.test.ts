import { renderHook, act } from '@testing-library/react';
import { useTourGuide } from '../hooks/useTourGuide';
import { tourConfig } from '../hooks/tourConfig';

describe('useTourGuide', () => {
  const mockOnComplete = jest.fn();
  const mockOnSkip = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderTestHook = (props = {}) => {
    const defaultProps = {
      onComplete: mockOnComplete,
      onSkip: mockOnSkip,
      ...props
    };
    return renderHook(() => useTourGuide(defaultProps));
  };

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderTestHook();

      expect(result.current.isActive).toBe(false);
      expect(result.current.currentStep).toBe(0);
      expect(result.current.totalSteps).toBe(tourConfig.length);
      expect(result.current.currentStepData).toEqual(tourConfig[0]);
    });

    it('should initialize with tour active', () => {
      const { result } = renderTestHook({
        isActive: true
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.currentStep).toBe(0);
    });
  });

  describe('Tour Navigation', () => {
    it('should start the tour', () => {
      const { result } = renderTestHook();

      act(() => {
        result.current.startTour();
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.currentStep).toBe(0);
    });

    it('should go to next step', () => {
      const { result } = renderTestHook({
        isActive: true
      });

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.currentStepData).toEqual(tourConfig[1]);
    });

    it('should go to previous step', () => {
      const { result } = renderTestHook({
        isActive: true,
        currentStep: 2
      });

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.currentStepData).toEqual(tourConfig[1]);
    });

    it('should not go beyond first step', () => {
      const { result } = renderTestHook({
        isActive: true,
        currentStep: 0
      });

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.currentStep).toBe(0);
    });

    it('should complete tour on last step', () => {
      const { result } = renderTestHook({
        isActive: true,
        currentStep: tourConfig.length - 1
      });

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.isActive).toBe(false);
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  describe('Tour Control', () => {
    it('should skip the tour', () => {
      const { result } = renderTestHook({
        isActive: true
      });

      act(() => {
        result.current.skipTour();
      });

      expect(result.current.isActive).toBe(false);
      expect(mockOnSkip).toHaveBeenCalled();
    });

    it('should stop the tour', () => {
      const { result } = renderTestHook({
        isActive: true,
        currentStep: 2
      });

      act(() => {
        result.current.stopTour();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.currentStep).toBe(0);
    });

    it('should go to specific step', () => {
      const { result } = renderTestHook({
        isActive: true
      });

      act(() => {
        result.current.goToStep(2);
      });

      expect(result.current.currentStep).toBe(2);
      expect(result.current.currentStepData).toEqual(tourConfig[2]);
    });

    it('should handle invalid step numbers', () => {
      const { result } = renderTestHook({
        isActive: true
      });

      act(() => {
        result.current.goToStep(-1);
      });

      expect(result.current.currentStep).toBe(0);

      act(() => {
        result.current.goToStep(tourConfig.length + 1);
      });

      expect(result.current.currentStep).toBe(tourConfig.length - 1);
    });
  });

  describe('Step Information', () => {
    it('should provide current step data', () => {
      const { result } = renderTestHook({
        isActive: true,
        currentStep: 1
      });

      expect(result.current.currentStepData).toEqual(tourConfig[1]);
    });

    it('should check if step is first', () => {
      const { result } = renderTestHook({
        isActive: true,
        currentStep: 0
      });

      expect(result.current.isFirstStep).toBe(true);

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.isFirstStep).toBe(false);
    });

    it('should check if step is last', () => {
      const { result } = renderTestHook({
        isActive: true,
        currentStep: tourConfig.length - 1
      });

      expect(result.current.isLastStep).toBe(true);

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.isLastStep).toBe(false);
    });

    it('should provide progress information', () => {
      const { result } = renderTestHook({
        isActive: true,
        currentStep: 2
      });

      expect(result.current.progress).toBe((3 / tourConfig.length) * 100);
      expect(result.current.stepNumber).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined callbacks', () => {
      const { result } = renderTestHook({
        onComplete: undefined,
        onSkip: undefined
      });

      act(() => {
        result.current.startTour();
        result.current.skipTour();
      });

      // Should not throw
      expect(result.current.isActive).toBe(false);
    });

    it('should handle empty tour config', () => {
      // Mock empty tour config
      const originalConfig = tourConfig;
      (tourConfig as any) = [];

      const { result } = renderTestHook({
        isActive: true
      });

      expect(result.current.totalSteps).toBe(0);
      expect(result.current.currentStepData).toBeUndefined();

      // Restore original config
      (tourConfig as any) = originalConfig;
    });

    it('should handle tour config with single step', () => {
      // Mock single step tour config
      const originalConfig = tourConfig;
      (tourConfig as any) = [{ title: 'Single Step', content: 'Test content' }];

      const { result } = renderTestHook({
        isActive: true
      });

      expect(result.current.totalSteps).toBe(1);
      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.isLastStep).toBe(true);

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.isActive).toBe(false);
      expect(mockOnComplete).toHaveBeenCalled();

      // Restore original config
      (tourConfig as any) = originalConfig;
    });
  });

  describe('State Persistence', () => {
    it('should maintain state across re-renders', () => {
      const { result, rerender } = renderTestHook({
        isActive: true,
        currentStep: 2
      });

      expect(result.current.currentStep).toBe(2);

      // Re-render with same props
      rerender(() => useTourGuide({
        isActive: true,
        currentStep: 2,
        onComplete: mockOnComplete,
        onSkip: mockOnSkip
      }));

      expect(result.current.currentStep).toBe(2);
    });

    it('should update when props change', () => {
      const { result, rerender } = renderTestHook({
        isActive: false,
        currentStep: 0
      });

      expect(result.current.isActive).toBe(false);

      // Update props
      rerender(() => useTourGuide({
        isActive: true,
        currentStep: 1,
        onComplete: mockOnComplete,
        onSkip: mockOnSkip
      }));

      expect(result.current.isActive).toBe(true);
      expect(result.current.currentStep).toBe(1);
    });
  });

  describe('Performance', () => {
    it('should handle rapid navigation efficiently', () => {
      const { result } = renderTestHook({
        isActive: true
      });

      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.nextStep();
          result.current.previousStep();
        }
      });

      const endTime = performance.now();

      // Should handle rapid navigation efficiently (less than 50ms)
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Callback Invocation', () => {
    it('should call onComplete when tour finishes', () => {
      const { result } = renderTestHook({
        isActive: true,
        currentStep: tourConfig.length - 1
      });

      act(() => {
        result.current.nextStep();
      });

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('should call onSkip when tour is skipped', () => {
      const { result } = renderTestHook({
        isActive: true
      });

      act(() => {
        result.current.skipTour();
      });

      expect(mockOnSkip).toHaveBeenCalledTimes(1);
    });

    it('should not call callbacks unnecessarily', () => {
      const { result } = renderTestHook({
        isActive: true
      });

      act(() => {
        result.current.nextStep();
        result.current.previousStep();
        result.current.goToStep(1);
      });

      expect(mockOnComplete).not.toHaveBeenCalled();
      expect(mockOnSkip).not.toHaveBeenCalled();
    });
  });

  describe('Tour Configuration', () => {
    it('should use correct tour configuration', () => {
      const { result } = renderTestHook({
        isActive: true
      });

      expect(result.current.totalSteps).toBe(tourConfig.length);
      expect(result.current.currentStepData).toEqual(tourConfig[0]);
    });

    it('should handle step data correctly', () => {
      const { result } = renderTestHook({
        isActive: true,
        currentStep: 1
      });

      const stepData = result.current.currentStepData;
      expect(stepData).toHaveProperty('title');
      expect(stepData).toHaveProperty('content');
    });
  });
}); 
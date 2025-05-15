import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  DescriptiveWorkerResult, 
  WorkerInput, 
  WorkerCalculationPromise,
  DescriptivesWorkerProps,
  DescriptivesWorkerResult
} from '../types';

export const useDescriptivesWorker = (
  workerUrl = '/workers/DescriptiveStatistics/Descriptives/descriptives.js',
  timeoutDuration = 60000 // 60 seconds default timeout
): DescriptivesWorkerResult => {
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const calculationPromiseRef = useRef<WorkerCalculationPromise | null>(null);

  // Clean up worker and timeout
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  // Cancel any in-progress calculation
  const cancelCalculation = useCallback(() => {
    if (calculationPromiseRef.current) {
      calculationPromiseRef.current.resolve(null);
      calculationPromiseRef.current = null;
    }
    setError(null);
    setIsCalculating(false);
    cleanup();
  }, [cleanup]);

  // Handle worker message
  const handleWorkerMessage = useCallback((event: MessageEvent<DescriptiveWorkerResult>) => {
    const result = event.data;
    if (calculationPromiseRef.current) {
      calculationPromiseRef.current.resolve(result);
      calculationPromiseRef.current = null;
    }
    
    if (!result.success) {
      setError(result.error || 'Unknown error occurred in the worker');
    }
    
    setIsCalculating(false);
    cleanup();
  }, [cleanup]);

  // Handle worker error
  const handleWorkerError = useCallback((event: ErrorEvent) => {
    const errorMessage = `Worker error: ${event.message}`;
    console.error(errorMessage);
    setError(errorMessage);
    
    if (calculationPromiseRef.current) {
      calculationPromiseRef.current.reject(new Error(errorMessage));
      calculationPromiseRef.current = null;
    }
    
    setIsCalculating(false);
    cleanup();
  }, [cleanup]);

  // Calculate descriptive statistics using the worker
  const calculate = useCallback(async (input: WorkerInput): Promise<DescriptiveWorkerResult | null> => {
    // Cancel any in-progress calculation
    cancelCalculation();
    
    setIsCalculating(true);
    setError(null);
    
    try {
      // Create a new worker
      workerRef.current = new Worker(workerUrl);
      
      // Set up timeout
      timeoutIdRef.current = setTimeout(() => {
        setError('Calculation timed out after ' + (timeoutDuration / 1000) + ' seconds');
        if (calculationPromiseRef.current) {
          calculationPromiseRef.current.reject(new Error('Calculation timed out'));
          calculationPromiseRef.current = null;
        }
        setIsCalculating(false);
        cleanup();
      }, timeoutDuration);
      
      // Set up message and error handlers
      workerRef.current.onmessage = handleWorkerMessage;
      workerRef.current.onerror = handleWorkerError;
      
      // Create a promise that will be resolved when the worker sends a message
      const resultPromise = new Promise<DescriptiveWorkerResult | null>((resolve, reject) => {
        calculationPromiseRef.current = { resolve, reject };
      });
      
      // Send data to the worker
      workerRef.current.postMessage({
        action: 'CALCULATE_DESCRIPTIVES',
        variableData: input.variableData,
        weightVariableData: input.weightVariableData,
        params: input.params,
        saveStandardized: input.saveStandardized
      });
      
      // Wait for the promise to be resolved
      return await resultPromise;
    } catch (err) {
      console.error('Error in worker calculation:', err);
      setError(`Error in worker calculation: ${err instanceof Error ? err.message : String(err)}`);
      setIsCalculating(false);
      cleanup();
      return null;
    }
  }, [cancelCalculation, cleanup, handleWorkerMessage, handleWorkerError, workerUrl, timeoutDuration]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      cancelCalculation();
    };
  }, [cancelCalculation]);
  
  return {
    isCalculating,
    error,
    calculate,
    cancelCalculation
  };
}; 
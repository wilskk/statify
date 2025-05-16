import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  StatisticsOptions, 
  ChartOptions, 
  WorkerInput,
  FrequencyWorkerResult as FrequencyResult,
  DescriptiveWorkerResult as DescriptiveResult,
  WorkerCalculationPromise
} from '../types';

export interface FrequenciesWorkerProps {
  frequencyWorkerUrl?: string;
  descriptiveWorkerUrl?: string;
  timeoutDuration?: number;
}

export interface FrequenciesWorkerResult {
  isCalculating: boolean;
  error: string | null;
  calculate: (
    input: WorkerInput,
    options: {
      calculateFrequencies: boolean;
      calculateDescriptives: boolean;
    }
  ) => Promise<{ frequencies?: any[]; descriptive?: any; } | null>;
  cancelCalculation: () => void;
}

export const useFrequenciesWorker = ({
  frequencyWorkerUrl = '/workers/DescriptiveStatistics/Frequencies/frequency.js',
  descriptiveWorkerUrl = '/workers/DescriptiveStatistics/Frequencies/descriptive.js',
  timeoutDuration = 60000 // 60 seconds default timeout
}: FrequenciesWorkerProps = {}): FrequenciesWorkerResult => {
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Worker references
  const freqWorkerRef = useRef<Worker | null>(null);
  const descWorkerRef = useRef<Worker | null>(null);
  
  // Tracking references
  const resultsRef = useRef<{ frequencies?: any[]; descriptive?: any; }>({});
  const workersFinishedRef = useRef<number>(0);
  const totalWorkersRef = useRef<number>(0);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const calculationPromiseRef = useRef<WorkerCalculationPromise | null>(null);

  // Clean up workers and timeouts
  const cleanup = useCallback(() => {
    if (freqWorkerRef.current) {
      freqWorkerRef.current.terminate();
      freqWorkerRef.current = null;
    }
    
    if (descWorkerRef.current) {
      descWorkerRef.current.terminate();
      descWorkerRef.current = null;
    }
    
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    
    workersFinishedRef.current = 0;
    totalWorkersRef.current = 0;
    resultsRef.current = {};
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

  // Handle worker completion
  const handleWorkerCompletion = useCallback(() => {
    workersFinishedRef.current += 1;
    
    // Check if all workers have finished
    if (workersFinishedRef.current >= totalWorkersRef.current) {
      // Clear the timeout since all workers are done
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      
      // Resolve the promise if it exists
      if (calculationPromiseRef.current) {
        calculationPromiseRef.current.resolve({ ...resultsRef.current });
        calculationPromiseRef.current = null;
      }
      
      setIsCalculating(false);
      cleanup();
    }
  }, [cleanup]);

  // Calculate frequencies and/or descriptive statistics
  const calculate = useCallback(async (
    input: WorkerInput,
    options: {
      calculateFrequencies: boolean;
      calculateDescriptives: boolean;
    }
  ): Promise<{ frequencies?: any[]; descriptive?: any; } | null> => {
    // Cancel any in-progress calculation
    cancelCalculation();
    
    setIsCalculating(true);
    setError(null);
    
    // Calculate number of workers
    totalWorkersRef.current = 
      (options.calculateFrequencies ? 1 : 0) + 
      (options.calculateDescriptives ? 1 : 0);
    
    if (totalWorkersRef.current === 0) {
      setError("No calculation options selected");
      setIsCalculating(false);
      return null;
    }
    
    try {
      // Set up timeout
      timeoutIdRef.current = setTimeout(() => {
        setError('Calculation timed out after ' + (timeoutDuration / 1000) + ' seconds');
        
        if (calculationPromiseRef.current) {
          calculationPromiseRef.current.reject(new Error('Calculation timed out'));
          calculationPromiseRef.current = null;
        }
        
        setIsCalculating(false);
        cleanup();
      }, timeoutDuration * totalWorkersRef.current);
      
      // Create a promise that will be resolved when all workers have completed
      const resultPromise = new Promise<{ frequencies?: any[]; descriptive?: any; } | null>((resolve, reject) => {
        calculationPromiseRef.current = { resolve, reject };
      });
      
      // Start frequency worker if needed
      if (options.calculateFrequencies) {
        freqWorkerRef.current = new Worker(frequencyWorkerUrl);
        
        freqWorkerRef.current.onmessage = (e: MessageEvent<FrequencyResult>) => {
          const result = e.data;
          
          if (result.success) {
            resultsRef.current.frequencies = result.frequencies;
            handleWorkerCompletion();
          } else {
            setError(result.error || 'Unknown error in frequency calculation');
            
            if (calculationPromiseRef.current) {
              calculationPromiseRef.current.reject(new Error(result.error || 'Unknown error in frequency calculation'));
              calculationPromiseRef.current = null;
            }
            
            setIsCalculating(false);
            cleanup();
          }
        };
        
        freqWorkerRef.current.onerror = (event: ErrorEvent) => {
          const errorMessage = `Frequency worker error: ${event.message}`;
          console.error(errorMessage);
          setError(errorMessage);
          
          if (calculationPromiseRef.current) {
            calculationPromiseRef.current.reject(new Error(errorMessage));
            calculationPromiseRef.current = null;
          }
          
          setIsCalculating(false);
          cleanup();
        };
        
        // Send data to the frequency worker
        freqWorkerRef.current.postMessage({
          variableData: input.variableData,
          weightVariableData: input.weightVariableData
        });
      }
      
      // Start descriptive worker if needed
      if (options.calculateDescriptives) {
        descWorkerRef.current = new Worker(descriptiveWorkerUrl);
        
        descWorkerRef.current.onmessage = (e: MessageEvent<DescriptiveResult>) => {
          const result = e.data;
          
          if (result.success) {
            resultsRef.current.descriptive = result.descriptive;
            handleWorkerCompletion();
          } else {
            setError(result.error || 'Unknown error in descriptive statistics calculation');
            
            if (calculationPromiseRef.current) {
              calculationPromiseRef.current.reject(new Error(result.error || 'Unknown error in descriptive statistics calculation'));
              calculationPromiseRef.current = null;
            }
            
            setIsCalculating(false);
            cleanup();
          }
        };
        
        descWorkerRef.current.onerror = (event: ErrorEvent) => {
          const errorMessage = `Descriptive worker error: ${event.message}`;
          console.error(errorMessage);
          setError(errorMessage);
          
          if (calculationPromiseRef.current) {
            calculationPromiseRef.current.reject(new Error(errorMessage));
            calculationPromiseRef.current = null;
          }
          
          setIsCalculating(false);
          cleanup();
        };
        
        // Send data to the descriptive worker
        descWorkerRef.current.postMessage({
          variableData: input.variableData,
          weightVariableData: input.weightVariableData,
          options: input.statisticsOptions
        });
      }
      
      // Wait for the promise to be resolved
      return await resultPromise;
      
    } catch (err) {
      console.error('Error in worker calculation:', err);
      setError(`Error in worker calculation: ${err instanceof Error ? err.message : String(err)}`);
      setIsCalculating(false);
      cleanup();
      return null;
    }
  }, [cancelCalculation, cleanup, handleWorkerCompletion, frequencyWorkerUrl, descriptiveWorkerUrl, timeoutDuration]);
  
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
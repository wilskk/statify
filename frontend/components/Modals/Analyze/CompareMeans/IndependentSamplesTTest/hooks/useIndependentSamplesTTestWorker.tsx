import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  IndependentSamplesTTestWorkerProps, 
  IndependentSamplesTTestWorkerHookResult, 
  WorkerInput, 
  IndependentSamplesTTestWorkerResult,
  WorkerCalculationPromise 
} from '../types';

export const useIndependentSamplesTTestWorker = (props?: IndependentSamplesTTestWorkerProps): IndependentSamplesTTestWorkerHookResult => {
  const workerUrl = props?.workerUrl || '/workers/IndependentSamplesTTest/index.js';
  const timeoutDuration = props?.timeoutDuration || 60000; // Default 60s timeout

  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const calculationPromiseRef = useRef<WorkerCalculationPromise | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Function to create a new worker
  const createWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    
    try {
      const worker = new Worker(workerUrl, { type: 'module' });
      
      worker.onerror = (event) => {
        console.error('Worker error:', event);
        if (calculationPromiseRef.current) {
          calculationPromiseRef.current.reject(
            new Error(event.message || 'Unknown worker error')
          );
          calculationPromiseRef.current = null;
        }
        
        setError('Worker error occurred. Check console for details.');
        setIsCalculating(false);
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
      
      worker.onmessage = (event) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        if (calculationPromiseRef.current) {
          calculationPromiseRef.current.resolve(event.data);
          calculationPromiseRef.current = null;
        }
        
        setIsCalculating(false);
      };
      
      workerRef.current = worker;
      return worker;
    } catch (err) {
      console.error('Error creating worker:', err);
      setError('Error creating worker: ' + (err instanceof Error ? err.message : String(err)));
      setIsCalculating(false);
      return null;
    }
  }, [workerUrl]);

  // Main function to perform calculations
  const calculate = useCallback((input: WorkerInput): Promise<IndependentSamplesTTestWorkerResult | null> => {
    setError(undefined);
    setIsCalculating(true);
    
    // Create a new promise to handle the worker response
    return new Promise<IndependentSamplesTTestWorkerResult | null>((resolve, reject) => {
      calculationPromiseRef.current = { resolve, reject };
      
      // Create a new worker
      const worker = createWorker();
      if (!worker) {
        setIsCalculating(false);
        reject(new Error('Failed to create worker'));
        return;
      }
      
      // Set a timeout
      timeoutRef.current = setTimeout(() => {
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        
        setError('Analysis timed out. Please try again with fewer variables.');
        setIsCalculating(false);
        
        if (calculationPromiseRef.current) {
          calculationPromiseRef.current.reject(new Error('Worker calculation timed out'));
          calculationPromiseRef.current = null;
        }
      }, timeoutDuration);
      
      // Post message to worker
      worker.postMessage(input);
    });
  }, [createWorker, timeoutDuration]);

  // Function to cancel any ongoing calculation
  const cancelCalculation = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (calculationPromiseRef.current) {
      calculationPromiseRef.current.reject(new Error('Calculation cancelled'));
      calculationPromiseRef.current = null;
    }
    
    setIsCalculating(false);
  }, []);

  return {
    isCalculating,
    error,
    calculate,
    cancelCalculation
  };
};

export default useIndependentSamplesTTestWorker; 
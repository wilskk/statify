import { useState, useCallback, useRef } from 'react';
import { WorkerInput, TwoIndependentSamplesResults, WorkerCalculationPromise, TwoIndependentSamplesWorkerInterface } from '../types';

export const useTwoIndependentSamplesWorker = (): TwoIndependentSamplesWorkerInterface => {
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const workerRef = useRef<Worker | null>(null);
    const calculationPromiseRef = useRef<WorkerCalculationPromise | null>(null);

    // Cleanup function to terminate worker and reject any pending promise
    const cleanupWorker = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }

        if (calculationPromiseRef.current) {
            calculationPromiseRef.current.reject(new Error('Calculation cancelled'));
            calculationPromiseRef.current = null;
        }

        setIsCalculating(false);
    }, []);

    // Cancel any ongoing calculation
    const cancelCalculation = useCallback(() => {
        cleanupWorker();
        setError('Calculation cancelled by user');
    }, [cleanupWorker]);

    // Main calculation function
    const calculate = useCallback((data: WorkerInput): Promise<TwoIndependentSamplesResults> => {
        // Clean up any existing worker
        cleanupWorker();
        setIsCalculating(true);
        setError(undefined);

        return new Promise<TwoIndependentSamplesResults>((resolve, reject) => {
            try {
                // Create a new worker
                const worker = new Worker('/workers/TwoIndependentSamples/index.js', { type: 'module' });
                workerRef.current = worker;
                
                // Store the promise callbacks for potential cancellation
                calculationPromiseRef.current = { resolve, reject };

                // Set a timeout to prevent worker hanging
                const timeoutId = setTimeout(() => {
                    cleanupWorker();
                    setError('Analysis timed out. Please try again with fewer variables.');
                    reject(new Error('Analysis timed out'));
                }, 60000); // 60 second timeout

                // Handle worker messages
                worker.onmessage = (e) => {
                    clearTimeout(timeoutId);
                    const result = e.data;

                    if (result.success) {
                        setIsCalculating(false);
                        resolve(result);
                    } else {
                        setError(result.error || 'Unknown error occurred during calculation');
                        setIsCalculating(false);
                        reject(new Error(result.error || 'Unknown error'));
                    }

                    // Clean up worker after successful completion
                    worker.terminate();
                    workerRef.current = null;
                    calculationPromiseRef.current = null;
                };

                // Handle worker errors
                worker.onerror = (event) => {
                    clearTimeout(timeoutId);
                    const errorMessage = event.message || 'Worker error occurred';
                    setError(errorMessage);
                    setIsCalculating(false);
                    reject(new Error(errorMessage));
                    
                    // Clean up worker after error
                    worker.terminate();
                    workerRef.current = null;
                    calculationPromiseRef.current = null;
                };

                // Send data to worker
                worker.postMessage(data);
            } catch (err) {
                setIsCalculating(false);
                const errorMessage = err instanceof Error ? err.message : 'Failed to start worker';
                setError(errorMessage);
                reject(new Error(errorMessage));
            }
        });
    }, [cleanupWorker]);

    return {
        calculate,
        isCalculating,
        error,
        cancelCalculation
    };
}; 
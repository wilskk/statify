import { useState, useRef, useCallback } from 'react';
import { WorkerInput, KIndependentSamplesResults, WorkerCalculationPromise, KIndependentSamplesWorkerHookResult } from '../types';

/**
 * Hook for managing K-Independent Samples worker communication
 * @returns Object with functions and state for worker communication
 */
export const useKIndependentSamplesWorker = (): KIndependentSamplesWorkerHookResult => {
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const calculationPromiseRef = useRef<{
        resolve: (result: KIndependentSamplesResults) => void;
        reject: (reason: any) => void;
    } | null>(null);
    
    /**
     * Calculate K-Independent Samples test statistics
     * @param data Worker input data
     * @returns Promise that resolves with the calculation results
     */
    const calculate = useCallback((data: WorkerInput): Promise<KIndependentSamplesResults> => {
        setIsCalculating(true);
        setError(null);
        
        return new Promise<KIndependentSamplesResults>((resolve, reject) => {
            try {
                // Create worker
                const worker = new Worker('/workers/KIndependentSamples/index.js', { type: 'module' });
                workerRef.current = worker;
                
                // Store promise callbacks for later resolution
                calculationPromiseRef.current = { resolve, reject };
                
                // Set up timeout to prevent worker hanging
                const timeoutId = setTimeout(() => {
                    if (worker) {
                        worker.terminate();
                        const timeoutError = 'Calculation timed out. Please try again with fewer variables.';
                        setError(timeoutError);
                        reject(new Error(timeoutError));
                    }
                    setIsCalculating(false);
                    workerRef.current = null;
                    calculationPromiseRef.current = null;
                }, 60000); // 60 second timeout
                
                // Handle worker messages
                worker.onmessage = (e) => {
                    clearTimeout(timeoutId);
                    const result = e.data;
                    
                    if (result.success) {
                        // Extract result properties
                        const {
                            descriptives,
                            ranks,
                            kruskalWallisH,
                            medianFrequencies,
                            medianTest,
                            jonckheereTerpstraTest
                        } = result;
                        
                        // Resolve with results
                        resolve({
                            descriptives,
                            ranks,
                            kruskalWallisH,
                            medianFrequencies,
                            medianTest,
                            jonckheereTerpstraTest
                        });
                    } else {
                        const errorMessage = result.error || 'Unknown error in calculation';
                        setError(errorMessage);
                        reject(new Error(errorMessage));
                    }
                    
                    // Clean up
                    worker.terminate();
                    setIsCalculating(false);
                    workerRef.current = null;
                    calculationPromiseRef.current = null;
                };
                
                // Handle worker errors
                worker.onerror = (event) => {
                    clearTimeout(timeoutId);
                    console.error('Worker error:', event);
                    const errorMessage = 'Error in calculation worker';
                    setError(errorMessage);
                    reject(new Error(errorMessage));
                    
                    // Clean up
                    worker.terminate();
                    setIsCalculating(false);
                    workerRef.current = null;
                    calculationPromiseRef.current = null;
                };
                
                // Send data to worker
                worker.postMessage(data);
            } catch (err) {
                console.error('Error setting up worker:', err);
                const errorMessage = 'Failed to set up calculation';
                setError(errorMessage);
                setIsCalculating(false);
                reject(new Error(errorMessage));
            }
        });
    }, []);
    
    /**
     * Cancel the current calculation
     */
    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            
            if (calculationPromiseRef.current) {
                calculationPromiseRef.current.reject(new Error('Calculation cancelled'));
                calculationPromiseRef.current = null;
            }
            
            setIsCalculating(false);
        }
    }, []);
    
    return {
        calculate,
        isCalculating,
        error,
        cancelCalculation
    };
}; 
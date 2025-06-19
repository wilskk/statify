import { useState, useCallback, useRef, useEffect } from 'react';
import type { WorkerInput, IndependentSamplesTTestResults, TTestWorkerResult } from '../types';

/**
 * Hook for handling web worker communication in the Independent Samples T-Test component
 * @returns Object with functions and state for worker communication
 */
export const useTTestWorker = (): TTestWorkerResult => {
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const calculationPromiseRef = useRef<{
        resolve: (result: IndependentSamplesTTestResults | null) => void;
        reject: (reason: any) => void;
    } | null>(null);
    
    // Cleanup worker on unmount
    useEffect(() => {
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, []);
    
    const cancelCalculation = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }
        
        if (calculationPromiseRef.current) {
            calculationPromiseRef.current.resolve(null);
            calculationPromiseRef.current = null;
        }
        
        setIsCalculating(false);
        setError(null);
    }, []);
    
    const calculate = useCallback(async (data: WorkerInput): Promise<IndependentSamplesTTestResults> => {
        // Cancel any existing calculation
        cancelCalculation();
        
        setIsCalculating(true);
        setError(null);
        
        return new Promise<IndependentSamplesTTestResults>((resolve, reject) => {
            // Store the promise callbacks in a wrapper that handles null
            calculationPromiseRef.current = {
                resolve: (result) => {
                    if (result === null) {
                        // Create an empty result object instead of returning null
                        resolve({});
                    } else {
                        resolve(result);
                    }
                },
                reject
            };
            
            try {
                // Create a new worker
                workerRef.current = new Worker("/workers/IndependentSamplesTTest/index.js", { type: 'module' });
                
                // Set up message handler
                workerRef.current.onmessage = (e) => {
                    const wData = e.data;
                    
                    if (wData.success) {
                        setIsCalculating(false);
                        resolve({
                            group: wData.group,
                            test: wData.test
                        });
                    } else {
                        setError(wData.error || "Worker returned an error.");
                        setIsCalculating(false);
                        reject(new Error(wData.error || "Worker returned an error."));
                    }
                    
                    // Cleanup
                    if (workerRef.current) {
                        workerRef.current.terminate();
                        workerRef.current = null;
                    }
                    calculationPromiseRef.current = null;
                };
                
                // Set up error handler
                workerRef.current.onerror = (event) => {
                    const errorMsg = "Worker error occurred. Check console for details.";
                    console.error("Worker error:", event);
                    setError(errorMsg);
                    setIsCalculating(false);
                    reject(new Error(errorMsg));
                    
                    // Cleanup
                    if (workerRef.current) {
                        workerRef.current.terminate();
                        workerRef.current = null;
                    }
                    calculationPromiseRef.current = null;
                };
                
                // Send data to worker
                workerRef.current.postMessage(data);
                
                // Set a timeout to prevent worker hanging
                setTimeout(() => {
                    if (workerRef.current) {
                        workerRef.current.terminate();
                        workerRef.current = null;
                        
                        const timeoutMsg = "Analysis timed out. Please try again with fewer variables.";
                        setError(timeoutMsg);
                        setIsCalculating(false);
                        reject(new Error(timeoutMsg));
                        calculationPromiseRef.current = null;
                    }
                }, 60000); // 60 second timeout
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : "Unknown error";
                setError(errorMsg);
                setIsCalculating(false);
                reject(error);
                calculationPromiseRef.current = null;
            }
        });
    }, [cancelCalculation]);
    
    return {
        calculate,
        isCalculating,
        error,
        cancelCalculation
    };
}; 
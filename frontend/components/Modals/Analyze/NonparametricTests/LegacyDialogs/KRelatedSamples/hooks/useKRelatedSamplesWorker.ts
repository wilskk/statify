import { useState, useCallback } from 'react';
import { KRelatedSamplesWorkerInterface, WorkerInput, WorkerCalculationPromise, KRelatedSamplesResults } from '../types';

export const useKRelatedSamplesWorker = (): KRelatedSamplesWorkerInterface => {
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);
    const [currentPromise, setCurrentPromise] = useState<WorkerCalculationPromise | null>(null);

    const calculate = useCallback((data: WorkerInput): Promise<KRelatedSamplesResults> => {
        setIsCalculating(true);
        setError(undefined);

        // Create a new promise to handle the worker communication
        return new Promise<KRelatedSamplesResults>((resolve, reject) => {
            try {
                // Create a new worker
                const worker = new Worker("/workers/KRelatedSamples/index.js", { type: 'module' });
                setCurrentWorker(worker);

                // Store the promise callbacks for potential cancellation
                const promiseHandlers = { resolve, reject };
                setCurrentPromise(promiseHandlers);

                // Set a timeout to prevent worker hanging
                const timeoutId = setTimeout(() => {
                    worker.terminate();
                    const timeoutError = new Error("Analysis timed out. Please try again with fewer variables.");
                    setError(timeoutError.message);
                    setIsCalculating(false);
                    reject(timeoutError);
                }, 60000); // 60 second timeout

                // Handle worker messages
                worker.onmessage = (e) => {
                    clearTimeout(timeoutId);
                    const result = e.data;

                    if (result.success) {
                        setIsCalculating(false);
                        worker.terminate();
                        setCurrentWorker(null);
                        setCurrentPromise(null);
                        resolve(result);
                    } else {
                        const workerError = new Error(result.error || "Worker returned an error.");
                        setError(workerError.message);
                        setIsCalculating(false);
                        worker.terminate();
                        setCurrentWorker(null);
                        setCurrentPromise(null);
                        reject(workerError);
                    }
                };

                // Handle worker errors
                worker.onerror = (event) => {
                    clearTimeout(timeoutId);
                    console.error("Worker error:", event);
                    const workerError = new Error("Worker error occurred. Check console for details.");
                    setError(workerError.message);
                    setIsCalculating(false);
                    worker.terminate();
                    setCurrentWorker(null);
                    setCurrentPromise(null);
                    reject(workerError);
                };

                // Send data to worker
                worker.postMessage(data);
            } catch (error) {
                setIsCalculating(false);
                const errorMessage = error instanceof Error ? error.message : 'An error occurred during calculation';
                setError(errorMessage);
                reject(new Error(errorMessage));
            }
        });
    }, []);

    const cancelCalculation = useCallback(() => {
        if (currentWorker) {
            currentWorker.terminate();
            setCurrentWorker(null);
        }

        if (currentPromise) {
            currentPromise.reject(new Error('Calculation was cancelled'));
            setCurrentPromise(null);
        }

        setIsCalculating(false);
    }, [currentWorker, currentPromise]);

    return {
        calculate,
        isCalculating,
        error,
        cancelCalculation
    };
}; 
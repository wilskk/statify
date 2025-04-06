// hooks/useWorkers.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import workerService from '../services/WorkerService';

// Type definitions
type WorkerStatus = 'idle' | 'processing' | 'error';

type WorkerTask = {
    worker: string;
    method: string;
    params: any[];
    enableCache?: boolean;
};

type BatchTasks = {
    [key: string]: WorkerTask;
};

type WorkerResults = {
    [key: string]: any;
};

type WorkerStatuses = {
    [key: string]: WorkerStatus;
};

/**
 * React hook untuk menggunakan web workers
 */
export function useWorkers() {
    const [isReady, setIsReady] = useState(false);
    const [statuses, setStatuses] = useState<WorkerStatuses>({});
    const statusInterval = useRef<any>(null);
    const initialized = useRef(false);

    // Update statuses secara berkala
    const updateStatuses = useCallback(() => {
        setStatuses(workerService.getAllStatuses());
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && !initialized.current) {
            initialized.current = true;
            setIsReady(true);

            // Start status tracking
            statusInterval.current = setInterval(() => {
                updateStatuses();
            }, 100); // Refresh status setiap 100ms
        }

        // Automatic cleanup idle workers
        const cleanupInterval = setInterval(() => {
            workerService.cleanupIdleWorkers();
        }, 60000);

        return () => {
            clearInterval(statusInterval.current);
            clearInterval(cleanupInterval);
        };
    }, [updateStatuses]);

    // Cek apakah ada worker yang sedang processing
    const isProcessing = useCallback(() => {
        return Object.values(statuses).some(status => status === 'processing');
    }, [statuses]);

    /**
     * Eksekusi single task
     * @param workerPath Path ke worker file
     * @param method Method yang akan dieksekusi
     * @param params Parameter untuk method
     * @param enableCache Enable caching untuk hasil
     * @returns Hasil eksekusi
     */
    const execute = useCallback(async <T = any>(
        workerPath: string,
        method: string,
        params: any[],
        enableCache: boolean = true
    ): Promise<T> => {
        if (!initialized.current) return null as any;

        try {
            updateStatuses(); // Update status sebelum eksekusi
            const result = await workerService.executeTask(workerPath, method, params, enableCache);
            updateStatuses(); // Update status setelah eksekusi
            return result;
        } catch (error) {
            updateStatuses(); // Update status jika error
            throw error;
        }
    }, [updateStatuses]);

    /**
     * Eksekusi multiple tasks
     * @param tasks Object dengan tasks untuk dieksekusi
     * @returns Hasil eksekusi semua tasks
     */
    const executeBatch = useCallback(async (
        tasks: BatchTasks
    ): Promise<WorkerResults> => {
        if (!initialized.current) return {};

        try {
            updateStatuses(); // Update status sebelum eksekusi
            const results = await workerService.executeBatch(tasks);
            updateStatuses(); // Update status setelah eksekusi
            return results;
        } catch (error) {
            updateStatuses(); // Update status jika error
            throw error;
        }
    }, [updateStatuses]);

    /**
     * Eksekusi multiple tasks dengan parameter yang sama
     * @param workerPaths Array paths ke worker files
     * @param method Method yang akan dieksekusi di semua workers
     * @param params Parameter yang sama untuk semua workers
     * @param enableCache Enable caching
     * @returns Hasil dari semua workers
     */
    const executeShared = useCallback(async <T = any>(
        workerPaths: string[],
        method: string,
        params: any[],
        enableCache: boolean = true
    ): Promise<{[key: string]: T}> => {
        if (!initialized.current) return {};

        const tasks: BatchTasks = {};
        workerPaths.forEach(path => {
            const key = path.replace('.worker.js', '');
            tasks[key] = {
                worker: path,
                method,
                params,
                enableCache
            };
        });

        return await executeBatch(tasks);
    }, [executeBatch]);

    /**
     * Reset error status untuk worker
     * @param workerPath Path ke worker
     */
    const resetStatus = useCallback((workerPath: string) => {
        workerService.resetStatus(workerPath);
        updateStatuses();
    }, [updateStatuses]);

    return {
        isReady,
        statuses,
        isProcessing: isProcessing(),
        execute,
        executeBatch,
        executeShared,
        resetStatus
    };
}
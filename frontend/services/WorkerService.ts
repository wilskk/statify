import * as Comlink from 'comlink';

type WorkerStatus = 'idle' | 'processing' | 'error';

interface WorkerInstance {
    worker: Worker;
    api: any;
    lastUsed: number;
    status: WorkerStatus;
}

interface WorkerCache {
    [key: string]: WorkerInstance;
}

interface TaskResult {
    [key: string]: any;
}

interface TaskStatus {
    [key: string]: WorkerStatus;
}

/**
 * Worker Service untuk manajemen lifecycle worker
 */
class WorkerService {
    private workers: WorkerCache = {};
    private resultCache: Map<string, any> = new Map();
    private taskStatus: TaskStatus = {};

    /**
     * Mendapatkan atau membuat worker instance
     * @param workerPath Path ke worker file
     * @returns Worker API
     */
    getWorker(workerPath: string): any {
        if (typeof window === 'undefined') return null;

        if (!this.workers[workerPath]) {

            const worker = new Worker(`public/workers/${workerPath}`);
            this.workers[workerPath] = {
                worker,
                api: Comlink.wrap(worker),
                lastUsed: Date.now(),
                status: 'idle'
            };
            this.taskStatus[workerPath] = 'idle';
        } else {
            this.workers[workerPath].lastUsed = Date.now();
        }

        return this.workers[workerPath].api;
    }

    /**
     * Mendapatkan status worker
     * @param workerPath Path ke worker file
     * @returns Status worker
     */
    getWorkerStatus(workerPath: string): WorkerStatus {
        return this.workers[workerPath]?.status || 'idle';
    }

    /**
     * Mendapatkan semua status worker
     * @returns Object dengan semua status worker
     */
    getAllStatuses(): TaskStatus {
        return { ...this.taskStatus };
    }

    /**
     * Eksekusi task di worker dengan tracking status
     * @param workerPath Path ke worker file
     * @param method Method yang akan dieksekusi
     * @param params Parameter untuk method
     * @param enableCache Enable caching untuk hasil
     * @returns Hasil eksekusi
     */
    async executeTask(
        workerPath: string,
        method: string,
        params: any[],
        enableCache: boolean = true
    ): Promise<any> {
        const worker = this.getWorker(workerPath);

        // Update status jadi processing
        this.workers[workerPath].status = 'processing';
        this.taskStatus[workerPath] = 'processing';

        try {
            if (enableCache) {
                // Create cache key
                const cacheKey = `${workerPath}|${method}|${JSON.stringify(params)}`;

                // Cek cache
                if (this.resultCache.has(cacheKey)) {
                    // Simulate brief processing for konsistensi UI
                    await new Promise(resolve => setTimeout(resolve, 10));

                    // Update status jadi idle
                    this.workers[workerPath].status = 'idle';
                    this.taskStatus[workerPath] = 'idle';

                    return this.resultCache.get(cacheKey);
                }

                const result = await worker[method](...params);
                this.resultCache.set(cacheKey, result);

                // Update status jadi idle setelah berhasil
                this.workers[workerPath].status = 'idle';
                this.taskStatus[workerPath] = 'idle';

                return result;
            }

            const result = await worker[method](...params);

            // Update status jadi idle setelah berhasil
            this.workers[workerPath].status = 'idle';
            this.taskStatus[workerPath] = 'idle';

            return result;
        } catch (error) {
            // Update status jadi error jika gagal
            this.workers[workerPath].status = 'error';
            this.taskStatus[workerPath] = 'error';
            throw error;
        }
    }

    /**
     * Eksekusi multiple tasks dengan tracking status
     * @param tasks Object dengan tasks untuk dieksekusi
     * @returns Hasil eksekusi semua tasks
     */
    async executeBatch(tasks: {
        [key: string]: {
            worker: string;
            method: string;
            params: any[];
            enableCache?: boolean;
        }
    }): Promise<TaskResult> {
        if (typeof window === 'undefined') return {};

        // Mark semua workers sebagai processing
        Object.values(tasks).forEach(({ worker }) => {
            if (this.workers[worker]) {
                this.workers[worker].status = 'processing';
                this.taskStatus[worker] = 'processing';
            }
        });

        const results: TaskResult = {};
        const promises = Object.entries(tasks).map(async ([key, task]) => {
            const { worker, method, params, enableCache = true } = task;

            try {
                results[key] = await this.executeTask(worker, method, params, enableCache);
                return { key, result: results[key] };
            } catch (error) {
                // Individual task error di-track per worker
                return { key, error };
            }
        });

        await Promise.all(promises);
        return results;
    }

    /**
     * Reset status error untuk worker
     * @param workerPath Path ke worker file
     */
    resetStatus(workerPath: string): void {
        if (this.workers[workerPath]) {
            this.workers[workerPath].status = 'idle';
            this.taskStatus[workerPath] = 'idle';
        }
    }

    /**
     * Clean up idle workers
     * @param maxIdleTime Waktu idle maksimum sebelum terminate
     */
    cleanupIdleWorkers(maxIdleTime: number = 60000): void {
        const now = Date.now();

        Object.entries(this.workers).forEach(([path, instance]) => {
            if (now - instance.lastUsed > maxIdleTime && instance.status === 'idle') {
                instance.worker.terminate();
                delete this.workers[path];
                delete this.taskStatus[path];
            }
        });
    }

    /**
     * Terminate semua workers
     */
    terminateAll(): void {
        Object.values(this.workers).forEach(({ worker }) => {
            worker.terminate();
        });
        this.workers = {};
        this.taskStatus = {};
        this.resultCache.clear();
    }
}

// Singleton instance
const workerService = new WorkerService();
export default workerService;
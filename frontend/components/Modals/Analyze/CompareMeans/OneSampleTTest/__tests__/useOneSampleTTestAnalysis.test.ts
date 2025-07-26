import { renderHook, act } from '@testing-library/react';
import { useOneSampleTTestAnalysis } from '../hooks/useOneSampleTTestAnalysis';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useDataStore } from '@/stores/useDataStore';
import { OneSampleTTestAnalysisProps } from '../types';
import type { Variable } from '@/types/Variable';

// Mock dependencies
jest.mock('@/stores/useResultStore');
jest.mock('@/hooks/useAnalysisData');
jest.mock('@/stores/useDataStore');

// Mock Worker
const mockPostMessage = jest.fn();
const mockWorkerTerminate = jest.fn();

// A fake Worker instance used by the pooled client
const createFakeWorker = () => {
  let onMessageHandler: ((event: { data: any }) => void) = () => {};
  let onErrorHandler: ((event: ErrorEvent) => void) = () => {};

  return {
    postMessage: mockPostMessage,
    terminate: mockWorkerTerminate,
    set onmessage(fn: (event: { data: any }) => void) {
      onMessageHandler = fn;
    },
    get onmessage() {
      return onMessageHandler;
    },
    set onerror(fn: (event: ErrorEvent) => void) {
      onErrorHandler = fn;
    },
    get onerror() {
      return onErrorHandler;
    },
    // Helper methods for tests to trigger events
    triggerMessage(data: any) {
      onMessageHandler({ data });
    },
    triggerError(error: ErrorEvent) {
      onErrorHandler(error);
    }
  };
};

// Worker mock
let fakeWorker: ReturnType<typeof createFakeWorker>;

// Override global.Worker as fallback
global.Worker = jest.fn().mockImplementation(() => {
  fakeWorker = createFakeWorker();
  return fakeWorker;
});

// Mock implementations
const mockedUseResultStore = useResultStore as unknown as jest.Mock;
const mockedUseAnalysisData = useAnalysisData as unknown as jest.Mock;
const mockedUseDataStore = useDataStore as unknown as jest.Mock;

const mockAddLog = jest.fn();
const mockAddAnalytic = jest.fn();
const mockAddStatistic = jest.fn();
const mockCheckAndSave = jest.fn();
const mockOnClose = jest.fn();

const mockVariables: Variable[] = [
    { name: 'var1', label: 'Variable 1', columnIndex: 0, type: 'NUMERIC', tempId: '1', width: 8, decimals: 0, values: [], missing: {}, align: 'left', measure: 'scale', role: 'input', columns: 8 },
    { name: 'var2', label: 'Variable 2', columnIndex: 1, type: 'NUMERIC', tempId: '2', width: 8, decimals: 0, values: [], missing: {}, align: 'left', measure: 'scale', role: 'input', columns: 8 },
];

const mockAnalysisData = [
    [10, 100],
    [20, 200],
];

describe('useOneSampleTTestAnalysis', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseResultStore.mockReturnValue({ addLog: mockAddLog, addAnalytic: mockAddAnalytic, addStatistic: mockAddStatistic });
        mockedUseAnalysisData.mockReturnValue({ data: mockAnalysisData });
        mockedUseDataStore.mockReturnValue({ getState: () => ({ checkAndSave: mockCheckAndSave }) });
        
        mockAddLog.mockResolvedValue('log-123');
        mockAddAnalytic.mockResolvedValue('analytic-123');
        mockCheckAndSave.mockResolvedValue(undefined);
    });

    const defaultParams: OneSampleTTestAnalysisProps = {
        testVariables: [mockVariables[0]],
        testValue: 0,
        estimateEffectSize: false,
        onClose: mockOnClose
    };

    const renderTestHook = (params: Partial<OneSampleTTestAnalysisProps> = {}) => {
        return renderHook(() => useOneSampleTTestAnalysis({ ...defaultParams, ...params }));
    };

    // ====================================================
    // Validasi Pra-Analisis dan Pengaturan
    // ====================================================
    
    describe('Validasi Pra-Analisis dan Pengaturan', () => {
        it('menampilkan error jika tidak ada variabel dipilih', async () => {
            const { result } = renderTestHook({ testVariables: [] });
            
            await act(async () => {
                await result.current.runAnalysis();
            });
            
            expect(result.current.errorMsg).toContain('Please select at least one variable');
            expect(result.current.isCalculating).toBe(false);
            expect(mockPostMessage).not.toHaveBeenCalled();
        });
        
        it('mengatur status isCalculating menjadi true saat analisis dimulai', async () => {
            // Mock checkAndSave untuk menunda resolusi promise
            mockCheckAndSave.mockImplementation(() => new Promise(resolve => {
                setTimeout(() => resolve(undefined), 100);
            }));
            
            const { result } = renderTestHook();
            
            // Mulai analisis tanpa menunggu selesai
            let analysisPromise: Promise<void>;
            
            await act(async () => {
                analysisPromise = result.current.runAnalysis();
                // Periksa status setelah checkAndSave dipanggil tapi sebelum selesai
                expect(result.current.isCalculating).toBe(true);
            });
            
            // Tunggu analisis selesai untuk cleanup
            await act(async () => {
                // Simulasikan pesan sukses dari worker
                if (fakeWorker) {
                    fakeWorker.triggerMessage({
                        status: 'success',
                        variableName: 'var1',
                        results: {
                            oneSampleStatistics: { variable: mockVariables[0], N: 2, Mean: 15, StdDev: 7.07, SEMean: 5 },
                            oneSampleTest: { variable: mockVariables[0], T: 3, DF: 1, PValue: 0.205, MeanDifference: 15, Lower: -48.53, Upper: 78.53 }
                        }
                    });
                }
                await analysisPromise;
            });
        });
        
        it('menangani kegagalan saat menyimpan data', async () => {
            // Setup mock untuk gagal
            mockCheckAndSave.mockRejectedValue(new Error('Failed to save data'));
            
            const { result } = renderTestHook();
            
            await act(async () => {
                await result.current.runAnalysis();
            });
            
            expect(result.current.errorMsg).toContain('Failed to save');
            expect(result.current.isCalculating).toBe(false);
            expect(mockPostMessage).not.toHaveBeenCalled();
        });
    });

    // ====================================================
    // Interaksi dengan Web Worker
    // ====================================================
    
    describe('Interaksi dengan Web Worker', () => {
        it('mengirim data ke worker dengan benar', async () => {
            const { result } = renderTestHook({
                testVariables: mockVariables,
                testValue: 5,
                estimateEffectSize: true
            });
            
            await act(async () => {
                const analysisPromise = result.current.runAnalysis();
                
                // Simulasikan respons worker untuk kedua variabel
                if (fakeWorker) {
                    fakeWorker.triggerMessage({
                        status: 'success',
                        variableName: 'var1',
                        results: {
                            oneSampleStatistics: { variable: mockVariables[0], N: 2, Mean: 15, StdDev: 7.07, SEMean: 5 },
                            oneSampleTest: { variable: mockVariables[0], T: 3, DF: 1, PValue: 0.205, MeanDifference: 15, Lower: -48.53, Upper: 78.53 }
                        }
                    });
                    
                    fakeWorker.triggerMessage({
                        status: 'success',
                        variableName: 'var2',
                        results: {
                            oneSampleStatistics: { variable: mockVariables[1], N: 2, Mean: 150, StdDev: 70.7, SEMean: 50 },
                            oneSampleTest: { variable: mockVariables[1], T: 3, DF: 1, PValue: 0.205, MeanDifference: 150, Lower: -485.3, Upper: 785.3 }
                        }
                    });
                }
                
                await analysisPromise;
            });
            
            // Verifikasi panggilan untuk variabel pertama
            expect(mockPostMessage).toHaveBeenCalledTimes(2);
            expect(mockPostMessage.mock.calls[0][0]).toEqual({
                analysisType: ['oneSampleTTest'],
                variable: mockVariables[0],
                data: [10, 20],
                options: { testValue: 5, estimateEffectSize: true }
            });
            
            // Verifikasi panggilan untuk variabel kedua
            expect(mockPostMessage.mock.calls[1][0]).toEqual({
                analysisType: ['oneSampleTTest'],
                variable: mockVariables[1],
                data: [100, 200],
                options: { testValue: 5, estimateEffectSize: true }
            });
        });
        
        it('memproses respons sukses dari worker', async () => {
            const { result } = renderTestHook();
            
            await act(async () => {
                const analysisPromise = result.current.runAnalysis();
                
                // Simulasikan respons sukses dari worker
                if (fakeWorker) {
                    fakeWorker.triggerMessage({
                        status: 'success',
                        variableName: 'var1',
                        results: {
                            oneSampleStatistics: {
                                variable: mockVariables[0],
                                N: 2,
                                Mean: 15,
                                StdDev: 7.07,
                                SEMean: 5
                            },
                            oneSampleTest: {
                                variable: mockVariables[0],
                                T: 3,
                                DF: 1,
                                PValue: 0.205,
                                MeanDifference: 15,
                                Lower: -48.53,
                                Upper: 78.53
                            }
                        }
                    });
                }
                
                await analysisPromise;
            });
            
            expect(mockAddStatistic).toHaveBeenCalledTimes(2); // Satu untuk statistik dan satu untuk hasil test
            expect(mockAddLog).toHaveBeenCalled();
            expect(mockAddAnalytic).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
            expect(result.current.isCalculating).toBe(false);
            expect(result.current.errorMsg).toBe(null);
        });
        
        it('menangani pesan error dari worker', async () => {
            const { result } = renderTestHook();
            
            await act(async () => {
                const analysisPromise = result.current.runAnalysis();
                
                // Simulasikan error dari worker
                if (fakeWorker) {
                    fakeWorker.triggerMessage({ 
                        status: 'error', 
                        variableName: 'var1', 
                        error: 'Test worker error' 
                    });
                }
                
                await analysisPromise;
            });
            
            expect(result.current.errorMsg).toContain('Calculation failed for var1: Test worker error');
            expect(mockAddStatistic).toHaveBeenCalled(); // Akan menyimpan tabel error
            expect(result.current.isCalculating).toBe(false);
        });
        
        it('menangani error kritis pada worker', async () => {
            const { result } = renderTestHook();
            
            await act(async () => {
                const analysisPromise = result.current.runAnalysis();
                
                // Simulasikan error kritis pada worker
                if (fakeWorker) {
                    const errorEvent = new ErrorEvent('error', {
                        error: new Error('Script loading failed'),
                        message: 'Worker script could not be loaded'
                    });
                    
                    fakeWorker.triggerError(errorEvent);
                }
                
                await analysisPromise;
            });
            
            expect(result.current.errorMsg).toContain('A critical worker error occurred');
            expect(result.current.isCalculating).toBe(false);
        });
    });

    // ====================================================
    // Pemrosesan Hasil dan Penyimpanan
    // ====================================================
    
    describe('Pemrosesan Hasil dan Penyimpanan', () => {
        it('menunggu semua variabel selesai diproses', async () => {
            const { result } = renderTestHook({ testVariables: mockVariables });
            
            await act(async () => {
                const analysisPromise = result.current.runAnalysis();
                
                // Simulasikan respons untuk variabel pertama
                if (fakeWorker) {
                    fakeWorker.triggerMessage({ 
                        status: 'success', 
                        variableName: 'var1', 
                        results: {
                            oneSampleStatistics: {
                                variable: mockVariables[0],
                                N: 2,
                                Mean: 15,
                                StdDev: 7.07,
                                SEMean: 5
                            },
                            oneSampleTest: {
                                variable: mockVariables[0],
                                T: 3,
                                DF: 1,
                                PValue: 0.205,
                                MeanDifference: 15,
                                Lower: -48.53,
                                Upper: 78.53
                            }
                        } 
                    });
                }
                
                // Setelah satu variabel, onClose belum dipanggil
                expect(mockOnClose).not.toHaveBeenCalled();
                expect(result.current.isCalculating).toBe(true);
                
                // Simulasikan respons untuk variabel kedua
                if (fakeWorker) {
                    fakeWorker.triggerMessage({ 
                        status: 'success', 
                        variableName: 'var2', 
                        results: {
                            oneSampleStatistics: {
                                variable: mockVariables[1],
                                N: 2,
                                Mean: 150,
                                StdDev: 70.7,
                                SEMean: 50
                            },
                            oneSampleTest: {
                                variable: mockVariables[1],
                                T: 3,
                                DF: 1,
                                PValue: 0.205,
                                MeanDifference: 150,
                                Lower: -485.3,
                                Upper: 785.3
                            }
                        } 
                    });
                }
                
                await analysisPromise;
            });
            
            // Setelah semua variabel selesai, onClose dipanggil
            expect(mockOnClose).toHaveBeenCalled();
            expect(result.current.isCalculating).toBe(false);
        });
        
        it('memanggil fungsi penyimpanan dengan data terformat', async () => {
            const { result } = renderTestHook();
            
            await act(async () => {
                const analysisPromise = result.current.runAnalysis();
                
                // Simulasikan respons sukses dari worker
                if (fakeWorker) {
                    fakeWorker.triggerMessage({
                        status: 'success',
                        variableName: 'var1',
                        results: {
                            oneSampleStatistics: {
                                variable: mockVariables[0],
                                N: 2,
                                Mean: 15,
                                StdDev: 7.07,
                                SEMean: 5
                            },
                            oneSampleTest: {
                                variable: mockVariables[0],
                                T: 3,
                                DF: 1,
                                PValue: 0.205,
                                MeanDifference: 15,
                                Lower: -48.53,
                                Upper: 78.53
                            }
                        }
                    });
                }
                
                await analysisPromise;
            });
            
            // Verifikasi addStatistic dipanggil dengan data yang diformat dengan benar
            expect(mockAddStatistic).toHaveBeenCalledTimes(2);
            
            // Verifikasi format panggilan pertama (statistik)
            const firstCall = mockAddStatistic.mock.calls[0][1];
            expect(firstCall).toHaveProperty('title');
            expect(firstCall).toHaveProperty('output_data');
            
            // Verifikasi format panggilan kedua (hasil test)
            const secondCall = mockAddStatistic.mock.calls[1][1];
            expect(secondCall).toHaveProperty('title');
            expect(secondCall).toHaveProperty('output_data');
        });
        
        it('menangani kasus data tidak cukup (insufficient data)', async () => {
            const { result } = renderTestHook();
            
            await act(async () => {
                const analysisPromise = result.current.runAnalysis();
                
                // Simulasikan respons insufficient data dari worker
                if (fakeWorker) {
                    fakeWorker.triggerMessage({
                        status: 'success',
                        variableName: 'var1',
                        results: {
                            metadata: {
                                hasInsufficientData: true,
                                variableName: 'var1',
                                totalData: 2,
                                validData: 1
                            },
                            oneSampleStatistics: {
                                variable: mockVariables[0],
                                N: 1,
                                Mean: 10,
                                StdDev: 0,
                                SEMean: 0
                            }
                        }
                    });
                }
                
                await analysisPromise;
            });
            
            // Verifikasi bahwa addStatistic dipanggil dengan data yang menunjukkan insufficient data
            expect(mockAddStatistic).toHaveBeenCalled();
            expect(mockAddLog).toHaveBeenCalled();
            
            // Log harus mencantumkan informasi tentang data tidak cukup
            const logCall = mockAddLog.mock.calls[0][0];
            expect(logCall.log).toContain('T-TEST');
        });
        
        it('menyimpan tabel error jika tidak ada hasil valid', async () => {
            const { result } = renderTestHook({ testVariables: mockVariables });
            
            await act(async () => {
                const analysisPromise = result.current.runAnalysis();
                
                // Kedua variabel menghasilkan error
                if (fakeWorker) {
                    fakeWorker.triggerMessage({ 
                        status: 'error', 
                        variableName: 'var1', 
                        error: 'Error for var1' 
                    });
                    
                    fakeWorker.triggerMessage({ 
                        status: 'error', 
                        variableName: 'var2', 
                        error: 'Error for var2' 
                    });
                }
                
                await analysisPromise;
            });
            
            // Verifikasi bahwa addStatistic dipanggil dengan tabel error
            expect(mockAddStatistic).toHaveBeenCalled();
            const statisticCall = mockAddStatistic.mock.calls[0][1];
            expect(statisticCall.title).toContain('Error');
            
            // onClose masih dipanggil meskipun semua variabel error
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    // ====================================================
    // Manajemen State dan Siklus Hidup (Lifecycle)
    // ====================================================
    
    describe('Manajemen State dan Siklus Hidup', () => {
        it('mengatur isCalculating menjadi false setelah selesai', async () => {
            const { result } = renderTestHook();
            
            let analysisPromise: Promise<void>;
            
            await act(async () => {
                analysisPromise = result.current.runAnalysis();
                // isCalculating seharusnya true setelah runAnalysis dipanggil
                expect(result.current.isCalculating).toBe(true);
            });
            
            await act(async () => {
                // Simulasikan respons sukses dari worker
                if (fakeWorker) {
                    fakeWorker.triggerMessage({
                        status: 'success',
                        variableName: 'var1',
                        results: {
                            oneSampleStatistics: {
                                variable: mockVariables[0],
                                N: 2,
                                Mean: 15,
                                StdDev: 7.07,
                                SEMean: 5
                            },
                            oneSampleTest: {
                                variable: mockVariables[0],
                                T: 3,
                                DF: 1,
                                PValue: 0.205,
                                MeanDifference: 15,
                                Lower: -48.53,
                                Upper: 78.53
                            }
                        }
                    });
                }
                
                await analysisPromise;
            });
            
            expect(result.current.isCalculating).toBe(false);
        });
        
        it('membatalkan analisis yang sedang berjalan', async () => {
            const { result } = renderTestHook();
            
            let analysisPromise: Promise<void>;
            
            await act(async () => {
                analysisPromise = result.current.runAnalysis();
                // isCalculating seharusnya true setelah runAnalysis dipanggil
                expect(result.current.isCalculating).toBe(true);
            });
            
            await act(async () => {
                result.current.cancelAnalysis();
            });
            
            expect(mockWorkerTerminate).toHaveBeenCalled();
            expect(result.current.isCalculating).toBe(false);
            
            try {
                // Selesaikan promise untuk cleanup
                await analysisPromise;
            } catch (e) {
                // Ignore errors from cancelled analysis
            }
        });
        
        it('membersihkan worker saat unmount', async () => {
            const { result, unmount } = renderTestHook();
            
            let analysisPromise: Promise<void>;
            
            await act(async () => {
                analysisPromise = result.current.runAnalysis();
                // isCalculating seharusnya true setelah runAnalysis dipanggil
                expect(result.current.isCalculating).toBe(true);
            });
            
            // Unmount komponen
            unmount();
            
            // Worker harus dibersihkan
            expect(mockWorkerTerminate).toHaveBeenCalled();
            
            try {
                // Selesaikan promise untuk cleanup
                await analysisPromise;
            } catch (e) {
                // Ignore errors from unmounted component
            }
        });
        
        it('memanggil onClose setelah sukses', async () => {
            const { result } = renderTestHook();
            
            await act(async () => {
                const analysisPromise = result.current.runAnalysis();
                
                // Simulasikan respons sukses dari worker
                if (fakeWorker) {
                    fakeWorker.triggerMessage({
                        status: 'success',
                        variableName: 'var1',
                        results: {
                            oneSampleStatistics: {
                                variable: mockVariables[0],
                                N: 2,
                                Mean: 15,
                                StdDev: 7.07,
                                SEMean: 5
                            },
                            oneSampleTest: {
                                variable: mockVariables[0],
                                T: 3,
                                DF: 1,
                                PValue: 0.205,
                                MeanDifference: 15,
                                Lower: -48.53,
                                Upper: 78.53
                            }
                        }
                    });
                }
                
                await analysisPromise;
            });
            
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });
}); 
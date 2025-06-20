# Panduan Pengujian untuk Fitur Modal

Dokumen ini adalah panduan spesifik untuk melakukan *unit testing* pada fitur modal menggunakan Jest dan React Testing Library. Panduan ini merupakan pelengkap dari [Panduan Arsitektur Utama Modal](./README.md).

## Filosofi Pengujian

Pemisahan tanggung jawab yang jelas antara `hooks`, `services`, dan komponen UI adalah kunci untuk pengujian yang efektif dan mudah dikelola. Tujuan kita adalah menguji setiap bagian secara terisolasi.

-   **Hooks**: Diuji untuk logika manajemen state (misalnya, `isLoading`, `error`, data) dan alur kerja.
-   **Services**: Diuji untuk memastikan mereka berkomunikasi dengan benar dengan dependensi eksternal (Web Workers, API, dll.).
-   **Components**: Diuji untuk memastikan mereka me-render UI dengan benar berdasarkan *props* yang diterima (pengujian snapshot atau pengujian fungsional dasar).

## Unit Testing dengan Jest

Berikut adalah strategi dan contoh untuk menguji bagian-bagian penting dari sebuah fitur modal.

### 1. Menguji Hook (`hooks/`)

Tujuan pengujian hook adalah untuk memverifikasi logika perubahan *state*-nya, bukan implementasi *service* yang dipanggilnya.

-   **Strategi**: Lakukan **mock pada service module** untuk mengisolasi hook dari dependensi eksternal (seperti Web Worker atau panggilan API). Ini memungkinkan kita untuk mengontrol apa yang dikembalikan oleh *service* dan memeriksa bagaimana hook bereaksi.
-   **Contoh (`__tests__/useMyLogic.test.ts`)**:
    ```javascript
    import { renderHook, act } from '@testing-library/react-hooks';
    import { useMyLogic } from '../hooks/useMyLogic';
    import * as myService from '../services/myService';

    // Mock seluruh modul service
    jest.mock('../services/myService');

    // Ketik mock function untuk akses yang aman
    const mockedExecute = myService.execute as jest.Mock;

    it('should handle loading and success states correctly', async () => {
      // Atur apa yang akan dikembalikan oleh mock service saat dipanggil
      mockedExecute.mockResolvedValue({ data: 'sukses' });

      const { result, waitForNextUpdate } = renderHook(() => useMyLogic());

      // Gunakan 'act' untuk membungkus panggilan fungsi yang menyebabkan update state
      await act(async () => {
        result.current.startProcess();
        // Langsung setelah dipanggil, state loading harus true
        expect(result.current.isLoading).toBe(true);
        // Tunggu promise dari hook selesai
        await waitForNextUpdate();
      });

      // Setelah promise selesai, loading harus false dan data harus terisi
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual({ data: 'sukses' });
    });

    it('should handle error state correctly', async () => {
        // Atur mock untuk mengembalikan error
        mockedExecute.mockRejectedValue(new Error('Gagal memproses'));

        const { result, waitForNextUpdate } = renderHook(() => useMyLogic());

        await act(async () => {
            result.current.startProcess();
            await waitForNextUpdate();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Gagal memproses');
    });
    ```

### 2. Menguji Service (`services/`)

Tujuan pengujian *service* adalah untuk memastikan *service* tersebut berkomunikasi dengan dependensinya (misalnya, Web Worker) secara benar.

-   **Strategi**: Lakukan **mock pada constructor `Worker`** atau API eksternal lainnya (`fetch`, `FileReader`, dll.). Ini memungkinkan kita untuk "mencegat" panggilan ke dependensi tersebut dan memverifikasi parameter yang dikirim.
-   **Contoh (`__tests__/myService.test.ts`)**:
    ```javascript
    import { execute } from '../services/myService';

    // Buat mock untuk fungsi-fungsi Worker yang akan kita gunakan
    const mockPostMessage = jest.fn();
    const mockTerminate = jest.fn();

    // Mock constructor Worker global
    global.Worker = jest.fn(() => ({
      postMessage: mockPostMessage,
      terminate: mockTerminate,
      onmessage: jest.fn(),
      onerror: jest.fn(),
    })) as any;

    // Bersihkan mock setelah setiap tes untuk isolasi
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should post the correct message to the worker', () => {
      const params = { variables: ['VAR1'] };
      execute(params); // Panggil fungsi service

      // Verifikasi bahwa Worker dibuat
      expect(global.Worker).toHaveBeenCalledWith(/* path to worker script */);

      // Verifikasi bahwa postMessage dipanggil dengan payload yang benar
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'MY_PROCESS',
        params,
      });
    });
    ```

</rewritten_file> 
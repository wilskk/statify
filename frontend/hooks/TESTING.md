# Panduan Pengujian Custom Hooks

Dokumen ini memberikan panduan dan contoh untuk melakukan *unit testing* pada *custom hooks* di dalam direktori `hooks/` menggunakan **Jest** dan **React Testing Library**.

## Filosofi Pengujian Hooks

Tujuan utama pengujian *custom hook* adalah untuk memverifikasi **logika internal dan manajemen state-nya** secara terisolasi, tanpa perlu me-render komponen UI penuh. Kita ingin memastikan bahwa *hook* tersebut:
1. Memberikan nilai awal (*initial state*) yang benar.
2. Mengubah *state* dan mengembalikan nilai yang benar sebagai respons terhadap pemanggilan fungsinya.
3. Menangani kasus-kasus khusus seperti status *loading* atau *error*.

## Strategi Pengujian

Gunakan fungsi `renderHook` dari React Testing Library untuk me-render sebuah *hook* di dalam lingkungan pengujian. Ini memungkinkan kita untuk berinteraksi dengan *hook* dan memeriksa hasilnya.

### 1. Menguji State Awal

Verifikasi bahwa *hook* mengembalikan nilai-nilai awal yang diharapkan saat pertama kali di-render.

- **Contoh (`useCounter.test.ts`)**:
  ```tsx
  import { renderHook } from '@testing-library/react';
  import { useCounter } from './useCounter';

  describe('useCounter', () => {
    it('should initialize with an initial count of 0', () => {
      const { result } = renderHook(() => useCounter());
      // 'result.current' berisi nilai yang di-return oleh hook
      expect(result.current.count).toBe(0);
    });
  });
  ```

### 2. Menguji Perubahan State

Gunakan fungsi `act` dari React Testing Library untuk membungkus kode apa pun yang menyebabkan pembaruan *state* di dalam *hook*. Ini memastikan bahwa React memproses pembaruan tersebut sebelum kita membuat *assertion*.

- **Contoh (`useCounter.test.ts`)**:
  ```tsx
  import { renderHook, act } from '@testing-library/react';
  import { useCounter } from './useCounter';

  describe('useCounter', () => {
    // ... tes sebelumnya
    it('should increment the count', () => {
      const { result } = renderHook(() => useCounter());

      // Bungkus pemanggilan fungsi yang mengubah state dengan 'act'
      act(() => {
        result.current.increment();
      });

      // Verifikasi bahwa state telah diperbarui
      expect(result.current.count).toBe(1);
    });
  });
  ```

### 3. Menguji Hooks Asinkron

Untuk *hook* yang melakukan operasi asinkron (misalnya, *fetching* data), Anda perlu menunggu pembaruan *state* selesai.

- **Strategi**: Lakukan *mock* pada dependensi eksternal (seperti `fetch` atau *service*). Gunakan `async/await` dengan `act` dan metode seperti `waitForNextUpdate` (jika menggunakan `@testing-library/react-hooks` versi lama) atau cukup `await` di dalam `act`.
- **Contoh (`useDataFetcher.test.ts`)**:
  ```tsx
  import { renderHook, act } from '@testing-library/react';
  import { useDataFetcher } from './useDataFetcher';
  import * as dataService from '../services/dataService'; // Asumsikan ada service

  // Mock service module
  jest.mock('../services/dataService');
  const mockedFetchData = dataService.fetchData as jest.Mock;

  it('should fetch and set data successfully', async () => {
    // Atur mock untuk mengembalikan data
    mockedFetchData.mockResolvedValue({ id: 1, name: 'Test Data' });
    
    const { result } = renderHook(() => useDataFetcher());

    // State awal
    expect(result.current.isLoading).toBe(false);

    // Panggil fungsi untuk memulai proses fetch
    // `act` untuk operasi asinkron
    await act(async () => {
      result.current.loadData();
    });

    // State akhir setelah promise selesai
    // React Testing Library versi baru secara otomatis menangani update asinkron
    // sehingga kita bisa langsung assert setelah `await act`
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual({ id: 1, name: 'Test Data' });
    expect(result.current.error).toBeNull();
  });
  ```

---
**Struktur File**: Selalu letakkan file pengujian di samping file *hook*-nya (misalnya, `useCounter.ts` dan `useCounter.test.ts`). 
# Panduan Pengujian State Stores (Zustand)

Dokumen ini memberikan panduan untuk melakukan *unit testing* pada *state stores* yang dibuat menggunakan **Zustand** di dalam direktori `stores/`.

## Filosofi Pengujian Stores

Tujuan utama pengujian *store* adalah untuk memverifikasi **logika manajemen state** secara terisolasi. Kita ingin memastikan bahwa:
1. *Store* diinisialisasi dengan *state* awal yang benar.
2. Memanggil sebuah *action* akan mengubah *state* ke kondisi yang diharapkan.
3. *Selector* (jika ada) mengembalikan data yang benar dari *state*.

Kita tidak perlu me-render komponen apa pun untuk menguji *store*. Pengujian dilakukan langsung pada *logic* Zustand.

## Strategi Pengujian

### 1. Menguji State Awal

Setelah mengimpor *store*, Anda dapat langsung mengakses *state*-nya menggunakan metode `getState()` untuk memeriksa nilai awalnya.

- **Contoh (`useDataStore.test.ts`)**:
  ```ts
  import { useDataStore } from './useDataStore';

  describe('useDataStore', () => {
    it('should have a correct initial state', () => {
      const initialState = useDataStore.getState();
      
      expect(initialState.data).toEqual([]);
      expect(initialState.isLoading).toBe(false);
      expect(initialState.error).toBeNull();
    });
  });
  ```

### 2. Menguji Actions

Panggil *action* dari *store*, lalu gunakan `getState()` lagi untuk memeriksa apakah *state* telah diperbarui dengan benar.

- **Strategi**: Untuk membersihkan *state* di antara pengujian, gunakan metode `setState()` dari Zustand dengan *state* awal untuk me-reset-nya. Lakukan ini di dalam `beforeEach` atau `afterEach`.
- **Contoh (`useDataStore.test.ts`)**:
  ```ts
  import { useDataStore } from './useDataStore';

  // Dapatkan state awal untuk keperluan reset
  const initialState = useDataStore.getState();

  describe('useDataStore actions', () => {
    // Reset state sebelum setiap tes
    beforeEach(() => {
      useDataStore.setState(initialState);
    });

    it('should set data correctly when addData is called', () => {
      // Panggil action untuk mengubah state
      act(() => {
        useDataStore.getState().addData({ id: 1, name: 'New Item' });
      });

      const currentState = useDataStore.getState();
      expect(currentState.data).toHaveLength(1);
      expect(currentState.data[0]).toEqual({ id: 1, name: 'New Item' });
    });

    it('should clear all data when clearData is called', () => {
      // Setup state awal untuk tes ini
      act(() => {
        useDataStore.getState().addData({ id: 1, name: 'Item 1' });
        useDataStore.getState().addData({ id: 2, name: 'Item 2' });
      });
      
      // Pastikan state sudah ter-setup
      expect(useDataStore.getState().data).toHaveLength(2);

      // Panggil action yang akan diuji
      act(() => {
        useDataStore.getState().clearData();
      });

      // Verifikasi state akhir
      expect(useDataStore.getState().data).toHaveLength(0);
    });
  });
  ```
  *Catatan: Pembungkusan dengan `act` disarankan, terutama jika ada pendengar (listener) yang mungkin bereaksi terhadap perubahan state, untuk memastikan pengujian berjalan dalam lingkungan yang mirip dengan React.*

### 3. Menguji Store dengan Dependensi

Jika *store* Anda memiliki *action* yang memanggil *service* eksternal (misalnya, untuk *fetch* data), Anda harus mem-*mock service* tersebut.

- **Contoh (`useUserStore.test.ts`)**:
  ```ts
  import { useUserStore } from './useUserStore';
  import * as userService from '../services/userService';

  // Mock service
  jest.mock('../services/userService');
  const mockedFetchUser = userService.fetchUser as jest.Mock;

  const initialState = useUserStore.getState();

  describe('useUserStore async actions', () => {
    beforeEach(() => {
      useUserStore.setState(initialState);
      jest.clearAllMocks();
    });

    it('should handle user fetching process correctly', async () => {
      mockedFetchUser.mockResolvedValue({ id: 'u1', name: 'Patrick' });

      // State sebelum fetch
      expect(useUserStore.getState().isLoading).toBe(false);
      
      // Panggil action asinkron
      await act(async () => {
        await useUserStore.getState().loadUser('u1');
      });

      const finalState = useUserStore.getState();
      
      // Verifikasi state setelah fetch berhasil
      expect(finalState.isLoading).toBe(false);
      expect(finalState.user).toEqual({ id: 'u1', name: 'Patrick' });
      expect(mockedFetchUser).toHaveBeenCalledWith('u1');
    });
  });
  ```

---
**Struktur File**: Letakkan file pengujian di samping file *store*-nya (misalnya, `useDataStore.ts` dan `useDataStore.test.ts`). 
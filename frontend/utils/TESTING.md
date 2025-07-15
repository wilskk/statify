# Panduan Pengujian Utility Functions

Dokumen ini memberikan panduan untuk melakukan *unit testing* pada fungsi-fungsi pembantu (*utility functions*) di dalam direktori `utils/`.

## Filosofi Pengujian Utilitas

Fungsi utilitas biasanya adalah **fungsi murni** (*pure functions*). Artinya:
-   Untuk input yang sama, fungsi akan selalu menghasilkan output yang sama.
-   Fungsi tidak memiliki efek samping (*side effects*), seperti memodifikasi state global atau melakukan panggilan API.

Oleh karena itu, pengujian untuk fungsi-fungsi ini adalah yang paling sederhana dan lugas. Tujuannya adalah untuk memverifikasi bahwa **untuk input X, fungsi mengembalikan output Y**.

## Strategi Pengujian

Pengujian dilakukan dengan memanggil fungsi secara langsung dengan berbagai macam input dan memeriksa apakah output yang dikembalikan sesuai dengan yang diharapkan.

### 1. Pengujian Kasus Umum (Happy Path)

Sediakan input yang valid dan umum, lalu pastikan outputnya benar.

- **Contoh (`mathUtils.test.ts`)**:
  ```ts
  import { add, subtract } from './mathUtils';

  describe('add', () => {
    it('should return the sum of two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should return the sum when one number is negative', () => {
      expect(add(5, -2)).toBe(3);
    });
  });

  describe('subtract', () => {
    it('should return the difference of two numbers', () => {
      expect(subtract(10, 4)).toBe(6);
    });
  });
  ```

### 2. Pengujian Kasus Tepi (Edge Cases)

Pikirkan tentang input yang tidak biasa atau "ekstrem" yang mungkin diterima oleh fungsi Anda.

- **Contoh (`stringUtils.test.ts`)**:
  ```ts
  import { truncate } from './stringUtils';

  describe('truncate', () => {
    it('should not truncate a string shorter than the limit', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('should handle an empty string', () => {
      expect(truncate('', 5)).toBe('');
    });

    it('should handle a limit of 0', () => {
      expect(truncate('world', 0)).toBe('...');
    });
  });
  ```

### 3. Pengujian Tipe Data yang Berbeda atau Tidak Valid

Pastikan fungsi Anda bereaksi dengan benar jika menerima input yang tidak diharapkan, seperti `null`, `undefined`, atau tipe data yang salah.

- **Contoh (`arrayUtils.test.ts`)**:
  ```ts
  import { findMax } from './arrayUtils';

  describe('findMax', () => {
    it('should return null for an empty array', () => {
      expect(findMax([])).toBeNull();
    });

    it('should handle an array with non-number elements gracefully', () => {
      // Tergantung pada implementasi, mungkin melempar error atau mengabaikannya.
      // Di sini, kita asumsikan ia akan melempar error.
      const mixedArray = [1, 'a', 5];
      expect(() => findMax(mixedArray)).toThrow('Invalid element found in array');
    });
  });
  ```

---
**Struktur File**: Selalu letakkan file pengujian di samping file utilitasnya (misalnya, `mathUtils.ts` dan `mathUtils.test.ts`). 
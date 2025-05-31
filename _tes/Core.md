Oke, berikut adalah dokumentasi `Core` Handsontable untuk React yang telah diformat dan dirapikan:

-----

# Handsontable React Data Grid - Core API (v15.3.0)

## Deskripsi

Kelas `Handsontable` (dikenal sebagai `Core`) memungkinkan Anda memodifikasi perilaku grid menggunakan metode API publik Handsontable.

Untuk menggunakan metode ini, kaitkan instance `Handsontable` dengan instance komponen `HotTable` Anda menggunakan fitur `ref` React (baca lebih lanjut di halaman [Metode Instance](https://www.google.com/search?q=https://handsontable.com/docs/react-data-grid/api/instance-methods/)).

### Cara Memanggil Metode

```javascript
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// Daftarkan semua modul
registerAllModules();

function MyComponent() {
  const hotTableComponent = useRef(null);
  const options = {
    data: [
      ['', 'Ford', 'Volvo', 'Toyota', 'Honda'],
      ['2021', 10, 11, 12, 13],
      ['2022', 20, 11, 14, 13],
      ['2023', 30, 15, 12, 13]
    ],
    rowHeaders: true,
    colHeaders: true,
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation' // Ganti dengan kunci lisensi Anda
  };

  const updateCell = () => {
    if (hotTableComponent.current && hotTableComponent.current.hotInstance) {
      // Akses instance Handsontable di bawah properti `.current.hotInstance`
      // Panggil metode
      hotTableComponent.current.hotInstance.setDataAtCell(0, 0, 'new value');
    }
  };

  return (
    <div>
      <HotTable
        // Kaitkan komponen `HotTable` Anda dengan instance Handsontable
        ref={hotTableComponent}
        settings={options}
      />
      <button onClick={updateCell}>Update Cell (0,0)</button>
    </div>
  );
}

export default MyComponent;
```

-----

## Members (Properti)

  * `columnIndexMapper` (`IndexMapper`)
      * Instance dari index mapper yang bertanggung jawab mengelola indeks kolom.
      * [Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)
  * `isDestroyed` (`boolean`)
      * Boolean untuk mengetahui apakah Handsontable telah sepenuhnya dihancurkan. Ini diatur ke `true` setelah hook `afterDestroy` dipanggil.
      * [Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)
  * `rowIndexMapper` (`IndexMapper`)
      * Instance dari index mapper yang bertanggung jawab mengelola indeks baris.
      * [Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

-----

## Methods (Metode)

### `addHook(key, callback, [orderIndex])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menambahkan listener ke nama hook yang ditentukan (hanya untuk instance Handsontable ini).

  * **Lihat:** [Hooks\#add](https://www.google.com/search?q=https://handsontable.com/docs/javascript-data-grid/api/hooks/%23add)
  * **Contoh:**
    ```javascript
    hot.addHook('beforeInit', myCallback);
    ```
  * **Parameter:**
      * `key` (`string`): Nama hook (lihat [Hooks](https://handsontable.com/docs/javascript-data-grid/api/hooks/)).
      * `callback` (`function | Array`): Fungsi atau array fungsi.
      * `orderIndex` (`number`, *optional*): Indeks urutan callback. Jika \> 0, callback akan ditambahkan setelah yang lain; jika \< 0, akan ditambahkan sebelum yang lain; jika 0 atau tidak ada, akan ditambahkan di antaranya.

-----

### `addHookOnce(key, callback, [orderIndex])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menambahkan listener ke nama hook yang ditentukan (hanya untuk instance Handsontable ini). Setelah listener dipicu, listener akan dihapus secara otomatis.

  * **Lihat:** [Hooks\#once](https://www.google.com/search?q=https://handsontable.com/docs/javascript-data-grid/api/hooks/%23once)
  * **Contoh:**
    ```javascript
    hot.addHookOnce('beforeInit', myCallback);
    ```
  * **Parameter:**
      * `key` (`string`): Nama hook (lihat [Hooks](https://handsontable.com/docs/javascript-data-grid/api/hooks/)).
      * `callback` (`function | Array`): Fungsi atau array fungsi.
      * `orderIndex` (`number`, *optional*): Indeks urutan callback (sama seperti `addHook`).

-----

### `alter(action, [index], [amount], [source], [keepEmptyRows])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Metode `alter()` memungkinkan Anda mengubah struktur grid dengan menambah atau menghapus baris dan kolom pada posisi yang ditentukan. Jika Anda menggunakan array objek dalam data Anda, tindakan terkait kolom tidak akan berfungsi.

**Tabel Aksi:**

| Aksi                 | Dengan `index`                            | Tanpa `index`                             |
| :------------------- | :---------------------------------------- | :---------------------------------------- |
| `insert_row_above`   | Sisipkan baris di atas `index` baris.   | Sisipkan baris di atas baris pertama.   |
| `insert_row_below`   | Sisipkan baris di bawah `index` baris.  | Sisipkan baris di bawah baris terakhir.   |
| `remove_row`         | Hapus baris, mulai dari `index` baris.  | Hapus baris, mulai dari baris terakhir.   |
| `insert_col_start`   | Sisipkan kolom sebelum `index` kolom. | Sisipkan kolom sebelum kolom pertama. |
| `insert_col_end`     | Sisipkan kolom setelah `index` kolom.  | Sisipkan kolom setelah kolom terakhir.  |
| `remove_col`         | Hapus kolom, mulai dari `index` kolom.  | Hapus kolom, mulai dari kolom terakhir.   |

**Info Tambahan `insert_col_start` & `insert_col_end`:**

  * Perilakunya bergantung pada `layoutDirection` Anda.

  * Jika `index` yang diberikan lebih tinggi dari jumlah kolom aktual, kolom baru disisipkan di sebelah kolom terakhir.

  * **Contoh:**

    ```javascript
    // Di atas baris 10 (indeks visual), sisipkan 1 baris baru
    hot.alter('insert_row_above', 10);

    // Di bawah baris 10 (indeks visual), sisipkan 3 baris baru
    hot.alter('insert_row_below', 10, 3);

    // Arah LTR: Ke kiri kolom 10 (indeks visual), sisipkan 3 kolom baru
    // Arah RTL: Ke kanan kolom 10 (indeks visual), sisipkan 3 kolom baru
    hot.alter('insert_col_start', 10, 3);

    // Arah LTR: Ke kanan kolom 10 (indeks visual), sisipkan 1 kolom baru
    // Arah RTL: Ke kiri kolom 10 (indeks visual), sisipkan 1 kolom baru
    hot.alter('insert_col_end', 10);

    // Hapus 2 baris, mulai dari baris 10 (indeks visual)
    hot.alter('remove_row', 10, 2);

    // Hapus 3 baris mulai dari baris 1, dan 2 baris mulai dari baris 5 (indeks visual)
    hot.alter('remove_row', [[1, 3], [5, 2]]);
    ```

  * **Parameter:**

      * `action` (`string`): Operasi yang tersedia: `'insert_row_above'`, `'insert_row_below'`, `'remove_row'`, `'insert_col_start'`, `'insert_col_end'`, `'remove_col'`.
      * `index` (`number | Array<number>`, *optional*): Indeks visual baris/kolom. Bisa juga berupa array `[[index, amount],...]`.
      * `amount` (`number`, *optional*, default: `1`): Jumlah baris/kolom yang akan disisipkan/dihapus.
      * `source` (`string`, *optional*): Indikator sumber perubahan.
      * `keepEmptyRows` (`boolean`, *optional*): Jika `true`, mencegah penghapusan baris kosong.

-----

### `batch(wrappedOperations)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menggabungkan proses rendering dan penghitungan ulang indeks. Metode ini mengagregasi panggilan API multi-baris ke dalam callback dan menunda proses rendering tabel serta mengagregasi perubahan logika tabel (seperti perubahan indeks) menjadi satu panggilan, setelah itu cache diperbarui. Setelah eksekusi operasi, tabel dirender dan cache diperbarui sekali. Ini meningkatkan performa operasi yang dibungkus.

  * **Sejak:** 8.3.0
  * **Contoh:**
    ```javascript
    hot.batch(() => {
      hot.alter('insert_row_above', 5, 45);
      hot.alter('insert_col_start', 10, 40);
      hot.setDataAtCell(1, 1, 'x');
      hot.setDataAtCell(2, 2, 'c');
      hot.selectCell(0, 0);

      const filters = hot.getPlugin('filters');
      filters.addCondition(2, 'contains', ['3']);
      filters.filter();
      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
      // Tabel akan dirender ulang dan cache akan dihitung ulang sekali setelah callback dieksekusi
    });
    ```
  * **Parameter:**
      * `wrappedOperations` (`function`): Operasi yang digabungkan dibungkus dalam fungsi.
  * **Mengembalikan:** (`*`) - Hasil dari callback `wrappedOperations`.

-----

### `batchExecution(wrappedOperations, [forceFlushChanges])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengagregasi panggilan API multi-baris ke dalam callback dan menunda proses eksekusi tabel. Setelah eksekusi operasi, cache tabel internal dihitung ulang sekali. Ini meningkatkan performa. Tanpa batching, kasus serupa dapat memicu beberapa pembangunan ulang cache tabel.

  * **Sejak:** 8.3.0
  * **Contoh:**
    ```javascript
    hot.batchExecution(() => {
      const filters = hot.getPlugin('filters');
      filters.addCondition(2, 'contains', ['3']);
      filters.filter();
      hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
      // Cache tabel akan dihitung ulang sekali setelah callback dieksekusi
    });
    ```
  * **Parameter:**
      * `wrappedOperations` (`function`): Operasi yang digabungkan dibungkus dalam fungsi.
      * `forceFlushChanges` (`boolean`, *optional*, default: `false`): Jika `true`, cache data internal tabel dihitung ulang setelah eksekusi operasi yang digabungkan. Untuk panggilan bersarang, mungkin diinginkan untuk menghitung ulang tabel setelah setiap batch.
  * **Mengembalikan:** (`*`) - Hasil dari callback `wrappedOperations`.

-----

### `batchRender(wrappedOperations)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengagregasi panggilan API multi-baris ke dalam callback dan menunda proses rendering tabel. Setelah eksekusi operasi, tabel dirender sekali. Ini meningkatkan performa. Tanpa batching, kasus serupa dapat memicu beberapa panggilan render tabel.

  * **Sejak:** 8.3.0
  * **Contoh:**
    ```javascript
    hot.batchRender(() => {
      hot.alter('insert_row_above', 5, 45);
      hot.alter('insert_col_start', 10, 40);
      hot.setDataAtCell(1, 1, 'John');
      hot.setDataAtCell(2, 2, 'Mark');
      hot.selectCell(0, 0);
      // Tabel akan dirender sekali setelah callback dieksekusi
    });
    ```
  * **Parameter:**
      * `wrappedOperations` (`function`): Operasi yang digabungkan dibungkus dalam fungsi.
  * **Mengembalikan:** (`*`) - Hasil dari callback `wrappedOperations`.

-----

### `clear()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menghapus data dari tabel (pengaturan tabel tetap utuh).

-----

### `clearUndo()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Sama seperti `UndoRedo#clear`.

-----

### `colToProp(column)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan nama properti yang sesuai dengan indeks kolom yang diberikan. Jika sumber data adalah array dari array, ini mengembalikan indeks kolom.

  * **Parameter:**
      * `column` (`number`): Indeks kolom visual.
  * **Mengembalikan:** (`string | number`) - Properti kolom atau indeks kolom fisik.

-----

### `countColHeaders()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan jumlah header kolom yang dirender.

  * **Sejak:** 14.0.0
  * **Mengembalikan:** (`number`) - Jumlah header kolom.

-----

### `countCols()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan jumlah total kolom yang terlihat di tabel.

  * **Mengembalikan:** (`number`) - Jumlah total kolom.

-----

### `countEmptyCols([ending])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan jumlah kolom kosong. Jika parameter opsional `ending` adalah `true`, mengembalikan jumlah kolom kosong di tepi kanan tabel.

  * **Parameter:**
      * `ending` (`boolean`, *optional*, default: `false`): Jika `true`, hanya menghitung kolom kosong di akhir baris sumber data.
  * **Mengembalikan:** (`number`) - Jumlah kolom kosong.

-----

### `countEmptyRows([ending])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan jumlah baris kosong. Jika parameter opsional `ending` adalah `true`, mengembalikan jumlah baris kosong di bagian bawah tabel.

  * **Parameter:**
      * `ending` (`boolean`, *optional*, default: `false`): Jika `true`, hanya menghitung baris kosong di akhir sumber data.
  * **Mengembalikan:** (`number`) - Jumlah baris kosong.

-----

### `countRenderedCols()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan jumlah kolom yang dirender termasuk kolom yang sebagian atau seluruhnya dirender di luar viewport tabel.

  * **Mengembalikan:** (`number`) - Mengembalikan -1 jika tabel tidak terlihat.

-----

### `countRenderedRows()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan jumlah baris yang dirender termasuk baris yang sebagian atau seluruhnya dirender di luar viewport tabel.

  * **Mengembalikan:** (`number`) - Mengembalikan -1 jika tabel tidak terlihat.

-----

### `countRowHeaders()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan jumlah header baris yang dirender.

  * **Sejak:** 14.0.0
  * **Mengembalikan:** (`number`) - Jumlah header baris.

-----

### `countRows()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan jumlah total baris visual di tabel.

  * **Mengembalikan:** (`number`) - Jumlah total baris.

-----

### `countSourceCols()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan jumlah total kolom dalam sumber data.

  * **Mengembalikan:** (`number`) - Jumlah total kolom.

-----

### `countSourceRows()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan jumlah total baris dalam sumber data.

  * **Mengembalikan:** (`number`) - Jumlah total baris.

-----

### `countVisibleCols()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan jumlah kolom yang dirender yang hanya terlihat di viewport tabel. Kolom yang terlihat sebagian tidak dihitung.

  * **Mengembalikan:** (`number`) - Jumlah kolom yang terlihat atau -1.

-----

### `countVisibleRows()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan jumlah baris yang dirender yang hanya terlihat di viewport tabel. Baris yang terlihat sebagian tidak dihitung.

  * **Mengembalikan:** (`number`) - Jumlah baris yang terlihat atau -1.

-----

### `deselectCell()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Membatalkan pilihan sel saat ini di tabel.

-----

### `destroy()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menghapus tabel dari DOM dan menghancurkan instance Handsontable.

  * **Memicu:** `Hooks#event:afterDestroy`

-----

### `destroyEditor([revertOriginal], [prepareEditorIfNeeded])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menghancurkan editor saat ini, merender tabel, dan menyiapkan editor sel yang baru dipilih.

  * **Parameter:**
      * `revertOriginal` (`boolean`, *optional*, default: `false`): Jika `true`, nilai sebelumnya akan dipulihkan. Jika tidak, nilai yang diedit akan disimpan.
      * `prepareEditorIfNeeded` (`boolean`, *optional*, default: `true`): Jika `true`, editor di bawah sel yang dipilih akan disiapkan untuk dibuka.

-----

### `emptySelectedCells([source])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menghapus konten dari sel yang telah dipilih di tabel.

  * **Sejak:** 0.36.0
  * **Parameter:**
      * `source` (`string`, *optional*): String yang mengidentifikasi bagaimana perubahan ini akan dijelaskan dalam array `changes` (berguna dalam callback `afterChange` atau `beforeChange`). Diatur ke `'edit'` jika dibiarkan kosong.

-----

### `getActiveEditor()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan instance kelas editor aktif.

  * **Mengembalikan:** (`BaseEditor`) - Instance editor aktif.

-----

### `getCell(row, column, [topmost])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan elemen TD untuk argumen baris dan kolom yang diberikan, jika dirender di layar. Mengembalikan `null` jika TD tidak dirender di layar.

  * **Parameter:**
      * `row` (`number`): Indeks baris visual.
      * `column` (`number`): Indeks kolom visual.
      * `topmost` (`boolean`, *optional*, default: `false`): Jika `true`, mengembalikan elemen TD dari overlay paling atas.
  * **Mengembalikan:** (`HTMLTableCellElement | null`) - Elemen TD sel.

-----

### `getCellEditor(rowOrMeta, column)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan kelas editor sel berdasarkan argumen baris dan kolom yang diberikan.

  * **Contoh:**
    ```javascript
    // Dapatkan kelas editor sel menggunakan koordinat `row` dan `column`.
    hot.getCellEditor(1, 1);
    // Dapatkan kelas editor sel menggunakan objek meta sel.
    hot.getCellEditor(hot.getCellMeta(1, 1));
    ```
  * **Parameter:**
      * `rowOrMeta` (`number | object`): Indeks baris visual atau objek meta sel (lihat `Core#getCellMeta`).
      * `column` (`number`): Indeks kolom visual.
  * **Mengembalikan:** (`function | boolean`) - Mengembalikan kelas editor atau `false` jika editor sel dinonaktifkan.

-----

### `getCellMeta(row, column, options)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan objek properti sel untuk koordinat baris dan kolom yang diberikan.

  * **Memicu:** `Hooks#event:beforeGetCellMeta`, `Hooks#event:afterGetCellMeta`
  * **Parameter:**
      * `row` (`number`): Indeks baris visual.
      * `column` (`number`): Indeks kolom visual.
      * `options` (`object`): Opsi eksekusi untuk metode `getCellMeta`.
          * `options.skipMetaExtension` (`boolean`, *optional*, default: `false`): Jika `true`, melewatkan perluasan objek meta sel. Ini berarti, fungsi `cells`, serta hook `afterGetCellMeta` dan `beforeGetCellMeta`, tidak akan dipanggil.
  * **Mengembalikan:** (`object`) - Objek properti sel.

-----

### `getCellMetaAtRow(row)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan array objek meta sel untuk indeks baris fisik yang ditentukan.

  * **Parameter:**
      * `row` (`number`): Indeks baris fisik.
  * **Mengembalikan:** (`Array`) - Array objek meta sel.

-----

### `getCellRenderer(rowOrMeta, column)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan fungsi renderer sel berdasarkan argumen baris dan kolom yang diberikan.

  * **Contoh:**
    ```javascript
    // Dapatkan renderer sel menggunakan koordinat `row` dan `column`.
    hot.getCellRenderer(1, 1);
    // Dapatkan renderer sel menggunakan objek meta sel.
    hot.getCellRenderer(hot.getCellMeta(1, 1));
    ```
  * **Parameter:**
      * `rowOrMeta` (`number | object`): Indeks baris visual atau objek meta sel (lihat `Core#getCellMeta`).
      * `column` (`number`): Indeks kolom visual.
  * **Mengembalikan:** (`function`) - Fungsi renderer.

-----

### `getCellsMeta()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Dapatkan semua pengaturan meta sel yang setidaknya pernah dibuat di tabel (sesuai urutan inisialisasi sel).

  * **Mengembalikan:** (`Array`) - Array instance objek `ColumnSettings`.

-----

### `getCellValidator(rowOrMeta, column)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan validator sel berdasarkan baris dan kolom.

  * **Contoh:**
    ```javascript
    // Dapatkan validator sel menggunakan koordinat `row` dan `column`.
    hot.getCellValidator(1, 1);
    // Dapatkan validator sel menggunakan objek meta sel.
    hot.getCellValidator(hot.getCellMeta(1, 1));
    ```
  * **Parameter:**
      * `rowOrMeta` (`number | object`): Indeks baris visual atau objek meta sel (lihat `Core#getCellMeta`).
      * `column` (`number`): Indeks kolom visual.
  * **Mengembalikan:** (`function | RegExp | undefined`) - Fungsi validator.

-----

### `getColHeader([column], [headerLevel])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mendapatkan nilai header kolom (jika header kolom diaktifkan).

  * Panggil `getColHeader()` tanpa argumen untuk mendapatkan array nilai semua header kolom paling bawah.

  * Gunakan parameter `column` untuk mendapatkan nilai header paling bawah dari kolom tertentu.

  * Gunakan parameter `column` dan `headerLevel` untuk mendapatkan nilai header level tertentu dari kolom tertentu.

  * **Baca lebih lanjut:** [Grup Kolom](https://handsontable.com/docs/javascript-data-grid/column-groups/), [Opsi colHeaders](https://www.google.com/search?q=https://handsontable.com/docs/javascript-data-grid/options/%23colheaders), [Salin dengan header](https://www.google.com/search?q=https://handsontable.com/docs/javascript-data-grid/copy-paste/%23copy-with-headers)

  * **Contoh:**

    ```javascript
    // Dapatkan konten semua header kolom paling bawah
    hot.getColHeader();

    // Dapatkan konten header paling bawah dari kolom tertentu (indeks visual 5)
    hot.getColHeader(5);

    // Dapatkan konten header kolom spesifik pada level tertentu (kolom 5, level -2 dari bawah)
    hot.getColHeader(5, -2);
    ```

  * **Memicu:** `Hooks#event:modifyColHeader`, `Hooks#event:modifyColumnHeaderValue`

  * **Parameter:**

      * `column` (`number`, *optional*): Indeks kolom visual.
      * `headerLevel` (`number`, *optional*, default: `-1`): (Sejak 12.3.0) Indeks level header. Menerima nilai positif (0 hingga n) dan negatif (-1 hingga -n). Untuk nilai positif, 0 menunjuk ke header paling atas. Untuk nilai negatif, -1 menunjuk ke header paling bawah.

  * **Mengembalikan:** (`Array | string | number`) - Nilai header kolom.

-----

### `getColumnMeta(column)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan informasi meta untuk kolom yang disediakan.

  * **Sejak:** 14.5.0
  * **Parameter:**
      * `column` (`number`): Indeks kolom visual.
  * **Mengembalikan:** (`object`) - Objek meta kolom.

-----

### `getColWidth(column, [source])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan lebar kolom yang diminta.

  * **Memicu:** `Hooks#event:modifyColWidth`
  * **Parameter:**
      * `column` (`number`): Indeks kolom visual.
      * `source` (`string`, *optional*): Sumber panggilan.
  * **Mengembalikan:** (`number`) - Lebar kolom.

-----

### `getCoords(element)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan koordinat sel, yang disediakan sebagai elemen sel tabel HTML.

  * **Contoh:**
    ```javascript
    hot.getCoords(hot.getCell(1, 1));
    // Mengembalikan instance objek CellCoords dengan properti row: 1 dan col: 1.
    ```
  * **Parameter:**
      * `element` (`HTMLTableCellElement`): Elemen HTML yang mewakili sel.
  * **Mengembalikan:** (`CellCoords | null`) - Objek koordinat visual.

-----

### `getCopyableData(row, column)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan nilai data yang dapat disalin pada indeks baris dan kolom yang ditentukan.

  * **Parameter:**
      * `row` (`number`): Indeks baris visual.
      * `column` (`number`): Indeks kolom visual.
  * **Mengembalikan:** (`string`) - Data yang dapat disalin.

-----

### `getCopyableText(startRow, startCol, endRow, endCol)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan nilai string dari rentang yang dipilih. Setiap kolom dipisahkan oleh tab, setiap baris dipisahkan oleh karakter baris baru.

  * **Parameter:**
      * `startRow` (`number`): Indeks baris visual awal.
      * `startCol` (`number`): Indeks kolom visual awal.
      * `endRow` (`number`): Indeks baris visual akhir.
      * `endCol` (`number`): Indeks kolom visual akhir.
  * **Mengembalikan:** (`string`) - Teks yang dapat disalin dari rentang.

-----

### `getCurrentThemeName()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mendapatkan nama tema yang sedang digunakan.

  * **Sejak:** 15.0.0
  * **Mengembalikan:** (`string | undefined`) - Nama tema yang sedang digunakan.

-----

### `getData([row], [column], [row2], [column2])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan objek data saat ini (yang sama dengan yang dilewatkan oleh opsi konfigurasi `data` atau metode `loadData`, kecuali jika beberapa modifikasi telah diterapkan (misalnya, urutan baris/kolom diubah, beberapa baris/kolom dilewati). Jika demikian - gunakan metode `Core#getSourceData`). Secara opsional, Anda dapat memberikan rentang sel dengan mendefinisikan `row`, `column`, `row2`, `column2` untuk mendapatkan hanya sebagian dari data tabel.

  * **Contoh:**
    ```javascript
    // Dapatkan semua data (sesuai urutan render di tabel).
    hot.getData();
    // Dapatkan fragmen data (dari kiri atas 0, 0 ke kanan bawah 3, 3).
    hot.getData(0, 0, 3, 3); // Koreksi: getData(3,3) saja tidak cukup
    // Dapatkan fragmen data (dari kiri atas 2, 1 ke kanan bawah 3, 3).
    hot.getData(2, 1, 3, 3);
    ```
  * **Parameter:**
      * `row` (`number`, *optional*): Indeks baris visual awal.
      * `column` (`number`, *optional*): Indeks kolom visual awal.
      * `row2` (`number`, *optional*): Indeks baris visual akhir.
      * `column2` (`number`, *optional*): Indeks kolom visual akhir.
  * **Mengembalikan:** (`Array<Array>`) - Array dengan data.

-----

### `getDataAtCell(row, column)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan nilai sel pada `row`, `column`. Catatan: Jika data diurutkan ulang, diurutkan, atau dipangkas, urutan yang terlihat saat ini akan digunakan.

  * **Parameter:**
      * `row` (`number`): Indeks baris visual.
      * `column` (`number`): Indeks kolom visual.
  * **Mengembalikan:** (`*`) - Data pada sel.

-----

### `getDataAtCol(column)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan array nilai kolom dari sumber data. Catatan: Jika kolom diurutkan ulang atau diurutkan, urutan yang terlihat saat ini akan digunakan.

  * **Parameter:**
      * `column` (`number`): Indeks kolom visual.
  * **Mengembalikan:** (`Array`) - Array nilai sel.

-----

### `getDataAtProp(prop)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Dengan nama properti objek (misalnya `'first.name'` atau `'0'`), mengembalikan array nilai kolom dari data tabel. Anda juga dapat memberikan indeks kolom sebagai argumen pertama.

  * **Parameter:**
      * `prop` (`string | number`): Nama properti atau indeks kolom fisik.
  * **Mengembalikan:** (`Array`) - Array nilai sel.

-----

### `getDataAtRow(row)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan satu baris data. Catatan: Jika baris diurutkan ulang, diurutkan, atau dipangkas, urutan yang terlihat saat ini akan digunakan.

  * **Parameter:**
      * `row` (`number`): Indeks baris visual.
  * **Mengembalikan:** (`Array`) - Array data sel baris.

-----

### `getDataAtRowProp(row, prop)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan nilai pada indeks baris visual dan properti. Catatan: Jika data diurutkan ulang, diurutkan, atau dipangkas, urutan yang terlihat saat ini akan digunakan.

  * **Parameter:**
      * `row` (`number`): Indeks baris visual.
      * `prop` (`string`): Nama properti.
  * **Mengembalikan:** (`*`) - Nilai sel.

-----

### `getDataType(rowFrom, columnFrom, rowTo, columnTo)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan tipe data yang ditentukan dalam pengaturan Handsontable di bawah kunci `type` ([Options\#type](https://www.google.com/search?q=https://handsontable.com/docs/javascript-data-grid/options/%23type)). Jika ada sel dengan tipe berbeda dalam rentang yang dipilih, ini mengembalikan `'mixed'`. Catatan: Jika data diurutkan ulang, diurutkan, atau dipangkas, urutan yang terlihat saat ini akan digunakan.

  * **Parameter:**
      * `rowFrom` (`number`): Indeks baris visual awal.
      * `columnFrom` (`number`): Indeks kolom visual awal.
      * `rowTo` (`number`): Indeks baris visual akhir.
      * `columnTo` (`number`): Indeks kolom visual akhir.
  * **Mengembalikan:** (`string`) - Tipe sel (misalnya: `'mixed'`, `'text'`, `'numeric'`, `'autocomplete'`).

-----

### `getDirectionFactor()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan 1 untuk LTR; -1 untuk RTL. Berguna untuk perhitungan.

  * **Sejak:** 12.0.0
  * **Mengembalikan:** (`number`) - 1 untuk LTR; -1 untuk RTL.

-----

### `getFirstFullyVisibleColumn()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan kolom pertama yang sepenuhnya terlihat di viewport tabel. Ketika tabel memiliki overlay, metode mengembalikan baris pertama dari tabel utama yang tidak tumpang tindih oleh overlay.

  * **Sejak:** 14.6.0
  * **Mengembalikan:** (`number | null`) - Indeks kolom atau null.

-----

### `getFirstFullyVisibleRow()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan baris pertama yang sepenuhnya terlihat di viewport tabel. Ketika tabel memiliki overlay, metode mengembalikan baris pertama dari tabel utama yang tidak tumpang tindih oleh overlay.

  * **Sejak:** 14.6.0
  * **Mengembalikan:** (`number | null`) - Indeks baris atau null.

-----

### `getFirstPartiallyVisibleColumn()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan kolom pertama yang terlihat sebagian di viewport tabel.

  * **Sejak:** 14.6.0
  * **Mengembalikan:** (`number | null`) - Indeks kolom atau null.

-----

### `getFirstPartiallyVisibleRow()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan baris pertama yang terlihat sebagian di viewport tabel.

  * **Sejak:** 14.6.0
  * **Mengembalikan:** (`number | null`) - Indeks baris atau null.

-----

### `getFirstRenderedVisibleColumn()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan kolom pertama yang dirender di DOM (biasanya, tidak terlihat di viewport tabel).

  * **Sejak:** 14.6.0
  * **Mengembalikan:** (`number | null`) - Indeks kolom atau null.

-----

### `getFirstRenderedVisibleRow()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan baris pertama yang dirender di DOM (biasanya, tidak terlihat di viewport tabel).

  * **Sejak:** 14.6.0
  * **Mengembalikan:** (`number | null`) - Indeks baris atau null.

-----

### `getFocusManager()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan Focus Manager yang bertanggung jawab mengelola fokus browser di tabel.

  * **Sejak:** 14.0.0
  * **Mengembalikan:** (`FocusManager`) - Instance FocusManager.

-----

### `getInstance()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan instance Handsontable.

  * **Mengembalikan:** (`Handsontable`) - Instance Handsontable.

-----

### `getLastFullyVisibleColumn()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan kolom terakhir yang sepenuhnya terlihat di viewport tabel.

  * **Sejak:** 14.6.0
  * **Mengembalikan:** (`number | null`) - Indeks kolom atau null.

-----

### `getLastFullyVisibleRow()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan baris terakhir yang sepenuhnya terlihat di viewport tabel.

  * **Sejak:** 14.6.0
  * **Mengembalikan:** (`number | null`) - Indeks baris atau null.

-----

### `getLastPartiallyVisibleColumn()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan kolom terakhir yang terlihat sebagian di viewport tabel.

  * **Sejak:** 14.6.0
  * **Mengembalikan:** (`number | null`) - Indeks kolom atau null.

-----

### `getLastPartiallyVisibleRow()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan baris terakhir yang terlihat sebagian di viewport tabel.

  * **Sejak:** 14.6.0
  * **Mengembalikan:** (`number | null`) - Indeks baris atau null.

-----

### `getLastRenderedVisibleColumn()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan kolom terakhir yang dirender di DOM (biasanya, tidak terlihat di viewport tabel).

  * **Sejak:** 14.6.0
  * **Mengembalikan:** (`number | null`) - Indeks kolom atau null.

-----

### `getLastRenderedVisibleRow()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan baris terakhir yang dirender di DOM (biasanya, tidak terlihat di viewport tabel).

  * **Sejak:** 14.6.0
  * **Mengembalikan:** (`number | null`) - Indeks baris atau null.

-----

### `getPlugin(pluginName)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan instance plugin berdasarkan nama yang diberikan.

  * **Parameter:**
      * `pluginName` (`string`): Nama plugin.
  * **Mengembalikan:** (`BasePlugin | undefined`) - Instance plugin atau `undefined` jika tidak ada plugin.

-----

### `getRowHeader([row])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan array nilai header baris (jika diaktifkan). Jika parameter `row` diberikan, mengembalikan header baris yang diberikan sebagai string.

  * **Memicu:** `Hooks#event:modifyRowHeader`
  * **Parameter:**
      * `row` (`number`, *optional*): Indeks baris visual.
  * **Mengembalikan:** (`Array | string | number`) - Array nilai header / nilai header tunggal.

-----

### `getRowHeight(row, [source])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan tinggi baris, seperti yang dikenali oleh Handsontable. Bergantung pada konfigurasi Anda, metode ini mengembalikan (dalam urutan prioritas):

1.  Tinggi baris yang diatur oleh plugin `ManualRowResize` (jika plugin diaktifkan).
2.  Tinggi baris yang diatur oleh opsi konfigurasi `rowHeights` (jika opsi diatur).
3.  Tinggi baris seperti yang diukur di DOM oleh plugin `AutoRowSize` (jika plugin diaktifkan).
4.  `undefined`, jika `ManualRowResize`, `rowHeights`, maupun `AutoRowSize` tidak digunakan.
    Tinggi yang dikembalikan mencakup 1 piksel batas bawah baris. Perhatikan bahwa metode ini berbeda dari metode `getRowHeight()` dari plugin `AutoRowSize`.

<!-- end list -->

  * **Memicu:** `Hooks#event:modifyRowHeight`
  * **Parameter:**
      * `row` (`number`): Indeks baris visual.
      * `source` (`string`, *optional*): Sumber panggilan.
  * **Mengembalikan:** (`number | undefined`) - Tinggi baris yang ditentukan, dalam piksel.

-----

### `getSchema()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan skema yang disediakan oleh pengaturan konstruktor. Jika tidak ada, maka mengembalikan skema berdasarkan struktur data di baris pertama.

  * **Mengembalikan:** (`object`) - Objek skema.

-----

### `getSelected()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan indeks sel yang saat ini dipilih sebagai array dari array `[[startRow, startCol, endRow, endCol],...]`. `startRow` dan `startCol` adalah koordinat sel aktif (tempat pemilihan dimulai). Versi 0.36.0 menambahkan fitur pemilihan non-berurutan. Sejak versi ini, metode mengembalikan array dari array. Untuk mengumpulkan koordinat area yang saat ini dipilih (seperti yang dilakukan sebelumnya oleh metode ini), Anda perlu menggunakan `getSelectedLast`.

  * **Mengembalikan:** (`Array<Array> | undefined`) - Array dari array koordinat pemilihan.

-----

### `getSelectedLast()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan koordinat terakhir yang diterapkan ke tabel sebagai array `[startRow, startCol, endRow, endCol]`.

  * **Sejak:** 0.36.0
  * **Mengembalikan:** (`Array | undefined`) - Array koordinat pemilihan.

-----

### `getSelectedRange()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan pilihan saat ini sebagai array objek `CellRange`. Versi 0.36.0 menambahkan fitur pemilihan non-berurutan. Sejak versi ini, metode mengembalikan array dari array. Untuk mengumpulkan koordinat area yang saat ini dipilih (seperti yang dilakukan sebelumnya oleh metode ini), Anda perlu menggunakan `getSelectedRangeLast`.

  * **Mengembalikan:** (`Array<CellRange> | undefined`) - Objek rentang yang dipilih atau `undefined` jika tidak ada pilihan.

-----

### `getSelectedRangeLast()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan koordinat terakhir yang diterapkan ke tabel sebagai objek `CellRange`.

  * **Sejak:** 0.36.0
  * **Mengembalikan:** (`CellRange | undefined`) - Objek rentang yang dipilih atau `undefined` jika tidak ada pilihan.

-----

### `getSettings()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan objek pengaturan.

  * **Mengembalikan:** (`TableMeta`) - Objek yang berisi pengaturan tabel saat ini.

-----

### `getShortcutManager()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan instance manajer yang bertanggung jawab menangani pintasan yang disimpan dalam beberapa konteks. Ini menjalankan tindakan setelah menekan kombinasi tombol di instance Handsontable aktif.

  * **Sejak:** 12.0.0
  * **Mengembalikan:** (`ShortcutManager`) - Instance ShortcutManager.

-----

### `getSourceData([row], [column], [row2], [column2])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan klon objek data sumber. Secara opsional, Anda dapat memberikan rentang sel dengan menggunakan argumen `row`, `column`, `row2`, `column2`, untuk mendapatkan hanya sebagian dari data tabel. Catatan: Metode ini tidak berpartisipasi dalam transformasi data. Jika data visual tabel diurutkan ulang, diurutkan, atau dipangkas, hanya indeks fisik yang benar. Catatan: Metode ini mungkin mengembalikan nilai yang salah untuk sel yang berisi rumus. Ini karena `getSourceData()` beroperasi pada data sumber (indeks fisik), sedangkan rumus beroperasi pada data visual (indeks visual).

  * **Parameter:**
      * `row` (`number`, *optional*): Indeks baris fisik awal.
      * `column` (`number`, *optional*): Indeks kolom fisik awal (atau indeks visual, jika tipe data adalah array objek).
      * `row2` (`number`, *optional*): Indeks baris fisik akhir.
      * `column2` (`number`, *optional*): Indeks kolom fisik akhir (atau indeks visual, jika tipe data adalah array objek).
  * **Mengembalikan:** (`Array<Array> | Array<object>`) - Data tabel.

-----

### `getSourceDataArray([row], [column], [row2], [column2])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan objek data sumber sebagai format array dari array meskipun data sumber disediakan dalam format lain. Secara opsional, Anda dapat memberikan rentang sel dengan menggunakan argumen `row`, `column`, `row2`, `column2`, untuk mendapatkan hanya sebagian dari data tabel. Catatan: Metode ini tidak berpartisipasi dalam transformasi data. Jika data visual tabel diurutkan ulang, diurutkan, atau dipangkas, hanya indeks fisik yang benar.

  * **Parameter:**
      * `row` (`number`, *optional*): Indeks baris fisik awal.
      * `column` (`number`, *optional*): Indeks kolom fisik awal (atau indeks visual, jika tipe data adalah array objek).
      * `row2` (`number`, *optional*): Indeks baris fisik akhir.
      * `column2` (`number`, *optional*): Indeks kolom fisik akhir (atau indeks visual, jika tipe data adalah array objek).
  * **Mengembalikan:** (`Array`) - Array dari array.

-----

### `getSourceDataAtCell(row, column)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan satu nilai dari sumber data.

  * **Parameter:**
      * `row` (`number`): Indeks baris fisik.
      * `column` (`number`): Indeks kolom visual.
  * **Mengembalikan:** (`*`) - Data sel.

-----

### `getSourceDataAtCol(column)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan array nilai kolom dari sumber data.

  * **Parameter:**
      * `column` (`number`): Indeks kolom visual.
  * **Mengembalikan:** (`Array`) - Array nilai sel kolom.

-----

### `getSourceDataAtRow(row)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan satu baris data (array atau objek, tergantung format data yang Anda gunakan). Catatan: Metode ini tidak berpartisipasi dalam transformasi data. Jika data visual tabel diurutkan ulang, diurutkan, atau dipangkas, hanya indeks fisik yang benar.

  * **Parameter:**
      * `row` (`number`): Indeks baris fisik.
  * **Mengembalikan:** (`Array | object`) - Satu baris data.

-----

### `getTranslatedPhrase(dictionaryKey, extraArguments)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Dapatkan frasa bahasa untuk kunci kamus yang ditentukan.

  * **Sejak:** 0.35.0
  * **Parameter:**
      * `dictionaryKey` (`string`): Konstanta yang merupakan kunci kamus.
      * `extraArguments` (`*`): Argumen yang akan ditangani oleh formatter.
  * **Mengembalikan:** (`string`) - Frasa yang diterjemahkan.

-----

### `getValue()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mendapatkan nilai sel yang sedang difokuskan. Untuk header kolom dan header baris, mengembalikan `null`.

  * **Mengembalikan:** (`*`) - Nilai sel yang difokuskan.

-----

### `hasColHeaders()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan informasi apakah tabel ini dikonfigurasi untuk menampilkan header kolom.

  * **Mengembalikan:** (`boolean`) - `true` jika instance mengaktifkan header kolom, `false` jika tidak.

-----

### `hasHook(key)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Memeriksa apakah untuk nama hook yang ditentukan ada listener yang ditambahkan (hanya untuk instance Handsontable ini). Semua hook yang tersedia dapat Anda temukan di [Hooks](https://handsontable.com/docs/javascript-data-grid/api/hooks/).

  * **Lihat:** [Hooks\#has](https://www.google.com/search?q=https://handsontable.com/docs/javascript-data-grid/api/hooks/%23has)
  * **Contoh:**
    ```javascript
    const hasBeforeInitListeners = hot.hasHook('beforeInit');
    ```
  * **Parameter:**
      * `key` (`string`): Nama hook.
  * **Mengembalikan:** (`boolean`) - `true` jika hook memiliki listener.

-----

### `hasRowHeaders()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan informasi apakah tabel ini dikonfigurasi untuk menampilkan header baris.

  * **Mengembalikan:** (`boolean`) - `true` jika instance mengaktifkan header baris, `false` jika tidak.

-----

### `isColumnModificationAllowed()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Memeriksa apakah format data dan opsi konfigurasi Anda memungkinkan perubahan jumlah kolom. Mengembalikan `false` ketika data Anda adalah array objek, atau ketika Anda menggunakan opsi `columns`. Jika tidak, mengembalikan `true`.

  * **Mengembalikan:** (`boolean`) - `true` jika modifikasi kolom diizinkan.

-----

### `isEmptyCol(column)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Memeriksa apakah semua sel dalam kolom yang dideklarasikan oleh argumen `column` kosong.

  * **Parameter:**
      * `column` (`number`): Indeks kolom.
  * **Mengembalikan:** (`boolean`) - `true` jika kolom pada `col` yang diberikan kosong, `false` jika tidak.

-----

### `isEmptyRow(row)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Memeriksa apakah semua sel dalam baris yang dideklarasikan oleh argumen `row` kosong.

  * **Parameter:**
      * `row` (`number`): Indeks baris visual.
  * **Mengembalikan:** (`boolean`) - `true` jika baris pada `row` yang diberikan kosong, `false` jika tidak.

-----

### `isExecutionSuspended()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Memeriksa apakah proses penghitungan ulang indeks tabel ditangguhkan. Lihat penjelasan di `Core#suspendExecution`.

  * **Sejak:** 8.3.0
  * **Mengembalikan:** (`boolean`) - `true` jika eksekusi ditangguhkan.

-----

### `isListening()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan `true` jika instance Handsontable saat ini mendengarkan input keyboard pada body dokumen.

  * **Mengembalikan:** (`boolean`) - `true` jika instance mendengarkan, `false` jika tidak.

-----

### `isLtr()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Memeriksa apakah grid dirender menggunakan arah tata letak kiri-ke-kanan.

  * **Sejak:** 12.0.0
  * **Mengembalikan:** (`boolean`) - `true` jika LTR.

-----

### `isRedoAvailable()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Sama seperti `UndoRedo#isRedoAvailable`.

  * **Mengembalikan:** (`boolean`) - `true` jika redo tersedia.

-----

### `isRenderSuspended()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Memeriksa apakah proses rendering tabel ditangguhkan. Lihat penjelasan di `Core#suspendRender`.

  * **Sejak:** 8.3.0
  * **Mengembalikan:** (`boolean`) - `true` jika render ditangguhkan.

-----

### `isRtl()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Memeriksa apakah grid dirender menggunakan arah tata letak kanan-ke-kiri.

  * **Sejak:** 12.0.0
  * **Mengembalikan:** (`boolean`) - `true` jika RTL.

-----

### `isUndoAvailable()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Sama seperti `UndoRedo#isUndoAvailable`.

  * **Mengembalikan:** (`boolean`) - `true` jika undo tersedia.

-----

### `listen()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mendengarkan input keyboard pada body dokumen. Ini memungkinkan Handsontable menangkap peristiwa keyboard dan merespons dengan cara yang benar.

  * **Memicu:** `Hooks#event:afterListen`

-----

### `loadData(data, [source])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Metode `loadData()` menggantikan data Handsontable dengan dataset baru. Selain itu, `loadData()`:

  * Mereset status sel (misalnya, format sel dan status `readOnly` sel)

  * Mereset status baris (misalnya, urutan baris)

  * Mereset status kolom (misalnya, urutan kolom)
    Untuk mengganti data Handsontable tanpa mereset status, gunakan metode `updateData()`.

  * **Baca lebih lanjut:** [Mengikat ke data](https://handsontable.com/docs/javascript-data-grid/binding-to-data/), [Menyimpan data](https://handsontable.com/docs/javascript-data-grid/saving-data/)

  * **Memicu:** `Hooks#event:beforeLoadData`, `Hooks#event:afterLoadData`, `Hooks#event:afterChange`

  * **Parameter:**

      * `data` (`Array`): Array dari array, atau array objek, yang berisi data Handsontable.
      * `source` (`string`, *optional*): Sumber panggilan `loadData()`.

-----

### `populateFromArray(row, column, input, [endRow], [endCol], [source], [method])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengisi sel pada posisi dengan array input 2D (misalnya `[[1, 2], [3, 4]]`). Gunakan `endRow`, `endCol` ketika Anda ingin memotong input ketika baris tertentu tercapai. Metode `populateFromArray()` tidak dapat mengubah sel `readOnly`. Argumen `method` opsional memiliki efek yang sama dengan opsi `pasteMode` ([Options\#pasteMode](https://www.google.com/search?q=https://handsontable.com/docs/javascript-data-grid/options/%23pastemode)).

  * **Parameter:**
      * `row` (`number`): Indeks baris visual awal.
      * `column` (`number`): Indeks kolom visual awal.
      * `input` (`Array`): Array 2D.
      * `endRow` (`number`, *optional*): Indeks baris visual akhir (gunakan ketika Anda ingin memotong input).
      * `endCol` (`number`, *optional*): Indeks kolom visual akhir (gunakan ketika Anda ingin memotong input).
      * `source` (`string`, *optional*, default: `"populateFromArray"`): Digunakan untuk mengidentifikasi panggilan ini dalam event yang dihasilkan (`beforeChange`, `afterChange`).
      * `method` (`string`, *optional*, default: `"overwrite"`): Metode pengisian, nilai yang mungkin: `'shift_down'`, `'shift_right'`, `'overwrite'`.
  * **Mengembalikan:** (`object | undefined`) - Elemen TD terakhir di area yang ditempel (hanya jika ada sel yang diubah).

-----

### `propToCol(prop)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengembalikan indeks kolom yang sesuai dengan properti yang diberikan.

  * **Parameter:**
      * `prop` (`string | number`): Nama properti atau indeks kolom fisik.
  * **Mengembalikan:** (`number`) - Indeks kolom visual.

-----

### `redo()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Sama seperti `UndoRedo#redo`.

-----

### `refreshDimensions()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Memperbarui dimensi tabel. Metode ini membandingkan dimensi sebelumnya dengan yang sekarang dan memperbaruinya sesuai.

  * **Memicu:** `Hooks#event:beforeRefreshDimensions`, `Hooks#event:afterRefreshDimensions`

-----

### `removeCellMeta(row, column, key)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menghapus properti yang ditentukan oleh argumen `key` dari objek meta sel untuk koordinat baris dan kolom yang diberikan.

  * **Memicu:** `Hooks#event:beforeRemoveCellMeta`, `Hooks#event:afterRemoveCellMeta`
  * **Parameter:**
      * `row` (`number`): Indeks baris visual.
      * `column` (`number`): Indeks kolom visual.
      * `key` (`string`): Nama properti.

-----

### `removeHook(key, callback)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menghapus listener hook yang sebelumnya didaftarkan dengan `Core#addHook`.

  * **Lihat:** [Hooks\#remove](https://www.google.com/search?q=https://handsontable.com/docs/javascript-data-grid/api/hooks/%23remove)
  * **Contoh:**
    ```javascript
    hot.removeHook('beforeInit', myCallback);
    ```
  * **Parameter:**
      * `key` (`string`): Nama hook.
      * `callback` (`function`): Referensi ke fungsi yang telah didaftarkan menggunakan `Core#addHook`.

-----

### `render()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Merender ulang tabel. Memanggil metode ini memulai proses penghitungan ulang, penggambaran ulang, dan penerapan perubahan ke DOM. Saat merender tabel, semua renderer sel dipanggil ulang. Memanggil metode ini secara manual tidak disarankan. Handsontable mencoba merender dirinya sendiri dengan memilih momen paling optimal dalam siklus hidupnya.

-----

### `resumeExecution([forceFlushChanges])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Melanjutkan proses eksekusi. Dalam kombinasi dengan metode `Core#suspendExecution`, ini memungkinkan penggabungan perubahan logika tabel setelah itu cache diperbarui. Melanjutkan status secara otomatis memicu proses pembaruan cache tabel. Metode ini ditujukan untuk pengguna tingkat lanjut. Menangguhkan proses eksekusi dapat menyebabkan gangguan visual yang disebabkan oleh tidak diperbaruinya cache tabel internal.

  * **Sejak:** 8.3.0
  * **Contoh:**
    ```javascript
    hot.suspendExecution();
    const filters = hot.getPlugin('filters');
    filters.addCondition(2, 'contains', ['3']);
    filters.filter();
    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
    hot.resumeExecution(); // Memperbarui cache secara internal
    ```
  * **Parameter:**
      * `forceFlushChanges` (`boolean`, *optional*, default: `false`): Jika `true`, cache data internal tabel dihitung ulang setelah eksekusi operasi yang digabungkan. Untuk panggilan `Core#batchExecution` bersarang, mungkin diinginkan untuk menghitung ulang tabel setelah setiap batch.

-----

### `resumeRender()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Melanjutkan proses rendering. Dalam kombinasi dengan metode `Core#suspendRender`, ini memungkinkan penggabungan siklus render tabel yang dipicu oleh panggilan API atau tindakan UI (atau keduanya) dan memanggil "render" sekali pada akhirnya. Ketika tabel dalam status ditangguhkan, sebagian besar operasi tidak akan memiliki efek visual sampai status rendering dilanjutkan. Melanjutkan status secara otomatis memicu rendering tabel. Metode ini ditujukan untuk pengguna tingkat lanjut. Menangguhkan proses rendering dapat menyebabkan gangguan visual jika diimplementasikan dengan salah. Setiap panggilan `suspendRender()` perlu sesuai dengan satu panggilan `resumeRender()`.

  * **Sejak:** 8.3.0
  * **Contoh:**
    ```javascript
    hot.suspendRender();
    hot.alter('insert_row_above', 5, 45);
    hot.alter('insert_col_start', 10, 40);
    hot.setDataAtCell(1, 1, 'John');
    hot.selectCell(0, 0);
    hot.resumeRender(); // Merender ulang tabel secara internal
    ```

-----

### `runHooks(key, [p1], [p2], [p3], [p4], [p5], [p6])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menjalankan callback untuk hook yang disediakan dalam argumen `key` menggunakan parameter yang diberikan dalam argumen lain.

  * **Lihat:** [Hooks\#run](https://www.google.com/search?q=https://handsontable.com/docs/javascript-data-grid/api/hooks/%23run)
  * **Contoh:**
    ```javascript
    // Jalankan hook bawaan
    hot.runHooks('beforeInit');
    // Jalankan hook kustom
    hot.runHooks('customAction', 10, 'foo');
    ```
  * **Parameter:**
      * `key` (`string`): Nama hook.
      * `p1..p6` (`*`, *optional*): Argumen yang diteruskan ke callback.
  * **Mengembalikan:** (`*`) - Hasil dari hook.

-----

### `scrollToFocusedCell([callback])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menggulir viewport ke koordinat yang ditentukan oleh sel yang saat ini difokuskan.

  * **Memicu:** `Hooks#event:afterScroll`
  * **Sejak:** 14.0.0
  * **Parameter:**
      * `callback` (`function`, *optional*): Fungsi callback untuk dipanggil setelah viewport digulir.
  * **Mengembalikan:** (`boolean`) - `true` jika viewport digulir, `false` jika tidak.

-----

### `scrollViewportTo(options, [callback])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menggulir viewport ke koordinat yang ditentukan oleh properti objek `row` dan/atau `col`.

  * **Contoh:**
    ```javascript
    // Gulir viewport ke indeks baris visual (biarkan gulir horizontal tidak tersentuh)
    hot.scrollViewportTo({ row: 50 });

    // Gulir viewport ke koordinat yang dilewatkan sehingga sel di 50, 50 akan menempel
    // ke tepi bawah-akhir tabel.
    hot.scrollViewportTo({
      row: 50,
      col: 50,
      verticalSnap: 'bottom',
      horizontalSnap: 'end',
    }, () => {
      // Fungsi callback dieksekusi setelah viewport digulir
    });
    ```
  * **Parameter:**
      * `options` (`object`): Kamus yang berisi parameter berikut:
          * `options.row` (`number`, *optional*): Menentukan jumlah baris visual sepanjang sumbu Y untuk menggulir viewport.
          * `options.col` (`number`, *optional*): Menentukan jumlah kolom visual sepanjang sumbu X untuk menggulir viewport.
          * `options.verticalSnap` (`'top' | 'bottom'`, *optional*): Menentukan ke tepi tabel mana viewport akan digulir berdasarkan koordinat yang dilewatkan. `'top'` atau `'bottom'`. Jika tidak ditentukan, snapping otomatis vertikal diaktifkan.
          * `options.horizontalSnap` (`'start' | 'end'`, *optional*): Menentukan ke tepi tabel mana viewport akan digulir. `'start'` (kiri atau kanan jika RTL) atau `'end'` (kanan atau kiri jika RTL). Jika tidak ditentukan, snapping otomatis horizontal diaktifkan.
          * `options.considerHiddenIndexes` (`boolean`, *optional*, default: `true`): Jika `true`, menangani indeks visual. Jika tidak, hanya menangani indeks yang dapat dirender saat berada di viewport (tidak mempertimbangkan indeks tersembunyi).
      * `callback` (`function`, *optional*): Fungsi callback untuk dipanggil setelah viewport digulir.
  * **Mengembalikan:** (`boolean`) - `true` jika viewport digulir, `false` jika tidak.

-----

### `selectAll([includeRowHeaders], [includeColumnHeaders], [options])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Pilih semua sel di tabel tidak termasuk header dan elemen sudut. Pilihan sebelumnya ditimpa.

  * **Contoh:**
    ```javascript
    // Pilih semua sel di tabel. Tidak memilih header dan elemen sudut.
    hot.selectAll();

    // Pilih semua sel di tabel, termasuk header baris tetapi tidak termasuk sel sudut dan header kolom.
    hot.selectAll(true, false);

    // Pilih semua sel di tabel, termasuk semua header dan sel sudut, tetapi pindahkan sorotan fokus.
    // sorot ke posisi 2, 1
    hot.selectAll(true, true, { // Koreksi: Parameter sebelumnya salah interpretasi
      focusPosition: { row: 2, col: 1 }
    });

    // Pilih semua sel di tabel, tanpa header dan elemen sudut.
    hot.selectAll(false, false); // Koreksi: selectAll(false) saja tidak cukup
    ```
  * **Sejak:** 0.38.2
  * **Parameter:**
      * `includeRowHeaders` (`boolean`, *optional*, default: `false`): `true` Jika pilihan harus menyertakan header baris.
      * `includeColumnHeaders` (`boolean`, *optional*, default: `false`): `true` Jika pilihan harus menyertakan header kolom.
      * `options` (`object`, *optional*): Objek tambahan dengan opsi. (Sejak 14.0.0)
          * `options.focusPosition` (`Object | boolean`, *optional*): Memungkinkan perubahan posisi fokus sel/header. Nilai mengambil objek dengan properti `row` dan `col` dari -N hingga N (-N untuk header, N untuk sel). Jika `false`, posisi fokus tidak akan diubah. Contoh: `hot.selectAll(false, false, { focusPosition: { row: 0, col: 1 }, disableHeadersHighlight: true })`
          * `options.disableHeadersHighlight` (`boolean`, *optional*): Jika `true`, menonaktifkan penyorotan header meskipun koordinat logis menunjuk padanya.

-----

### `selectCell(row, column, [endRow], [endColumn], [scrollToCell], [changeListener])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Pilih satu sel, atau satu rentang sel yang berdekatan.

  * Untuk memilih sel: lewati indeks baris dan kolom visualnya, misalnya: `selectCell(2, 4)`.

  * Untuk memilih rentang: lewati indeks visual sel pertama dan terakhir dalam rentang, misalnya: `selectCell(2, 4, 3, 5)`.

  * Jika kolom Anda memiliki properti, Anda dapat meneruskan nilai properti tersebut alih-alih indeks kolom, misalnya: `selectCell(2, 'first_name')`.
    Secara default, `selectCell()` juga:

  * Menggulir viewport ke sel yang baru dipilih.

  * Mengalihkan fokus keyboard ke Handsontable (dengan memanggil metode `listen()` Handsontable).

  * **Contoh:**

    ```javascript
    // Pilih satu sel
    hot.selectCell(2, 4);

    // Pilih rentang sel
    hot.selectCell(2, 4, 3, 5);

    // Pilih satu sel, menggunakan properti kolom
    hot.selectCell(2, 'first_name');

    // Pilih rentang sel, menggunakan properti kolom
    hot.selectCell(2, 'first_name', 3, 'last_name');

    // Pilih rentang sel, tanpa menggulir ke sana
    hot.selectCell(2, 4, 3, 5, false);

    // Pilih rentang sel, tanpa mengalihkan fokus keyboard ke Handsontable
    hot.selectCell(2, 4, 3, 5, true, false); // Koreksi: scrollToCell=true, changeListener=false
    ```

  * **Parameter:**

      * `row` (`number`): Indeks baris visual.
      * `column` (`number | string`): Indeks kolom visual (angka), atau nilai properti kolom (string).
      * `endRow` (`number`, *optional*): Jika memilih rentang: indeks baris visual sel terakhir dalam rentang.
      * `endColumn` (`number | string`, *optional*): Jika memilih rentang: indeks kolom visual (atau nilai properti kolom) sel terakhir dalam rentang.
      * `scrollToCell` (`boolean`, *optional*, default: `true`): `true`: gulir viewport ke sel yang baru dipilih. `false`: pertahankan viewport sebelumnya.
      * `changeListener` (`boolean`, *optional*, default: `true`): `true`: alihkan fokus keyboard ke Handsontable. `false`: pertahankan fokus keyboard sebelumnya.

  * **Mengembalikan:** (`boolean`) - `true`: pemilihan berhasil, `false`: pemilihan gagal.

-----

### `selectCells(coords, [scrollToCell], [changeListener])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Pilih beberapa sel atau rentang sel, yang berdekatan atau tidak berdekatan. Anda dapat meneruskan salah satu di bawah ini:

  * Array dari array (yang cocok dengan output metode `getSelected()` Handsontable).

  * Array objek `CellRange` (yang cocok dengan output metode `getSelectedRange()` Handsontable).
    Untuk memilih beberapa sel, lewati indeks baris dan kolom visual setiap sel, misalnya: `hot.selectCells([[1, 1], [5, 5]])`.
    Untuk memilih beberapa rentang, lewati indeks visual sel pertama dan terakhir di setiap rentang, misalnya: `hot.selectCells([[1, 1, 2, 2], [6, 2, 0, 2]])`.
    Jika kolom Anda memiliki properti, Anda dapat meneruskan nilai properti tersebut alih-alih indeks kolom, misalnya: `hot.selectCells([[1, 'first_name'], [5, 'last_name']])`.
    Secara default, `selectCells()` juga menggulir viewport dan mengalihkan fokus keyboard.

  * **Sejak:** 0.38.0

  * **Contoh:**

    ```javascript
    // Pilih sel yang tidak berdekatan
    hot.selectCells([[1, 1], [5, 5], [10, 10]]);

    // Pilih rentang sel yang tidak berdekatan
    hot.selectCells([[1, 1, 2, 2], [10, 10, 20, 20]]);

    // Pilih sel dan rentang sel
    hot.selectCells([[1, 1, 2, 2], [3, 3], [6, 2, 0, 2]]);

    // Pilih sel, menggunakan properti kolom
    hot.selectCells([[1, 'id', 2, 'first_name'], [3, 'full_name'], [6, 'last_name', 0, 'first_name']]);

    // Pilih beberapa rentang, menggunakan array objek `CellRange`
    const selected = hot.getSelectedRange();
    if (selected && selected.length > 1) {
        selected[0].from.row = 0; selected[0].from.col = 0;
        selected[0].to.row = 5; selected[0].to.col = 5;
        selected[1].from.row = 10; selected[1].from.col = 10;
        selected[1].to.row = 20; selected[1].to.col = 20;
        hot.selectCells(selected);
    }
    ```

  * **Parameter:**

      * `coords` (`Array<Array> | Array<CellRange>`): Koordinat visual, dilewatkan baik sebagai array dari array (`[[rowStart, columnStart, rowEnd, columnEnd], ...]`) atau sebagai array objek `CellRange`.
      * `scrollToCell` (`boolean`, *optional*, default: `true`): `true`: gulir viewport ke sel yang baru dipilih. `false`: pertahankan viewport sebelumnya.
      * `changeListener` (`boolean`, *optional*, default: `true`): `true`: alihkan fokus keyboard ke Handsontable. `false`: pertahankan fokus keyboard sebelumnya.

  * **Mengembalikan:** (`boolean`) - `true`: pemilihan berhasil, `false`: pemilihan gagal.

-----

### `selectColumns(startColumn, [endColumn], [focusPosition])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Pilih kolom yang ditentukan oleh indeks visual `startColumn`, properti kolom, atau rentang kolom yang berakhir di `endColumn`.

  * **Sejak:** 0.38.0
  * **Contoh:**
    ```javascript
    // Pilih kolom menggunakan indeks visual.
    hot.selectColumns(1);
    // Pilih kolom menggunakan properti kolom.
    hot.selectColumns('id');
    // Pilih rentang kolom menggunakan indeks visual.
    hot.selectColumns(1, 4);
    // Pilih rentang kolom menggunakan indeks visual dan tandai header pertama sebagai disorot (indeks -1).
    hot.selectColumns(1, 2, -1);
    // Pilih rentang kolom menggunakan indeks visual dan tandai sel kedua (baris 1) sebagai disorot.
    hot.selectColumns(2, 1, 1);
    // Pilih rentang kolom menggunakan indeks visual dan pindahkan posisi fokus ke suatu tempat di tengah rentang.
    hot.selectColumns(2, 5, { row: 2, col: 3 });
    // Pilih rentang kolom menggunakan properti kolom.
    hot.selectColumns('id', 'last_name');
    ```
  * **Parameter:**
      * `startColumn` (`number | string`): Indeks kolom visual atau properti kolom tempat pemilihan dimulai.
      * `endColumn` (`number | string`, *optional*, default: `startColumn`): Indeks kolom visual atau properti kolom tempat pemilihan berakhir. Jika `endColumn` tidak ditentukan, kolom yang ditentukan oleh `startColumn` akan dipilih.
      * `focusPosition` (`number | Object | CellCoords`, *optional*, default: `0`): Memungkinkan perubahan posisi fokus sel/header. Nilai dapat berupa indeks baris visual dari -N hingga N (-N untuk header, N untuk sel), atau objek dengan properti `row` dan `col`.
  * **Mengembalikan:** (`boolean`) - `true` jika pemilihan berhasil, `false` jika tidak.

-----

### `selectRows(startRow, [endRow], [focusPosition])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Pilih baris yang ditentukan oleh indeks visual `startRow` atau rentang baris yang berakhir di `endRow`.

  * **Sejak:** 0.38.0
  * **Contoh:**
    ```javascript
    // Pilih baris menggunakan indeks visual.
    hot.selectRows(1);
    // Pilih rentang baris, menggunakan indeks visual.
    hot.selectRows(1, 4);
    // Pilih rentang baris, menggunakan indeks visual, dan tandai header sebagai disorot (indeks -1).
    hot.selectRows(1, 2, -1);
    // Pilih rentang baris menggunakan indeks visual dan tandai sel kedua (kolom 1) sebagai disorot.
    hot.selectRows(2, 1, 1);
    // Pilih rentang baris menggunakan indeks visual dan pindahkan posisi fokus ke suatu tempat di tengah rentang.
    hot.selectRows(2, 5, { row: 2, col: 3 });
    ```
  * **Parameter:**
      * `startRow` (`number`): Indeks baris visual tempat pemilihan dimulai.
      * `endRow` (`number`, *optional*, default: `startRow`): Indeks baris visual tempat pemilihan berakhir. Jika `endRow` tidak ditentukan, baris yang ditentukan oleh `startRow` akan dipilih.
      * `focusPosition` (`number | Object | CellCoords`, *optional*, default: `0`): Memungkinkan perubahan posisi fokus sel/header. Nilai dapat berupa indeks kolom visual dari -N hingga N (-N untuk header, N untuk sel), atau objek dengan properti `row` dan `col`.
  * **Mengembalikan:** (`boolean`) - `true` jika pemilihan berhasil, `false` jika tidak.

-----

### `setCellMeta(row, column, key, value)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menetapkan properti yang ditentukan oleh properti `key` ke objek meta sel yang sesuai dengan parameter `row` dan `column`.

  * **Memicu:** `Hooks#event:beforeSetCellMeta`, `Hooks#event:afterSetCellMeta`
  * **Parameter:**
      * `row` (`number`): Indeks baris visual.
      * `column` (`number`): Indeks kolom visual.
      * `key` (`string`): Nama properti.
      * `value` (`string`): Nilai properti.

-----

### `setCellMetaObject(row, column, prop)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Set objek metadata sel yang ditentukan oleh `prop` ke parameter `row` dan `column` yang sesuai.

  * **Parameter:**
      * `row` (`number`): Indeks baris visual.
      * `column` (`number`): Indeks kolom visual.
      * `prop` (`object`): Objek meta.

-----

### `setDataAtCell(row, [column], [value], [source])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Tetapkan nilai baru ke sel. Untuk mengubah banyak sel sekaligus (cara yang disarankan), lewati array perubahan dalam format `[[row, col, value],...]` sebagai argumen pertama.

  * **Parameter:**
      * `row` (`number | Array`): Indeks baris visual atau array perubahan dalam format `[[row, col, value],...]`.
      * `column` (`number`, *optional*): Indeks kolom visual.
      * `value` (`string`, *optional*): Nilai baru.
      * `source` (`string`, *optional*): String yang mengidentifikasi bagaimana perubahan ini akan dijelaskan dalam array `changes` (berguna dalam callback `afterChange` atau `beforeChange`). Diatur ke `'edit'` jika dibiarkan kosong.

-----

### `setDataAtRowProp(row, prop, value, [source])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Tetapkan nilai baru ke sel. Untuk mengubah banyak sel sekaligus (cara yang disarankan), lewati array perubahan dalam format `[[row, prop, value],...]` sebagai argumen pertama.

  * **Parameter:**
      * `row` (`number | Array`): Indeks baris visual atau array perubahan dalam format `[[row, prop, value], ...]`.
      * `prop` (`string`): Nama properti atau string sumber (misalnya `'first.name'` atau `'0'`).
      * `value` (`string`): Nilai yang akan ditetapkan.
      * `source` (`string`, *optional*): String yang mengidentifikasi bagaimana perubahan ini akan dijelaskan dalam array `changes` (berguna dalam callback `onChange`).

-----

### `setSourceDataAtCell(row, column, value, [source])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Tetapkan nilai yang disediakan dalam kumpulan data sumber pada koordinat yang disediakan.

  * **Parameter:**
      * `row` (`number | Array`): Indeks baris fisik atau array perubahan dalam format `[[row, prop, value], ...]`.
      * `column` (`number | string`): Indeks kolom fisik / nama prop.
      * `value` (`*`): Nilai yang akan ditetapkan pada koordinat yang disediakan.
      * `source` (`string`, *optional*): Sumber perubahan sebagai string.

-----

### `spliceCellsMeta(visualIndex, [deleteAmount], [...cellMetaRows])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menghapus atau menambahkan satu atau lebih baris objek meta sel ke koleksi meta sel.

  * **Sejak:** 0.30.0
  * **Parameter:**
      * `visualIndex` (`number`): Indeks visual yang menentukan pada posisi mana item akan ditambahkan/dihapus.
      * `deleteAmount` (`number`, *optional*, default: `0`): Jumlah item yang akan dihapus. Jika diatur ke 0, tidak ada objek meta sel yang akan dihapus.
      * `...cellMetaRows` (`object`, *optional*): Objek baris meta sel baru yang akan ditambahkan ke koleksi meta sel.

-----

### `spliceCol(column, index, amount, [...elements])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menambah/menghapus data dari kolom. Metode ini bekerja sama seperti `Array.splice` untuk array.

  * **Parameter:**
      * `column` (`number`): Indeks kolom tempat Anda ingin melakukan splice.
      * `index` (`number`): Indeks tempat memulai perubahan array. Jika negatif, akan dimulai dari elemen sebanyak itu dari akhir.
      * `amount` (`number`): Integer yang menunjukkan jumlah elemen array lama yang akan dihapus. Jika `amount` adalah 0, tidak ada elemen yang dihapus.
      * `...elements` (`number`, *optional*): Elemen yang akan ditambahkan ke array. Jika Anda tidak menentukan elemen apa pun, `spliceCol` hanya menghapus elemen dari array.
  * **Mengembalikan:** (`Array`) - Mengembalikan bagian kolom yang dihapus.

-----

### `spliceRow(row, index, amount, [...elements])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menambah/menghapus data dari baris. Metode ini bekerja sama seperti `Array.splice` untuk array.

  * **Parameter:**
      * `row` (`number`): Indeks baris tempat Anda ingin melakukan splice.
      * `index` (`number`): Indeks tempat memulai perubahan array. Jika negatif, akan dimulai dari elemen sebanyak itu dari akhir.
      * `amount` (`number`): Integer yang menunjukkan jumlah elemen array lama yang akan dihapus. Jika `amount` adalah 0, tidak ada elemen yang dihapus.
      * `...elements` (`number`, *optional*): Elemen yang akan ditambahkan ke array. Jika Anda tidak menentukan elemen apa pun, `spliceRow` hanya menghapus elemen dari array.
  * **Mengembalikan:** (`Array`) - Mengembalikan bagian baris yang dihapus.

-----

### `suspendExecution()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menangguhkan proses eksekusi. Berguna untuk membungkus perubahan logika tabel seperti perubahan indeks menjadi satu panggilan setelah itu cache diperbarui. Akibatnya, ini meningkatkan kinerja operasi yang dibungkus. Metode ini ditujukan untuk pengguna tingkat lanjut. Menangguhkan proses eksekusi dapat menyebabkan gangguan visual yang disebabkan oleh cache tabel internal yang tidak diperbarui.

  * **Sejak:** 8.3.0
  * **Contoh:**
    ```javascript
    hot.suspendExecution();
    const filters = hot.getPlugin('filters');
    filters.addCondition(2, 'contains', ['3']);
    filters.filter();
    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
    hot.resumeExecution(); // Memperbarui cache secara internal
    ```

-----

### `suspendRender()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menangguhkan proses rendering. Berguna untuk membungkus siklus render tabel yang dipicu oleh panggilan API atau tindakan UI (atau keduanya) dan memanggil "render" sekali pada akhirnya. Akibatnya, ini meningkatkan kinerja operasi yang dibungkus. Ketika tabel dalam status ditangguhkan, sebagian besar operasi tidak akan memiliki efek visual sampai status rendering dilanjutkan. Melanjutkan status secara otomatis memicu rendering tabel. Untuk memastikan bahwa setelah menjalankan semua operasi, tabel akan dirender, sangat disarankan untuk menggunakan metode `Core#batchRender` atau `Core#batch`, yang juga mengagregasi eksekusi logika yang terjadi di belakang tabel. Metode ini ditujukan untuk pengguna tingkat lanjut. Menangguhkan proses rendering dapat menyebabkan gangguan visual jika diimplementasikan dengan salah. Setiap panggilan `suspendRender()` perlu sesuai dengan satu panggilan `resumeRender()`.

  * **Sejak:** 8.3.0
  * **Contoh:**
    ```javascript
    hot.suspendRender();
    hot.alter('insert_row_above', 5, 45);
    hot.alter('insert_col_start', 10, 40);
    hot.setDataAtCell(1, 1, 'John');
    hot.selectCell(0, 0);
    hot.resumeRender(); // Merender ulang tabel secara internal
    ```

-----

### `toHTML()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengonversi instance menjadi `outerHTML` dari `HTMLTableElement`.

  * **Sejak:** 7.1.0
  * **Mengembalikan:** (`string`) - String HTML tabel.

-----

### `toPhysicalColumn(column)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menerjemahkan indeks kolom visual menjadi fisik. Metode ini berguna ketika Anda ingin mengambil indeks kolom fisik berdasarkan indeks visual yang dapat diurutkan ulang, dipindahkan, atau dipangkas.

  * **Parameter:**
      * `column` (`number`): Indeks kolom visual.
  * **Mengembalikan:** (`number`) - Indeks kolom fisik.

-----

### `toPhysicalRow(row)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menerjemahkan indeks baris visual menjadi fisik. Metode ini berguna ketika Anda ingin mengambil indeks baris fisik berdasarkan indeks visual yang dapat diurutkan ulang, dipindahkan, atau dipangkas.

  * **Parameter:**
      * `row` (`number`): Indeks baris visual.
  * **Mengembalikan:** (`number`) - Indeks baris fisik.

-----

### `toTableElement()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Mengonversi instance menjadi `HTMLTableElement`.

  * **Sejak:** 7.1.0
  * **Mengembalikan:** (`HTMLTableElement`) - Elemen tabel HTML.

-----

### `toVisualColumn(column)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menerjemahkan indeks kolom fisik menjadi visual. Metode ini berguna ketika Anda ingin mengambil indeks kolom visual yang dapat diurutkan ulang, dipindahkan, atau dipangkas berdasarkan indeks fisik.

  * **Parameter:**
      * `column` (`number`): Indeks kolom fisik.
  * **Mengembalikan:** (`number`) - Indeks kolom visual.

-----

### `toVisualRow(row)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Menerjemahkan indeks baris fisik menjadi visual. Metode ini berguna ketika Anda ingin mengambil indeks baris visual yang dapat diurutkan ulang, dipindahkan, atau dipangkas berdasarkan indeks fisik.

  * **Parameter:**
      * `row` (`number`): Indeks baris fisik.
  * **Mengembalikan:** (`number`) - Indeks baris visual.

-----

### `undo()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Sama seperti `UndoRedo#undo`.

-----

### `unlisten()`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Berhenti mendengarkan input keyboard pada body dokumen. Memanggil metode ini membuat Handsontable tidak aktif untuk setiap peristiwa keyboard.

-----

### `updateData(data, [source])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Metode `updateData()` menggantikan data Handsontable dengan dataset baru. Metode `updateData()`:

  * Menjaga status sel (misalnya, format sel dan status `readOnly` sel)

  * Menjaga status baris (misalnya, urutan baris)

  * Menjaga status kolom (misalnya, urutan kolom)
    Untuk mengganti data Handsontable dan mereset status, gunakan metode `loadData()`.

  * **Baca lebih lanjut:** [Mengikat ke data](https://handsontable.com/docs/javascript-data-grid/binding-to-data/), [Menyimpan data](https://handsontable.com/docs/javascript-data-grid/saving-data/)

  * **Memicu:** `Hooks#event:beforeUpdateData`, `Hooks#event:afterUpdateData`, `Hooks#event:afterChange`

  * **Sejak:** 11.1.0

  * **Parameter:**

      * `data` (`Array`): Array dari array, atau array objek, yang berisi data Handsontable.
      * `source` (`string`, *optional*): Sumber panggilan `updateData()`.

-----

### `updateSettings(settings, [init])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Gunakan jika Anda perlu mengubah konfigurasi setelah inisialisasi. Argumen `settings` adalah objek yang berisi pengaturan yang diubah, dideklarasikan dengan cara yang sama seperti pada objek pengaturan awal. Perhatikan, bahwa meskipun metode `updateSettings` tidak menimpa pengaturan yang dideklarasikan sebelumnya, metode ini mungkin mereset pengaturan yang dibuat pasca-inisialisasi (misalnya - mengabaikan perubahan yang dibuat menggunakan fitur `columnResize`). Sejak 8.0.0 meneruskan `columns` atau `data` di dalam objek `settings` akan mengakibatkan peresetan status yang sesuai dengan baris dan kolom (misalnya, urutan baris/kolom, lebar kolom, tinggi baris, kolom beku, dll.). Sejak 12.0.0 meneruskan `data` di dalam objek `settings` tidak lagi mengakibatkan peresetan status yang sesuai dengan baris dan kolom.

  * **Memicu:** `Hooks#event:afterCellMetaReset`, `Hooks#event:afterUpdateSettings`
  * **Contoh:**
    ```javascript
    hot.updateSettings({
      contextMenu: true,
      colHeaders: true,
      fixedRowsTop: 2
    });
    ```
  * **Parameter:**
      * `settings` (`object`): Objek pengaturan (lihat [Options](https://www.google.com/search?q=https://handsontable.com/docs/react-data-grid/options/)). Hanya berikan pengaturan yang diubah, bukan seluruh objek pengaturan yang digunakan untuk inisialisasi.
      * `init` (`boolean`, *optional*, default: `false`): Digunakan secara internal untuk mode inisialisasi.

-----

### `useTheme(themeName)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Gunakan tema yang ditentukan oleh nama yang diberikan.

  * **Sejak:** 15.0.0
  * **Parameter:**
      * `themeName` (`string | boolean | undefined`): Nama tema yang akan digunakan.

-----

### `validateCell(value, cellProperties, callback, source)`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Memvalidasi satu sel.

  * **Parameter:**
      * `value` (`string | number`): Nilai yang akan divalidasi.
      * `cellProperties` (`object`): Meta sel yang sesuai dengan nilai.
      * `callback` (`function`): Fungsi callback.
      * `source` (`string`): String yang mengidentifikasi sumber validasi.

-----

### `validateCells([callback])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Memvalidasi setiap sel dalam kumpulan data, menggunakan fungsi validator yang dikonfigurasi untuk setiap sel. Tidak memvalidasi sel yang saat ini dipangkas, disembunyikan, atau difilter. Setelah validasi, fungsi callback dijalankan, dengan argumen `valid` diatur ke `true` untuk sel yang valid dan `false` untuk sel yang tidak valid.

  * **Contoh:**
    ```javascript
    hot.validateCells((valid) => {
      if (valid) {
        // ... kode untuk sel yang divalidasi
      }
    });
    ```
  * **Parameter:**
      * `callback` (`function`, *optional*): Fungsi callback.

-----

### `validateColumns([columns], [callback])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Memvalidasi kolom menggunakan fungsi validatornya dan memanggil callback setelah selesai. Jika salah satu sel tidak valid, callback akan dijalankan dengan argumen 'valid' sebagai `false` - jika tidak, akan sama dengan `true`.

  * **Contoh:**
    ```javascript
    hot.validateColumns([3, 4, 5], (valid) => {
      if (valid) {
        // ... kode untuk kolom yang divalidasi
      }
    });
    ```
  * **Parameter:**
      * `columns` (`Array`, *optional*): Array indeks kolom visual target validasi.
      * `callback` (`function`, *optional*): Fungsi callback.

-----

### `validateRows([rows], [callback])`

[Source code](https://www.google.com/search?q=https://github.com/handsontable/handsontable/blob/master/handsontable/src/core.js)

Memvalidasi baris menggunakan fungsi validatornya dan memanggil callback setelah selesai. Jika salah satu sel tidak valid, callback akan dijalankan dengan argumen 'valid' sebagai `false` - jika tidak, akan sama dengan `true`.

  * **Contoh:**
    ```javascript
    hot.validateRows([3, 4, 5], (valid) => {
      if (valid) {
        // ... kode untuk baris yang divalidasi
      }
    });
    ```
  * **Parameter:**
      * `rows` (`Array`, *optional*): Array indeks baris visual target validasi.
      * `callback` (`function`, *optional*): Fungsi callback.

-----
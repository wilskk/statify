<<<<<<< HEAD
declare module 'sav-reader' {
    import type { SavMeta } from './sav.types';

=======
/*
 * Deklarasi modul eksternal
 * - 'sav-reader': pembaca file .sav dari buffer
 * - 'sav-writer': penulis file .sav dari data dan definisi variabel
 */
declare module 'sav-reader' {
    import type { SavMeta } from './sav.types';

    // Pembaca file .sav dari buffer
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    export class SavBufferReader {
        constructor(buffer: Buffer);
        open(): Promise<void>;
        meta: SavMeta;
        readAllRows(): Promise<Record<string, unknown>[]>;
    }
}

declare module 'sav-writer' {
    import type { TransformedVariable } from './sav.types';

<<<<<<< HEAD
=======
    // Enum numerik tipe variabel untuk sav-writer
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    export const VariableType: {
        Numeric: number;
        String: number;
        Date: number;
        DateTime: number;
    };

<<<<<<< HEAD
=======
    // Enum numerik perataan variabel
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    export const VariableAlignment: {
        Left: number;
        Centre: number;
        Right: number;
    };

<<<<<<< HEAD
=======
    // Enum numerik level pengukuran variabel
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    export const VariableMeasure: {
        Nominal: number;
        Ordinal: number;
        Continuous: number;
    };

<<<<<<< HEAD
=======
    // Simpan data dan definisi variabel ke file .sav
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    export function saveToFile(
        filePath: string,
        data: Array<Record<string, string | number | Date | null>>,
        variables: TransformedVariable[]
    ): void;
}
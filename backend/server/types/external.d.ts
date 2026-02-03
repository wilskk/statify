/*
 * Deklarasi modul eksternal
 * - 'sav-reader': pembaca file .sav dari buffer
 * - 'sav-writer': penulis file .sav dari data dan definisi variabel
 */
declare module 'sav-reader' {
    import type { SavMeta } from './sav.types';

    // Pembaca file .sav dari buffer
    export class SavBufferReader {
        constructor(buffer: Buffer);
        open(): Promise<void>;
        meta: SavMeta;
        readAllRows(): Promise<Record<string, unknown>[]>;
    }
}

declare module 'sav-writer' {
    import type { TransformedVariable } from './sav.types';

    // Enum numerik tipe variabel untuk sav-writer
    export const VariableType: {
        Numeric: number;
        String: number;
        Date: number;
        DateTime: number;
    };

    // Enum numerik perataan variabel
    export const VariableAlignment: {
        Left: number;
        Centre: number;
        Right: number;
    };

    // Enum numerik level pengukuran variabel
    export const VariableMeasure: {
        Nominal: number;
        Ordinal: number;
        Continuous: number;
    };

    // Simpan data dan definisi variabel ke file .sav
    export function saveToFile(
        filePath: string,
        data: Array<Record<string, string | number | Date | null>>,
        variables: TransformedVariable[]
    ): void;
}
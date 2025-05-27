// types/Analyze.ts
import type { Variable } from './Variable'; // Pastikan Variable diimpor
import type { DataRow } from './Data';

// Interface yang diubah: Langsung berisi objek Variable lengkap dan datanya
export interface VariableData {
    variable: Variable; // Menggunakan tipe Variable yang diimpor
    data: (string | number)[]; // Array data untuk kolom variabel ini
}

// Sesuaikan tipe Parameter dan Hasil jika perlu (opsional, tergantung struktur hasil)
export interface FrequenciesParameters { // Mungkin tetap sama
    displayFrequencyTables: boolean;
    displayStatistics: boolean;
    displayCharts: boolean;
}

export interface FrequenciesResults { // Tetap sama, output JSON string
    descriptive?: string;
    frequencies?: { variableName: string; tableData: string }[];
    charts?: any;
}

export type FrequenciesStoreUpdate = {}; // Tetap sama
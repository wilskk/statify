import { create } from "zustand";

type TypeDate = 'y' | 'ys' | 'yq' | 'ym' | 'wwd5' | 'wwd6' | 'wd' | 'dwh' | 'dh' | 'nd';

/**
 * State dan aksi untuk store time series
 */
interface TimeSeriesStoreState {
    // Data
    typeDate: TypeDate; 
    year: number;           
    week: number;          
    day: number;            
    hour: number;
    
    // Getter
    getTypeDate: () => TypeDate;
    getYear: () => number;
    getWeek: () => number;
    getDay: () => number;
    getHour: () => number;
    
    // Setter
    setTypeDate: (typeDate: TypeDate) => void;
    setYear: (year: number) => void;
    setWeek: (week: number) => void;
    setDay: (day: number) => void;
    setHour: (hour: number) => void;
}

/**
 * Validasi nilai tanggal
 */
const validateDate = {
    year: (value: number) => Math.max(1900, Math.min(2100, value)),
    week: (value: number) => Math.max(1, Math.min(52, value)),
    day: (value: number) => Math.max(1, Math.min(31, value)),
    hour: (value: number) => Math.max(0, Math.min(23, value))
};

/**
 * Custom hook untuk mengelola data time series
 */
export const useTimeSeriesStore = create<TimeSeriesStoreState>((set, get) => ({
    // Nilai default
    typeDate: 'nd',     // Not Dated
    year: 2025,         // Default tahun saat ini 
    week: 1,           // Minggu pertama
    day: 1,             // Hari pertama
    hour: 0,            // Jam 00:00
    
    // Getter methods
    getTypeDate: () => get().typeDate,
    getYear: () => get().year,
    getWeek: () => get().week,
    getDay: () => get().day,
    getHour: () => get().hour,
    
    // Setter methods
    setTypeDate: (typeDate: TypeDate) => set({
        typeDate: typeDate
    }),
    setYear: (year: number) => set({ 
        year: validateDate.year(year) 
    }),
    setWeek: (week: number) => set({ 
        week: validateDate.week(week) 
    }),
    setDay: (day: number) => set({ 
        day: validateDate.day(day) 
    }),
    setHour: (hour: number) => set({ 
        hour: validateDate.hour(hour) 
    }),
}));
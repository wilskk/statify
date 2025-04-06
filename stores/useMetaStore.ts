import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Interfaces for validation rules
interface SingleVariableRule {
    id: string;
    name: string;
    type: string;
    format?: string;
    validValuesType: string;
    minimum?: string;
    maximum?: string;
    allowNoninteger: boolean;
    allowUserMissing: boolean;
    allowSystemMissing: boolean;
    allowBlank: boolean;
}

interface CrossVariableRule {
    id: string;
    name: string;
    expression: string;
}

interface Meta {
    name: string
    location: string
    created: Date
    weight: string
    dates: string // Stores formatted date string like Day(1)Hour(2;24)Minute(5;60)
    singleVarRules: SingleVariableRule[] // Added for validation rules
    crossVarRules: CrossVariableRule[]   // Added for validation rules
}

interface MetaStore {
    meta: Meta
    setMeta: (newMeta: Partial<Meta>) => void
    clearDates: () => void
    // New methods for validation rules
    setSingleVarRules: (rules: SingleVariableRule[]) => void
    setCrossVarRules: (rules: CrossVariableRule[]) => void
}

export const useMetaStore = create<MetaStore>()(
    persist(
        (set) => ({
            meta: {
                name: '',
                location: '',
                created: new Date(),
                weight: '',
                dates: '',
                singleVarRules: [], // Initialize empty arrays for rules
                crossVarRules: []
            },
            setMeta: (newMeta) =>
                set((state) => ({
                    meta: { ...state.meta, ...newMeta },
                })),
            clearDates: () =>
                set((state) => ({
                    meta: { ...state.meta, dates: '' },
                })),
            // Methods to handle validation rules
            setSingleVarRules: (rules) =>
                set((state) => ({
                    meta: { ...state.meta, singleVarRules: rules }
                })),
            setCrossVarRules: (rules) =>
                set((state) => ({
                    meta: { ...state.meta, crossVarRules: rules }
                }))
        }),
        {
            name: 'meta-storage',
            storage: createJSONStorage(() => localStorage, {
                replacer: (key: string, value: any) => {
                    if (value instanceof Date) {
                        return { type: 'date', value: value.toISOString() }
                    }
                    return value
                },
                reviver: (key: string, value: any) => {
                    if (value && typeof value === 'object' && (value as any).type === 'date') {
                        return new Date((value as any).value)
                    }
                    return value
                },
            }),
        }
    )
)
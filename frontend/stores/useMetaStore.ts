import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import db from '@/lib/db';
import { Meta, MetaStoreError } from '@/types/Meta';

const META_DB_ID = 'appMeta';

interface MetaStoreState {
    meta: Meta;
    isLoading: boolean;
    error: MetaStoreError | null;
    isLoaded: boolean;

    loadMeta: () => Promise<void>;
    setMeta: (newMeta: Partial<Meta>) => Promise<void>;
    clearDates: () => Promise<void>;
    setFilter: (filter: Meta['filter']) => Promise<void>;
    _saveMetaToDb: (metaToSave: Meta) => Promise<void>;
    resetMeta: () => Promise<void>;
    saveMeta: () => Promise<void>;
}

const initialMetaState: Meta = {
    name: '',
    location: '',
    created: new Date(),
    weight: '',
    dates: '',
    filter: ''
};

export const useMetaStore = create<MetaStoreState>()(
    devtools(
        immer((set, get) => ({
            meta: {
                name: '',
                location: '',
                created: new Date(),
                weight: '',
                dates: '',
                filter: ''
            },
            isLoading: false,
            error: null,
            isLoaded: false,

            _saveMetaToDb: async (metaToSave: Meta) => {
                try {
                    await db.metadata.put({ ...metaToSave, id: META_DB_ID });
                    set(state => { state.error = null; });
                } catch (error: any) {
                    console.error("Failed to save metadata:", error);
                    set(state => {
                        state.error = {
                            message: error.message || "Failed to save metadata",
                            source: "_saveMetaToDb",
                            originalError: error
                        };
                    });
                    throw error;
                }
            },

            loadMeta: async () => {
                if (get().isLoading || get().isLoaded) return;

                set(state => {
                    state.isLoading = true;
                    state.error = null;
                });

                try {
                    const storedMeta = await db.metadata.get(META_DB_ID);
                    if (storedMeta) {
                        set(state => {
                            state.meta = storedMeta;
                            if (!(state.meta.created instanceof Date)) {
                                state.meta.created = new Date(state.meta.created);
                            }
                        });
                    } else {
                        console.log("No metadata found in DB, initializing with defaults.");
                        await get()._saveMetaToDb(get().meta);
                    }
                    set(state => { state.isLoaded = true; });
                } catch (error: any) {
                    console.error("Failed to load metadata:", error);
                    set(state => {
                        state.error = {
                            message: error.message || "Failed to load metadata",
                            source: "loadMeta",
                            originalError: error
                        };
                    });
                } finally {
                    set(state => { state.isLoading = false; });
                }
            },

            setMeta: async (newMeta) => {
                set((state) => {
                    state.meta = { ...state.meta, ...newMeta };
                });
                await get()._saveMetaToDb(get().meta);
            },

            clearDates: async () => {
                set((state) => {
                    state.meta.dates = '';
                });
                await get()._saveMetaToDb(get().meta);
            },

            setFilter: async (filter) => {
                set((state) => {
                    state.meta.filter = filter;
                });
                await get()._saveMetaToDb(get().meta);
            },

            resetMeta: async () => {
                try {
                    await db.metadata.delete(META_DB_ID);
                    set(state => {
                        state.meta = { ...initialMetaState, created: new Date() };
                        state.error = null;
                        state.isLoaded = false;
                    });
                    await get()._saveMetaToDb({ ...initialMetaState, created: new Date() });
                } catch (error: any) {
                    console.error("Failed to reset metadata:", error);
                    set(state => {
                        state.error = {
                            message: error.message || "Failed to reset metadata",
                            source: "resetMeta",
                            originalError: error
                        };
                    });
                }
            },

            saveMeta: async () => {
                const currentMeta = get().meta;
                try {
                    await get()._saveMetaToDb(currentMeta);
                    set(state => { state.error = null; });
                } catch (error: any) {
                    console.error("Failed to explicitly save metadata:", error);
                    set(state => {
                        state.error = {
                            message: error.message || "Failed to save metadata during explicit save",
                            source: "saveMeta",
                            originalError: error
                        };
                    });
                    throw error;
                }
            }
        })),
        { name: "MetaStore" }
    )
);
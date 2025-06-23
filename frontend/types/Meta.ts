export interface Meta {
    id?: string;
    name: string;
    location: string;
    created: Date;
    weight: string;
    dates: string;
    filter: string;
}

export type MetaStoreError = {
    message: string;
    source: string;
    originalError?: any;
}; 
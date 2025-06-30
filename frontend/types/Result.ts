import { Table } from './Table';

export type Log = {
    id?: number;
    log: string;
    analytics?: Analytic[];
};

export interface Analytic {
    id?: number;
    logId?: number;
    title: string;
    note?: string;
    statistics?: Statistic[];
};

export interface Statistic {
    id?: number;
    analyticId?: number;
    title: string;
    output_data: string | Table;
    components: any;
    description: string;
};
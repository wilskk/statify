export type Log = {
    id?: number;
    log: string;
    analytics?: Analytic[];
};

export type Analytic = {
    id?: number;
    log_id?: number;
    title: string;
    note?: string;
    statistics?: Statistic[];
};

export type Statistic = {
    id?: number;
    analytic_id?: number;
    title: string;
    output_data: string;
    components: string;
    description: string;
};
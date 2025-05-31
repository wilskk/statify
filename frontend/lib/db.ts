import Dexie, { Table } from "dexie";
import { DataRow } from "@/types/Data";
import { Variable } from "@/types/Variable";
import { ValueLabel } from "@/types/Variable";
import { Log } from "@/types/Result";
import { Analytic } from "@/types/Result";
import { Statistic } from "@/types/Result";
import { Meta } from "@/stores/useMetaStore";

class MyDatabase extends Dexie {
    dataRows!: Table<{ id: number, data: DataRow }, number>;
    variables!: Table<Variable, number>;
    valueLabels!: Table<ValueLabel, number>;

    logs!: Table<Log, number>;
    analytics!: Table<Analytic, number>;
    statistics!: Table<Statistic, number>;

    metadata!: Table<Meta & { id: string }, string>;

    constructor() {
        super("Statify");

        this.version(5).stores({
            dataRows: "++id",
            variables: "++id, &columnIndex, &name, type",
            valueLabels: "++id, variableName, value",

            logs: "++id",
            analytics: "++id, log_id, title",
            statistics: "++id, analytic_id",

            metadata: "&id"
        });

        this.dataRows = this.table("dataRows");
        this.variables = this.table("variables");
        this.valueLabels = this.table("valueLabels");
        this.logs = this.table("logs");
        this.analytics = this.table("analytics");
        this.statistics = this.table("statistics");
        this.metadata = this.table("metadata");
    }

    async getLogWithRelations(logId: number): Promise<Log | undefined> {
        const log = await this.logs.get(logId);
        if (!log) return undefined;

        const analytics = await this.analytics.where('log_id').equals(logId).toArray();

        for (const analytic of analytics) {
            if (analytic.id) {
                analytic.statistics = await this.statistics.where('analytic_id').equals(analytic.id).toArray();
            }
        }

        log.analytics = analytics;
        return log;
    }

    async getAllLogsWithRelations(): Promise<Log[]> {
        const logs = await this.logs.toArray();
        const analytics = await this.analytics.toArray();
        const statistics = await this.statistics.toArray();

        const analyticMap = new Map<number, Analytic[]>();
        const statisticMap = new Map<number, Statistic[]>();

        for (const statistic of statistics) {
            if (!statistic.analytic_id) continue;

            if (!statisticMap.has(statistic.analytic_id)) {
                statisticMap.set(statistic.analytic_id, []);
            }
            statisticMap.get(statistic.analytic_id)!.push(statistic);
        }

        for (const analytic of analytics) {
            if (!analytic.id) continue;
            analytic.statistics = statisticMap.get(analytic.id) || [];

            if (!analytic.log_id) continue;
            if (!analyticMap.has(analytic.log_id)) {
                analyticMap.set(analytic.log_id, []);
            }
            analyticMap.get(analytic.log_id)!.push(analytic);
        }

        for (const log of logs) {
            if (!log.id) continue;
            log.analytics = analyticMap.get(log.id) || [];
        }

        return logs;
    }
}

const db = new MyDatabase();
export default db;
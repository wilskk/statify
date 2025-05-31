import db from "@/lib/db";
import { Log, Analytic, Statistic } from "@/types/Result";

export class ResultRepository {
  async getAllLogs(): Promise<Log[]> {
    try {
      return await db.getAllLogsWithRelations();
    } catch (error) {
      console.error("Failed to load logs with relations:", error);
      throw error;
    }
  }

  async getLog(id: number): Promise<Log | undefined> {
    try {
      return await db.getLogWithRelations(id);
    } catch (error) {
      console.error(`Failed to get log with ID ${id}:`, error);
      throw error;
    }
  }

  async saveLog(log: Log): Promise<number> {
    try {
      if (log.id !== undefined) {
        await db.logs.update(log.id, { log: log.log });
        return log.id;
      } else {
        return await db.logs.add({ log: log.log });
      }
    } catch (error) {
      console.error("Failed to save log:", error);
      throw error;
    }
  }

  async deleteLog(id: number): Promise<void> {
    try {
      // First get all analytics for this log
      const analytics = await db.analytics.where('log_id').equals(id).toArray();
      
      // Delete all statistics for these analytics
      for (const analytic of analytics) {
        if (analytic.id) {
          await db.statistics.where('analytic_id').equals(analytic.id).delete();
        }
      }
      
      // Delete all analytics for this log
      await db.analytics.where('log_id').equals(id).delete();
      
      // Finally delete the log itself
      await db.logs.delete(id);
    } catch (error) {
      console.error(`Failed to delete log with ID ${id}:`, error);
      throw error;
    }
  }

  async saveAnalytic(analytic: Analytic): Promise<number> {
    try {
      if (analytic.id !== undefined) {
        await db.analytics.update(analytic.id, {
          log_id: analytic.log_id,
          title: analytic.title,
          note: analytic.note
        });
        return analytic.id;
      } else {
        return await db.analytics.add({
          log_id: analytic.log_id,
          title: analytic.title,
          note: analytic.note
        });
      }
    } catch (error) {
      console.error("Failed to save analytic:", error);
      throw error;
    }
  }

  async saveStatistic(statistic: Statistic): Promise<number> {
    try {
      if (statistic.id !== undefined) {
        await db.statistics.update(statistic.id, {
          analytic_id: statistic.analytic_id,
          title: statistic.title,
          output_data: statistic.output_data,
          components: statistic.components,
          description: statistic.description
        });
        return statistic.id;
      } else {
        return await db.statistics.add({
          analytic_id: statistic.analytic_id,
          title: statistic.title,
          output_data: statistic.output_data,
          components: statistic.components,
          description: statistic.description
        });
      }
    } catch (error) {
      console.error("Failed to save statistic:", error);
      throw error;
    }
  }

  async deleteAnalytic(id: number): Promise<void> {
    try {
      // First delete all statistics for this analytic
      await db.statistics.where('analytic_id').equals(id).delete();
      
      // Then delete the analytic itself
      await db.analytics.delete(id);
    } catch (error) {
      console.error(`Failed to delete analytic with ID ${id}:`, error);
      throw error;
    }
  }

  async deleteStatistic(id: number): Promise<void> {
    try {
      await db.statistics.delete(id);
    } catch (error) {
      console.error(`Failed to delete statistic with ID ${id}:`, error);
      throw error;
    }
  }

  async clearResults(): Promise<void> {
    try {
      await db.transaction('rw', [db.logs, db.analytics, db.statistics], async () => {
        await db.statistics.clear();
        await db.analytics.clear();
        await db.logs.clear();
      });
    } catch (error) {
      console.error("Failed to clear results:", error);
      throw error;
    }
  }
}

const resultRepository = new ResultRepository();
export default resultRepository; 
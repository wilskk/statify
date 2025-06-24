import db from "@/lib/db";
import { Meta } from "@/types/Meta";

const META_DB_ID = 'appMeta';
const METADATA_TABLE_NAME = 'metadata';

export class MetaRepository {
    async getMeta(): Promise<Meta | undefined> {
        return await db.table<Meta>(METADATA_TABLE_NAME).get(META_DB_ID);
    }

    async saveMeta(meta: Meta): Promise<void> {
        await db.table<Meta>(METADATA_TABLE_NAME).put({ ...meta, id: META_DB_ID });
    }

    async deleteMeta(): Promise<void> {
        await db.table<Meta>(METADATA_TABLE_NAME).delete(META_DB_ID);
    }

    async clearMeta(): Promise<void> {
        await this.deleteMeta();
    }
}

export const metaRepository = new MetaRepository(); 
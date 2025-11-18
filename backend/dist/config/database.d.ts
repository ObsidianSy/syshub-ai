import pg from 'pg';
export declare const pool: pg.Pool;
export declare const query: (text: string, params?: any[]) => Promise<pg.QueryResult<any>>;
export declare const testConnection: () => Promise<boolean>;
//# sourceMappingURL=database.d.ts.map
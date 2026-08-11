import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: any = null;

export async function getDb(): Promise<any> {
  if (!dbInstance) {
    const SQL = await initSqlJs();
    // Choose database directory (support persistent /data volume)
    let storageDir = process.cwd();
    if (fs.existsSync('/data')) {
      try {
        fs.accessSync('/data', fs.constants.W_OK);
        storageDir = '/data';
        console.log('[DATABASE ENGINE] Persistent volume detected at /data. Storing database there.');
      } catch (e) {
        console.warn('[DATABASE ENGINE] /data exists but is not writable, defaulting to current working directory.');
      }
    }
    
    const dbPath = path.resolve(storageDir, 'festival.db');
    
    let fileBuffer: Buffer | undefined;
    if (fs.existsSync(dbPath)) {
      fileBuffer = fs.readFileSync(dbPath);
    }

    const db = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();

    const saveToDisk = () => {
      try {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
      } catch (err) {
        console.error('Failed to save SQLite database to disk:', err);
      }
    };

    // Create wrapper to mimic sqlite/sqlite3 async API
    dbInstance = {
      exec: async (query: string): Promise<any> => {
        const res = db.exec(query);
        saveToDisk();
        return res;
      },
      run: async (query: string, ...params: any[]): Promise<any> => {
        let actualParams = params;
        if (params.length === 1 && Array.isArray(params[0])) {
          actualParams = params[0];
        }
        db.run(query, actualParams);
        saveToDisk();
        return { changes: 1 };
      },
      get: async (query: string, ...params: any[]): Promise<any> => {
        let actualParams = params;
        if (params.length === 1 && Array.isArray(params[0])) {
          actualParams = params[0];
        }
        const stmt = db.prepare(query);
        if (actualParams.length > 0) {
          stmt.bind(actualParams);
        }
        let result: any = undefined;
        if (stmt.step()) {
          result = stmt.getAsObject();
          if (Object.keys(result).length === 0) {
            result = undefined;
          }
        }
        stmt.free();
        return result;
      },
      all: async (query: string, ...params: any[]): Promise<any[]> => {
        let actualParams = params;
        if (params.length === 1 && Array.isArray(params[0])) {
          actualParams = params[0];
        }
        const stmt = db.prepare(query);
        if (actualParams.length > 0) {
          stmt.bind(actualParams);
        }
        const results: any[] = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };

    // Create tables if they do not exist
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS site_config (
        id TEXT PRIMARY KEY,
        data_json TEXT
      );
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        data_json TEXT
      );
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        data_json TEXT
      );
      CREATE TABLE IF NOT EXISTS gallery (
        id TEXT PRIMARY KEY,
        data_json TEXT
      );
      CREATE TABLE IF NOT EXISTS hotels (
        id TEXT PRIMARY KEY,
        data_json TEXT
      );
      CREATE TABLE IF NOT EXISTS passes (
        id TEXT PRIMARY KEY,
        data_json TEXT
      );
      CREATE TABLE IF NOT EXISTS testimonials (
        id TEXT PRIMARY KEY,
        data_json TEXT
      );
      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY,
        data_json TEXT
      );
    `);
  }
  return dbInstance;
}

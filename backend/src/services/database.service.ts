import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { Configuration } from '../models/config.model';

export class DatabaseService {
  private db: sqlite3.Database;

  constructor(dbPath: string) {
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Database connection established');
      }
    });
    
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Create configurations table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS configurations (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        setup_completed INTEGER NOT NULL DEFAULT 0,
        config_data TEXT NOT NULL
      )
    `);

    // Create API keys table (encrypted)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS api_keys (
        service TEXT PRIMARY KEY,
        api_key TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    // Create deployment history table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS deployment_history (
        id TEXT PRIMARY KEY,
        config_id TEXT NOT NULL,
        deployed_at TEXT NOT NULL,
        status TEXT NOT NULL,
        docker_compose_path TEXT,
        FOREIGN KEY (config_id) REFERENCES configurations(id)
      )
    `);
  }

  // Configuration methods
  getConfiguration(id: string): Promise<Configuration | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM configurations WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as Configuration | null);
        }
      );
    });
  }

  getCurrentConfiguration(): Promise<Configuration | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM configurations ORDER BY updated_at DESC LIMIT 1',
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as Configuration | null);
        }
      );
    });
  }

  saveConfiguration(config: Configuration): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO configurations (id, created_at, updated_at, setup_completed, config_data)
         VALUES (?, ?, ?, ?, ?)`,
        [
          config.id,
          config.created_at,
          config.updated_at,
          config.setup_completed ? 1 : 0,
          config.config_data
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // API key methods
  saveApiKey(service: string, apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO api_keys (service, api_key, created_at)
         VALUES (?, ?, ?)`,
        [service, apiKey, new Date().toISOString()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getApiKey(service: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT api_key FROM api_keys WHERE service = ?',
        [service],
        (err, row: any) => {
          if (err) reject(err);
          else resolve(row?.api_key || null);
        }
      );
    });
  }

  getAllApiKeys(): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT service, api_key FROM api_keys',
        [],
        (err, rows: any[]) => {
          if (err) reject(err);
          else {
            const keys: Record<string, string> = {};
            rows.forEach(row => {
              keys[row.service] = row.api_key;
            });
            resolve(keys);
          }
        }
      );
    });
  }

  // Deployment history methods
  saveDeployment(id: string, configId: string, status: string, dockerComposePath?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO deployment_history (id, config_id, deployed_at, status, docker_compose_path)
         VALUES (?, ?, ?, ?, ?)`,
        [id, configId, new Date().toISOString(), status, dockerComposePath || null],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  close(): void {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

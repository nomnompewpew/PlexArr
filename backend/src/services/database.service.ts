import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Configuration } from '../models/config.model';

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Create configurations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS configurations (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        setup_completed INTEGER NOT NULL DEFAULT 0,
        config_data TEXT NOT NULL
      )
    `);

    // Create API keys table (encrypted)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        service TEXT PRIMARY KEY,
        api_key TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    // Create deployment history table
    this.db.exec(`
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
  getConfiguration(id: string): Configuration | null {
    const stmt = this.db.prepare('SELECT * FROM configurations WHERE id = ?');
    return stmt.get(id) as Configuration | null;
  }

  getCurrentConfiguration(): Configuration | null {
    const stmt = this.db.prepare('SELECT * FROM configurations ORDER BY updated_at DESC LIMIT 1');
    return stmt.get() as Configuration | null;
  }

  saveConfiguration(config: Configuration): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO configurations (id, created_at, updated_at, setup_completed, config_data)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      config.id,
      config.created_at,
      config.updated_at,
      config.setup_completed ? 1 : 0,
      config.config_data
    );
  }

  // API key methods
  saveApiKey(service: string, apiKey: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO api_keys (service, api_key, created_at)
      VALUES (?, ?, ?)
    `);
    
    stmt.run(service, apiKey, new Date().toISOString());
  }

  getApiKey(service: string): string | null {
    const stmt = this.db.prepare('SELECT api_key FROM api_keys WHERE service = ?');
    const result = stmt.get(service) as { api_key: string } | undefined;
    return result?.api_key || null;
  }

  getAllApiKeys(): Record<string, string> {
    const stmt = this.db.prepare('SELECT service, api_key FROM api_keys');
    const rows = stmt.all() as Array<{ service: string; api_key: string }>;
    
    const keys: Record<string, string> = {};
    rows.forEach(row => {
      keys[row.service] = row.api_key;
    });
    
    return keys;
  }

  // Deployment history methods
  saveDeployment(id: string, configId: string, status: string, dockerComposePath?: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO deployment_history (id, config_id, deployed_at, status, docker_compose_path)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, configId, new Date().toISOString(), status, dockerComposePath || null);
  }

  close(): void {
    this.db.close();
  }
}

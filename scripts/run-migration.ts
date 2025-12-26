import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const databaseUrl = process.env.NEW_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('Database URL not provided');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const migrationFile = process.argv[2] || 'update_stock_alerts_for_services.sql';
    const migrationPath = path.join(__dirname, '../migrations/', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration...');
    await pool.query(sql);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();


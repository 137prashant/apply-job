/**
 * One-time migration: copy data from local SQLite (job_applications.db) to Turso.
 *
 * Prerequisites:
 *   - TURSO_DATABASE_URL and TURSO_AUTH_TOKEN set in .env.local
 *   - job_applications.db exists in project root
 *
 * Usage:
 *   node scripts/migrate-sqlite-to-turso.js
 */

const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@libsql/client');
const path = require('path');

const SQLITE_PATH = path.join(process.cwd(), 'job_applications.db');
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

async function main() {
  if (!TURSO_URL || !TURSO_TOKEN) {
    console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env.local');
    process.exit(1);
  }

  const fs = require('fs');
  if (!fs.existsSync(SQLITE_PATH)) {
    console.error(`Error: SQLite file not found at ${SQLITE_PATH}`);
    process.exit(1);
  }

  const sqlite = new sqlite3.Database(SQLITE_PATH);
  const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      isApplied BOOLEAN DEFAULT FALSE,
      appliedDate TEXT,
      applicationCount INTEGER DEFAULT 0,
      hrReplied BOOLEAN DEFAULT FALSE,
      hrReplyNotes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      company TEXT,
      hrNumber TEXT
    )
  `);

  const rows = await new Promise((resolve, reject) => {
    sqlite.all('SELECT * FROM applications ORDER BY id', (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  console.log(`Found ${rows.length} applications in SQLite.`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const result = await turso.execute({
        sql: `
          INSERT OR IGNORE INTO applications (
            email, name, company, isApplied, appliedDate, applicationCount,
            hrReplied, hrReplyNotes, createdAt, updatedAt, hrNumber
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          row.email,
          row.name || null,
          row.company || null,
          row.isApplied ? 1 : 0,
          row.appliedDate || null,
          row.applicationCount ?? 0,
          row.hrReplied ? 1 : 0,
          row.hrReplyNotes || null,
          row.createdAt || null,
          row.updatedAt || null,
          row.hrNumber || null,
        ],
      });

      if (result.rowsAffected > 0) {
        migrated++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`Failed to migrate ${row.email}:`, err.message);
    }
  }

  sqlite.close();
  console.log(`Done. Migrated: ${migrated}, Skipped (duplicates): ${skipped}`);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

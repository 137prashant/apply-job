import { createClient } from '@libsql/client';
import path from 'path';
import { buildApplicationQuery } from './applicationQuery';
import { DatabaseConfigError } from './apiError';

let client = null;
let schemaInitialized = false;
let schemaInitPromise = null;

function normalizeValue(value) {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  return value;
}

function normalizeRows(result) {
  if (!result?.rows?.length) {
    return [];
  }

  const columns = result.columns;

  return result.rows.map((row) => {
    const obj = {};

    if (columns?.length) {
      for (const column of columns) {
        obj[column] = normalizeValue(row[column]);
      }
      return obj;
    }

    for (const key of Object.keys(row)) {
      if (!/^\d+$/.test(key)) {
        obj[key] = normalizeValue(row[key]);
      }
    }

    return obj;
  });
}

function normalizeRow(result, index = 0) {
  return normalizeRows(result)[index] ?? null;
}

function getClient() {
  if (client) {
    return client;
  }

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const isVercel = process.env.VERCEL === '1';

  if (isVercel && (!tursoUrl || !authToken)) {
    throw new DatabaseConfigError(
      'Database not configured for Vercel. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in environment variables.'
    );
  }

  const url = tursoUrl || `file:${path.join(process.cwd(), 'job_applications.db')}`;

  client = authToken
    ? createClient({ url, authToken })
    : createClient({ url });

  return client;
}

async function ensureSchema() {
  if (schemaInitialized) {
    return;
  }

  if (schemaInitPromise) {
    await schemaInitPromise;
    return;
  }

  schemaInitPromise = (async () => {
    const db = getClient();

    await db.execute(`
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

    schemaInitialized = true;
  })();

  try {
    await schemaInitPromise;
  } catch (error) {
    schemaInitPromise = null;
    throw error;
  }
}

class Database {
  async init() {
    await ensureSchema();
  }

  async addEmails(emails) {
    await ensureSchema();
    const db = getClient();

    let successCount = 0;
    let errorCount = 0;

    for (const email of emails) {
      try {
        const result = await db.execute({
          sql: `
            INSERT OR IGNORE INTO applications (email, name, company, isApplied, appliedDate, applicationCount, hrReplied, hrReplyNotes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            email.email,
            email.name || null,
            email.company || null,
            false,
            null,
            0,
            false,
            null,
          ],
        });
        if (result.rowsAffected > 0) {
          successCount++;
        }
      } catch (err) {
        errorCount++;
        console.error('Error inserting email:', err);
      }
    }

    return { successCount, errorCount };
  }

  async getAllApplications() {
    await ensureSchema();
    const db = getClient();
    const result = await db.execute(`
      SELECT * FROM applications
      ORDER BY createdAt DESC
    `);
    return normalizeRows(result);
  }

  async queryApplications(filters, { page = 1, pageSize = 50 } = {}) {
    await ensureSchema();
    const db = getClient();
    const { whereSql, params, orderBy } = buildApplicationQuery(filters);
    const offset = (page - 1) * pageSize;

    const countSql = `SELECT COUNT(*) as count FROM applications ${whereSql}`;
    const dataSql = `SELECT * FROM applications ${whereSql} ${orderBy} LIMIT ? OFFSET ?`;

    const countResult = await db.execute({
      sql: countSql,
      args: params,
    });
    const total = Number(normalizeRow(countResult)?.count ?? 0);

    const dataResult = await db.execute({
      sql: dataSql,
      args: [...params, pageSize, offset],
    });

    return {
      applications: normalizeRows(dataResult),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getApplicationStats() {
    await ensureSchema();
    const db = getClient();
    const result = await db.execute(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN isApplied = 1 THEN 1 ELSE 0 END) as applied,
        SUM(CASE WHEN isApplied = 0 THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN hrReplied = 1 THEN 1 ELSE 0 END) as hrReplied,
        SUM(CASE WHEN name IS NOT NULL AND TRIM(name) != '' THEN 1 ELSE 0 END) as nameSet,
        SUM(CASE WHEN name IS NULL OR TRIM(name) = '' THEN 1 ELSE 0 END) as nameNotSet,
        SUM(CASE WHEN applicationCount = 0 OR applicationCount IS NULL THEN 1 ELSE 0 END) as count0,
        SUM(CASE WHEN applicationCount = 1 THEN 1 ELSE 0 END) as count1,
        SUM(CASE WHEN applicationCount >= 2 THEN 1 ELSE 0 END) as count2Plus
      FROM applications
    `);
    return normalizeRow(result);
  }

  async getRecentAppliedApplications(limit = 5) {
    await ensureSchema();
    const db = getClient();
    const result = await db.execute({
      sql: `
        SELECT * FROM applications
        WHERE isApplied = 1 AND appliedDate IS NOT NULL
        ORDER BY appliedDate DESC
        LIMIT ?
      `,
      args: [limit],
    });
    return normalizeRows(result);
  }

  async getAppliedCountByDate(limit = 7) {
    await ensureSchema();
    const db = getClient();
    const result = await db.execute({
      sql: `
        SELECT date(appliedDate) as date, COUNT(*) as count
        FROM applications
        WHERE isApplied = 1 AND appliedDate IS NOT NULL
        GROUP BY date(appliedDate)
        ORDER BY date(appliedDate) DESC
        LIMIT ?
      `,
      args: [limit],
    });
    return normalizeRows(result);
  }

  async getUnappliedEmails() {
    await ensureSchema();
    const db = getClient();
    const result = await db.execute(`
      SELECT * FROM applications
      WHERE isApplied = FALSE
      ORDER BY createdAt DESC
    `);
    return normalizeRows(result);
  }

  async updateApplicationStatus(email, isApplied, appliedDate = null) {
    await ensureSchema();
    const db = getClient();

    if (isApplied) {
      const result = await db.execute({
        sql: `
          UPDATE applications
          SET isApplied = ?, appliedDate = ?, applicationCount = applicationCount + 1, updatedAt = CURRENT_TIMESTAMP
          WHERE email = ?
        `,
        args: [isApplied, appliedDate, email],
      });
      return { changes: result.rowsAffected };
    }

    const result = await db.execute({
      sql: `
        UPDATE applications
        SET isApplied = ?, appliedDate = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE email = ?
      `,
      args: [isApplied, appliedDate, email],
    });
    return { changes: result.rowsAffected };
  }

  async updateEmailName(email, name) {
    await ensureSchema();
    const db = getClient();
    const result = await db.execute({
      sql: `
        UPDATE applications
        SET name = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE email = ?
      `,
      args: [name, email],
    });
    return { changes: result.rowsAffected };
  }

  async updateCompany(email, company) {
    await ensureSchema();
    const db = getClient();
    const result = await db.execute({
      sql: `
        UPDATE applications
        SET company = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE email = ?
      `,
      args: [company, email],
    });
    return { changes: result.rowsAffected };
  }

  async updateHrNumber(email, hrNumber) {
    await ensureSchema();
    const db = getClient();
    const result = await db.execute({
      sql: `
        UPDATE applications
        SET hrNumber = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE email = ?
      `,
      args: [hrNumber, email],
    });
    return { changes: result.rowsAffected };
  }

  async updateEmailAddress(oldEmail, newEmail) {
    await ensureSchema();
    const db = getClient();

    const existing = await db.execute({
      sql: 'SELECT email FROM applications WHERE email = ?',
      args: [newEmail],
    });

    const existingRow = normalizeRow(existing);
    if (existingRow && existingRow.email !== oldEmail) {
      throw new Error('Email address already exists');
    }

    const result = await db.execute({
      sql: `
        UPDATE applications
        SET email = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE email = ?
      `,
      args: [newEmail, oldEmail],
    });
    return { changes: result.rowsAffected };
  }

  async updateHrReplyStatus(email, hrReplied, hrReplyNotes = null) {
    await ensureSchema();
    const db = getClient();
    const result = await db.execute({
      sql: `
        UPDATE applications
        SET hrReplied = ?, hrReplyNotes = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE email = ?
      `,
      args: [hrReplied, hrReplyNotes, email],
    });
    return { changes: result.rowsAffected };
  }

  async checkEmailExists(email) {
    await ensureSchema();
    const db = getClient();
    const result = await db.execute({
      sql: 'SELECT email FROM applications WHERE email = ?',
      args: [email],
    });
    return result.rows.length > 0;
  }

  async deleteApplication(email) {
    await ensureSchema();
    const db = getClient();
    const result = await db.execute({
      sql: 'DELETE FROM applications WHERE email = ?',
      args: [email],
    });
    return { changes: result.rowsAffected };
  }

  async deleteApplications(emails) {
    if (!emails.length) {
      return { changes: 0 };
    }

    await ensureSchema();
    const db = getClient();
    const placeholders = emails.map(() => '?').join(', ');
    const result = await db.execute({
      sql: `DELETE FROM applications WHERE email IN (${placeholders})`,
      args: emails,
    });
    return { changes: result.rowsAffected };
  }

  getConfigStatus() {
    return {
      isVercel: process.env.VERCEL === '1',
      hasTursoUrl: Boolean(process.env.TURSO_DATABASE_URL),
      hasTursoToken: Boolean(process.env.TURSO_AUTH_TOKEN),
    };
  }

  async checkHealth() {
    const config = this.getConfigStatus();

    if (config.isVercel && (!config.hasTursoUrl || !config.hasTursoToken)) {
      return {
        ok: false,
        ...config,
        message: 'Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN on Vercel.',
      };
    }

    await ensureSchema();
    const db = getClient();
    const result = await db.execute('SELECT COUNT(*) as count FROM applications');
    const row = normalizeRow(result);

    return {
      ok: true,
      ...config,
      applicationCount: Number(row?.count ?? 0),
    };
  }
}

const dbInstance = new Database();

export default dbInstance;

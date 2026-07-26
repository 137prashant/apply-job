const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { buildApplicationQuery } = require('./applicationQuery');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(process.cwd(), 'job_applications.db'));
    this.init();
  }

  init() {
    this.db.serialize(() => {
      this.db.run(`
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
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add applicationCount column if it doesn't exist (for existing databases)
      this.db.run(`
        ALTER TABLE applications ADD COLUMN applicationCount INTEGER DEFAULT 0
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding applicationCount column:', err);
        }
      });

      // Add hrReplied column if it doesn't exist (for existing databases)
      this.db.run(`
        ALTER TABLE applications ADD COLUMN hrReplied BOOLEAN DEFAULT FALSE
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding hrReplied column:', err);
        }
      });

      // Add hrReplyNotes column if it doesn't exist (for existing databases)
      this.db.run(`
        ALTER TABLE applications ADD COLUMN hrReplyNotes TEXT
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding hrReplyNotes column:', err);
        }
      });

      // Add company column if it doesn't exist (for existing databases)
      this.db.run(`
        ALTER TABLE applications ADD COLUMN company TEXT
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding company column:', err);
        }
      });

      // Add hrNumber column if it doesn't exist (for existing databases)
      this.db.run(`
        ALTER TABLE applications ADD COLUMN hrNumber TEXT
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding hrNumber column:', err);
        }
      });
    });
  }

  async addEmails(emails) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO applications (email, name, company, isApplied, appliedDate, applicationCount, hrReplied, hrReplyNotes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      let successCount = 0;
      let errorCount = 0;
      
      emails.forEach(email => {
        stmt.run([email.email, email.name || null, email.company || null, false, null, 0, false, null], function(err) {
          if (err) {
            errorCount++;
            console.error('Error inserting email:', err);
          } else {
            successCount++;
          }
        });
      });
      
      stmt.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ successCount, errorCount });
        }
      });
    });
  }

  async getAllApplications() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM applications 
        ORDER BY createdAt DESC
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async queryApplications(filters, { page = 1, pageSize = 50 } = {}) {
    const { whereSql, params, orderBy } = buildApplicationQuery(filters);
    const offset = (page - 1) * pageSize;

    const countSql = `SELECT COUNT(*) as count FROM applications ${whereSql}`;
    const dataSql = `SELECT * FROM applications ${whereSql} ${orderBy} LIMIT ? OFFSET ?`;

    const total = await new Promise((resolve, reject) => {
      this.db.get(countSql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row?.count ?? 0);
      });
    });

    const applications = await new Promise((resolve, reject) => {
      this.db.all(dataSql, [...params, pageSize, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    return {
      applications,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getApplicationStats() {
    return new Promise((resolve, reject) => {
      this.db.get(
        `
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
        `,
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async getRecentAppliedApplications(limit = 5) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `
        SELECT * FROM applications
        WHERE isApplied = 1 AND appliedDate IS NOT NULL
        ORDER BY appliedDate DESC
        LIMIT ?
        `,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async getAppliedCountByDate(limit = 7) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `
        SELECT date(appliedDate) as date, COUNT(*) as count
        FROM applications
        WHERE isApplied = 1 AND appliedDate IS NOT NULL
        GROUP BY date(appliedDate)
        ORDER BY date(appliedDate) DESC
        LIMIT ?
        `,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async getUnappliedEmails() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM applications 
        WHERE isApplied = FALSE
        ORDER BY createdAt DESC
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async updateApplicationStatus(email, isApplied, appliedDate = null) {
    return new Promise((resolve, reject) => {
      if (isApplied) {
        // Increment application count when marking as applied
        this.db.run(`
          UPDATE applications 
          SET isApplied = ?, appliedDate = ?, applicationCount = applicationCount + 1, updatedAt = CURRENT_TIMESTAMP
          WHERE email = ?
        `, [isApplied, appliedDate, email], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        });
      } else {
        // Just update status without incrementing count
        this.db.run(`
          UPDATE applications 
          SET isApplied = ?, appliedDate = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE email = ?
        `, [isApplied, appliedDate, email], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        });
      }
    });
  }

  async updateEmailName(email, name) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE applications 
        SET name = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE email = ?
      `, [name, email], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  async updateCompany(email, company) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE applications 
        SET company = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE email = ?
      `, [company, email], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  async updateHrNumber(email, hrNumber) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE applications 
        SET hrNumber = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE email = ?
      `, [hrNumber, email], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  async updateEmailAddress(oldEmail, newEmail) {
    return new Promise((resolve, reject) => {
      // First check if new email already exists
      this.db.get(`
        SELECT * FROM applications WHERE email = ?
      `, [newEmail], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (row && row.email !== oldEmail) {
          reject(new Error('Email address already exists'));
          return;
        }
        
        // Update the email address
        this.db.run(`
          UPDATE applications 
          SET email = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE email = ?
        `, [newEmail, oldEmail], function(updateErr) {
          if (updateErr) {
            reject(updateErr);
          } else {
            resolve({ changes: this.changes });
          }
        });
      });
    });
  }

  async updateHrReplyStatus(email, hrReplied, hrReplyNotes = null) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE applications 
        SET hrReplied = ?, hrReplyNotes = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE email = ?
      `, [hrReplied, hrReplyNotes, email], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  async checkEmailExists(email) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT * FROM applications WHERE email = ?
      `, [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      });
    });
  }

  async deleteApplication(email) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        DELETE FROM applications WHERE email = ?
      `, [email], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  async deleteApplications(emails) {
    if (!emails.length) {
      return { changes: 0 };
    }

    const placeholders = emails.map(() => '?').join(', ');

    return new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM applications WHERE email IN (${placeholders})`,
        emails,
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;


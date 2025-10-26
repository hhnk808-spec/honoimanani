const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

class Database {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.db = null;
    this.pool = null;
  }

  async connect() {
    if (this.isProduction) {
      // Vercel Postgres
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      console.log('Connected to Vercel Postgres');
    } else {
      // SQLite for development
      const dbPath = path.join(__dirname, '..', 'dev.db');
      this.db = new sqlite3.Database(dbPath);
      console.log('Connected to SQLite database');
    }
  }

  async query(sql, params = []) {
    if (this.isProduction) {
      const client = await this.pool.connect();
      try {
        const result = await client.query(sql, params);
        return result.rows;
      } finally {
        client.release();
      }
    } else {
      return new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
  }

  async run(sql, params = []) {
    if (this.isProduction) {
      const client = await this.pool.connect();
      try {
        const result = await client.query(sql, params);
        return { lastID: result.rows[0]?.id || 0, changes: result.rowCount };
      } finally {
        client.release();
      }
    } else {
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    }
  }

  async close() {
    if (this.isProduction) {
      await this.pool.end();
    } else {
      this.db.close();
    }
  }
}

module.exports = new Database();

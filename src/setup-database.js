const database = require('./database');

async function setupDatabase() {
  try {
    await database.connect();

    // テーブル作成
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id ${database.isProduction ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        username TEXT UNIQUE NOT NULL,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createPostsTable = `
      CREATE TABLE IF NOT EXISTS posts (
        id ${database.isProduction ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;

    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id ${database.isProduction ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        user_id INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;

    // インデックス作成
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)'
    ];

    console.log('Creating tables...');
    await database.run(createUsersTable);
    await database.run(createPostsTable);
    await database.run(createSessionsTable);

    console.log('Creating indexes...');
    for (const indexSql of createIndexes) {
      await database.run(indexSql);
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Database setup failed:', error);
  } finally {
    await database.close();
  }
}

setupDatabase();

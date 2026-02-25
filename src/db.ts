import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

// Initialize tables if they don't exist
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        nivel INTEGER,
        score_geral INTEGER,
        premium INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS atributos (
        user_id TEXT PRIMARY KEY,
        energia INTEGER,
        corpo INTEGER,
        foco INTEGER,
        financeiro INTEGER,
        disciplina INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS historico (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        data DATE,
        energia INTEGER,
        corpo INTEGER,
        foco INTEGER,
        financeiro INTEGER,
        disciplina INTEGER,
        nivel INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initDb();

export default pool;

import pkg from 'pg';
const { Pool } = pkg;

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { rejectUnauthorized: false }
});

let dbInitialized = false;

// Initialize tables if they don't exist
export const initDb = async () => {
  if (dbInitialized) return;
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        nivel INTEGER,
        score_geral FLOAT,
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
    
    // Try to alter score_geral to FLOAT just in case it was created as INTEGER before
    try {
      await pool.query(`ALTER TABLE users ALTER COLUMN score_geral TYPE FLOAT;`);
    } catch (e) {
      // Ignore if it fails (e.g. already float or syntax error in some PG versions)
    }

    console.log('Database initialized successfully');
    dbInitialized = true;
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initDb();

export default pool;

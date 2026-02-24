import Database from 'better-sqlite3';

const db = new Database('nivel99.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    nivel INTEGER,
    score_geral INTEGER,
    premium INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

export default db;

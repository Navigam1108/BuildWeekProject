import fs from "node:fs";
import Database from "better-sqlite3";
import { paths } from "./config";
import { listChallengeConfigs } from "./challenges";

type Db = InstanceType<typeof Database>;
let database: Db | undefined;

export function getDb() {
  if (database) return database;
  fs.mkdirSync(paths.dataDir ?? paths.sessions, { recursive: true });
  fs.mkdirSync(paths.sessions, { recursive: true });
  database = new Database(paths.db);
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS challenges (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      language TEXT NOT NULL,
      level TEXT NOT NULL,
      task_md TEXT NOT NULL,
      config_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      challenge_slug TEXT NOT NULL REFERENCES challenges(slug),
      candidate_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'created',
      agent_enabled INTEGER NOT NULL DEFAULT 1,
      container_id TEXT,
      ide_port INTEGER,
      ide_password TEXT,
      repo_path TEXT,
      created_at TEXT NOT NULL,
      duration_min INTEGER NOT NULL DEFAULT 60,
      ended_at TEXT
    );
    CREATE TABLE IF NOT EXISTS agent_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      kind TEXT NOT NULL,
      report_json TEXT,
      raw_output TEXT,
      created_at TEXT NOT NULL
    );
  `);
  seedChallenges(database);
  return database;
}

function seedChallenges(db: Db) {
  const insert = db.prepare(`INSERT INTO challenges (slug, title, language, level, task_md, config_json)
    VALUES (@slug, @title, @language, @level, @task_md, @config_json)
    ON CONFLICT(slug) DO UPDATE SET title=excluded.title, language=excluded.language,
      level=excluded.level, task_md=excluded.task_md, config_json=excluded.config_json`);
  const transaction = db.transaction(() => {
    for (const challenge of listChallengeConfigs()) {
      insert.run({
        slug: challenge.slug,
        title: challenge.title,
        language: challenge.language,
        level: challenge.level,
        task_md: challenge.task,
        config_json: JSON.stringify(challenge)
      });
    }
  });
  transaction();
}

export type SessionRow = {
  id: string;
  token: string;
  challenge_slug: string;
  candidate_name: string;
  status: string;
  agent_enabled: number;
  container_id: string | null;
  ide_port: number | null;
  ide_password: string | null;
  repo_path: string | null;
  created_at: string;
  duration_min: number;
  ended_at: string | null;
};

export function getSessionByToken(token: string) {
  return getDb().prepare("SELECT * FROM sessions WHERE token = ?").get(token) as SessionRow | undefined;
}

export function getSession(id: string) {
  return getDb().prepare("SELECT * FROM sessions WHERE id = ?").get(id) as SessionRow | undefined;
}

export function getMessages(sessionId: string, limit = 100) {
  return getDb().prepare("SELECT * FROM agent_messages WHERE session_id = ? ORDER BY id ASC LIMIT ?").all(sessionId, limit) as Array<{ id: number; role: string; content: string; created_at: string }>;
}

export function getLatestRun(sessionId: string) {
  return getDb().prepare("SELECT * FROM runs WHERE session_id = ? ORDER BY id DESC LIMIT 1").get(sessionId) as { report_json: string | null; raw_output: string | null; created_at: string } | undefined;
}

export function getSessionPulse(sessionId: string) {
  const row = getDb().prepare(`
    SELECT
      COUNT(*) AS total_messages,
      SUM(CASE WHEN role = 'candidate' THEN 1 ELSE 0 END) AS candidate_questions,
      SUM(CASE WHEN role = 'scout' THEN 1 ELSE 0 END) AS scout_answers,
      SUM(CASE WHEN role = 'guardrail' THEN 1 ELSE 0 END) AS blocked_requests
    FROM agent_messages WHERE session_id = ?
  `).get(sessionId) as { total_messages: number; candidate_questions: number | null; scout_answers: number | null; blocked_requests: number | null };
  const submissions = getDb().prepare("SELECT COUNT(*) AS count FROM runs WHERE session_id = ? AND kind = 'submit'").get(sessionId) as { count: number };
  return {
    total_messages: row.total_messages,
    candidate_questions: row.candidate_questions || 0,
    scout_answers: row.scout_answers || 0,
    blocked_requests: row.blocked_requests || 0,
    submissions: submissions.count
  };
}

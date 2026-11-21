import { readFileSync, readdirSync } from 'node:fs';

export function migrate(sqlite) {
  sqlite.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)');
  const migrations = readdirSync('drizzle').filter(file => file.endsWith('.sql')).sort();
  sqlite.exec('BEGIN IMMEDIATE');
  try {
    // Adopt databases created before the migration ledger was introduced.
    const legacyTasks = sqlite.prepare("SELECT name FROM sqlite_master WHERE name='tasks'").get();
    if (legacyTasks) {
      sqlite.prepare('INSERT OR IGNORE INTO schema_migrations (name) VALUES (?)').run(migrations[0]);
    }
    for (const file of migrations) {
      if (sqlite.prepare('SELECT name FROM schema_migrations WHERE name=?').get(file)) continue;
      sqlite.exec(readFileSync('drizzle/' + file, 'utf8'));
      sqlite.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(file);
    }
    sqlite.exec('COMMIT');
  } catch (error) {
    sqlite.exec('ROLLBACK');
    throw error;
  }
}

import { QueryTypes, Sequelize } from 'sequelize';
import { migrations } from './migrations';

const MIGRATION_TABLE = 'schema_migrations';

async function ensureMigrationTable(sequelize: Sequelize): Promise<void> {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      name VARCHAR(255) PRIMARY KEY,
      run_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getAppliedMigrations(sequelize: Sequelize): Promise<Set<string>> {
  await ensureMigrationTable(sequelize);

  const rows = await sequelize.query<{ name: string }>(
    `SELECT name FROM ${MIGRATION_TABLE} ORDER BY run_on ASC;`,
    { type: QueryTypes.SELECT }
  );

  return new Set(rows.map((row) => row.name));
}

export async function runMigrations(sequelize: Sequelize): Promise<void> {
  const appliedMigrations = await getAppliedMigrations(sequelize);

  for (const migration of migrations) {
    if (appliedMigrations.has(migration.name)) {
      continue;
    }

    await migration.up(sequelize.getQueryInterface());
    await sequelize.query(`INSERT INTO ${MIGRATION_TABLE} (name) VALUES (:name);`, {
      replacements: { name: migration.name },
    });
  }
}

export async function resetDatabaseSchema(sequelize: Sequelize): Promise<void> {
  await sequelize.query('DROP SCHEMA IF EXISTS public CASCADE;');
  await sequelize.query('CREATE SCHEMA public;');
}

import { initializeDatabase, closeDatabaseConnection, prepareDatabaseForTests } from '../config/database';
import { ENV } from '../config/environment';
import { ensureTestPostgresServer, stopTestPostgresServer } from '../database/testPostgresServer';

async function main(): Promise<void> {
  const shouldReset = process.argv.includes('--reset');

  await ensureTestPostgresServer();

  if (shouldReset) {
    await prepareDatabaseForTests();
  } else {
    await initializeDatabase();
  }

  console.log(`Migrations completed in ${ENV.NODE_ENV} mode.`);
  await closeDatabaseConnection();
  await stopTestPostgresServer();
}

main().catch(async (error) => {
  console.error('Migration command failed:', error);
  await closeDatabaseConnection().catch(() => undefined);
  await stopTestPostgresServer().catch(() => undefined);
  process.exit(1);
});

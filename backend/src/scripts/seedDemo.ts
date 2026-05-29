import { closeDatabaseConnection, initializeDatabase } from '../config/database';
import { ensureTestPostgresServer, stopTestPostgresServer } from '../database/testPostgresServer';
import { runDemoSeeder } from '../database/seeders/demoSeeder';

async function main(): Promise<void> {
  await ensureTestPostgresServer();
  await initializeDatabase();
  await runDemoSeeder();
  await closeDatabaseConnection();
  await stopTestPostgresServer();
}

main().catch(async (error) => {
  console.error('Demo seed command failed:', error);
  await closeDatabaseConnection().catch(() => undefined);
  await stopTestPostgresServer().catch(() => undefined);
  process.exit(1);
});

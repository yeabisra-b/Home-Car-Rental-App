import { stopTestPostgresServer } from '../database/testPostgresServer';

export default async function globalTeardown(): Promise<void> {
  await stopTestPostgresServer().catch(() => undefined);
}

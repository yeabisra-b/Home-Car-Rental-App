import fs from 'fs';
import path from 'path';
import { execFileSync, spawnSync } from 'child_process';
import { ENV } from '../config/environment';

const pgBinDir = '/usr/lib/postgresql/17/bin';
const dataDir = path.join('/tmp', 'rpms-test-postgres');
const logFile = path.join(dataDir, 'postgres.log');

function runPgCommand(command: string, args: string[], options: { env?: NodeJS.ProcessEnv } = {}): string {
  return execFileSync(path.join(pgBinDir, command), args, {
    encoding: 'utf8',
    env: {
      ...process.env,
      ...options.env,
    },
  });
}

function tryPgCommand(command: string, args: string[], options: { env?: NodeJS.ProcessEnv } = {}): boolean {
  const result = spawnSync(path.join(pgBinDir, command), args, {
    stdio: 'ignore',
    env: {
      ...process.env,
      ...options.env,
    },
  });

  return result.status === 0;
}

function isServerReady(): boolean {
  return tryPgCommand('pg_isready', ['-h', ENV.DB_HOST, '-p', String(ENV.DB_PORT), '-q']);
}

function ensureClusterInitialized(): void {
  if (fs.existsSync(path.join(dataDir, 'PG_VERSION'))) {
    return;
  }

  fs.mkdirSync(dataDir, { recursive: true });
  runPgCommand('initdb', ['-D', dataDir, '-U', ENV.DB_USER, '-A', 'trust']);
}

function ensureDatabaseExists(): void {
  if (
    tryPgCommand('psql', [
      '-w',
      '-h',
      ENV.DB_HOST,
      '-p',
      String(ENV.DB_PORT),
      '-U',
      ENV.DB_USER,
      '-d',
      ENV.DB_NAME,
      '-c',
      'SELECT 1;',
    ])
  ) {
    return;
  }

  runPgCommand('createdb', ['-w', '-h', ENV.DB_HOST, '-p', String(ENV.DB_PORT), '-U', ENV.DB_USER, ENV.DB_NAME]);
}

export async function ensureTestPostgresServer(): Promise<void> {
  if (ENV.NODE_ENV !== 'test') {
    return;
  }

  if (isServerReady()) {
    ensureDatabaseExists();
    return;
  }

  ensureClusterInitialized();

  runPgCommand('pg_ctl', ['-D', dataDir, '-l', logFile, '-o', `-p ${ENV.DB_PORT} -k ${dataDir}`, 'start']);

  const maxAttempts = 20;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (isServerReady()) {
      ensureDatabaseExists();
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error('Test Postgres server did not become ready in time.');
}

export async function stopTestPostgresServer(): Promise<void> {
  if (ENV.NODE_ENV !== 'test') {
    return;
  }

  if (!fs.existsSync(path.join(dataDir, 'PG_VERSION'))) {
    return;
  }

  if (!tryPgCommand('pg_ctl', ['-D', dataDir, 'status'])) {
    return;
  }

  runPgCommand('pg_ctl', ['-D', dataDir, 'stop', '-m', 'fast']);
}

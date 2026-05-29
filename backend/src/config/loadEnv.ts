import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

let loaded = false;

function getEnvFiles(): string[] {
  const files: string[] = [];

  if (process.env.NODE_ENV === 'test') {
    files.push('.env.test');
  }

  files.push('.env');

  return files;
}

export function loadEnv(): void {
  if (loaded) {
    return;
  }

  const cwd = process.cwd();

  for (const file of getEnvFiles()) {
    const fullPath = path.resolve(cwd, file);
    if (fs.existsSync(fullPath)) {
      dotenv.config({ path: fullPath, override: false, quiet: true });
    }
  }

  loaded = true;
}

loadEnv();

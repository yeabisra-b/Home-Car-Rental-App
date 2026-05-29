import { loadEnv } from './loadEnv';

loadEnv();

const parseInteger = (value: string | undefined, fallback: number): number => {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

export const ENV = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInteger(process.env.PORT, 3000),
    BCRYPT_ROUNDS: parseInteger(process.env.BCRYPT_ROUNDS, process.env.NODE_ENV === 'test' ? 1 : 12),
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInteger(process.env.DB_PORT, 5432),
    DB_NAME: process.env.DB_NAME || 'rpms',
    DB_USER: process.env.DB_USER || 'rpms',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
};

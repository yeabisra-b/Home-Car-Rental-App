import { ENV } from './environment';

function requireEnvSecret(name: string, value: string | undefined): string {
    if (!value) {
        throw new Error(`${name} environment variable is required`);
    }

    return value;
}

export const JWT_CONFIG = {
    ACCESS_TOKEN_SECRET: requireEnvSecret('JWT_ACCESS_SECRET', ENV.JWT_ACCESS_SECRET),
    REFRESH_TOKEN_SECRET: requireEnvSecret('JWT_REFRESH_SECRET', ENV.JWT_REFRESH_SECRET),
    ACCESS_TOKEN_EXPIRES_IN: ENV.JWT_ACCESS_EXPIRES_IN || '15m',
    REFRESH_TOKEN_EXPIRES_IN: ENV.JWT_REFRESH_EXPIRES_IN || '7d',
};

export const BCRYPT_ROUNDS = ENV.BCRYPT_ROUNDS;

export const RATE_LIMIT_CONFIG = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100, // limit each IP to 100 requests per windowMs
};

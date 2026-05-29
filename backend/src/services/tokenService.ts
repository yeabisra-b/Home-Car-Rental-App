import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_CONFIG } from '../config/auth';
import { User } from '../models/User';

export interface TokenPayload {
  userId: string;
  sessionVersion: number;
  tokenType: 'access' | 'refresh';
  tokenId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export function hashRefreshToken(refreshToken: string): string {
  return crypto.createHash('sha256').update(refreshToken).digest('hex');
}

function buildTokenPayload(user: Pick<User, 'id' | 'sessionVersion'>, tokenType: TokenPayload['tokenType']): TokenPayload {
  return {
    userId: user.id,
    sessionVersion: user.sessionVersion,
    tokenType,
    tokenId: crypto.randomUUID(),
  };
}

export function generateAuthTokens(user: Pick<User, 'id' | 'sessionVersion'>): AuthTokens {
  const accessToken = jwt.sign(
    buildTokenPayload(user, 'access'),
    JWT_CONFIG.ACCESS_TOKEN_SECRET,
    { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN } as SignOptions
  );

  const refreshToken = jwt.sign(
    buildTokenPayload(user, 'refresh'),
    JWT_CONFIG.REFRESH_TOKEN_SECRET,
    { expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN } as SignOptions
  );

  return {
    accessToken,
    refreshToken,
  };
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { models } from '../config/database';
import { JWT_CONFIG } from '../config/auth';
import { createError } from '../middleware/errorHandler';
import { AuthTokens, generateAuthTokens, hashRefreshToken, TokenPayload } from './tokenService';
import { User } from '../models/User';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber?: string;
  role?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface UpdatePasswordInput{
  userId:string;
  oldPassword: string;
  newPassword:string;
}

interface UpdateProfileInput {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
}

async function issueTokensForUser(user: User): Promise<{ user: ReturnType<User['toSafeJSON']> } & AuthTokens> {
  const tokens = generateAuthTokens(user);
  await user.update({ refreshTokenHash: hashRefreshToken(tokens.refreshToken) });

  return {
    user: user.toSafeJSON(),
    ...tokens,
  };
}

export async function registerUser(input: RegisterInput): Promise<{ user: ReturnType<User['toSafeJSON']> } & AuthTokens> {
  const existingUser = await models.User.findOne({ where: { email: input.email } });
  if (existingUser) {
    throw createError('User with this email already exists', 409);
  }

  let userRole: 'OWNER' | 'TENANT' | 'ADMIN' = input.role === 'OWNER' || input.role === 'TENANT' || input.role === 'ADMIN'
    ? input.role
    : 'TENANT';
  if (userRole === 'ADMIN') {
    throw createError('Admin account creation is not allowed through public registration', 403);
  }

  if (!['OWNER', 'TENANT'].includes(userRole)) {
    userRole = 'TENANT';
  }

  const user = await models.User.create({
    email: input.email,
    password: input.password,
    firstName: input.firstName,
    middleName: input.middleName,
    lastName: input.lastName,
    phoneNumber: input.phoneNumber,
    role: userRole,
    accountStatus: 'ACTIVE',
  });

  return issueTokensForUser(user);
}

export async function loginUser(input: LoginInput): Promise<{ user: ReturnType<User['toSafeJSON']> } & AuthTokens> {
  const user = await models.User.findOne({ where: { email: input.email } });
  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  if (user.accountStatus !== 'ACTIVE') {
    throw createError('Account is not active', 401);
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);
  if (!isPasswordValid) {
    throw createError('Invalid email or password', 401);
  }

  await user.update({
    sessionVersion: user.sessionVersion + 1,
    refreshTokenHash: null,
  });

  return issueTokensForUser(user);
}

export async function refreshUserTokens(refreshToken: string): Promise<AuthTokens> {
  if (!refreshToken) {
    throw createError('Refresh token is required', 400);
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_TOKEN_SECRET) as TokenPayload;
    if (decoded.tokenType !== 'refresh') {
      throw createError('Invalid refresh token', 401);
    }

    const user = await models.User.findByPk(decoded.userId);

    if (!user || user.accountStatus !== 'ACTIVE') {
      throw createError('Invalid refresh token', 401);
    }

    if (decoded.sessionVersion !== user.sessionVersion) {
      throw createError('Invalid refresh token', 401);
    }

    if (!user.refreshTokenHash || user.refreshTokenHash !== hashRefreshToken(refreshToken)) {
      throw createError('Invalid refresh token', 401);
    }

    const tokens = generateAuthTokens(user);
    await user.update({ refreshTokenHash: hashRefreshToken(tokens.refreshToken) });

    return tokens;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
      throw createError('Invalid refresh token', 401);
    }

    throw error;
  }
}

export async function updatePassword(input: UpdatePasswordInput) {
  const user = await models.User.findByPk(input.userId);

  if (!user) {
    throw createError('User not found', 404);
  }

  const isPasswordValid = await bcrypt.compare(input.oldPassword, user.password);
  if (!isPasswordValid) {
    throw createError('Old password is incorrect', 401);
  }

  await user.update({ password: input.newPassword });

  return { message: 'Password updated successfully' };
}

export async function updateUserProfile(user: User, input: UpdateProfileInput): Promise<ReturnType<User['toSafeJSON']>> {
  await user.update({
    firstName: input.firstName || user.firstName,
    middleName: input.middleName !== undefined ? input.middleName : user.middleName,
    lastName: input.lastName || user.lastName,
    phoneNumber: input.phoneNumber !== undefined ? input.phoneNumber : user.phoneNumber,
    profilePictureUrl: input.profilePictureUrl !== undefined ? input.profilePictureUrl : user.profilePictureUrl,
  });

  return user.toSafeJSON();
}

export async function logoutUser(user: User): Promise<void> {
  await user.update({
    sessionVersion: user.sessionVersion + 1,
    refreshTokenHash: null,
  });
}

export async function updateUserProfilePicture(user: User, file: Express.Multer.File | undefined): Promise<ReturnType<User['toSafeJSON']>> {
  if (!file) {
    throw createError('No file uploaded', 400);
  }

  await user.update({
    profilePictureUrl: file.path,
  });

  return user.toSafeJSON();
}

export async function getUserProfilePicturePath(userId: string): Promise<string> {
  const user = await models.User.findByPk(userId);
  if (!user || !user.profilePictureUrl) {
    throw createError('Profile picture not found', 404);
  }

  return user.profilePictureUrl;
}

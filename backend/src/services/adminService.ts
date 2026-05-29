import { Op } from 'sequelize';
import { models } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { User } from '../models/User';
import { AuthTokens, generateAuthTokens, hashRefreshToken } from './tokenService';

interface CreateAdminInput {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber?: string;
}

interface ListUsersInput {
  role?: string;
  accountStatus?: string;
  page?: number | string;
  limit?: number | string;
}

async function ensureAdminPrivileges(requester?: User): Promise<void> {
  if (!requester) {
    throw createError('Access token required', 401);
  }

  if (requester.role !== 'ADMIN') {
    throw createError('Admin access required', 403);
  }
}

export async function createAdminAccount(
  requester: User | undefined,
  input: CreateAdminInput
): Promise<{ user: ReturnType<User['toSafeJSON']> } & AuthTokens> {
  const adminCount = await models.User.count({ where: { role: 'ADMIN' } });

  if (adminCount > 0) {
    await ensureAdminPrivileges(requester);
  }

  const existingAdmin = await models.User.findOne({ where: { email: input.email } });
  if (existingAdmin) {
    throw createError('Admin with this email already exists', 409);
  }

  const admin = await models.User.create({
    email: input.email,
    password: input.password,
    firstName: input.firstName,
    middleName: input.middleName,
    lastName: input.lastName,
    phoneNumber: input.phoneNumber,
    role: 'ADMIN',
    accountStatus: 'ACTIVE',
  });

  const tokens = generateAuthTokens(admin);
  await admin.update({ refreshTokenHash: hashRefreshToken(tokens.refreshToken) });

  return {
    user: admin.toSafeJSON(),
    ...tokens,
  };
}

export async function listUsers(requester: User | undefined, input: ListUsersInput) {
  await ensureAdminPrivileges(requester);

  const whereClause: Record<string, unknown> = {};

  if (input.role) {
    whereClause.role = input.role;
  }

  if (input.accountStatus) {
    whereClause.accountStatus = input.accountStatus;
  }

  const page = Number(input.page || 1);
  const limit = Number(input.limit || 20);
  const offset = (page - 1) * limit;

  const { count, rows: users } = await models.User.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return {
    data: users.map((user) => user.toSafeJSON()),
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
}

export async function removeUserAccount(requester: User | undefined, userId: string): Promise<void> {
  await ensureAdminPrivileges(requester);

  const user = await models.User.findByPk(userId);
  if (!user) {
    throw createError('User not found', 404);
  }

  if (user.id === requester!.id) {
    throw createError('Cannot remove your own account', 400);
  }

  const activePropertyCount = await models.Property.count({
    where: {
      ownerId: user.id,
      status: {
        [Op.ne]: 'DELETED',
      },
    },
  });

  if (activePropertyCount > 0) {
    throw createError('Cannot remove user with active dependencies (properties, leases, etc.)', 400);
  }

  await user.destroy();
}

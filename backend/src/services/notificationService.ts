import { Transaction } from 'sequelize';
import { models } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { User } from '../models/User';

interface CreateNotificationInput {
  type: 'MESSAGE' | 'ANNOUNCEMENT' | 'MAINTENANCE' | 'INVOICE' | 'SYSTEM';
  message: string;
  entityType?: string | null;
  entityId?: string | null;
}

export async function createNotificationForUser(
  userId: string,
  input: CreateNotificationInput,
  transaction?: Transaction
) {
  return models.Notification.create(
    {
      userId,
      type: input.type as any,
      message: input.message,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      isRead: false,
    },
    transaction ? { transaction } : undefined
  );
}

export async function createNotificationsForUsers(
  userIds: string[],
  input: CreateNotificationInput,
  transaction?: Transaction
) {
  const uniqueUserIds = Array.from(new Set(userIds));
  if (uniqueUserIds.length === 0) {
    return [];
  }

  return models.Notification.bulkCreate(
    uniqueUserIds.map((userId) => ({
      userId,
      type: input.type as any,
      message: input.message,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      isRead: false,
    })),
    transaction ? { transaction } : undefined
  );
}

export async function markNotificationsAsReadForEntity(
  userId: string,
  entityType: string,
  entityId: string,
  transaction?: Transaction
) {
  return models.Notification.update(
    { isRead: true },
    {
      where: {
        userId,
        entityType,
        entityId,
        isRead: false,
      },
      ...(transaction ? { transaction } : {}),
    }
  );
}

interface ListNotificationsInput {
  isRead?: boolean;
  page?: string | number;
  limit?: string | number;
}

export async function listNotificationsForUser(user: User | undefined, input: ListNotificationsInput) {
  if (!user) {
    throw createError('Authentication required', 401);
  }

  const page = Number(input.page || 1);
  const limit = Number(input.limit || 20);
  const offset = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {
    userId: user.id,
  };

  if (typeof input.isRead === 'boolean') {
    whereClause.isRead = input.isRead;
  }

  const { count, rows } = await models.Notification.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return {
    data: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
}

export async function markNotificationReadForUser(user: User | undefined, notificationId: string) {
  if (!user) {
    throw createError('Authentication required', 401);
  }

  const notification = await models.Notification.findByPk(notificationId);
  if (!notification) {
    throw createError('Notification not found', 404);
  }

  if (user.role !== 'ADMIN' && notification.userId !== user.id) {
    throw createError('Access denied', 403);
  }

  if (!notification.isRead) {
    await notification.update({ isRead: true });
  }

  return notification;
}

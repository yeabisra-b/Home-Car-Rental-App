import { Response } from 'express';
import { sendOkResource, sendPaginated } from '../http/responses';
import { AuthRequest } from '../middleware/auth';
import { listNotificationsForUser, markNotificationReadForUser } from '../services/notificationService';

function parseBooleanQuery(value: unknown): boolean | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const result = await listNotificationsForUser(req.user, {
    isRead: parseBooleanQuery(req.query.isRead),
    page: typeof req.query.page === 'string' ? req.query.page : undefined,
    limit: typeof req.query.limit === 'string' ? req.query.limit : undefined,
  });

  return sendPaginated(res, result.data, result.total, result.page, result.totalPages);
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  const { notificationId } = req.params;
  const notification = await markNotificationReadForUser(
    req.user,
    Array.isArray(notificationId) ? notificationId[0] : notificationId
  );

  return sendOkResource(res, 'notification', notification);
};

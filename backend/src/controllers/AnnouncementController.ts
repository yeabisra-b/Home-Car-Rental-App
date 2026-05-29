import { Response } from 'express';
import { sendCreatedResource, sendPaginated } from '../http/responses';
import { AuthRequest } from '../middleware/auth';
import { createAnnouncementForOwner, listAnnouncementsForUser } from '../services/announcementService';

export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  const announcement = await createAnnouncementForOwner(req.user, req.body);
  return sendCreatedResource(res, 'announcement', announcement);
};

export const getAnnouncements = async (req: AuthRequest, res: Response) => {
  const result = await listAnnouncementsForUser(req.user, {
    propertyId: typeof req.query.propertyId === 'string' ? req.query.propertyId : undefined,
    page: typeof req.query.page === 'string' ? req.query.page : undefined,
    limit: typeof req.query.limit === 'string' ? req.query.limit : undefined,
  });

  return sendPaginated(res, result.data, result.total, result.page, result.totalPages);
};

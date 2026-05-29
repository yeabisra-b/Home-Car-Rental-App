import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getOwnerDashboardStats, getTenantDashboardStats } from '../services/dashboardService';
import { getRecentActivities } from '../services/activityService';
import { sendOkResource } from '../http/responses';

/**
 * @swagger
 * /dashboard/owner/stats:
 *   get:
 *     summary: Get owner dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner statistics
 */
export const getOwnerStats = async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'OWNER' && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const stats = await getOwnerDashboardStats(req.user!);
  return res.json(stats);
};

/**
 * @swagger
 * /dashboard/tenant/stats:
 *   get:
 *     summary: Get tenant dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tenant statistics
 */
export const getTenantStats = async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'TENANT' && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const stats = await getTenantDashboardStats(req.user!);
  return res.json(stats);
};

/**
 * @swagger
 * /dashboard/activities:
 *   get:
 *     summary: Get recent activities for the authenticated user
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recent activities
 */
export const getActivities = async (req: AuthRequest, res: Response) => {
  const activities = await getRecentActivities(req.user!.id);
  return sendOkResource(res, 'activities', activities);
};

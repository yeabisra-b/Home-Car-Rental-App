import { Router } from 'express';
import { param, query } from 'express-validator';
import { getNotifications, markNotificationRead } from '../controllers/NotificationController';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors, rejectUnknownQueryFields } from '../middleware/validation';

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: List notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated notification list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
router.get(
  '/',
  [
    query('isRead')
      .optional()
      .isBoolean()
      .withMessage('isRead must be true or false'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
    rejectUnknownQueryFields(['isRead', 'page', 'limit']),
    handleValidationErrors,
  ],
  getNotifications
);

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *       403:
 *         description: Only the notification owner or admin may mark it read
 *       404:
 *         description: Notification not found
 */
router.put(
  '/:notificationId/read',
  [
    param('notificationId')
      .isUUID()
      .withMessage('notificationId must be a valid UUID'),
    handleValidationErrors,
  ],
  markNotificationRead
);

export default router;

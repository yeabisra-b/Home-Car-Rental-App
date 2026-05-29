import { Router } from 'express';
import { body, query } from 'express-validator';
import { createAnnouncement, getAnnouncements } from '../controllers/AnnouncementController';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors, rejectUnknownBodyFields, rejectUnknownQueryFields } from '../middleware/validation';

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /announcements:
 *   post:
 *     summary: Create an announcement for tenants
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               propertyId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Optional property scope for owner announcements
 *     responses:
 *       201:
 *         description: Announcement created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 announcement:
 *                   $ref: '#/components/schemas/Announcement'
 *       403:
 *         description: Only owners may create announcements
 */
router.post(
  '/',
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('title is required')
      .isLength({ max: 255 })
      .withMessage('title must be less than 255 characters'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('content is required')
      .isLength({ max: 5000 })
      .withMessage('content must be less than 5000 characters'),
    body('propertyId')
      .optional()
      .isUUID()
      .withMessage('propertyId must be a valid UUID'),
    rejectUnknownBodyFields(['title', 'content', 'propertyId']),
    handleValidationErrors,
  ],
  createAnnouncement
);

/**
 * @swagger
 * /announcements:
 *   get:
 *     summary: List announcements visible to the authenticated user
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Paginated announcement list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Announcement'
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
    query('propertyId')
      .optional()
      .isUUID()
      .withMessage('propertyId must be a valid UUID'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
    rejectUnknownQueryFields(['propertyId', 'page', 'limit']),
    handleValidationErrors,
  ],
  getAnnouncements
);

export default router;

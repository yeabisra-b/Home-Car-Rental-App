import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createMaintenanceRequest,
  getMaintenanceRequest,
  getMaintenanceRequests,
  updateMaintenanceStatus,
} from '../controllers/MaintenanceController';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors, rejectUnknownBodyFields, rejectUnknownQueryFields } from '../middleware/validation';

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /maintenance-requests:
 *   post:
 *     summary: Submit a maintenance request for an actively leased unit
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [unitId, category, priority, description]
 *             properties:
 *               unitId:
 *                 type: string
 *                 format: uuid
 *               category:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Maintenance request created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 request:
 *                   $ref: '#/components/schemas/MaintenanceRequest'
 *       403:
 *         description: Only the current tenant of the unit may create a request
 */
router.post(
  '/',
  [
    rejectUnknownBodyFields(['unitId', 'category', 'priority', 'description']),
    body('unitId')
      .isUUID()
      .withMessage('unitId must be a valid UUID'),
    body('category')
      .trim()
      .notEmpty()
      .withMessage('category is required')
      .isLength({ max: 100 })
      .withMessage('category must be less than 100 characters'),
    body('priority')
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('priority must be LOW, MEDIUM, HIGH, or URGENT'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('description is required')
      .isLength({ max: 5000 })
      .withMessage('description must be less than 5000 characters'),
    handleValidationErrors,
  ],
  createMaintenanceRequest
);

/**
 * @swagger
 * /maintenance-requests:
 *   get:
 *     summary: List maintenance requests visible to the authenticated user
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, RESOLVED, REJECTED]
 *       - in: query
 *         name: unitId
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
 *         description: Paginated maintenance request list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MaintenanceRequest'
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
    rejectUnknownQueryFields(['status', 'unitId', 'page', 'limit']),
    query('status')
      .optional()
      .isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'])
      .withMessage('status must be OPEN, IN_PROGRESS, RESOLVED, or REJECTED'),
    query('unitId')
      .optional()
      .isUUID()
      .withMessage('unitId must be a valid UUID'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
    handleValidationErrors,
  ],
  getMaintenanceRequests
);

/**
 * @swagger
 * /maintenance-requests/{requestId}:
 *   get:
 *     summary: Get a single maintenance request
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Maintenance request details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 request:
 *                   $ref: '#/components/schemas/MaintenanceRequest'
 *       404:
 *         description: Maintenance request not found
 */
router.get(
  '/:requestId',
  [
    param('requestId')
      .isUUID()
      .withMessage('requestId must be a valid UUID'),
    handleValidationErrors,
  ],
  getMaintenanceRequest
);



/**
 * @swagger
 * /maintenance-requests/{requestId}/status:
 *   put:
 *     summary: Update the status of a maintenance request
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [IN_PROGRESS, RESOLVED, REJECTED]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Maintenance request updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 request:
 *                   $ref: '#/components/schemas/MaintenanceRequest'
 *       400:
 *         description: Invalid maintenance state transition
 *       403:
 *         description: Only the owner or admin may update status
 */
router.put(
  '/:requestId/status',
  [
    rejectUnknownBodyFields(['status', 'note']),
    param('requestId')
      .isUUID()
      .withMessage('requestId must be a valid UUID'),
    body('status')
      .isIn(['IN_PROGRESS', 'RESOLVED', 'REJECTED'])
      .withMessage('status must be IN_PROGRESS, RESOLVED, or REJECTED'),
    body('note')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('note must be less than 1000 characters'),
    handleValidationErrors,
  ],
  updateMaintenanceStatus
);

export default router;

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createLease,
  getLease,
  getLeases,
  removeTenantFromLease,
  submitMoveOutNotice,
  terminateLease,
} from '../controllers/LeaseController';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors, rejectUnknownBodyFields, rejectUnknownQueryFields } from '../middleware/validation';

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /leases:
 *   post:
 *     summary: Create a draft lease for a rental unit
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [unitId, startDate, endDate, monthlyRent, depositAmount]
 *             properties:
 *               unitId:
 *                 type: string
 *                 format: uuid
 *               tenantId:
 *                 type: string
 *                 format: uuid
 *               tenantEmail:
 *                 type: string
 *                 format: email
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               monthlyRent:
 *                 type: number
 *               depositAmount:
 *                 type: number
 *           examples:
 *             ownerCreatesLease:
 *               value:
 *                 unitId: 11111111-1111-1111-1111-111111111111
 *                 tenantEmail: tenant@example.com
 *                 startDate: 2026-04-01
 *                 endDate: 2027-03-31
 *                 monthlyRent: 18000
 *                 depositAmount: 18000
 *     responses:
 *       201:
 *         description: Draft lease created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lease:
 *                   $ref: '#/components/schemas/Lease'
 *       400:
 *         description: Invalid payload or conflicting draft/active lease
 *       403:
 *         description: Only owners can create leases for their own units
 */
router.post(
  '/',
  [
    rejectUnknownBodyFields([
      'unitId',
      'tenantId',
      'tenantEmail',
      'startDate',
      'endDate',
      'monthlyRent',
      'depositAmount',
    ]),
    body('unitId')
      .isUUID()
      .withMessage('unitId must be a valid UUID'),
    body('tenantId')
      .optional()
      .isUUID()
      .withMessage('tenantId must be a valid UUID'),
    body('tenantEmail')
      .optional()
      .isEmail()
      .withMessage('tenantEmail must be a valid email'),
    body('startDate')
      .isISO8601()
      .withMessage('startDate must be a valid date'),
    body('endDate')
      .isISO8601()
      .withMessage('endDate must be a valid date'),
    body('monthlyRent')
      .isFloat({ min: 0 })
      .withMessage('monthlyRent must be a positive number'),
    body('depositAmount')
      .isFloat({ min: 0 })
      .withMessage('depositAmount must be a positive number'),
    body().custom((value) => {
      if (!value.tenantId && !value.tenantEmail) {
        throw new Error('Provide either tenantId or tenantEmail');
      }

      if (value.startDate && value.endDate && value.endDate < value.startDate) {
        throw new Error('endDate must be on or after startDate');
      }

      return true;
    }),
    handleValidationErrors,
  ],
  createLease
);

/**
 * @swagger
 * /leases:
 *   get:
 *     summary: List leases visible to the authenticated user
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, ACTIVE, TERMINATED, EXPIRED]
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Admin-only tenant filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Paginated lease list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lease'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       403:
 *         description: Forbidden filter or resource scope
 */
router.get(
  '/',
  [
    rejectUnknownQueryFields(['status', 'unitId', 'tenantId', 'page', 'limit']),
    query('status')
      .optional()
      .isIn(['DRAFT', 'ACTIVE', 'TERMINATED', 'EXPIRED'])
      .withMessage('status must be DRAFT, ACTIVE, TERMINATED, or EXPIRED'),
    query('unitId')
      .optional()
      .isUUID()
      .withMessage('unitId must be a valid UUID'),
    query('tenantId')
      .optional()
      .isUUID()
      .withMessage('tenantId must be a valid UUID'),
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
  getLeases
);

/**
 * @swagger
 * /leases/{leaseId}:
 *   get:
 *     summary: Get a single lease
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leaseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lease details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lease:
 *                   $ref: '#/components/schemas/Lease'
 *       404:
 *         description: Lease not found
 */
router.get(
  '/:leaseId',
  [
    param('leaseId')
      .isUUID()
      .withMessage('leaseId must be a valid UUID'),
    handleValidationErrors,
  ],
  getLease
);



/**
 * @swagger
 * /leases/{leaseId}/terminate:
 *   post:
 *     summary: Terminate an eligible lease as the tenant
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leaseId
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
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lease terminated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lease:
 *                   $ref: '#/components/schemas/Lease'
 *       400:
 *         description: Lease cannot be terminated in its current state
 *       403:
 *         description: Only the lease tenant may terminate
 */
router.post(
  '/:leaseId/terminate',
  [
    rejectUnknownBodyFields(['reason']),
    param('leaseId')
      .isUUID()
      .withMessage('leaseId must be a valid UUID'),
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('reason is required'),
    handleValidationErrors,
  ],
  terminateLease
);

/**
 * @swagger
 * /leases/{leaseId}/move-out-notice:
 *   post:
 *     summary: Record a tenant move-out notice
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leaseId
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
 *             required: [noticeDate]
 *             properties:
 *               noticeDate:
 *                 type: string
 *                 format: date
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Move-out notice saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lease:
 *                   $ref: '#/components/schemas/Lease'
 *                 message:
 *                   type: string
 *       403:
 *         description: Only the lease tenant may submit a notice
 */
router.post(
  '/:leaseId/move-out-notice',
  [
    rejectUnknownBodyFields(['noticeDate', 'note']),
    param('leaseId')
      .isUUID()
      .withMessage('leaseId must be a valid UUID'),
    body('noticeDate')
      .isISO8601()
      .withMessage('noticeDate must be a valid date'),
    body('note')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('note must be less than 1000 characters'),
    handleValidationErrors,
  ],
  submitMoveOutNotice
);

/**
 * @swagger
 * /leases/{leaseId}/remove-tenant:
 *   post:
 *     summary: Remove a tenant from a lease as the owner
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leaseId
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
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tenant removed and lease updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lease:
 *                   $ref: '#/components/schemas/Lease'
 *       403:
 *         description: Only the owning property owner may remove the tenant
 */
router.post(
  '/:leaseId/remove-tenant',
  [
    rejectUnknownBodyFields(['reason']),
    param('leaseId')
      .isUUID()
      .withMessage('leaseId must be a valid UUID'),
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('reason is required'),
    handleValidationErrors,
  ],
  removeTenantFromLease
);

export default router;

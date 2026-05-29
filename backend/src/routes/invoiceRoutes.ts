import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  generateInvoices,
  getInvoice,
  getInvoices,
  reviewInvoiceStatus,
} from '../controllers/InvoiceController';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors, rejectUnknownBodyFields, rejectUnknownQueryFields } from '../middleware/validation';

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: List invoices visible to the authenticated user
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [UNPAID, PENDING_REVIEW, PAID, OVERDUE]
 *       - in: query
 *         name: leaseId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: billingMonth
 *         schema:
 *           type: string
 *           format: date
 *         description: Any date inside the target month
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
 *         description: Paginated invoice list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invoice'
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
    rejectUnknownQueryFields(['status', 'leaseId', 'billingMonth', 'page', 'limit']),
    query('status')
      .optional()
      .isIn(['UNPAID', 'PENDING_REVIEW', 'PAID', 'OVERDUE'])
      .withMessage('status must be UNPAID, PENDING_REVIEW, PAID, or OVERDUE'),
    query('leaseId')
      .optional()
      .isUUID()
      .withMessage('leaseId must be a valid UUID'),
    query('billingMonth')
      .optional()
      .isISO8601()
      .withMessage('billingMonth must be a valid date'),
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
  getInvoices
);

/**
 * @swagger
 * /invoices/generate-monthly:
 *   post:
 *     summary: Generate monthly rent invoices for all active leases
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               billingMonth:
 *                 type: string
 *                 format: date
 *                 description: Any date inside the month to generate
 *     responses:
 *       200:
 *         description: Invoice generation summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 billingMonth:
 *                   type: string
 *                   format: date
 *                 generatedCount:
 *                   type: integer
 *                 skippedCount:
 *                   type: integer
 *       403:
 *         description: Only admins may generate invoices
 */
router.post(
  '/generate-monthly',
  [
    rejectUnknownBodyFields(['billingMonth']),
    body('billingMonth')
      .optional()
      .isISO8601()
      .withMessage('billingMonth must be a valid date'),
    handleValidationErrors,
  ],
  generateInvoices
);

/**
 * @swagger
 * /invoices/{invoiceId}:
 *   get:
 *     summary: Get a single invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Invoice details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoice:
 *                   $ref: '#/components/schemas/Invoice'
 *       404:
 *         description: Invoice not found
 */
router.get(
  '/:invoiceId',
  [
    param('invoiceId')
      .isUUID()
      .withMessage('invoiceId must be a valid UUID'),
    handleValidationErrors,
  ],
  getInvoice
);



/**
 * @swagger
 * /invoices/{invoiceId}/status:
 *   put:
 *     summary: Review an invoice payment status
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
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
 *                 enum: [PAID, UNPAID]
 *               reviewNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice review completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoice:
 *                   $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Invalid invoice status transition
 *       403:
 *         description: Only the owner or admin may review invoice status
 */
router.put(
  '/:invoiceId/status',
  [
    rejectUnknownBodyFields(['status', 'reviewNote']),
    param('invoiceId')
      .isUUID()
      .withMessage('invoiceId must be a valid UUID'),
    body('status')
      .isIn(['PAID', 'UNPAID'])
      .withMessage('status must be PAID or UNPAID'),
    body('reviewNote')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('reviewNote must be less than 1000 characters'),
    handleValidationErrors,
  ],
  reviewInvoiceStatus
);

export default router;

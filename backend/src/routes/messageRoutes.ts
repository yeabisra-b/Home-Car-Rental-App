import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { getMessage, getMessages, markMessageRead, sendMessage, getConversations } from '../controllers/MessageController';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors, rejectUnknownBodyFields, rejectUnknownQueryFields } from '../middleware/validation';

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Send a direct message to another user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverId, subject, content]
 *             properties:
 *               receiverId:
 *                 type: string
 *                 format: uuid
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid payload or self-message attempt
 *       404:
 *         description: Receiver not found
 */
router.post(
  '/',
  [
    body('receiverId')
      .isUUID()
      .withMessage('receiverId must be a valid UUID'),
    body('subject')
      .trim()
      .notEmpty()
      .withMessage('subject is required')
      .isLength({ max: 255 })
      .withMessage('subject must be less than 255 characters'),
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
    body('conversationId')
      .optional()
      .isUUID()
      .withMessage('conversationId must be a valid UUID'),
    rejectUnknownBodyFields(['receiverId', 'subject', 'content', 'propertyId', 'conversationId']),
    handleValidationErrors,
  ],
  sendMessage
);

/**
 * @swagger
 * /messages:
 *   get:
 *     summary: List messages for the authenticated user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: otherUserId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional conversation filter
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
 *         description: Paginated message list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
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
    query('otherUserId')
      .optional()
      .isUUID()
      .withMessage('otherUserId must be a valid UUID'),
    query('conversationId')
      .optional()
      .isUUID()
      .withMessage('conversationId must be a valid UUID'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
    rejectUnknownQueryFields(['otherUserId', 'conversationId', 'page', 'limit']),
    handleValidationErrors,
  ],
  getMessages
);

/**
 * @swagger
 * /messages/conversations:
 *   get:
 *     summary: List all conversations for the authenticated user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get(
  '/conversations',
  getConversations
);

/**
 * @swagger
 * /messages/{messageId}:
 *   get:
 *     summary: Get a single message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Message details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *       404:
 *         description: Message not found
 */
router.get(
  '/:messageId',
  [
    param('messageId')
      .isUUID()
      .withMessage('messageId must be a valid UUID'),
    handleValidationErrors,
  ],
  getMessage
);

/**
 * @swagger
 * /messages/{messageId}/read:
 *   put:
 *     summary: Mark a message as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Message marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *       403:
 *         description: Only the receiver or admin may mark the message as read
 */
router.put(
  '/:messageId/read',
  [
    param('messageId')
      .isUUID()
      .withMessage('messageId must be a valid UUID'),
    handleValidationErrors,
  ],
  markMessageRead
);

export default router;

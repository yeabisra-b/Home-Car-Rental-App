import { Response } from 'express';
import { sendCreatedResource, sendOkResource, sendPaginated } from '../http/responses';
import { AuthRequest } from '../middleware/auth';
import {
  getMessageForUser,
  listMessagesForUser,
  markMessageAsReadForUser,
  sendMessageForUser,
  getConversationsForUser,
} from '../services/messageService';

export const sendMessage = async (req: AuthRequest, res: Response) => {
  const message = await sendMessageForUser(req.user, req.body);
  return sendCreatedResource(res, 'message', message);
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  const result = await listMessagesForUser(req.user, {
    otherUserId: typeof req.query.otherUserId === 'string' ? req.query.otherUserId : undefined,
    conversationId: typeof req.query.conversationId === 'string' ? req.query.conversationId : undefined,
    page: typeof req.query.page === 'string' ? req.query.page : undefined,
    limit: typeof req.query.limit === 'string' ? req.query.limit : undefined,
  });

  return sendPaginated(res, result.data, result.total, result.page, result.totalPages);
};

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
export const getConversations = async (req: AuthRequest, res: Response) => {
  const conversations = await getConversationsForUser(req.user);
  return sendOkResource(res, 'conversations', conversations);
};

export const getMessage = async (req: AuthRequest, res: Response) => {
  const { messageId } = req.params;
  const message = await getMessageForUser(req.user, Array.isArray(messageId) ? messageId[0] : messageId);
  return sendOkResource(res, 'message', message);
};

export const markMessageRead = async (req: AuthRequest, res: Response) => {
  const { messageId } = req.params;
  const message = await markMessageAsReadForUser(req.user, Array.isArray(messageId) ? messageId[0] : messageId);
  return sendOkResource(res, 'message', message);
};

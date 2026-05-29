import { Op } from 'sequelize';
import { models, sequelize } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { User } from '../models/User';
import { logActivity } from './activityService';
import { createNotificationForUser, markNotificationsAsReadForEntity } from './notificationService';

interface SendMessageInput {
  receiverId: string;
  subject: string;
  content: string;
  propertyId?: string;
  conversationId?: string;
}

interface ListMessagesInput {
  otherUserId?: string;
  conversationId?: string;
  page?: string | number;
  limit?: string | number;
}

const userAttributes = ['id', 'email', 'firstName', 'middleName', 'lastName', 'phoneNumber', 'role', 'accountStatus'];

function getMessageIncludes() {
  return [
    {
      model: models.User,
      as: 'sender',
      attributes: userAttributes,
    },
    {
      model: models.User,
      as: 'receiver',
      attributes: userAttributes,
    },
  ];
}

function assertMessageAccess(user: User, message: { senderId: string; receiverId: string }) {
  if (user.role === 'ADMIN') {
    return;
  }

  if (message.senderId === user.id || message.receiverId === user.id) {
    return;
  }

  throw createError('Access denied', 403);
}

export async function sendMessageForUser(user: User | undefined, input: SendMessageInput) {
  if (!user) {
    throw createError('Authentication required', 401);
  }

  if (input.receiverId === user.id) {
    throw createError('Sender cannot message themselves', 400);
  }

  const receiver = await models.User.findByPk(input.receiverId);
  if (!receiver) {
    throw createError('Receiver not found', 404);
  }

  if (receiver.accountStatus !== 'ACTIVE') {
    throw createError('Receiver account is not active', 400);
  }

  return sequelize.transaction(async (transaction) => {
    let conversationId = input.conversationId;

    if (!conversationId) {
      // Sort participant IDs to ensure unique pairing
      const participantAId = user.id < receiver.id ? user.id : receiver.id;
      const participantBId = user.id < receiver.id ? receiver.id : user.id;

      const [conversation] = await models.Conversation.findOrCreate({
        where: {
          participantAId,
          participantBId,
          propertyId: input.propertyId || null,
        },
        defaults: {
          participantAId,
          participantBId,
          propertyId: input.propertyId || null,
        },
        transaction,
      });
      conversationId = conversation.id;
    }

    const message = await models.Message.create(
      {
        senderId: user.id,
        receiverId: receiver.id,
        conversationId,
        subject: input.subject,
        content: input.content,
      },
      { transaction }
    );

    // Update conversation lastMessageId and updatedAt
    await models.Conversation.update(
      { 
        lastMessageId: message.id,
        updatedAt: new Date()
      },
      { 
        where: { id: conversationId },
        transaction 
      }
    );

    await createNotificationForUser(
      receiver.id,
      {
        type: 'MESSAGE',
        message: 'You have a new message',
        entityType: 'MESSAGE',
        entityId: message.id,
      },
      transaction
    );

    await logActivity({
      userId: user.id,
      type: 'MESSAGE_SENT',
      entityType: 'MESSAGE',
      entityId: message.id,
      description: `Sent a message to ${receiver.email}`,
    });

    return models.Message.findByPk(message.id, {
      include: getMessageIncludes(),
      transaction,
    });
  });
}

export async function listMessagesForUser(user: User | undefined, input: ListMessagesInput) {
  if (!user) {
    throw createError('Authentication required', 401);
  }

  const page = Number(input.page || 1);
  const limit = Number(input.limit || 20);
  const offset = (page - 1) * limit;

  let whereClause: any = {
    [Op.or]: [
      { senderId: user.id },
      { receiverId: user.id },
    ],
  };

  if (input.conversationId) {
    whereClause = {
      conversationId: input.conversationId,
      [Op.or]: [
        { senderId: user.id },
        { receiverId: user.id },
      ],
    };
  } else if (input.otherUserId) {
    whereClause = {
      [Op.or]: [
        { senderId: user.id, receiverId: input.otherUserId },
        { senderId: input.otherUserId, receiverId: user.id },
      ],
    };
  }

  const { count, rows } = await models.Message.findAndCountAll({
    where: whereClause,
    include: getMessageIncludes(),
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return {
    data: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
}

export async function getMessageForUser(user: User | undefined, messageId: string) {
  if (!user) {
    throw createError('Authentication required', 401);
  }

  const message = await models.Message.findByPk(messageId, {
    include: getMessageIncludes(),
  });

  if (!message) {
    throw createError('Message not found', 404);
  }

  assertMessageAccess(user, message);
  return message;
}

export async function markMessageAsReadForUser(user: User | undefined, messageId: string) {
  if (!user) {
    throw createError('Authentication required', 401);
  }

  const message = await models.Message.findByPk(messageId, {
    include: getMessageIncludes(),
  });

  if (!message) {
    throw createError('Message not found', 404);
  }

  if (user.role !== 'ADMIN' && message.receiverId !== user.id) {
    throw createError('Access denied', 403);
  }

  return sequelize.transaction(async (transaction) => {
    if (!message.readAt) {
      await message.update({ readAt: new Date() }, { transaction });
    }

    await markNotificationsAsReadForEntity(message.receiverId, 'MESSAGE', message.id, transaction);

    return models.Message.findByPk(message.id, {
      include: getMessageIncludes(),
      transaction,
    });
  });
}

export async function getConversationsForUser(user: User | undefined) {
  if (!user) {
    throw createError('Authentication required', 401);
  }

  const conversations = await models.Conversation.findAll({
    where: {
      [Op.or]: [
        { participantAId: user.id },
        { participantBId: user.id },
      ],
    },
    include: [
      {
        model: models.Property,
        as: 'property',
        attributes: ['id', 'title', 'ownerId', 'type'],
        include: [
          {
            model: models.RentalUnit,
            as: 'rentalUnits',
            attributes: ['rentAmount'],
          }
        ]
      },
      {
        model: models.User,
        as: 'participantA',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: models.User,
        as: 'participantB',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: models.Message,
        as: 'lastMessage',
      },
    ],
    order: [['updatedAt', 'DESC']],
  });

  return conversations;
}

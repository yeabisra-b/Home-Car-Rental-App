import request from 'supertest';
import app from '../app';
import { models } from '../config/database';
import { createAccessToken, createUser } from './helpers/factories';

describe('Message Endpoints', () => {
  async function seedMessageContext() {
    const owner = await createUser({ role: 'OWNER', email: 'owner-message@test.local' });
    const tenant = await createUser({ role: 'TENANT', email: 'tenant-message@test.local' });
    const otherTenant = await createUser({ role: 'TENANT', email: 'other-tenant-message@test.local' });
    const admin = await createUser({ role: 'ADMIN', email: 'admin-message@test.local' });

    return {
      owner,
      tenant,
      otherTenant,
      admin,
      ownerToken: createAccessToken(owner.id),
      tenantToken: createAccessToken(tenant.id),
      otherTenantToken: createAccessToken(otherTenant.id),
      adminToken: createAccessToken(admin.id),
    };
  }

  async function createTestConversation(participantAId: string, participantBId: string, propertyId: string | null = null) {
    const pA = participantAId < participantBId ? participantAId : participantBId;
    const pB = participantAId < participantBId ? participantBId : participantAId;
    return models.Conversation.create({
      participantAId: pA,
      participantBId: pB,
      propertyId,
    });
  }

  describe('POST /api/v1/messages', () => {
    it('sends a message and creates a notification for the receiver', async () => {
      const { owner, tenant, ownerToken } = await seedMessageContext();

      const response = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          receiverId: tenant.id,
          subject: 'Question about unit availability',
          content: 'Is your current lease ending soon?',
        })
        .expect(201);

      expect(response.body.message.senderId).toBe(owner.id);
      expect(response.body.message.receiverId).toBe(tenant.id);
      expect(response.body.message.readAt).toBeNull();

      const notifications = await models.Notification.findAll({ where: { userId: tenant.id } });
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('MESSAGE');
      expect(notifications[0].entityId).toBe(response.body.message.id);
    });

    it('rejects self messaging', async () => {
      const { owner, ownerToken } = await seedMessageContext();

      const response = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          receiverId: owner.id,
          subject: 'Self note',
          content: 'This should not work',
        })
        .expect(400);

      expect(response.body.error).toBe('Sender cannot message themselves');
    });

    it('rejects messaging an inactive receiver', async () => {
      const { ownerToken, tenant } = await seedMessageContext();

      await tenant.update({ accountStatus: 'INACTIVE' });

      const response = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          receiverId: tenant.id,
          subject: 'Question about property',
          content: 'Are you available to chat?',
        })
        .expect(400);

      expect(response.body.error).toBe('Receiver account is not active');
    });

    it('rejects unexpected request body fields', async () => {
      const { tenant, ownerToken } = await seedMessageContext();

      const response = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          receiverId: tenant.id,
          subject: 'Question about property',
          content: 'Is the apartment still available?',
          ignored: 'unexpected',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errors.some((error: any) => error.field === 'ignored')).toBe(true);
    });
  });

  describe('GET /api/v1/messages', () => {
    it('lists a conversation with otherUserId only', async () => {
      const { owner, tenant, otherTenant, ownerToken } = await seedMessageContext();

      const conv1 = await createTestConversation(owner.id, tenant.id);
      const conv2 = await createTestConversation(owner.id, otherTenant.id);

      await models.Message.create({
        senderId: owner.id,
        receiverId: tenant.id,
        conversationId: conv1.id,
        subject: 'A',
        content: 'Conversation A1',
      });
      await models.Message.create({
        senderId: tenant.id,
        receiverId: owner.id,
        conversationId: conv1.id,
        subject: 'B',
        content: 'Conversation A2',
      });
      await models.Message.create({
        senderId: otherTenant.id,
        receiverId: owner.id,
        conversationId: conv2.id,
        subject: 'C',
        content: 'Conversation B1',
      });

      const response = await request(app)
        .get(`/api/v1/messages?otherUserId=${tenant.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((message: any) => {
        return [message.senderId, message.receiverId].includes(owner.id)
          && [message.senderId, message.receiverId].includes(tenant.id);
      })).toBe(true);
    });
  });

  describe('GET /api/v1/messages/:messageId', () => {
    it('returns message details to sender or receiver only', async () => {
      const { owner, tenant, ownerToken } = await seedMessageContext();

      const conv = await createTestConversation(owner.id, tenant.id);
      const message = await models.Message.create({
        senderId: owner.id,
        receiverId: tenant.id,
        conversationId: conv.id,
        subject: 'Lease question',
        content: 'Can we discuss renewal terms?',
      });

      const response = await request(app)
        .get(`/api/v1/messages/${message.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.message.id).toBe(message.id);
      expect(response.body.message.sender.id).toBe(owner.id);
      expect(response.body.message.receiver.id).toBe(tenant.id);
    });
  });

  describe('PUT /api/v1/messages/:messageId/read', () => {
    it('allows the receiver to mark a message as read', async () => {
      const { owner, tenant, tenantToken } = await seedMessageContext();

      const conv = await createTestConversation(owner.id, tenant.id);
      const message = await models.Message.create({
        senderId: owner.id,
        receiverId: tenant.id,
        conversationId: conv.id,
        subject: 'Lease question',
        content: 'Can we discuss renewal terms?',
      });

      await models.Notification.create({
        userId: tenant.id,
        type: 'MESSAGE',
        message: 'You have a new message',
        entityType: 'MESSAGE',
        entityId: message.id,
      });

      const response = await request(app)
        .put(`/api/v1/messages/${message.id}/read`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(response.body.message.readAt).toBeDefined();

      const notification = await models.Notification.findOne({
        where: {
          userId: tenant.id,
          entityType: 'MESSAGE',
          entityId: message.id,
        },
      });

      expect(notification?.isRead).toBe(true);
    });

    it('rejects the sender from marking the message as read', async () => {
      const { owner, tenant, ownerToken } = await seedMessageContext();

      const conv = await createTestConversation(owner.id, tenant.id);
      const message = await models.Message.create({
        senderId: owner.id,
        receiverId: tenant.id,
        conversationId: conv.id,
        subject: 'Lease question',
        content: 'Can we discuss renewal terms?',
      });

      const response = await request(app)
        .put(`/api/v1/messages/${message.id}/read`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });

    it('allows admin to mark any message as read', async () => {
      const { owner, tenant, adminToken, admin } = await seedMessageContext();

      const conv = await createTestConversation(owner.id, tenant.id);
      const message = await models.Message.create({
        senderId: owner.id,
        receiverId: tenant.id,
        conversationId: conv.id,
        subject: 'Lease question',
        content: 'Can we discuss renewal terms?',
      });

      const response = await request(app)
        .put(`/api/v1/messages/${message.id}/read`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message.readAt).toBeDefined();
      expect(response.body.message.receiver.id).toBe(tenant.id);
      expect(response.body.message.sender.id).toBe(owner.id);
      expect(admin.id).toBeDefined();
    });
  });

  describe('GET /api/v1/messages/conversations', () => {
    it('lists all conversations for the authenticated user', async () => {
      const { owner, tenant, otherTenant, ownerToken } = await seedMessageContext();

      const conv1 = await createTestConversation(owner.id, tenant.id);
      const conv2 = await createTestConversation(owner.id, otherTenant.id);

      await models.Message.create({
        senderId: owner.id,
        receiverId: tenant.id,
        conversationId: conv1.id,
        subject: 'Hello',
        content: 'World',
      });

      const response = await request(app)
        .get('/api/v1/messages/conversations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.conversations).toHaveLength(2);
      expect(response.body.conversations.some((c: any) => c.id === conv1.id)).toBe(true);
      expect(response.body.conversations.some((c: any) => c.id === conv2.id)).toBe(true);
    });
  });
});

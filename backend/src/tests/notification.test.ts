import request from 'supertest';
import app from '../app';
import { models } from '../config/database';
import { createAccessToken, createProperty, createRentalUnit, createUser } from './helpers/factories';

describe('Announcement And Notification Foundations', () => {
  async function seedAnnouncementContext() {
    const owner = await createUser({ role: 'OWNER', email: 'owner-announcement@test.local' });
    const otherOwner = await createUser({ role: 'OWNER', email: 'other-owner-announcement@test.local' });
    const tenant = await createUser({ role: 'TENANT', email: 'tenant-announcement@test.local' });
    const otherTenant = await createUser({ role: 'TENANT', email: 'other-tenant-announcement@test.local' });
    const admin = await createUser({ role: 'ADMIN', email: 'admin-announcement@test.local' });

    const property = await createProperty(owner.id);
    const ownerSecondProperty = await createProperty(owner.id, { title: 'Owner Second Property' });
    const otherProperty = await createProperty(otherOwner.id);
    const unit = await createRentalUnit(property.id, { status: 'OCCUPIED' });
    const ownerSecondUnit = await createRentalUnit(ownerSecondProperty.id, { status: 'OCCUPIED' });
    const otherUnit = await createRentalUnit(otherProperty.id, { status: 'OCCUPIED' });

    await models.Lease.create({
      unitId: unit.id,
      tenantId: tenant.id,
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      monthlyRent: 5000,
      depositAmount: 10000,
      status: 'ACTIVE',
    });

    await models.Lease.create({
      unitId: ownerSecondUnit.id,
      tenantId: otherTenant.id,
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      monthlyRent: 6000,
      depositAmount: 12000,
      status: 'ACTIVE',
    });

    await models.Lease.create({
      unitId: otherUnit.id,
      tenantId: otherTenant.id,
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      monthlyRent: 6500,
      depositAmount: 13000,
      status: 'ACTIVE',
    });

    return {
      owner,
      otherOwner,
      tenant,
      otherTenant,
      admin,
      property,
      ownerSecondProperty,
      otherProperty,
      ownerToken: createAccessToken(owner.id),
      otherOwnerToken: createAccessToken(otherOwner.id),
      tenantToken: createAccessToken(tenant.id),
      otherTenantToken: createAccessToken(otherTenant.id),
      adminToken: createAccessToken(admin.id),
    };
  }

  describe('POST /api/v1/announcements', () => {
    it('allows an owner to send a property-scoped announcement', async () => {
      const { owner, ownerToken, tenant, otherTenant, property } = await seedAnnouncementContext();

      const response = await request(app)
        .post('/api/v1/announcements')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Maintenance Notice',
          content: 'Water will be off tomorrow from 9am to 12pm.',
          propertyId: property.id,
        })
        .expect(201);

      expect(response.body.announcement.ownerId).toBe(owner.id);
      expect(response.body.announcement.propertyId).toBe(property.id);

      const tenantNotification = await models.Notification.findOne({
        where: {
          userId: tenant.id,
          entityType: 'ANNOUNCEMENT',
          entityId: response.body.announcement.id,
        },
      });

      const otherTenantNotification = await models.Notification.findOne({
        where: {
          userId: otherTenant.id,
          entityType: 'ANNOUNCEMENT',
          entityId: response.body.announcement.id,
        },
      });

      expect(tenantNotification).not.toBeNull();
      expect(otherTenantNotification).toBeNull();
    });
  });

  describe('GET /api/v1/announcements', () => {
    it('shows a tenant only announcements relevant to their active lease or owner relationship', async () => {
      const { owner, otherOwner, tenantToken, property, otherProperty } = await seedAnnouncementContext();

      const propertyScoped = await models.Announcement.create({
        ownerId: owner.id,
        propertyId: property.id,
        title: 'Scoped Notice',
        content: 'This only applies to your building.',
      });

      const ownerWide = await models.Announcement.create({
        ownerId: owner.id,
        propertyId: null,
        title: 'General Owner Notice',
        content: 'This applies to all occupied properties.',
      });

      await models.Announcement.create({
        ownerId: otherOwner.id,
        propertyId: otherProperty.id,
        title: 'Other Owner Notice',
        content: 'This should not be visible.',
      });

      const response = await request(app)
        .get('/api/v1/announcements')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      const announcementIds = response.body.data.map((announcement: any) => announcement.id);
      expect(announcementIds).toContain(propertyScoped.id);
      expect(announcementIds).toContain(ownerWide.id);
    });
  });

  describe('GET /api/v1/notifications', () => {
    it('lists notifications filtered by isRead', async () => {
      const { tenant, tenantToken } = await seedAnnouncementContext();

      const unread = await models.Notification.create({
        userId: tenant.id,
        type: 'SYSTEM',
        message: 'Unread notification',
        isRead: false,
      });

      await models.Notification.create({
        userId: tenant.id,
        type: 'SYSTEM',
        message: 'Read notification',
        isRead: true,
      });

      const response = await request(app)
        .get('/api/v1/notifications?isRead=false')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(unread.id);
      expect(response.body.data[0].isRead).toBe(false);
    });
  });

  describe('PUT /api/v1/notifications/:notificationId/read', () => {
    it('marks a notification as read', async () => {
      const { tenant, tenantToken } = await seedAnnouncementContext();

      const notification = await models.Notification.create({
        userId: tenant.id,
        type: 'SYSTEM',
        message: 'Please check your inbox',
        isRead: false,
      });

      const response = await request(app)
        .put(`/api/v1/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(response.body.notification.id).toBe(notification.id);
      expect(response.body.notification.isRead).toBe(true);
    });

    it('rejects marking another user notification as read', async () => {
      const { tenant, otherTenantToken } = await seedAnnouncementContext();

      const notification = await models.Notification.create({
        userId: tenant.id,
        type: 'SYSTEM',
        message: 'Please check your inbox',
        isRead: false,
      });

      const response = await request(app)
        .put(`/api/v1/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${otherTenantToken}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });
});

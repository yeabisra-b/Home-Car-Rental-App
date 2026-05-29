import request from 'supertest';
import app from '../app';
import { models } from '../config/database';
import { createAccessToken, createProperty, createRentalUnit, createUser } from './helpers/factories';

describe('Lease Endpoints', () => {
  const leasePayload = {
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    monthlyRent: 6500,
    depositAmount: 13000,
  };

  function dateFromToday(offsetDays: number): string {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + offsetDays);
    return date.toISOString().slice(0, 10);
  }

  async function seedLeaseContext() {
    const owner = await createUser({ role: 'OWNER', email: 'owner-lease@test.local' });
    const otherOwner = await createUser({ role: 'OWNER', email: 'other-owner-lease@test.local' });
    const tenant = await createUser({ role: 'TENANT', email: 'tenant-lease@test.local' });
    const otherTenant = await createUser({ role: 'TENANT', email: 'other-tenant-lease@test.local' });
    const admin = await createUser({ role: 'ADMIN', email: 'admin-lease@test.local' });
    const ownerProperty = await createProperty(owner.id);
    const otherOwnerProperty = await createProperty(otherOwner.id);
    const ownerUnit = await createRentalUnit(ownerProperty.id);
    const otherOwnerUnit = await createRentalUnit(otherOwnerProperty.id);

    return {
      owner,
      otherOwner,
      tenant,
      otherTenant,
      admin,
      ownerToken: createAccessToken(owner.id),
      otherOwnerToken: createAccessToken(otherOwner.id),
      tenantToken: createAccessToken(tenant.id),
      otherTenantToken: createAccessToken(otherTenant.id),
      adminToken: createAccessToken(admin.id),
      ownerUnit,
      otherOwnerUnit,
    };
  }

  describe('POST /api/v1/leases', () => {
    it('creates a lease with tenantId', async () => {
      const { ownerToken, ownerUnit, tenant } = await seedLeaseContext();

      const response = await request(app)
        .post('/api/v1/leases')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          unitId: ownerUnit.id,
          tenantId: tenant.id,
          ...leasePayload,
        })
        .expect(201);

      expect(response.body.lease.unitId).toBe(ownerUnit.id);
      expect(response.body.lease.tenantId).toBe(tenant.id);
      expect(response.body.lease.status).toBe('DRAFT');
    });

    it('creates a lease with tenantEmail', async () => {
      const { ownerToken, ownerUnit, tenant } = await seedLeaseContext();

      const response = await request(app)
        .post('/api/v1/leases')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          unitId: ownerUnit.id,
          tenantEmail: tenant.email,
          ...leasePayload,
        })
        .expect(201);

      expect(response.body.lease.tenantId).toBe(tenant.id);
      expect(response.body.lease.status).toBe('DRAFT');
    });

    it('rejects a duplicate draft or active lease for the same unit', async () => {
      const { ownerToken, ownerUnit, tenant, otherTenant } = await seedLeaseContext();

      await request(app)
        .post('/api/v1/leases')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          unitId: ownerUnit.id,
          tenantId: tenant.id,
          ...leasePayload,
        })
        .expect(201);

      const response = await request(app)
        .post('/api/v1/leases')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          unitId: ownerUnit.id,
          tenantId: otherTenant.id,
          ...leasePayload,
        })
        .expect(400);

      expect(response.body.error).toBe('Only one active or draft lease can exist for a unit at a time');
    });

    it('rejects lease creation by a non-owner', async () => {
      const { tenantToken, ownerUnit, tenant } = await seedLeaseContext();

      const response = await request(app)
        .post('/api/v1/leases')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          unitId: ownerUnit.id,
          tenantId: tenant.id,
          ...leasePayload,
        })
        .expect(403);

      expect(response.body.error).toBe('Only owners can create leases');
    });

    it('rejects unknown fields during lease creation', async () => {
      const { ownerToken, ownerUnit, tenant } = await seedLeaseContext();

      const response = await request(app)
        .post('/api/v1/leases')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          unitId: ownerUnit.id,
          tenantId: tenant.id,
          ...leasePayload,
          unexpectedField: 'not allowed',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'unexpectedField', message: 'Unknown body field' }),
        ])
      );
    });
  });

  describe('GET /api/v1/leases', () => {
    it('lists leases for the owning owner only', async () => {
      const { ownerToken, ownerUnit, otherOwnerUnit, tenant, otherTenant, otherOwnerToken } = await seedLeaseContext();

      await models.Lease.create({
        unitId: ownerUnit.id,
        tenantId: tenant.id,
        ...leasePayload,
      });
      await models.Lease.create({
        unitId: otherOwnerUnit.id,
        tenantId: otherTenant.id,
        ...leasePayload,
      });

      const ownerResponse = await request(app)
        .get('/api/v1/leases')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(ownerResponse.body.data).toHaveLength(1);
      expect(ownerResponse.body.data[0].unit.id).toBe(ownerUnit.id);

      const otherOwnerResponse = await request(app)
        .get('/api/v1/leases')
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .expect(200);

      expect(otherOwnerResponse.body.data).toHaveLength(1);
      expect(otherOwnerResponse.body.data[0].unit.id).toBe(otherOwnerUnit.id);
    });

    it('lists only the current tenant leases', async () => {
      const { tenantToken, ownerUnit, otherOwnerUnit, tenant, otherTenant } = await seedLeaseContext();

      await models.Lease.create({
        unitId: ownerUnit.id,
        tenantId: tenant.id,
        ...leasePayload,
      });
      await models.Lease.create({
        unitId: otherOwnerUnit.id,
        tenantId: otherTenant.id,
        ...leasePayload,
      });

      const response = await request(app)
        .get('/api/v1/leases')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].tenant.id).toBe(tenant.id);
    });

    it('allows admins to list all leases and filter by tenantId', async () => {
      const { adminToken, ownerUnit, otherOwnerUnit, tenant, otherTenant } = await seedLeaseContext();

      const leaseA = await models.Lease.create({
        unitId: ownerUnit.id,
        tenantId: tenant.id,
        ...leasePayload,
      });
      await models.Lease.create({
        unitId: otherOwnerUnit.id,
        tenantId: otherTenant.id,
        ...leasePayload,
      });

      const response = await request(app)
        .get(`/api/v1/leases?tenantId=${tenant.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(leaseA.id);
    });

    it('rejects unknown query parameters', async () => {
      const { adminToken } = await seedLeaseContext();

      const response = await request(app)
        .get('/api/v1/leases?sort=desc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'sort', message: 'Unknown query field' }),
        ])
      );
    });
  });

  describe('GET /api/v1/leases/:leaseId', () => {
    it('returns lease details with tenant, unit, and documents', async () => {
      const { ownerToken, ownerUnit, tenant } = await seedLeaseContext();

      const lease = await models.Lease.create({
        unitId: ownerUnit.id,
        tenantId: tenant.id,
        ...leasePayload,
      });

      const response = await request(app)
        .get(`/api/v1/leases/${lease.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.lease.id).toBe(lease.id);
      expect(response.body.lease.unit.id).toBe(ownerUnit.id);
      expect(response.body.lease.tenant.id).toBe(tenant.id);
      expect(response.body.lease.documents).toEqual([]);
    });

    it('rejects unrelated owners from viewing the lease', async () => {
      const { otherOwnerToken, ownerUnit, tenant } = await seedLeaseContext();

      const lease = await models.Lease.create({
        unitId: ownerUnit.id,
        tenantId: tenant.id,
        ...leasePayload,
      });

      const response = await request(app)
        .get(`/api/v1/leases/${lease.id}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('POST /api/v1/leases/:leaseId/documents', () => {
    it('uploads the first signed document and activates the lease', async () => {
      const { ownerToken, ownerUnit, tenant } = await seedLeaseContext();

      const lease = await models.Lease.create({
        unitId: ownerUnit.id,
        tenantId: tenant.id,
        ...leasePayload,
      });

      const response = await request(app)
        .post(`/api/v1/upload/lease-document/${lease.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .field('documentType', 'SIGNED')
        .attach('file', Buffer.from('%PDF-1.4 lease document'), {
          filename: 'lease.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      expect(response.body.document.leaseId).toBe(lease.id);
      expect(response.body.document.documentType).toBe('SIGNED');
      expect(response.body.fileName).toBeDefined();
      expect(response.body.lease.status).toBe('ACTIVE');

      const updatedUnit = await models.RentalUnit.findByPk(ownerUnit.id);
      expect(updatedUnit?.status).toBe('OCCUPIED');
    });

    it('rejects unrelated owners from uploading a lease document', async () => {
      const { otherOwnerToken, ownerUnit, tenant } = await seedLeaseContext();

      const lease = await models.Lease.create({
        unitId: ownerUnit.id,
        tenantId: tenant.id,
        ...leasePayload,
      });

      const response = await request(app)
        .post(`/api/v1/upload/lease-document/${lease.id}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .attach('file', Buffer.from('%PDF-1.4 lease document'), {
          filename: 'lease.pdf',
          contentType: 'application/pdf',
        })
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('POST /api/v1/leases/:leaseId/move-out-notice', () => {
    it('records a tenant move-out notice', async () => {
      const { tenantToken, ownerUnit, tenant } = await seedLeaseContext();

      const lease = await models.Lease.create({
        unitId: ownerUnit.id,
        tenantId: tenant.id,
        ...leasePayload,
        status: 'ACTIVE',
      });

      const response = await request(app)
        .post(`/api/v1/leases/${lease.id}/move-out-notice`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          noticeDate: '2026-12-01',
          note: 'Planning to vacate at month end',
        })
        .expect(200);

      expect(response.body.lease.moveOutNoticeDate).toBe('2026-12-01');
      expect(response.body.lease.moveOutNoticeNote).toBe('Planning to vacate at month end');
      expect(response.body.message).toBe('Move-out notice recorded');
    });
  });

  describe('POST /api/v1/leases/:leaseId/terminate', () => {
    it('rejects tenant termination before the lease end date', async () => {
      const { tenantToken, ownerUnit, tenant } = await seedLeaseContext();

      const lease = await models.Lease.create({
        unitId: ownerUnit.id,
        tenantId: tenant.id,
        startDate: dateFromToday(-30),
        endDate: dateFromToday(30),
        monthlyRent: leasePayload.monthlyRent,
        depositAmount: leasePayload.depositAmount,
        status: 'ACTIVE',
      });

      await models.RentalUnit.update({ status: 'OCCUPIED' }, { where: { id: ownerUnit.id } });

      const response = await request(app)
        .post(`/api/v1/leases/${lease.id}/terminate`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ reason: 'Trying to leave early' })
        .expect(400);

      expect(response.body.error).toBe('Lease can only be terminated after the end date');
    });

    it('allows tenant termination after the lease end date', async () => {
      const { tenantToken, ownerUnit, tenant } = await seedLeaseContext();

      const lease = await models.Lease.create({
        unitId: ownerUnit.id,
        tenantId: tenant.id,
        startDate: dateFromToday(-60),
        endDate: dateFromToday(-1),
        monthlyRent: leasePayload.monthlyRent,
        depositAmount: leasePayload.depositAmount,
        status: 'ACTIVE',
      });

      await models.RentalUnit.update({ status: 'OCCUPIED' }, { where: { id: ownerUnit.id } });

      const response = await request(app)
        .post(`/api/v1/leases/${lease.id}/terminate`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ reason: 'Moving out after lease completion' })
        .expect(200);

      expect(response.body.lease.status).toBe('TERMINATED');
      expect(response.body.lease.terminationReason).toBe('Moving out after lease completion');

      const updatedUnit = await models.RentalUnit.findByPk(ownerUnit.id);
      expect(updatedUnit?.status).toBe('VACANT');
    });
  });

  describe('POST /api/v1/leases/:leaseId/remove-tenant', () => {
    it('allows the owner to remove a tenant and free the unit', async () => {
      const { ownerToken, ownerUnit, tenant } = await seedLeaseContext();

      const lease = await models.Lease.create({
        unitId: ownerUnit.id,
        tenantId: tenant.id,
        ...leasePayload,
        status: 'ACTIVE',
      });

      await models.RentalUnit.update({ status: 'OCCUPIED' }, { where: { id: ownerUnit.id } });

      const response = await request(app)
        .post(`/api/v1/leases/${lease.id}/remove-tenant`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ reason: 'Payment overdue for more than 30 days' })
        .expect(200);

      expect(response.body.lease.status).toBe('TERMINATED');
      expect(response.body.lease.terminationReason).toBe('Payment overdue for more than 30 days');

      const updatedUnit = await models.RentalUnit.findByPk(ownerUnit.id);
      expect(updatedUnit?.status).toBe('VACANT');
    });

    it('rejects unrelated owners from removing the tenant', async () => {
      const { otherOwnerToken, ownerUnit, tenant } = await seedLeaseContext();

      const lease = await models.Lease.create({
        unitId: ownerUnit.id,
        tenantId: tenant.id,
        ...leasePayload,
        status: 'ACTIVE',
      });

      const response = await request(app)
        .post(`/api/v1/leases/${lease.id}/remove-tenant`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .send({ reason: 'Unauthorized removal attempt' })
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('GET /api/v1/leases/documents/:documentId/download', () => {
    it('downloads a lease document for the owner', async () => {
      const { ownerToken, ownerUnit, tenant } = await seedLeaseContext();
      const lease = await models.Lease.create({
        unitId: ownerUnit.id,
        tenantId: tenant.id,
        ...leasePayload,
      });

      const uploadResponse = await request(app)
        .post(`/api/v1/upload/lease-document/${lease.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('file', Buffer.from('%PDF-1.4 lease document'), {
          filename: 'lease.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      const documentId = uploadResponse.body.document.id;

      await request(app)
        .get(`/api/v1/download/lease-document/${documentId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });

    it('downloads a lease document for the tenant', async () => {
      const { ownerToken, tenantToken, ownerUnit, tenant } = await seedLeaseContext();
      const lease = await models.Lease.create({
        unitId: ownerUnit.id,
        tenantId: tenant.id,
        ...leasePayload,
      });

      const uploadResponse = await request(app)
        .post(`/api/v1/upload/lease-document/${lease.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('file', Buffer.from('%PDF-1.4 lease document'), {
          filename: 'lease.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      const documentId = uploadResponse.body.document.id;

      await request(app)
        .get(`/api/v1/download/lease-document/${documentId}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);
    });

    it('rejects unrelated users from downloading a lease document', async () => {
      const { ownerToken, otherTenantToken, ownerUnit, tenant } = await seedLeaseContext();
      const lease = await models.Lease.create({
        unitId: ownerUnit.id,
        tenantId: tenant.id,
        ...leasePayload,
      });

      const uploadResponse = await request(app)
        .post(`/api/v1/upload/lease-document/${lease.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('file', Buffer.from('%PDF-1.4 lease document'), {
          filename: 'lease.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      const documentId = uploadResponse.body.document.id;

      await request(app)
        .get(`/api/v1/download/lease-document/${documentId}`)
        .set('Authorization', `Bearer ${otherTenantToken}`)
        .expect(403);
    });
  });
});

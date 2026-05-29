import request from 'supertest';
import app from '../app';
import { models } from '../config/database';
import { createAccessToken, createProperty, createRentalUnit, createUser } from './helpers/factories';

describe('Maintenance Request Endpoints', () => {
  async function seedMaintenanceContext() {
    const owner = await createUser({ role: 'OWNER', email: 'owner-maintenance@test.local' });
    const otherOwner = await createUser({ role: 'OWNER', email: 'other-owner-maintenance@test.local' });
    const tenant = await createUser({ role: 'TENANT', email: 'tenant-maintenance@test.local' });
    const otherTenant = await createUser({ role: 'TENANT', email: 'other-tenant-maintenance@test.local' });
    const admin = await createUser({ role: 'ADMIN', email: 'admin-maintenance@test.local' });

    const property = await createProperty(owner.id);
    const otherProperty = await createProperty(otherOwner.id);
    const unit = await createRentalUnit(property.id, { status: 'OCCUPIED' });
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
      unitId: otherUnit.id,
      tenantId: otherTenant.id,
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      monthlyRent: 6000,
      depositAmount: 12000,
      status: 'ACTIVE',
    });

    return {
      owner,
      otherOwner,
      tenant,
      otherTenant,
      admin,
      unit,
      otherUnit,
      ownerToken: createAccessToken(owner.id),
      otherOwnerToken: createAccessToken(otherOwner.id),
      tenantToken: createAccessToken(tenant.id),
      otherTenantToken: createAccessToken(otherTenant.id),
      adminToken: createAccessToken(admin.id),
    };
  }

  describe('POST /api/v1/maintenance-requests', () => {
    it('allows a tenant to create a maintenance request for their leased unit', async () => {
      const { tenantToken, tenant, unit } = await seedMaintenanceContext();

      const response = await request(app)
        .post('/api/v1/maintenance-requests')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          unitId: unit.id,
          category: 'Plumbing',
          priority: 'HIGH',
          description: 'Water leakage in bathroom',
        })
        .expect(201);

      expect(response.body.request.unitId).toBe(unit.id);
      expect(response.body.request.tenantId).toBe(tenant.id);
      expect(response.body.request.priority).toBe('HIGH');
      expect(response.body.request.status).toBe('OPEN');
    });

    it('rejects a maintenance request for a unit the tenant does not lease', async () => {
      const { tenantToken, otherUnit } = await seedMaintenanceContext();

      const response = await request(app)
        .post('/api/v1/maintenance-requests')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          unitId: otherUnit.id,
          category: 'Electrical',
          priority: 'MEDIUM',
          description: 'Outlet not working',
        })
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });

    it('rejects unknown fields on request creation', async () => {
      const { tenantToken, unit } = await seedMaintenanceContext();

      const response = await request(app)
        .post('/api/v1/maintenance-requests')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          unitId: unit.id,
          category: 'Plumbing',
          priority: 'HIGH',
          description: 'Water leakage in bathroom',
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

  describe('GET /api/v1/maintenance-requests', () => {
    it('allows an owner to list requests for owned units only', async () => {
      const { ownerToken, tenant, otherTenant, unit, otherUnit } = await seedMaintenanceContext();

      await models.MaintenanceRequest.create({
        unitId: unit.id,
        tenantId: tenant.id,
        category: 'Plumbing',
        priority: 'HIGH',
        description: 'Leak in the kitchen',
      });

      await models.MaintenanceRequest.create({
        unitId: otherUnit.id,
        tenantId: otherTenant.id,
        category: 'Electrical',
        priority: 'LOW',
        description: 'Broken hallway light',
      });

      const response = await request(app)
        .get('/api/v1/maintenance-requests')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].unit.id).toBe(unit.id);
    });

    it('allows a tenant to list only their own requests', async () => {
      const { tenantToken, tenant, otherTenant, unit, otherUnit } = await seedMaintenanceContext();

      await models.MaintenanceRequest.create({
        unitId: unit.id,
        tenantId: tenant.id,
        category: 'Plumbing',
        priority: 'HIGH',
        description: 'Leak in the kitchen',
      });

      await models.MaintenanceRequest.create({
        unitId: otherUnit.id,
        tenantId: otherTenant.id,
        category: 'Electrical',
        priority: 'LOW',
        description: 'Broken hallway light',
      });

      const response = await request(app)
        .get('/api/v1/maintenance-requests')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].tenant.id).toBe(tenant.id);
    });

    it('allows an admin to list all requests', async () => {
      const { adminToken, tenant, otherTenant, unit, otherUnit } = await seedMaintenanceContext();

      await models.MaintenanceRequest.create({
        unitId: unit.id,
        tenantId: tenant.id,
        category: 'Plumbing',
        priority: 'HIGH',
        description: 'Leak in the kitchen',
      });

      await models.MaintenanceRequest.create({
        unitId: otherUnit.id,
        tenantId: otherTenant.id,
        category: 'Electrical',
        priority: 'LOW',
        description: 'Broken hallway light',
      });

      const response = await request(app)
        .get('/api/v1/maintenance-requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    });

    it('rejects unknown query parameters', async () => {
      const { adminToken } = await seedMaintenanceContext();

      const response = await request(app)
        .get('/api/v1/maintenance-requests?sort=desc')
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

  describe('GET /api/v1/maintenance-requests/:requestId', () => {
    it('returns a maintenance request with evidence array', async () => {
      const { tenantToken, tenant, unit } = await seedMaintenanceContext();

      const maintenanceRequest = await models.MaintenanceRequest.create({
        unitId: unit.id,
        tenantId: tenant.id,
        category: 'Plumbing',
        priority: 'HIGH',
        description: 'Leak in the kitchen',
      });

      const response = await request(app)
        .get(`/api/v1/maintenance-requests/${maintenanceRequest.id}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(response.body.request.id).toBe(maintenanceRequest.id);
      expect(response.body.request.status).toBe('OPEN');
      expect(response.body.request.evidence).toEqual([]);
    });

    it('rejects an unrelated owner from viewing the request', async () => {
      const { otherOwnerToken, tenant, unit } = await seedMaintenanceContext();

      const maintenanceRequest = await models.MaintenanceRequest.create({
        unitId: unit.id,
        tenantId: tenant.id,
        category: 'Plumbing',
        priority: 'HIGH',
        description: 'Leak in the kitchen',
      });

      const response = await request(app)
        .get(`/api/v1/maintenance-requests/${maintenanceRequest.id}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('POST /api/v1/maintenance-requests/:requestId/evidence', () => {
    it('allows a tenant to upload evidence to their own request', async () => {
      const { tenantToken, tenant, unit } = await seedMaintenanceContext();

      const maintenanceRequest = await models.MaintenanceRequest.create({
        unitId: unit.id,
        tenantId: tenant.id,
        category: 'Plumbing',
        priority: 'HIGH',
        description: 'Leak in the kitchen',
      });

      const response = await request(app)
        .post(`/api/v1/upload/maintenance-evidence/${maintenanceRequest.id}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .attach('file', Buffer.from('%PDF-1.4 maintenance evidence'), {
          filename: 'maintenance-evidence.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      expect(response.body.evidence.requestId).toBe(maintenanceRequest.id);
      expect(response.body.fileName).toBeDefined();

      const detailResponse = await request(app)
        .get(`/api/v1/maintenance-requests/${maintenanceRequest.id}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(detailResponse.body.request.evidence).toHaveLength(1);
      expect(detailResponse.body.request.evidence[0].filePath).toContain('uploads/maintenance/');
    });

    it('rejects evidence upload for another tenant request', async () => {
      const { otherTenantToken, tenant, unit } = await seedMaintenanceContext();

      const maintenanceRequest = await models.MaintenanceRequest.create({
        unitId: unit.id,
        tenantId: tenant.id,
        category: 'Plumbing',
        priority: 'HIGH',
        description: 'Leak in the kitchen',
      });

      const response = await request(app)
        .post(`/api/v1/upload/maintenance-evidence/${maintenanceRequest.id}`)
        .set('Authorization', `Bearer ${otherTenantToken}`)
        .attach('file', Buffer.from('%PDF-1.4 maintenance evidence'), {
          filename: 'maintenance-evidence.pdf',
          contentType: 'application/pdf',
        })
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('PUT /api/v1/maintenance-requests/:requestId/status', () => {
    it('allows an owner to move a request to in progress', async () => {
      const { ownerToken, tenant, unit } = await seedMaintenanceContext();

      const maintenanceRequest = await models.MaintenanceRequest.create({
        unitId: unit.id,
        tenantId: tenant.id,
        category: 'Plumbing',
        priority: 'HIGH',
        description: 'Leak in the kitchen',
      });

      const response = await request(app)
        .put(`/api/v1/maintenance-requests/${maintenanceRequest.id}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'IN_PROGRESS',
          note: 'Technician scheduled for tomorrow morning',
        })
        .expect(200);

      expect(response.body.request.status).toBe('IN_PROGRESS');
      expect(response.body.request.note).toBe('Technician scheduled for tomorrow morning');
      expect(response.body.request.resolvedAt).toBeNull();
    });

    it('allows an owner to resolve a request and records resolution metadata', async () => {
      const { owner, ownerToken, tenant, unit } = await seedMaintenanceContext();

      const maintenanceRequest = await models.MaintenanceRequest.create({
        unitId: unit.id,
        tenantId: tenant.id,
        category: 'Plumbing',
        priority: 'HIGH',
        description: 'Leak in the kitchen',
        status: 'IN_PROGRESS',
      });

      const response = await request(app)
        .put(`/api/v1/maintenance-requests/${maintenanceRequest.id}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'RESOLVED',
          note: 'Plumber replaced the damaged pipe',
        })
        .expect(200);

      expect(response.body.request.status).toBe('RESOLVED');
      expect(response.body.request.note).toBe('Plumber replaced the damaged pipe');
      expect(response.body.request.resolvedAt).toBeDefined();
      expect(response.body.request.resolver.id).toBe(owner.id);
    });

    it('rejects status updates from an unrelated owner', async () => {
      const { otherOwnerToken, tenant, unit } = await seedMaintenanceContext();

      const maintenanceRequest = await models.MaintenanceRequest.create({
        unitId: unit.id,
        tenantId: tenant.id,
        category: 'Plumbing',
        priority: 'HIGH',
        description: 'Leak in the kitchen',
      });

      const response = await request(app)
        .put(`/api/v1/maintenance-requests/${maintenanceRequest.id}/status`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .send({
          status: 'IN_PROGRESS',
          note: 'Trying to take over another owner request',
        })
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });

    it('rejects invalid status transitions', async () => {
      const { ownerToken, tenant, unit } = await seedMaintenanceContext();

      const maintenanceRequest = await models.MaintenanceRequest.create({
        unitId: unit.id,
        tenantId: tenant.id,
        category: 'Plumbing',
        priority: 'HIGH',
        description: 'Leak in the kitchen',
      });

      const response = await request(app)
        .put(`/api/v1/maintenance-requests/${maintenanceRequest.id}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'RESOLVED',
          note: 'Skipping directly to resolved',
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid maintenance status transition');
    });
  });

  describe('GET /api/v1/maintenance-requests/evidence/:evidenceId/download', () => {
    it('allows owner to download maintenance evidence for their owned unit', async () => {
      const { ownerToken, tenant, unit } = await seedMaintenanceContext();

      const maintenanceRequest = await models.MaintenanceRequest.create({
        unitId: unit.id,
        tenantId: tenant.id,
        category: 'Plumbing',
        priority: 'HIGH',
        description: 'Leak in the kitchen',
      });

      const uploadResponse = await request(app)
        .post(`/api/v1/upload/maintenance-evidence/${maintenanceRequest.id}`)
        .set('Authorization', `Bearer ${createAccessToken(tenant.id)}`)
        .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08]), {
          filename: 'evidence.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      const evidenceId = uploadResponse.body.evidence.id;

      await request(app)
        .get(`/api/v1/download/maintenance-evidence/${evidenceId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });

    it('allows tenant to download their own maintenance evidence', async () => {
      const { tenant, unit } = await seedMaintenanceContext();
      const tenantToken = createAccessToken(tenant.id);

      const maintenanceRequest = await models.MaintenanceRequest.create({
        unitId: unit.id,
        tenantId: tenant.id,
        category: 'Plumbing',
        priority: 'HIGH',
        description: 'Leak in the kitchen',
      });

      const uploadResponse = await request(app)
        .post(`/api/v1/upload/maintenance-evidence/${maintenanceRequest.id}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08]), {
          filename: 'evidence.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      const evidenceId = uploadResponse.body.evidence.id;

      await request(app)
        .get(`/api/v1/download/maintenance-evidence/${evidenceId}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);
    });
  });
});

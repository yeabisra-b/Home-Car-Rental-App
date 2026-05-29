import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../app';
import { User } from '../models/User';
import { Property } from '../models/Property';
import { RentalUnit } from '../models/RentalUnit';
import { Lease } from '../models/Lease';
import { Invoice } from '../models/Invoice';
import { MaintenanceRequest } from '../models/MaintenanceRequest';
import { generateAuthTokens } from '../services/tokenService';

describe('File API Reorganization', () => {
  let ownerToken: string;
  let tenantToken: string;
  let owner: any;
  let tenant: any;
  let property: any;
  let unit: any;
  let lease: any;
  let invoice: any;
  let maintenanceRequest: any;

  const testJpgPath = path.resolve(__dirname, 'test-file.jpg');
  const testPdfPath = path.resolve(__dirname, 'test-file.pdf');

  beforeAll(async () => {
    // Create test JPG with valid signature
    const jpgHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    fs.writeFileSync(testJpgPath, jpgHeader);

    // Create test PDF with valid signature
    const pdfHeader = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj');
    fs.writeFileSync(testPdfPath, pdfHeader);
  });

  beforeEach(async () => {
    // Create users
    owner = await User.create({
      firstName: 'Owner',
      lastName: 'User',
      email: 'owner-files@example.com',
      password: 'password123',
      role: 'OWNER',
      accountStatus: 'ACTIVE',
    } as any);
    ownerToken = generateAuthTokens(owner).accessToken;

    tenant = await User.create({
      firstName: 'Tenant',
      lastName: 'User',
      email: 'tenant-files@example.com',
      password: 'password123',
      role: 'TENANT',
      accountStatus: 'ACTIVE',
    } as any);
    tenantToken = generateAuthTokens(tenant).accessToken;

    // Create property and unit
    property = await Property.create({
      ownerId: owner.id,
      title: 'Test Property',
      type: 'BUILDING',
      addressCity: 'Addis Ababa',
      status: 'ACTIVE',
    } as any);

    unit = await RentalUnit.create({
      propertyId: property.id,
      unitIdentifier: 'U1',
      rentAmount: 5000,
      status: 'VACANT',
    } as any);

    // Create lease
    lease = await Lease.create({
      unitId: unit.id,
      tenantId: tenant.id,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      monthlyRent: 5000,
      depositAmount: 5000,
      status: 'ACTIVE',
    } as any);

    // Create invoice
    invoice = await Invoice.create({
      leaseId: lease.id,
      billingMonth: new Date().toISOString().split('T')[0],
      amountDue: 5000,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'UNPAID',
    } as any);

    // Create maintenance request
    maintenanceRequest = await MaintenanceRequest.create({
      unitId: unit.id,
      tenantId: tenant.id,
      category: 'Plumbing',
      priority: 'HIGH',
      description: 'Test request',
      status: 'OPEN',
    } as any);
  });

  afterAll(async () => {
    if (fs.existsSync(testJpgPath)) fs.unlinkSync(testJpgPath);
    if (fs.existsSync(testPdfPath)) fs.unlinkSync(testPdfPath);
  });

  describe('Uploads', () => {
    it('should upload user profile picture', async () => {
      const res = await request(app)
        .post(`/api/v1/upload/user-profile/${owner.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('file', testJpgPath);

      if (res.status !== 200) {
        throw new Error(`Profile Upload Error (${res.status}): ${JSON.stringify(res.body)}`);
      }
      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.fileName).toBeDefined();
    });

    it('should upload property media', async () => {
      const res = await request(app)
        .post(`/api/v1/upload/property-media/${property.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('file', testJpgPath);

      if (res.status !== 201) {
        throw new Error(`Property Upload Error (${res.status}): ${JSON.stringify(res.body)}`);
      }
      expect(res.status).toBe(201);
      expect(res.body.media).toBeDefined();
      expect(res.body.fileName).toBeDefined();
    });

    it('should upload maintenance evidence', async () => {
      const res = await request(app)
        .post(`/api/v1/upload/maintenance-evidence/${maintenanceRequest.id}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .attach('file', testJpgPath);

      if (res.status !== 201) {
        throw new Error(`Maintenance Upload Error (${res.status}): ${JSON.stringify(res.body)}`);
      }
      expect(res.status).toBe(201);
      expect(res.body.evidence).toBeDefined();
      expect(res.body.fileName).toBeDefined();
    });

    it('should upload lease document', async () => {
      const res = await request(app)
        .post(`/api/v1/upload/lease-document/${lease.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('file', testPdfPath)
        .field('documentType', 'SIGNED');

      if (res.status !== 201) {
        throw new Error(`Lease Upload Error (${res.status}): ${JSON.stringify(res.body)}`);
      }
      expect(res.status).toBe(201);
      expect(res.body.document).toBeDefined();
      expect(res.body.fileName).toBeDefined();
    });

    it('should upload payment receipt', async () => {
      const res = await request(app)
        .post(`/api/v1/upload/payment-receipt/${invoice.id}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .attach('file', testJpgPath);

      if (res.status !== 201) {
        throw new Error(`Receipt Upload Error (${res.status}): ${JSON.stringify(res.body)}`);
      }
      expect(res.status).toBe(201);
      expect(res.body.receipt).toBeDefined();
      expect(res.body.fileName).toBeDefined();
    });
  });

  describe('Downloads', () => {
    it('should download user profile picture', async () => {
      // Ensure there is a profile picture
      await request(app)
        .post(`/api/v1/upload/user-profile/${owner.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('file', testJpgPath);

      const res = await request(app)
        .get(`/api/v1/download/user-profile/${owner.id}`);

      expect(res.status).toBe(200);
    });

    it('should download property media', async () => {
      const uploadRes = await request(app)
        .post(`/api/v1/upload/property-media/${property.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('file', testJpgPath);

      if (!uploadRes.body.media) throw new Error(`Property media upload failed for download test: ${JSON.stringify(uploadRes.body)}`);
      const mediaId = uploadRes.body.media.id;

      const res = await request(app)
        .get(`/api/v1/download/property-media/${mediaId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
    });

    it('should download maintenance evidence', async () => {
      const uploadRes = await request(app)
        .post(`/api/v1/upload/maintenance-evidence/${maintenanceRequest.id}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .attach('file', testJpgPath);

      if (!uploadRes.body.evidence) throw new Error(`Maintenance evidence upload failed for download test: ${JSON.stringify(uploadRes.body)}`);
      const evidenceId = uploadRes.body.evidence.id;

      const res = await request(app)
        .get(`/api/v1/download/maintenance-evidence/${evidenceId}`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
    });

    it('should download lease document', async () => {
      const uploadRes = await request(app)
        .post(`/api/v1/upload/lease-document/${lease.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('file', testPdfPath)
        .field('documentType', 'SIGNED');

      if (!uploadRes.body.document) throw new Error(`Lease document upload failed for download test: ${JSON.stringify(uploadRes.body)}`);
      const documentId = uploadRes.body.document.id;

      const res = await request(app)
        .get(`/api/v1/download/lease-document/${documentId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
    });

    it('should download payment receipt', async () => {
      const uploadRes = await request(app)
        .post(`/api/v1/upload/payment-receipt/${invoice.id}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .attach('file', testJpgPath);

      if (!uploadRes.body.receipt) throw new Error(`Payment receipt upload failed for download test: ${JSON.stringify(uploadRes.body)}`);
      const receiptId = uploadRes.body.receipt.id;

      const res = await request(app)
        .get(`/api/v1/download/payment-receipt/${receiptId}`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
    });
  });
});

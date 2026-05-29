import request from 'supertest';
import app from '../app';
import { models } from '../config/database';
import { markOverdueInvoices } from '../services/invoiceService';
import { createAccessToken, createProperty, createRentalUnit, createUser } from './helpers/factories';

describe('Invoice Endpoints', () => {
  const leasePayload = {
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    monthlyRent: 6500,
    depositAmount: 13000,
    status: 'ACTIVE' as const,
  };

  async function seedInvoiceContext() {
    const owner = await createUser({ role: 'OWNER', email: 'owner-invoice@test.local' });
    const otherOwner = await createUser({ role: 'OWNER', email: 'other-owner-invoice@test.local' });
    const tenant = await createUser({ role: 'TENANT', email: 'tenant-invoice@test.local' });
    const otherTenant = await createUser({ role: 'TENANT', email: 'other-tenant-invoice@test.local' });
    const admin = await createUser({ role: 'ADMIN', email: 'admin-invoice@test.local' });

    const property = await createProperty(owner.id);
    const otherProperty = await createProperty(otherOwner.id);
    const unit = await createRentalUnit(property.id, { rentAmount: leasePayload.monthlyRent, status: 'OCCUPIED' });
    const otherUnit = await createRentalUnit(otherProperty.id, { rentAmount: 7200, status: 'OCCUPIED' });

    const lease = await models.Lease.create({
      unitId: unit.id,
      tenantId: tenant.id,
      ...leasePayload,
    });
    const otherLease = await models.Lease.create({
      unitId: otherUnit.id,
      tenantId: otherTenant.id,
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      monthlyRent: 7200,
      depositAmount: 10000,
      status: 'ACTIVE',
    });

    return {
      owner,
      otherOwner,
      tenant,
      otherTenant,
      admin,
      lease,
      otherLease,
      ownerToken: createAccessToken(owner.id),
      otherOwnerToken: createAccessToken(otherOwner.id),
      tenantToken: createAccessToken(tenant.id),
      otherTenantToken: createAccessToken(otherTenant.id),
      adminToken: createAccessToken(admin.id),
    };
  }

  describe('POST /api/v1/invoices/generate-monthly', () => {
    it('generates monthly invoices for active leases', async () => {
      const { adminToken } = await seedInvoiceContext();

      const response = await request(app)
        .post('/api/v1/invoices/generate-monthly')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingMonth: '2026-04-01' })
        .expect(200);

      expect(response.body.message).toBe('Monthly invoice generation completed');
      expect(response.body.billingMonth).toBe('2026-04-01');
      expect(response.body.generatedCount).toBe(2);
      expect(response.body.skippedCount).toBe(0);
    });

    it('is idempotent for the same month', async () => {
      const { adminToken } = await seedInvoiceContext();

      await request(app)
        .post('/api/v1/invoices/generate-monthly')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingMonth: '2026-04-01' })
        .expect(200);

      const response = await request(app)
        .post('/api/v1/invoices/generate-monthly')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingMonth: '2026-04-01' })
        .expect(200);

      expect(response.body.generatedCount).toBe(0);
      expect(response.body.skippedCount).toBe(2);
    });
  });

  describe('GET /api/v1/invoices', () => {
    it('allows tenants to list only their own invoices', async () => {
      const { adminToken, tenantToken, lease, otherLease } = await seedInvoiceContext();

      await request(app)
        .post('/api/v1/invoices/generate-monthly')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingMonth: '2026-04-01' })
        .expect(200);

      const response = await request(app)
        .get('/api/v1/invoices')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].leaseId).toBe(lease.id);
      expect(response.body.data[0].lease.id).not.toBe(otherLease.id);
    });

    it('allows owners to list invoices for owned leases only', async () => {
      const { adminToken, ownerToken, lease, otherLease } = await seedInvoiceContext();

      await request(app)
        .post('/api/v1/invoices/generate-monthly')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingMonth: '2026-04-01' })
        .expect(200);

      const response = await request(app)
        .get('/api/v1/invoices')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].leaseId).toBe(lease.id);
      expect(response.body.data[0].lease.id).not.toBe(otherLease.id);
    });

    it('rejects unknown query parameters', async () => {
      const { ownerToken } = await seedInvoiceContext();

      const response = await request(app)
        .get('/api/v1/invoices?sort=desc')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'sort', message: 'Unknown query field' }),
        ])
      );
    });
  });

  describe('GET /api/v1/invoices/:invoiceId', () => {
    it('returns invoice details with receipts', async () => {
      const { adminToken, tenantToken, lease } = await seedInvoiceContext();

      await request(app)
        .post('/api/v1/invoices/generate-monthly')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingMonth: '2026-04-01' })
        .expect(200);

      const invoice = await models.Invoice.findOne({ where: { leaseId: lease.id, billingMonth: '2026-04-01' } });

      const response = await request(app)
        .get(`/api/v1/invoices/${invoice!.id}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(response.body.invoice.id).toBe(invoice!.id);
      expect(response.body.invoice.billingMonth).toBe('2026-04-01');
      expect(response.body.invoice.receipts).toEqual([]);
    });
  });

  describe('POST /api/v1/invoices/:invoiceId/receipts', () => {
    it('allows a tenant to upload a receipt for their own invoice', async () => {
      const { adminToken, tenantToken, lease } = await seedInvoiceContext();

      await request(app)
        .post('/api/v1/invoices/generate-monthly')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingMonth: '2026-04-01' })
        .expect(200);

      const invoice = await models.Invoice.findOne({ where: { leaseId: lease.id, billingMonth: '2026-04-01' } });

      const response = await request(app)
        .post(`/api/v1/upload/payment-receipt/${invoice!.id}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .field('transactionRef', 'TX99231')
        .field('paymentMethod', 'BANK_TRANSFER')
        .attach('file', Buffer.from('%PDF-1.4 payment receipt'), {
          filename: 'receipt.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      expect(response.body.receipt.invoiceId).toBe(invoice!.id);
      expect(response.body.fileName).toBeDefined();
      expect(response.body.receipt.transactionRef).toBe('TX99231');
      expect(response.body.invoice.status).toBe('PENDING_REVIEW');
    });

    it('rejects receipt upload by an unrelated tenant', async () => {
      const { adminToken, otherTenantToken, lease } = await seedInvoiceContext();

      await request(app)
        .post('/api/v1/invoices/generate-monthly')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingMonth: '2026-04-01' })
        .expect(200);

      const invoice = await models.Invoice.findOne({ where: { leaseId: lease.id, billingMonth: '2026-04-01' } });

      const response = await request(app)
        .post(`/api/v1/upload/payment-receipt/${invoice!.id}`)
        .set('Authorization', `Bearer ${otherTenantToken}`)
        .attach('file', Buffer.from('%PDF-1.4 payment receipt'), {
          filename: 'receipt.pdf',
          contentType: 'application/pdf',
        })
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('PUT /api/v1/invoices/:invoiceId/status', () => {
    it('allows an owner to approve a receipt and mark the invoice paid', async () => {
      const { adminToken, tenantToken, ownerToken, lease } = await seedInvoiceContext();

      await request(app)
        .post('/api/v1/invoices/generate-monthly')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingMonth: '2026-04-01' })
        .expect(200);

      const invoice = await models.Invoice.findOne({ where: { leaseId: lease.id, billingMonth: '2026-04-01' } });

      await request(app)
        .post(`/api/v1/upload/payment-receipt/${invoice!.id}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .attach('file', Buffer.from('%PDF-1.4 payment receipt'), {
          filename: 'receipt.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      const response = await request(app)
        .put(`/api/v1/invoices/${invoice!.id}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'PAID', reviewNote: 'Receipt amount verified' })
        .expect(200);

      expect(response.body.invoice.status).toBe('PAID');
      expect(response.body.invoice.reviewNote).toBe('Receipt amount verified');
      expect(response.body.invoice.reviewedBy).toBeDefined();
      expect(response.body.invoice.reviewedAt).toBeDefined();
    });

    it('allows an owner to reject a receipt and return the invoice to unpaid', async () => {
      const { adminToken, tenantToken, ownerToken, lease } = await seedInvoiceContext();

      await request(app)
        .post('/api/v1/invoices/generate-monthly')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingMonth: '2026-04-01' })
        .expect(200);

      const invoice = await models.Invoice.findOne({ where: { leaseId: lease.id, billingMonth: '2026-04-01' } });

      await request(app)
        .post(`/api/v1/upload/payment-receipt/${invoice!.id}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .attach('file', Buffer.from('%PDF-1.4 payment receipt'), {
          filename: 'receipt.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      const response = await request(app)
        .put(`/api/v1/invoices/${invoice!.id}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'UNPAID', reviewNote: 'Receipt amount mismatch' })
        .expect(200);

      expect(response.body.invoice.status).toBe('UNPAID');
      expect(response.body.invoice.reviewNote).toBe('Receipt amount mismatch');
    });

    it('rejects unknown fields when reviewing invoice status', async () => {
      const { adminToken, tenantToken, ownerToken, lease } = await seedInvoiceContext();

      await request(app)
        .post('/api/v1/invoices/generate-monthly')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingMonth: '2026-04-01' })
        .expect(200);

      const invoice = await models.Invoice.findOne({ where: { leaseId: lease.id, billingMonth: '2026-04-01' } });

      await request(app)
        .post(`/api/v1/upload/payment-receipt/${invoice!.id}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .attach('file', Buffer.from('%PDF-1.4 payment receipt'), {
          filename: 'receipt.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      const response = await request(app)
        .put(`/api/v1/invoices/${invoice!.id}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'PAID', reviewNote: 'Looks good', approvalCode: 'extra' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'approvalCode', message: 'Unknown body field' }),
        ])
      );
    });
  });

  describe('overdue job', () => {
    it('marks past-due unpaid invoices as overdue', async () => {
      const { lease } = await seedInvoiceContext();

      const invoice = await models.Invoice.create({
        leaseId: lease.id,
        billingMonth: '2026-03-01',
        amountDue: 6500,
        dueDate: '2026-03-05',
        status: 'UNPAID',
      });

      const result = await markOverdueInvoices('2026-03-10');
      const updatedInvoice = await models.Invoice.findByPk(invoice.id);

      expect(result.updatedCount).toBe(1);
      expect(updatedInvoice?.status).toBe('OVERDUE');
    });
  });

  describe('GET /api/v1/invoices/receipts/:receiptId/download', () => {
    it('allows owner to download a receipt for one of their invoices', async () => {
      const { adminToken, tenantToken, ownerToken, lease } = await seedInvoiceContext();

      await request(app)
        .post('/api/v1/invoices/generate-monthly')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingMonth: '2026-04-01' })
        .expect(200);

      const invoice = await models.Invoice.findOne({ where: { leaseId: lease.id, billingMonth: '2026-04-01' } });

      const uploadResponse = await request(app)
        .post(`/api/v1/upload/payment-receipt/${invoice!.id}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .attach('file', Buffer.from('%PDF-1.4 payment receipt'), {
          filename: 'receipt.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      const receiptId = uploadResponse.body.receipt.id;

      await request(app)
        .get(`/api/v1/download/payment-receipt/${receiptId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });

    it('allows tenant to download their own receipt', async () => {
      const { adminToken, tenantToken, lease } = await seedInvoiceContext();

      await request(app)
        .post('/api/v1/invoices/generate-monthly')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingMonth: '2026-04-01' })
        .expect(200);

      const invoice = await models.Invoice.findOne({ where: { leaseId: lease.id, billingMonth: '2026-04-01' } });

      const uploadResponse = await request(app)
        .post(`/api/v1/upload/payment-receipt/${invoice!.id}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .attach('file', Buffer.from('%PDF-1.4 payment receipt'), {
          filename: 'receipt.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      const receiptId = uploadResponse.body.receipt.id;

      await request(app)
        .get(`/api/v1/download/payment-receipt/${receiptId}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);
    });
  });
});

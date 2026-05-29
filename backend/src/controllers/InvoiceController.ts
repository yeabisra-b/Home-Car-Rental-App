import { Response } from 'express';
import path from 'path';
import { sendOkResource, sendPaginated } from '../http/responses';
import { AuthRequest } from '../middleware/auth';
import {
  generateMonthlyInvoices,
  getInvoiceForUser,
  listInvoicesForUser,
  reviewInvoiceStatusForUser,
  uploadReceiptForTenant,
  getPaymentReceiptPath,
} from '../services/invoiceService';

export const getInvoices = async (req: AuthRequest, res: Response) => {
  const result = await listInvoicesForUser(req.user, {
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    leaseId: typeof req.query.leaseId === 'string' ? req.query.leaseId : undefined,
    billingMonth: typeof req.query.billingMonth === 'string' ? req.query.billingMonth : undefined,
    page: typeof req.query.page === 'string' ? req.query.page : undefined,
    limit: typeof req.query.limit === 'string' ? req.query.limit : undefined,
  });

  return sendPaginated(res, result.data, result.total, result.page, result.totalPages);
};

export const getInvoice = async (req: AuthRequest, res: Response) => {
  const { invoiceId } = req.params;
  const invoice = await getInvoiceForUser(req.user, Array.isArray(invoiceId) ? invoiceId[0] : invoiceId);
  return sendOkResource(res, 'invoice', invoice);
};

export const generateInvoices = async (req: AuthRequest, res: Response) => {
  return res.json(await generateMonthlyInvoices(req.user, req.body));
};

export const uploadReceipt = async (req: AuthRequest, res: Response) => {
  const { invoiceId } = req.params;
  const result = await uploadReceiptForTenant(
    req.user,
    Array.isArray(invoiceId) ? invoiceId[0] : invoiceId,
    req.file,
    req.body
  );
  return res.status(201).json({
    ...result,
    fileName: req.file?.filename
  });
};

export const reviewInvoiceStatus = async (req: AuthRequest, res: Response) => {
  const { invoiceId } = req.params;
  const invoice = await reviewInvoiceStatusForUser(
    req.user,
    Array.isArray(invoiceId) ? invoiceId[0] : invoiceId,
    req.body
  );

  return sendOkResource(res, 'invoice', invoice);
};

export const downloadPaymentReceipt = async (req: AuthRequest, res: Response) => {
  const { receiptId } = req.params;
  const filePath = await getPaymentReceiptPath(req.user, Array.isArray(receiptId) ? receiptId[0] : receiptId);
  res.sendFile(path.resolve(filePath));
};

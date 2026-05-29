import { Response } from 'express';
import path from 'path';
import { sendCreatedResource, sendOkResource, sendPaginated } from '../http/responses';
import { AuthRequest } from '../middleware/auth';
import {
  createLeaseForOwner,
  getLeaseForUser,
  listLeasesForUser,
  removeTenantFromLeaseForOwner,
  submitMoveOutNoticeForTenant,
  terminateLeaseForTenant,
  uploadLeaseDocumentForOwner,
  getLeaseDocumentPath,
} from '../services/leaseService';

export const createLease = async (req: AuthRequest, res: Response) => {
  const lease = await createLeaseForOwner(req.user, req.body);
  return sendCreatedResource(res, 'lease', lease);
};

export const getLeases = async (req: AuthRequest, res: Response) => {
  const result = await listLeasesForUser(req.user, {
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    unitId: typeof req.query.unitId === 'string' ? req.query.unitId : undefined,
    tenantId: typeof req.query.tenantId === 'string' ? req.query.tenantId : undefined,
    page: typeof req.query.page === 'string' ? req.query.page : undefined,
    limit: typeof req.query.limit === 'string' ? req.query.limit : undefined,
  });

  return sendPaginated(res, result.data, result.total, result.page, result.totalPages);
};

export const getLease = async (req: AuthRequest, res: Response) => {
  const { leaseId } = req.params;
  const lease = await getLeaseForUser(req.user, Array.isArray(leaseId) ? leaseId[0] : leaseId);
  return sendOkResource(res, 'lease', lease);
};

export const uploadLeaseDocument = async (req: AuthRequest, res: Response) => {
  const { leaseId } = req.params;
  const result = await uploadLeaseDocumentForOwner(
    req.user,
    Array.isArray(leaseId) ? leaseId[0] : leaseId,
    req.file,
    req.body
  );

  return res.status(201).json({
    ...result,
    fileName: req.file?.filename
  });
};

export const submitMoveOutNotice = async (req: AuthRequest, res: Response) => {
  const { leaseId } = req.params;
  const lease = await submitMoveOutNoticeForTenant(
    req.user,
    Array.isArray(leaseId) ? leaseId[0] : leaseId,
    req.body
  );

  return sendOkResource(res, 'lease', lease, {
    message: 'Move-out notice recorded',
  });
};

export const terminateLease = async (req: AuthRequest, res: Response) => {
  const { leaseId } = req.params;
  const lease = await terminateLeaseForTenant(
    req.user,
    Array.isArray(leaseId) ? leaseId[0] : leaseId,
    req.body
  );

  return sendOkResource(res, 'lease', lease);
};

export const removeTenantFromLease = async (req: AuthRequest, res: Response) => {
  const { leaseId } = req.params;
  const lease = await removeTenantFromLeaseForOwner(
    req.user,
    Array.isArray(leaseId) ? leaseId[0] : leaseId,
    req.body
  );

  return sendOkResource(res, 'lease', lease);
};

export const downloadLeaseDocument = async (req: AuthRequest, res: Response) => {
  const { documentId } = req.params;
  const filePath = await getLeaseDocumentPath(req.user, Array.isArray(documentId) ? documentId[0] : documentId);
  res.sendFile(path.resolve(filePath));
};

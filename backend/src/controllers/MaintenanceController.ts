import { Response } from 'express';
import path from 'path';
import { sendCreatedResource, sendOkResource, sendPaginated } from '../http/responses';
import { AuthRequest } from '../middleware/auth';
import {
  createMaintenanceRequestForTenant,
  getMaintenanceRequestForUser,
  listMaintenanceRequestsForUser,
  updateMaintenanceStatusForUser,
  uploadMaintenanceEvidenceForTenant,
  getMaintenanceEvidencePath,
} from '../services/maintenanceService';

export const createMaintenanceRequest = async (req: AuthRequest, res: Response) => {
  const request = await createMaintenanceRequestForTenant(req.user, req.body);
  return sendCreatedResource(res, 'request', request);
};

export const getMaintenanceRequests = async (req: AuthRequest, res: Response) => {
  const result = await listMaintenanceRequestsForUser(req.user, {
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    unitId: typeof req.query.unitId === 'string' ? req.query.unitId : undefined,
    page: typeof req.query.page === 'string' ? req.query.page : undefined,
    limit: typeof req.query.limit === 'string' ? req.query.limit : undefined,
  });

  return sendPaginated(res, result.data, result.total, result.page, result.totalPages);
};

export const getMaintenanceRequest = async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;
  const request = await getMaintenanceRequestForUser(req.user, Array.isArray(requestId) ? requestId[0] : requestId);
  return sendOkResource(res, 'request', request);
};

export const uploadMaintenanceEvidence = async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;
  const evidence = await uploadMaintenanceEvidenceForTenant(
    req.user,
    Array.isArray(requestId) ? requestId[0] : requestId,
    req.file
  );

  return res.status(201).json({
    evidence,
    fileName: req.file?.filename
  });
};

export const updateMaintenanceStatus = async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;
  const request = await updateMaintenanceStatusForUser(
    req.user,
    Array.isArray(requestId) ? requestId[0] : requestId,
    req.body
  );

  return sendOkResource(res, 'request', request);
};

export const downloadMaintenanceEvidence = async (req: AuthRequest, res: Response) => {
  const { evidenceId } = req.params;
  const filePath = await getMaintenanceEvidencePath(req.user, Array.isArray(evidenceId) ? evidenceId[0] : evidenceId);
  res.sendFile(path.resolve(filePath));
};

import { models } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { User } from '../models/User';
import { logActivity } from './activityService';

interface CreateMaintenanceRequestInput {
  unitId: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  description: string;
}

interface ListMaintenanceRequestsInput {
  status?: string;
  unitId?: string;
  page?: string | number;
  limit?: string | number;
}

interface UpdateMaintenanceStatusInput {
  status: 'IN_PROGRESS' | 'RESOLVED' | 'OWNER_REJECTED' | 'TENANT_REJECTED' | 'CANCELLED' | 'CLOSED';
  note?: string;
}

interface MaintenanceRequestResource {
  id: string;
  tenantId: string;
  unitId: string;
  unit?: {
    property?: {
      ownerId?: string;
    };
  };
}

function getMaintenanceRequestIncludes(includeEvidence = true) {
  return [
    {
      model: models.RentalUnit,
      as: 'unit',
      include: [
        {
          model: models.Property,
          as: 'property',
          attributes: ['id', 'title', 'ownerId', 'addressCity', 'addressStreet', 'status'],
        },
      ],
    },
    {
      model: models.User,
      as: 'tenant',
      attributes: ['id', 'email', 'firstName', 'middleName', 'lastName', 'phoneNumber', 'role'],
    },
    {
      model: models.User,
      as: 'resolver',
      attributes: ['id', 'email', 'firstName', 'lastName'],
      required: false,
    },
    ...(includeEvidence
      ? [
          {
            model: models.MaintenanceEvidence,
            as: 'evidence',
            required: false,
          },
        ]
      : []),
  ];
}

async function getActiveLeaseForTenantUnit(user: User, unitId: string) {
  return models.Lease.findOne({
    where: {
      unitId,
      tenantId: user.id,
      status: 'ACTIVE',
    },
    include: [
      {
        model: models.RentalUnit,
        as: 'unit',
        include: [
          {
            model: models.Property,
            as: 'property',
            attributes: ['id', 'ownerId', 'status'],
          },
        ],
      },
    ],
  });
}

function assertMaintenanceRequestAccess(user: User, request: MaintenanceRequestResource): void {
  if (user.role === 'ADMIN') {
    return;
  }

  if (user.role === 'TENANT' && request.tenantId === user.id) {
    return;
  }

  const ownerId = request.unit?.property?.ownerId;
  if (user.role === 'OWNER' && ownerId === user.id) {
    return;
  }

  throw createError('Access denied', 403);
}

async function getMaintenanceRequestById(requestId: string, includeEvidence = true) {
  return models.MaintenanceRequest.findByPk(requestId, {
    include: getMaintenanceRequestIncludes(includeEvidence),
  });
}

function canUpdateMaintenanceStatus(user: User, request: MaintenanceRequestResource): boolean {
  if (user.role === 'ADMIN') {
    return true;
  }

  if (user.role === 'OWNER' && request.unit?.property?.ownerId === user.id) {
    return true;
  }

  return false;
}

function isAllowedMaintenanceTransition(
  currentStatus: string,
  nextStatus: UpdateMaintenanceStatusInput['status']
): boolean {
  if (currentStatus === 'OPEN') {
    return nextStatus === 'IN_PROGRESS' || nextStatus === 'OWNER_REJECTED' || nextStatus === 'CANCELLED';
  }

  if (currentStatus === 'IN_PROGRESS') {
    return nextStatus === 'RESOLVED' || nextStatus === 'OWNER_REJECTED' || nextStatus === 'CANCELLED';
  }

  // Simplified: Closed can come from Resolved
  if (currentStatus === 'RESOLVED') {
    return nextStatus === 'CLOSED';
  }

  return false;
}

export async function createMaintenanceRequestForTenant(
  user: User | undefined,
  input: CreateMaintenanceRequestInput
) {
  if (!user) {
    throw createError('Authentication required', 401);
  }

  if (user.role !== 'TENANT') {
    throw createError('Only tenants can create maintenance requests', 403);
  }

  const activeLease = await getActiveLeaseForTenantUnit(user, input.unitId);
  if (!activeLease) {
    throw createError('Access denied', 403);
  }

  const unit = activeLease.get('unit') as { property?: { status?: string } } | undefined;
  if (unit?.property?.status === 'DELETED') {
    throw createError('Cannot create a maintenance request for a deleted property', 400);
  }

  const request = await models.MaintenanceRequest.create({
    unitId: input.unitId,
    tenantId: user.id,
    category: input.category,
    priority: input.priority,
    description: input.description,
    status: 'OPEN',
  });

  await logActivity({
    userId: user.id,
    type: 'MAINTENANCE_CREATED',
    entityType: 'MAINTENANCE_REQUEST',
    entityId: request.id,
    description: `Created maintenance request: ${request.category} (${request.priority})`,
  });

  return request;
}

export async function listMaintenanceRequestsForUser(
  user: User | undefined,
  input: ListMaintenanceRequestsInput
) {
  if (!user) {
    throw createError('Authentication required', 401);
  }

  const whereClause: Record<string, unknown> = {};
  if (input.status) {
    whereClause.status = input.status;
  }
  if (input.unitId) {
    whereClause.unitId = input.unitId;
  }
  if (user.role === 'TENANT') {
    whereClause.tenantId = user.id;
  }

  const propertyWhereClause: Record<string, unknown> = {};
  if (user.role === 'OWNER') {
    propertyWhereClause.ownerId = user.id;
  }

  const page = Number(input.page || 1);
  const limit = Number(input.limit || 20);
  const offset = (page - 1) * limit;

  const { count, rows } = await models.MaintenanceRequest.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: models.RentalUnit,
        as: 'unit',
        required: true,
        include: [
          {
            model: models.Property,
            as: 'property',
            attributes: ['id', 'title', 'ownerId', 'addressCity', 'addressStreet', 'status'],
            ...(Object.keys(propertyWhereClause).length > 0 ? { where: propertyWhereClause } : {}),
          },
        ],
      },
      {
        model: models.User,
        as: 'tenant',
        attributes: ['id', 'email', 'firstName', 'middleName', 'lastName', 'phoneNumber', 'role'],
      },
    ],
    distinct: true,
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

export async function getMaintenanceRequestForUser(user: User | undefined, requestId: string) {
  if (!user) {
    throw createError('Authentication required', 401);
  }

  const request = await getMaintenanceRequestById(requestId);

  if (!request) {
    throw createError('Maintenance request not found', 404);
  }

  assertMaintenanceRequestAccess(user, request);
  return request;
}

export async function uploadMaintenanceEvidenceForTenant(
  user: User | undefined,
  requestId: string,
  file: Express.Multer.File | undefined
) {
  if (!file) {
    throw createError('No file uploaded', 400);
  }

  if (!user) {
    throw createError('Authentication required', 401);
  }

  if (user.role !== 'TENANT') {
    throw createError('Only tenants can upload maintenance evidence', 403);
  }

  const request = await getMaintenanceRequestById(requestId, false);
  if (!request) {
    throw createError('Maintenance request not found', 404);
  }

  if (request.tenantId !== user.id) {
    throw createError('Access denied', 403);
  }

  return models.MaintenanceEvidence.create({
    requestId: request.id,
    filePath: file.path,
    uploadedBy: user.id,
  });
}

export async function updateMaintenanceStatusForUser(
  user: User | undefined,
  requestId: string,
  input: UpdateMaintenanceStatusInput
) {
  if (!user) {
    throw createError('Authentication required', 401);
  }

  const request = await getMaintenanceRequestById(requestId);
  if (!request) {
    throw createError('Maintenance request not found', 404);
  }

  if (!canUpdateMaintenanceStatus(user, request)) {
    throw createError('Access denied', 403);
  }

  if (!isAllowedMaintenanceTransition(request.status, input.status)) {
    throw createError('Invalid maintenance status transition', 400);
  }

  const updatePayload: Record<string, unknown> = {
    status: input.status,
  };

  if (typeof input.note === 'string') {
    updatePayload.note = input.note;
  }

  if (input.status === 'RESOLVED') {
    updatePayload.resolvedAt = new Date();
    updatePayload.resolvedBy = user.id;
  } else {
    updatePayload.resolvedAt = null;
    updatePayload.resolvedBy = null;
  }

  await request.update(updatePayload);

  return getMaintenanceRequestById(request.id);
}

export async function getMaintenanceEvidencePath(user: User | undefined, evidenceId: string): Promise<string> {
  const evidence = await models.MaintenanceEvidence.findByPk(evidenceId, {
    include: [
      {
        model: models.MaintenanceRequest,
        as: 'request',
        include: [
          {
            model: models.RentalUnit,
            as: 'unit',
            include: [{ model: models.Property, as: 'property', attributes: ['ownerId'] }],
          },
        ],
      },
    ],
  });

  if (!evidence) {
    throw createError('Maintenance evidence not found', 404);
  }

  const request = evidence.get('request') as any;
  const ownerId = request.unit.property.ownerId;
  const tenantId = request.tenantId;

  if (user?.role === 'ADMIN') return evidence.filePath;
  if (user?.id === ownerId || user?.id === tenantId) return evidence.filePath;

  throw createError('Access denied', 403);
}

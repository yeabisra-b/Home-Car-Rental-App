import { Op } from 'sequelize';
import { models, sequelize } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { Lease } from '../models/Lease';
import { User } from '../models/User';

interface CreateLeaseInput {
  unitId: string;
  tenantId?: string;
  tenantEmail?: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositAmount: number;
}

interface ListLeasesInput {
  status?: string;
  unitId?: string;
  tenantId?: string;
  page?: string | number;
  limit?: string | number;
}

interface UploadLeaseDocumentInput {
  documentType?: string;
}

function getLeaseIncludes() {
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
      attributes: ['id', 'email', 'firstName', 'middleName', 'lastName', 'phoneNumber', 'role', 'accountStatus'],
    },
    {
      model: models.LeaseDocument,
      as: 'documents',
      required: false,
    },
  ];
}

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function findTenantFromInput(input: CreateLeaseInput) {
  if (!input.tenantId && !input.tenantEmail) {
    throw createError('Provide either tenantId or tenantEmail', 400);
  }

  let tenantById: User | null = null;
  let tenantByEmail: User | null = null;

  if (input.tenantId) {
    tenantById = await models.User.findByPk(input.tenantId);
    if (!tenantById) {
      throw createError('Tenant not found', 404);
    }
  }

  if (input.tenantEmail) {
    tenantByEmail = await models.User.findOne({ where: { email: input.tenantEmail } });
    if (!tenantByEmail) {
      throw createError('Tenant not found', 404);
    }
  }

  if (tenantById && tenantByEmail && tenantById.id !== tenantByEmail.id) {
    throw createError('tenantId and tenantEmail must refer to the same tenant', 400);
  }

  const tenant = tenantById ?? tenantByEmail;

  if (!tenant) {
    throw createError('Tenant not found', 404);
  }

  if (tenant.role !== 'TENANT') {
    throw createError('Lease tenant must have TENANT role', 400);
  }

  return tenant;
}

async function getOwnedUnitOrThrow(owner: User | undefined, unitId: string) {
  if (owner?.role !== 'OWNER') {
    throw createError('Only owners can create leases', 403);
  }

  const unit = await models.RentalUnit.findByPk(unitId, {
    include: [
      {
        model: models.Property,
        as: 'property',
        attributes: ['id', 'ownerId', 'status'],
      },
    ],
  });

  if (!unit) {
    throw createError('Rental unit not found', 404);
  }

  const property = unit.get('property') as { ownerId: string; status: string } | undefined;
  if (!property || property.ownerId !== owner.id) {
    throw createError('Access denied', 403);
  }

  if (property.status === 'DELETED') {
    throw createError('Cannot create a lease for a deleted property', 400);
  }

  return unit;
}

export async function createLeaseForOwner(owner: User | undefined, input: CreateLeaseInput) {
  const unit = await getOwnedUnitOrThrow(owner, input.unitId);
  const tenant = await findTenantFromInput(input);

  const existingLease = await models.Lease.findOne({
    where: {
      unitId: input.unitId,
      status: {
        [Op.in]: ['DRAFT', 'ACTIVE'],
      },
    },
  });

  if (existingLease) {
    throw createError('Only one active or draft lease can exist for a unit at a time', 400);
  }

  const lease = await models.Lease.create({
    unitId: unit.id,
    tenantId: tenant.id,
    startDate: input.startDate,
    endDate: input.endDate,
    monthlyRent: input.monthlyRent,
    depositAmount: input.depositAmount,
    status: 'DRAFT',
  });

  return lease;
}

export async function listLeasesForUser(user: User | undefined, input: ListLeasesInput) {
  if (!user) {
    throw createError('Authentication required', 401);
  }

  if (input.tenantId && user.role !== 'ADMIN') {
    throw createError('Only admins can filter by tenantId', 403);
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
  } else if (user.role === 'ADMIN' && input.tenantId) {
    whereClause.tenantId = input.tenantId;
  }

  const propertyWhereClause: Record<string, unknown> = {};
  if (user.role === 'OWNER') {
    propertyWhereClause.ownerId = user.id;
  }

  const page = Number(input.page || 1);
  const limit = Number(input.limit || 20);
  const offset = (page - 1) * limit;

  const { count, rows } = await models.Lease.findAndCountAll({
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
        attributes: ['id', 'email', 'firstName', 'middleName', 'lastName', 'phoneNumber', 'role', 'accountStatus'],
      },
      {
        model: models.LeaseDocument,
        as: 'documents',
        required: false,
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

export async function getLeaseForUser(user: User | undefined, leaseId: string) {
  if (!user) {
    throw createError('Authentication required', 401);
  }

  const lease = await models.Lease.findByPk(leaseId, {
    include: getLeaseIncludes(),
  });

  if (!lease) {
    throw createError('Lease not found', 404);
  }

  const tenant = lease.get('tenant') as { id: string } | undefined;
  const unit = lease.get('unit') as { property?: { ownerId: string } } | undefined;
  const property = unit?.property;

  if (user.role === 'TENANT' && tenant?.id !== user.id) {
    throw createError('Access denied', 403);
  }

  if (user.role === 'OWNER' && property?.ownerId !== user.id) {
    throw createError('Access denied', 403);
  }

  return lease;
}

export async function getLeaseById(leaseId: string): Promise<Lease | null> {
  return models.Lease.findByPk(leaseId, { include: getLeaseIncludes() });
}

async function getLeaseWithUnitAndTenantOrThrow(leaseId: string) {
  const lease = await models.Lease.findByPk(leaseId, {
    include: getLeaseIncludes(),
  });

  if (!lease) {
    throw createError('Lease not found', 404);
  }

  return lease;
}

export async function uploadLeaseDocumentForOwner(
  user: User | undefined,
  leaseId: string,
  file: Express.Multer.File | undefined,
  input: UploadLeaseDocumentInput
) {
  if (!file) {
    throw createError('No file uploaded', 400);
  }

  if (file.mimetype !== 'application/pdf') {
    throw createError('Lease documents must be uploaded as PDF files', 400);
  }

  if (user?.role !== 'OWNER') {
    throw createError('Only owners can upload lease documents', 403);
  }

  const lease = await models.Lease.findByPk(leaseId, {
    include: [
      {
        model: models.RentalUnit,
        as: 'unit',
        include: [
          {
            model: models.Property,
            as: 'property',
            attributes: ['ownerId'],
          },
        ],
      },
      {
        model: models.LeaseDocument,
        as: 'documents',
        required: false,
      },
    ],
  });

  if (!lease) {
    throw createError('Lease not found', 404);
  }

  const unit = lease.get('unit') as { id: string; property?: { ownerId: string } } | undefined;
  const property = unit?.property;
  if (!unit || property?.ownerId !== user.id) {
    throw createError('Access denied', 403);
  }

  if (!['DRAFT', 'ACTIVE'].includes(lease.status)) {
    throw createError('Documents can only be uploaded for draft or active leases', 400);
  }

  const existingDocuments = lease.get('documents') as Array<{ id: string }> | undefined;
  const shouldActivateLease = lease.status === 'DRAFT' && (!existingDocuments || existingDocuments.length === 0);

  return sequelize.transaction(async (transaction) => {
    const document = await models.LeaseDocument.create({
      leaseId: lease.id,
      documentType: input.documentType || 'SIGNED',
      filePath: file.path,
      uploadedBy: user.id,
    }, { transaction });

    if (shouldActivateLease) {
      await lease.update({ status: 'ACTIVE' }, { transaction });
      await models.RentalUnit.update(
        { status: 'OCCUPIED' },
        {
          where: { id: unit.id },
          transaction,
        }
      );
    }

    const updatedLease = await models.Lease.findByPk(lease.id, {
      include: getLeaseIncludes(),
      transaction,
    });

    return {
      document,
      lease: updatedLease!,
    };
  });
}

export async function submitMoveOutNoticeForTenant(
  user: User | undefined,
  leaseId: string,
  input: { noticeDate: string; note?: string }
) {
  if (user?.role !== 'TENANT') {
    throw createError('Only tenants can submit move-out notices', 403);
  }

  const lease = await getLeaseWithUnitAndTenantOrThrow(leaseId);
  const tenant = lease.get('tenant') as { id: string } | undefined;

  if (tenant?.id !== user.id) {
    throw createError('Access denied', 403);
  }

  if (lease.status === 'TERMINATED') {
    throw createError('Cannot submit a move-out notice for a terminated lease', 400);
  }

  await lease.update({
    moveOutNoticeDate: input.noticeDate,
    moveOutNoticeNote: input.note ?? null,
  });

  return lease;
}

export async function terminateLeaseForTenant(
  user: User | undefined,
  leaseId: string,
  input: { reason: string }
) {
  if (user?.role !== 'TENANT') {
    throw createError('Only tenants can terminate leases', 403);
  }

  const lease = await getLeaseWithUnitAndTenantOrThrow(leaseId);
  const tenant = lease.get('tenant') as { id: string } | undefined;
  const unit = lease.get('unit') as { id: string } | undefined;

  if (tenant?.id !== user.id) {
    throw createError('Access denied', 403);
  }

  if (!['ACTIVE', 'EXPIRED'].includes(lease.status)) {
    throw createError('Only active or expired leases can be terminated', 400);
  }

  if (lease.endDate > getTodayIsoDate()) {
    throw createError('Lease can only be terminated after the end date', 400);
  }

  return sequelize.transaction(async (transaction) => {
    await lease.update({
      status: 'TERMINATED',
      terminationReason: input.reason,
      terminatedAt: new Date(),
    }, { transaction });

    if (unit) {
      await models.RentalUnit.update(
        { status: 'VACANT' },
        {
          where: { id: unit.id },
          transaction,
        }
      );
    }

    return models.Lease.findByPk(lease.id, {
      include: getLeaseIncludes(),
      transaction,
    }) as Promise<Lease>;
  });
}

export async function removeTenantFromLeaseForOwner(
  user: User | undefined,
  leaseId: string,
  input: { reason: string }
) {
  if (user?.role !== 'OWNER') {
    throw createError('Only owners can remove tenants from leases', 403);
  }

  const lease = await getLeaseWithUnitAndTenantOrThrow(leaseId);
  const unit = lease.get('unit') as { id: string; property?: { ownerId: string } } | undefined;
  const property = unit?.property;

  if (property?.ownerId !== user.id) {
    throw createError('Access denied', 403);
  }

  if (lease.status === 'TERMINATED') {
    throw createError('Lease is already terminated', 400);
  }

  return sequelize.transaction(async (transaction) => {
    await lease.update({
      status: 'TERMINATED',
      terminationReason: input.reason,
      terminatedAt: new Date(),
    }, { transaction });

    if (unit) {
      await models.RentalUnit.update(
        { status: 'VACANT' },
        {
          where: { id: unit.id },
          transaction,
        }
      );
    }

    return models.Lease.findByPk(lease.id, {
      include: getLeaseIncludes(),
      transaction,
    }) as Promise<Lease>;
  });
}

export async function getLeaseDocumentPath(user: User | undefined, documentId: string): Promise<string> {
  const document = await models.LeaseDocument.findByPk(documentId, {
    include: [
      {
        model: models.Lease,
        as: 'lease',
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

  if (!document) {
    throw createError('Lease document not found', 404);
  }

  const lease = document.get('lease') as any;
  const ownerId = lease.unit.property.ownerId;
  const tenantId = lease.tenantId;

  if (user?.role === 'ADMIN') return document.filePath;
  if (user?.id === ownerId || user?.id === tenantId) return document.filePath;

  throw createError('Access denied', 403);
}

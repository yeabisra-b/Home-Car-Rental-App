import { Op } from 'sequelize';
import { models } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { User } from '../models/User';

interface CreateRentalUnitInput {
  unitIdentifier: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqMeters?: number;
  rentAmount: number;
  depositAmount?: number;
  status?: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' | 'UNAVAILABLE';
  description?: string;
  amenities?: string[];
  floorNumber?: number;
}

interface ListRentalUnitsInput {
  propertyId?: string;
  minRent?: string | number;
  maxRent?: string | number;
  bedrooms?: string | number;
  status?: string;
  city?: string;
  page?: string | number;
  limit?: string | number;
}

export async function createRentalUnitForOwner(user: User | undefined, propertyId: string, input: CreateRentalUnitInput) {
  if (user?.role !== 'OWNER') {
    throw createError('Only owners can create rental units', 403);
  }

  const property = await models.Property.findByPk(propertyId);
  if (!property) {
    throw createError('Property not found', 404);
  }

  if (property.ownerId !== user.id) {
    throw createError('Access denied', 403);
  }

  const existingUnit = await models.RentalUnit.findOne({
    where: {
      propertyId,
      unitIdentifier: input.unitIdentifier,
    },
  });

  if (existingUnit) {
    throw createError('Unit identifier already exists for this property', 400);
  }

  return models.RentalUnit.create({
    propertyId,
    unitIdentifier: input.unitIdentifier,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    areaSqMeters: input.areaSqMeters,
    rentAmount: input.rentAmount,
    depositAmount: input.depositAmount,
    status: input.status || 'VACANT',
    description: input.description,
    amenities: input.amenities,
    floorNumber: input.floorNumber,
  });
}

export async function listRentalUnitsForUser(user: User | undefined, input: ListRentalUnitsInput) {
  const whereClause: Record<string, unknown> = {};

  if (input.propertyId) whereClause.propertyId = input.propertyId;
  if (input.status) whereClause.status = input.status;
  if (input.bedrooms) whereClause.bedrooms = input.bedrooms;
  if (input.minRent || input.maxRent) {
    const rentRange: Record<symbol, number> = {};
    if (input.minRent) rentRange[Op.gte] = Number(input.minRent);
    if (input.maxRent) rentRange[Op.lte] = Number(input.maxRent);
    whereClause.rentAmount = rentRange;
  }

  const propertyWhereClause: Record<string, unknown> = {};
  if (input.city) {
    propertyWhereClause.addressCity = input.city;
  }
  if (user?.role === 'OWNER') {
    propertyWhereClause.ownerId = user.id;
  }
  if (user?.role === 'TENANT') {
    propertyWhereClause.status = 'ACTIVE';
  }

  const page = Number(input.page || 1);
  const limit = Number(input.limit || 20);
  const offset = (page - 1) * limit;

  const { count, rows } = await models.RentalUnit.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: models.Property,
        as: 'property',
        attributes: ['id', 'title', 'type', 'addressCity', 'addressStreet'],
        where: propertyWhereClause,
      },
      {
        model: models.Lease,
        as: 'currentLease',
        where: { status: { [Op.in]: ['ACTIVE', 'DRAFT'] } },
        required: false,
      },
    ],
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

export async function getRentalUnitForUser(user: User | undefined, unitId: string) {
  const unit = await models.RentalUnit.findByPk(unitId, {
    include: [
      {
        model: models.Property,
        as: 'property',
        attributes: ['id', 'title', 'type', 'addressCity', 'addressStreet', 'ownerId'],
        include: [
          {
            model: models.User,
            as: 'owner',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber'],
          },
        ],
      },
      {
        model: models.Lease,
        as: 'currentLease',
        where: { status: { [Op.in]: ['ACTIVE', 'DRAFT'] } },
        required: false,
      },
    ],
  });

  if (!unit) {
    throw createError('Rental unit not found', 404);
  }

  const property = unit.get('property') as { ownerId: string };
  if (user?.role === 'OWNER' && property.ownerId !== user.id) {
    throw createError('Access denied', 403);
  }

  return unit;
}

export async function updateRentalUnitForUser(user: User | undefined, unitId: string, updateData: Record<string, unknown>) {
  const unit = await models.RentalUnit.findByPk(unitId, {
    include: [
      {
        model: models.Property,
        as: 'property',
        attributes: ['ownerId'],
      },
    ],
  });

  if (!unit) {
    throw createError('Rental unit not found', 404);
  }

  const property = unit.get('property') as { ownerId: string };
  if (user?.role !== 'ADMIN' && property.ownerId !== user?.id) {
    throw createError('Access denied', 403);
  }

  if (updateData.unitIdentifier && updateData.unitIdentifier !== unit.unitIdentifier) {
    const existingUnit = await models.RentalUnit.findOne({
      where: {
        propertyId: unit.propertyId,
        unitIdentifier: updateData.unitIdentifier,
      },
    });

    if (existingUnit) {
      throw createError('Unit identifier already exists for this property', 400);
    }
  }

  await unit.update(updateData);
  return unit;
}

export async function deleteRentalUnitForUser(user: User | undefined, unitId: string): Promise<void> {
  const unit = await models.RentalUnit.findByPk(unitId, {
    include: [
      {
        model: models.Property,
        as: 'property',
        attributes: ['ownerId'],
      },
    ],
  });

  if (!unit) {
    throw createError('Rental unit not found', 404);
  }

  const property = unit.get('property') as { ownerId: string };
  if (user?.role !== 'ADMIN' && property.ownerId !== user?.id) {
    throw createError('Access denied', 403);
  }

  if (unit.status === 'OCCUPIED') {
    throw createError('Cannot delete unit with active leases', 400);
  }

  await unit.destroy();
}

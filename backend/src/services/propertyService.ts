import { models, sequelize } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { User } from '../models/User';
import { logActivity } from './activityService';
import { getMediaType } from '../middleware/upload';

interface CreatePropertyInput {
  title: string;
  description?: string;
  type: 'BUILDING' | 'VEHICLE';
  addressCity: string;
  addressStreet?: string;
  addressSubCity?: string;
  addressWoreda?: string;
  addressHouseNumber?: string;
  buildingDetails?: Record<string, unknown>;
  vehicleDetails?: Record<string, unknown>;
}

interface ListPropertiesInput {
  type?: string;
  city?: string;
  ownerId?: string;
  status?: string;
  page?: number | string;
  limit?: number | string;
}

export async function createPropertyForOwner(owner: User | undefined, input: CreatePropertyInput) {
  if (owner?.role !== 'OWNER') {
    throw createError('Only owners can create properties', 403);
  }

  if (input.type === 'BUILDING' && !input.buildingDetails) {
    throw createError('Building details are required', 400);
  }

  if (input.type === 'VEHICLE' && !input.vehicleDetails) {
    throw createError('Vehicle details are required', 400);
  }

  return sequelize.transaction(async (transaction) => {
    const property = await models.Property.create({
      ownerId: owner.id,
      title: input.title,
      description: input.description,
      type: input.type,
      addressCity: input.addressCity,
      addressStreet: input.addressStreet,
      addressSubCity: input.addressSubCity,
      addressWoreda: input.addressWoreda,
      addressHouseNumber: input.addressHouseNumber,
      status: 'ACTIVE',
    }, { transaction });

    if (input.type === 'BUILDING' && input.buildingDetails) {
      await models.PropertyBuilding.create({
        propertyId: property.id,
        ...(input.buildingDetails as Record<string, unknown>),
      } as any, { transaction });
    }

    if (input.type === 'VEHICLE' && input.vehicleDetails) {
      await models.PropertyVehicle.create({
        propertyId: property.id,
        ...(input.vehicleDetails as Record<string, unknown>),
      } as any, { transaction });
    }

    const completeProperty = await models.Property.findByPk(property.id, {
      include: [
        { model: models.PropertyBuilding, as: 'buildingDetails' },
        { model: models.PropertyVehicle, as: 'vehicleDetails' },
      ],
      transaction,
    });

    await logActivity({
      userId: owner!.id,
      type: 'PROPERTY_ADDED',
      entityType: 'PROPERTY',
      entityId: property.id,
      description: `Added a new property: ${property.title} (${property.type})`,
    });

    return completeProperty;
  });
}

export async function listPropertiesForUser(user: User | undefined, input: ListPropertiesInput) {
  const whereClause: Record<string, unknown> = {};

  if (input.type) whereClause.type = input.type;
  if (input.city) whereClause.addressCity = input.city;
  if (input.status) whereClause.status = input.status;

  if (input.ownerId && user?.role === 'ADMIN') {
    whereClause.ownerId = input.ownerId;
  } else if (user?.role === 'OWNER') {
    whereClause.ownerId = user.id;
  } else if (user?.role === 'TENANT') {
    whereClause.status = 'ACTIVE';
  }

  const page = Number(input.page || 1);
  const limit = Number(input.limit || 20);
  const offset = (page - 1) * limit;

  const { count, rows } = await models.Property.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: models.User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber'],
      },
      {
        model: models.RentalUnit,
        as: 'rentalUnits',
        attributes: ['id', 'unitIdentifier', 'status', 'rentAmount', 'bedrooms', 'bathrooms', 'areaSqMeters', 'floorNumber', 'amenities'],
      },
      {
        model: models.PropertyMedia,
        as: 'media',
        attributes: ['id', 'mediaType', 'isPrimary'],
        required: false,
      },
      {
        model: models.PropertyBuilding,
        as: 'buildingDetails',
      },
      {
        model: models.PropertyVehicle,
        as: 'vehicleDetails',
      },
    ],
  });

  return {
    data: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
}

export async function getPropertyForUser(user: User | undefined, propertyId: string) {
  const property = await models.Property.findByPk(propertyId, {
    include: [
      {
        model: models.User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber'],
      },
      {
        model: models.RentalUnit,
        as: 'rentalUnits',
      },
      {
        model: models.PropertyMedia,
        as: 'media',
      },
      {
        model: models.PropertyBuilding,
        as: 'buildingDetails',
      },
      {
        model: models.PropertyVehicle,
        as: 'vehicleDetails',
      },
    ],
  });

  if (!property) {
    throw createError('Property not found', 404);
  }

  if (user?.role === 'OWNER' && property.ownerId !== user.id) {
    throw createError('Access denied', 403);
  }

  return property;
}

export async function updatePropertyForUser(user: User | undefined, propertyId: string, updateData: Record<string, any>) {
  const property = await models.Property.findByPk(propertyId, {
    include: [
      { model: models.PropertyBuilding, as: 'buildingDetails' },
      { model: models.PropertyVehicle, as: 'vehicleDetails' },
    ],
  });

  if (!property) {
    throw createError('Property not found', 404);
  }

  if (user?.role !== 'ADMIN' && property.ownerId !== user?.id) {
    throw createError('Access denied', 403);
  }

  return sequelize.transaction(async (transaction) => {
    // Extract nested details
    const { buildingDetails, vehicleDetails, ...coreData } = updateData;

    // Update core property data
    await property.update(coreData, { transaction });

    // Update building details if provided and property is a building
    if (property.type === 'BUILDING' && buildingDetails) {
      const building = await models.PropertyBuilding.findOne({
        where: { propertyId: property.id },
        transaction,
      });
      if (building) {
        await building.update(buildingDetails, { transaction });
      } else {
        await models.PropertyBuilding.create({
          propertyId: property.id,
          ...buildingDetails,
        }, { transaction });
      }
    }

    // Update vehicle details if provided and property is a vehicle
    if (property.type === 'VEHICLE' && vehicleDetails) {
      const vehicle = await models.PropertyVehicle.findOne({
        where: { propertyId: property.id },
        transaction,
      });
      if (vehicle) {
        await vehicle.update(vehicleDetails, { transaction });
      } else {
        await models.PropertyVehicle.create({
          propertyId: property.id,
          ...vehicleDetails,
        }, { transaction });
      }
    }

    // Return the updated property with all details
    return models.Property.findByPk(property.id, {
      include: [
        { model: models.PropertyBuilding, as: 'buildingDetails' },
        { model: models.PropertyVehicle, as: 'vehicleDetails' },
      ],
      transaction,
    });
  });
}

export async function deletePropertyForUser(user: User | undefined, propertyId: string): Promise<void> {
  const property = await models.Property.findByPk(propertyId, {
    include: [
      {
        model: models.RentalUnit,
        as: 'rentalUnits',
        where: { status: 'OCCUPIED' },
        required: false,
      },
    ],
  });

  if (!property) {
    throw createError('Property not found', 404);
  }

  if (user?.role !== 'ADMIN' && property.ownerId !== user?.id) {
    throw createError('Access denied', 403);
  }

  const occupiedUnits = property.get('rentalUnits') as Array<{ id: string }>;
  if (occupiedUnits.length > 0) {
    throw createError('Cannot delete property with active leases', 400);
  }

  await property.update({ status: 'DELETED' });
}

export async function uploadPropertyMediaForUser(
  user: User | undefined,
  propertyId: string,
  file: Express.Multer.File | undefined,
  input: { description?: string; isPrimary?: string }
) {
  if (!file) {
    throw createError('No file uploaded', 400);
  }

  const property = await models.Property.findByPk(propertyId);
  if (!property) {
    throw createError('Property not found', 404);
  }

  if (user?.role !== 'ADMIN' && property.ownerId !== user?.id) {
    throw createError('Access denied', 403);
  }

  if (input.isPrimary === 'true') {
    await models.PropertyMedia.update({ isPrimary: false }, { where: { propertyId } });
  }

  const media = await models.PropertyMedia.create({
    propertyId,
    fileName: file.filename,
    originalName: file.originalname,
    filePath: file.path,
    fileSize: file.size,
    mimeType: file.mimetype,
    mediaType: getMediaType(file.mimetype),
    isPrimary: input.isPrimary === 'true',
    description: input.description,
    uploadedBy: user!.id,
  });

  return media;
}

export async function deletePropertyMediaForUser(user: User | undefined, mediaId: string): Promise<void> {
  const media = await models.PropertyMedia.findByPk(mediaId, {
    include: [
      {
        model: models.Property,
        as: 'property',
        attributes: ['ownerId'],
      },
    ],
  });

  if (!media) {
    throw createError('Media not found', 404);
  }

  const property = media.get('property') as { ownerId: string };
  if (user?.role !== 'ADMIN' && property.ownerId !== user?.id) {
    throw createError('Access denied', 403);
  }

  await media.destroy();
}

export async function getPropertyMediaPath(user: User | undefined, mediaId: string): Promise<string> {
  const media = await models.PropertyMedia.findByPk(mediaId, {
    include: [
      {
        model: models.Property,
        as: 'property',
        attributes: ['ownerId', 'status'],
      },
    ],
  });

  if (!media) {
    throw createError('Media not found', 404);
  }

  const property = media.get('property') as { ownerId: string; status: string };

  // Access control: ADMIN, OWNER of property, or anyone if property is ACTIVE
  if (user?.role === 'ADMIN') return media.filePath;
  if (user?.id === property.ownerId) return media.filePath;
  if (property.status === 'ACTIVE') return media.filePath;

  throw createError('Access denied', 403);
}

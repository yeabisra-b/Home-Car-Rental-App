import { Op } from 'sequelize';
import { models, sequelize } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { User } from '../models/User';
import { createNotificationsForUsers } from './notificationService';

interface CreateAnnouncementInput {
  title: string;
  content: string;
  propertyId?: string;
}

interface ListAnnouncementsInput {
  propertyId?: string;
  page?: string | number;
  limit?: string | number;
}

interface LeasePropertyContext {
  unit?: {
    property?: {
      id?: string;
      ownerId?: string;
    };
  };
}

const ownerAttributes = ['id', 'email', 'firstName', 'middleName', 'lastName', 'phoneNumber', 'role', 'accountStatus'];
const propertyAttributes = ['id', 'title', 'ownerId', 'addressCity', 'addressStreet', 'status'];

function getAnnouncementIncludes() {
  return [
    {
      model: models.User,
      as: 'owner',
      attributes: ownerAttributes,
    },
    {
      model: models.Property,
      as: 'property',
      attributes: propertyAttributes,
      required: false,
    },
  ];
}

async function getActiveTenantIdsForAnnouncement(ownerId: string, propertyId?: string) {
  const leaseWhereClause: Record<string, unknown> = {
    status: 'ACTIVE',
  };

  const propertyWhereClause: Record<string, unknown> = {
    ownerId,
  };

  if (propertyId) {
    propertyWhereClause.id = propertyId;
  }

  const leases = await models.Lease.findAll({
    where: leaseWhereClause,
    include: [
      {
        model: models.RentalUnit,
        as: 'unit',
        required: true,
        include: [
          {
            model: models.Property,
            as: 'property',
            required: true,
            where: propertyWhereClause,
          },
        ],
      },
      {
        model: models.User,
        as: 'tenant',
        required: true,
        attributes: [],
        where: {
          accountStatus: 'ACTIVE',
        },
      },
    ],
  });

  return Array.from(new Set(leases.map((lease) => lease.tenantId)));
}

export async function createAnnouncementForOwner(user: User | undefined, input: CreateAnnouncementInput) {
  if (!user) {
    throw createError('Authentication required', 401);
  }

  if (user.role !== 'OWNER') {
    throw createError('Only owners can create announcements', 403);
  }

  if (input.propertyId) {
    const property = await models.Property.findByPk(input.propertyId);
    if (!property) {
      throw createError('Property not found', 404);
    }

    if (property.ownerId !== user.id) {
      throw createError('Access denied', 403);
    }

    if (property.status === 'DELETED') {
      throw createError('Cannot create announcements for a deleted property', 400);
    }
  }

  const tenantIds = await getActiveTenantIdsForAnnouncement(user.id, input.propertyId);

  return sequelize.transaction(async (transaction) => {
    const announcement = await models.Announcement.create(
      {
        ownerId: user.id,
        propertyId: input.propertyId ?? null,
        title: input.title,
        content: input.content,
      },
      { transaction }
    );

    await createNotificationsForUsers(
      tenantIds,
      {
        type: 'ANNOUNCEMENT',
        message: `New announcement: ${announcement.title}`,
        entityType: 'ANNOUNCEMENT',
        entityId: announcement.id,
      },
      transaction
    );

    return models.Announcement.findByPk(announcement.id, {
      include: getAnnouncementIncludes(),
      transaction,
    });
  });
}

export async function listAnnouncementsForUser(user: User | undefined, input: ListAnnouncementsInput) {
  if (!user) {
    throw createError('Authentication required', 401);
  }

  const page = Number(input.page || 1);
  const limit = Number(input.limit || 20);
  const offset = (page - 1) * limit;

  const whereClause: any = {};

  if (user.role === 'OWNER') {
    whereClause.ownerId = user.id;
    if (input.propertyId) {
      whereClause.propertyId = input.propertyId;
    }
  } else if (user.role === 'TENANT') {
    const activeLeases = await models.Lease.findAll({
      where: {
        tenantId: user.id,
        status: 'ACTIVE',
      },
      include: [
        {
          model: models.RentalUnit,
          as: 'unit',
          required: true,
          include: [
            {
              model: models.Property,
              as: 'property',
              attributes: ['id', 'ownerId'],
              required: true,
            },
          ],
        },
      ],
    });

    const propertyIds = Array.from(new Set(
      activeLeases
        .map((lease) => (lease as typeof lease & LeasePropertyContext).unit?.property?.id)
        .filter(Boolean)
    ));
    const ownerIds = Array.from(new Set(
      activeLeases
        .map((lease) => (lease as typeof lease & LeasePropertyContext).unit?.property?.ownerId)
        .filter(Boolean)
    ));

    if (input.propertyId) {
      if (!propertyIds.includes(input.propertyId)) {
        return { data: [], total: 0, page, totalPages: 0 };
      }

      whereClause.propertyId = input.propertyId;
    } else {
      if (propertyIds.length === 0 || ownerIds.length === 0) {
        return { data: [], total: 0, page, totalPages: 0 };
      }

      whereClause[Op.or] = [
        { propertyId: { [Op.in]: propertyIds } },
        {
          [Op.and]: [
            { propertyId: null },
            { ownerId: { [Op.in]: ownerIds } },
          ],
        },
      ];
    }
  } else if (input.propertyId) {
    whereClause.propertyId = input.propertyId;
  }

  const { count, rows } = await models.Announcement.findAndCountAll({
    where: whereClause,
    include: getAnnouncementIncludes(),
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

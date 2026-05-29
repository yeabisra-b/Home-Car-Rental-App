import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const USER_ROLE_VALUES = ['OWNER', 'TENANT', 'ADMIN'];
const ACCOUNT_STATUS_VALUES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
const PROPERTY_TYPE_VALUES = ['BUILDING', 'VEHICLE'];
const PROPERTY_STATUS_VALUES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DELETED'];
const BUILDING_TYPE_VALUES = ['APARTMENT', 'HOUSE', 'COMMERCIAL', 'OFFICE', 'WAREHOUSE'];
const VEHICLE_TYPE_VALUES = ['SEDAN', 'SUV', 'TRUCK', 'MOTORCYCLE', 'VAN', 'BUS'];
const TRANSMISSION_TYPE_VALUES = ['MANUAL', 'AUTOMATIC'];
const FUEL_TYPE_VALUES = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'];
const UNIT_STATUS_VALUES = ['VACANT', 'OCCUPIED', 'MAINTENANCE', 'UNAVAILABLE'];
const MEDIA_TYPE_VALUES = ['IMAGE', 'DOCUMENT', 'VIDEO'];

export const name = '001_initial_schema';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('users', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    refreshTokenHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sessionVersion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    middleName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM(...USER_ROLE_VALUES),
      allowNull: false,
      defaultValue: 'TENANT',
    },
    accountStatus: {
      type: DataTypes.ENUM(...ACCOUNT_STATUS_VALUES),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    profilePictureUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.createTable('properties', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(...PROPERTY_TYPE_VALUES),
      allowNull: false,
    },
    addressCity: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressStreet: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    addressSubCity: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    addressWoreda: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    addressHouseNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...PROPERTY_STATUS_VALUES),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.createTable('property_building', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'properties',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    buildingType: {
      type: DataTypes.ENUM(...BUILDING_TYPE_VALUES),
      allowNull: false,
    },
    totalFloors: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    totalUnits: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    hasParking: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    hasElevator: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    hasSecurity: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    yearBuilt: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    amenities: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.createTable('property_vehicle', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'properties',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    plateNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    vehicleType: {
      type: DataTypes.ENUM(...VEHICLE_TYPE_VALUES),
      allowNull: false,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    manufactureYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    transmissionType: {
      type: DataTypes.ENUM(...TRANSMISSION_TYPE_VALUES),
      allowNull: false,
    },
    fuelType: {
      type: DataTypes.ENUM(...FUEL_TYPE_VALUES),
      allowNull: false,
    },
    engineCapacity: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mileage: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.createTable('rental_units', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'properties',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    unitIdentifier: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bedrooms: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    bathrooms: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    areaSqMeters: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
    rentAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    depositAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...UNIT_STATUS_VALUES),
      allowNull: false,
      defaultValue: 'VACANT',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    amenities: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    floorNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.createTable('property_media', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'properties',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mediaType: {
      type: DataTypes.ENUM(...MEDIA_TYPE_VALUES),
      allowNull: false,
      defaultValue: 'IMAGE',
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.createTable('activity_logs', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('properties', ['ownerId']);
  await queryInterface.addIndex('properties', ['type']);
  await queryInterface.addIndex('properties', ['status']);
  await queryInterface.addIndex('properties', ['addressCity']);

  await queryInterface.addIndex('property_building', ['buildingType']);
  await queryInterface.addIndex('property_vehicle', ['plateNumber']);
  await queryInterface.addIndex('property_vehicle', ['vehicleType']);

  await queryInterface.addIndex('rental_units', ['propertyId']);
  await queryInterface.addIndex('rental_units', ['status']);
  await queryInterface.addIndex('rental_units', ['rentAmount']);
  await queryInterface.addIndex('rental_units', ['bedrooms']);
  await queryInterface.addIndex('rental_units', ['propertyId', 'unitIdentifier'], {
    unique: true,
    name: 'rental_units_property_id_unit_identifier',
  });

  await queryInterface.addIndex('property_media', ['propertyId']);
  await queryInterface.addIndex('property_media', ['mediaType']);
  await queryInterface.addIndex('property_media', ['isPrimary']);
  await queryInterface.addIndex('property_media', ['uploadedBy']);
  await queryInterface.addIndex('activity_logs', ['userId']);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('activity_logs');
  await queryInterface.dropTable('property_media');
  await queryInterface.dropTable('rental_units');
  await queryInterface.dropTable('property_vehicle');
  await queryInterface.dropTable('property_building');
  await queryInterface.dropTable('properties');
  await queryInterface.dropTable('users');

  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_property_media_mediaType";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_rental_units_status";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_property_vehicle_vehicleType";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_property_vehicle_transmissionType";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_property_vehicle_fuelType";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_property_building_buildingType";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_properties_type";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_properties_status";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_accountStatus";');
}

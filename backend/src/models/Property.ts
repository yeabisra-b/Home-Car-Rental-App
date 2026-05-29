import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export interface PropertyAttributes {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  type: 'BUILDING' | 'VEHICLE';
  addressCity: string;
  addressStreet?: string;
  addressSubCity?: string;
  addressWoreda?: string;
  addressHouseNumber?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DELETED';
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyCreationAttributes extends Optional<PropertyAttributes, 'id' | 'description' | 'addressStreet' | 'addressSubCity' | 'addressWoreda' | 'addressHouseNumber' | 'createdAt' | 'updatedAt'> { }

export class Property extends Model<PropertyAttributes, PropertyCreationAttributes> implements PropertyAttributes {
  public id!: string;
  public ownerId!: string;
  public title!: string;
  public description?: string;
  public type!: 'BUILDING' | 'VEHICLE';
  public addressCity!: string;
  public addressStreet?: string;
  public addressSubCity?: string;
  public addressWoreda?: string;
  public addressHouseNumber?: string;
  public status!: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DELETED';
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initProperty(sequelize: any): typeof Property {
  Property.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
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
        validate: {
          len: [1, 255],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('BUILDING', 'VEHICLE'),
        allowNull: false,
      },
      addressCity: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 100],
        },
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
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DELETED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Property',
      tableName: 'properties',
      timestamps: true,
      indexes: [
        {
          fields: ['ownerId'],
        },
        {
          fields: ['type'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['addressCity'],
        },
      ],
    }
  );

  return Property;
}

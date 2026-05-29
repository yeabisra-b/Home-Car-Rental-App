import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export interface RentalUnitAttributes {
  id: string;
  propertyId: string;
  unitIdentifier: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqMeters?: number;
  rentAmount: number;
  depositAmount?: number;
  status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' | 'UNAVAILABLE';
  description?: string;
  amenities?: string[];
  floorNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RentalUnitCreationAttributes extends Optional<RentalUnitAttributes, 'id' | 'bedrooms' | 'bathrooms' | 'areaSqMeters' | 'depositAmount' | 'description' | 'amenities' | 'floorNumber' | 'createdAt' | 'updatedAt'> {}

export class RentalUnit extends Model<RentalUnitAttributes, RentalUnitCreationAttributes> implements RentalUnitAttributes {
  public id!: string;
  public propertyId!: string;
  public unitIdentifier!: string;
  public bedrooms?: number;
  public bathrooms?: number;
  public areaSqMeters?: number;
  public rentAmount!: number;
  public depositAmount?: number;
  public status!: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' | 'UNAVAILABLE';
  public description?: string;
  public amenities?: string[];
  public floorNumber?: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initRentalUnit(sequelize: any): typeof RentalUnit {
  RentalUnit.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
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
        validate: {
          len: [1, 50],
        },
      },
      bedrooms: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          max: 20,
        },
      },
      bathrooms: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          max: 20,
        },
      },
      areaSqMeters: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      rentAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      depositAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      status: {
        type: DataTypes.ENUM('VACANT', 'OCCUPIED', 'MAINTENANCE', 'UNAVAILABLE'),
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
        validate: {
          min: 0,
        },
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
      modelName: 'RentalUnit',
      tableName: 'rental_units',
      timestamps: true,
      indexes: [
        {
          fields: ['propertyId'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['rentAmount'],
        },
        {
          fields: ['bedrooms'],
        },
        {
          unique: true,
          fields: ['propertyId', 'unitIdentifier'],
        },
      ],
    }
  );

  return RentalUnit;
}

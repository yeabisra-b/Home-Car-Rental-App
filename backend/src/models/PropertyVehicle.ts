import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export interface PropertyVehicleAttributes {
  id: string;
  propertyId: string;
  plateNumber: string;
  vehicleType: 'SEDAN' | 'SUV' | 'TRUCK' | 'MOTORCYCLE' | 'VAN' | 'BUS';
  brand: string;
  model: string;
  manufactureYear: number;
  color: string;
  transmissionType: 'MANUAL' | 'AUTOMATIC';
  fuelType: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  engineCapacity?: string;
  mileage?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyVehicleCreationAttributes extends Optional<PropertyVehicleAttributes, 'id' | 'engineCapacity' | 'mileage' | 'createdAt' | 'updatedAt'> {}

export class PropertyVehicle extends Model<PropertyVehicleAttributes, PropertyVehicleCreationAttributes> implements PropertyVehicleAttributes {
  public id!: string;
  public propertyId!: string;
  public plateNumber!: string;
  public vehicleType!: 'SEDAN' | 'SUV' | 'TRUCK' | 'MOTORCYCLE' | 'VAN' | 'BUS';
  public brand!: string;
  public model!: string;
  public manufactureYear!: number;
  public color!: string;
  public transmissionType!: 'MANUAL' | 'AUTOMATIC';
  public fuelType!: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  public engineCapacity?: string;
  public mileage?: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initPropertyVehicle(sequelize: any): typeof PropertyVehicle {
  PropertyVehicle.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
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
        validate: {
          len: [1, 20],
        },
      },
      vehicleType: {
        type: DataTypes.ENUM('SEDAN', 'SUV', 'TRUCK', 'MOTORCYCLE', 'VAN', 'BUS'),
        allowNull: false,
      },
      brand: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 100],
        },
      },
      model: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 100],
        },
      },
      manufactureYear: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1900,
          max: new Date().getFullYear() + 1,
        },
      },
      color: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 50],
        },
      },
      transmissionType: {
        type: DataTypes.ENUM('MANUAL', 'AUTOMATIC'),
        allowNull: false,
      },
      fuelType: {
        type: DataTypes.ENUM('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'),
        allowNull: false,
      },
      engineCapacity: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [1, 20],
        },
      },
      mileage: {
        type: DataTypes.BIGINT,
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
      modelName: 'PropertyVehicle',
      tableName: 'property_vehicle',
      timestamps: true,
      indexes: [
        {
          fields: ['propertyId'],
          unique: true,
        },
        {
          fields: ['plateNumber'],
        },
        {
          fields: ['vehicleType'],
        },
      ],
    }
  );

  return PropertyVehicle;
}

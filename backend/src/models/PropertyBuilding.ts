import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export interface PropertyBuildingAttributes {
  id: string;
  propertyId: string;
  buildingType: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL' | 'OFFICE' | 'WAREHOUSE';
  totalFloors?: number;
  totalUnits?: number;
  hasParking?: boolean;
  hasElevator?: boolean;
  hasSecurity?: boolean;
  yearBuilt?: number;
  amenities?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyBuildingCreationAttributes extends Optional<PropertyBuildingAttributes, 'id' | 'totalFloors' | 'totalUnits' | 'hasParking' | 'hasElevator' | 'hasSecurity' | 'yearBuilt' | 'amenities' | 'createdAt' | 'updatedAt'> {}

export class PropertyBuilding extends Model<PropertyBuildingAttributes, PropertyBuildingCreationAttributes> implements PropertyBuildingAttributes {
  public id!: string;
  public propertyId!: string;
  public buildingType!: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL' | 'OFFICE' | 'WAREHOUSE';
  public totalFloors?: number;
  public totalUnits?: number;
  public hasParking?: boolean;
  public hasElevator?: boolean;
  public hasSecurity?: boolean;
  public yearBuilt?: number;
  public amenities?: string[];
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initPropertyBuilding(sequelize: any): typeof PropertyBuilding {
  PropertyBuilding.init(
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
      buildingType: {
        type: DataTypes.ENUM('APARTMENT', 'HOUSE', 'COMMERCIAL', 'OFFICE', 'WAREHOUSE'),
        allowNull: false,
      },
      totalFloors: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
        },
      },
      totalUnits: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
        },
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
        validate: {
          min: 1800,
          max: new Date().getFullYear(),
        },
      },
      amenities: {
        type: DataTypes.JSONB,
        allowNull: true,
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
      modelName: 'PropertyBuilding',
      tableName: 'property_building',
      timestamps: true,
      indexes: [
        {
          fields: ['propertyId'],
          unique: true,
        },
        {
          fields: ['buildingType'],
        },
      ],
    }
  );

  return PropertyBuilding;
}

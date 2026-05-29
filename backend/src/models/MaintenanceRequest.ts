import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export type MaintenanceRequestStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'OWNER_REJECTED' | 'TENANT_REJECTED' | 'CANCELLED' | 'CLOSED';
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface MaintenanceRequestAttributes {
  id: string;
  unitId: string;
  tenantId: string;
  category: string;
  priority: MaintenancePriority;
  description: string;
  status: MaintenanceRequestStatus;
  note?: string | null;
  resolvedAt?: Date | null;
  resolvedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceRequestCreationAttributes extends Optional<
  MaintenanceRequestAttributes,
  'id' | 'status' | 'note' | 'resolvedAt' | 'resolvedBy' | 'createdAt' | 'updatedAt'
> {}

export class MaintenanceRequest extends Model<
  MaintenanceRequestAttributes,
  MaintenanceRequestCreationAttributes
> implements MaintenanceRequestAttributes {
  public id!: string;
  public unitId!: string;
  public tenantId!: string;
  public category!: string;
  public priority!: MaintenancePriority;
  public description!: string;
  public status!: MaintenanceRequestStatus;
  public note?: string | null;
  public resolvedAt?: Date | null;
  public resolvedBy?: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initMaintenanceRequest(sequelize: any): typeof MaintenanceRequest {
  MaintenanceRequest.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      unitId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'rental_units',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 100],
        },
      },
      priority: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'OWNER_REJECTED', 'TENANT_REJECTED', 'CANCELLED', 'CLOSED'),
        allowNull: false,
        defaultValue: 'OPEN',
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      resolvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
      modelName: 'MaintenanceRequest',
      tableName: 'maintenance_requests',
      timestamps: true,
      indexes: [
        {
          fields: ['unitId'],
        },
        {
          fields: ['tenantId'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['resolvedBy'],
        },
      ],
    }
  );

  return MaintenanceRequest;
}

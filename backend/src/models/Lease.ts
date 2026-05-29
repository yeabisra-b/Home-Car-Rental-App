import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export type LeaseStatus = 'DRAFT' | 'ACTIVE' | 'TERMINATED' | 'EXPIRED';

export interface LeaseAttributes {
  id: string;
  unitId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositAmount: number;
  status: LeaseStatus;
  moveOutNoticeDate?: string | null;
  moveOutNoticeNote?: string | null;
  terminationReason?: string | null;
  terminatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaseCreationAttributes extends Optional<
  LeaseAttributes,
  | 'id'
  | 'status'
  | 'moveOutNoticeDate'
  | 'moveOutNoticeNote'
  | 'terminationReason'
  | 'terminatedAt'
  | 'createdAt'
  | 'updatedAt'
> {}

export class Lease extends Model<LeaseAttributes, LeaseCreationAttributes> implements LeaseAttributes {
  public id!: string;
  public unitId!: string;
  public tenantId!: string;
  public startDate!: string;
  public endDate!: string;
  public monthlyRent!: number;
  public depositAmount!: number;
  public status!: LeaseStatus;
  public moveOutNoticeDate?: string | null;
  public moveOutNoticeNote?: string | null;
  public terminationReason?: string | null;
  public terminatedAt?: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initLease(sequelize: any): typeof Lease {
  Lease.init(
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
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      monthlyRent: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      depositAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      status: {
        type: DataTypes.ENUM('DRAFT', 'ACTIVE', 'TERMINATED', 'EXPIRED'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      moveOutNoticeDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      moveOutNoticeNote: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      terminationReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      terminatedAt: {
        type: DataTypes.DATE,
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
      modelName: 'Lease',
      tableName: 'leases',
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
          fields: ['endDate'],
        },
      ],
    }
  );

  return Lease;
}

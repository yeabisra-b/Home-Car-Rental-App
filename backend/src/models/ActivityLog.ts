import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export interface ActivityLogAttributes {
  id: string;
  userId: string;
  type: string;
  description: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLogCreationAttributes extends Optional<ActivityLogAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class ActivityLog extends Model<ActivityLogAttributes, ActivityLogCreationAttributes> implements ActivityLogAttributes {
  public id!: string;
  public userId!: string;
  public type!: string;
  public description!: string;
  public entityType?: string | null;
  public entityId?: string | null;
  public metadata?: any;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initActivityLog(sequelize: any): typeof ActivityLog {
  ActivityLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
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
      modelName: 'ActivityLog',
      tableName: 'activity_logs',
      timestamps: true,
    }
  );

  return ActivityLog;
}

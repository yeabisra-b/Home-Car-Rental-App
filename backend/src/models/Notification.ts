import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export interface NotificationAttributes {
  id: string;
  userId: string;
  type: 'MESSAGE' | 'ANNOUNCEMENT' | 'MAINTENANCE' | 'INVOICE' | 'SYSTEM';
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationCreationAttributes extends Optional<
  NotificationAttributes,
  'id' | 'entityType' | 'entityId' | 'isRead' | 'createdAt'
> {}

export class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: string;
  public userId!: string;
  public type!: 'MESSAGE' | 'ANNOUNCEMENT' | 'MAINTENANCE' | 'INVOICE' | 'SYSTEM';
  public message!: string;
  public entityType?: string | null;
  public entityId?: string | null;
  public isRead!: boolean;
  public createdAt!: Date;
}

export function initNotification(sequelize: any): typeof Notification {
  Notification.init(
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
        type: DataTypes.ENUM('MESSAGE', 'ANNOUNCEMENT', 'MAINTENANCE', 'INVOICE', 'SYSTEM'),
        allowNull: false,
      },
      message: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 500],
        },
      },
      entityType: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [1, 50],
        },
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'notifications',
      timestamps: false,
      updatedAt: false,
      indexes: [
        {
          fields: ['userId'],
        },
        {
          fields: ['isRead'],
        },
        {
          fields: ['entityType', 'entityId'],
        },
        {
          fields: ['createdAt'],
        },
      ],
    }
  );

  return Notification;
}

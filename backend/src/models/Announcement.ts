import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export interface AnnouncementAttributes {
  id: string;
  ownerId: string;
  propertyId?: string | null;
  title: string;
  content: string;
  createdAt: Date;
}

export interface AnnouncementCreationAttributes extends Optional<AnnouncementAttributes, 'id' | 'propertyId' | 'createdAt'> {}

export class Announcement extends Model<AnnouncementAttributes, AnnouncementCreationAttributes> implements AnnouncementAttributes {
  public id!: string;
  public ownerId!: string;
  public propertyId?: string | null;
  public title!: string;
  public content!: string;
  public createdAt!: Date;
}

export function initAnnouncement(sequelize: any): typeof Announcement {
  Announcement.init(
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
      propertyId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'properties',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 255],
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Announcement',
      tableName: 'announcements',
      timestamps: false,
      updatedAt: false,
      indexes: [
        {
          fields: ['ownerId'],
        },
        {
          fields: ['propertyId'],
        },
        {
          fields: ['createdAt'],
        },
      ],
    }
  );

  return Announcement;
}

import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export interface PropertyMediaAttributes {
  id: string;
  propertyId: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  mediaType: 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  isPrimary: boolean;
  description?: string;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyMediaCreationAttributes extends Optional<PropertyMediaAttributes, 'id' | 'isPrimary' | 'description' | 'createdAt' | 'updatedAt'> {}

export class PropertyMedia extends Model<PropertyMediaAttributes, PropertyMediaCreationAttributes> implements PropertyMediaAttributes {
  public id!: string;
  public propertyId!: string;
  public fileName!: string;
  public originalName!: string;
  public filePath!: string;
  public fileSize!: number;
  public mimeType!: string;
  public mediaType!: 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  public isPrimary!: boolean;
  public description?: string;
  public uploadedBy!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initPropertyMedia(sequelize: any): typeof PropertyMedia {
  PropertyMedia.init(
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
      fileName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 255],
        },
      },
      originalName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 255],
        },
      },
      filePath: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 500],
        },
      },
      fileSize: {
        type: DataTypes.BIGINT,
        allowNull: false,
        validate: {
          min: 0,
          max: 10485760, // 10MB max
        },
      },
      mimeType: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [
            [
              'image/jpeg',
              'image/jpg',
              'image/png',
              'image/gif',
              'image/webp',
              'application/pdf',
              'video/mp4',
              'video/avi',
              'video/mov',
            ],
          ],
        },
      },
      mediaType: {
        type: DataTypes.ENUM('IMAGE', 'DOCUMENT', 'VIDEO'),
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
      modelName: 'PropertyMedia',
      tableName: 'property_media',
      timestamps: true,
      indexes: [
        {
          fields: ['propertyId'],
        },
        {
          fields: ['mediaType'],
        },
        {
          fields: ['isPrimary'],
        },
        {
          fields: ['uploadedBy'],
        },
      ],
    }
  );

  return PropertyMedia;
}

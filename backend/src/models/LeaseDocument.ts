import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export interface LeaseDocumentAttributes {
  id: string;
  leaseId: string;
  documentType: string;
  filePath: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface LeaseDocumentCreationAttributes extends Optional<LeaseDocumentAttributes, 'id' | 'documentType' | 'createdAt'> {}

export class LeaseDocument extends Model<LeaseDocumentAttributes, LeaseDocumentCreationAttributes> implements LeaseDocumentAttributes {
  public id!: string;
  public leaseId!: string;
  public documentType!: string;
  public filePath!: string;
  public uploadedBy!: string;
  public createdAt!: Date;
}

export function initLeaseDocument(sequelize: any): typeof LeaseDocument {
  LeaseDocument.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      leaseId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'leases',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      documentType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'SIGNED',
        validate: {
          len: [1, 50],
        },
      },
      filePath: {
        type: DataTypes.STRING,
        allowNull: false,
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
    },
    {
      sequelize,
      modelName: 'LeaseDocument',
      tableName: 'lease_documents',
      timestamps: false,
      updatedAt: false,
      indexes: [
        {
          fields: ['leaseId'],
        },
        {
          fields: ['uploadedBy'],
        },
      ],
    }
  );

  return LeaseDocument;
}

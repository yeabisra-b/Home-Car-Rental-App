import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export interface MaintenanceEvidenceAttributes {
  id: string;
  requestId: string;
  filePath: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface MaintenanceEvidenceCreationAttributes extends Optional<
  MaintenanceEvidenceAttributes,
  'id' | 'uploadedAt'
> {}

export class MaintenanceEvidence extends Model<
  MaintenanceEvidenceAttributes,
  MaintenanceEvidenceCreationAttributes
> implements MaintenanceEvidenceAttributes {
  public id!: string;
  public requestId!: string;
  public filePath!: string;
  public uploadedBy!: string;
  public uploadedAt!: Date;
}

export function initMaintenanceEvidence(sequelize: any): typeof MaintenanceEvidence {
  MaintenanceEvidence.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      requestId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'maintenance_requests',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      uploadedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'MaintenanceEvidence',
      tableName: 'maintenance_evidence',
      timestamps: false,
      createdAt: false,
      updatedAt: false,
      indexes: [
        {
          fields: ['requestId'],
        },
        {
          fields: ['uploadedBy'],
        },
      ],
    }
  );

  return MaintenanceEvidence;
}

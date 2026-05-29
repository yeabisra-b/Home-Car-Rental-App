import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export type InvoiceStatus = 'UNPAID' | 'PENDING_REVIEW' | 'PAID' | 'OVERDUE';

export interface InvoiceAttributes {
  id: string;
  leaseId: string;
  billingMonth: string;
  amountDue: number;
  dueDate: string;
  status: InvoiceStatus;
  reviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceCreationAttributes extends Optional<
  InvoiceAttributes,
  'id' | 'status' | 'reviewNote' | 'reviewedBy' | 'reviewedAt' | 'createdAt' | 'updatedAt'
> {}

export class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> implements InvoiceAttributes {
  public id!: string;
  public leaseId!: string;
  public billingMonth!: string;
  public amountDue!: number;
  public dueDate!: string;
  public status!: InvoiceStatus;
  public reviewNote?: string | null;
  public reviewedBy?: string | null;
  public reviewedAt?: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initInvoice(sequelize: any): typeof Invoice {
  Invoice.init(
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
      billingMonth: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      amountDue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('UNPAID', 'PENDING_REVIEW', 'PAID', 'OVERDUE'),
        allowNull: false,
        defaultValue: 'UNPAID',
      },
      reviewNote: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reviewedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      reviewedAt: {
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
      modelName: 'Invoice',
      tableName: 'invoices',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['leaseId', 'billingMonth'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['dueDate'],
        },
        {
          fields: ['reviewedBy'],
        },
      ],
    }
  );

  return Invoice;
}

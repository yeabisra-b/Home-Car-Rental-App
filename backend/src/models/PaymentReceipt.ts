import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export interface PaymentReceiptAttributes {
  id: string;
  invoiceId: string;
  filePath: string;
  transactionRef?: string | null;
  paymentMethod?: string | null;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface PaymentReceiptCreationAttributes extends Optional<
  PaymentReceiptAttributes,
  'id' | 'transactionRef' | 'paymentMethod' | 'uploadedAt'
> {}

export class PaymentReceipt extends Model<PaymentReceiptAttributes, PaymentReceiptCreationAttributes> implements PaymentReceiptAttributes {
  public id!: string;
  public invoiceId!: string;
  public filePath!: string;
  public transactionRef?: string | null;
  public paymentMethod?: string | null;
  public uploadedBy!: string;
  public uploadedAt!: Date;
}

export function initPaymentReceipt(sequelize: any): typeof PaymentReceipt {
  PaymentReceipt.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      invoiceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'invoices',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      filePath: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      transactionRef: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      paymentMethod: {
        type: DataTypes.STRING,
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
      uploadedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'PaymentReceipt',
      tableName: 'payment_receipts',
      timestamps: false,
      updatedAt: false,
      createdAt: false,
      indexes: [
        {
          fields: ['invoiceId'],
        },
        {
          fields: ['uploadedBy'],
        },
      ],
    }
  );

  return PaymentReceipt;
}

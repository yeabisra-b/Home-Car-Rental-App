import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const INVOICE_STATUS_VALUES = ['UNPAID', 'PENDING_REVIEW', 'PAID', 'OVERDUE'];

export const name = '003_invoice_management';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('invoices', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
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
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...INVOICE_STATUS_VALUES),
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
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('invoices', ['leaseId', 'billingMonth'], { unique: true });
  await queryInterface.addIndex('invoices', ['status']);
  await queryInterface.addIndex('invoices', ['dueDate']);
  await queryInterface.addIndex('invoices', ['reviewedBy']);

  await queryInterface.createTable('payment_receipts', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
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
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('payment_receipts', ['invoiceId']);
  await queryInterface.addIndex('payment_receipts', ['uploadedBy']);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('payment_receipts');
  await queryInterface.dropTable('invoices');
}

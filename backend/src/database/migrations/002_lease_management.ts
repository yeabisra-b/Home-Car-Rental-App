import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const LEASE_STATUS_VALUES = ['DRAFT', 'ACTIVE', 'TERMINATED', 'EXPIRED'];

export const name = '002_lease_management';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('leases', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
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
    },
    depositAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...LEASE_STATUS_VALUES),
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
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('leases', ['unitId']);
  await queryInterface.addIndex('leases', ['tenantId']);
  await queryInterface.addIndex('leases', ['status']);
  await queryInterface.addIndex('leases', ['endDate']);

  await queryInterface.sequelize.query(`
    CREATE UNIQUE INDEX leases_active_or_draft_unit_unique
    ON leases ("unitId")
    WHERE status IN ('DRAFT', 'ACTIVE');
  `);

  await queryInterface.createTable('lease_documents', {
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
    documentType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'SIGNED',
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
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('lease_documents', ['leaseId']);
  await queryInterface.addIndex('lease_documents', ['uploadedBy']);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('lease_documents');
  await queryInterface.sequelize.query('DROP INDEX IF EXISTS leases_active_or_draft_unit_unique;');
  await queryInterface.dropTable('leases');
}

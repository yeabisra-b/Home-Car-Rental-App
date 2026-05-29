import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const MAINTENANCE_STATUS_VALUES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'OWNER_REJECTED', 'TENANT_REJECTED', 'CANCELLED', 'CLOSED'];
const MAINTENANCE_PRIORITY_VALUES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export const name = '004_maintenance_management';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('maintenance_requests', {
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
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM(...MAINTENANCE_PRIORITY_VALUES),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...MAINTENANCE_STATUS_VALUES),
      allowNull: false,
      defaultValue: 'OPEN',
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
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

  await queryInterface.addIndex('maintenance_requests', ['unitId']);
  await queryInterface.addIndex('maintenance_requests', ['tenantId']);
  await queryInterface.addIndex('maintenance_requests', ['status']);
  await queryInterface.addIndex('maintenance_requests', ['resolvedBy']);

  await queryInterface.createTable('maintenance_evidence', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
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
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('maintenance_evidence', ['requestId']);
  await queryInterface.addIndex('maintenance_evidence', ['uploadedBy']);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('maintenance_evidence');
  await queryInterface.dropTable('maintenance_requests');
}

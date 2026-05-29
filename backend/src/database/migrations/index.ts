import * as initialSchema from './001_initial_schema';
import * as leaseManagement from './002_lease_management';
import * as invoiceManagement from './003_invoice_management';
import * as maintenanceManagement from './004_maintenance_management';
import * as communicationManagement from './005_communication_management';

export interface MigrationDefinition {
  name: string;
  up: typeof initialSchema.up;
  down: typeof initialSchema.down;
}

export const migrations: MigrationDefinition[] = [
  initialSchema,
  leaseManagement,
  invoiceManagement,
  maintenanceManagement,
  communicationManagement,
];

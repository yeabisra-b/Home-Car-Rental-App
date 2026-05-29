// Load test environment variables FIRST before any other imports
import '../config/loadEnv';

import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { closeDatabaseConnection, prepareDatabaseForTests, sequelize } from '../config/database';
import { ensureTestPostgresServer } from '../database/testPostgresServer';

const TEST_TABLES = [
  'notifications',
  'announcements',
  'messages',
  'maintenance_evidence',
  'maintenance_requests',
  'payment_receipts',
  'invoices',
  'lease_documents',
  'leases',
  'property_media',
  'rental_units',
  'property_building',
  'property_vehicle',
  'properties',
  'users',
];

// Test environment setup
beforeAll(async () => {
  await ensureTestPostgresServer();
  await prepareDatabaseForTests();
});

// Cleanup after all tests
afterAll(async () => {
  await closeDatabaseConnection();
});

// Reset state before each test
beforeEach(async () => {
  await sequelize.query(`TRUNCATE TABLE ${TEST_TABLES.map((table) => `"${table}"`).join(', ')} CASCADE`);
});

// Cleanup after each test
afterEach(() => {
  // Clean up test-specific data
});

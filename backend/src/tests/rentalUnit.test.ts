import request from 'supertest';
import app from '../app';
import { User } from '../models/User';
import jwt, { SignOptions } from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/auth';

describe('Rental Unit Endpoints', () => {
  let ownerToken: string;
  let tenantToken: string;
  let adminToken: string;
  let propertyId: string;
  let unitId: string;

  // Test data
  const validOwner = {
    email: 'unitowner@test.com',
    password: 'password123',
    firstName: 'Unit',
    lastName: 'Owner',
    phoneNumber: '+12345678901',
    role: 'OWNER',
  };

  const validTenant = {
    email: 'unittenant@test.com',
    password: 'password123',
    firstName: 'Unit',
    lastName: 'Tenant',
    phoneNumber: '+12345678902',
    role: 'TENANT',
  };

  const validAdmin = {
    email: 'unitadmin@test.com',
    password: 'password123',
    firstName: 'Unit',
    lastName: 'Admin',
    phoneNumber: '+12345678903',
    role: 'ADMIN',
  };

  const validBuildingProperty = {
    title: 'Test Building for Units',
    description: 'Building for rental unit tests',
    type: 'BUILDING',
    addressCity: 'Addis Ababa',
    addressStreet: 'Test Street',
    buildingDetails: {
      buildingType: 'APARTMENT',
      totalFloors: 3,
      totalUnits: 10,
      hasParking: true,
      hasElevator: false,
      hasSecurity: true,
    },
  };

  const validRentalUnit = {
    unitIdentifier: 'Apt 101',
    bedrooms: 2,
    bathrooms: 1,
    areaSqMeters: 85.5,
    rentAmount: 5000.00,
    depositAmount: 10000.00,
    status: 'VACANT',
    description: 'Spacious 2-bedroom apartment',
    amenities: ['Air Conditioning', 'Balcony', 'Parking'],
    floorNumber: 1,
  };

  beforeAll(async () => {
    // Initial setup - tokens will be overwritten in beforeEach
  });

  beforeEach(async () => {
    // Re-register users before each test because setup.ts clears the database
    const ownerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(validOwner)
      .expect(201);

    ownerToken = ownerResponse.body.accessToken;

    const tenantResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(validTenant)
      .expect(201);

    tenantToken = tenantResponse.body.accessToken;

    const adminUser = await User.create({
      email: validAdmin.email,
      password: validAdmin.password,
      firstName: validAdmin.firstName,
      lastName: validAdmin.lastName,
      phoneNumber: validAdmin.phoneNumber,
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, sessionVersion: adminUser.sessionVersion, tokenType: 'access' },
      JWT_CONFIG.ACCESS_TOKEN_SECRET,
      { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN } as SignOptions
    );

    // Create a property for unit tests
    const propResponse = await request(app)
      .post('/api/v1/properties')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(validBuildingProperty)
      .expect(201);

    propertyId = propResponse.body.property.id;

    // Create a unit for update/get tests
    const unitResponse = await request(app)
      .post(`/api/v1/properties/${propertyId}/units`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        ...validRentalUnit,
        unitIdentifier: 'UNIQUE-UNIT-101'
      })
      .expect(201);

    unitId = unitResponse.body.unit.id;
  });

  describe('POST /api/v1/properties/:propertyId/units', () => {
    it('should create rental unit successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/properties/${propertyId}/units`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(validRentalUnit)
        .expect(201);

      expect(response.body).toHaveProperty('unit');
      expect(response.body.unit.unitIdentifier).toBe(validRentalUnit.unitIdentifier);
      expect(response.body.unit.bedrooms).toBe(validRentalUnit.bedrooms);
      expect(Number(response.body.unit.rentAmount)).toBe(validRentalUnit.rentAmount);
      expect(response.body.unit.status).toBe('VACANT');
      unitId = response.body.unit.id;
    });

    it('should not create unit without authentication', async () => {
      await request(app)
        .post(`/api/v1/properties/${propertyId}/units`)
        .send(validRentalUnit)
        .expect(401);
    });

    it('should not create unit as tenant', async () => {
      const response = await request(app)
        .post(`/api/v1/properties/${propertyId}/units`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send(validRentalUnit)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Only owners can create rental units');
    });

    it('should not create unit for non-existent property', async () => {
      const fakePropertyId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/v1/properties/${fakePropertyId}/units`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(validRentalUnit)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Property not found');
    });

    it('should not create unit with duplicate identifier', async () => {
      const response = await request(app)
        .post(`/api/v1/properties/${propertyId}/units`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...validRentalUnit,
          unitIdentifier: 'UNIQUE-UNIT-101'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Unit identifier already exists for this property');
    });

    it('should not create unit for other owner\'s property', async () => {
      // Create another owner and property
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      const otherOwnerEmail = `otherowner-${timestamp}-${random}@test.com`;

      const otherOwnerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: otherOwnerEmail,
          password: 'password123',
          firstName: 'Other',
          lastName: 'Owner',
          role: 'OWNER',
        });

      expect(otherOwnerResponse.status).toBe(201);

      const otherOwnerToken = otherOwnerResponse.body.accessToken;

      const otherPropertyResponse = await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .send({
          ...validBuildingProperty,
          title: `Other Property ${timestamp}`,
          addressSubCity: 'Bole',
          addressWoreda: '03',
          addressHouseNumber: 'NEW-123'
        });

      expect(otherPropertyResponse.status).toBe(201);

      const otherPropertyId = otherPropertyResponse.body.property.id;

      // Try to create unit on other owner's property
      const response = await request(app)
        .post(`/api/v1/properties/${otherPropertyId}/units`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(validRentalUnit)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Access denied');
    });

    describe('Validation Tests', () => {
      it('should validate required fields', async () => {
        const response = await request(app)
          .post(`/api/v1/properties/${propertyId}/units`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('errors');
      });

      it('should validate rent amount is positive', async () => {
        const invalidUnit = {
          ...validRentalUnit,
          unitIdentifier: 'Apt 102',
          rentAmount: -1000,
        };

        const response = await request(app)
          .post(`/api/v1/properties/${propertyId}/units`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(invalidUnit)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should validate bedrooms range', async () => {
        const invalidUnit = {
          ...validRentalUnit,
          unitIdentifier: 'Apt 103',
          bedrooms: 25, // Over max of 20
        };

        const response = await request(app)
          .post(`/api/v1/properties/${propertyId}/units`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(invalidUnit)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should validate bedroom count', async () => {
        const invalidUnit = {
          ...validRentalUnit,
          unitIdentifier: 'Apt 103',
          bedrooms: 25, // Over max of 20
        };

        const response = await request(app)
          .post(`/api/v1/properties/${propertyId}/units`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(invalidUnit)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should reject unknown fields when creating a unit', async () => {
        const response = await request(app)
          .post(`/api/v1/properties/${propertyId}/units`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            ...validRentalUnit,
            unitIdentifier: 'Apt 104',
            unexpectedField: 'not allowed',
          })
          .expect(400);

        expect(response.body.error).toBe('Validation failed');
        expect(response.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'unexpectedField', message: 'Unknown body field' }),
          ])
        );
      });
    });
  });

  describe('GET /api/v1/units', () => {
    beforeEach(async () => {
      // Create additional units for testing
      await request(app)
        .post(`/api/v1/properties/${propertyId}/units`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...validRentalUnit,
          unitIdentifier: 'Apt 201',
          bedrooms: 3,
          rentAmount: 7000.00,
          floorNumber: 2,
        })
        .expect(201);

      await request(app)
        .post(`/api/v1/properties/${propertyId}/units`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...validRentalUnit,
          unitIdentifier: 'Apt 301',
          bedrooms: 1,
          rentAmount: 3000.00,
          floorNumber: 3,
        })
        .expect(201);
    });

    it('should list rental units for owner', async () => {
      const response = await request(app)
        .get('/api/v1/units')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should list rental units for tenant', async () => {
      const response = await request(app)
        .get('/api/v1/units')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject unknown query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/units?sort=desc')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'sort', message: 'Unknown query field' }),
        ])
      );
    });

    it('should filter units by property ID', async () => {
      const response = await request(app)
        .get(`/api/v1/units?propertyId=${propertyId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.data.every((unit: any) => unit.propertyId === propertyId)).toBe(true);
    });

    it('should filter units by bedrooms count', async () => {
      const response = await request(app)
        .get('/api/v1/units?bedrooms=2')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.data.every((unit: any) => unit.bedrooms === 2)).toBe(true);
    });

    it('should filter units by rent range', async () => {
      const response = await request(app)
        .get('/api/v1/units?minRent=4000&maxRent=6000')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.data.every((unit: any) =>
        unit.rentAmount >= 4000 && unit.rentAmount <= 6000
      )).toBe(true);
    });

    it('should filter units by status', async () => {
      const response = await request(app)
        .get('/api/v1/units?status=VACANT')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.data.every((unit: any) => unit.status === 'VACANT')).toBe(true);
    });

    it('should filter units by city', async () => {
      const response = await request(app)
        .get('/api/v1/units?city=Addis Ababa')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.data.every((unit: any) =>
        unit.property.addressCity === 'Addis Ababa'
      )).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/units?page=1&limit=2')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBeGreaterThan(0);
    });

    it('should not list units without authentication', async () => {
      await request(app)
        .get('/api/v1/units')
        .expect(401);
    });
  });

  describe('GET /api/v1/units/:unitId', () => {
    it('should get single rental unit with details', async () => {
      const response = await request(app)
        .get(`/api/v1/units/${unitId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('unit');
      expect(response.body.unit.id).toBe(unitId);
      expect(response.body.unit.property).toBeDefined();
      expect(response.body.unit.property.owner).toBeDefined();
    });

    it('should allow tenant to view unit details', async () => {
      const response = await request(app)
        .get(`/api/v1/units/${unitId}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('unit');
      expect(response.body.unit.id).toBe(unitId);
    });

    it('should return 404 for non-existent unit', async () => {
      const fakeUnitId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/units/${fakeUnitId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Rental unit not found');
    });

    it('should not get unit without authentication', async () => {
      await request(app)
        .get(`/api/v1/units/${unitId}`)
        .expect(401);
    });
  });

  describe('PUT /api/v1/units/:unitId', () => {
    it('should update rental unit successfully', async () => {
      const updateData = {
        rentAmount: 5500.00,
        status: 'MAINTENANCE',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/v1/units/${unitId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('unit');
      expect(response.body.unit.rentAmount).toBe(updateData.rentAmount);
      expect(response.body.unit.status).toBe(updateData.status);
      expect(response.body.unit.description).toBe(updateData.description);
    });

    it('should not allow other owner to update unit', async () => {
      const otherOwnerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'unitmalicious@test.com',
          password: 'password123',
          firstName: 'Unit',
          lastName: 'Malicious',
          role: 'OWNER',
        })
        .expect(201);

      const otherOwnerToken = otherOwnerResponse.body.accessToken;

      const response = await request(app)
        .put(`/api/v1/units/${unitId}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .send({ rentAmount: 999999 })
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Access denied');
    });

    it('should allow admin to update any unit', async () => {
      const response = await request(app)
        .put(`/api/v1/units/${unitId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rentAmount: 6000.00 })
        .expect(200);

      expect(response.body.unit.rentAmount).toBe(6000.00);
    });

    it('should not update unit with duplicate identifier', async () => {
      // First unit 'UNIQUE-UNIT-101' is created in beforeEach

      // Create another unit first
      const newUnitResponse = await request(app)
        .post(`/api/v1/properties/${propertyId}/units`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...validRentalUnit,
          unitIdentifier: 'Apt 401',
        })
        .expect(201);

      const newUnitId = newUnitResponse.body.unit.id;

      // Try to update with existing identifier 'UNIQUE-UNIT-101'
      const response = await request(app)
        .put(`/api/v1/units/${newUnitId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ unitIdentifier: 'UNIQUE-UNIT-101' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Unit identifier already exists for this property');
    });

    it('should not update unit without authentication', async () => {
      await request(app)
        .put(`/api/v1/units/${unitId}`)
        .send({ rentAmount: 7000.00 })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/units/:unitId', () => {
    let unitToDelete: string;

    beforeEach(async () => {
      // Create a unit for deletion test
      const response = await request(app)
        .post(`/api/v1/properties/${propertyId}/units`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...validRentalUnit,
          unitIdentifier: 'Apt 501',
        })
        .expect(201);

      unitToDelete = response.body.unit.id;
    });

    it('should delete rental unit successfully', async () => {
      await request(app)
        .delete(`/api/v1/units/${unitToDelete}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(204);

      // Verify unit is deleted
      await request(app)
        .get(`/api/v1/units/${unitToDelete}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(404);
    });

    it('should not delete occupied unit', async () => {
      // Mark a unit as occupied
      await request(app)
        .put(`/api/v1/units/${unitId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'OCCUPIED' })
        .expect(200);

      const response = await request(app)
        .delete(`/api/v1/units/${unitId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Cannot delete unit with active leases');
    });

    it('should not allow other owner to delete unit', async () => {
      const otherOwnerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'deletemalicious@test.com',
          password: 'password123',
          firstName: 'Delete',
          lastName: 'Malicious',
          role: 'OWNER',
        })
        .expect(201);

      const otherOwnerToken = otherOwnerResponse.body.accessToken;

      // Create a new unit to test deletion
      const testUnitResponse = await request(app)
        .post(`/api/v1/properties/${propertyId}/units`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...validRentalUnit,
          unitIdentifier: 'Apt 601',
        })
        .expect(201);

      const testUnitId = testUnitResponse.body.unit.id;

      const response = await request(app)
        .delete(`/api/v1/units/${testUnitId}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Access denied');
    });

    it('should not delete unit without authentication', async () => {
      // Create a new unit for this test
      const testUnitResponse = await request(app)
        .post(`/api/v1/properties/${propertyId}/units`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...validRentalUnit,
          unitIdentifier: 'Apt 701',
        })
        .expect(201);

      const testUnitId = testUnitResponse.body.unit.id;

      await request(app)
        .delete(`/api/v1/units/${testUnitId}`)
        .expect(401);
    });
  });
});

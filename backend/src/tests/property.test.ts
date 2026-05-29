import request from 'supertest';
import app from '../app';
import { User } from '../models/User';
import jwt, { SignOptions } from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/auth';

describe('Property Management Endpoints', () => {
  let ownerToken: string;
  let tenantToken: string;
  let adminToken: string;
  let propertyId: string;

  // Test data
  const validOwner = {
    email: 'owner@test.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Owner',
    phoneNumber: '+12345678901',
    role: 'OWNER',
  };

  const validTenant = {
    email: 'tenant@test.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Tenant',
    phoneNumber: '+12345678902',
    role: 'TENANT',
  };

  const validAdmin = {
    email: 'admin@test.com',
    password: 'password123',
    firstName: 'Admin',
    lastName: 'User',
    phoneNumber: '+12345678903',
    role: 'ADMIN',
  };

  const validBuildingProperty = {
    title: 'Sunrise Apartments',
    description: 'Modern building in Bole',
    type: 'BUILDING',
    addressCity: 'Addis Ababa',
    addressStreet: 'Bole Road',
    buildingDetails: {
      buildingType: 'APARTMENT',
      totalFloors: 5,
      totalUnits: 20,
      hasParking: true,
      hasElevator: true,
      hasSecurity: false,
    },
  };

  const validVehicleProperty = {
    title: 'Toyota Corolla 2020',
    description: 'Well-maintained sedan',
    type: 'VEHICLE',
    addressCity: 'Addis Ababa',
    addressStreet: 'Mexico',
    vehicleDetails: {
      plateNumber: 'AA-12345',
      vehicleType: 'SEDAN',
      brand: 'Toyota',
      model: 'Corolla',
      manufactureYear: 2020,
      color: 'White',
      transmissionType: 'AUTOMATIC',
      fuelType: 'PETROL',
    },
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

    // Create a property for tests that need it
    const propResponse = await request(app)
      .post('/api/v1/properties')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(validBuildingProperty)
      .expect(201);
    propertyId = propResponse.body.property.id;
  });

  describe('POST /api/v1/properties', () => {
    describe('Building Properties', () => {
      it('should create a building property successfully', async () => {
        const response = await request(app)
          .post('/api/v1/properties')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(validBuildingProperty)
          .expect(201);

        expect(response.body).toHaveProperty('property');
        expect(response.body.property.title).toBe(validBuildingProperty.title);
        expect(response.body.property.type).toBe('BUILDING');
        expect(response.body.property.buildingDetails).toBeDefined();
        expect(response.body.property.buildingDetails.buildingType).toBe('APARTMENT');
        expect(response.body.property.buildingDetails.totalFloors).toBe(5);

        propertyId = response.body.property.id;
      });

      it('should not create building property without building details', async () => {
        const invalidProperty = {
          ...validBuildingProperty,
          buildingDetails: undefined,
        };

        const response = await request(app)
          .post('/api/v1/properties')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(invalidProperty)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Building details are required');
      });

      it('should not create property without authentication', async () => {
        await request(app)
          .post('/api/v1/properties')
          .send(validBuildingProperty)
          .expect(401);
      });

      it('should not create property as tenant', async () => {
        const response = await request(app)
          .post('/api/v1/properties')
          .set('Authorization', `Bearer ${tenantToken}`)
          .send(validBuildingProperty)
          .expect(403);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Only owners can create properties');
      });
    });

    describe('Vehicle Properties', () => {
      it('should create a vehicle property successfully', async () => {
        const response = await request(app)
          .post('/api/v1/properties')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(validVehicleProperty)
          .expect(201);

        expect(response.body).toHaveProperty('property');
        expect(response.body.property.title).toBe(validVehicleProperty.title);
        expect(response.body.property.type).toBe('VEHICLE');
        expect(response.body.property.vehicleDetails).toBeDefined();
        expect(response.body.property.vehicleDetails.plateNumber).toBe('AA-12345');
        expect(response.body.property.vehicleDetails.brand).toBe('Toyota');
      });

      it('should not create vehicle property without vehicle details', async () => {
        const invalidProperty = {
          ...validVehicleProperty,
          vehicleDetails: undefined,
        };

        const response = await request(app)
          .post('/api/v1/properties')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(invalidProperty)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Vehicle details are required');
      });
    });

    describe('Validation Tests', () => {
      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/v1/properties')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('errors');
      });

      it('should validate property type', async () => {
        const invalidProperty = {
          ...validBuildingProperty,
          type: 'INVALID_TYPE',
        };

        const response = await request(app)
          .post('/api/v1/properties')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(invalidProperty)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should reject unknown fields on property creation', async () => {
        const response = await request(app)
          .post('/api/v1/properties')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            ...validBuildingProperty,
            unexpectedField: 'should fail',
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

  describe('GET /api/v1/properties', () => {
    it('should list properties for owner', async () => {
      const response = await request(app)
        .get('/api/v1/properties')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should list properties for tenant', async () => {
      const response = await request(app)
        .get('/api/v1/properties')
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter properties by type', async () => {
      const response = await request(app)
        .get('/api/v1/properties?type=BUILDING')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.data.every((prop: any) => prop.type === 'BUILDING')).toBe(true);
    });

    it('should filter properties by city', async () => {
      const response = await request(app)
        .get('/api/v1/properties?city=Addis Ababa')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.data.every((prop: any) => prop.addressCity === 'Addis Ababa')).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/properties?page=1&limit=1')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBeGreaterThan(0);
    });

    it('should not list properties without authentication', async () => {
      await request(app)
        .get('/api/v1/properties')
        .expect(401);
    });

    it('should reject unknown query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/properties?sort=desc')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'sort', message: 'Unknown query field' }),
        ])
      );
    });
  });

  describe('GET /api/v1/properties/:propertyId', () => {
    it('should get single property with details', async () => {
      const response = await request(app)
        .get(`/api/v1/properties/${propertyId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('property');
      expect(response.body.property.id).toBe(propertyId);
      expect(response.body.property.buildingDetails).toBeDefined();
      expect(response.body.property.rentalUnits).toBeDefined();
      expect(response.body.property.media).toBeDefined();
    });

    it('should allow tenant to access other owner\'s property details for browsing', async () => {
      // Create property with different owner
      const otherOwnerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'otherowner@test.com',
          password: 'password123',
          firstName: 'Other',
          lastName: 'Owner',
          role: 'OWNER',
        })
        .expect(201);

      const otherOwnerToken = otherOwnerResponse.body.accessToken;

      const otherPropertyResponse = await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .send(validBuildingProperty)
        .expect(201);

      const otherPropertyId = otherPropertyResponse.body.property.id;

      // Try to access with tenant token
      const response = await request(app)
        .get(`/api/v1/properties/${otherPropertyId}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      // Tenants should be able to view property details (as per API spec)
      expect(response.body.property).toBeDefined();
    });

    it('should return 404 for non-existent property', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/properties/${fakeId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Property not found');
    });

    it('should not get property without authentication', async () => {
      await request(app)
        .get(`/api/v1/properties/${propertyId}`)
        .expect(401);
    });
  });

  describe('PUT /api/v1/properties/:propertyId', () => {
    it('should update property successfully', async () => {
      const updateData = {
        title: 'Updated Sunrise Apartments',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/v1/properties/${propertyId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('property');
      expect(response.body.property.title).toBe(updateData.title);
      expect(response.body.property.description).toBe(updateData.description);
    });

    it('should not allow other owner to update property', async () => {
      const otherOwnerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'maliciousowner@test.com',
          password: 'password123',
          firstName: 'Malicious',
          lastName: 'Owner',
          role: 'OWNER',
        })
        .expect(201);

      const otherOwnerToken = otherOwnerResponse.body.accessToken;

      const response = await request(app)
        .put(`/api/v1/properties/${propertyId}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .send({ title: 'Hacked Property' })
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Access denied');
    });

    it('should allow admin to update any property', async () => {
      const response = await request(app)
        .put(`/api/v1/properties/${propertyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Updated Property' })
        .expect(200);

      expect(response.body.property.title).toBe('Admin Updated Property');
    });

    it('should not update property without authentication', async () => {
      await request(app)
        .put(`/api/v1/properties/${propertyId}`)
        .send({ title: 'No Auth Update' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/properties/:propertyId', () => {
    it('should delete property successfully', async () => {
      // Create a property for deletion test within the test
      const response = await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(validVehicleProperty)
        .expect(201);

      const propertyToDelete = response.body.property.id;

      await request(app)
        .delete(`/api/v1/properties/${propertyToDelete}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(204);

      // Verify property is deleted (it remains in DB with status DELETED)
      const getResponse = await request(app)
        .get(`/api/v1/properties/${propertyToDelete}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(getResponse.body.property.status).toBe('DELETED');
    });

    it('should not allow other owner to delete property', async () => {
      // Create other owner
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

      // Create a property owned by the original owner for this test
      const propResponse = await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(validVehicleProperty)
        .expect(201);
      const targetPropertyId = propResponse.body.property.id;

      const response = await request(app)
        .delete(`/api/v1/properties/${targetPropertyId}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Access denied');
    });

    it('should not delete property without authentication', async () => {
      await request(app)
        .delete(`/api/v1/properties/${propertyId}`)
        .expect(401);
    });
  });

  describe('Property Media Upload', () => {
    let mediaPropertyId: string;

    // Create a property for media tests
    beforeEach(async () => {
      // Re-register users before each test because setup.ts clears the database
      // Using unique email to avoid 409 Conflict if cleanup fails
      const uniqueOwner = { ...validOwner, email: `mediaowner-${Date.now()}@test.com` };
      const ownerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(uniqueOwner)
        .expect(201);
      ownerToken = ownerResponse.body.accessToken;

      const response = await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(validBuildingProperty)
        .expect(201);

      mediaPropertyId = response.body.property.id;
    });

    it('should upload property media successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/upload/property-media/${mediaPropertyId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08]), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .field('description', 'Test property image')
        .field('isPrimary', 'true')
        .expect(201);

      expect(response.body.media).toHaveProperty('id');
      expect(response.body).toHaveProperty('fileName');
    });

    it('should reject files whose content does not match the declared type', async () => {
      const response = await request(app)
        .post(`/api/v1/upload/property-media/${mediaPropertyId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('file', Buffer.from('not really a jpeg'), {
          filename: 'spoofed.jpg',
          contentType: 'image/jpeg',
        })
        .expect(400);

      expect(response.body.error).toContain('Uploaded file content does not match the declared file type');
    });

    it('should not upload media without file', async () => {
      const response = await request(app)
        .post(`/api/v1/upload/property-media/${mediaPropertyId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('No file uploaded');
    });

    it('should not upload media without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/upload/property-media/${mediaPropertyId}`)
        .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08]), 'test.jpg')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Access token required');
    });

    it('should download property media successfully', async () => {
      const uploadResponse = await request(app)
        .post(`/api/v1/upload/property-media/${mediaPropertyId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08]), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      const mediaId = uploadResponse.body.media.id;

      await request(app)
        .get(`/api/v1/download/property-media/${mediaId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });
  });
});

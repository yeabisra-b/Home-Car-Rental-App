import request from 'supertest';
import app from '../app';
import { User } from '../models/User';
import { Property } from '../models/Property';
import { createAccessToken } from './helpers/factories';

describe('Admin Endpoints', () => {
  let adminToken: string;
  let adminUser: User;
  let regularUser: User;
  let regularUserToken: string;

  const seedAdminContext = async () => {
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
    });

    adminToken = createAccessToken(adminUser.id);

    regularUser = await User.create({
      email: 'user@test.com',
      password: 'user123',
      firstName: 'Regular',
      lastName: 'User',
      role: 'TENANT',
      accountStatus: 'ACTIVE',
    });

    regularUserToken = createAccessToken(regularUser.id);
  };

  describe('POST /api/v1/admin/create-admin', () => {
    const validAdmin = {
      email: 'newadmin@test.com',
      password: 'newadmin123',
      firstName: 'New',
      lastName: 'Admin',
      phoneNumber: '+12345678901',
    };

    describe('bootstrap behavior', () => {
      beforeEach(async () => {
        await User.destroy({ where: {}, force: true });
      });

      it('should bootstrap the first admin account without authentication', async () => {
        const response = await request(app)
          .post('/api/v1/admin/create-admin')
          .send(validAdmin)
          .expect(201);

        expect(response.body.user.email).toBe(validAdmin.email);
        expect(response.body.user.role).toBe('ADMIN');
      });

      it('should require authentication once an admin already exists', async () => {
        await request(app)
          .post('/api/v1/admin/create-admin')
          .send(validAdmin)
          .expect(201);

        const response = await request(app)
          .post('/api/v1/admin/create-admin')
          .send({
            ...validAdmin,
            email: 'second-admin@test.com',
          })
          .expect(401);

        expect(response.body.error).toBe('Access token required');
      });
    });

    describe('authenticated admin creation', () => {
      beforeEach(async () => {
        await User.destroy({ where: {}, force: true });
        await seedAdminContext();
      });

    it('should create admin account when requester is admin', async () => {
      const response = await request(app)
        .post('/api/v1/admin/create-admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validAdmin)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(validAdmin.email);
      expect(response.body.user.role).toBe('ADMIN');
      expect(response.body.user).not.toHaveProperty('password');
    });

      it('should return 403 when non-admin tries to create admin', async () => {
      const response = await request(app)
        .post('/api/v1/admin/create-admin')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(validAdmin)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });

      it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post('/api/v1/admin/create-admin')
        .send(validAdmin)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

      it('should return 409 when admin email already exists', async () => {
      // Try to create admin with existing admin email
      const duplicateAdmin = {
        ...validAdmin,
        email: adminUser.email,
      };

      const response = await request(app)
        .post('/api/v1/admin/create-admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateAdmin)
        .expect(409);

      expect(response.body.error).toBe('Admin with this email already exists');
    });

      it('should validate required fields', async () => {
      const invalidAdmin = {
        email: 'invalid-email',
        password: '123', // Too short
        // Missing firstName and lastName
      };

      const response = await request(app)
        .post('/api/v1/admin/create-admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidAdmin)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });
    });
  });

  describe('GET /api/v1/admin/users', () => {
    beforeEach(async () => {
      await seedAdminContext();

      await User.create({
        email: 'owner@test.com',
        password: 'owner123',
        firstName: 'Property',
        lastName: 'Owner',
        role: 'OWNER',
        accountStatus: 'ACTIVE',
      });

      await User.create({
        email: 'tenant@test.com',
        password: 'tenant123',
        firstName: 'Regular',
        lastName: 'Tenant',
        role: 'TENANT',
        accountStatus: 'INACTIVE',
      });
    });

    it('should return all users when requester is admin', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body.data).toHaveLength(4); // admin + regular + owner + tenant
      expect(response.body.total).toBe(4);
    });

    it('should return 403 when non-admin tries to list users', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users?role=TENANT')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2); // regular user + inactive tenant
      response.body.data.forEach((user: any) => {
        expect(user.role).toBe('TENANT');
      });
    });

    it('should filter users by account status', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users?accountStatus=ACTIVE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(3); // admin + regular + owner
      response.body.data.forEach((user: any) => {
        expect(user.accountStatus).toBe('ACTIVE');
      });
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBe(2);
      expect(response.body.total).toBe(4);
    });

    it('should not include passwords in response', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.data.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should reject unknown query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users?sort=desc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'sort', message: 'Unknown query field' }),
        ])
      );
    });
  });

  describe('DELETE /api/v1/admin/users/:userId', () => {
    let userToDelete: User;

    beforeEach(async () => {
      await seedAdminContext();

      userToDelete = await User.create({
        email: 'delete@test.com',
        password: 'delete123',
        firstName: 'Delete',
        lastName: 'Me',
        role: 'TENANT',
        accountStatus: 'ACTIVE',
      });
    });

    it('should delete user when requester is admin', async () => {
      await request(app)
        .delete(`/api/v1/admin/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Verify user is deleted
      const deletedUser = await User.findByPk(userToDelete.id);
      expect(deletedUser).toBeNull();
    });

    it('should return 403 when non-admin tries to delete user', async () => {
      const response = await request(app)
        .delete(`/api/v1/admin/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .delete(`/api/v1/admin/users/${userToDelete.id}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 404 when user does not exist', async () => {
      const fakeUserId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await request(app)
        .delete(`/api/v1/admin/users/${fakeUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should prevent admin from deleting themselves', async () => {
      const response = await request(app)
        .delete(`/api/v1/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error).toBe('Cannot remove your own account');

      // Verify admin still exists
      const adminStillExists = await User.findByPk(adminUser.id);
      expect(adminStillExists).not.toBeNull();
    });

    it('should prevent deleting a user with active property dependencies', async () => {
      const ownerWithProperty = await User.create({
        email: 'owner-with-property@test.com',
        password: 'owner123',
        firstName: 'Owner',
        lastName: 'Dependency',
        role: 'OWNER',
        accountStatus: 'ACTIVE',
      });

      await Property.create({
        ownerId: ownerWithProperty.id,
        title: 'Dependency Property',
        type: 'BUILDING',
        addressCity: 'Addis Ababa',
        status: 'ACTIVE',
      });

      const response = await request(app)
        .delete(`/api/v1/admin/users/${ownerWithProperty.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error).toBe('Cannot remove user with active dependencies (properties, leases, etc.)');
    });
  });
});

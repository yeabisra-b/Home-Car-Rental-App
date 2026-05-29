import request from 'supertest';
import app from '../app';

describe('Authentication Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    const validUser = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+12345678901',
    };

    it('should register a new user successfully', async () => {
      const uniqueUser = {
        ...validUser,
        email: 'success-test@example.com',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(uniqueUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(uniqueUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not register user with existing email', async () => {
      // Create first user with unique email
      const firstUser = {
        ...validUser,
        email: 'first-user@example.com',
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(firstUser)
        .expect(201);

      // Try to create second user with same email as first user
      const duplicateUser = {
        ...validUser,
        email: 'first-user@example.com', // Same email as first user
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateUser)
        .expect(409);

      expect(response.body.error).toBe('User with this email already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errors).toBeInstanceOf(Array);
    });

    it('should set default role to TENANT', async () => {
      const userWithDefaultRole = {
        ...validUser,
        email: 'default-role-test@example.com',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userWithDefaultRole)
        .expect(201);

      expect(response.body.user.role).toBe('TENANT');
    });

    it('should allow custom role to be set', async () => {
      const userWithRole = {
        ...validUser,
        email: 'owner@example.com',
        role: 'OWNER',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userWithRole)
        .expect(201);

      expect(response.body.user.role).toBe('OWNER');
    });

    it('should prevent admin account creation through public registration', async () => {
      const adminUser = {
        ...validUser,
        email: 'malicious-admin@example.com',
        role: 'ADMIN',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(adminUser)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject unknown fields during registration', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validUser,
          email: 'unknown-field@example.com',
          unexpectedField: 'ignored-before-hardening',
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

  describe('POST /api/v1/auth/login', () => {
    const userData = {
      email: 'login-test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should not login with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@example.com',
          password: userData.password,
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Create and login a user to get refresh token
      const userData = {
        email: 'refresh-token-test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      refreshToken = registerResponse.body.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('should rotate refresh tokens and reject reuse of the old refresh token', async () => {
      const firstRefresh = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken })
        .expect(401);

      await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: firstRefresh.body.refreshToken })
        .expect(200);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.error).toBe('Invalid refresh token');
    });

    it('should require refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'refreshToken', message: 'Refresh token is required' }),
        ])
      );
    });

    it('should reject unknown fields when refreshing tokens', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken, scope: 'extra' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'scope', message: 'Unknown body field' }),
        ])
      );
    });
  });

  describe('Protected Routes', () => {
    let accessToken: string;
    let userData: any;

    beforeEach(async () => {
      // Create and login a user
      const user = {
        email: 'protected-routes-test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(user);

      accessToken = registerResponse.body.accessToken;
      userData = registerResponse.body.user;
    });

    describe('GET /api/v1/auth/profile', () => {
      it('should get user profile with valid token', async () => {
        const response = await request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.user.email).toBe(userData.email);
        expect(response.body.user).not.toHaveProperty('password');
      });

      it('should reject request without token', async () => {
        const response = await request(app)
          .get('/api/v1/auth/profile')
          .expect(401);

        expect(response.body.error).toContain('token');
      });

      it('should reject request with invalid token', async () => {
        const response = await request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.error).toContain('token');
      });
    });

    describe('PUT /api/v1/auth/profile', () => {
      it('should update user profile with valid token', async () => {
        const updateData = {
          firstName: 'Jane',
          lastName: 'Smith',
        };

        const response = await request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.user.firstName).toBe(updateData.firstName);
        expect(response.body.user.lastName).toBe(updateData.lastName);
      });

      it('should reject email or password through profile updates', async () => {
        const updateData = {
          email: 'newemail@example.com',
          password: 'newpassword',
        };

        const response = await request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body.error).toBe('Validation failed');
        expect(response.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'email', message: 'Unknown body field' }),
            expect.objectContaining({ field: 'password', message: 'Unknown body field' }),
          ])
        );
      });
    });

    describe('POST /api/v1/auth/logout', () => {
      it('should logout with valid token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.message).toBe('Logged out successfully');
      });

      it('should invalidate the current access token after logout', async () => {
        await request(app)
          .post('/api/v1/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const response = await request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(401);

        expect(response.body.error).toBe('Session has been invalidated');
      });

      it('should invalidate the current refresh token after logout', async () => {
        const registerResponse = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'logout-refresh-test@example.com',
            password: 'password123',
            firstName: 'Logout',
            lastName: 'Refresh',
          })
          .expect(201);

        await request(app)
          .post('/api/v1/auth/logout')
          .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
          .expect(200);

        const response = await request(app)
          .post('/api/v1/auth/refresh-token')
          .send({ refreshToken: registerResponse.body.refreshToken })
          .expect(401);

        expect(response.body.error).toBe('Invalid refresh token');
      });

      it('should reject logout without token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/logout')
          .expect(401);

        expect(response.body.error).toContain('token');
      });
    });

    describe('Profile Picture', () => {
      it('should upload profile picture successfully', async () => {
        const response = await request(app)
          .post(`/api/v1/upload/user-profile/${userData.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]), 'profile.jpg')
          .expect(200);

        expect(response.body.user).toBeDefined();
        expect(response.body.fileName).toBeDefined();
      });

      it('should download profile picture successfully', async () => {
        // Upload first
        await request(app)
          .post(`/api/v1/upload/user-profile/${userData.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]), 'profile.jpg')
          .expect(200);

        const response = await request(app)
          .get(`/api/v1/download/user-profile/${userData.id}`)
          .expect(200);

        expect(response.body).toBeDefined();
      });

      it('should return 404 for non-existent profile picture', async () => {
        const registerResponse = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'no-pic@example.com',
            password: 'password123',
            firstName: 'No',
            lastName: 'Pic',
          })
          .expect(201);

        await request(app)
          .get(`/api/v1/download/user-profile/${registerResponse.body.user.id}`)
          .expect(404);
      });
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});

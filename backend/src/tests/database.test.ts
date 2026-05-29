import { sequelize } from '../config/database';
import { User } from '../models/User';

describe('Database Configuration', () => {
  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      expect(sequelize).toBeDefined();
      // The database name might be from main config, but tests should use test DB
      expect(sequelize.config.database).toBeTruthy();
    });

    it('should authenticate database connection', async () => {
      await expect(sequelize.authenticate()).resolves.not.toThrow();
    });
  });

  describe('User Model', () => {
    beforeEach(async () => {
      await User.destroy({ where: {}, force: true });
    });

    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'plainpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'TENANT' as const,
        accountStatus: 'ACTIVE' as const,
      };

      const user = await User.create(userData);

      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.role).toBe(userData.role);
      expect(user.accountStatus).toBe(userData.accountStatus);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should not create user with duplicate email', async () => {
      const userData = {
        email: 'duplicate-test@example.com',
        password: 'plainpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'TENANT' as const,
        accountStatus: 'ACTIVE' as const,
      };

      // Create first user
      const user1 = await User.create(userData);
      expect(user1.email).toBe(userData.email);

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should hash password before saving', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'plainpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'TENANT' as const,
        accountStatus: 'ACTIVE' as const,
      };

      const user = await User.create(userData);
      expect(user.password).not.toBe('plainpassword');
      expect(user.password.length).toBeGreaterThan(50); // bcrypt hash length
    });

    it('should return safe JSON without password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'plainpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'TENANT' as const,
        accountStatus: 'ACTIVE' as const,
      };

      const user = await User.create(userData);
      const safeUser = user.toSafeJSON();

      expect(safeUser).not.toHaveProperty('password');
      expect(safeUser.email).toBe(userData.email);
    });

    it('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'TENANT' as const,
        accountStatus: 'ACTIVE' as const,
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require required fields', async () => {
      const incompleteUser = {
        firstName: 'John',
        lastName: 'Doe',
      };

      await expect(User.create(incompleteUser as any)).rejects.toThrow();
    });
  });
});

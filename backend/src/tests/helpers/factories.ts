import jwt, { SignOptions } from 'jsonwebtoken';
import { models } from '../../config/database';
import { JWT_CONFIG } from '../../config/auth';
import { User } from '../../models/User';
import { Property } from '../../models/Property';
import { RentalUnit } from '../../models/RentalUnit';

let counter = 0;

function uniqueValue(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export async function createUser(overrides: Partial<User['dataValues']> = {}): Promise<User> {
  return models.User.create({
    email: `${uniqueValue('user')}@test.local`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: 'TENANT',
    accountStatus: 'ACTIVE',
    ...overrides,
  });
}

export function createAccessToken(userId: string): string {
  return jwt.sign(
    { userId, sessionVersion: 0, tokenType: 'access' },
    JWT_CONFIG.ACCESS_TOKEN_SECRET,
    { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN } as SignOptions
  );
}

export async function createProperty(ownerId: string, overrides: Partial<Property['dataValues']> = {}): Promise<Property> {
  return models.Property.create({
    ownerId,
    title: uniqueValue('property'),
    description: 'Test property',
    type: 'BUILDING',
    addressCity: 'Addis Ababa',
    status: 'ACTIVE',
    ...overrides,
  });
}

export async function createRentalUnit(propertyId: string, overrides: Partial<RentalUnit['dataValues']> = {}): Promise<RentalUnit> {
  return models.RentalUnit.create({
    propertyId,
    unitIdentifier: uniqueValue('unit'),
    rentAmount: 5000,
    status: 'VACANT',
    ...overrides,
  });
}

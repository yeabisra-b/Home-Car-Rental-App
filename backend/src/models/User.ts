import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS } from '../config/auth';
import { v4 as uuidv4 } from 'uuid';

export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  refreshTokenHash?: string | null;
  sessionVersion: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber?: string;
  role: 'OWNER' | 'TENANT' | 'ADMIN';
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  profilePictureUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreationAttributes extends Optional<
  UserAttributes,
  'id' | 'refreshTokenHash' | 'sessionVersion' | 'middleName' | 'phoneNumber' | 'profilePictureUrl' | 'createdAt' | 'updatedAt'
> { }

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public refreshTokenHash?: string | null;
  public sessionVersion!: number;
  public firstName!: string;
  public middleName?: string;
  public lastName!: string;
  public phoneNumber?: string;
  public role!: 'OWNER' | 'TENANT' | 'ADMIN';
  public accountStatus!: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  public profilePictureUrl?: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  public toSafeJSON(): Omit<UserAttributes, 'password' | 'refreshTokenHash' | 'sessionVersion'> {
    const { password, refreshTokenHash, sessionVersion, ...safeUser } = this.toJSON();
    return safeUser;
  }
}

export function initUser(sequelize: any): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      refreshTokenHash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      sessionVersion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      middleName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM('OWNER', 'TENANT', 'ADMIN'),
        allowNull: false,
        defaultValue: 'TENANT',
      },
      accountStatus: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      profilePictureUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      hooks: {
        beforeCreate: async (user: User) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
          }
        },
        beforeUpdate: async (user: User) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
          }
        },
      },
    }
  );

  return User;
}

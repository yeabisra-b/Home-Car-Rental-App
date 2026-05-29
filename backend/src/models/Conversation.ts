import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export interface ConversationAttributes {
  id: string;
  propertyId?: string | null;
  participantAId: string;
  participantBId: string;
  lastMessageId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationCreationAttributes extends Optional<ConversationAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
  public id!: string;
  public propertyId?: string | null;
  public participantAId!: string;
  public participantBId!: string;
  public lastMessageId?: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initConversation(sequelize: any): typeof Conversation {
  Conversation.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      propertyId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'properties',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      participantAId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      participantBId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      lastMessageId: {
        type: DataTypes.UUID,
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
      modelName: 'Conversation',
      tableName: 'conversations',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['participantAId', 'participantBId', 'propertyId'],
        },
      ],
    }
  );

  return Conversation;
}

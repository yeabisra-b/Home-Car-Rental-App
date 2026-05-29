import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export interface MessageAttributes {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string;
  content: string;
  conversationId: string;
  readAt?: Date | null;
  createdAt: Date;
}

export interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'readAt' | 'createdAt'> {}

export class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: string;
  public senderId!: string;
  public receiverId!: string;
  public subject!: string;
  public content!: string;
  public conversationId!: string;
  public readAt?: Date | null;
  public createdAt!: Date;
}

export function initMessage(sequelize: any): typeof Message {
  Message.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      receiverId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 255],
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Message',
      tableName: 'messages',
      timestamps: false,
      updatedAt: false,
      indexes: [
        {
          fields: ['senderId'],
        },
        {
          fields: ['receiverId'],
        },
        {
          fields: ['createdAt'],
        },
      ],
    }
  );

  return Message;
}

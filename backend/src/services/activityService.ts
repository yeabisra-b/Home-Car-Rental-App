import { models } from '../config/database';

export type ActivityType = 
  | 'LEASE_SIGNED' 
  | 'MAINTENANCE_CREATED' 
  | 'MESSAGE_SENT' 
  | 'PAYMENT_RECEIVED' 
  | 'PROPERTY_ADDED';

interface LogActivityInput {
  userId: string;
  type: ActivityType;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: any;
}

export const logActivity = async (input: LogActivityInput) => {
  return models.ActivityLog.create({
    userId: input.userId,
    type: input.type,
    entityType: input.entityType,
    entityId: input.entityId,
    description: input.description,
    metadata: input.metadata || {}
  });
};

export const getRecentActivities = async (userId: string, limit = 10) => {
  return models.ActivityLog.findAll({
    where: { userId },
    limit,
    order: [['createdAt', 'DESC']]
  });
};

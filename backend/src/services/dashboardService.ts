import { Op } from 'sequelize';
import { models } from '../config/database';
import { UserAttributes } from '../models/User';

export const getOwnerDashboardStats = async (user: UserAttributes) => {
  const { Property, RentalUnit, Lease, MaintenanceRequest, Invoice } = models;

  // 1. Total Properties
  const propertiesCount = await Property.count({
    where: { ownerId: user.id, status: { [Op.ne]: 'DELETED' } }
  });

  // 2. Total Units and Occupancy
  const properties = await Property.findAll({
    where: { ownerId: user.id, status: { [Op.ne]: 'DELETED' } },
    attributes: ['id']
  });
  const propertyIds = properties.map(p => p.id);

  const unitsCount = await RentalUnit.count({
    where: { propertyId: { [Op.in]: propertyIds } }
  });

  const occupiedUnitsCount = await RentalUnit.count({
    where: { 
      propertyId: { [Op.in]: propertyIds },
      status: 'OCCUPIED'
    }
  });

  const occupancyRate = unitsCount > 0 ? Math.round((occupiedUnitsCount / unitsCount) * 100) : 0;

  // 3. Active Leases
  const activeLeasesCount = await Lease.count({
    where: { 
      unitId: { [Op.in]: await getUnitIdsForOwner(user.id) },
      status: 'ACTIVE'
    }
  });

  // 4. Urgent Maintenance Requests
  const urgentRequestsCount = await MaintenanceRequest.count({
    where: {
      unitId: { [Op.in]: await getUnitIdsForOwner(user.id) },
      priority: 'URGENT',
      status: { [Op.in]: ['OPEN', 'IN_PROGRESS'] }
    }
  });

  // 5. Revenue MTD (Month To Date)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const revenueMTD = await Invoice.sum('amountDue', {
    where: {
      leaseId: { [Op.in]: await getLeaseIdsForOwner(user.id) },
      status: 'PAID',
      updatedAt: { [Op.gte]: startOfMonth }
    }
  });

  return {
    propertiesCount,
    unitsCount,
    occupancyRate,
    activeLeasesCount,
    urgentRequestsCount,
    revenueMTD: revenueMTD || 0
  };
};

export const getTenantDashboardStats = async (user: UserAttributes) => {
  const { Lease, MaintenanceRequest, Notification } = models;

  // 1. Current Rent
  const activeLease = await Lease.findOne({
    where: { tenantId: user.id, status: 'ACTIVE' }
  });

  // 2. Days until due (simplified: assume 5th of month if not found)
  // In a real app, this would check the next unpaid invoice
  const daysUntilDue = 5; 

  // 3. Pending Maintenance
  const pendingRequestsCount = await MaintenanceRequest.count({
    where: { tenantId: user.id, status: { [Op.in]: ['OPEN', 'IN_PROGRESS'] } }
  });

  // 4. Unread Notifications/Messages
  const unreadMessagesCount = await Notification.count({
    where: { userId: user.id, isRead: false, type: 'MESSAGE' }
  });

  return {
    currentRentAmount: activeLease ? activeLease.monthlyRent : 0,
    daysUntilDue,
    pendingRequestsCount,
    unreadMessagesCount
  };
};

// Helper functions
async function getUnitIdsForOwner(ownerId: string): Promise<string[]> {
  const { Property, RentalUnit } = models;
  const properties = await Property.findAll({ where: { ownerId }, attributes: ['id'] });
  const units = await RentalUnit.findAll({ 
    where: { propertyId: { [Op.in]: properties.map(p => p.id) } },
    attributes: ['id']
  });
  return units.map(u => u.id);
}

async function getLeaseIdsForOwner(ownerId: string): Promise<string[]> {
  const { Lease } = models;
  const unitIds = await getUnitIdsForOwner(ownerId);
  const leases = await Lease.findAll({ where: { unitId: { [Op.in]: unitIds } }, attributes: ['id'] });
  return leases.map(l => l.id);
}

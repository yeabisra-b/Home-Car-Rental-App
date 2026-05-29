import { Op } from 'sequelize';
import { models } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { UserAttributes } from '../models/User';

export const getCashFlowReport = async (user: UserAttributes, params: { startDate: string; endDate: string; propertyId?: string }) => {
  if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
    throw createError('Access denied', 403);
  }

  const { Invoice, Property, RentalUnit, Lease, PaymentReceipt } = models;
  
  const start = new Date(params.startDate);
  const end = new Date(params.endDate);

  const propertyWhere: any = {};
  if (user.role === 'OWNER') propertyWhere.ownerId = user.id;
  if (params.propertyId) propertyWhere.id = params.propertyId;

  // Find all units for these properties
  const units = await RentalUnit.findAll({
    include: [{
      model: Property,
      as: 'property',
      where: propertyWhere,
      attributes: ['id', 'title']
    }]
  });

  const unitIds = units.map(u => u.id);

  // Find all invoices for these units in the date range
  const invoices = await Invoice.findAll({
    where: {
      dueDate: { [Op.between]: [start, end] },
      status: { [Op.ne]: 'VOID' }
    },
    include: [
      {
        model: Lease,
        as: 'lease',
        where: { unitId: { [Op.in]: unitIds } },
        attributes: ['unitId']
      },
      {
        model: PaymentReceipt,
        as: 'receipts'
      }
    ]
  });

  // Aggregate results by month
  const report: any = {};
  
  invoices.forEach((inv: any) => {
    const month = inv.dueDate.toISOString().substring(0, 7); // YYYY-MM
    if (!report[month]) {
      report[month] = { income: 0, expected: 0, expenses: 0 };
    }
    
    report[month].expected += Number(inv.totalAmount);
    inv.receipts?.forEach((r: any) => {
      report[month].income += Number(r.amount);
    });
  });

  return Object.keys(report).sort().map(month => ({
    month,
    ...report[month]
  }));
};

export const getPropertyPerformance = async (user: UserAttributes, propertyId: string) => {
  if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
    throw createError('Access denied', 403);
  }

  const { RentalUnit, Lease, Invoice, PaymentReceipt, Property } = models;

  const property = await Property.findByPk(propertyId);
  if (!property) throw createError('Property not found', 404);
  if (user.role === 'OWNER' && property.ownerId !== user.id) throw createError('Access denied', 403);

  const units = await RentalUnit.findAll({
    where: { propertyId },
    include: [
      {
        model: Lease,
        as: 'leases',
        where: { status: 'ACTIVE' },
        required: false
      }
    ]
  });

  const occupancyRate = (units.filter(u => u.status === 'OCCUPIED').length / units.length) * 100;

  // Financials (last 12 months)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const unitIds = units.map(u => u.id);
  const invoices = await Invoice.findAll({
    where: {
      dueDate: { [Op.gte]: oneYearAgo },
      status: { [Op.ne]: 'VOID' }
    },
    include: [
      {
        model: Lease,
        as: 'lease',
        where: { unitId: { [Op.in]: unitIds } },
        attributes: []
      },
      {
        model: PaymentReceipt,
        as: 'receipts',
        attributes: ['amount']
      }
    ]
  });

  const totalIncome = invoices.reduce((acc, inv: any) => {
    const receiptsSum = inv.receipts?.reduce((sum: number, r: any) => sum + Number(r.amount), 0) || 0;
    return acc + receiptsSum;
  }, 0);

  return {
    propertyId,
    title: property.title,
    occupancyRate: Math.round(occupancyRate * 100) / 100,
    totalIncome,
    totalUnits: units.length,
    occupiedUnits: units.filter(u => u.status === 'OCCUPIED').length
  };
};

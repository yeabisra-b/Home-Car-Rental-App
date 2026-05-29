import { Op } from 'sequelize';
import { models, sequelize } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { User } from '../models/User';

interface ListInvoicesInput {
  status?: string;
  leaseId?: string;
  billingMonth?: string;
  page?: string | number;
  limit?: string | number;
}

interface UploadReceiptInput {
  transactionRef?: string;
  paymentMethod?: string;
}

interface ReviewInvoiceInput {
  status: 'PAID' | 'UNPAID';
  reviewNote?: string;
}

function getInvoiceIncludes() {
  return [
    {
      model: models.Lease,
      as: 'lease',
      include: [
        {
          model: models.RentalUnit,
          as: 'unit',
          include: [
            {
              model: models.Property,
              as: 'property',
              attributes: ['id', 'title', 'ownerId', 'addressCity', 'addressStreet'],
            },
          ],
        },
        {
          model: models.User,
          as: 'tenant',
          attributes: ['id', 'email', 'firstName', 'middleName', 'lastName', 'phoneNumber'],
        },
      ],
    },
    {
      model: models.PaymentReceipt,
      as: 'receipts',
      required: false,
    },
    {
      model: models.User,
      as: 'reviewer',
      attributes: ['id', 'email', 'firstName', 'lastName'],
      required: false,
    },
  ];
}

function normalizeBillingMonth(input?: string): string {
  const date = input ? new Date(`${input}T00:00:00.000Z`) : new Date();
  date.setUTCDate(1);
  return date.toISOString().slice(0, 10);
}

function getDueDateForBillingMonth(billingMonth: string): string {
  const date = new Date(`${billingMonth}T00:00:00.000Z`);
  date.setUTCDate(5);
  return date.toISOString().slice(0, 10);
}

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function listInvoicesForUser(user: User | undefined, input: ListInvoicesInput) {
  if (!user) {
    throw createError('Authentication required', 401);
  }

  const whereClause: Record<string, unknown> = {};
  if (input.status) {
    whereClause.status = input.status;
  }
  if (input.leaseId) {
    whereClause.leaseId = input.leaseId;
  }
  if (input.billingMonth) {
    whereClause.billingMonth = normalizeBillingMonth(input.billingMonth);
  }

  const leaseWhereClause: Record<string, unknown> = {};
  if (user.role === 'TENANT') {
    leaseWhereClause.tenantId = user.id;
  }

  const propertyWhereClause: Record<string, unknown> = {};
  if (user.role === 'OWNER') {
    propertyWhereClause.ownerId = user.id;
  }

  const page = Number(input.page || 1);
  const limit = Number(input.limit || 20);
  const offset = (page - 1) * limit;

  const { count, rows } = await models.Invoice.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: models.Lease,
        as: 'lease',
        required: true,
        ...(Object.keys(leaseWhereClause).length > 0 ? { where: leaseWhereClause } : {}),
        include: [
          {
            model: models.RentalUnit,
            as: 'unit',
            include: [
              {
                model: models.Property,
                as: 'property',
                attributes: ['id', 'title', 'ownerId', 'addressCity', 'addressStreet'],
                ...(Object.keys(propertyWhereClause).length > 0 ? { where: propertyWhereClause } : {}),
              },
            ],
          },
          {
            model: models.User,
            as: 'tenant',
            attributes: ['id', 'email', 'firstName', 'middleName', 'lastName', 'phoneNumber'],
          },
        ],
      },
      {
        model: models.PaymentReceipt,
        as: 'receipts',
        required: false,
      },
    ],
    distinct: true,
    limit,
    offset,
    order: [['billingMonth', 'DESC'], ['createdAt', 'DESC']],
  });

  return {
    data: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
}

export async function getInvoiceForUser(user: User | undefined, invoiceId: string) {
  if (!user) {
    throw createError('Authentication required', 401);
  }

  const invoice = await models.Invoice.findByPk(invoiceId, {
    include: getInvoiceIncludes(),
  });

  if (!invoice) {
    throw createError('Invoice not found', 404);
  }

  const lease = invoice.get('lease') as { tenantId?: string; unit?: { property?: { ownerId: string } } } | undefined;
  const ownerId = lease?.unit?.property?.ownerId;

  if (user.role === 'TENANT' && lease?.tenantId !== user.id) {
    throw createError('Access denied', 403);
  }

  if (user.role === 'OWNER' && ownerId !== user.id) {
    throw createError('Access denied', 403);
  }

  return invoice;
}

export async function uploadReceiptForTenant(
  user: User | undefined,
  invoiceId: string,
  file: Express.Multer.File | undefined,
  input: UploadReceiptInput
) {
  if (!file) {
    throw createError('No file uploaded', 400);
  }

  if (user?.role !== 'TENANT') {
    throw createError('Only tenants can upload payment receipts', 403);
  }

  const invoice = await models.Invoice.findByPk(invoiceId, {
    include: getInvoiceIncludes(),
  });

  if (!invoice) {
    throw createError('Invoice not found', 404);
  }

  const lease = invoice.get('lease') as { tenantId?: string } | undefined;
  if (lease?.tenantId !== user.id) {
    throw createError('Access denied', 403);
  }

  if (invoice.status === 'PAID') {
    throw createError('Cannot upload a receipt for a paid invoice', 400);
  }

  return sequelize.transaction(async (transaction) => {
    const receipt = await models.PaymentReceipt.create({
      invoiceId: invoice.id,
      filePath: file.path,
      transactionRef: input.transactionRef || null,
      paymentMethod: input.paymentMethod || null,
      uploadedBy: user.id,
    }, { transaction });

    await invoice.update({
      status: 'PENDING_REVIEW',
      reviewNote: null,
      reviewedBy: null,
      reviewedAt: null,
    }, { transaction });

    const updatedInvoice = await models.Invoice.findByPk(invoice.id, {
      include: getInvoiceIncludes(),
      transaction,
    });

    return {
      receipt,
      invoice: updatedInvoice!,
    };
  });
}

export async function generateMonthlyInvoices(
  user: User | undefined,
  input: { billingMonth?: string }
) {
  if (user?.role !== 'ADMIN') {
    throw createError('Admin access required', 403);
  }

  const billingMonth = normalizeBillingMonth(input.billingMonth);
  const dueDate = getDueDateForBillingMonth(billingMonth);

  const activeLeases = await models.Lease.findAll({
    where: { status: 'ACTIVE' },
  });

  let generatedCount = 0;
  let skippedCount = 0;

  await sequelize.transaction(async (transaction) => {
    for (const lease of activeLeases) {
      const [invoice, created] = await models.Invoice.findOrCreate({
        where: {
          leaseId: lease.id,
          billingMonth,
        },
        defaults: {
          leaseId: lease.id,
          billingMonth,
          amountDue: lease.monthlyRent,
          dueDate,
          status: 'UNPAID',
        },
        transaction,
      });

      if (created) {
        generatedCount += 1;
      } else {
        skippedCount += 1;
      }

      void invoice;
    }
  });

  return {
    message: 'Monthly invoice generation completed',
    billingMonth,
    generatedCount,
    skippedCount,
  };
}

export async function reviewInvoiceStatusForUser(
  user: User | undefined,
  invoiceId: string,
  input: ReviewInvoiceInput
) {
  if (!user || !['OWNER', 'ADMIN'].includes(user.role)) {
    throw createError('Owner or admin access required', 403);
  }

  const invoice = await models.Invoice.findByPk(invoiceId, {
    include: getInvoiceIncludes(),
  });

  if (!invoice) {
    throw createError('Invoice not found', 404);
  }

  const lease = invoice.get('lease') as { unit?: { property?: { ownerId: string } } } | undefined;
  const ownerId = lease?.unit?.property?.ownerId;
  if (user.role === 'OWNER' && ownerId !== user.id) {
    throw createError('Access denied', 403);
  }

  const allowedTransition =
    (input.status === 'PAID' && ['PENDING_REVIEW', 'OVERDUE'].includes(invoice.status)) ||
    (input.status === 'UNPAID' && invoice.status === 'PENDING_REVIEW');

  if (!allowedTransition) {
    throw createError('Invalid invoice status transition', 400);
  }

  await invoice.update({
    status: input.status,
    reviewNote: input.reviewNote ?? null,
    reviewedBy: user.id,
    reviewedAt: new Date(),
  });

  return models.Invoice.findByPk(invoice.id, {
    include: getInvoiceIncludes(),
  });
}

export async function markOverdueInvoices(referenceDate?: string) {
  const today = referenceDate || getTodayIsoDate();

  const [updatedCount] = await models.Invoice.update(
    { status: 'OVERDUE' },
    {
      where: {
        status: 'UNPAID',
        dueDate: {
          [Op.lt]: today,
        },
      },
    }
  );

  return {
    processedDate: today,
    updatedCount,
  };
}

export async function listInvoicesRequiringReminders(referenceDate?: string) {
  const today = referenceDate || getTodayIsoDate();
  const invoices = await models.Invoice.findAll({
    where: {
      status: {
        [Op.in]: ['UNPAID', 'OVERDUE'],
      },
      dueDate: {
        [Op.lte]: today,
      },
    },
    include: getInvoiceIncludes(),
  });

  return {
    processedDate: today,
    reminderCount: invoices.length,
    invoices,
  };
}

export async function getPaymentReceiptPath(user: User | undefined, receiptId: string): Promise<string> {
  const receipt = await models.PaymentReceipt.findByPk(receiptId, {
    include: [
      {
        model: models.Invoice,
        as: 'invoice',
        include: [
          {
            model: models.Lease,
            as: 'lease',
            include: [
              {
                model: models.RentalUnit,
                as: 'unit',
                include: [{ model: models.Property, as: 'property', attributes: ['ownerId'] }],
              },
            ],
          },
        ],
      },
    ],
  });

  if (!receipt) {
    throw createError('Payment receipt not found', 404);
  }

  const invoice = receipt.get('invoice') as any;
  const lease = invoice.lease;
  const ownerId = lease.unit.property.ownerId;
  const tenantId = lease.tenantId;

  if (user?.role === 'ADMIN') return receipt.filePath;
  if (user?.id === ownerId || user?.id === tenantId) return receipt.filePath;

  throw createError('Access denied', 403);
}

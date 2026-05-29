import { Router } from 'express';
import { query, param } from 'express-validator';
import { getCashFlow, getPropertyStats } from '../controllers/ReportController';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors, rejectUnknownQueryFields } from '../middleware/validation';

const router = Router();

router.use(authenticateToken);

router.get(
  '/cash-flow',
  [
    query('startDate').isDate().withMessage('startDate must be a valid date'),
    query('endDate').isDate().withMessage('endDate must be a valid date'),
    query('propertyId').optional().isUUID().withMessage('propertyId must be a valid UUID'),
    rejectUnknownQueryFields(['startDate', 'endDate', 'propertyId']),
    handleValidationErrors,
  ],
  getCashFlow
);

router.get(
  '/property/:propertyId',
  [
    param('propertyId').isUUID().withMessage('propertyId must be a valid UUID'),
    handleValidationErrors,
  ],
  getPropertyStats
);

export default router;

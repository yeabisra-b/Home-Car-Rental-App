import { Router } from 'express';
import { param, query } from 'express-validator';
import { AdminController } from '../controllers/AdminController';
import { authenticateToken, authenticateTokenIfPresent } from '../middleware/auth';
import {
  handleValidationErrors,
  rejectUnknownQueryFields,
  validateCreateAdmin,
} from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Admin-only user management routes
router.get(
  '/users',
  authenticateToken,
  rejectUnknownQueryFields(['role', 'accountStatus', 'page', 'limit']),
  query('role')
    .optional()
    .isIn(['OWNER', 'TENANT', 'ADMIN'])
    .withMessage('role must be OWNER, TENANT, or ADMIN'),
  query('accountStatus')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
    .withMessage('accountStatus must be ACTIVE, INACTIVE, or SUSPENDED'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
  handleValidationErrors,
  asyncHandler(AdminController.listUsers)
);
router.delete(
  '/users/:userId',
  authenticateToken,
  param('userId')
    .isUUID()
    .withMessage('userId must be a valid UUID'),
  handleValidationErrors,
  asyncHandler(AdminController.removeUser)
);

// Admin bootstrap is public for the first admin, then admin-only afterwards
router.post('/create-admin', authenticateTokenIfPresent, validateCreateAdmin, asyncHandler(AdminController.createAdmin));

export default router;

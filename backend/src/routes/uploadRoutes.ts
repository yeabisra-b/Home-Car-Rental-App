import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import * as PropertyController from '../controllers/PropertyController';
import * as MaintenanceController from '../controllers/MaintenanceController';
import { uploadLeaseDocument } from '../controllers/LeaseController';
import { uploadReceipt } from '../controllers/InvoiceController';
import { authenticateToken } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All upload routes require authentication
router.use(authenticateToken);

// User Profile Picture
router.post(
  '/user-profile/:userId',
  uploadSingle('file'),
  asyncHandler(AuthController.uploadProfilePicture)
);

// Property Media
router.post(
  '/property-media/:propertyId',
  uploadSingle('file'),
  asyncHandler(PropertyController.uploadPropertyMedia)
);

// Maintenance Evidence
router.post(
  '/maintenance-evidence/:requestId',
  uploadSingle('file'),
  asyncHandler(MaintenanceController.uploadMaintenanceEvidence)
);

// Lease Document
router.post(
  '/lease-document/:leaseId',
  uploadSingle('file'),
  asyncHandler(uploadLeaseDocument)
);

// Payment Receipt
router.post(
  '/payment-receipt/:invoiceId',
  uploadSingle('file'),
  asyncHandler(uploadReceipt)
);

export default router;

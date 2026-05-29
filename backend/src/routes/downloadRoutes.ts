import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import * as PropertyController from '../controllers/PropertyController';
import * as MaintenanceController from '../controllers/MaintenanceController';
import { downloadLeaseDocument } from '../controllers/LeaseController';
import { downloadPaymentReceipt } from '../controllers/InvoiceController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Profile pictures are technically public based on userId
router.get(
  '/user-profile/:userId',
  asyncHandler(AuthController.downloadProfilePicture)
);

// Other downloads require authentication for permission checks
router.use(authenticateToken);

// Property Media
router.get(
  '/property-media/:mediaId',
  asyncHandler(PropertyController.downloadPropertyMedia)
);

// Maintenance Evidence
router.get(
  '/maintenance-evidence/:evidenceId',
  asyncHandler(MaintenanceController.downloadMaintenanceEvidence)
);

// Lease Document
router.get(
  '/lease-document/:documentId',
  asyncHandler(downloadLeaseDocument)
);

// Payment Receipt
router.get(
  '/payment-receipt/:receiptId',
  asyncHandler(downloadPaymentReceipt)
);

export default router;

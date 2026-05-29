import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getRentalUnits,
  getRentalUnit,
  updateRentalUnit,
  deleteRentalUnit,
} from '../controllers/RentalUnitController';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors, rejectUnknownBodyFields, rejectUnknownQueryFields } from '../middleware/validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /units:
 *   get:
 *     summary: Search rental units
 *     tags: [Rental Units]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  [
    rejectUnknownQueryFields(['propertyId', 'minRent', 'maxRent', 'bedrooms', 'status', 'city', 'page', 'limit']),
    query('propertyId')
      .optional()
      .isUUID()
      .withMessage('Property ID must be a valid UUID'),
    query('minRent')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum rent must be a positive number'),
    query('maxRent')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum rent must be a positive number'),
    query('bedrooms')
      .optional()
      .isInt({ min: 0, max: 20 })
      .withMessage('Bedrooms must be between 0 and 20'),
    query('status')
      .optional()
      .isIn(['VACANT', 'OCCUPIED', 'MAINTENANCE', 'UNAVAILABLE'])
      .withMessage('Status must be VACANT, OCCUPIED, MAINTENANCE, or UNAVAILABLE'),
    query('city')
      .optional()
      .isLength({ max: 100 })
      .withMessage('City must be less than 100 characters'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors,
  ],
  getRentalUnits
);

/**
 * @swagger
 * /units/{unitId}:
 *   get:
 *     summary: Get single rental unit
 *     tags: [Rental Units]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:unitId',
  [
    param('unitId')
      .isUUID()
      .withMessage('Unit ID must be a valid UUID'),
    handleValidationErrors,
  ],
  getRentalUnit
);

/**
 * @swagger
 * /units/{unitId}:
 *   put:
 *     summary: Update rental unit
 *     tags: [Rental Units]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:unitId',
  [
    rejectUnknownBodyFields([
      'unitIdentifier',
      'bedrooms',
      'bathrooms',
      'areaSqMeters',
      'rentAmount',
      'depositAmount',
      'status',
      'description',
      'amenities',
      'floorNumber',
    ]),
    param('unitId')
      .isUUID()
      .withMessage('Unit ID must be a valid UUID'),
    body('unitIdentifier')
      .optional()
      .notEmpty()
      .withMessage('Unit identifier cannot be empty')
      .isLength({ max: 50 })
      .withMessage('Unit identifier must be less than 50 characters'),
    body('bedrooms')
      .optional()
      .isInt({ min: 0, max: 20 })
      .withMessage('Bedrooms must be between 0 and 20'),
    body('bathrooms')
      .optional()
      .isInt({ min: 0, max: 20 })
      .withMessage('Bathrooms must be between 0 and 20'),
    body('areaSqMeters')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Area must be a positive number'),
    body('rentAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Rent amount must be a positive number'),
    body('depositAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Deposit amount must be a positive number'),
    body('status')
      .optional()
      .isIn(['VACANT', 'OCCUPIED', 'MAINTENANCE', 'UNAVAILABLE'])
      .withMessage('Status must be VACANT, OCCUPIED, MAINTENANCE, or UNAVAILABLE'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('amenities')
      .optional()
      .isArray({ max: 50 })
      .withMessage('Amenities must be an array with at most 50 items'),
    body('amenities.*')
      .optional()
      .isString()
      .withMessage('Each amenity must be a string')
      .isLength({ max: 100 })
      .withMessage('Each amenity must be less than 100 characters'),
    body('floorNumber')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Floor number must be a positive integer'),
    handleValidationErrors,
  ],
  updateRentalUnit
);

/**
 * @swagger
 * /units/{unitId}:
 *   delete:
 *     summary: Delete rental unit
 *     tags: [Rental Units]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:unitId',
  [
    param('unitId')
      .isUUID()
      .withMessage('Unit ID must be a valid UUID'),
    handleValidationErrors,
  ],
  deleteRentalUnit
);

export default router;

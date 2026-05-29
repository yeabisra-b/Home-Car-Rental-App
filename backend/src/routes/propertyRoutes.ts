import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  deletePropertyMedia,
} from '../controllers/PropertyController';
import { createRentalUnit } from '../controllers/RentalUnitController';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors, rejectUnknownBodyFields, rejectUnknownQueryFields } from '../middleware/validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /properties:
 *   post:
 *     summary: Register a new property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  [
    rejectUnknownBodyFields([
      'title',
      'description',
      'type',
      'addressCity',
      'addressStreet',
      'addressSubCity',
      'addressWoreda',
      'addressHouseNumber',
      'buildingDetails',
      'vehicleDetails',
    ]),
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 255 })
      .withMessage('Title must be less than 255 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('type')
      .notEmpty()
      .withMessage('Property type is required')
      .isIn(['BUILDING', 'VEHICLE'])
      .withMessage('Property type must be BUILDING or VEHICLE'),
    body('addressCity')
      .notEmpty()
      .withMessage('City is required')
      .isLength({ max: 100 })
      .withMessage('City must be less than 100 characters'),
    body('addressStreet')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Street must be less than 255 characters'),
    body('addressSubCity')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Sub-city must be less than 100 characters'),
    body('addressWoreda')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Woreda must be less than 100 characters'),
    body('addressHouseNumber')
      .optional()
      .isLength({ max: 50 })
      .withMessage('House number must be less than 50 characters'),
    // Custom validation for building/vehicle details based on type
    body().custom((_reqBody, { req }) => {
      if (req.body.type === 'BUILDING' && !req.body.buildingDetails) {
        return true; // Let the controller handle it for specific error message
      }
      if (req.body.type === 'VEHICLE' && !req.body.vehicleDetails) {
        return true; // Let the controller handle it for specific error message
      }
      return true;
    }),
    handleValidationErrors,
  ],
  createProperty
);

/**
 * @swagger
 * /properties:
 *   get:
 *     summary: List properties
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  [
    rejectUnknownQueryFields(['type', 'city', 'ownerId', 'status', 'page', 'limit']),
    query('type')
      .optional()
      .isIn(['BUILDING', 'VEHICLE'])
      .withMessage('Type must be BUILDING or VEHICLE'),
    query('city')
      .optional()
      .isLength({ max: 100 })
      .withMessage('City must be less than 100 characters'),
    query('ownerId')
      .optional()
      .isUUID()
      .withMessage('Owner ID must be a valid UUID'),
    query('status')
      .optional()
      .isIn(['ACTIVE', 'INACTIVE', 'MAINTENANCE'])
      .withMessage('Status must be ACTIVE, INACTIVE, or MAINTENANCE'),
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
  getProperties
);

/**
 * @swagger
 * /properties/{propertyId}:
 *   get:
 *     summary: Get single property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:propertyId',
  [
    param('propertyId')
      .isUUID()
      .withMessage('Property ID must be a valid UUID'),
    handleValidationErrors,
  ],
  getProperty
);

/**
 * @swagger
 * /properties/{propertyId}:
 *   put:
 *     summary: Update property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:propertyId',
  [
    rejectUnknownBodyFields([
      'title',
      'description',
      'addressCity',
      'addressStreet',
      'addressSubCity',
      'addressWoreda',
      'addressHouseNumber',
      'status',
      'buildingDetails',
      'vehicleDetails',
    ]),
    param('propertyId')
      .isUUID()
      .withMessage('Property ID must be a valid UUID'),
    body('title')
      .optional()
      .notEmpty()
      .withMessage('Title cannot be empty')
      .isLength({ max: 255 })
      .withMessage('Title must be less than 255 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('addressCity')
      .optional()
      .notEmpty()
      .withMessage('City cannot be empty')
      .isLength({ max: 100 })
      .withMessage('City must be less than 100 characters'),
    body('addressStreet')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Street must be less than 255 characters'),
    body('addressSubCity')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Sub-city must be less than 100 characters'),
    body('addressWoreda')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Woreda must be less than 100 characters'),
    body('addressHouseNumber')
      .optional()
      .isLength({ max: 50 })
      .withMessage('House number must be less than 50 characters'),
    body('status')
      .optional()
      .isIn(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DELETED'])
      .withMessage('Status must be ACTIVE, INACTIVE, MAINTENANCE, or DELETED'),
    handleValidationErrors,
  ],
  updateProperty
);

/**
 * @swagger
 * /properties/{propertyId}:
 *   delete:
 *     summary: Delete property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:propertyId',
  [
    param('propertyId')
      .isUUID()
      .withMessage('Property ID must be a valid UUID'),
    handleValidationErrors,
  ],
  deleteProperty
);

/**
 * @swagger
 * /properties/media/{mediaId}:
 *   delete:
 *     summary: Delete property media
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/media/:mediaId',
  [
    param('mediaId')
      .isUUID()
      .withMessage('Media ID must be a valid UUID'),
    handleValidationErrors,
  ],
  deletePropertyMedia
);

/**
 * @swagger
 * /properties/{propertyId}/units:
 *   post:
 *     summary: Add rental unit to a property
 *     tags: [Rental Units]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:propertyId/units',
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
    param('propertyId')
      .isUUID()
      .withMessage('Property ID must be a valid UUID'),
    body('unitIdentifier')
      .notEmpty()
      .withMessage('Unit identifier is required')
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
      .notEmpty()
      .withMessage('Rent amount is required')
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
  createRentalUnit
);

export default router;

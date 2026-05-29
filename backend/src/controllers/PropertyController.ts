import { Response } from 'express';
import path from 'path';
import { AuthRequest } from '../middleware/auth';
import { sendNoContent, sendOkResource, sendPaginated } from '../http/responses';
import {
  createPropertyForOwner,
  deletePropertyForUser,
  deletePropertyMediaForUser,
  getPropertyForUser,
  listPropertiesForUser,
  updatePropertyForUser,
  uploadPropertyMediaForUser,
  getPropertyMediaPath,
} from '../services/propertyService';

/**
 * @swagger
 * components:
 *   schemas:
 *     BuildingDetails:
 *       type: object
 *       properties:
 *         buildingType:
 *           type: string
 *           enum: [APARTMENT, HOUSE, COMMERCIAL, OFFICE, WAREHOUSE]
 *         totalFloors:
 *           type: integer
 *         totalUnits:
 *           type: integer
 *         hasParking:
 *           type: boolean
 *         hasElevator:
 *           type: boolean
 *         hasSecurity:
 *           type: boolean
 *         yearBuilt:
 *           type: integer
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *     
 *     VehicleDetails:
 *       type: object
 *       required:
 *         - plateNumber
 *         - vehicleType
 *         - brand
 *         - model
 *         - manufactureYear
 *         - color
 *         - transmissionType
 *         - fuelType
 *       properties:
 *         plateNumber:
 *           type: string
 *         vehicleType:
 *           type: string
 *           enum: [SEDAN, SUV, TRUCK, MOTORCYCLE, VAN, BUS]
 *         brand:
 *           type: string
 *         model:
 *           type: string
 *         manufactureYear:
 *           type: integer
 *         color:
 *           type: string
 *         transmissionType:
 *           type: string
 *           enum: [MANUAL, AUTOMATIC]
 *         fuelType:
 *           type: string
 *           enum: [PETROL, DIESEL, ELECTRIC, HYBRID]
 *         engineCapacity:
 *           type: string
 *         mileage:
 *           type: integer
 *     
 *     Property:
 *       type: object
 *       required:
 *         - title
 *         - type
 *         - addressCity
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         ownerId:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         type:
 *           type: string
 *           enum: [BUILDING, VEHICLE]
 *         addressCity:
 *           type: string
 *         addressStreet:
 *           type: string
 *         addressSubCity:
 *           type: string
 *         addressWoreda:
 *           type: string
 *         addressHouseNumber:
 *           type: string
 *         buildingDetails:
 *           $ref: '#/components/schemas/BuildingDetails'
 *         vehicleDetails:
 *           $ref: '#/components/schemas/VehicleDetails'
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE, DELETED]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /properties:
 *   post:
 *     summary: Register a new property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - addressCity
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [BUILDING, VEHICLE]
 *               addressCity:
 *                 type: string
 *               addressStreet:
 *                 type: string
 *               addressSubCity:
 *                 type: string
 *               addressWoreda:
 *                 type: string
 *               addressHouseNumber:
 *                 type: string
 *               buildingDetails:
 *                 $ref: '#/components/schemas/BuildingDetails'
 *               vehicleDetails:
 *                 $ref: '#/components/schemas/VehicleDetails'
 *     responses:
 *       201:
 *         description: Property created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 property:
 *                   $ref: '#/components/schemas/Property'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only owners can create properties
 */
export const createProperty = async (req: AuthRequest, res: Response) => {
  const property = await createPropertyForOwner(req.user, req.body);
  sendOkResource(res.status(201), 'property', property);
};

/**
 * @swagger
 * /properties:
 *   get:
 *     summary: List properties
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [BUILDING, VEHICLE]
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: ownerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: List of properties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Property'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
export const getProperties = async (req: AuthRequest, res: Response) => {
  const result = await listPropertiesForUser(req.user, {
    type: typeof req.query.type === 'string' ? req.query.type : undefined,
    city: typeof req.query.city === 'string' ? req.query.city : undefined,
    ownerId: typeof req.query.ownerId === 'string' ? req.query.ownerId : undefined,
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    page: typeof req.query.page === 'string' ? req.query.page : undefined,
    limit: typeof req.query.limit === 'string' ? req.query.limit : undefined,
  });

  sendPaginated(res, result.data, result.total, result.page, result.totalPages);
};

/**
 * @swagger
 * /properties/{propertyId}:
 *   get:
 *     summary: Get single property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Property details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 property:
 *                   $ref: '#/components/schemas/Property'
 *       404:
 *         description: Property not found
 */
export const getProperty = async (req: AuthRequest, res: Response) => {
  const { propertyId } = req.params;
  const property = await getPropertyForUser(req.user, Array.isArray(propertyId) ? propertyId[0] : propertyId);
  sendOkResource(res, 'property', property);
};

/**
 * @swagger
 * /properties/{propertyId}:
 *   put:
 *     summary: Update property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               addressCity:
 *                 type: string
 *               addressStreet:
 *                 type: string
 *               buildingDetails:
 *                 $ref: '#/components/schemas/BuildingDetails'
 *               vehicleDetails:
 *                 $ref: '#/components/schemas/VehicleDetails'
 *     responses:
 *       200:
 *         description: Property updated successfully
 *       403:
 *         description: Forbidden - Only property owners can update
 *       404:
 *         description: Property not found
 */
export const updateProperty = async (req: AuthRequest, res: Response) => {
  const { propertyId } = req.params;
  const property = await updatePropertyForUser(
    req.user,
    Array.isArray(propertyId) ? propertyId[0] : propertyId,
    req.body
  );
  sendOkResource(res, 'property', property);
};

/**
 * @swagger
 * /properties/{propertyId}:
 *   delete:
 *     summary: Delete property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Property deleted successfully
 *       400:
 *         description: Cannot delete property with active leases
 *       403:
 *         description: Forbidden - Only property owners can delete
 *       404:
 *         description: Property not found
 */
export const deleteProperty = async (req: AuthRequest, res: Response) => {
  const { propertyId } = req.params;
  await deletePropertyForUser(req.user, Array.isArray(propertyId) ? propertyId[0] : propertyId);
  sendNoContent(res);
};

/**
 * @swagger
 * /properties/{propertyId}/media:
 *   post:
 *     summary: Upload property media
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               description:
 *                 type: string
 *               isPrimary:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Media uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mediaId:
 *                   type: string
 *                   format: uuid
 *                 filePath:
 *                   type: string
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden - Only property owners can upload media
 *       404:
 *         description: Property not found
 */
export const uploadPropertyMedia = async (req: AuthRequest, res: Response) => {
  const { propertyId } = req.params;
  const media = await uploadPropertyMediaForUser(
    req.user,
    Array.isArray(propertyId) ? propertyId[0] : propertyId,
    req.file,
    req.body
  );
  res.status(201).json({
    media,
    fileName: req.file?.filename
  });
};

/**
 * @swagger
 * /properties/media/{mediaId}:
 *   delete:
 *     summary: Delete property media
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Media deleted successfully
 *       403:
 *         description: Forbidden - Only property owners can delete media
 *       404:
 *         description: Media not found
 */
export const deletePropertyMedia = async (req: AuthRequest, res: Response) => {
  const { mediaId } = req.params;
  await deletePropertyMediaForUser(req.user, Array.isArray(mediaId) ? mediaId[0] : mediaId);
  sendNoContent(res);
};

export const downloadPropertyMedia = async (req: AuthRequest, res: Response) => {
  const { mediaId } = req.params;
  const filePath = await getPropertyMediaPath(req.user, Array.isArray(mediaId) ? mediaId[0] : mediaId);
  res.sendFile(path.resolve(filePath));
};

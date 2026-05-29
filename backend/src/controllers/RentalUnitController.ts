import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendNoContent, sendOkResource, sendPaginated } from '../http/responses';
import {
  createRentalUnitForOwner,
  deleteRentalUnitForUser,
  getRentalUnitForUser,
  listRentalUnitsForUser,
  updateRentalUnitForUser,
} from '../services/rentalUnitService';

/**
 * @swagger
 * components:
 *   schemas:
 *     RentalUnit:
 *       type: object
 *       required:
 *         - propertyId
 *         - unitIdentifier
 *         - rentAmount
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         propertyId:
 *           type: string
 *           format: uuid
 *         unitIdentifier:
 *           type: string
 *         bedrooms:
 *           type: integer
 *         bathrooms:
 *           type: integer
 *         areaSqMeters:
 *           type: number
 *         rentAmount:
 *           type: number
 *         depositAmount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [VACANT, OCCUPIED, MAINTENANCE, UNAVAILABLE]
 *         description:
 *           type: string
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *         floorNumber:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /properties/{propertyId}/units:
 *   post:
 *     summary: Add rental unit to a property
 *     tags: [Rental Units]
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
 *             required:
 *               - unitIdentifier
 *               - rentAmount
 *             properties:
 *               unitIdentifier:
 *                 type: string
 *               bedrooms:
 *                 type: integer
 *               bathrooms:
 *                 type: integer
 *               areaSqMeters:
 *                 type: number
 *               rentAmount:
 *                 type: number
 *               depositAmount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [VACANT, OCCUPIED, MAINTENANCE, UNAVAILABLE]
 *               description:
 *                 type: string
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *               floorNumber:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Rental unit created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unit:
 *                   $ref: '#/components/schemas/RentalUnit'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden - Only property owners can add units
 *       404:
 *         description: Property not found
 */
export const createRentalUnit = async (req: AuthRequest, res: Response) => {
  const { propertyId } = req.params;
  const unit = await createRentalUnitForOwner(
    req.user,
    Array.isArray(propertyId) ? propertyId[0] : propertyId,
    req.body
  );

  res.status(201).json({ unit });
};

/**
 * @swagger
 * /units:
 *   get:
 *     summary: Search rental units
 *     tags: [Rental Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: minRent
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxRent
 *         schema:
 *           type: number
 *       - in: query
 *         name: bedrooms
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [VACANT, OCCUPIED, MAINTENANCE, UNAVAILABLE]
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
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
 *         description: List of rental units
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RentalUnit'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
export const getRentalUnits = async (req: AuthRequest, res: Response) => {
  const result = await listRentalUnitsForUser(req.user, {
    propertyId: typeof req.query.propertyId === 'string' ? req.query.propertyId : undefined,
    minRent: req.query.minRent as string | undefined,
    maxRent: req.query.maxRent as string | undefined,
    bedrooms: req.query.bedrooms as string | undefined,
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    city: typeof req.query.city === 'string' ? req.query.city : undefined,
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
  });

  sendPaginated(res, result.data, result.total, result.page, result.totalPages);
};

/**
 * @swagger
 * /units/{unitId}:
 *   get:
 *     summary: Get single rental unit
 *     tags: [Rental Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Rental unit details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unit:
 *                   $ref: '#/components/schemas/RentalUnit'
 *       404:
 *         description: Rental unit not found
 */
export const getRentalUnit = async (req: AuthRequest, res: Response) => {
  const { unitId } = req.params;
  const unit = await getRentalUnitForUser(req.user, Array.isArray(unitId) ? unitId[0] : unitId);
  sendOkResource(res, 'unit', unit);
};

/**
 * @swagger
 * /units/{unitId}:
 *   put:
 *     summary: Update rental unit
 *     tags: [Rental Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
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
 *               unitIdentifier:
 *                 type: string
 *               bedrooms:
 *                 type: integer
 *               bathrooms:
 *                 type: integer
 *               areaSqMeters:
 *                 type: number
 *               rentAmount:
 *                 type: number
 *               depositAmount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [VACANT, OCCUPIED, MAINTENANCE, UNAVAILABLE]
 *               description:
 *                 type: string
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *               floorNumber:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Rental unit updated successfully
 *       403:
 *         description: Forbidden - Only property owners can update units
 *       404:
 *         description: Rental unit not found
 */
export const updateRentalUnit = async (req: AuthRequest, res: Response) => {
  const { unitId } = req.params;
  const unit = await updateRentalUnitForUser(
    req.user,
    Array.isArray(unitId) ? unitId[0] : unitId,
    req.body
  );
  sendOkResource(res, 'unit', unit);
};

/**
 * @swagger
 * /units/{unitId}:
 *   delete:
 *     summary: Delete rental unit
 *     tags: [Rental Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Rental unit deleted successfully
 *       400:
 *         description: Cannot delete unit with active leases
 *       403:
 *         description: Forbidden - Only property owners can delete units
 *       404:
 *         description: Rental unit not found
 */
export const deleteRentalUnit = async (req: AuthRequest, res: Response) => {
  const { unitId } = req.params;
  await deleteRentalUnitForUser(req.user, Array.isArray(unitId) ? unitId[0] : unitId);
  sendNoContent(res);
};

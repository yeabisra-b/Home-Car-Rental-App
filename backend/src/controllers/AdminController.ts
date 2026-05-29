import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { sendCreatedResource, sendNoContent, sendPaginated } from '../http/responses';
import { createAdminAccount, listUsers, removeUserAccount } from '../services/adminService';

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateAdminRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Admin email address
 *           example: "admin@example.com"
 *         password:
 *           type: string
 *           minLength: 8
 *           description: Admin password (min 8 characters)
 *           example: "SecureAdminPass123!"
 *         firstName:
 *           type: string
 *           description: Admin first name
 *           example: "Admin"
 *         middleName:
 *           type: string
 *           description: Admin middle name (optional)
 *           example: "William"
 *         lastName:
 *           type: string
 *           description: Admin last name
 *           example: "User"
 *         phoneNumber:
 *           type: string
 *           description: Admin phone number (optional)
 *           example: "+1234567890"
 */
export class AdminController {
    /**
     * @swagger
     * /admin/users:
     *   get:
     *     summary: List all users (Admin only)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: role
     *         schema:
     *           type: string
     *           enum: [OWNER, TENANT, ADMIN]
     *         description: Filter by user role
     *       - in: query
     *         name: accountStatus
     *         schema:
     *           type: string
     *           enum: [ACTIVE, INACTIVE, SUSPENDED]
     *         description: Filter by account status
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Page number for pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 20
     *         description: Number of items per page
     *     responses:
     *       200:
     *         description: List of users retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/User'
     *                 total:
     *                   type: integer
     *                   description: Total number of users
     *                 page:
     *                   type: integer
     *                   description: Current page number
     *                 totalPages:
     *                   type: integer
     *                   description: Total number of pages
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       403:
     *         description: Admin access required
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    static async listUsers(req: AuthRequest, res: Response) {
        const result = await listUsers(req.user, {
            role: typeof req.query.role === 'string' ? req.query.role : undefined,
            accountStatus: typeof req.query.accountStatus === 'string' ? req.query.accountStatus : undefined,
            page: typeof req.query.page === 'string' ? req.query.page : undefined,
            limit: typeof req.query.limit === 'string' ? req.query.limit : undefined,
        });

        sendPaginated(res, result.data, result.total, result.page, result.totalPages);
    }

    /**
     * @swagger
     * /admin/admins:
     *   post:
     *     summary: Create admin account (Admin only)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateAdminRequest'
     *     responses:
     *       201:
     *         description: Admin account created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 user:
     *                   $ref: '#/components/schemas/User'
     *                 accessToken:
     *                   type: string
     *                   description: JWT access token for the new admin
     *                 refreshToken:
     *                   type: string
     *                   description: JWT refresh token for the new admin
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       403:
     *         description: Admin access required
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       409:
     *         description: Admin with this email already exists
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    static async createAdmin(req: AuthRequest, res: Response) {
        const { email, password, firstName, middleName, lastName, phoneNumber } = req.body;

        try {
            const result = await createAdminAccount(req.user, {
                email,
                password,
                firstName,
                middleName,
                lastName,
                phoneNumber,
            });

            sendCreatedResource(res, 'user', result.user, {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            });
        } catch (error: any) {
            if (error.name === 'SequelizeValidationError') {
                const errors = error.errors.map((e: any) => ({
                    field: e.path,
                    message: e.message,
                }));
                throw createError('Validation failed', 400, errors);
            }
            throw error;
        }
    }

    /**
     * @swagger
     * /admin/users/{userId}:
     *   delete:
     *     summary: Remove user (Admin only)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: User ID to remove
     *     responses:
     *       204:
     *         description: User removed successfully
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       403:
     *         description: Admin access required
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       404:
     *         description: User not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       400:
     *         description: Cannot remove user with active dependencies
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    static async removeUser(req: AuthRequest, res: Response) {
        const { userId } = req.params;

        await removeUserAccount(req.user, userId as string);
        sendNoContent(res);
    }
}

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { sendOkResource } from '../http/responses';
import { loginUser, logoutUser, refreshUserTokens, registerUser, updateUserProfile, updateUserProfilePicture, getUserProfilePicturePath, updatePassword } from '../services/authService';
import path from 'path';

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
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
 *           description: User email address
 *           example: "john.doe@example.com"
 *         password:
 *           type: string
 *           minLength: 8
 *           description: User password (min 8 characters)
 *           example: "SecurePass123!"
 *         firstName:
 *           type: string
 *           description: User first name
 *           example: "John"
 *         middleName:
 *           type: string
 *           description: User middle name (optional)
 *           example: "William"
 *         lastName:
 *           type: string
 *           description: User last name
 *           example: "Doe"
 *         phoneNumber:
 *           type: string
 *           description: User phone number (optional)
 *           example: "+1234567890"
 *         role:
 *           type: string
 *           enum: [LANDLORD, TENANT, ADMIN]
 *           description: User role (defaults to TENANT)
 *           example: "TENANT"
 */
export class AuthController {
    /**
     * @swagger
     * /auth/register:
     *   post:
     *     summary: Register a new user
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RegisterRequest'
     *     responses:
     *       201:
     *         description: User registered successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AuthResponse'
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       409:
     *         description: User already exists
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    static async register(req: Request, res: Response) {
        const { email, password, firstName, middleName, lastName, phoneNumber, role } = req.body;

        try {
            const result = await registerUser({
                email,
                password,
                firstName,
                middleName,
                lastName,
                phoneNumber,
                role,
            });

            res.status(201).json(result);
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
     * components:
     *   schemas:
     *     LoginRequest:
     *       type: object
     *       required:
     *         - email
     *         - password
     *       properties:
     *         email:
     *           type: string
     *           format: email
     *           description: User email address
     *           example: "john.doe@example.com"
     *         password:
     *           type: string
     *           description: User password
     *           example: "SecurePass123!"
     * /auth/login:
     *   post:
     *     summary: Login user
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LoginRequest'
     *     responses:
     *       200:
     *         description: Login successful
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AuthResponse'
     *       401:
     *         description: Invalid credentials or account inactive
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    static async login(req: Request, res: Response) {
        const { email, password } = req.body;

        res.json(await loginUser({ email, password }));
    }

    /**
     * @swagger
     * components:
     *   schemas:
     *     RefreshTokenRequest:
     *       type: object
     *       required:
     *         - refreshToken
     *       properties:
     *         refreshToken:
     *           type: string
     *           description: JWT refresh token
     *     TokenResponse:
     *       type: object
     *       properties:
     *         accessToken:
     *           type: string
     *           description: New JWT access token
     *         refreshToken:
     *           type: string
     *           description: New JWT refresh token
     * /auth/refresh-token:
     *   post:
     *     summary: Refresh access token
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RefreshTokenRequest'
     *     responses:
     *       200:
     *         description: Token refreshed successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/TokenResponse'
     *       400:
     *         description: Refresh token required
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       401:
     *         description: Invalid or expired refresh token
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    static async refreshToken(req: Request, res: Response) {
        const { refreshToken } = req.body;

        res.json(await refreshUserTokens(refreshToken));
    }

    /**
     * @swagger
     * /auth/logout:
     *   post:
     *     summary: Logout user
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Logout successful
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Logged out successfully"
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    static async logout(_req: AuthRequest, res: Response) {
        if (_req.user) {
            await logoutUser(_req.user);
        }
        res.json({ message: 'Logged out successfully' });
    }

    /**
     * @swagger
     * /auth/profile:
     *   get:
     *     summary: Get user profile
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User profile retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 user:
     *                   $ref: '#/components/schemas/User'
     *       401:
     *         description: Unauthorized
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
     */
    static async getProfile(req: AuthRequest, res: Response) {
        if (!req.user) {
            throw createError('User not found', 404);
        }

        sendOkResource(res, 'user', req.user.toSafeJSON());
    }

    /**
     * @swagger
     * components:
     *   schemas:
     *     UpdateProfileRequest:
     *       type: object
     *       properties:
     *         firstName:
     *           type: string
     *           description: Updated first name
     *           example: "John"
     *         middleName:
     *           type: string
     *           description: Updated middle name
     *           example: "William"
     *         lastName:
     *           type: string
     *           description: Updated last name
     *           example: "Doe"
     *         phoneNumber:
     *           type: string
     *           description: Updated phone number
     *           example: "+1234567890"
     *         profilePictureUrl:
     *           type: string
     *           description: Updated profile picture URL
     *           example: "https://example.com/profile.jpg"
     * /auth/profile:
     *   put:
     *     summary: Update user profile
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateProfileRequest'
     *     responses:
     *       200:
     *         description: Profile updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 user:
     *                   $ref: '#/components/schemas/User'
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
     *       404:
     *         description: User not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    static async updateProfile(req: AuthRequest, res: Response) {
        if (!req.user) {
            throw createError('User not found', 404);
        }

        const { firstName, middleName, lastName, phoneNumber, profilePictureUrl } = req.body;

        try {
            const user = await updateUserProfile(req.user, {
                firstName,
                middleName,
                lastName,
                phoneNumber,
                profilePictureUrl,
            });

            sendOkResource(res, 'user', user);
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

    static async uploadProfilePicture(req: AuthRequest, res: Response) {
        if (!req.user) {
            throw createError('User not found', 404);
        }

        const user = await updateUserProfilePicture(req.user, req.file);
        sendOkResource(res, 'user', user, {
            fileName: req.file?.filename,
        });
    }

    static async downloadProfilePicture(req: Request, res: Response) {
        const { userId } = req.params;
        const filePath = await getUserProfilePicturePath(Array.isArray(userId) ? userId[0] : userId);
        res.sendFile(path.resolve(filePath));
    }

    /**
     * @swagger
     * components:
     *   schemas:
     *     ChangePasswordRequest:
     *       type: object
     *       required:
     *         - oldPassword
     *         - newPassword
     *       properties:
     *         oldPassword:
     *           type: string
     *           description: Current password
     *           example: "OldPass123!"
     *         newPassword:
     *           type: string
     *           minLength: 6
     *           description: New password (min 6 characters)
     *           example: "NewSecurePass456!"
     * /auth/change-password:
     *   put:
     *     summary: Change user password
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ChangePasswordRequest'
     *     responses:
     *       200:
     *         description: Password updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Password updated successfully"
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       401:
     *         description: Old password is incorrect or unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    static async changePassword(req: AuthRequest, res: Response) {
        if (!req.user) {
            throw createError('User not found', 404);
        }

        const { oldPassword, newPassword } = req.body;

        const result = await updatePassword({
            userId: req.user.id,
            oldPassword,
            newPassword,
        });

        res.json(result);
    }
}

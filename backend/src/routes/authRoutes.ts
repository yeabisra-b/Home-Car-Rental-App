import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';
import { validateRegister, validateLogin, validateRefreshToken, validateUpdateProfile, validateChangePassword } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const authRouteLimitMax = process.env.NODE_ENV === 'test' ? 10000 : 10;

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: JSON.stringify({ error: 'Too many registration attempts. Please try again later.' }),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: authRouteLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: JSON.stringify({ error: 'Too many login attempts. Please try again later.' }),
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: authRouteLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: JSON.stringify({ error: 'Too many token refresh attempts. Please try again later.' }),
});

// Public routes
router.post('/register', registerLimiter, validateRegister, asyncHandler(AuthController.register));
router.post('/login', loginLimiter, validateLogin, asyncHandler(AuthController.login));
router.post('/refresh-token', refreshLimiter, validateRefreshToken, asyncHandler(AuthController.refreshToken));

// Protected routes
router.post('/logout', authenticateToken, asyncHandler(AuthController.logout));
router.get('/profile', authenticateToken, asyncHandler(AuthController.getProfile));
router.put('/profile', authenticateToken, validateUpdateProfile, asyncHandler(AuthController.updateProfile));
router.put('/change-password', authenticateToken, validateChangePassword, asyncHandler(AuthController.changePassword));

export default router;

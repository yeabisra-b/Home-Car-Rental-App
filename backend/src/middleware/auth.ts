import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { JWT_CONFIG } from '../config/auth';
import { models } from '../config/database';
import { TokenPayload } from '../services/tokenService';

export interface AuthRequest extends Request {
    user?: User;
}

const authenticateTokenInternal = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
    allowMissingToken: boolean
): Promise<void | Response> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            if (allowMissingToken) {
                return next();
            }
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET) as TokenPayload;

        if (decoded.tokenType !== 'access') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const user = await models.User.findByPk(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'Invalid token - user not found' });
        }

        if (user.accountStatus !== 'ACTIVE') {
            return res.status(401).json({ error: 'Account is not active' });
        }

        if (decoded.sessionVersion !== user.sessionVersion) {
            return res.status(401).json({ error: 'Session has been invalidated' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: 'Token expired' });
        } else if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: 'Invalid token' });
        } else {
            return res.status(500).json({ error: 'Authentication error' });
        }
    }
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
    return authenticateTokenInternal(req, res, next, false);
};

export const authenticateTokenIfPresent = (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
    return authenticateTokenInternal(req, res, next, true);
};

export const requireRole = (roles: string[]): (req: AuthRequest, res: Response, next: NextFunction) => void | Response => {
    return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        return next();
    };
};

export const requireOwnerOrTenant = requireRole(['OWNER', 'TENANT', 'ADMIN']);
export const requireOwner = requireRole(['OWNER', 'ADMIN']);
export const requireAdmin = requireRole(['ADMIN']);

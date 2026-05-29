import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { createError } from './errorHandler';

function formatValidationError(field: string, message: string, value: unknown) {
    return {
        field,
        message,
        value,
    };
}

export const handleValidationErrors = (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const validationErrors = errors.array().map((error: any) => formatValidationError(error.path, error.msg, error.value));
        return next(createError('Validation failed', 400, validationErrors));
    }
    next();
};

function createUnknownFieldGuard(
    source: 'body' | 'query',
    allowedFields: string[]
) {
    const allowedFieldSet = new Set(allowedFields);

    return (req: Request, _res: Response, next: NextFunction) => {
        const payload = req[source];

        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            return next();
        }

        const unknownFields = Object.keys(payload).filter((field) => !allowedFieldSet.has(field));
        if (unknownFields.length === 0) {
            return next();
        }

        return next(createError(
            'Validation failed',
            400,
            unknownFields.map((field) => formatValidationError(field, `Unknown ${source} field`, (payload as Record<string, unknown>)[field]))
        ));
    };
}

export const rejectUnknownBodyFields = (allowedFields: string[]) => createUnknownFieldGuard('body', allowedFields);
export const rejectUnknownQueryFields = (allowedFields: string[]) => createUnknownFieldGuard('query', allowedFields);

export const validateRegister = [
    rejectUnknownBodyFields(['email', 'password', 'firstName', 'middleName', 'lastName', 'phoneNumber', 'role']),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('firstName')
        .trim()
        .isLength({ min: 1 })
        .withMessage('First name is required'),
    body('lastName')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Last name is required'),
    body('phoneNumber')
        .optional({ checkFalsy: true })
        .isMobilePhone('any')
        .withMessage('Valid phone number is required'),
    body('role')
        .optional()
        .isIn(['OWNER', 'TENANT'])
        .withMessage('Role must be either OWNER or TENANT'),
    handleValidationErrors,
];

export const validateCreateAdmin = [
    rejectUnknownBodyFields(['email', 'password', 'firstName', 'middleName', 'lastName', 'phoneNumber']),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('firstName')
        .trim()
        .isLength({ min: 1 })
        .withMessage('First name is required'),
    body('lastName')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Last name is required'),
    body('phoneNumber')
        .optional({ checkFalsy: true })
        .isMobilePhone('any')
        .withMessage('Valid phone number is required'),
    handleValidationErrors,
];

export const validateLogin = [
    rejectUnknownBodyFields(['email', 'password']),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors,
];

export const validateRefreshToken = [
    rejectUnknownBodyFields(['refreshToken']),
    body('refreshToken')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Refresh token is required'),
    handleValidationErrors,
];

export const validateUpdateProfile = [
    rejectUnknownBodyFields(['firstName', 'middleName', 'lastName', 'phoneNumber', 'profilePictureUrl']),
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('First name cannot be empty'),
    body('middleName')
        .optional()
        .trim(),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Last name cannot be empty'),
    body('phoneNumber')
        .optional({ checkFalsy: true })
        .isMobilePhone('any')
        .withMessage('Valid phone number is required'),
    body('profilePictureUrl')
        .optional()
        .isURL()
        .withMessage('Profile picture URL must be a valid URL'),
    handleValidationErrors,
];

export const validateChangePassword = [
    rejectUnknownBodyFields(['oldPassword', 'newPassword']),
    body('oldPassword')
        .notEmpty()
        .withMessage('Old password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long'),
    handleValidationErrors,
];

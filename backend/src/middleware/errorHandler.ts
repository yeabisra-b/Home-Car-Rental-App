import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
    statusCode?: number;
    errors?: any[];
}

export const errorHandler = (
    err: ApiError,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    const shouldLogError = process.env.NODE_ENV !== 'test' || statusCode >= 500;

    if (shouldLogError) {
        console.error(`Error ${statusCode}: ${message}`, err);
    }

    res.status(statusCode).json({
        error: message,
        errors: err.errors || [],
    });
};

export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export const createError = (message: string, statusCode: number = 500, errors?: any[]): ApiError => {
    const error = new Error(message) as ApiError;
    error.statusCode = statusCode;
    error.errors = errors;
    return error;
};

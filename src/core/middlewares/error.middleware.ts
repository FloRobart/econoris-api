import { Request, Response, NextFunction } from 'express';
import * as logger from '../utils/logger';
import { AppError } from '../models/AppError.model';



/**
 * Middleware to handle errors.
 * @param error Error thrown by a previous middleware
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export const errorHandler = (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    const appError = toAppError(error);
    logError(appError.httpStatus, error);

    res.status(appError.httpStatus).json(appError.message);
};


/**
 * Converts any error into an AppError, whose message can be sent to the client.
 * The errors of Express and body-parser (invalid JSON, body too large...) carry their own HTTP status.
 * @param error Error thrown by a previous middleware
 * @returns The AppError to send to the client
 */
function toAppError(error: unknown): AppError {
    if (error instanceof AppError) return error;

    const httpStatus = (error as { status?: unknown } | null)?.status;
    if (typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 500) {
        return new AppError("Invalid request", httpStatus);
    }

    /* Any other error is unexpected: its message could reveal how the server works */
    return new AppError();
}


/**
 * Logs an error with the level that matches its HTTP status.
 * @param httpStatus HTTP status sent to the client
 * @param error Original error, logged with its stack
 */
function logError(httpStatus: number, error: unknown) {
    const details = error instanceof Error ? error.stack : error;

    if (httpStatus >= 500) {
        logger.error(details);
        return;
    }

    if (httpStatus >= 400) {
        logger.warning(details);
        return;
    }

    logger.info(details);
}

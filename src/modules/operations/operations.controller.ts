import { Request, Response, NextFunction } from 'express';
import * as OperationsService from './operations.service';
import { OperationInsert, OperationsPeriod, OperationUpdate } from './operations.types';



/*========*/
/* SELECT */
/*========*/
/**
 * Get the operations of a user, all of them or only those of a period.
 * @param req.body.user The user object containing the user ID.
 * @param req.body.validatedData.params The validated period, whose bounds are both optional.
 * @param res The response object.
 * @param next The next middleware function.
 */
export const selectOperations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId: number = req.body.user.id;
        const period: OperationsPeriod = req.body.validatedData.params;

        const operations = await OperationsService.selectOperations(userId, period);
        res.status(operations.length ? 200 : 204).json(operations);
    } catch (error) {
        next(error);
    }
};

/**
 * Get the levy date of the oldest operation of a user.
 * @param req.body.user The user object containing the user ID.
 * @param res The response object.
 * @param next The next middleware function.
 */
export const selectOldestOperationDate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId: number = req.body.user.id;

        const oldestOperationDate = await OperationsService.selectOldestOperationDate(userId);
        res.status(oldestOperationDate ? 200 : 204).json(oldestOperationDate);
    } catch (error) {
        next(error);
    }
};


/*========*/
/* INSERT */
/*========*/
/**
 * Insert a new operation for a user.
 * @param req.body.user The user object containing the user ID.
 * @param req.body.validatedData.body The validated operation data to insert.
 * @param res The response object.
 * @param next The next middleware function.
 */
export const insertOperations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const operationData: OperationInsert = { ...req.body.validatedData.body, user_id: req.body.user.id };

        const newOperation = await OperationsService.insertOperations(operationData);
        res.status(201).json(newOperation);
    } catch (error) {
        next(error);
    }
};


/*========*/
/* UPDATE */
/*========*/
/**
 * Update an existing operation for a user.
 * @param req.body.user The user object containing the user ID.
 * @param req.body.validatedData.body The validated operation data to update.
 * @param res The response object.
 * @param next The next middleware function.
 */
export const updateOperations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const operationData: OperationUpdate = { ...req.body.validatedData.body, id: req.body.validatedData.params.id, user_id: req.body.user.id };

        const operations = await OperationsService.updateOperations(operationData);
        res.status(200).json(operations);
    } catch (error) {
        next(error);
    }
};


/*========*/
/* DELETE */
/*========*/
/**
 * Delete an operation for a user.
 * @param req.body.user The user object containing the user ID.
 * @param req.body.validatedData.params.id The ID of the operation to delete.
 * @param res The response object.
 * @param next The next middleware function.
 */
export const deleteOperations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId: number = req.body.user.id;
        const operationId: number = req.body.validatedData.params.id;

        const operations = await OperationsService.deleteOperations(userId, operationId);
        res.status(200).json(operations);
    } catch (error) {
        next(error);
    }
};

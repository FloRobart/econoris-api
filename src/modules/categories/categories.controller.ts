import { Request, Response, NextFunction } from 'express';
import * as CategoriesService from './categories.service';



/*========*/
/* SELECT */
/*========*/
/**
 * Get the tree of every category: the main categories, each with its sub-categories.
 * The categories are the same for every user.
 * @param _req The request object.
 * @param res The response object.
 * @param next The next middleware function.
 */
export const selectCategoriesTree = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await CategoriesService.selectCategoriesTree();
        res.status(categories.length ? 200 : 204).json(categories);
    } catch (error) {
        next(error);
    }
};

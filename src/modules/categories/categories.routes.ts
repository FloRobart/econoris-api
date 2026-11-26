import { Router } from "express";
import * as CategoriesController from "./categories.controller";



const router = Router();



/*========*/
/* SELECT */
/*========*/
/**
 * @swagger
 * /categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Retrieve the tree of the categories
 *     description: |
 *       Retrieve every category as a tree: the main categories, each with its sub-categories in `children`.
 *       Every level is sorted by label. The categories are the same for every user, and any of them can be
 *       chosen for an operation, a main category included.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The main categories, with their sub-categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Categories'
 *       204:
 *         description: No content. No categories found.
 *       401:
 *         description: Unauthorized access.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error401'
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error500'
 */
router.get('/', CategoriesController.selectCategoriesTree);



export default router;

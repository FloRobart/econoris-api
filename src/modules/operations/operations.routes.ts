import { Router } from "express";
import * as OperationsController from "./operations.controller";
import { bodyValidator } from "../../core/middlewares/validators/body_validator.middleware";
import { OperationsIdDeleteSchema, OperationsIdUpdateSchema, OperationsInsertSchema, OperationsPeriodSchema, OperationsUpdateSchema } from "./operations.schema";
import { paramsQueryValidator } from "../../core/middlewares/validators/params_query_validator.middleware";



const router = Router();



/*========*/
/* SELECT */
/*========*/
/**
 * @swagger
 * /operations:
 *   get:
 *     tags:
 *       - Operations
 *     summary: Retrieve a list of operations of the authenticated user
 *     description: Retrieve the operations associated with the authenticated user, all of them or only those of a period. The clients load them by periods of a few months, so that they never wait for the whole history.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         required: false
 *         description: First levy day of the period, included. Without it, the period has no start.
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-09-01"
 *       - in: query
 *         name: end_date
 *         required: false
 *         description: Last levy day of the period, included. Without it, the period has no end, so it holds every upcoming operation.
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-11-30"
 *     responses:
 *       200:
 *         description: A list of operations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Operations'
 *       204:
 *         description: No content. No operations found.
 *       400:
 *         description: Bad request. A bound is not a day "YYYY-MM-DD", or start_date is after end_date.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error400'
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
router.get('/', paramsQueryValidator(OperationsPeriodSchema), OperationsController.selectOperations);

/**
 * @swagger
 * /operations/oldest-date:
 *   get:
 *     tags:
 *       - Operations
 *     summary: Retrieve the levy date of the oldest operation of the authenticated user
 *     description: The clients that load the operations by periods know with it when nothing older is left to load.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The levy date of the oldest operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OperationsOldestDate'
 *       204:
 *         description: No content. The user has no operation.
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
router.get('/oldest-date', OperationsController.selectOldestOperationDate);


/*========*/
/* INSERT */
/*========*/
/**
 * @swagger
 * /operations:
 *   post:
 *     tags:
 *       - Operations
 *     summary: Create a new operation for the authenticated user
 *     description: Create a new operation associated with the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OperationsInsert'
 *     responses:
 *       201:
 *         description: Created operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Operations'
 *       400:
 *         description: Bad request. Please check the input data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error400'
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
router.post('/', bodyValidator(OperationsInsertSchema), OperationsController.insertOperations);


/*========*/
/* UPDATE */
/*========*/
/**
 * @swagger
 * /operations/{id}:
 *   put:
 *     tags:
 *       - Operations
 *     summary: Update an existing operation for the authenticated user
 *     description: Update an existing operation associated with the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OperationsUpdate'
 *     responses:
 *       200:
 *         description: Updated operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Operations'
 *       400:
 *         description: Bad request. Please check the input data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error400'
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
router.put('/:id', paramsQueryValidator(OperationsIdUpdateSchema), bodyValidator(OperationsUpdateSchema), OperationsController.updateOperations);


/*========*/
/* DELETE */
/*========*/
/**
 * @swagger
 * /operations/{id}:
 *   delete:
 *     tags:
 *       - Operations
 *     summary: Delete an existing operation for the authenticated user
 *     description: Delete an existing operation associated with the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Deleted operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Operations'
 *       400:
 *         description: Bad request. Please check the input data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error400'
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
router.delete('/:id', paramsQueryValidator(OperationsIdDeleteSchema), OperationsController.deleteOperations);



export default router;
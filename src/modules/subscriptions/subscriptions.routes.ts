import { Router } from "express";
import * as SubscriptionsController from "./subscriptions.controller";
import { bodyValidator } from "../../core/middlewares/validators/body_validator.middleware";
import { SubscriptionsIdDeleteSchema, SubscriptionsIdUpdateSchema, SubscriptionsInsertSchema, SubscriptionsUpdateSchema } from "./subscriptions.schema";
import { paramsQueryValidator } from "../../core/middlewares/validators/params_query_validator.middleware";
import { subscriptionCreationLimiter } from "../../core/middlewares/rate_limiter.middleware";



const router = Router();



/*========*/
/* SELECT */
/*========*/
/**
 * @swagger
 * /subscriptions:
 *   get:
 *     tags:
 *       - Subscriptions
 *     summary: Retrieve a list of subscriptions of the authenticated user
 *     description: Retrieve a list of subscriptions associated with the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subscriptions'
 *       204:
 *         description: No content. No subscriptions found.
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
router.get('/', SubscriptionsController.selectSubscriptions);


/*========*/
/* INSERT */
/*========*/
/**
 * @swagger
 * /subscriptions:
 *   post:
 *     tags:
 *       - Subscriptions
 *     summary: Create a new subscription for the authenticated user
 *     description: Create a new subscription associated with the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscriptionsInsert'
 *     responses:
 *       201:
 *         description: Created subscription
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscriptions'
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
 *       403:
 *         description: Forbidden. The user already has the maximum number of subscriptions (200).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error403'
 *       429:
 *         description: Too many requests. A user can create at most 30 subscriptions per hour.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error429'
 *       500:
 *         description: Internal server error. Please create an issue on Github
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/error500'
 */
router.post('/', subscriptionCreationLimiter, bodyValidator(SubscriptionsInsertSchema), SubscriptionsController.insertSubscriptions);


/*========*/
/* UPDATE */
/*========*/
/**
 * @swagger
 * /subscriptions:
 *   put:
 *     tags:
 *       - Subscriptions
 *     summary: Update an existing subscription for the authenticated user
 *     description: Update an existing subscription associated with the authenticated user.
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
 *             $ref: '#/components/schemas/SubscriptionsUpdate'
 *     responses:
 *       200:
 *         description: Updated subscription
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscriptions'
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
router.put('/:id', paramsQueryValidator(SubscriptionsIdUpdateSchema), bodyValidator(SubscriptionsUpdateSchema), SubscriptionsController.updateSubscriptions);


/*========*/
/* DELETE */
/*========*/
/**
 * @swagger
 * /subscriptions:
 *   delete:
 *     tags:
 *       - Subscriptions
 *     summary: Delete an existing subscription for the authenticated user
 *     description: Delete an existing subscription associated with the authenticated user.
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
 *         description: Deleted subscription
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscriptions'
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
router.delete('/:id', paramsQueryValidator(SubscriptionsIdDeleteSchema), SubscriptionsController.deleteSubscriptions);



export default router;
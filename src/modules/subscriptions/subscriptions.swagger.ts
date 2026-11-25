/*========*/
/* SELECT */
/*========*/
/**
 * @swagger
 * components:
 *   schemas:
 *     Subscriptions:
 *       type: object
 *       required:
 *         - id
 *         - label
 *         - amount
 *         - category_id
 *         - category
 *         - source
 *         - destination
 *         - costs
 *         - active
 *         - interval_value
 *         - interval_unit
 *         - start_date
 *         - end_date
 *         - day_of_month
 *         - last_generated_at
 *         - user_id
 *         - created_at
 *         - updated_at
 *       properties:
 *         id:
 *           type: number
 *           exemple: 1
 *         label:
 *           type: string
 *           exemple: "Sample Subscription"
 *         amount:
 *           type: number
 *           exemple: 100.00
 *         category_id:
 *           type: number
 *           description: ID of the category, from GET /categories
 *           example: 49
 *         category:
 *           type: string
 *           deprecated: true
 *           description: Kept for the clients not yet updated. The label sent by such a client, otherwise the label of the category.
 *           example: "Courses"
 *         source:
 *           type: string
 *           exemple: "Job"
 *         destination:
 *           type: string
 *           exemple: "Bank"
 *         costs:
 *           type: number
 *           exemple: 2.50
 *         active:
 *           type: boolean
 *           exemple: true
 *         interval_value:
 *           type: number
 *           exemple: 1
 *         interval_unit:
 *           type: string
 *           enum: ["days", "weeks", "months"]
 *           exemple: "months"
 *         start_date:
 *           type: string
 *           exemple: "2024-01-01T00:00:00.000Z"
 *         end_date:
 *           type: string
 *           exemple: "2024-01-01T00:00:00.000Z"
 *         day_of_month:
 *           type: number
 *           exemple: 15
 *         last_generated_at:
 *           type: string
 *           exemple: "2024-01-01T00:00:00.000Z"
 *         user_id:
 *           type: number
 *           exemple: 1
 *         created_at:
 *           type: string
 *           exemple: "2024-01-01T00:00:00.000Z"
 *         updated_at:
 *           type: string
 *           exemple: "2024-01-01T00:00:00.000Z"
 */


/*========*/
/* INSERT */
/*========*/
/**
 * @swagger
 * components:
 *   schemas:
 *     SubscriptionsInsert:
 *       type: object
 *       description: The category is given by category_id, or by the deprecated category for the clients not yet updated.
 *       required:
 *         - label
 *         - amount
 *         - interval_value
 *         - interval_unit
 *         - start_date
 *       properties:
 *         id:
 *           type: number
 *           exemple: 1
 *         label:
 *           type: string
 *           exemple: "Sample Subscription"
 *         amount:
 *           type: number
 *           exemple: 100.00
 *         category_id:
 *           type: number
 *           description: ID of the category, from GET /categories
 *           example: 49
 *         category:
 *           type: string
 *           deprecated: true
 *           description: Label of an old category, sent by the clients not yet updated instead of category_id. The server finds its equivalent category, or "Autres".
 *           example: "Courses"
 *         source:
 *           type: string
 *           exemple: "Job"
 *         destination:
 *           type: string
 *           exemple: "Bank"
 *         costs:
 *           type: number
 *           exemple: 2.50
 *         active:
 *           type: boolean
 *           exemple: true
 *         interval_value:
 *           type: number
 *           exemple: 1
 *         interval_unit:
 *           type: string
 *           enum: ["days", "weeks", "months"]
 *           exemple: "months"
 *         start_date:
 *           type: string
 *           exemple: "2024-01-01T00:00:00.000Z"
 *         end_date:
 *           type: string
 *           exemple: "2024-01-01T00:00:00.000Z"
 */


/*========*/
/* UPDATE */
/*========*/
/**
 * @swagger
 * components:
 *   schemas:
 *     SubscriptionsUpdate:
 *       type: object
 *       description: The category is given by category_id, or by the deprecated category for the clients not yet updated.
 *       required:
 *         - label
 *         - amount
 *         - interval_value
 *         - interval_unit
 *         - start_date
 *       properties:
 *         id:
 *           type: number
 *           exemple: 1
 *         label:
 *           type: string
 *           exemple: "Sample Subscription"
 *         amount:
 *           type: number
 *           exemple: 100.00
 *         category_id:
 *           type: number
 *           description: ID of the category, from GET /categories
 *           example: 49
 *         category:
 *           type: string
 *           deprecated: true
 *           description: Label of an old category, sent by the clients not yet updated instead of category_id. The server finds its equivalent category, or "Autres".
 *           example: "Courses"
 *         source:
 *           type: string
 *           exemple: "Job"
 *         destination:
 *           type: string
 *           exemple: "Bank"
 *         costs:
 *           type: number
 *           exemple: 2.50
 *         active:
 *           type: boolean
 *           exemple: true
 *         interval_value:
 *           type: number
 *           exemple: 1
 *         interval_unit:
 *           type: string
 *           enum: ["days", "weeks", "months"]
 *           exemple: "months"
 *         start_date:
 *           type: string
 *           exemple: "2024-01-01T00:00:00.000Z"
 *         end_date:
 *           type: string
 *           exemple: "2024-01-01T00:00:00.000Z"
 */

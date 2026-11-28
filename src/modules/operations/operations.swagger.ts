/*========*/
/* SELECT */
/*========*/
/**
 * @swagger
 * components:
 *   schemas:
 *     Operations:
 *       type: object
 *       required:
 *         - id
 *         - levy_date
 *         - label
 *         - amount
 *         - category_id
 *         - category
 *         - source
 *         - destination
 *         - costs
 *         - is_validate
 *         - user_id
 *         - subscription_id
 *         - created_at
 *         - updated_at
 *       properties:
 *         id:
 *           type: number
 *           exemple: 1
 *         levy_date:
 *           type: string
 *           exemple: "2024-01-01T00:00:00.000Z"
 *         label:
 *           type: string
 *           exemple: "Sample Operation"
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
 *         is_validate:
 *           type: boolean
 *           exemple: true
 *         user_id:
 *           type: number
 *           exemple: 1
 *         subscription_id:
 *           type: number|null
 *           exemple: 1
 *         created_at:
 *           type: string
 *           exemple: "2024-01-01T00:00:00.000Z"
 *         updated_at:
 *           type: string
 *           exemple: "2024-01-01T00:00:00.000Z"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OperationsOldestDate:
 *       type: object
 *       required:
 *         - oldest_levy_date
 *       properties:
 *         oldest_levy_date:
 *           type: string
 *           format: date
 *           description: Levy day of the oldest operation of the user
 *           example: "2024-03-12"
 */


/*========*/
/* INSERT */
/*========*/
/**
 * @swagger
 * components:
 *   schemas:
 *     OperationsInsert:
 *       type: object
 *       description: The category is given by category_id, or by the deprecated category for the clients not yet updated.
 *       required:
 *         - levy_date
 *         - label
 *         - amount
 *       properties:
 *         levy_date:
 *           type: string
 *           exemple: "2024-01-01T00:00:00.000Z"
 *         label:
 *           type: string
 *           exemple: "Sample Operation"
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
 *         is_validate:
 *           type: boolean
 *           exemple: true
 */


/*========*/
/* UPDATE */
/*========*/
/**
 * @swagger
 * components:
 *   schemas:
 *     OperationsUpdate:
 *       type: object
 *       description: The category is given by category_id, or by the deprecated category for the clients not yet updated.
 *       required:
 *         - levy_date
 *         - label
 *         - amount
 *         - source
 *         - destination
 *         - costs
 *         - is_validate
 *       properties:
 *         levy_date:
 *           type: string
 *           exemple: "2024-01-01T00:00:00.000Z"
 *         label:
 *           type: string
 *           exemple: "Sample Operation"
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
 *         is_validate:
 *           type: boolean
 *           exemple: true
 */

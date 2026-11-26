/*========*/
/* SELECT */
/*========*/
/**
 * @swagger
 * components:
 *   schemas:
 *     Categories:
 *       type: object
 *       required:
 *         - id
 *         - code
 *         - label
 *         - parent_id
 *         - search_keywords
 *         - children
 *       properties:
 *         id:
 *           type: number
 *           example: 18
 *         code:
 *           type: string
 *           description: Stable identifier of the category. Unlike the label, it never changes.
 *           example: "investment"
 *         label:
 *           type: string
 *           example: "Investissement"
 *         parent_id:
 *           type: number
 *           nullable: true
 *           description: ID of the main category, or null for a main category
 *           example: null
 *         search_keywords:
 *           type: array
 *           description: Words that find the category in a search although its label does not contain them
 *           items:
 *             type: string
 *           example: ["SCPI", "locatif"]
 *         children:
 *           type: array
 *           description: Sub-categories, sorted by label. Empty for a sub-category.
 *           items:
 *             $ref: '#/components/schemas/Categories'
 */

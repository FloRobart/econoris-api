import { z } from "zod";



/*========*/
/* SELECT */
/*========*/
export const CategoriesSchema = z.object({
    id: z.int().min(1),

    /* Stable identifier, used by the clients in their logic: unlike the label, it never changes */
    code: z.string().trim().min(1).max(100),
    label: z.string().trim().min(1).max(255),

    /* null for a main category */
    parent_id: z.int().min(1).nullable(),

    /* Words that find the category in a search although its label does not contain them ("essence" for "Carburant") */
    search_keywords: z.array(z.string().trim().min(1).max(100)),
});

/* A category with its sub-categories, at any depth */
export const CategoriesTreeSchema = CategoriesSchema.extend({
    get children() {
        return z.array(CategoriesTreeSchema);
    },
});



/*==============================================*/
/* CATEGORY OF AN OPERATION OR OF A SUBSCRIPTION */
/*==============================================*/
/* Label of a category, as stored in the "category" column of the operations and the subscriptions */
const CategoryLabelSchema = z.string().trim().min(1).max(255);

/* The category chosen by a client: its id, or, for a client not yet updated, the label of an old category */
export const CategoryChoiceSchema = z.object({
    category_id: CategoriesSchema.shape.id.optional(),
    category: CategoryLabelSchema.optional(),
});

/* The category of an operation or of a subscription, once found by the server */
export const ResolvedCategorySchema = z.object({
    category_id: CategoriesSchema.shape.id,

    /* Read by the clients not yet updated: the label they sent, otherwise the label of the category */
    category: CategoryLabelSchema,
});

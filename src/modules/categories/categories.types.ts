import { z } from "zod";
import { CategoriesSchema, CategoriesTreeSchema, CategoryChoiceSchema, ResolvedCategorySchema } from "./categories.schema";


/* SELECT */
export type Category = z.infer<typeof CategoriesSchema>;
export type CategoryTree = z.infer<typeof CategoriesTreeSchema>;

/* CATEGORY OF AN OPERATION OR OF A SUBSCRIPTION */
export type CategoryChoice = z.infer<typeof CategoryChoiceSchema>;
export type ResolvedCategory = z.infer<typeof ResolvedCategorySchema>;

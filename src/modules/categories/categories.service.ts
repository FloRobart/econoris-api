import { ZodError } from 'zod';
import { AppError } from '../../core/models/AppError.model';
import * as CategoriesRepository from './categories.repository';
import { CategoriesSchema } from './categories.schema';
import { Category, CategoryChoice, CategoryTree, ResolvedCategory } from './categories.types';



/* Sorts the labels as a French reader expects them: "Électricité" right after "Eau", not after "Z" */
const FRENCH_LABEL_COLLATOR = new Intl.Collator('fr');

/* Category given to an old category label that has no equivalent */
const FALLBACK_CATEGORY_CODE = 'other';



/*========*/
/* SELECT */
/*========*/
/**
 * Get the tree of the categories: the main categories, each with its sub-categories.
 * Every level of the tree is sorted by label.
 * @returns An array of the main categories, with their sub-categories in children.
 * @throws AppError if there is an issue retrieving or parsing the categories.
 */
export async function selectCategoriesTree(): Promise<CategoryTree[]> {
    try {
        const rows = await CategoriesRepository.selectCategories();
        const categories = CategoriesSchema.array().parse(rows);

        return buildCategoriesTree(categories);
    } catch (error) {
        throw (error instanceof ZodError) ? new AppError("Failed to parse categories", 500) : error;
    }
}



/*==============================================*/
/* CATEGORY OF AN OPERATION OR OF A SUBSCRIPTION */
/*==============================================*/
/**
 * Find the category chosen by a client for an operation or a subscription.
 * An up-to-date client sends the ID of the category. A client not yet updated sends the label of an old
 * category instead: it is converted with the legacy_category_labels table. The ID wins when both are sent.
 * @param categoryChoice The category_id and/or the old category label sent by the client.
 * @returns The ID of the category, and the label to store for the clients not yet updated.
 * @throws AppError 400 if the client sends no category, or the ID of a category that does not exist.
 */
export async function resolveCategory(categoryChoice: CategoryChoice): Promise<ResolvedCategory> {
    if (categoryChoice.category_id !== undefined) {
        return resolveCategoryById(categoryChoice.category_id);
    }

    if (categoryChoice.category !== undefined) {
        return resolveLegacyCategoryLabel(categoryChoice.category);
    }

    throw new AppError("Missing category", 400);
}



/*===========*/
/* UTILITIES */
/*===========*/
/**
 * Find a category by the ID sent by a client.
 * @param categoryId The ID of the category.
 * @returns The ID of the category, with its label for the clients not yet updated.
 * @throws AppError 400 if no category has this ID.
 */
async function resolveCategoryById(categoryId: number): Promise<ResolvedCategory> {
    const category = await CategoriesRepository.selectCategoryById(categoryId);
    if (!category) { throw new AppError("Unknown category", 400); }

    return { category_id: category.id, category: category.label };
}

/**
 * Find the category equivalent to the label of an old category, sent by a client not yet updated.
 * @param legacyLabel The label of the old category.
 * @returns The ID of the equivalent category, with the label sent, so that this client shows it unchanged.
 */
async function resolveLegacyCategoryLabel(legacyLabel: string): Promise<ResolvedCategory> {
    const categoryId = await CategoriesRepository.selectCategoryIdOfLegacyLabel(legacyLabel, FALLBACK_CATEGORY_CODE);

    return { category_id: categoryId, category: legacyLabel };
}

/**
 * Builds the tree of the categories from their flat list, whatever its depth and its order.
 * @param categories The flat list of every category
 * @returns The main categories, each with its sub-categories in children, sorted by label at every level
 */
function buildCategoriesTree(categories: Category[]): CategoryTree[] {
    const categoriesById = new Map<number, CategoryTree>();
    categories.forEach(category => categoriesById.set(category.id, { ...category, children: [] }));

    const mainCategories: CategoryTree[] = [];
    for (const category of categoriesById.values()) {
        if (category.parent_id === null) {
            mainCategories.push(category);
            continue;
        }

        /* The parent is always in the list: the foreign key on parent_id forbids an orphan category */
        categoriesById.get(category.parent_id)?.children.push(category);
    }

    return sortByLabel(mainCategories);
}

/**
 * Sorts categories by label, then their sub-categories, at every depth.
 * @param categories The categories to sort, sorted in place
 * @returns The sorted categories
 */
function sortByLabel(categories: CategoryTree[]): CategoryTree[] {
    categories.sort((first, second) => FRENCH_LABEL_COLLATOR.compare(first.label, second.label));
    categories.forEach(category => sortByLabel(category.children));

    return categories;
}

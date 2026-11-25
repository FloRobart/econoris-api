import { AppError } from "../../core/models/AppError.model";
import { Database } from "../../core/models/Database.model";
import { Category } from "./categories.types";



/*========*/
/* SELECT */
/*========*/
/**
 * Get every category, main categories and sub-categories, as a flat list.
 * The categories are shared by every user: they are reference data, written by the database migrations.
 * @returns An array of Category objects.
 * @throws AppError if there is an issue retrieving the categories.
 */
export async function selectCategories(): Promise<Category[]> {
    try {
        const query = "SELECT id, code, label, parent_id, search_keywords FROM categories;";

        return await Database.execute<Category>({ text: query, values: [] });
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to retrieve categories", 500);
    }
}

/**
 * Get a category by its ID.
 * @param categoryId The ID of the category.
 * @returns The category, or null if no category has this ID.
 * @throws AppError if there is an issue retrieving the category.
 */
export async function selectCategoryById(categoryId: number): Promise<Category | null> {
    try {
        const query = "SELECT id, code, label, parent_id, search_keywords FROM categories WHERE id = $1;";

        const rows = await Database.execute<Category>({ text: query, values: [categoryId] });
        return rows[0] ?? null;
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to retrieve category", 500);
    }
}

/**
 * Get the ID of the category equivalent to the label of an old category, from the legacy_category_labels table.
 * @param legacyLabel The label of the old category.
 * @param fallbackCategoryCode The code of the category to use when the label has no equivalent.
 * @returns The ID of the equivalent category, or of the fallback category.
 * @throws AppError if neither the equivalent category nor the fallback category exists.
 */
export async function selectCategoryIdOfLegacyLabel(legacyLabel: string, fallbackCategoryCode: string): Promise<number> {
    try {
        const query = `
            SELECT COALESCE(
                (SELECT category_id FROM legacy_category_labels WHERE label = $1),
                (SELECT id FROM categories WHERE code = $2)
            ) AS category_id;`;

        const rows = await Database.execute<{ category_id: number | null }>({ text: query, values: [legacyLabel, fallbackCategoryCode] });
        const categoryId = rows[0]?.category_id;
        if (!categoryId) { throw new AppError("No category found for an old category label", 500); }

        return categoryId;
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to retrieve the category of an old category label", 500);
    }
}

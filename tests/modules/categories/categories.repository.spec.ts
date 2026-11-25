import { Database } from '../../../src/core/models/Database.model';
import { AppError } from '../../../src/core/models/AppError.model';
import * as CategoriesRepository from '../../../src/modules/categories/categories.repository';



/**
 * Categories repository tests: the categories are shared by every user.
 */
describe('Categories repository tests', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });


    it('Selects every category, without filtering on a user', async () => {
        const executeMock = jest.spyOn(Database, 'execute').mockResolvedValue([]);

        await CategoriesRepository.selectCategories();

        const query = executeMock.mock.calls[0][0];
        expect(query.text).toContain('FROM categories');
        expect(query.text).not.toContain('WHERE');
        expect(query.values).toEqual([]);
    });


    it('Returns null when no category has the given id', async () => {
        jest.spyOn(Database, 'execute').mockResolvedValue([]);

        await expect(CategoriesRepository.selectCategoryById(999)).resolves.toBeNull();
    });


    it('Looks for the equivalent of an old label, with the fallback category', async () => {
        const executeMock = jest.spyOn(Database, 'execute').mockResolvedValue([{ category_id: 49 }]);

        const categoryId = await CategoriesRepository.selectCategoryIdOfLegacyLabel('Courses', 'other');

        const query = executeMock.mock.calls[0][0];
        expect(query.text).toContain('FROM legacy_category_labels WHERE label = $1');
        expect(query.text).toContain('FROM categories WHERE code = $2');
        expect(query.values).toEqual(['Courses', 'other']);
        expect(categoryId).toBe(49);
    });


    it('Fails when neither the equivalent nor the fallback category exists', async () => {
        jest.spyOn(Database, 'execute').mockResolvedValue([{ category_id: null }]);

        await expect(CategoriesRepository.selectCategoryIdOfLegacyLabel('Courses', 'other')).rejects.toMatchObject({ httpStatus: 500 });
    });


    it('Turns an unexpected failure into an AppError', async () => {
        jest.spyOn(Database, 'execute').mockRejectedValue(new Error('Unexpected failure'));

        const selection = CategoriesRepository.selectCategories();

        await expect(selection).rejects.toBeInstanceOf(AppError);
        await expect(selection).rejects.toMatchObject({ message: "Failed to retrieve categories", httpStatus: 500 });
    });
});

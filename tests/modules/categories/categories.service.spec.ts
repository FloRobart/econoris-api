import { Database } from '../../../src/core/models/Database.model';
import { AppError } from '../../../src/core/models/AppError.model';
import * as CategoriesService from '../../../src/modules/categories/categories.service';
import { Category } from '../../../src/modules/categories/categories.types';



/* Main categories */
const INVESTMENT: Category = { id: 1, code: 'investment', label: 'Investissement', parent_id: null, search_keywords: [] };
const HOUSING: Category = { id: 2, code: 'housing', label: 'Logement', parent_id: null, search_keywords: [] };

/* Sub-categories */
const STOCKS: Category = { id: 3, code: 'investment_stocks', label: 'Bourse et actions', parent_id: INVESTMENT.id, search_keywords: [] };
const CRYPTO: Category = { id: 4, code: 'investment_crypto', label: 'Cryptomonnaies', parent_id: INVESTMENT.id, search_keywords: [] };
const RENT: Category = { id: 5, code: 'housing_rent', label: 'Loyer', parent_id: HOUSING.id, search_keywords: [] };



/**
 * Categories service tests: the flat list of the database becomes a sorted tree.
 */
describe('Categories service tests', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });


    it('Puts every sub-category under its main category', async () => {
        mockDatabaseRows([INVESTMENT, RENT, STOCKS, HOUSING, CRYPTO]);

        const tree = await CategoriesService.selectCategoriesTree();

        expect(tree).toEqual([
            { ...INVESTMENT, children: [{ ...STOCKS, children: [] }, { ...CRYPTO, children: [] }] },
            { ...HOUSING, children: [{ ...RENT, children: [] }] },
        ]);
    });


    it('Places a sub-category listed before its main category', async () => {
        mockDatabaseRows([RENT, HOUSING]);

        const tree = await CategoriesService.selectCategoriesTree();

        expect(tree).toEqual([{ ...HOUSING, children: [{ ...RENT, children: [] }] }]);
    });


    it('Sorts the categories by label as in French, at every level', async () => {
        mockDatabaseRows([
            { id: 1, code: 'taxes', label: 'Impôts et taxes', parent_id: null, search_keywords: [] },
            { id: 2, code: 'education', label: 'Éducation et formation', parent_id: null, search_keywords: [] },
            { id: 3, code: 'housing', label: 'Logement', parent_id: null, search_keywords: [] },
            { id: 4, code: 'food', label: 'alimentation', parent_id: null, search_keywords: [] },
            { id: 5, code: 'housing_water', label: 'Eau', parent_id: 3, search_keywords: [] },
            { id: 6, code: 'housing_gas_heating', label: 'Gaz et chauffage', parent_id: 3, search_keywords: [] },
            { id: 7, code: 'housing_electricity', label: 'Électricité', parent_id: 3, search_keywords: [] },
        ]);

        const tree = await CategoriesService.selectCategoriesTree();

        expect(tree.map(category => category.label)).toEqual(['alimentation', 'Éducation et formation', 'Impôts et taxes', 'Logement']);
        expect(tree[3].children.map(category => category.label)).toEqual(['Eau', 'Électricité', 'Gaz et chauffage']);
    });


    it('Builds a third level of categories', async () => {
        const realEstate: Category = { id: 6, code: 'investment_real_estate', label: 'Immobilier', parent_id: INVESTMENT.id, search_keywords: [] };
        const rentalRealEstate: Category = { id: 7, code: 'investment_real_estate_rental', label: 'Locatif', parent_id: realEstate.id, search_keywords: [] };
        mockDatabaseRows([rentalRealEstate, INVESTMENT, realEstate]);

        const tree = await CategoriesService.selectCategoriesTree();

        expect(tree).toEqual([
            { ...INVESTMENT, children: [{ ...realEstate, children: [{ ...rentalRealEstate, children: [] }] }] },
        ]);
    });


    it('Keeps the search keywords of every category', async () => {
        const fuel: Category = { id: 8, code: 'transport_fuel', label: 'Carburant et recharge', parent_id: null, search_keywords: ['essence', 'gazole'] };
        mockDatabaseRows([fuel]);

        const tree = await CategoriesService.selectCategoriesTree();

        expect(tree[0].search_keywords).toEqual(['essence', 'gazole']);
    });


    it('Returns no category when the database has none', async () => {
        mockDatabaseRows([]);

        await expect(CategoriesService.selectCategoriesTree()).resolves.toEqual([]);
    });


    it('Refuses an invalid category returned by the database', async () => {
        mockDatabaseRows([{ ...INVESTMENT, label: '' }]);

        const selection = CategoriesService.selectCategoriesTree();

        await expect(selection).rejects.toBeInstanceOf(AppError);
        await expect(selection).rejects.toMatchObject({ message: "Failed to parse categories", httpStatus: 500 });
    });
});



/**
 * resolveCategory tests: a client chooses a category by its id, or, if not yet updated, by an old label.
 */
describe('resolveCategory tests', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });


    it('Finds the category by its id, with its label for the clients not yet updated', async () => {
        mockDatabaseRows([STOCKS]);

        await expect(CategoriesService.resolveCategory({ category_id: STOCKS.id })).resolves.toEqual({ category_id: STOCKS.id, category: STOCKS.label });
    });


    it('Prefers the id to the old label when the client sends both', async () => {
        mockDatabaseRows([STOCKS]);

        const resolvedCategory = await CategoriesService.resolveCategory({ category_id: STOCKS.id, category: 'Courses' });

        expect(resolvedCategory).toEqual({ category_id: STOCKS.id, category: STOCKS.label });
    });


    it('Refuses the id of a category that does not exist', async () => {
        mockDatabaseRows([]);

        await expect(CategoriesService.resolveCategory({ category_id: 999 })).rejects.toMatchObject({ message: "Unknown category", httpStatus: 400 });
    });


    it('Finds the category of an old label, and keeps this label for the client that sent it', async () => {
        const executeMock = jest.spyOn(Database, 'execute').mockResolvedValue([{ category_id: RENT.id }]);

        const resolvedCategory = await CategoriesService.resolveCategory({ category: 'Loyer' });

        expect(resolvedCategory).toEqual({ category_id: RENT.id, category: 'Loyer' });
        expect(executeMock.mock.calls[0][0].values).toEqual(['Loyer', 'other']);
    });


    it('Refuses a choice without any category', async () => {
        const executeMock = jest.spyOn(Database, 'execute');

        await expect(CategoriesService.resolveCategory({})).rejects.toMatchObject({ message: "Missing category", httpStatus: 400 });
        expect(executeMock).not.toHaveBeenCalled();
    });
});



/*=========*/
/* HELPERS */
/*=========*/
/**
 * Makes the database return the given rows, for the next query.
 * @param rows The rows of the categories table
 */
function mockDatabaseRows(rows: Category[]): void {
    jest.spyOn(Database, 'execute').mockResolvedValue(rows);
}

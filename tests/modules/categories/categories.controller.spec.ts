import { Request, Response } from 'express';
import * as CategoriesController from '../../../src/modules/categories/categories.controller';
import * as CategoriesService from '../../../src/modules/categories/categories.service';



/* Only the controller is tested: the service is replaced by a mock */
jest.mock('../../../src/modules/categories/categories.service', () => ({
    selectCategoriesTree: jest.fn(),
}));

const CATEGORIES_TREE = [
    { id: 1, code: 'investment', label: 'Investissement', parent_id: null, search_keywords: [], children: [] },
];



/**
 * Categories controller tests: the HTTP status follows the content of the tree.
 */
describe('Categories controller tests', () => {
    it('Sends the tree of the categories with a 200', async () => {
        jest.mocked(CategoriesService.selectCategoriesTree).mockResolvedValue(CATEGORIES_TREE);
        const response = buildResponse();

        await CategoriesController.selectCategoriesTree({} as Request, response, jest.fn());

        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(CATEGORIES_TREE);
    });


    it('Sends a 204 when there is no category', async () => {
        jest.mocked(CategoriesService.selectCategoriesTree).mockResolvedValue([]);
        const response = buildResponse();

        await CategoriesController.selectCategoriesTree({} as Request, response, jest.fn());

        expect(response.status).toHaveBeenCalledWith(204);
    });


    it('Hands an error of the service over to the error middleware', async () => {
        const error = new Error('Service failure');
        jest.mocked(CategoriesService.selectCategoriesTree).mockRejectedValue(error);
        const next = jest.fn();

        await CategoriesController.selectCategoriesTree({} as Request, buildResponse(), next);

        expect(next).toHaveBeenCalledWith(error);
    });
});



/*=========*/
/* HELPERS */
/*=========*/
/**
 * Builds a response whose methods can be chained, like the Express ones.
 * @returns The response
 */
function buildResponse(): Response {
    const response = { status: jest.fn(), json: jest.fn() };
    response.status.mockReturnValue(response);

    return response as unknown as Response;
}

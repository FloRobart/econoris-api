import { Request, Response } from 'express';
import * as OperationsController from '../../../src/modules/operations/operations.controller';
import * as OperationsService from '../../../src/modules/operations/operations.service';



/* Only the controller is tested: the service is replaced by a mock */
jest.mock('../../../src/modules/operations/operations.service', () => ({
    insertOperations: jest.fn(),
    updateOperations: jest.fn(),
}));

/* User given by the authorization middleware, from the token */
const AUTHENTICATED_USER = { id: 42 };

/* Another user, that a client could try to write for */
const OTHER_USER_ID = 999;



/**
 * Operations controller tests: the user of an operation always comes from the token.
 */
describe('Operations controller tests', () => {
    it('Creates the operation for the authenticated user, whatever user_id the client sends', async () => {
        const request = buildRequest({ body: { label: 'Courses', user_id: OTHER_USER_ID } });

        await OperationsController.insertOperations(request, buildResponse(), jest.fn());

        expect(OperationsService.insertOperations).toHaveBeenCalledWith(expect.objectContaining({ user_id: AUTHENTICATED_USER.id }));
    });


    it('Updates the operation of the authenticated user, whatever user_id the client sends', async () => {
        const request = buildRequest({ body: { label: 'Courses', user_id: OTHER_USER_ID }, params: { id: 7 } });

        await OperationsController.updateOperations(request, buildResponse(), jest.fn());

        expect(OperationsService.updateOperations).toHaveBeenCalledWith(expect.objectContaining({ id: 7, user_id: AUTHENTICATED_USER.id }));
    });
});



/*=========*/
/* HELPERS */
/*=========*/
/**
 * Builds a request as the validators and the authorization middleware leave it.
 * @param validatedData The data validated from the body and the parameters
 * @returns The request
 */
function buildRequest(validatedData: object): Request {
    return { body: { user: AUTHENTICATED_USER, validatedData } } as unknown as Request;
}

/**
 * Builds a response whose methods can be chained, like the Express ones.
 * @returns The response
 */
function buildResponse(): Response {
    const response = { status: jest.fn(), json: jest.fn() };
    response.status.mockReturnValue(response);

    return response as unknown as Response;
}

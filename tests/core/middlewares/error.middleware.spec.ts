import express, { Express, RequestHandler } from 'express';
import { once } from 'node:events';
import { AddressInfo } from 'node:net';
import { errorHandler } from '../../../src/core/middlewares/error.middleware';
import { AppError } from '../../../src/core/models/AppError.model';



/* The errors are expected in these tests: nothing needs to be printed */
jest.mock('../../../src/core/utils/logger');



/**
 * Error middleware tests
 */
describe('Error middleware tests', () => {
    it('Answers 400 to an invalid JSON body', async () => {
        const response = await postRawBody(buildApp(() => undefined), '{not json');

        expect(response).toEqual({ status: 400, body: 'Invalid request' });
    });


    it('Answers 500 without the message of an unexpected error', async () => {
        const failingRoute: RequestHandler = () => { throw new TypeError("Cannot read properties of undefined (reading 'id')"); };

        const response = await postRawBody(buildApp(failingRoute), '{}');

        expect(response).toEqual({ status: 500, body: 'Internal Server Error' });
    });


    it('Keeps the status and the message of an AppError', async () => {
        const failingRoute: RequestHandler = () => { throw new AppError('No operation deleted', 404); };

        const response = await postRawBody(buildApp(failingRoute), '{}');

        expect(response).toEqual({ status: 404, body: 'No operation deleted' });
    });
});



/*=========*/
/* HELPERS */
/*=========*/
/**
 * Builds an application with the same JSON parser and error handler as the API.
 * @param route The route answering POST /
 * @returns The application
 */
function buildApp(route: RequestHandler): Express {
    const app = express();
    app.use(express.json());
    app.post('/', route);
    app.use(errorHandler);

    return app;
}

/**
 * Sends a raw body to the application, through a real HTTP server.
 * @param app The application
 * @param rawBody The body, sent as is
 * @returns The status and the JSON body of the response
 */
async function postRawBody(app: Express, rawBody: string): Promise<{ status: number, body: unknown }> {
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const { port } = server.address() as AddressInfo;

    try {
        const response = await fetch(`http://127.0.0.1:${port}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: rawBody,
        });

        return { status: response.status, body: await response.json() };
    } finally {
        server.close();
    }
}

import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import AppConfig from '../../../../src/config/AppConfig';
import { authorizationValidator } from '../../../../src/core/middlewares/validators/auth_validator.middleware';
import { AppError } from '../../../../src/core/models/AppError.model';



/* The authentication server is replaced by a mock */
jest.mock('axios');
const axiosGetMock = axios.get as jest.Mock;

const VALID_AUTHORIZATION_HEADER = 'Bearer header.payload.signature';

const USER_FROM_AUTHENTICATION_SERVER = {
    id: 42,
    email: 'user@econoris.fr',
    pseudo: 'user',
    auth_methods_id: 1,
    is_connected: true,
    is_verified_email: true,
    last_logout_at: '2026-11-01T00:00:00.000Z',
    created_at: '2026-01-01T00:00:00.000Z',
};



/**
 * Authorization middleware tests
 */
describe('Authorization middleware tests', () => {
    it('Takes the user from the authentication server, never from the body sent by the client', async () => {
        axiosGetMock.mockResolvedValue({ status: 200, data: USER_FROM_AUTHENTICATION_SERVER });
        const request = buildRequest(VALID_AUTHORIZATION_HEADER, { user: { id: 1, email: 'victim@econoris.fr' } });
        const next = jest.fn();

        await authorizationValidator(request, {} as Response, next);

        expect(next).toHaveBeenCalledWith();
        expect(request.body.user).toEqual(USER_FROM_AUTHENTICATION_SERVER);
    });


    it('Limits the wait for the authentication server', async () => {
        axiosGetMock.mockResolvedValue({ status: 200, data: USER_FROM_AUTHENTICATION_SERVER });

        await authorizationValidator(buildRequest(VALID_AUTHORIZATION_HEADER), {} as Response, jest.fn());

        expect(axiosGetMock).toHaveBeenCalledWith(
            `${AppConfig.auth_app_url}/users`,
            expect.objectContaining({ timeout: AppConfig.auth_request_timeout }),
        );
    });


    it('Refuses a request without a valid Authorization header, without calling the authentication server', async () => {
        const next = jest.fn();

        await authorizationValidator(buildRequest('Bearer not-a-token'), {} as Response, next);

        expect(getForwardedError(next).httpStatus).toBe(401);
        expect(axiosGetMock).not.toHaveBeenCalled();
    });


    it('Refuses a token that the authentication server refuses', async () => {
        axiosGetMock.mockRejectedValue({ response: { status: 401 } });
        const next = jest.fn();

        await authorizationValidator(buildRequest(VALID_AUTHORIZATION_HEADER), {} as Response, next);

        expect(getForwardedError(next).httpStatus).toBe(401);
    });


    it('Answers 503 when the authentication server does not answer in time', async () => {
        axiosGetMock.mockRejectedValue(Object.assign(new Error('timeout of 5000ms exceeded'), { code: 'ECONNABORTED' }));
        const next = jest.fn();

        await authorizationValidator(buildRequest(VALID_AUTHORIZATION_HEADER), {} as Response, next);

        expect(getForwardedError(next).httpStatus).toBe(503);
    });
});



/*=========*/
/* HELPERS */
/*=========*/
/**
 * Builds a request with the given Authorization header and body.
 * @param authorization The Authorization header
 * @param body The body sent by the client
 * @returns The request
 */
function buildRequest(authorization: string, body: object = {}): Request {
    return { headers: { authorization }, body } as unknown as Request;
}

/**
 * Gets the error given to the next middleware.
 * @param next The mocked next function
 * @returns The error
 */
function getForwardedError(next: jest.Mock<ReturnType<NextFunction>>): AppError {
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);

    return error;
}

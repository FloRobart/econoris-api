import { Request, Response, NextFunction } from "express";
import { AppError } from "../../models/AppError.model";
import { AuthorizationHeaderSchema, UserSafeSchema } from "../../../modules/auth/auth.schema";
import { UserSafe } from "../../../modules/auth/auth.types";
import AppConfig from "../../../config/AppConfig";
import axios from "axios";
import { ZodError } from "zod";



/**
 * Middleware that validates the 'Authorization' header, then adds the user it belongs to in req.body.user.
 * The user always comes from the authentication server: a user sent in the body by the client is replaced.
 * @throws AppError with status 401 if the header is invalid.
 */
export const authorizationValidator = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const authHeader = AuthorizationHeaderSchema.parse(req.headers.authorization);
        const token = authHeader.split(" ")[1];

        const user: UserSafe = await getUserFromAPI(token);
        req.body = { ...req.body, user };
        next();
    } catch (error) {
        next(error instanceof AppError ? error : new AppError("Invalid Authorization header", 401));
    }
};

/**
 * Gets the user from the authentication server.
 * @param token The authentication token
 * @returns The user the token belongs to
 * @throws AppError if the authentication server refuses the token, does not answer in time or answers invalid data
 */
async function getUserFromAPI(token: string): Promise<UserSafe> {
    try {
        const response = await axios.get(AppConfig.auth_app_url + "/users", {
            headers: { Authorization: `Bearer ${token}` },
            timeout: AppConfig.auth_request_timeout,
        });

        if (response.status !== 200) {
            throw new AppError("Invalid user token", response.status);
        }
        return UserSafeSchema.parse(response.data);
    } catch (error: any) {
        if (error instanceof AppError) throw error;
        if (error instanceof ZodError) { throw new AppError("Invalid user data format", 500); }

        /* No answer at all: the authentication server is down or slower than the timeout */
        if (!error?.response) { throw new AppError("Authentication service unavailable", 503); }

        throw new AppError("Error retrieving user information", error.response.status);
    }
}

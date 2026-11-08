import rateLimit from "express-rate-limit";
import ms from "ms";
import AppConfig from "../../config/AppConfig";



/* A new subscription generates up to 1000 operations at once (see insertMissingOperations):
   without this limit, a single account could fill the database in a few requests */
const SUBSCRIPTION_CREATIONS_PER_HOUR = 60;



/**
 * Rate limiter middleware to limit the number of requests from a single IP address.
 * This helps prevent abuse and ensures fair usage of the API.
 *
 * @module middlewares/limiter
 */
export const limiter = rateLimit({
    windowMs: AppConfig.request_limit_time,
    limit: Math.round(AppConfig.request_limit_per_second * (AppConfig.request_limit_time/1000)), // Limit each IP to the specified number of requests

    // Return JSON response for 429 so clients (like the swagger UI) can handle it cleanly
    handler: (_req, res) => {
        res.status(429).json({ error: "Too many requests, please try again later." });
    },
    // Enable standard rate limit headers and disable legacy ones
    standardHeaders: true,
    legacyHeaders: false,
});


/**
 * Rate limiter of the creation of subscriptions, counted per user rather than per IP address.
 * Must come after the authorization middleware, which adds the user to the request.
 */
export const subscriptionCreationLimiter = rateLimit({
    windowMs: ms("1h"),
    limit: SUBSCRIPTION_CREATIONS_PER_HOUR,
    keyGenerator: (req) => String(req.body.user.id),

    handler: (_req, res) => {
        res.status(429).json({ error: "Too many subscriptions created, please try again later." });
    },
    standardHeaders: true,
    legacyHeaders: false,
});

import { HelmetOptions } from "helmet";
import AppConfig from "../../config/AppConfig";



/**
 * Helmet HTTP headers configuration
 */
export const helmetOptions: HelmetOptions = {
    /* Content Security Policy: disabled in dev to avoid breaking Swagger UI */
    contentSecurityPolicy: AppConfig.app_env.includes('dev') ? false : {
        directives: {
            defaultSrc: ["'none'"],
            scriptSrc: ["'none'"],
            styleSrc: ["'none'"],
            imgSrc: ["'self'"],
            connectSrc: ["'none'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'none'"],
            formAction: ["'none'"],
            blockAllMixedContent: [],
        },
    },

    /* Cross-origin policies */
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,

    /* HSTS (only in production) */
    hsts: AppConfig.app_env.includes('prod') ? { maxAge: 63072000, includeSubDomains: true, preload: true } : false,

    /* Frameguard (clickjacking protection) */
    frameguard: { action: 'deny' },

    /* Prevent MIME sniffing */
    noSniff: true,

    /* Referrer policy */
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

    /* DNS prefetch control */
    dnsPrefetchControl: { allow: false },

    /* IE download options */
    ieNoOpen: true,

    /* Cross-Origin-Opener-Policy (enable in prod) */
    crossOriginOpenerPolicy: AppConfig.app_env.includes('prod') ? { policy: 'same-origin' } : false,

    /* Origin-Agent-Cluster */
    originAgentCluster: true,

    /* Hide powered by (Helmet removes X-Powered-By by default) */
    hidePoweredBy: true,
};
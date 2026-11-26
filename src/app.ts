import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from './core/middlewares/error.middleware';
import * as logger from './core/utils/logger';
import fs from 'node:fs';
import AppConfig from './config/AppConfig';
import { limiter } from './core/middlewares/rate_limiter.middleware';
import cors from 'cors';
import { defaultRouteHandler } from './core/middlewares/default_route.middleware';
import path from 'node:path';
import helmet from 'helmet';
import { helmetOptions } from './core/middlewares/helmet_http_headers.middleware';
import operationsRoutes from './modules/operations/operations.routes';
import { authorizationValidator } from './core/middlewares/validators/auth_validator.middleware';
import loansRoutes from './modules/loans/loans.routes';
import subscriptionsRoutes from './modules/subscriptions/subscriptions.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import morgan from 'morgan';



const app = express();



/* Cross Origin Resource Sharing (CORS) */
app.use(cors(AppConfig.corsOptions));

/* Security headers (Helmet) */
app.use(helmet(helmetOptions));

/* Trust proxy in production */
if (AppConfig.app_env.includes('prod')) {
    app.set('trust proxy', 1);
}

/* Rate Limiter */
app.use(limiter);

/* Body parser */
app.use(express.json());

/* Health Check */
app.get('/', (_req, res) => { res.status(200).send('HEALTH CHECK') });

/* Favicon */
app.get("/favicon.ico", (_req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "icons", "favicon.ico"));
});

/* Static public files */
app.use(express.static(path.join(process.cwd(), "public")));

/* Swagger setup for API documentation in development environment */
if (AppConfig.app_env.includes('dev')) {
    const swaggerUi = require('swagger-ui-express');
    const swaggerJsDoc = require('swagger-jsdoc');
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const swaggerOptions = {
        swaggerDefinition: {
            openapi: '3.0.0',
            info: {
                title: AppConfig.app_name,
                version: packageJson.version,
                description: `${AppConfig.app_name} documentation`,
            },
        },
        apis: [
            `${__dirname}/modules/**/*.ts`,
            `${__dirname}/modules/**/*.js`,
            `${__dirname}/swagger/**/*.ts`,
            `${__dirname}/swagger/**/*.js`,
        ],
    };

    const swaggerUiOptions = {
        explorer: false,
        swaggerOptions: {
            deepLinking: false,
        },
    };

    const swaggerDocs = swaggerJsDoc(swaggerOptions);
    app.use('/api-docs', morgan(AppConfig.log_format), swaggerUi.serve, swaggerUi.setup(swaggerDocs, swaggerUiOptions));
    app.get('/api-docs.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerDocs);
    });
}


/* Authentication Middleware */
app.use(authorizationValidator);


/* Logger */
morgan.token("remote-user", (req: Request) => {
    const bodyUserEmail = (req as any)?.body?.user?.email;
    const reqUserEmail = (req as any)?.user?.email;
    return bodyUserEmail || reqUserEmail || "Unknown User";
});
app.use(morgan(AppConfig.log_format));


/* Operations routes */
app.use('/operations', operationsRoutes);

/* subscriptions routes */
app.use('/subscriptions', subscriptionsRoutes);

/* work hours routes */
// app.use('/work-hours', work_hoursRoutes);

/* loans routes */
app.use('/loans', loansRoutes);

/* categories routes */
app.use('/categories', categoriesRoutes);


/* Default Route Handler (404) */
app.use(defaultRouteHandler);

/* Error Handler */
app.use(errorHandler);



export default app;

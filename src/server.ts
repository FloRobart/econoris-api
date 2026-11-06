import http from 'http';
import app from './app';
import { Database } from './core/models/Database.model';
import AppConfig from './config/AppConfig';
import * as logger from './core/utils/logger';
import cron from 'node-cron';
import { generateSubscriptionOperationsJob } from './core/cron/generate_subscription_operations.job';
import { validateOperationsJob } from './core/cron/validate_operations.job';
import { disableEndedSubscriptionsJob } from './core/cron/disabled_ended_subscriptions.job';



(async () => {
    /*========================*/
    /* Connection to Database */
    /*========================*/
    try {
        const database = new Database(AppConfig.db_uri);
        await database.connect();
        logger.success("Connected to database successfully");
    } catch (error) {
        logger.error(error);
        process.exit(1);
    }


    /*=================*/
    /* Cron Jobs Setup */
    /*=================*/
    if (AppConfig.app_env.includes('prod')) {
        cron.schedule('0 3 * * *', runNightlyJobs);
    }


    /*==================*/
    /* Écoute du server */
    /*==================*/
    const server = http.createServer(app);

    server.listen(AppConfig.app_port, AppConfig.host_name, () => {
        logger.success("Server running at PORT :", AppConfig.app_port, "!");
        logger.success("Server running at URL :", AppConfig.base_url, "!");
        logger.success("Server documentation running at URL :", AppConfig.base_url + "/api-docs", "!");
    });

    server.on("error", (error: Error) => {
        logger.error("FAILED STARTING SERVER\n");
        logger.error(error);
        process.exit(1);
    });
})();



/*===========*/
/* CRON JOBS */
/*===========*/
/**
 * Runs the nightly jobs one after the other.
 * Each job runs even if the previous one failed: they do not depend on each other.
 */
async function runNightlyJobs(): Promise<void> {
    await runJob("subscription operations generation", generateSubscriptionOperationsJob);
    await runJob("operations validation", validateOperationsJob);
    await runJob("disable ended subscriptions", disableEndedSubscriptionsJob);
}

/**
 * Runs a job and logs how it ended. A failure is only logged, so that the next jobs still run.
 * @param jobName The name of the job, for the logs
 * @param job The job to run
 */
async function runJob(jobName: string, job: () => Promise<void>): Promise<void> {
    try {
        logger.info("Starting job :", jobName);
        await job();
        logger.success("Job completed :", jobName);
    } catch (error) {
        logger.error("Job failed :", jobName, error);
    }
}
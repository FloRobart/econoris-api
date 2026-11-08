import { selectAllSubscriptionsActive } from '../../modules/subscriptions/subscriptions.service';
import { insertMissingOperations } from '../../modules/operations/operations.service';
import * as logger from '../utils/logger';



/**
 * Generate missing operations for all active subscriptions.
 * A subscription whose operations cannot be generated is logged and skipped: it must not deprive
 * the other subscriptions, of every user, of their operations.
 * @throws AppError if the active subscriptions cannot be retrieved.
 */
export async function generateSubscriptionOperationsJob(): Promise<void> {
    const subscriptions = await selectAllSubscriptionsActive();

    for (const subscription of subscriptions) {
        try {
            await insertMissingOperations(subscription);
        } catch (error) {
            logger.error(`Failed to generate the operations of the subscription ${subscription.id} :`, error);
        }
    }
}

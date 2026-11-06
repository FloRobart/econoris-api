import { selectAllSubscriptionsEnded, updateBulkSubscriptionsActive } from '../../modules/subscriptions/subscriptions.service';



/**
 * Disable all subscriptions whose end date is passed.
 * They are not checked again with the rules of an update: a subscription saved before one of
 * these rules existed must not keep the subscriptions of every user from being disabled.
 * @throws AppError if the ended subscriptions cannot be retrieved or disabled.
 */
export async function disableEndedSubscriptionsJob(): Promise<void> {
    const endedSubscriptions = await selectAllSubscriptionsEnded();
    if (endedSubscriptions.length === 0) return;

    await updateBulkSubscriptionsActive(endedSubscriptions, false);
}

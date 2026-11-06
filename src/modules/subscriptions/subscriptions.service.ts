import { Subscription, SubscriptionInsert, SubscriptionUpdate } from './subscriptions.types';
import * as SubscriptionsRepository from './subscriptions.repository';
import { SubscriptionsSchema } from './subscriptions.schema';
import { ZodError } from 'zod';
import { AppError } from '../../core/models/AppError.model';
import { insertMissingOperations } from '../operations/operations.service';



/* Each subscription generates up to 1000 operations per night (see insertMissingOperations):
   without this limit, a single account could fill the database */
const MAX_SUBSCRIPTIONS_PER_USER = 400;



/*========*/
/* SELECT */
/*========*/
/**
 * Get all subscriptions for a user.
 * @param userId The ID of the user.
 * @returns An array of Subscription objects.
 * @throws AppError if there is an issue retrieving the subscriptions.
 */
export async function selectSubscriptions(userId: number): Promise<Subscription[]> {
    try {
        const subscriptions = await SubscriptionsRepository.selectSubscriptions(userId);
        return SubscriptionsSchema.array().parse(subscriptions);
    } catch (error) {
        throw (error instanceof ZodError) ? new AppError("Failed to parse subscriptions", 500) : error;
    }
}

/**
 * Get all active and started and not yet ended subscriptions.
 * @returns Subscription[] An array of active Subscription objects.
 * @throws AppError if there is an issue retrieving the active subscriptions.
 */
export async function selectAllSubscriptionsActive(): Promise<Subscription[]> {
    try {
        const subscriptions = await SubscriptionsRepository.selectAllSubscriptionsActive();
        return SubscriptionsSchema.array().parse(subscriptions);
    } catch (error) {
        throw (error instanceof ZodError) ? new AppError("Failed to parse active subscriptions", 500) : error;
    }
}

/**
 * Get all ended subscriptions.
 * @returns Subscription[] An array of ended Subscription objects.
 * @throws AppError if there is an issue retrieving the ended subscriptions.
 */
export async function selectAllSubscriptionsEnded(): Promise<Subscription[]> {
    try {
        const subscriptions = await SubscriptionsRepository.selectAllSubscriptionsEnded();
        return SubscriptionsSchema.array().parse(subscriptions);
    } catch (error) {
        throw (error instanceof ZodError) ? new AppError("Failed to parse ended subscriptions", 500) : error;
    }
}


/*========*/
/* INSERT */
/*========*/
/**
 * Insert a new subscription for a user.
 * @param subscriptionData The subscription data to insert.
 * @returns The newly created Subscription object.
 * @throws AppError if the user already has too many subscriptions or if there is an issue inserting the subscription.
 */
export async function insertSubscriptions(subscriptionData: SubscriptionInsert): Promise<Subscription> {
    try {
        await checkSubscriptionsLimit(subscriptionData.user_id);

        const subscriptions = await SubscriptionsRepository.insertSubscriptions(subscriptionData);
        const parsedSubscriptions = SubscriptionsSchema.parse(subscriptions);
        await insertMissingOperations(parsedSubscriptions);

        return parsedSubscriptions;
    } catch (error) {
        throw (error instanceof ZodError) ? new AppError("Failed to parse subscription (subscription inserted successfully)", 500) : error;
    }
}


/*========*/
/* UPDATE */
/*========*/
/**
 * Update an existing subscription for a user.
 * @param subscriptionData The subscription data to update.
 * @returns The updated Subscription object.
 */
export async function updateSubscriptions(subscriptionData: SubscriptionUpdate): Promise<Subscription> {
    try {
        const subscriptions = await SubscriptionsRepository.updateSubscriptions(subscriptionData);
        return SubscriptionsSchema.parse(subscriptions);
    } catch (error) {
        throw (error instanceof ZodError) ? new AppError("Failed to parse subscription (subscription updated successfully)", 500) : error;
    }
}

/**
 * Update the last_generated_at field of a subscription.
 * @param subscriptionId ID of the subscription to update.
 * @param lastGeneratedAt The new last_generated_at value.
 * @throws AppError if there is an issue updating the field.
 */
export async function updateSubscriptionsLastGeneratedAt(subscriptionId: number, lastGeneratedAt: Date): Promise<void> {
    try {
        await SubscriptionsRepository.updateSubscriptionsLastGeneratedAt(subscriptionId, lastGeneratedAt);
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to update last_generated_at", 500);
    }
}

/**
 * Update the active status of several subscriptions, by chunks of 500.
 * The subscriptions come from the database: they are not checked again with the rules of an update,
 * which a subscription saved before one of these rules existed could break.
 * @param subscriptions Array of subscriptions to update.
 * @param active The new active status.
 * @throws AppError if there is an issue updating the field.
 */
export async function updateBulkSubscriptionsActive(subscriptions: Subscription[], active: boolean): Promise<void> {
    try {
        const chunkSize = 500;
        if (subscriptions.length > chunkSize) {
            const chunks: Subscription[][] = [];
            for (let i = 0; i < subscriptions.length; i += chunkSize) {
                chunks.push(subscriptions.slice(i, i + chunkSize));
            }
            await Promise.all(chunks.map((chunk: Subscription[]) => SubscriptionsRepository.updateBulkSubscriptionsActive(chunk, active)));
            return;
        }

        await SubscriptionsRepository.updateBulkSubscriptionsActive(subscriptions, active);
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to update bulk subscriptions active status", 500);
    }
}


/*========*/
/* DELETE */
/*========*/
/**
 * Delete an subscription for a user.
 * @param userId The ID of the user.
 * @param subscriptionId The ID of the subscription to delete.
 * @returns The deleted Subscription object.
 * @throws AppError if there is an issue deleting the subscription.
 */
export async function deleteSubscriptions(userId: number, subscriptionId: number): Promise<Subscription> {
    try {
        const subscriptions = await SubscriptionsRepository.deleteSubscriptions(userId, subscriptionId);
        return SubscriptionsSchema.parse(subscriptions);
    } catch (error) {
        throw (error instanceof ZodError) ? new AppError("Failed to parse subscription (subscription deleted successfully)", 500) : error;
    }
}



/*===========*/
/* UTILITIES */
/*===========*/
/**
 * Refuse a new subscription to a user who already has MAX_SUBSCRIPTIONS_PER_USER subscriptions.
 * @param userId The ID of the user.
 * @throws AppError 403 if the user has reached the limit, 400 if the user is missing.
 */
async function checkSubscriptionsLimit(userId: number | undefined): Promise<void> {
    if (!userId) throw new AppError("Missing user of the subscription", 400);

    const subscriptionsCount = await SubscriptionsRepository.countSubscriptions(userId);
    if (subscriptionsCount < MAX_SUBSCRIPTIONS_PER_USER) return;

    throw new AppError(`A user cannot have more than ${MAX_SUBSCRIPTIONS_PER_USER} subscriptions`, 403);
}

import { AppError } from "../../core/models/AppError.model";
import { Database } from "../../core/models/Database.model";
import { Subscription, SubscriptionInsert, SubscriptionUpdate } from "./subscriptions.types";



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
        let query = "SELECT * FROM subscriptions WHERE user_id = $1;";
        let values = [userId];

        const subscriptions = await Database.execute<Subscription>({ text: query, values: values });

        /* Automatic conversion of amount and costs fields to Number */
        subscriptions.forEach(sub => {
            if (typeof sub.amount === 'string') sub.amount = Number(sub.amount);
            if (typeof sub.costs === 'string') sub.costs = Number(sub.costs);
        });

        return subscriptions
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to retrieve subscriptions", 500);
    }
}

/**
 * Get all active and started and not yet ended subscriptions.
 * @returns Subscription[] An array of active Subscription objects.
 * @throws AppError if there is an issue retrieving the active subscriptions.
 */
export async function selectAllSubscriptionsActive(): Promise<Subscription[]> {
    try {
        const query = "SELECT * FROM subscriptions WHERE active = true AND start_date <= CURRENT_DATE AND (end_date IS NULL OR end_date >= CURRENT_DATE)";

        const subscriptions = await Database.execute<Subscription>({ text: query, values: [] });

        /* Automatic conversion of amount and costs fields to Number */
        subscriptions.forEach(sub => {
            if (typeof sub.amount === 'string') sub.amount = Number(sub.amount);
            if (typeof sub.costs === 'string') sub.costs = Number(sub.costs);
        });

        return subscriptions;
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to retrieve active subscriptions", 500);
    }
}

/**
 * Get all ended subscriptions.
 * @returns Subscription[] An array of ended Subscription objects.
 * @throws AppError if there is an issue retrieving the ended subscriptions.
 */
export async function selectAllSubscriptionsEnded(): Promise<Subscription[]> {
    try {
        const query = "SELECT * FROM subscriptions WHERE end_date IS NOT NULL AND end_date < CURRENT_DATE";

        const subscriptions = await Database.execute<Subscription>({ text: query, values: [] });

        /* Automatic conversion of amount and costs fields to Number */
        subscriptions.forEach(sub => {
            if (typeof sub.amount === 'string') sub.amount = Number(sub.amount);
            if (typeof sub.costs === 'string') sub.costs = Number(sub.costs);
        });

        return subscriptions;
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to retrieve ended subscriptions", 500);
    }
}

/**
 * Count the subscriptions of a user.
 * @param userId The ID of the user.
 * @returns The number of subscriptions of the user.
 * @throws AppError if there is an issue counting the subscriptions.
 */
export async function countSubscriptions(userId: number): Promise<number> {
    try {
        const query = "SELECT COUNT(*) AS subscriptions_count FROM subscriptions WHERE user_id = $1;";

        const rows = await Database.execute<{ subscriptions_count: string }>({ text: query, values: [userId] });

        /* PostgreSQL counts with a bigint, which the driver returns as a string */
        return Number(rows[0].subscriptions_count);
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to count subscriptions", 500);
    }
}


/*========*/
/* INSERT */
/*========*/
/**
 * Insert a new subscription for a user.
 * @param subscriptionData The subscription data to insert.
 * @returns The newly created Subscription object.
 * @throws AppError if there is an issue inserting the subscription.
 */
export async function insertSubscriptions(subscriptionData: SubscriptionInsert): Promise<Subscription> {
    try {
        const keys = Object.keys(subscriptionData);
        const columns = keys.join(", ");
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");

        const values = keys.map(key => (subscriptionData as any)[key]);
        const query = `INSERT INTO subscriptions (${columns}) VALUES (${placeholders}) RETURNING *;`;

        const rows = await Database.execute<Subscription>({ text: query, values: values });
        if (rows.length === 0) { throw new AppError("No subscription inserted", 500); }

        /* Automatic conversion of amount and costs fields to Number */
        const result = { ...rows[0] };
        if (typeof result.amount === 'string') result.amount = Number(result.amount);
        if (typeof result.costs === 'string') result.costs = Number(result.costs);

        return result;
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to insert subscriptions", 500);
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
        /* Extract id and user_id, prepare fields to update */
        const { id, user_id, ...fieldsToUpdate } = subscriptionData;
        const keys = Object.keys(fieldsToUpdate);

        if (!id || !user_id || keys.length === 0) {
            throw new AppError("Missing data to update", 400);
        }

        /* Build SET clause and values */
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
        const values = keys.map(key => (fieldsToUpdate as any)[key]);

        /* Append id and user_id to values for WHERE clause */
        const query = `UPDATE subscriptions SET ${setClause} WHERE id = $${values.length + 1} AND user_id = $${values.length + 2} RETURNING *;`;
        values.push(id, user_id);

        /* Execute query */
        const rows = await Database.execute<Subscription>({ text: query, values });
        if (rows.length === 0) { throw new AppError("No subscription updated", 404); }

        /* Automatic conversion of amount and costs fields to Number */
        const result = { ...rows[0] };
        if (typeof result.amount === 'string') result.amount = Number(result.amount);
        if (typeof result.costs === 'string') result.costs = Number(result.costs);

        return result;
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to update subscriptions", 500);
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
        await Database.execute<void>({
            text: `UPDATE subscriptions SET last_generated_at = $1 WHERE id = $2;`,
            values: [lastGeneratedAt.toISOString(), subscriptionId]
        });
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to update last_generated_at", 500);
    }
}

/**
 * Update the active status of several subscriptions.
 * @param subscriptions Array of subscriptions to update.
 * @param active The new active status.
 * @throws AppError if there is an issue updating the field.
 */
export async function updateBulkSubscriptionsActive(subscriptions: Subscription[], active: boolean): Promise<void> {
    try {
        const query = "UPDATE subscriptions SET active = $1 WHERE ";
        const values: any[] = [active];

        const conditions = subscriptions.map<string>((subscription, _index) => {
            values.push(subscription.id, subscription.user_id);
            return `(id = $${values.length - 1} AND user_id = $${values.length})`;
        }).join(" OR ");

        const finalQuery = query + conditions + ";";
        await Database.execute({ text: finalQuery, values });
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
        const query = `DELETE FROM subscriptions WHERE id = $1 AND user_id = $2 RETURNING *;`;
        const values = [subscriptionId, userId];

        const rows = await Database.execute<Subscription>({ text: query, values });
        if (rows.length === 0) { throw new AppError("No subscription deleted", 404); }

        /* Automatic conversion of amount and costs fields to Number */
        const result = { ...rows[0] };
        if (typeof result.amount === 'string') result.amount = Number(result.amount);
        if (typeof result.costs === 'string') result.costs = Number(result.costs);

        return result;
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to delete subscriptions", 500);
    }
}

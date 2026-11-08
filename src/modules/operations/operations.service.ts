import { Operation, OperationGeneratedInsert, OperationInsert, OperationUpdate } from './operations.types';
import * as OperationsRepository from './operations.repository';
import { OperationsGeneratedInsertSchema, OperationsSchema, OperationsUpdateSchema } from './operations.schema';
import { ZodError } from 'zod';
import { AppError } from '../../core/models/AppError.model';
import { addDays, addWeeks, addMonths, isAfter, isValid, endOfMonth, getDaysInMonth, setDate } from 'date-fns';
import { updateSubscriptionsLastGeneratedAt } from '../subscriptions/subscriptions.service';
import { Subscription } from '../subscriptions/subscriptions.types';
import { SubscriptionsSchema } from '../subscriptions/subscriptions.schema';



/* A subscription that started long ago gets its operations over several runs of the cron job,
   so that a single request can never insert an unlimited number of operations */
const MAX_OPERATIONS_GENERATED_AT_ONCE = 1000;



/*========*/
/* SELECT */
/*========*/
/**
 * Get all operations for a user.
 * @param userId The ID of the user.
 * @returns An array of Operation objects.
 * @throws AppError if there is an issue retrieving the operations.
 */
export async function selectOperations(userId: number): Promise<Operation[]> {
    try {
        const operations = await OperationsRepository.selectOperations(userId);
        return OperationsSchema.array().parse(operations);
    } catch (error) {
        throw (error instanceof ZodError) ? new AppError("Failed to parse operations", 500) : error;
    }
}

/**
 * Get all invalid operations.
 * @returns An array of Operation objects.
 * @throws AppError if there is an issue retrieving the operations.
 */
export async function selectAllOperationsInvalidate(): Promise<Operation[]> {
    try {
        const operations = await OperationsRepository.selectAllOperationsInvalidate();
        return OperationsSchema.array().parse(operations);
    } catch (error) {
        throw (error instanceof ZodError) ? new AppError("Failed to parse operations", 500) : error;
    }
}


/*========*/
/* INSERT */
/*========*/
/**
 * Insert a new operation for a user.
 * @param operationData The operation data to insert.
 * @returns The newly created Operation object.
 * @throws AppError if there is an issue inserting the operation.
 */
export async function insertOperations(operationData: OperationInsert): Promise<Operation> {
    try {
        const operations = await OperationsRepository.insertOperations(operationData);
        return OperationsSchema.parse(operations);
    } catch (error) {
        throw (error instanceof ZodError) ? new AppError("Failed to parse operation (operation inserted successfully)", 500) : error;
    }
}

/**
 * Insert multiple operations generated from subscriptions, in bulk.
 * @param operations The array of operation data to insert.
 * @throws AppError if there is an issue inserting the operations.
 */
export async function insertBulkOperations(operationsData: OperationGeneratedInsert[]): Promise<void> {
    if (operationsData.length === 0) return;

    try {
        const operations: OperationGeneratedInsert[] = OperationsGeneratedInsertSchema.array().parse(operationsData);

        const chunkSize = 500;
        if (operations.length > chunkSize) {
            const chunks: OperationGeneratedInsert[][] = [];
            for (let i = 0; i < operations.length; i += chunkSize) {
                chunks.push(operations.slice(i, i + chunkSize));
            }
            await Promise.all(chunks.map((chunk: OperationGeneratedInsert[]) => OperationsRepository.insertBulkOperations(chunk)));
            return;
        }

        await OperationsRepository.insertBulkOperations(operations);
    } catch (error) {
        throw (error instanceof ZodError) ? new AppError("Failed to parse operations bulk", 500) : error;
    }
}

/**
 * Generate missing operations for a subscription up to the end of the current month.
 * At most MAX_OPERATIONS_GENERATED_AT_ONCE operations are generated: the next runs generate the rest.
 * @param subscription The subscription object.
 * @throws AppError if there is an issue generating the operations.
 */
export async function insertMissingOperations(subscription: Subscription): Promise<void> {
    let parsedSubscription: Subscription;
    try {
        parsedSubscription = SubscriptionsSchema.parse(subscription);
    } catch (error) {
        throw new AppError("Failed to parse subscription", 500);
    }

    try {
        const now: Date = new Date();
        const levyDates: Date[] = getMissingLevyDates(parsedSubscription, now);
        if (levyDates.length === 0) return;

        const operationsToInsert = levyDates.map((levyDate) => buildSubscriptionOperation(parsedSubscription, levyDate, now));
        await insertBulkOperations(operationsToInsert);
        await updateSubscriptionsLastGeneratedAt(parsedSubscription.id, levyDates[levyDates.length - 1]);
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to generate missing operations", 500);
    }
}


/*========*/
/* UPDATE */
/*========*/
/**
 * Update an existing operation for a user.
 * @param operationData The operation data to update.
 * @returns The updated Operation object.
 */
export async function updateOperations(operationData: OperationUpdate): Promise<Operation> {
    try {
        const operations = await OperationsRepository.updateOperations(operationData);
        return OperationsSchema.parse(operations);
    } catch (error) {
        throw (error instanceof ZodError) ? new AppError("Failed to parse operation (operation updated successfully)", 500) : error;
    }
}

/**
 * Update multiple operations validate status in bulk.
 * @param operations The array of operation data to update.
 * @param isValidate The validate status to set.
 * @throws AppError if there is an issue updating the operations.
 */
export async function updateBulkOperationsValidate(operations: OperationUpdate[], isValidate: boolean): Promise<void> {
    try {
        const parsedOperations = OperationsUpdateSchema.array().parse(operations);

        const chunkSize = 500;
        if (parsedOperations.length > chunkSize) {
            const chunks: OperationUpdate[][] = [];
            for (let i = 0; i < parsedOperations.length; i += chunkSize) {
                chunks.push(parsedOperations.slice(i, i + chunkSize));
            }
            await Promise.all(chunks.map((chunk: OperationUpdate[]) => OperationsRepository.updateBulkOperationsValidate(chunk, isValidate)));
            return;
        }

        await OperationsRepository.updateBulkOperationsValidate(parsedOperations, isValidate);
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to update operations validate status", 500);
    }
}


/*========*/
/* DELETE */
/*========*/
/**
 * Delete an operation for a user.
 * @param userId The ID of the user.
 * @param operationId The ID of the operation to delete.
 * @returns The deleted Operation object.
 * @throws AppError if there is an issue deleting the operation.
 */
export async function deleteOperations(userId: number, operationId: number): Promise<Operation> {
    try {
        const operations = await OperationsRepository.deleteOperations(userId, operationId);
        return OperationsSchema.parse(operations);
    } catch (error) {
        throw (error instanceof ZodError) ? new AppError("Failed to parse operation (operation deleted successfully)", 500) : error;
    }
}


/*===========*/
/* UTILITIES */
/*===========*/
/**
 * List the levy dates of a subscription that have no operation yet, up to the end of the current month.
 * The first levy happens on the start date, the next ones follow the interval of the subscription.
 * @param subscription The subscription
 * @param now The current date
 * @returns The missing levy dates, in chronological order, at most MAX_OPERATIONS_GENERATED_AT_ONCE
 * @throws AppError if the interval unit is unsupported
 */
function getMissingLevyDates(subscription: Subscription, now: Date): Date[] {
    const endOfCurrentMonth: Date = endOfMonth(now);
    const levyDates: Date[] = [];

    if (!subscription.last_generated_at) levyDates.push(subscription.start_date);
    let currentDate: Date = subscription.last_generated_at ?? subscription.start_date;

    while (levyDates.length < MAX_OPERATIONS_GENERATED_AT_ONCE) {
        const nextDate = getNextDate(currentDate, subscription);

        /* An invalid date is never after another one: without this check, the loop would never end */
        if (!isValid(nextDate)) break;
        if (subscription.end_date && isAfter(nextDate, subscription.end_date)) break;
        if (isAfter(nextDate, endOfCurrentMonth)) break;

        levyDates.push(nextDate);
        currentDate = nextDate;
    }

    return levyDates;
}

/**
 * Build the operation of a subscription for one of its levy dates.
 * A levy that already happened is validated, a future one is not yet.
 * @param subscription The subscription
 * @param levyDate The levy date of the operation
 * @param now The current date
 * @returns The operation to insert
 */
function buildSubscriptionOperation(subscription: Subscription, levyDate: Date, now: Date): OperationGeneratedInsert {
    return {
        levy_date: levyDate,
        label: subscription.label,
        amount: subscription.amount,
        category: subscription.category,
        source: subscription.source,
        destination: subscription.destination,
        costs: subscription.costs,
        is_validate: levyDate <= now,
        subscription_id: subscription.id,
        user_id: subscription.user_id,
    };
}

/**
 * Get the levy date that follows the given one, according to the interval of the subscription.
 * @param current Current levy date
 * @param subscription The subscription
 * @returns The next levy date
 * @throws AppError if the interval unit is unsupported
 */
function getNextDate(current: Date, subscription: Subscription): Date {
    switch (subscription.interval_unit) {
        case 'days':
            return addDays(current, subscription.interval_value);
        case 'weeks':
            return addWeeks(current, subscription.interval_value);
        case 'months':
            return getNextMonthlyDate(current, subscription.interval_value, subscription.day_of_month);
        default:
            throw new AppError(`Unsupported interval unit : ${subscription.interval_unit}`, 400);
    }
}

/**
 * Get the next levy date of a monthly subscription, on its day of the month.
 * A shorter month uses its last day, without shifting the following levies:
 * a subscription of the 31st falls on February 28th, then on March 31st.
 * @param current Current levy date
 * @param monthsToAdd Number of months between two levies
 * @param dayOfMonth Day of the month of the levies, or null to keep the day of the current levy
 * @returns The next levy date
 */
function getNextMonthlyDate(current: Date, monthsToAdd: number, dayOfMonth: number | null): Date {
    const nextDate = addMonths(current, monthsToAdd);
    if (!dayOfMonth) return nextDate;

    return setDate(nextDate, Math.min(dayOfMonth, getDaysInMonth(nextDate)));
}
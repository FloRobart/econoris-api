import { format } from 'date-fns';
import { AppError } from '../../../src/core/models/AppError.model';
import * as OperationsRepository from '../../../src/modules/operations/operations.repository';
import { insertMissingOperations, insertOperations } from '../../../src/modules/operations/operations.service';
import { Operation, OperationGeneratedInsert, OperationInsert } from '../../../src/modules/operations/operations.types';
import { updateSubscriptionsLastGeneratedAt } from '../../../src/modules/subscriptions/subscriptions.service';
import { Subscription } from '../../../src/modules/subscriptions/subscriptions.types';
import { resolveCategory } from '../../../src/modules/categories/categories.service';



/* The database and the other services are replaced by mocks */
jest.mock('../../../src/modules/operations/operations.repository', () => ({
    insertBulkOperations: jest.fn(),
    insertOperations: jest.fn(),
}));
jest.mock('../../../src/modules/subscriptions/subscriptions.service', () => ({
    updateSubscriptionsLastGeneratedAt: jest.fn(),
}));
jest.mock('../../../src/modules/categories/categories.service', () => ({
    resolveCategory: jest.fn(),
}));

const insertBulkOperationsMock = OperationsRepository.insertBulkOperations as jest.Mock;
const insertOperationsMock = OperationsRepository.insertOperations as jest.Mock;
const updateLastGeneratedAtMock = updateSubscriptionsLastGeneratedAt as jest.Mock;
const resolveCategoryMock = resolveCategory as jest.Mock;

const CURRENT_DATE = new Date('2026-11-05T12:00:00.000Z');



/**
 * insertOperations tests: the operation gets the category found from the choice of the client.
 */
describe('insertOperations tests', () => {
    const operationSentByClient: OperationInsert = {
        user_id: 42,
        levy_date: new Date('2026-11-05'),
        label: 'Leclerc',
        amount: -80,
        category: 'Courses',
        source: null,
        destination: null,
        costs: 0,
        is_validate: true,
    };


    it('Stores the category found from the old label sent by the client', async () => {
        resolveCategoryMock.mockResolvedValue({ category_id: 49, category: 'Courses' });
        insertOperationsMock.mockResolvedValue(buildSavedOperation(operationSentByClient));

        await insertOperations(operationSentByClient);

        expect(resolveCategoryMock).toHaveBeenCalledWith(operationSentByClient);
        expect(insertOperationsMock).toHaveBeenCalledWith(expect.objectContaining({ category_id: 49, category: 'Courses' }));
    });


    it('Stores nothing when the category is refused', async () => {
        resolveCategoryMock.mockRejectedValue(new AppError("Unknown category", 400));

        await expect(insertOperations(operationSentByClient)).rejects.toHaveProperty('httpStatus', 400);
        expect(insertOperationsMock).not.toHaveBeenCalled();
    });
});



/**
 * insertMissingOperations tests
 */
describe('insertMissingOperations tests', () => {
    beforeEach(() => {
        /* Only the clock is faked: promises must keep running */
        jest.useFakeTimers({ now: CURRENT_DATE, doNotFake: ['nextTick', 'queueMicrotask'] });
    });


    afterEach(() => {
        jest.useRealTimers();
    });


    it('Keeps a subscription of the 31st on the last day of the shorter months', async () => {
        await insertMissingOperations(buildSubscription({ start_date: new Date('2026-01-31'), day_of_month: 31 }));

        expect(getInsertedLevyDates()).toEqual([
            '2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31', '2026-06-30',
            '2026-07-31', '2026-08-31', '2026-09-30', '2026-10-31', '2026-11-30',
        ]);
    });


    it('Continues from the last generated operation, on the day of the subscription', async () => {
        await insertMissingOperations(buildSubscription({
            start_date: new Date('2026-01-31'),
            day_of_month: 31,
            last_generated_at: new Date('2026-09-30'),
        }));

        expect(getInsertedLevyDates()).toEqual(['2026-10-31', '2026-11-30']);
    });


    it('Validates the past operations only, and links them to the subscription, its user and its category', async () => {
        await insertMissingOperations(buildSubscription({ start_date: new Date('2026-10-10'), day_of_month: 10 }));

        const operations = getInsertedOperations();
        expect(operations.map((operation) => operation.is_validate)).toEqual([true, false]);
        expect(operations[0]).toMatchObject({ subscription_id: 1, user_id: 42, category_id: 94, category: 'Multimédia' });
    });


    it('Generates at most 1000 operations at once, and remembers where it stopped', async () => {
        await insertMissingOperations(buildSubscription({
            start_date: new Date('2000-01-01'),
            interval_unit: 'days',
            day_of_month: null,
        }));

        const levyDates = getInsertedLevyDates();
        expect(levyDates).toHaveLength(1000);
        expect(format(updateLastGeneratedAtMock.mock.calls[0][1], 'yyyy-MM-dd')).toBe(levyDates[999]);
    });


    it('Stops on a date that JavaScript cannot represent instead of looping forever', async () => {
        await insertMissingOperations(buildSubscription({
            start_date: new Date('2026-11-01'),
            interval_unit: 'days',
            interval_value: 2147483647,
            day_of_month: null,
        }));

        expect(getInsertedLevyDates()).toEqual(['2026-11-01']);
    });
});



/*=========*/
/* HELPERS */
/*=========*/
/**
 * Builds a monthly subscription of the user 42, without any generated operation yet.
 * @param overrides The fields that differ from the default subscription
 * @returns The subscription
 */
function buildSubscription(overrides: Partial<Subscription>): Subscription {
    return {
        id: 1,
        label: 'Netflix',
        amount: -13.49,
        category_id: 94,
        category: 'Multimédia',
        source: null,
        destination: null,
        costs: 0,
        active: true,

        interval_value: 1,
        interval_unit: 'months',
        start_date: new Date('2026-01-01'),
        end_date: null,
        day_of_month: 1,
        last_generated_at: null,

        user_id: 42,

        created_at: new Date('2026-01-01'),
        updated_at: new Date('2026-01-01'),

        ...overrides,
    };
}

/**
 * Builds the operation as the database returns it once inserted.
 * @param operation The operation sent to the database
 * @returns The saved operation
 */
function buildSavedOperation(operation: OperationInsert): Operation {
    return {
        ...operation,
        id: 1,
        user_id: 42,
        category_id: 49,
        category: 'Courses',
        subscription_id: null,
        created_at: new Date('2026-11-05'),
        updated_at: new Date('2026-11-05'),
    };
}

/**
 * Gets the operations sent to the database, whatever the number of chunks they were sent in.
 * @returns The inserted operations
 */
function getInsertedOperations(): OperationGeneratedInsert[] {
    return insertBulkOperationsMock.mock.calls.flatMap(([operations]) => operations);
}

/**
 * Gets the levy dates of the operations sent to the database, in the local time zone like the generation.
 * @returns The levy dates, formatted as yyyy-MM-dd
 */
function getInsertedLevyDates(): string[] {
    return getInsertedOperations().map((operation) => format(operation.levy_date, 'yyyy-MM-dd'));
}

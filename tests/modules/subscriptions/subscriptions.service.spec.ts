import { AppError } from '../../../src/core/models/AppError.model';
import * as SubscriptionsRepository from '../../../src/modules/subscriptions/subscriptions.repository';
import { insertSubscriptions } from '../../../src/modules/subscriptions/subscriptions.service';
import { Subscription, SubscriptionInsert } from '../../../src/modules/subscriptions/subscriptions.types';



/* Only the limit of subscriptions is tested: the database and the generation of the operations are replaced by mocks */
jest.mock('../../../src/modules/subscriptions/subscriptions.repository', () => ({
    countSubscriptions: jest.fn(),
    insertSubscriptions: jest.fn(),
}));
jest.mock('../../../src/modules/operations/operations.service', () => ({
    insertMissingOperations: jest.fn(),
}));

const countSubscriptionsMock = SubscriptionsRepository.countSubscriptions as jest.Mock;
const insertSubscriptionsMock = SubscriptionsRepository.insertSubscriptions as jest.Mock;

const USER_ID = 42;



/**
 * insertSubscriptions tests: a user cannot have more than 200 subscriptions.
 */
describe('insertSubscriptions tests', () => {
    it('Refuses a new subscription to a user who already has 200 subscriptions', async () => {
        countSubscriptionsMock.mockResolvedValue(200);

        const insertion = insertSubscriptions(buildSubscriptionInsert());

        await expect(insertion).rejects.toBeInstanceOf(AppError);
        await expect(insertion).rejects.toHaveProperty('httpStatus', 403);
        expect(insertSubscriptionsMock).not.toHaveBeenCalled();
    });


    it('Creates the subscription of a user below the limit', async () => {
        countSubscriptionsMock.mockResolvedValue(199);
        insertSubscriptionsMock.mockResolvedValue(buildSavedSubscription());

        await insertSubscriptions(buildSubscriptionInsert());

        expect(countSubscriptionsMock).toHaveBeenCalledWith(USER_ID);
        expect(insertSubscriptionsMock).toHaveBeenCalled();
    });
});



/*=========*/
/* HELPERS */
/*=========*/
/**
 * Builds a monthly subscription of the user USER_ID, as the controller gives it to the service.
 * @returns The subscription to insert
 */
function buildSubscriptionInsert(): SubscriptionInsert {
    return {
        user_id: USER_ID,
        label: 'Netflix',
        amount: -13.49,
        category: 'Multimédia',
        source: null,
        destination: null,
        costs: 0,
        active: true,
        interval_value: 1,
        interval_unit: 'months',
        start_date: new Date('2026-01-31'),
        end_date: null,
        day_of_month: 31,
    };
}

/**
 * Builds the subscription as the database returns it once inserted.
 * @returns The saved subscription
 */
function buildSavedSubscription(): Subscription {
    return {
        ...buildSubscriptionInsert(),
        id: 1,
        user_id: USER_ID,
        last_generated_at: null,
        created_at: new Date('2026-01-31'),
        updated_at: new Date('2026-01-31'),
    };
}

import { Database } from '../../../src/core/models/Database.model';
import { AppError } from '../../../src/core/models/AppError.model';
import * as SubscriptionsRepository from '../../../src/modules/subscriptions/subscriptions.repository';
import { SubscriptionUpdate } from '../../../src/modules/subscriptions/subscriptions.types';



const USER_ID = 42;
const SUBSCRIPTION_ID = 3;



/**
 * Subscriptions repository tests: a user only reaches its own subscriptions.
 */
describe('Subscriptions repository tests', () => {
    let executeMock: jest.SpyInstance;


    beforeEach(() => {
        executeMock = jest.spyOn(Database, 'execute').mockResolvedValue([{ id: SUBSCRIPTION_ID, user_id: USER_ID, amount: '-13.49', costs: '0.00' }]);
    });


    afterEach(() => {
        jest.restoreAllMocks();
    });


    it('Selects only the subscriptions of the user', async () => {
        await SubscriptionsRepository.selectSubscriptions(USER_ID);

        expect(executeMock).toHaveBeenCalledWith({ text: expect.stringContaining('WHERE user_id = $1'), values: [USER_ID] });
    });


    it('Updates a subscription only if it belongs to the user', async () => {
        await SubscriptionsRepository.updateSubscriptions(buildSubscriptionUpdate(USER_ID));

        const query = executeMock.mock.calls[0][0];
        expect(query.text).toContain(`WHERE id = $${query.values.length - 1} AND user_id = $${query.values.length}`);
        expect(query.values.slice(-2)).toEqual([SUBSCRIPTION_ID, USER_ID]);
    });


    it('Refuses to update a subscription without knowing its user', async () => {
        await expect(SubscriptionsRepository.updateSubscriptions(buildSubscriptionUpdate(undefined))).rejects.toBeInstanceOf(AppError);
        expect(executeMock).not.toHaveBeenCalled();
    });


    it('Deletes a subscription only if it belongs to the user', async () => {
        await SubscriptionsRepository.deleteSubscriptions(USER_ID, SUBSCRIPTION_ID);

        expect(executeMock).toHaveBeenCalledWith({ text: expect.stringContaining('WHERE id = $1 AND user_id = $2'), values: [SUBSCRIPTION_ID, USER_ID] });
    });


    it('Counts only the subscriptions of the user, as a number', async () => {
        executeMock.mockResolvedValue([{ subscriptions_count: '12' }]);

        const subscriptionsCount = await SubscriptionsRepository.countSubscriptions(USER_ID);

        expect(executeMock).toHaveBeenCalledWith({ text: expect.stringContaining('WHERE user_id = $1'), values: [USER_ID] });
        expect(subscriptionsCount).toBe(12);
    });
});



/**
 * Builds the update of the subscription SUBSCRIPTION_ID.
 * @param userId The user who updates the subscription
 * @returns The update
 */
function buildSubscriptionUpdate(userId: number | undefined): SubscriptionUpdate {
    return {
        id: SUBSCRIPTION_ID,
        user_id: userId,
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

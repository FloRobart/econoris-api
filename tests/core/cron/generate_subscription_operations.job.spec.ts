import { generateSubscriptionOperationsJob } from '../../../src/core/cron/generate_subscription_operations.job';
import { insertMissingOperations } from '../../../src/modules/operations/operations.service';
import { selectAllSubscriptionsActive } from '../../../src/modules/subscriptions/subscriptions.service';



/* Only the loop of the job is tested: the subscriptions and the generation are replaced by mocks */
jest.mock('../../../src/modules/subscriptions/subscriptions.service', () => ({
    selectAllSubscriptionsActive: jest.fn(),
}));
jest.mock('../../../src/modules/operations/operations.service', () => ({
    insertMissingOperations: jest.fn(),
}));

/* The failure is expected: its log would only clutter the output of the tests */
jest.mock('../../../src/core/utils/logger');

const selectAllSubscriptionsActiveMock = selectAllSubscriptionsActive as jest.Mock;
const insertMissingOperationsMock = insertMissingOperations as jest.Mock;



/**
 * generateSubscriptionOperationsJob tests: a subscription that fails does not stop the others.
 */
describe('generateSubscriptionOperationsJob tests', () => {
    it('Generates the operations of the next subscriptions when one of them fails', async () => {
        selectAllSubscriptionsActiveMock.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
        insertMissingOperationsMock.mockRejectedValueOnce(new Error('Blank label')).mockResolvedValue(undefined);

        await expect(generateSubscriptionOperationsJob()).resolves.toBeUndefined();

        expect(insertMissingOperationsMock).toHaveBeenCalledTimes(3);
    });
});

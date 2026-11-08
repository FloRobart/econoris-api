import { disableEndedSubscriptionsJob } from '../../../src/core/cron/disabled_ended_subscriptions.job';
import { selectAllSubscriptionsEnded, updateBulkSubscriptionsActive } from '../../../src/modules/subscriptions/subscriptions.service';



/* Only the job is tested: the subscriptions are replaced by mocks */
jest.mock('../../../src/modules/subscriptions/subscriptions.service', () => ({
    selectAllSubscriptionsEnded: jest.fn(),
    updateBulkSubscriptionsActive: jest.fn(),
}));

const selectAllSubscriptionsEndedMock = selectAllSubscriptionsEnded as jest.Mock;
const updateBulkSubscriptionsActiveMock = updateBulkSubscriptionsActive as jest.Mock;



/**
 * disableEndedSubscriptionsJob tests
 */
describe('disableEndedSubscriptionsJob tests', () => {
    it('Disables a subscription saved before the current rules, such as one with a blank label', async () => {
        const endedSubscriptions = [{ id: 4, user_id: 42, label: '   ' }];
        selectAllSubscriptionsEndedMock.mockResolvedValue(endedSubscriptions);

        await disableEndedSubscriptionsJob();

        expect(updateBulkSubscriptionsActiveMock).toHaveBeenCalledWith(endedSubscriptions, false);
    });


    it('Does nothing when no subscription has ended', async () => {
        selectAllSubscriptionsEndedMock.mockResolvedValue([]);

        await disableEndedSubscriptionsJob();

        expect(updateBulkSubscriptionsActiveMock).not.toHaveBeenCalled();
    });
});

import { Database } from '../../../src/core/models/Database.model';
import { AppError } from '../../../src/core/models/AppError.model';
import * as OperationsRepository from '../../../src/modules/operations/operations.repository';
import { OperationUpdate } from '../../../src/modules/operations/operations.types';



const USER_ID = 42;
const OPERATION_ID = 7;



/**
 * Operations repository tests: a user only reaches its own operations.
 */
describe('Operations repository tests', () => {
    let executeMock: jest.SpyInstance;


    beforeEach(() => {
        executeMock = jest.spyOn(Database, 'execute').mockResolvedValue([{ id: OPERATION_ID, user_id: USER_ID, amount: '-42.50', costs: '0.00' }]);
    });


    afterEach(() => {
        jest.restoreAllMocks();
    });


    it('Selects only the operations of the user', async () => {
        await OperationsRepository.selectOperations(USER_ID);

        expect(executeMock).toHaveBeenCalledWith({ text: expect.stringContaining('WHERE user_id = $1'), values: [USER_ID] });
    });


    it('Updates an operation only if it belongs to the user', async () => {
        await OperationsRepository.updateOperations(buildOperationUpdate(USER_ID));

        const query = executeMock.mock.calls[0][0];
        expect(query.text).toContain(`WHERE id = $${query.values.length - 1} AND user_id = $${query.values.length}`);
        expect(query.values.slice(-2)).toEqual([OPERATION_ID, USER_ID]);
    });


    it('Refuses to update an operation without knowing its user', async () => {
        await expect(OperationsRepository.updateOperations(buildOperationUpdate(undefined))).rejects.toBeInstanceOf(AppError);
        expect(executeMock).not.toHaveBeenCalled();
    });


    it('Deletes an operation only if it belongs to the user', async () => {
        await OperationsRepository.deleteOperations(USER_ID, OPERATION_ID);

        expect(executeMock).toHaveBeenCalledWith({ text: expect.stringContaining('WHERE id = $1 AND user_id = $2'), values: [OPERATION_ID, USER_ID] });
    });
});



/**
 * Builds the update of the operation OPERATION_ID.
 * @param userId The user who updates the operation
 * @returns The update
 */
function buildOperationUpdate(userId: number | undefined): OperationUpdate {
    return {
        id: OPERATION_ID,
        user_id: userId,
        levy_date: new Date('2026-11-05'),
        label: 'Courses',
        amount: -42.5,
        category: 'Courses',
        source: null,
        destination: null,
        costs: 0,
        is_validate: true,
    };
}

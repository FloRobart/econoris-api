import { Database } from '../../../src/core/models/Database.model';
import { AppError } from '../../../src/core/models/AppError.model';
import * as OperationsRepository from '../../../src/modules/operations/operations.repository';
import { OperationUpdate } from '../../../src/modules/operations/operations.types';
import { ResolvedCategory } from '../../../src/modules/categories/categories.types';



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
        await OperationsRepository.selectOperations(USER_ID, {});

        expect(executeMock).toHaveBeenCalledWith({ text: expect.stringContaining('WHERE user_id = $1;'), values: [USER_ID] });
    });


    it('Selects only the operations of the period, both days included', async () => {
        await OperationsRepository.selectOperations(USER_ID, { start_date: '2026-06-01', end_date: '2026-08-31' });

        expect(executeMock).toHaveBeenCalledWith({
            text: expect.stringContaining('WHERE user_id = $1 AND levy_date >= $2 AND levy_date <= $3;'),
            values: [USER_ID, '2026-06-01', '2026-08-31'],
        });
    });


    it('Selects every upcoming operation when the period has no end', async () => {
        await OperationsRepository.selectOperations(USER_ID, { start_date: '2026-09-01' });

        expect(executeMock).toHaveBeenCalledWith({ text: expect.stringContaining('WHERE user_id = $1 AND levy_date >= $2;'), values: [USER_ID, '2026-09-01'] });
    });


    it('Numbers the end of a period without start right after the user', async () => {
        await OperationsRepository.selectOperations(USER_ID, { end_date: '2026-08-31' });

        expect(executeMock).toHaveBeenCalledWith({ text: expect.stringContaining('WHERE user_id = $1 AND levy_date <= $2;'), values: [USER_ID, '2026-08-31'] });
    });


    it('Selects the oldest levy date among the operations of the user only', async () => {
        executeMock.mockResolvedValue([{ oldest_levy_date: '2024-03-12' }]);

        await expect(OperationsRepository.selectOldestLevyDate(USER_ID)).resolves.toBe('2024-03-12');
        expect(executeMock).toHaveBeenCalledWith({ text: expect.stringContaining('WHERE user_id = $1'), values: [USER_ID] });
    });


    it('Finds no oldest levy date for a user without operation', async () => {
        executeMock.mockResolvedValue([{ oldest_levy_date: null }]);

        await expect(OperationsRepository.selectOldestLevyDate(USER_ID)).resolves.toBeNull();
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
function buildOperationUpdate(userId: number | undefined): OperationUpdate & ResolvedCategory {
    return {
        id: OPERATION_ID,
        user_id: userId,
        levy_date: new Date('2026-11-05'),
        label: 'Courses',
        amount: -42.5,
        category_id: 49,
        category: 'Courses',
        source: null,
        destination: null,
        costs: 0,
        is_validate: true,
    };
}

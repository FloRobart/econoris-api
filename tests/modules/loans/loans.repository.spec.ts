import { Database } from '../../../src/core/models/Database.model';
import { AppError } from '../../../src/core/models/AppError.model';
import * as LoansRepository from '../../../src/modules/loans/loans.repository';
import { LoanUpdate } from '../../../src/modules/loans/loans.types';



const USER_ID = 42;
const LOAN_ID = 5;



/**
 * Loans repository tests: a user only reaches its own loans.
 */
describe('Loans repository tests', () => {
    let executeMock: jest.SpyInstance;


    beforeEach(() => {
        executeMock = jest.spyOn(Database, 'execute').mockResolvedValue([{ id: LOAN_ID, user_id: USER_ID, amount: '100.00', refunded_amount: '0.00' }]);
    });


    afterEach(() => {
        jest.restoreAllMocks();
    });


    it('Selects only the loans of the user', async () => {
        await LoansRepository.selectLoans(USER_ID);

        expect(executeMock).toHaveBeenCalledWith({ text: expect.stringContaining('WHERE user_id = $1'), values: [USER_ID] });
    });


    it('Updates a loan only if it belongs to the user', async () => {
        await LoansRepository.updateLoans(buildLoanUpdate(USER_ID));

        const query = executeMock.mock.calls[0][0];
        expect(query.text).toContain(`WHERE id = $${query.values.length - 1} AND user_id = $${query.values.length}`);
        expect(query.values.slice(-2)).toEqual([LOAN_ID, USER_ID]);
    });


    it('Refuses to update a loan without knowing its user', async () => {
        await expect(LoansRepository.updateLoans(buildLoanUpdate(undefined))).rejects.toBeInstanceOf(AppError);
        expect(executeMock).not.toHaveBeenCalled();
    });


    it('Deletes a loan only if it belongs to the user', async () => {
        await LoansRepository.deleteLoans(USER_ID, LOAN_ID);

        expect(executeMock).toHaveBeenCalledWith({ text: expect.stringContaining('WHERE id = $1 AND user_id = $2'), values: [LOAN_ID, USER_ID] });
    });
});



/**
 * Builds the update of the loan LOAN_ID.
 * @param userId The user who updates the loan
 * @returns The update
 */
function buildLoanUpdate(userId: number | undefined): LoanUpdate {
    return {
        id: LOAN_ID,
        user_id: userId,
        loan_date: new Date('2026-11-05'),
        amount: 100,
        refunded_amount: 0,
        borrower: 'Alex',
        reason: 'Restaurant',
    };
}

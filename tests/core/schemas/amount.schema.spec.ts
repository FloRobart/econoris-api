import { ZodError } from 'zod';
import { AmountSchema } from '../../../src/core/schemas/amount.schema';



/**
 * Amount schema tests: an amount must fit in the NUMERIC(12, 2) columns of the database.
 */
describe('Amount schema tests', () => {
    it('Accepts the largest amounts that the database can store', () => {
        expect(AmountSchema.parse(9999999999.99)).toBe(9999999999.99);
        expect(AmountSchema.parse(-9999999999.99)).toBe(-9999999999.99);
    });


    it('Refuses a larger amount, which the database would refuse with a 500', () => {
        expect(() => AmountSchema.parse(10000000000)).toThrow(ZodError);
        expect(() => AmountSchema.parse(-10000000000)).toThrow(ZodError);
    });
});

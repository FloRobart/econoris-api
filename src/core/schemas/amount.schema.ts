import { z } from "zod";



/* Largest amount that fits in the NUMERIC(12, 2) columns of the database: beyond it, PostgreSQL
   refuses the row, and the client would get a 500 instead of a 400 */
const MAX_AMOUNT = 9_999_999_999.99;



/**
 * Schema of an amount of money, shared by every module that stores one.
 * A negative amount is an expense.
 */
export const AmountSchema = z.number().min(-MAX_AMOUNT).max(MAX_AMOUNT);

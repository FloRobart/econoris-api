import { z, ZodDate, ZodNumber } from "zod";
import { AmountSchema } from "../../core/schemas/amount.schema";



/*========*/
/* SELECT */
/*========*/
export const LoansSchema = z.object({
    id: z.int().min(1),
    loan_date: z.date().default(new Date()),
    amount: AmountSchema,
    refunded_amount: AmountSchema.min(0).default(0.0),

    borrower: z.string().trim().min(1).max(255),
    reason: z.string().trim().min(1).max(255),

    user_id: z.int().min(1),

    created_at: z.date().readonly(),
    updated_at: z.date().readonly(),
});



/*========*/
/* INSERT */
/*========*/
export const LoansInsertSchema = LoansSchema.extend({
    user_id: LoansSchema.shape.user_id.optional(),
    loan_date: z.preprocess<unknown, ZodDate>(
        (val) => typeof val === "string" ? new Date(val) : val,
        z.date(),
    ),
}).omit({
    id: true,

    created_at: true,
    updated_at: true,
});



/*========*/
/* UPDATE */
/*========*/
export const LoansIdUpdateSchema = z.object({
    id: z.preprocess<unknown, ZodNumber>(
        (val) => typeof val === "string" ? Number(val.trim()) : val,
        z.int().min(1),
    ),
});

export const LoansUpdateSchema = LoansInsertSchema.extend({
    id: LoansSchema.shape.id,
});



/*========*/
/* DELETE */
/*========*/
export const LoansIdDeleteSchema = LoansIdUpdateSchema;

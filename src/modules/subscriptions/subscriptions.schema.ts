import { z, ZodDate, ZodNumber } from "zod";
import { AmountSchema } from "../../core/schemas/amount.schema";
import { OperationsGeneratedInsertSchema } from "../operations/operations.schema";



/* With these bounds, every date computed from a subscription stays valid for JavaScript and PostgreSQL:
   an invalid date would keep the generation of its operations from ending (see insertMissingOperations) */
const MIN_SUBSCRIPTION_DATE = new Date("1950-01-01");
const MAX_SUBSCRIPTION_DATE = new Date("2100-12-31");
const MAX_INTERVAL_VALUE = 365;

/**
 * Date of a subscription, sent by the client as a string.
 */
const SubscriptionDateSchema = z.preprocess<unknown, ZodDate>(
    (val) => typeof val === "string" ? new Date(val) : val,
    z.date().min(MIN_SUBSCRIPTION_DATE).max(MAX_SUBSCRIPTION_DATE),
);

/* Refused by the database too: checked here so that the client gets a 400 instead of a 500 */
const END_DATE_BEFORE_START_DATE_ERROR = { error: "end_date must not be before start_date", path: ["end_date"] };

/**
 * Checks that a subscription does not end before it starts.
 * @param subscription The subscription to check
 * @returns true if the subscription has no end date or ends after its start date
 */
function endsAfterItStarts(subscription: { start_date: Date, end_date: Date | null }): boolean {
    return subscription.end_date === null || subscription.end_date >= subscription.start_date;
}



/*========*/
/* SELECT */
/*========*/
export const SubscriptionsSchema = z.object({
    id: z.int().min(1),
    label: z.string().min(1).max(255),
    amount: AmountSchema,
    category: z.string().min(1).max(255),
    source: z.string().max(255).nullable().default(null),
    destination: z.string().max(255).nullable().default(null),
    costs: AmountSchema.default(0.0),
    active: z.boolean().default(true),

    interval_value: z.int().min(1).default(1),
    interval_unit: z.enum(['days', 'weeks', 'months']).default('months'),
    start_date: z.date(),
    end_date: z.date().nullable().default(null),
    day_of_month: z.int().min(0).max(31).nullable().default(1),
    last_generated_at: z.date().nullable().default(null),

    user_id: z.int().min(1),

    created_at: z.date().readonly(),
    updated_at: z.date().readonly(),
});



/*========*/
/* INSERT */
/*========*/
/* Without its refinement: Zod cannot extend an object schema once it is refined */
const SubscriptionsInsertObjectSchema = SubscriptionsSchema.extend({
    user_id: SubscriptionsSchema.shape.user_id.optional(),

    /* Copied into the operations generated from the subscription: they follow the rules of these
       operations, otherwise a blank label would make their generation fail every night */
    label: OperationsGeneratedInsertSchema.shape.label,
    category: OperationsGeneratedInsertSchema.shape.category,
    source: OperationsGeneratedInsertSchema.shape.source,
    destination: OperationsGeneratedInsertSchema.shape.destination,

    interval_value: z.int().min(1).max(MAX_INTERVAL_VALUE).default(1),
    start_date: SubscriptionDateSchema,
    end_date: SubscriptionDateSchema.nullable().default(null),
}).omit({
    id: true,

    last_generated_at: true,

    created_at: true,
    updated_at: true,
});

export const SubscriptionsInsertSchema = SubscriptionsInsertObjectSchema.refine(endsAfterItStarts, END_DATE_BEFORE_START_DATE_ERROR);



/*========*/
/* UPDATE */
/*========*/
export const SubscriptionsIdUpdateSchema = z.object({
    id: z.preprocess<unknown, ZodNumber>(
        (val) => typeof val === "string" ? Number(val.trim()) : val,
        z.int().min(1),
    ),
});

export const SubscriptionsUpdateSchema = SubscriptionsInsertObjectSchema.extend({
    id: SubscriptionsSchema.shape.id,
}).refine(endsAfterItStarts, END_DATE_BEFORE_START_DATE_ERROR);



/*========*/
/* DELETE */
/*========*/
export const SubscriptionsIdDeleteSchema = SubscriptionsIdUpdateSchema;

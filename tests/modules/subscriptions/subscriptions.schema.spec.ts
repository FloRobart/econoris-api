import { ZodError } from 'zod';
import { SubscriptionsInsertSchema, SubscriptionsUpdateSchema } from '../../../src/modules/subscriptions/subscriptions.schema';



/**
 * Subscriptions schemas tests
 */
describe('Subscriptions schemas tests', () => {
    const subscriptionSentByClient = {
        label: 'Netflix',
        amount: -13.49,
        category: 'Multimédia',
        interval_value: 1,
        interval_unit: 'months',
        start_date: '2026-01-31',
    };


    /*========*/
    /* LABELS */
    /*========*/
    describe('Labels', () => {
        it('Refuses a blank label or category, which the generated operations would refuse', () => {
            expect(() => SubscriptionsInsertSchema.parse({ ...subscriptionSentByClient, label: '   ' })).toThrow(ZodError);
            expect(() => SubscriptionsInsertSchema.parse({ ...subscriptionSentByClient, category: '   ' })).toThrow(ZodError);
        });


        it('Trims the label like the label of an operation', () => {
            expect(SubscriptionsInsertSchema.parse({ ...subscriptionSentByClient, label: '  Netflix  ' }).label).toBe('Netflix');
        });


        it('Applies the same rules to an update', () => {
            expect(() => SubscriptionsUpdateSchema.parse({ ...subscriptionSentByClient, id: 1, label: '   ' })).toThrow(ZodError);
        });
    });


    /*==========*/
    /* INTERVAL */
    /*==========*/
    describe('Interval', () => {
        it('Accepts an interval of up to 365', () => {
            expect(() => SubscriptionsInsertSchema.parse({ ...subscriptionSentByClient, interval_value: 365 })).not.toThrow();
        });


        it('Refuses a larger interval, which could push the next dates out of range', () => {
            expect(() => SubscriptionsInsertSchema.parse({ ...subscriptionSentByClient, interval_value: 366 })).toThrow(ZodError);
        });
    });


    /*=======*/
    /* DATES */
    /*=======*/
    describe('Dates', () => {
        it('Refuses a start date before 1900', () => {
            expect(() => SubscriptionsInsertSchema.parse({ ...subscriptionSentByClient, start_date: '1899-12-31' })).toThrow(ZodError);
        });


        it('Refuses a start date after 2100', () => {
            expect(() => SubscriptionsInsertSchema.parse({ ...subscriptionSentByClient, start_date: '2101-01-01' })).toThrow(ZodError);
        });


        it('Accepts an end date sent as a string', () => {
            const subscription = SubscriptionsInsertSchema.parse({ ...subscriptionSentByClient, end_date: '2027-01-31' });

            expect(subscription.end_date).toEqual(new Date('2027-01-31'));
        });


        it('Sets no end date when the client sends none', () => {
            expect(SubscriptionsInsertSchema.parse(subscriptionSentByClient).end_date).toBeNull();
        });


        it('Refuses an end date before the start date', () => {
            expect(() => SubscriptionsInsertSchema.parse({ ...subscriptionSentByClient, end_date: '2025-12-31' })).toThrow(ZodError);
        });


        it('Applies the same rules to an update', () => {
            expect(() => SubscriptionsUpdateSchema.parse({ ...subscriptionSentByClient, id: 1, end_date: '2025-12-31' })).toThrow(ZodError);
            expect(() => SubscriptionsUpdateSchema.parse({ ...subscriptionSentByClient, id: 1, interval_value: 366 })).toThrow(ZodError);
        });
    });
});

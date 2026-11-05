import { AppError } from "../../core/models/AppError.model";
import { Database } from "../../core/models/Database.model";
import { Operation, OperationGeneratedInsert, OperationInsert, OperationUpdate } from "./operations.types";



/*========*/
/* SELECT */
/*========*/
/**
 * Get all operations for a user.
 * @param userId The ID of the user.
 * @returns An array of Operation objects.
 * @throws AppError if there is an issue retrieving the operations.
 */
export async function selectOperations(userId: number): Promise<Operation[]> {
    try {
        let query = "SELECT * FROM operations WHERE user_id = $1;";
        let values = [userId];

        const operations = await Database.execute<Operation>({ text: query, values: values });

        /* Automatic conversion of amount and costs fields to Number */
        operations.forEach(op => {
            if (typeof op.amount === 'string') op.amount = Number(op.amount);
            if (typeof op.costs === 'string') op.costs = Number(op.costs);
        });

        return operations
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to retrieve operations", 500);
    }
}

/**
 * Get all invalid operations.
 * @returns An array of Operation objects.
 * @throws AppError if there is an issue retrieving the operations.
 */
export async function selectAllOperationsInvalidate(): Promise<Operation[]> {
    try {
        const query = "SELECT * FROM operations WHERE is_validate = false AND levy_date <= CURRENT_DATE;";

        const operations = await Database.execute<Operation>({ text: query, values: [] });

        /* Automatic conversion of amount and costs fields to Number */
        operations.forEach(op => {
            if (typeof op.amount === 'string') op.amount = Number(op.amount);
            if (typeof op.costs === 'string') op.costs = Number(op.costs);
        });

        return operations;
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to retrieve invalid operations", 500);
    }
}


/*========*/
/* INSERT */
/*========*/
/**
 * Insert a new operation for a user.
 * @param operationData The operation data to insert.
 * @returns The newly created Operation object.
 * @throws AppError if there is an issue inserting the operation.
 */
export async function insertOperations(operationData: OperationInsert): Promise<Operation> {
    try {
        const keys = Object.keys(operationData);
        const columns = keys.join(", ");
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");

        const values = keys.map(key => (operationData as any)[key]);
        const query = `INSERT INTO operations (${columns}) VALUES (${placeholders}) RETURNING *;`;

        const rows = await Database.execute<Operation>({ text: query, values: values });
        if (rows.length === 0) { throw new AppError("No operation inserted", 500); }

        /* Automatic conversion of amount and costs fields to Number */
        const result = { ...rows[0] };
        if (typeof result.amount === 'string') result.amount = Number(result.amount);
        if (typeof result.costs === 'string') result.costs = Number(result.costs);

        return result;
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to insert operations", 500);
    }
}

/**
 * Insert multiple operations generated from subscriptions, in bulk.
 * @param operations The array of operation data to insert.
 * @returns void
 * @throws AppError if there is an issue inserting the operations.
 */
export async function insertBulkOperations(operations: OperationGeneratedInsert[]): Promise<void> {
    if (operations.length === 0) return;

    try {
        const keys = Object.keys(operations[0]);
        const columns = keys.join(", ");
        let query = `INSERT INTO operations (${columns}) VALUES `;
        const values: any[] = [];

        let valueIndex = 1;
        for (const operation of operations) {
            const placeholders = keys.map((_, i) => `$${valueIndex++}`).join(", ");
            query += `(${placeholders}), `;
            values.push(...keys.map(key => (operation as any)[key]));
        }

        query = query.slice(0, -2) + ";";
        await Database.execute({ text: query, values });
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to insert bulk operations", 500);
    }
}


/*========*/
/* UPDATE */
/*========*/
/**
 * Update an existing operation for a user.
 * @param operationData The operation data to update.
 * @returns The updated Operation object.
 */
export async function updateOperations(operationData: OperationUpdate): Promise<Operation> {
    try {
        /* Extract id and user_id, prepare fields to update */
        const { id, user_id, ...fieldsToUpdate } = operationData;
        const keys = Object.keys(fieldsToUpdate);

        if (!id || !user_id || keys.length === 0) {
            throw new AppError("Missing data to update", 400);
        }

        /* Build SET clause and values */
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
        const values = keys.map(key => (fieldsToUpdate as any)[key]);

        /* Append id and user_id to values for WHERE clause */
        const query = `UPDATE operations SET ${setClause} WHERE id = $${values.length + 1} AND user_id = $${values.length + 2} RETURNING *;`;
        values.push(id, user_id);

        /* Execute query */
        const rows = await Database.execute<Operation>({ text: query, values });
        if (rows.length === 0) { throw new AppError("No operation updated", 404); }

        /* Automatic conversion of amount and costs fields to Number */
        const result = { ...rows[0] };
        if (typeof result.amount === 'string') result.amount = Number(result.amount);
        if (typeof result.costs === 'string') result.costs = Number(result.costs);

        return result;
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to update operations", 500);
    }
}

/**
 * Update multiple operations validate status in bulk.
 * @param operations The array of operation data to update.
 * @param isValidate The validate status to set.
 * @throws AppError if there is an issue updating the operations.
 */
export async function updateBulkOperationsValidate(operations: OperationUpdate[], isValidate: boolean): Promise<void> {
    try {
        const query = "UPDATE operations SET is_validate = $1 WHERE ";
        const values: any[] = [isValidate];

        const conditions = operations.map<string>((operation, _index) => {
            values.push(operation.id, operation.user_id);
            return `(id = $${values.length - 1} AND user_id = $${values.length})`;
        }).join(" OR ");

        const finalQuery = query + conditions + ";";
        await Database.execute({ text: finalQuery, values });
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to update operations validate status", 500);
    }
}


/*========*/
/* DELETE */
/*========*/
/**
 * Delete an operation for a user.
 * @param userId The ID of the user.
 * @param operationId The ID of the operation to delete.
 * @returns The deleted Operation object.
 * @throws AppError if there is an issue deleting the operation.
 */
export async function deleteOperations(userId: number, operationId: number): Promise<Operation> {
    try {
        const query = `DELETE FROM operations WHERE id = $1 AND user_id = $2 RETURNING *;`;
        const values = [operationId, userId];

        const rows = await Database.execute<Operation>({ text: query, values });
        if (rows.length === 0) { throw new AppError("No operation deleted", 404); }

        /* Automatic conversion of amount and costs fields to Number */
        const result = { ...rows[0] };
        if (typeof result.amount === 'string') result.amount = Number(result.amount);
        if (typeof result.costs === 'string') result.costs = Number(result.costs);

        return result;
    } catch (error) {
        throw (error instanceof AppError) ? error : new AppError("Failed to delete operations", 500);
    }
}

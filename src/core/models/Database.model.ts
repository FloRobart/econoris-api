import pg from 'pg';
import * as logger from "../utils/logger";
import { AppError } from './AppError.model';



/*=========================*/
/* Abstract Database Model */
/*=========================*/
/**
 * Database schema defining the IDatabase interface and Query type.
 */
export interface IDatabase {
    connect(): Promise<void>;
    close(): Promise<void>;
}

/**
 * Query type representing a database query with text and optional values.
 */
export type Query = {
    text: string;
    values: (string | number | boolean | null)[] | undefined;
};

/**
 * Abstract Database class implementing the IDatabase interface.
 * This class provides methods to connect to, close, and execute queries on the database.
 * @abstract
 * @implements {IDatabase}
 * @method connect - Connects to the database.
 * @method close - Closes the database connection.
 * @method static execute - Executes a query on the database.
 */
export abstract class ADatabase implements IDatabase {
    protected static pool: pg.Pool | null = null;

    abstract connect(): Promise<void>;
    abstract close(): Promise<void>;

    /**
     * Executes a query on the database
     * @async
     * @param query The query to execute
     * @returns Array of rows returned by the query or an empty array if no rows are returned or an error occurs
     * @throws AppError if the database is not connected or if the query fails
     */
    static async execute<T = any>(query: Query): Promise<T[]> {
        try {
            if (!this.pool) throw new AppError('Database not connected');
            const res = await this.pool.query(query.text, query.values);
            if (res.rows === null) { throw new AppError('Database query failed'); }

            return res.rows || [];
        } catch (error) {
            throw (error instanceof AppError) ? error : new AppError("Database unknown error");
        }
    }
}



/*================*/
/* Database Model */
/*================*/
/**
 * Database class to manage PostgreSQL connections and queries.
 * A pool of connections is used: a connection broken by a restart of the database is replaced
 * by a new one at the next query, so the server never has to be restarted for it.
 * @extends ADatabase
 * @method connect - Connects to the database.
 * @method close - Closes the database connection.
 * @method static execute - Executes a query on the database.
 * @example
 * const db = new Database('postgresql://user:password@localhost:5432/mydb');
 * const rows = await Database.execute({ text: 'SELECT * FROM mytable', values: [] });
 */
export class Database extends ADatabase {
    constructor(private dburi: string) { super(); }

    /**
     * Creates the pool of connections, then checks that the database answers
     * @async
     * @example dburi = "postgresql://<user>:<password>@<host>:<port>/<db_name>"
     * @throws AppError if the database cannot be reached
     */
    async connect(): Promise<void> {
        try {
            if (Database.pool) return;
            const pool = new pg.Pool({ connectionString: this.dburi });

            /* Without this listener, an idle connection broken by the database would stop the whole server */
            pool.on('error', (error: Error) => logger.error('DATABASE ERROR :', error));

            /* The pool only connects at the first query: this one keeps the server from starting without its database */
            await pool.query('SELECT 1');
            Database.pool = pool;
        } catch (error) {
            throw new AppError('Database connection failed');
        }
    }

    /**
     * Closes every connection of the pool
     * @async
     * @throws AppError if the connections cannot be closed
     */
    async close(): Promise<void> {
        try {
            if (!Database.pool) return;
            await Database.pool.end();
            Database.pool = null;
        } catch (error) {
            throw new AppError('Database disconnection failed');
        }
    }
}

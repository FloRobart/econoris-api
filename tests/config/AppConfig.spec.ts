import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';



/**
 * AppConfig secrets tests
 */
describe('AppConfig secrets tests', () => {
    const originalEnvironment = process.env;
    let temporaryDirectory: string;


    /**
     * Writes a secret in the temporary directory.
     * @param content The content of the file
     * @returns The path of the file
     */
    function writeSecretFile(content: string): string {
        const secretFile = path.join(temporaryDirectory, 'secret');
        fs.writeFileSync(secretFile, content);

        return secretFile;
    }


    beforeEach(() => {
        process.env = { ...originalEnvironment };
        delete process.env.DB_PASSWORD_FILE;

        process.env.DB_SCHEME = 'postgresql';
        process.env.DB_USER = 'econoris';
        process.env.DB_HOST = 'econoris-database';
        process.env.DB_NAME = 'econoris';

        temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'econoris-secrets-'));
    });


    afterEach(() => {
        process.env = originalEnvironment;
        fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    });


    it('Reads the database password from the variable when no file is given', () => {
        process.env.DB_PASSWORD = 'from-variable';

        expect(loadAppConfig().db_uri).toBe('postgresql://econoris:from-variable@econoris-database:5432/econoris');
    });


    it('Prefers the file to the variable, without its line break', () => {
        process.env.DB_PASSWORD = 'from-variable';
        process.env.DB_PASSWORD_FILE = writeSecretFile('from-file\n');

        expect(loadAppConfig().db_uri).toBe('postgresql://econoris:from-file@econoris-database:5432/econoris');
    });


    it('Stops when the file cannot be read', () => {
        process.env.DB_PASSWORD_FILE = path.join(temporaryDirectory, 'missing');

        expect(() => loadAppConfig()).toThrow();
    });
});



/**
 * AppConfig environment tests
 */
describe('AppConfig environment tests', () => {
    const originalEnvironment = process.env;


    beforeEach(() => {
        process.env = { ...originalEnvironment };

        /* Without this mock, dotenv would read APP_ENV from the .env file of the developer */
        jest.doMock('dotenv', () => ({ config: jest.fn() }));
    });


    afterEach(() => {
        process.env = originalEnvironment;
        jest.dontMock('dotenv');
    });


    it('Uses the production behaviours when APP_ENV is not set', () => {
        delete process.env.APP_ENV;

        expect(loadAppConfig().app_env).toBe('prod');
    });


    it('Keeps the environment given by APP_ENV, in lower case', () => {
        process.env.APP_ENV = 'DEV';

        expect(loadAppConfig().app_env).toBe('dev');
    });
});



/*=========*/
/* HELPERS */
/*=========*/
/**
 * Loads a fresh copy of AppConfig, because it reads the environment when it is imported.
 */
function loadAppConfig() {
    let appConfig;

    jest.isolateModules(() => {
        appConfig = require('../../src/config/AppConfig').default;
    });

    return appConfig as any;
}

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
     * Loads a fresh copy of AppConfig, because it reads the environment when it is imported.
     */
    function loadAppConfig() {
        let appConfig;

        jest.isolateModules(() => {
            appConfig = require('../../src/config/AppConfig').default;
        });

        return appConfig as any;
    }


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
        delete process.env.MAIL_PASSWORD_FILE;
        temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'econoris-secrets-'));
    });


    afterEach(() => {
        process.env = originalEnvironment;
        fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    });


    it('Reads the secret from the variable when no file is given', () => {
        process.env.MAIL_PASSWORD = 'from-variable';

        expect(loadAppConfig().mail_password).toBe('from-variable');
    });


    it('Prefers the file to the variable, without its line break', () => {
        process.env.MAIL_PASSWORD = 'from-variable';
        process.env.MAIL_PASSWORD_FILE = writeSecretFile('from-file\n');

        expect(loadAppConfig().mail_password).toBe('from-file');
    });


    it('Puts the database password read from the file in the connection URL', () => {
        process.env.DB_SCHEME = 'postgresql';
        process.env.DB_USER = 'econoris';
        process.env.DB_HOST = 'econoris-database';
        process.env.DB_NAME = 'econoris';
        process.env.DB_PASSWORD_FILE = writeSecretFile('from-file\n');

        expect(loadAppConfig().db_uri).toBe('postgresql://econoris:from-file@econoris-database:5432/econoris');
    });


    it('Stops when the file cannot be read', () => {
        process.env.DB_PASSWORD_FILE = path.join(temporaryDirectory, 'missing');

        expect(() => loadAppConfig()).toThrow();
    });
});

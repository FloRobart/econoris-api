import AppConfig from '../../config/AppConfig';



/**
 * Builds the beginning of a log line.
 * The date is read on each call, so that every line carries the time it was written.
 * @param icon Icon of the log level
 * @returns The beginning of the log line
 */
function buildLinePrefix(icon: string): string {
    return ` [${icon}] ${AppConfig.app_name} - ${new Date().toISOString()} |`;
}


/**
 * Logs an error, unless APP_ENV contains "silent".
 * @param args elements to log
 */
export function error(...args: any[]) {
    if (!AppConfig.app_env.includes('silent')) {
        console.error(buildLinePrefix('❌'), ...args);
    }
}

/**
 * Logs a warning, unless APP_ENV contains "silent".
 * @param args elements to log
 */
export function warning(...args: any[]) {
    if (!AppConfig.app_env.includes('silent')) {
        console.warn(buildLinePrefix('⚠️'), ...args);
    }
}

/**
 * Logs a success, unless APP_ENV contains "silent".
 * @param args elements to log
 */
export function success(...args: any[]) {
    if (!AppConfig.app_env.includes('silent')) {
        console.log(buildLinePrefix('✅'), ...args);
    }
}

/**
 * Logs an information, unless APP_ENV contains "silent".
 * @param args elements to log
 */
export function info(...args: any[]) {
    if (!AppConfig.app_env.includes('silent')) {
        console.info(buildLinePrefix('❕'), ...args);
    }
}

/**
 * Logs a debug message, only when APP_ENV contains "dev" and not "silent".
 * @param args elements to log
 */
export function debug(...args: any[]) {
    if (!AppConfig.app_env.includes('silent') && AppConfig.app_env.includes('dev')) {
        console.debug(buildLinePrefix('🐛'), ...args);
    }
}

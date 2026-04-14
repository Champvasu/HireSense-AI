const LEVELS = { ERROR: 'ERROR', WARN: 'WARN', INFO: 'INFO', DEBUG: 'DEBUG' };
const CURRENT_LEVEL = process.env.NODE_ENV === 'production' ? LEVELS.INFO : LEVELS.DEBUG;
const PRIORITY = { [LEVELS.ERROR]: 0, [LEVELS.WARN]: 1, [LEVELS.INFO]: 2, [LEVELS.DEBUG]: 3 };

function shouldLog(level) {
  return PRIORITY[level] <= PRIORITY[CURRENT_LEVEL];
}

function formatLogEntry(level, message, context = {}) {
  return { timestamp: new Date().toISOString(), level, message, environment: process.env.NODE_ENV || 'development', ...context };
}

function outputLog(entry) {
  const { timestamp, level, message, ...rest } = entry;
  const contextStr = Object.keys(rest).length ? JSON.stringify(rest, null, 2) : '';
  const msg = `[${timestamp}] [${level}] ${message} ${contextStr}`;
  
  if (level === LEVELS.ERROR) console.error(msg);
  else if (level === LEVELS.WARN) console.warn(msg);
  else if (level === LEVELS.DEBUG) console.debug(msg);
  else console.log(msg);
}

export function logError(message, context = {}) {
  if (!shouldLog(LEVELS.ERROR)) return;
  outputLog(formatLogEntry(LEVELS.ERROR, message, context));
  if (process.env.NODE_ENV === 'production' && context.error) {
    // Sentry.captureException(context.error);
  }
}

export function logWarn(message, context = {}) {
  if (!shouldLog(LEVELS.WARN)) return;
  outputLog(formatLogEntry(LEVELS.WARN, message, context));
}

export function logInfo(message, context = {}) {
  if (!shouldLog(LEVELS.INFO)) return;
  outputLog(formatLogEntry(LEVELS.INFO, message, context));
}

export function logDebug(message, context = {}) {
  if (!shouldLog(LEVELS.DEBUG)) return;
  outputLog(formatLogEntry(LEVELS.DEBUG, message, context));
}

export function logApiRequest(method, path, context = {}) {
  logInfo(`API Request: ${method} ${path}`, context);
}

export function logApiResponse(method, path, status, duration, context = {}) {
  const level = status >= 500 ? LEVELS.ERROR : status >= 400 ? LEVELS.WARN : LEVELS.INFO;
  if (!shouldLog(level)) return;
  outputLog(formatLogEntry(level, `API Response: ${method} ${path} - ${status} (${duration}ms)`, { status, duration, ...context }));
}

export function logAICall(operation, success, duration, context = {}) {
  const level = success ? LEVELS.INFO : LEVELS.ERROR;
  if (!shouldLog(level)) return;
  outputLog(formatLogEntry(level, `AI Call: ${operation} - ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`, { operation, success, duration, ...context }));
}

export function logSecurityEvent(event, context = {}) {
  logError(`Security Event: ${event}`, { severity: 'HIGH', ...context });
}

export function logDatabaseOperation(operation, collection, context = {}) {
  logDebug(`DB Operation: ${operation} on ${collection}`, context);
}

export function logAuthEvent(event, userId = null, context = {}) {
  logInfo(`Auth Event: ${event}`, { userId, ...context });
}

export { LEVELS as LOG_LEVELS };

// services/logger.js
class Logger {
  constructor() {
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
    };
    this.currentLevel = __DEV__ ? this.levels.DEBUG : this.levels.INFO;
  }

  setLevel(level) {
    this.currentLevel = level;
  }

  debug(message, ...args) {
    if (this.currentLevel <= this.levels.DEBUG) {
      console.log(`🔵 [DEBUG] ${message}`, ...args);
    }
  }

  info(message, ...args) {
    if (this.currentLevel <= this.levels.INFO) {
      console.log(`🟢 [INFO] ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    if (this.currentLevel <= this.levels.WARN) {
      console.warn(`🟡 [WARN] ${message}`, ...args);
    }
  }

  error(message, ...args) {
    if (this.currentLevel <= this.levels.ERROR) {
      console.error(`🔴 [ERROR] ${message}`, ...args);
    }
  }

  logApiCall(method, url, data, response, duration) {
    this.info(`API ${method} ${url}`, {
      data,
      response,
      duration: `${duration}ms`,
    });
  }

  logNavigation(from, to, params) {
    this.debug(`Navigation: ${from} → ${to}`, params);
  }

  logAuthEvent(event, user) {
    this.info(`Auth: ${event}`, {
      userId: user?.id,
      email: user?.email,
    });
  }

  logPerformance(operation, duration) {
    if (duration > 1000) {
      this.warn(`Slow operation: ${operation} took ${duration}ms`);
    } else {
      this.debug(`Performance: ${operation} took ${duration}ms`);
    }
  }
}

const logger = new Logger();
export default logger;
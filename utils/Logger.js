/**
 * Simple logger utility
 */

const logLevels = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

const colors = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[35m', // Magenta
  RESET: '\x1b[0m',
};

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'INFO';
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `${colors[level]}[${timestamp}] [${level}]${colors.RESET} ${message} ${metaString}`;
  }

  error(message, meta = {}) {
    console.error(this.formatMessage(logLevels.ERROR, message, meta));
  }

  warn(message, meta = {}) {
    console.warn(this.formatMessage(logLevels.WARN, message, meta));
  }

  info(message, meta = {}) {
    console.log(this.formatMessage(logLevels.INFO, message, meta));
  }

  debug(message, meta = {}) {
    if (this.logLevel === 'DEBUG') {
      console.log(this.formatMessage(logLevels.DEBUG, message, meta));
    }
  }

  // Request logger middleware
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
        
        if (res.statusCode >= 500) {
          this.error(logMessage);
        } else if (res.statusCode >= 400) {
          this.warn(logMessage);
        } else {
          this.info(logMessage);
        }
      });

      next();
    };
  }
}

module.exports = new Logger();
/**
 * ═══════════════════════════════════════════════════════════════════
 * Logger.js
 * نظام تسجيل الأحداث
 * ═══════════════════════════════════════════════════════════════════
 */

class Logger {
  constructor(config = {}) {
    this.config = {
      level: config.level || 'info',  // debug, info, warn, error
      maxLogs: config.maxLogs || 1000,
      persist: config.persist !== false,
      showTimestamp: config.showTimestamp !== false,
      showLevel: config.showLevel !== false
    };

    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    this.logs = [];
    this.listeners = [];
  }

  /**
   * تسجيل debug
   */
  debug(message, ...args) {
    this._log('debug', message, args);
  }

  /**
   * تسجيل info
   */
  info(message, ...args) {
    this._log('info', message, args);
  }

  /**
   * تسجيل warn
   */
  warn(message, ...args) {
    this._log('warn', message, args);
  }

  /**
   * تسجيل error
   */
  error(message, ...args) {
    this._log('error', message, args);
  }

  /**
   * التسجيل الرئيسي
   */
  _log(level, message, args) {
    if (this.levels[level] < this.levels[this.config.level]) {
      return;
    }

    const logEntry = {
      level: level,
      message: message,
      args: args,
      timestamp: Date.now(),
      date: new Date().toISOString()
    };

    this.logs.push(logEntry);

    // الحفاظ على الحد الأقصى
    if (this.logs.length > this.config.maxLogs) {
      this.logs.shift();
    }

    // الطباعة في Console
    this._printToConsole(logEntry);

    // إشعار المستمعين
    this._notifyListeners(logEntry);

    // الحفظ
    if (this.config.persist) {
      this._persist();
    }
  }

  /**
   * الطباعة في Console
   */
  _printToConsole(entry) {
    const parts = [];

    if (this.config.showTimestamp) {
      parts.push(`[${new Date(entry.timestamp).toLocaleTimeString()}]`);
    }

    if (this.config.showLevel) {
      parts.push(`[${entry.level.toUpperCase()}]`);
    }

    parts.push(entry.message);

    const consoleMethod = entry.level === 'debug' ? 'log' :
                         entry.level === 'info' ? 'log' :
                         entry.level === 'warn' ? 'warn' :
                         'error';

    console[consoleMethod](...parts, ...entry.args);
  }

  /**
   * إضافة مستمع
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * إشعار المستمعين
   */
  _notifyListeners(entry) {
    this.listeners.forEach(callback => {
      try {
        callback(entry);
      } catch (error) {
        console.error('Error in logger listener:', error);
      }
    });
  }

  /**
   * الحفظ في LocalStorage
   */
  _persist() {
    try {
      const recentLogs = this.logs.slice(-100);  // آخر 100 سجل
      localStorage.setItem('app_logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.warn('Failed to persist logs:', error);
    }
  }

  /**
   * التحميل من LocalStorage
   */
  load() {
    try {
      const saved = localStorage.getItem('app_logs');
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load logs:', error);
    }
  }

  /**
   * الحصول على السجلات
   */
  getLogs(level = null, limit = null) {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  /**
   * مسح السجلات
   */
  clear() {
    this.logs = [];
    if (this.config.persist) {
      localStorage.removeItem('app_logs');
    }
  }

  /**
   * تصدير السجلات
   */
  export() {
    const data = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * تغيير مستوى التسجيل
   */
  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.config.level = level;
    }
  }
}

// Singleton instance
const logger = new Logger();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Logger;
  module.exports.logger = logger;
} else {
  window.Logger = Logger;
  window.logger = logger;
}
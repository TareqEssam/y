/**
 * ═══════════════════════════════════════════════════════════════════
 * CacheManager.js
 * إدارة الذاكرة المؤقتة المتقدمة
 * ═══════════════════════════════════════════════════════════════════
 * 
 * القدرات:
 * 1. LRU Cache (Least Recently Used)
 * 2. TTL (Time To Live) للعناصر
 * 3. حجم محدود ذكي
 * 4. إحصائيات الأداء
 * 5. التخزين المؤقت متعدد المستويات
 * 
 * @version 1.0.0
 * @author Committee Assistant System
 */

class CacheManager {
  constructor(config = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,              // الحد الأقصى للعناصر
      defaultTTL: config.defaultTTL || 3600000,     // ساعة واحدة
      enableMemoryCache: config.enableMemoryCache !== false,
      enablePersistentCache: config.enablePersistentCache !== false,
      autoPrune: config.autoPrune !== false,        // حذف تلقائي
      pruneInterval: config.pruneInterval || 300000  // 5 دقائق
    };

    // Memory Cache - المستوى الأول (سريع)
    this.memoryCache = new Map();
    
    // Access tracking للـ LRU
    this.accessOrder = new Map();
    
    // مؤقت التنظيف
    this.pruneTimer = null;

    // الإحصائيات
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      totalSize: 0,
      avgAccessTime: 0
    };

    // بدء التنظيف التلقائي
    if (this.config.autoPrune) {
      this._startAutoPrune();
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * الحصول على قيمة من الذاكرة المؤقتة
   * ═══════════════════════════════════════════════════════════════════
   */
  get(key) {
    const startTime = performance.now();

    try {
      // البحث في Memory Cache
      if (this.memoryCache.has(key)) {
        const entry = this.memoryCache.get(key);

        // التحقق من انتهاء الصلاحية
        if (this._isExpired(entry)) {
          this.delete(key);
          this.stats.misses++;
          return null;
        }

        // تحديث وقت الوصول للـ LRU
        this._updateAccess(key);

        // الإحصائيات
        this.stats.hits++;
        const accessTime = performance.now() - startTime;
        this._updateAccessTime(accessTime);

        return entry.value;
      }

      // لم يُعثر على القيمة
      this.stats.misses++;
      return null;

    } catch (error) {
      console.error('❌ خطأ في الحصول من Cache:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * حفظ قيمة في الذاكرة المؤقتة
   * ═══════════════════════════════════════════════════════════════════
   */
  set(key, value, ttl = null) {
    try {
      // التحقق من الحجم
      if (this.memoryCache.size >= this.config.maxSize) {
        this._evictLRU();
      }

      // إنشاء Entry
      const entry = {
        key: key,
        value: value,
        createdAt: Date.now(),
        expiresAt: Date.now() + (ttl || this.config.defaultTTL),
        accessCount: 0,
        lastAccessed: Date.now(),
        size: this._calculateSize(value)
      };

      // الحفظ
      this.memoryCache.set(key, entry);
      this._updateAccess(key);

      // الإحصائيات
      this.stats.sets++;
      this.stats.totalSize += entry.size;

      return true;

    } catch (error) {
      console.error('❌ خطأ في الحفظ في Cache:', error);
      return false;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * حذف من الذاكرة المؤقتة
   * ═══════════════════════════════════════════════════════════════════
   */
  delete(key) {
    try {
      if (this.memoryCache.has(key)) {
        const entry = this.memoryCache.get(key);
        this.stats.totalSize -= entry.size;
        
        this.memoryCache.delete(key);
        this.accessOrder.delete(key);
        
        this.stats.deletes++;
        return true;
      }
      return false;

    } catch (error) {
      console.error('❌ خطأ في الحذف من Cache:', error);
      return false;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التحقق من وجود مفتاح
   * ═══════════════════════════════════════════════════════════════════
   */
  has(key) {
    if (!this.memoryCache.has(key)) {
      return false;
    }

    const entry = this.memoryCache.get(key);
    
    // التحقق من انتهاء الصلاحية
    if (this._isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * مسح الذاكرة المؤقتة
   * ═══════════════════════════════════════════════════════════════════
   */
  clear() {
    this.memoryCache.clear();
    this.accessOrder.clear();
    
    this.stats.totalSize = 0;
    
    console.log('🗑️  تم مسح الذاكرة المؤقتة');
    return true;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * الحصول على جميع المفاتيح
   * ═══════════════════════════════════════════════════════════════════
   */
  keys() {
    return Array.from(this.memoryCache.keys());
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * الحصول على جميع القيم
   * ═══════════════════════════════════════════════════════════════════
   */
  values() {
    return Array.from(this.memoryCache.values()).map(entry => entry.value);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * الحصول على حجم الذاكرة المؤقتة
   * ═══════════════════════════════════════════════════════════════════
   */
  size() {
    return this.memoryCache.size;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * الحصول على عدة قيم دفعة واحدة
   * ═══════════════════════════════════════════════════════════════════
   */
  getMultiple(keys) {
    const results = {};
    
    keys.forEach(key => {
      const value = this.get(key);
      if (value !== null) {
        results[key] = value;
      }
    });

    return results;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * حفظ عدة قيم دفعة واحدة
   * ═══════════════════════════════════════════════════════════════════
   */
  setMultiple(entries, ttl = null) {
    let successCount = 0;

    Object.entries(entries).forEach(([key, value]) => {
      if (this.set(key, value, ttl)) {
        successCount++;
      }
    });

    return successCount;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * حذف عدة قيم دفعة واحدة
   * ═══════════════════════════════════════════════════════════════════
   */
  deleteMultiple(keys) {
    let deletedCount = 0;

    keys.forEach(key => {
      if (this.delete(key)) {
        deletedCount++;
      }
    });

    return deletedCount;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * حفظ مع callback عند انتهاء الصلاحية
   * ═══════════════════════════════════════════════════════════════════
   */
  setWithCallback(key, value, ttl, onExpire) {
    this.set(key, value, ttl);

    // جدولة الـ callback
    setTimeout(() => {
      if (this.has(key)) {
        this.delete(key);
      }
      if (onExpire) {
        onExpire(key, value);
      }
    }, ttl || this.config.defaultTTL);

    return true;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحديث TTL لمفتاح موجود
   * ═══════════════════════════════════════════════════════════════════
   */
  updateTTL(key, newTTL) {
    if (!this.memoryCache.has(key)) {
      return false;
    }

    const entry = this.memoryCache.get(key);
    entry.expiresAt = Date.now() + newTTL;
    
    return true;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * الحصول على معلومات Entry
   * ═══════════════════════════════════════════════════════════════════
   */
  getInfo(key) {
    if (!this.memoryCache.has(key)) {
      return null;
    }

    const entry = this.memoryCache.get(key);
    
    return {
      key: key,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
      lastAccessed: entry.lastAccessed,
      accessCount: entry.accessCount,
      size: entry.size,
      ttl: entry.expiresAt - Date.now(),
      isExpired: this._isExpired(entry)
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * دوال مساعدة - LRU
   * ═══════════════════════════════════════════════════════════════════
   */

  _updateAccess(key) {
    const now = Date.now();
    
    // تحديث ترتيب الوصول
    this.accessOrder.delete(key);
    this.accessOrder.set(key, now);

    // تحديث Entry
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key);
      entry.lastAccessed = now;
      entry.accessCount++;
    }
  }

  _evictLRU() {
    // إيجاد أقل عنصر استخداماً
    const lruKey = this.accessOrder.keys().next().value;
    
    if (lruKey) {
      console.log(`🗑️  إزالة LRU: ${lruKey}`);
      this.delete(lruKey);
      this.stats.evictions++;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * دوال مساعدة - TTL
   * ═══════════════════════════════════════════════════════════════════
   */

  _isExpired(entry) {
    return Date.now() > entry.expiresAt;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * حساب حجم القيمة
   * ═══════════════════════════════════════════════════════════════════
   */
  _calculateSize(value) {
    try {
      const jsonString = JSON.stringify(value);
      return jsonString.length;
    } catch {
      return 100; // حجم افتراضي
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحديث وقت الوصول المتوسط
   * ═══════════════════════════════════════════════════════════════════
   */
  _updateAccessTime(accessTime) {
    const total = this.stats.hits + this.stats.misses;
    this.stats.avgAccessTime = 
      (this.stats.avgAccessTime * (total - 1) + accessTime) / total;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التنظيف التلقائي
   * ═══════════════════════════════════════════════════════════════════
   */

  _startAutoPrune() {
    this.pruneTimer = setInterval(() => {
      this.prune();
    }, this.config.pruneInterval);
  }

  _stopAutoPrune() {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }
  }

  /**
   * تنظيف العناصر منتهية الصلاحية
   */
  prune() {
    let prunedCount = 0;
    const now = Date.now();

    this.memoryCache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        this.delete(key);
        prunedCount++;
      }
    });

    if (prunedCount > 0) {
      console.log(`🧹 تم تنظيف ${prunedCount} عنصر منتهي الصلاحية`);
    }

    return prunedCount;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * الإحصائيات
   * ═══════════════════════════════════════════════════════════════════
   */

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      currentSize: this.memoryCache.size,
      maxSize: this.config.maxSize,
      utilizationRate: `${(this.memoryCache.size / this.config.maxSize * 100).toFixed(2)}%`,
      avgAccessTimeMs: this.stats.avgAccessTime.toFixed(2)
    };
  }

  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      totalSize: this.stats.totalSize,
      avgAccessTime: 0
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * البحث في الذاكرة المؤقتة
   * ═══════════════════════════════════════════════════════════════════
   */

  findByPattern(pattern) {
    const regex = new RegExp(pattern);
    const results = [];

    this.memoryCache.forEach((entry, key) => {
      if (regex.test(key)) {
        results.push({
          key: key,
          value: entry.value,
          info: this.getInfo(key)
        });
      }
    });

    return results;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * الحصول على أكثر العناصر استخداماً
   * ═══════════════════════════════════════════════════════════════════
   */

  getMostAccessed(limit = 10) {
    const entries = Array.from(this.memoryCache.entries())
      .map(([key, entry]) => ({
        key: key,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);

    return entries;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التصدير والاستيراد
   * ═══════════════════════════════════════════════════════════════════
   */

  export() {
    const data = {
      entries: Array.from(this.memoryCache.entries()),
      accessOrder: Array.from(this.accessOrder.entries()),
      stats: this.stats,
      exportedAt: Date.now()
    };

    return JSON.stringify(data);
  }

  import(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      // استعادة العناصر
      this.memoryCache = new Map(data.entries);
      this.accessOrder = new Map(data.accessOrder);
      this.stats = data.stats;

      console.log(`✅ تم استيراد ${this.memoryCache.size} عنصر`);
      return true;

    } catch (error) {
      console.error('❌ خطأ في الاستيراد:', error);
      return false;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التنظيف النهائي
   * ═══════════════════════════════════════════════════════════════════
   */

  destroy() {
    this._stopAutoPrune();
    this.clear();
    console.log('🗑️  تم تدمير CacheManager');
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CacheManager;
}
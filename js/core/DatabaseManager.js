/**
 * ═══════════════════════════════════════════════════════════════════
 * DatabaseManager.js
 * مدير قاعدة البيانات المحلية - IndexedDB
 * ═══════════════════════════════════════════════════════════════════
 * 
 * القدرات:
 * 1. إدارة IndexedDB للتخزين المحلي
 * 2. تحميل وحفظ القواعد الثلاث
 * 3. إدارة التفاعلات والتعلم
 * 4. التخزين المؤقت الذكي
 * 5. النسخ الاحتياطي والاستعادة
 * 
 * @version 1.0.0
 * @author Committee Assistant System
 */

class DatabaseManager {
  constructor(config = {}) {
    this.config = {
      dbName: config.dbName || 'CommitteeAssistantDB',
      version: config.version || 1,
      stores: config.stores || {
        activities: 'id',
        industrial: 'id',
        decision104: 'id',
        interactions: '++id, timestamp',
        learned_patterns: 'id',
        cache: 'key, timestamp'
      }
    };

    this.db = null;
    this.initialized = false;
    this.loading = false;

    // إحصائيات
    this.stats = {
      totalRecords: 0,
      lastUpdate: null,
      cacheHits: 0,
      cacheMisses: 0,
      dbSize: 0
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التهيئة - فتح قاعدة البيانات
   * ═══════════════════════════════════════════════════════════════════
   */
  async init() {
    if (this.initialized) {
      console.log('ℹ️  قاعدة البيانات مهيأة بالفعل');
      return true;
    }

    if (this.loading) {
      console.log('⏳ التهيئة جارية...');
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.initialized) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);
      });
    }

    this.loading = true;
    console.log('🔧 تهيئة قاعدة البيانات المحلية...');

    try {
      this.db = await this._openDatabase();
      await this._validateStores();
      await this._loadStats();

      this.initialized = true;
      this.loading = false;

      console.log('✅ تم تهيئة قاعدة البيانات بنجاح');
      console.log('📊 الإحصائيات:', this.stats);

      return true;

    } catch (error) {
      console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
      this.loading = false;
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * فتح قاعدة البيانات
   * ═══════════════════════════════════════════════════════════════════
   */
  _openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        reject(new Error('فشل فتح قاعدة البيانات'));
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('🏗️  إنشاء/تحديث هيكل قاعدة البيانات...');

        // إنشاء المخازن (stores)
        Object.entries(this.config.stores).forEach(([storeName, keyPath]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { 
              keyPath: keyPath.includes('++') ? 'id' : keyPath,
              autoIncrement: keyPath.includes('++')
            });

            // إضافة فهارس
            if (storeName === 'interactions') {
              store.createIndex('timestamp', 'timestamp', { unique: false });
              store.createIndex('success', 'success', { unique: false });
            }
            if (storeName === 'cache') {
              store.createIndex('timestamp', 'timestamp', { unique: false });
            }

            console.log(`✅ تم إنشاء مخزن: ${storeName}`);
          }
        });
      };
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التحقق من المخازن
   * ═══════════════════════════════════════════════════════════════════
   */
  async _validateStores() {
    const storeNames = Object.keys(this.config.stores);
    
    for (const storeName of storeNames) {
      if (!this.db.objectStoreNames.contains(storeName)) {
        console.warn(`⚠️  مخزن ${storeName} غير موجود`);
      }
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحميل قاعدة بيانات
   * ═══════════════════════════════════════════════════════════════════
   */
  async loadDatabase(name) {
    if (!this.initialized) {
      await this.init();
    }

    console.log(`📥 تحميل قاعدة بيانات: ${name}`);

    try {
      const transaction = this.db.transaction([name], 'readonly');
      const store = transaction.objectStore(name);
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const data = request.result;
          console.log(`✅ تم تحميل ${data.length} سجل من ${name}`);
          resolve(data);
        };

        request.onerror = () => {
          console.error(`❌ خطأ في تحميل ${name}`);
          reject(request.error);
        };
      });

    } catch (error) {
      console.error(`❌ خطأ في تحميل قاعدة ${name}:`, error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * حفظ قاعدة بيانات
   * ═══════════════════════════════════════════════════════════════════
   */
  async saveDatabase(name, data) {
    if (!this.initialized) {
      await this.init();
    }

    console.log(`💾 حفظ قاعدة بيانات: ${name} (${data.length} سجل)`);

    try {
      const transaction = this.db.transaction([name], 'readwrite');
      const store = transaction.objectStore(name);

      // مسح البيانات القديمة
      await this._clearStore(store);

      // إضافة البيانات الجديدة
      for (const item of data) {
        store.add(item);
      }

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log(`✅ تم حفظ ${data.length} سجل في ${name}`);
          this.stats.totalRecords += data.length;
          this.stats.lastUpdate = new Date().toISOString();
          resolve(true);
        };

        transaction.onerror = () => {
          console.error(`❌ خطأ في حفظ ${name}`);
          reject(transaction.error);
        };
      });

    } catch (error) {
      console.error(`❌ خطأ في حفظ قاعدة ${name}:`, error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * حفظ تفاعل
   * ═══════════════════════════════════════════════════════════════════
   */
  async saveInteraction(question, answer, score) {
    if (!this.initialized) {
      await this.init();
    }

    const interaction = {
      question: question,
      answer: answer,
      score: score,
      success: score >= 0.7,
      timestamp: Date.now(),
      date: new Date().toISOString()
    };

    try {
      const transaction = this.db.transaction(['interactions'], 'readwrite');
      const store = transaction.objectStore('interactions');
      
      store.add(interaction);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          resolve(true);
        };
        transaction.onerror = () => {
          reject(transaction.error);
        };
      });

    } catch (error) {
      console.error('❌ خطأ في حفظ التفاعل:', error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * الحصول على سجل التفاعلات
   * ═══════════════════════════════════════════════════════════════════
   */
  async getInteractionHistory(limit = 50) {
    if (!this.initialized) {
      await this.init();
    }

    try {
      const transaction = this.db.transaction(['interactions'], 'readonly');
      const store = transaction.objectStore('interactions');
      const index = store.index('timestamp');
      
      const request = index.openCursor(null, 'prev');
      const results = [];

      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          
          if (cursor && results.length < limit) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      });

    } catch (error) {
      console.error('❌ خطأ في جلب سجل التفاعلات:', error);
      return [];
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحديث بيانات التعلم
   * ═══════════════════════════════════════════════════════════════════
   */
  async updateLearningData(pattern) {
    if (!this.initialized) {
      await this.init();
    }

    try {
      const transaction = this.db.transaction(['learned_patterns'], 'readwrite');
      const store = transaction.objectStore('learned_patterns');
      
      // استخدام put للتحديث أو الإضافة
      store.put({
        id: pattern.id || `pattern_${Date.now()}`,
        ...pattern,
        updatedAt: Date.now()
      });

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);
      });

    } catch (error) {
      console.error('❌ خطأ في تحديث بيانات التعلم:', error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التخزين المؤقت
   * ═══════════════════════════════════════════════════════════════════
   */

  async cacheGet(key) {
    if (!this.initialized) {
      await this.init();
    }

    try {
      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result;
          
          if (result && this._isCacheValid(result)) {
            this.stats.cacheHits++;
            resolve(result.value);
          } else {
            this.stats.cacheMisses++;
            resolve(null);
          }
        };

        request.onerror = () => {
          this.stats.cacheMisses++;
          resolve(null);
        };
      });

    } catch (error) {
      console.error('❌ خطأ في جلب من Cache:', error);
      return null;
    }
  }

  async cacheSet(key, value, ttl = 3600000) {
    if (!this.initialized) {
      await this.init();
    }

    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      store.put({
        key: key,
        value: value,
        timestamp: Date.now(),
        ttl: ttl
      });

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);
      });

    } catch (error) {
      console.error('❌ خطأ في الحفظ في Cache:', error);
      return false;
    }
  }

  _isCacheValid(cacheEntry) {
    const now = Date.now();
    const age = now - cacheEntry.timestamp;
    return age < cacheEntry.ttl;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * مسح الذاكرة المؤقتة
   * ═══════════════════════════════════════════════════════════════════
   */
  async clearCache() {
    if (!this.initialized) {
      await this.init();
    }

    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      store.clear();

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log('🗑️  تم مسح الذاكرة المؤقتة');
          resolve(true);
        };
        transaction.onerror = () => reject(transaction.error);
      });

    } catch (error) {
      console.error('❌ خطأ في مسح Cache:', error);
      return false;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تنظيف تلقائي
   * ═══════════════════════════════════════════════════════════════════
   */
  async cleanup() {
    if (!this.initialized) {
      return;
    }

    console.log('🧹 تنظيف قاعدة البيانات...');

    // تنظيف الذاكرة المؤقتة منتهية الصلاحية
    await this._cleanupExpiredCache();

    // تنظيف التفاعلات القديمة جداً (أكثر من 30 يوم)
    await this._cleanupOldInteractions(30 * 24 * 60 * 60 * 1000);

    console.log('✅ اكتمل التنظيف');
  }

  async _cleanupExpiredCache() {
    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('timestamp');
      const request = index.openCursor();

      let deletedCount = 0;

      return new Promise((resolve) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          
          if (cursor) {
            if (!this._isCacheValid(cursor.value)) {
              cursor.delete();
              deletedCount++;
            }
            cursor.continue();
          } else {
            if (deletedCount > 0) {
              console.log(`🗑️  تم حذف ${deletedCount} عنصر منتهي الصلاحية من Cache`);
            }
            resolve(deletedCount);
          }
        };

        request.onerror = () => resolve(0);
      });

    } catch (error) {
      console.error('❌ خطأ في تنظيف Cache:', error);
      return 0;
    }
  }

  async _cleanupOldInteractions(maxAge) {
    try {
      const transaction = this.db.transaction(['interactions'], 'readwrite');
      const store = transaction.objectStore('interactions');
      const index = store.index('timestamp');
      const cutoff = Date.now() - maxAge;
      const range = IDBKeyRange.upperBound(cutoff);
      const request = index.openCursor(range);

      let deletedCount = 0;

      return new Promise((resolve) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          
          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            if (deletedCount > 0) {
              console.log(`🗑️  تم حذف ${deletedCount} تفاعل قديم`);
            }
            resolve(deletedCount);
          }
        };

        request.onerror = () => resolve(0);
      });

    } catch (error) {
      console.error('❌ خطأ في تنظيف التفاعلات القديمة:', error);
      return 0;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * دوال مساعدة
   * ═══════════════════════════════════════════════════════════════════
   */

  async _clearStore(store) {
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async _loadStats() {
    try {
      // حساب عدد السجلات
      let totalRecords = 0;
      
      for (const storeName of Object.keys(this.config.stores)) {
        const count = await this._countRecords(storeName);
        totalRecords += count;
      }

      this.stats.totalRecords = totalRecords;
      
      // حساب حجم قاعدة البيانات (تقريبي)
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        this.stats.dbSize = estimate.usage || 0;
      }

    } catch (error) {
      console.error('❌ خطأ في تحميل الإحصائيات:', error);
    }
  }

  async _countRecords(storeName) {
    try {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });

    } catch (error) {
      return 0;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * النسخ الاحتياطي والاستعادة
   * ═══════════════════════════════════════════════════════════════════
   */

  async backup() {
    if (!this.initialized) {
      await this.init();
    }

    console.log('📦 إنشاء نسخة احتياطية...');

    try {
      const backup = {
        version: this.config.version,
        timestamp: Date.now(),
        date: new Date().toISOString(),
        data: {}
      };

      // تصدير جميع المخازن
      for (const storeName of Object.keys(this.config.stores)) {
        backup.data[storeName] = await this.loadDatabase(storeName);
      }

      console.log('✅ تم إنشاء النسخة الاحتياطية');
      return backup;

    } catch (error) {
      console.error('❌ خطأ في النسخ الاحتياطي:', error);
      throw error;
    }
  }

  async restore(backup) {
    if (!this.initialized) {
      await this.init();
    }

    console.log('📥 استعادة النسخة الاحتياطية...');

    try {
      // استعادة جميع المخازن
      for (const [storeName, data] of Object.entries(backup.data)) {
        if (this.db.objectStoreNames.contains(storeName)) {
          await this.saveDatabase(storeName, data);
        }
      }

      console.log('✅ تمت استعادة النسخة الاحتياطية');
      return true;

    } catch (error) {
      console.error('❌ خطأ في الاستعادة:', error);
      throw error;
    }
  }

  async exportToJSON() {
    const backup = await this.backup();
    const json = JSON.stringify(backup, null, 2);
    
    // تنزيل الملف
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('✅ تم تصدير النسخة الاحتياطية');
  }

  async importFromJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const backup = JSON.parse(e.target.result);
          await this.restore(backup);
          resolve(true);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('فشل قراءة الملف'));
      reader.readAsText(file);
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * APIs عامة
   * ═══════════════════════════════════════════════════════════════════
   */

  getStats() {
    return {
      ...this.stats,
      cacheHitRate: this.stats.cacheHits + this.stats.cacheMisses > 0
        ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(2) + '%'
        : '0%',
      dbSizeMB: (this.stats.dbSize / (1024 * 1024)).toFixed(2) + ' MB'
    };
  }

  isInitialized() {
    return this.initialized;
  }

  async reset() {
    if (!this.initialized) {
      await this.init();
    }

    console.log('⚠️  إعادة تعيين قاعدة البيانات...');

    try {
      // مسح جميع المخازن
      for (const storeName of Object.keys(this.config.stores)) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await this._clearStore(store);
      }

      // إعادة تعيين الإحصائيات
      this.stats = {
        totalRecords: 0,
        lastUpdate: null,
        cacheHits: 0,
        cacheMisses: 0,
        dbSize: 0
      };

      console.log('✅ تمت إعادة تعيين قاعدة البيانات');
      return true;

    } catch (error) {
      console.error('❌ خطأ في إعادة التعيين:', error);
      throw error;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      this.initialized = false;
      console.log('🔒 تم إغلاق قاعدة البيانات');
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DatabaseManager;
}
/**
 * ═══════════════════════════════════════════════════════════════════
 * DataLoader.js
 * محمل البيانات - تحميل مرة واحدة وفهرسة ذكية
 * ═══════════════════════════════════════════════════════════════════
 * 
 * القدرات:
 * 1. تحميل القواعد الثلاث بالتوازي
 * 2. التحقق من السلامة
 * 3. التخزين في IndexedDB
 * 4. تحديث تلقائي
 * 5. إدارة الحالة
 * 
 * @version 1.0.0
 * @author Committee Assistant System
 */

class DataLoader {
  constructor(config = {}) {
    this.config = {
      dataPaths: {
        activityVectors: config.activityVectors || '/data/vectors/activity_vectors.json',
        industrialVectors: config.industrialVectors || '/data/vectors/industrial_vectors.json',
        decision104Vectors: config.decision104Vectors || '/data/vectors/decision104_vectors.json',
        activityDatabase: config.activityDatabase || '/data/databases/activity_database.js',
        industrialDatabase: config.industrialDatabase || '/data/databases/industrial_database.js',
        decision104Database: config.decision104Database || '/data/databases/decision104_database.js'
      },
      useCache: config.useCache !== false,
      checkIntegrity: config.checkIntegrity !== false,
      retryAttempts: config.retryAttempts || 3
    };

    this.loadingState = {
      isLoading: false,
      progress: 0,
      loaded: {
        vectors: false,
        databases: false
      },
      errors: []
    };

    this.data = {
      vectors: {
        activities: null,
        industrial: null,
        decision104: null
      },
      databases: {
        activities: null,
        industrial: null,
        decision104: null
      }
    };

    this.databaseManager = null;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تهيئة مع DatabaseManager
   * ═══════════════════════════════════════════════════════════════════
   */
  async initialize(databaseManager) {
    this.databaseManager = databaseManager;
    
    if (this.databaseManager) {
      await this.databaseManager.init();
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحميل جميع البيانات
   * ═══════════════════════════════════════════════════════════════════
   */
  async loadAll(onProgress = null) {
    console.log('📥 بدء تحميل جميع البيانات...');
    this.loadingState.isLoading = true;
    this.loadingState.progress = 0;

    try {
      // 1. محاولة التحميل من IndexedDB أولاً
      if (this.config.useCache && this.databaseManager) {
        const cached = await this._loadFromCache();
        if (cached) {
          console.log('✅ تم التحميل من الذاكرة المحلية');
          this.loadingState.isLoading = false;
          this.loadingState.progress = 100;
          return this.data;
        }
      }

      // 2. التحميل من الشبكة بالتوازي
      await this._loadFromNetwork(onProgress);

      // 3. التحقق من السلامة
      if (this.config.checkIntegrity) {
        await this._validateData();
      }

      // 4. الحفظ في IndexedDB
      if (this.databaseManager) {
        await this._saveToCache();
      }

      console.log('✅ اكتمل تحميل جميع البيانات');
      this.loadingState.isLoading = false;
      this.loadingState.progress = 100;

      return this.data;

    } catch (error) {
      console.error('❌ خطأ في تحميل البيانات:', error);
      this.loadingState.errors.push(error.message);
      this.loadingState.isLoading = false;
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التحميل من الذاكرة المحلية
   * ═══════════════════════════════════════════════════════════════════
   */
  async _loadFromCache() {
    console.log('🔍 البحث في الذاكرة المحلية...');

    try {
      // تحميل المتجهات
      const activityVectors = await this.databaseManager.loadDatabase('activities');
      const industrialVectors = await this.databaseManager.loadDatabase('industrial');
      const decision104Vectors = await this.databaseManager.loadDatabase('decision104');

      // التحقق من وجود البيانات
      if (activityVectors.length === 0 || 
          industrialVectors.length === 0 || 
          decision104Vectors.length === 0) {
        console.log('ℹ️  البيانات المحلية غير مكتملة');
        return null;
      }

      // تعيين البيانات
      this.data.vectors.activities = activityVectors;
      this.data.vectors.industrial = industrialVectors;
      this.data.vectors.decision104 = decision104Vectors;

      // تحميل القواعد النصية من localStorage
      this.data.databases.activities = this._loadFromLocalStorage('masterActivityDB');
      this.data.databases.industrial = this._loadFromLocalStorage('industrialDB');
      this.data.databases.decision104 = this._loadFromLocalStorage('decision104DB');

      this.loadingState.loaded.vectors = true;
      this.loadingState.loaded.databases = true;

      return this.data;

    } catch (error) {
      console.warn('⚠️  فشل التحميل من الذاكرة:', error);
      return null;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التحميل من الشبكة
   * ═══════════════════════════════════════════════════════════════════
   */
  async _loadFromNetwork(onProgress) {
    console.log('🌐 التحميل من الشبكة...');

    // قائمة المهام
    const tasks = [
      // المتجهات
      { 
        name: 'activity_vectors', 
        loader: () => this._loadJSON(this.config.dataPaths.activityVectors),
        target: 'vectors.activities'
      },
      { 
        name: 'industrial_vectors', 
        loader: () => this._loadJSON(this.config.dataPaths.industrialVectors),
        target: 'vectors.industrial'
      },
      { 
        name: 'decision104_vectors', 
        loader: () => this._loadJSON(this.config.dataPaths.decision104Vectors),
        target: 'vectors.decision104'
      },
      
      // القواعد النصية
      { 
        name: 'activity_database', 
        loader: () => this._loadScript(this.config.dataPaths.activityDatabase, 'masterActivityDB'),
        target: 'databases.activities'
      },
      { 
        name: 'industrial_database', 
        loader: () => this._loadScript(this.config.dataPaths.industrialDatabase, 'industrialDB'),
        target: 'databases.industrial'
      },
      { 
        name: 'decision104_database', 
        loader: () => this._loadScript(this.config.dataPaths.decision104Database, 'decision104DB'),
        target: 'databases.decision104'
      }
    ];

    const totalTasks = tasks.length;
    let completed = 0;

    // تحميل بالتوازي
    await Promise.all(
      tasks.map(async (task) => {
        try {
          console.log(`📦 تحميل: ${task.name}...`);
          const data = await task.loader();
          
          // تعيين البيانات
          const [category, database] = task.target.split('.');
          this.data[category][database] = data;

          completed++;
          this.loadingState.progress = Math.floor((completed / totalTasks) * 100);

          if (onProgress) {
            onProgress(this.loadingState.progress, task.name);
          }

          console.log(`✅ تم تحميل: ${task.name}`);

        } catch (error) {
          console.error(`❌ فشل تحميل: ${task.name}`, error);
          this.loadingState.errors.push(`فشل تحميل ${task.name}: ${error.message}`);
          
          // إعادة المحاولة
          if (this.config.retryAttempts > 0) {
            console.log(`🔄 إعادة المحاولة: ${task.name}...`);
            await this._retryLoad(task);
          }
        }
      })
    );

    this.loadingState.loaded.vectors = true;
    this.loadingState.loaded.databases = true;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحميل ملف JSON
   * ═══════════════════════════════════════════════════════════════════
   */
  async _loadJSON(path) {
    const response = await fetch(path);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // استخراج المتجهات من البيانات
    if (data.vectors && Array.isArray(data.vectors)) {
      return data.vectors;
    }

    return data;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحميل ملف JavaScript
   * ═══════════════════════════════════════════════════════════════════
   */
  async _loadScript(path, variableName) {
    return new Promise((resolve, reject) => {
      // التحقق من وجود المتغير مسبقاً
      if (window[variableName]) {
        resolve(window[variableName]);
        return;
      }

      const script = document.createElement('script');
      script.src = path;
      script.async = false;

      script.onload = () => {
        if (window[variableName]) {
          resolve(window[variableName]);
        } else {
          reject(new Error(`Variable ${variableName} not found after loading script`));
        }
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${path}`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * إعادة المحاولة
   * ═══════════════════════════════════════════════════════════════════
   */
  async _retryLoad(task, attempt = 1) {
    if (attempt > this.config.retryAttempts) {
      throw new Error(`Failed after ${this.config.retryAttempts} attempts`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));

    try {
      const data = await task.loader();
      const [category, database] = task.target.split('.');
      this.data[category][database] = data;
      console.log(`✅ نجحت إعادة المحاولة: ${task.name}`);
    } catch (error) {
      console.warn(`⚠️  فشلت المحاولة ${attempt}: ${task.name}`);
      await this._retryLoad(task, attempt + 1);
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التحقق من سلامة البيانات
   * ═══════════════════════════════════════════════════════════════════
   */
  async _validateData() {
    console.log('🔍 التحقق من سلامة البيانات...');

    const validations = [];

    // التحقق من المتجهات
    Object.entries(this.data.vectors).forEach(([name, vectors]) => {
      if (!vectors || vectors.length === 0) {
        validations.push(`⚠️  متجهات ${name} فارغة`);
      } else {
        // التحقق من بنية المتجه
        const sample = vectors[0];
        if (!sample.vector || !Array.isArray(sample.vector)) {
          validations.push(`⚠️  بنية متجه ${name} غير صحيحة`);
        }
      }
    });

    // التحقق من القواعد النصية
    Object.entries(this.data.databases).forEach(([name, database]) => {
      if (!database || (Array.isArray(database) && database.length === 0)) {
        validations.push(`⚠️  قاعدة ${name} فارغة`);
      }
    });

    if (validations.length > 0) {
      console.warn('⚠️  مشاكل في البيانات:', validations);
      this.loadingState.errors.push(...validations);
    } else {
      console.log('✅ البيانات سليمة');
    }

    return validations.length === 0;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * الحفظ في الذاكرة المحلية
   * ═══════════════════════════════════════════════════════════════════
   */
  async _saveToCache() {
    console.log('💾 حفظ البيانات في الذاكرة المحلية...');

    try {
      // حفظ المتجهات في IndexedDB
      if (this.data.vectors.activities) {
        await this.databaseManager.saveDatabase('activities', this.data.vectors.activities);
      }
      if (this.data.vectors.industrial) {
        await this.databaseManager.saveDatabase('industrial', this.data.vectors.industrial);
      }
      if (this.data.vectors.decision104) {
        await this.databaseManager.saveDatabase('decision104', this.data.vectors.decision104);
      }

      // حفظ القواعد النصية في localStorage
      this._saveToLocalStorage('masterActivityDB', this.data.databases.activities);
      this._saveToLocalStorage('industrialDB', this.data.databases.industrial);
      this._saveToLocalStorage('decision104DB', this.data.databases.decision104);

      console.log('✅ تم الحفظ في الذاكرة المحلية');

    } catch (error) {
      console.error('❌ خطأ في الحفظ:', error);
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * LocalStorage helpers
   * ═══════════════════════════════════════════════════════════════════
   */

  _loadFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn(`⚠️  فشل تحميل ${key} من localStorage:`, error);
      return null;
    }
  }

  _saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn(`⚠️  فشل حفظ ${key} في localStorage:`, error);
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * APIs عامة
   * ═══════════════════════════════════════════════════════════════════
   */

  getLoadingState() {
    return { ...this.loadingState };
  }

  isLoaded() {
    return this.loadingState.loaded.vectors && this.loadingState.loaded.databases;
  }

  getData() {
    return { ...this.data };
  }

  getVectors() {
    return { ...this.data.vectors };
  }

  getDatabases() {
    return { ...this.data.databases };
  }

  async clearCache() {
    if (this.databaseManager) {
      await this.databaseManager.clearCache();
    }

    localStorage.removeItem('masterActivityDB');
    localStorage.removeItem('industrialDB');
    localStorage.removeItem('decision104DB');

    console.log('🗑️  تم مسح الذاكرة المحلية');
  }

  async reload(onProgress = null) {
    console.log('🔄 إعادة تحميل البيانات...');
    
    await this.clearCache();
    
    this.data = {
      vectors: {
        activities: null,
        industrial: null,
        decision104: null
      },
      databases: {
        activities: null,
        industrial: null,
        decision104: null
      }
    };

    this.loadingState = {
      isLoading: false,
      progress: 0,
      loaded: {
        vectors: false,
        databases: false
      },
      errors: []
    };

    return await this.loadAll(onProgress);
  }

  getStats() {
    return {
      loaded: this.isLoaded(),
      progress: this.loadingState.progress,
      errors: this.loadingState.errors.length,
      vectors: {
        activities: this.data.vectors.activities?.length || 0,
        industrial: this.data.vectors.industrial?.length || 0,
        decision104: this.data.vectors.decision104?.length || 0
      },
      databases: {
        activities: this.data.databases.activities?.length || 0,
        industrial: this.data.databases.industrial?.length || 0,
        decision104: this.data.databases.decision104?.length || 0
      }
    };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataLoader;
}
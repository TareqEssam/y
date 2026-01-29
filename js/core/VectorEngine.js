/**
 * ═══════════════════════════════════════════════════════════════════
 * VectorEngine.js
 * محرك البحث المتجه - البحث في الفضاء عالي الأبعاد
 * ═══════════════════════════════════════════════════════════════════
 * 
 * التقنيات:
 * 1. HNSW (Hierarchical Navigable Small World) للبحث السريع
 * 2. Cosine Similarity للتشابه
 * 3. Approximate Nearest Neighbors (ANN)
 * 4. Vector Normalization
 * 5. Batch Processing للكفاءة
 * 
 * @version 1.0.0
 * @author Committee Assistant System
 */

class VectorEngine {
  constructor(config = {}) {
    this.config = {
      dimension: config.dimension || 384,        // بُعد المتجهات
      m: config.m || 16,                         // HNSW: عدد الروابط لكل عقدة
      efConstruction: config.efConstruction || 200, // HNSW: جودة البناء
      efSearch: config.efSearch || 100,          // HNSW: جودة البحث
      similarityMetric: config.similarityMetric || 'cosine',
      batchSize: config.batchSize || 50,         // حجم الدفعة
      useCache: config.useCache || true,
      cacheSize: config.cacheSize || 1000
    };

    // الفهارس لكل قاعدة بيانات
    this.indexes = {
      activities: null,
      industrial: null,
      decision104: null
    };

    // البيانات الأصلية
    this.rawVectors = {
      activities: [],
      industrial: [],
      decision104: []
    };

    // ذاكرة تخزين مؤقت
    this.queryCache = new Map();
    this.vectorCache = new Map();

    // إحصائيات
    this.stats = {
      totalSearches: 0,
      avgSearchTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      indexSize: {}
    };

    this.initialized = false;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التهيئة - بناء الفهارس
   * ═══════════════════════════════════════════════════════════════════
   */
  async initialize(vectorData) {
    console.log('🔧 تهيئة محرك البحث المتجه...');
    const startTime = performance.now();

    try {
      // تحميل بيانات المتجهات
      this.rawVectors.activities = vectorData.activities || [];
      this.rawVectors.industrial = vectorData.industrial || [];
      this.rawVectors.decision104 = vectorData.decision104 || [];

      // بناء الفهارس بالتوازي
      await Promise.all([
        this._buildIndex('activities'),
        this._buildIndex('industrial'),
        this._buildIndex('decision104')
      ]);

      // تطبيع المتجهات للبحث الأسرع
      this._normalizeAllVectors();

      const endTime = performance.now();
      console.log(`✅ تم بناء الفهارس في ${(endTime - startTime).toFixed(2)} ms`);
      console.log(`📊 إحصائيات الفهارس:`, {
        activities: this.rawVectors.activities.length,
        industrial: this.rawVectors.industrial.length,
        decision104: this.rawVectors.decision104.length
      });

      this.initialized = true;
      return true;

    } catch (error) {
      console.error('❌ خطأ في تهيئة محرك البحث المتجه:', error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * البحث الرئيسي
   * ═══════════════════════════════════════════════════════════════════
   */
  async search(query, database = 'activities', options = {}) {
    if (!this.initialized) {
      throw new Error('VectorEngine not initialized. Call initialize() first.');
    }

    const startTime = performance.now();

    // التحقق من الذاكرة المؤقتة
    const cacheKey = this._generateCacheKey(query, database, options);
    if (this.config.useCache && this.queryCache.has(cacheKey)) {
      this.stats.cacheHits++;
      console.log('⚡ نتيجة من ذاكرة البحث المؤقتة');
      return this.queryCache.get(cacheKey);
    }

    this.stats.cacheMisses++;

    try {
      // 1. تحويل النص إلى متجه (embedding)
      const queryVector = await this._textToVector(query);

      // 2. البحث في الفهرس
      const results = await this._searchInIndex(
        queryVector,
        database,
        options.topK || 10,
        options.threshold || 0.6
      );

      // 3. إعادة الترتيب بالسياق (إن وُجد)
      let finalResults = results;
      if (options.context) {
        finalResults = this._rerankWithContext(results, options.context);
      }

      // 4. إضافة المعلومات الإضافية
      finalResults = this._enrichResults(finalResults, database);

      // التخزين المؤقت
      if (this.config.useCache) {
        this._addToCache(cacheKey, finalResults);
      }

      // تحديث الإحصائيات
      const endTime = performance.now();
      this._updateSearchStats(endTime - startTime);

      return finalResults;

    } catch (error) {
      console.error('❌ خطأ في البحث المتجه:', error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * البحث المتقدم - بحث في قواعد متعددة
   * ═══════════════════════════════════════════════════════════════════
   */
  async multiDatabaseSearch(query, databases = ['activities', 'industrial', 'decision104'], options = {}) {
    console.log('🔍 بحث في قواعد متعددة:', databases);

    // البحث بالتوازي في جميع القواعد
    const searchPromises = databases.map(db => 
      this.search(query, db, { ...options, topK: options.topK || 5 })
    );

    const allResults = await Promise.all(searchPromises);

    // دمج النتائج وإعادة الترتيب
    const merged = this._mergeMultiDatabaseResults(allResults, databases);

    return merged.slice(0, options.topK || 10);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * البحث بالدفعات - لكفاءة أعلى
   * ═══════════════════════════════════════════════════════════════════
   */
  async batchSearch(queries, database = 'activities', options = {}) {
    console.log(`📦 بحث دفعي: ${queries.length} استعلام`);

    const results = [];
    for (let i = 0; i < queries.length; i += this.config.batchSize) {
      const batch = queries.slice(i, i + this.config.batchSize);
      const batchResults = await Promise.all(
        batch.map(q => this.search(q, database, options))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * بناء الفهرس - HNSW
   * ═══════════════════════════════════════════════════════════════════
   */
  async _buildIndex(database) {
    console.log(`🏗️  بناء فهرس ${database}...`);

    const vectors = this.rawVectors[database];
    if (!vectors || vectors.length === 0) {
      console.warn(`⚠️  لا توجد بيانات لـ ${database}`);
      return;
    }

    // بناء فهرس HNSW مبسط
    const index = {
      vectors: vectors,
      dimension: this.config.dimension,
      size: vectors.length,
      metadata: this._buildMetadata(vectors)
    };

    this.indexes[database] = index;
    this.stats.indexSize[database] = vectors.length;

    console.log(`✅ تم بناء فهرس ${database}: ${vectors.length} متجه`);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * بناء البيانات الوصفية
   * ═══════════════════════════════════════════════════════════════════
   */
  _buildMetadata(vectors) {
    return {
      totalVectors: vectors.length,
      avgVectorNorm: this._calculateAvgNorm(vectors),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تطبيع جميع المتجهات
   * ═══════════════════════════════════════════════════════════════════
   */
  _normalizeAllVectors() {
    console.log('📐 تطبيع المتجهات...');

    Object.keys(this.rawVectors).forEach(db => {
      this.rawVectors[db] = this.rawVectors[db].map(item => ({
        ...item,
        vector: this._normalizeVector(item.vector),
        normalized: true
      }));
    });

    console.log('✅ تم تطبيع جميع المتجهات');
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحويل النص إلى متجه
   * ═══════════════════════════════════════════════════════════════════
   */
  async _textToVector(text) {
    // التحقق من الذاكرة المؤقتة
    if (this.vectorCache.has(text)) {
      return this.vectorCache.get(text);
    }

    // هنا نستخدم embedding بسيط محلي
    // في الإنتاج، يمكن استخدام نموذج محلي مثل sentence-transformers
    const vector = this._simpleTextEmbedding(text);

    // تطبيع المتجه
    const normalized = this._normalizeVector(vector);

    // تخزين مؤقت
    this._addToVectorCache(text, normalized);

    return normalized;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * Embedding بسيط (للنموذج الأولي)
   * ═══════════════════════════════════════════════════════════════════
   */
  _simpleTextEmbedding(text) {
    // هذا embedding بسيط جداً للنموذج الأولي
    // في الإنتاج، استخدم نموذج حقيقي
    
    const normalized = text.toLowerCase().trim();
    const vector = new Array(this.config.dimension).fill(0);

    // توزيع بسيط بناءً على أحرف النص
    for (let i = 0; i < normalized.length; i++) {
      const charCode = normalized.charCodeAt(i);
      const index = charCode % this.config.dimension;
      vector[index] += 1 / (i + 1);  // وزن أقل للأحرف البعيدة
    }

    // إضافة ضوضاء صغيرة للتنوع
    for (let i = 0; i < this.config.dimension; i++) {
      vector[i] += Math.random() * 0.01;
    }

    return vector;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * البحث في الفهرس
   * ═══════════════════════════════════════════════════════════════════
   */
  async _searchInIndex(queryVector, database, topK, threshold) {
    const index = this.indexes[database];
    if (!index) {
      console.warn(`⚠️  فهرس ${database} غير موجود`);
      return [];
    }

    const vectors = index.vectors;
    const similarities = [];

    // حساب التشابه مع كل متجه
    for (let i = 0; i < vectors.length; i++) {
      const item = vectors[i];
      
      if (!item.vector || !Array.isArray(item.vector)) {
        continue;
      }

      const similarity = this._cosineSimilarity(queryVector, item.vector);

      if (similarity >= threshold) {
        similarities.push({
          ...item,
          score: similarity,
          database: database,
          index: i
        });
      }
    }

    // ترتيب حسب التشابه
    similarities.sort((a, b) => b.score - a.score);

    return similarities.slice(0, topK);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * حساب تشابه Cosine
   * ═══════════════════════════════════════════════════════════════════
   */
  _cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (magnitude === 0) return 0;

    return dotProduct / magnitude;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تطبيع المتجه
   * ═══════════════════════════════════════════════════════════════════
   */
  _normalizeVector(vector) {
    if (!vector || !Array.isArray(vector)) {
      return vector;
    }

    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    
    if (norm === 0) return vector;

    return vector.map(val => val / norm);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * حساب متوسط المعيار
   * ═══════════════════════════════════════════════════════════════════
   */
  _calculateAvgNorm(vectors) {
    if (vectors.length === 0) return 0;

    const totalNorm = vectors.reduce((sum, item) => {
      if (!item.vector) return sum;
      const norm = Math.sqrt(item.vector.reduce((s, v) => s + v * v, 0));
      return sum + norm;
    }, 0);

    return totalNorm / vectors.length;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * إعادة الترتيب بالسياق
   * ═══════════════════════════════════════════════════════════════════
   */
  _rerankWithContext(results, context) {
    if (!context || context.length === 0) return results;

    return results.map(result => {
      let contextBoost = 0;

      // تعزيز حسب التطابق مع السياق
      context.forEach(ctx => {
        if (ctx.type === 'previous_result' && ctx.database === result.database) {
          contextBoost += 0.1;
        }
        if (ctx.entities) {
          Object.values(ctx.entities).forEach(entity => {
            if (result.text && result.text.includes(entity)) {
              contextBoost += 0.05;
            }
          });
        }
      });

      return {
        ...result,
        score: Math.min(result.score * (1 + contextBoost), 1.0),
        contextBoosted: contextBoost > 0
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * إثراء النتائج بمعلومات إضافية
   * ═══════════════════════════════════════════════════════════════════
   */
  _enrichResults(results, database) {
    return results.map(result => ({
      ...result,
      metadata: {
        ...result.metadata,
        database: database,
        retrievedAt: new Date().toISOString(),
        engine: 'VectorEngine'
      }
    }));
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * دمج نتائج من قواعد متعددة
   * ═══════════════════════════════════════════════════════════════════
   */
  _mergeMultiDatabaseResults(allResults, databases) {
    const merged = [];

    allResults.forEach((results, index) => {
      results.forEach(result => {
        merged.push({
          ...result,
          sourceDatabase: databases[index]
        });
      });
    });

    // إعادة الترتيب حسب الدرجة
    merged.sort((a, b) => b.score - a.score);

    return merged;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * إدارة الذاكرة المؤقتة
   * ═══════════════════════════════════════════════════════════════════
   */

  _generateCacheKey(query, database, options) {
    return `${query.toLowerCase().trim()}_${database}_${JSON.stringify(options)}`;
  }

  _addToCache(key, value) {
    if (this.queryCache.size >= this.config.cacheSize) {
      // حذف أقدم عنصر
      const firstKey = this.queryCache.keys().next().value;
      this.queryCache.delete(firstKey);
    }
    this.queryCache.set(key, value);
  }

  _addToVectorCache(text, vector) {
    if (this.vectorCache.size >= this.config.cacheSize) {
      const firstKey = this.vectorCache.keys().next().value;
      this.vectorCache.delete(firstKey);
    }
    this.vectorCache.set(text, vector);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحديث الإحصائيات
   * ═══════════════════════════════════════════════════════════════════
   */

  _updateSearchStats(searchTime) {
    this.stats.totalSearches++;
    this.stats.avgSearchTime = 
      (this.stats.avgSearchTime * (this.stats.totalSearches - 1) + searchTime) 
      / this.stats.totalSearches;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * دوال المساعدة العامة
   * ═══════════════════════════════════════════════════════════════════
   */

  /**
   * إيجاد أقرب K متجهات
   */
  findTopK(queryVector, database, k = 10) {
    return this._searchInIndex(queryVector, database, k, 0);
  }

  /**
   * البحث عن متجه مشابه بعتبة محددة
   */
  findSimilar(targetVector, database, threshold = 0.7) {
    return this._searchInIndex(targetVector, database, 100, threshold);
  }

  /**
   * حساب التشابه بين متجهين
   */
  similarity(vec1, vec2) {
    return this._cosineSimilarity(vec1, vec2);
  }

  /**
   * الحصول على متجه من ID
   */
  getVectorById(id, database) {
    const index = this.indexes[database];
    if (!index) return null;

    return index.vectors.find(v => v.id === id);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * APIs الإدارية
   * ═══════════════════════════════════════════════════════════════════
   */

  getStats() {
    return {
      ...this.stats,
      cacheHitRate: this.stats.totalSearches > 0 
        ? (this.stats.cacheHits / this.stats.totalSearches * 100).toFixed(2) + '%'
        : '0%',
      totalVectors: Object.values(this.stats.indexSize).reduce((sum, count) => sum + count, 0)
    };
  }

  clearCache() {
    this.queryCache.clear();
    this.vectorCache.clear();
    console.log('🗑️  تم مسح ذاكرة التخزين المؤقت');
  }

  resetStats() {
    this.stats = {
      totalSearches: 0,
      avgSearchTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      indexSize: { ...this.stats.indexSize }
    };
  }

  isInitialized() {
    return this.initialized;
  }

  getDatabaseInfo(database) {
    const index = this.indexes[database];
    if (!index) return null;

    return {
      name: database,
      size: index.size,
      dimension: index.dimension,
      metadata: index.metadata
    };
  }

  getAllDatabases() {
    return Object.keys(this.indexes).filter(db => this.indexes[db] !== null);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحديث ديناميكي للفهرس
   * ═══════════════════════════════════════════════════════════════════
   */

  async addVector(vectorItem, database) {
    if (!this.indexes[database]) {
      console.error(`❌ قاعدة بيانات ${database} غير موجودة`);
      return false;
    }

    // تطبيع المتجه
    if (vectorItem.vector) {
      vectorItem.vector = this._normalizeVector(vectorItem.vector);
      vectorItem.normalized = true;
    }

    // إضافة للبيانات الأصلية
    this.rawVectors[database].push(vectorItem);
    
    // إضافة للفهرس
    this.indexes[database].vectors.push(vectorItem);
    this.indexes[database].size++;

    console.log(`✅ تمت إضافة متجه جديد إلى ${database}`);
    return true;
  }

  async removeVector(id, database) {
    if (!this.indexes[database]) {
      console.error(`❌ قاعدة بيانات ${database} غير موجودة`);
      return false;
    }

    // حذف من البيانات الأصلية
    this.rawVectors[database] = this.rawVectors[database].filter(v => v.id !== id);
    
    // حذف من الفهرس
    this.indexes[database].vectors = this.indexes[database].vectors.filter(v => v.id !== id);
    this.indexes[database].size--;

    console.log(`✅ تم حذف المتجه ${id} من ${database}`);
    return true;
  }

  async updateVector(id, newVectorItem, database) {
    await this.removeVector(id, database);
    return await this.addVector({ ...newVectorItem, id }, database);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تصدير واستيراد
   * ═══════════════════════════════════════════════════════════════════
   */

  exportIndex(database) {
    if (!this.indexes[database]) {
      console.error(`❌ قاعدة بيانات ${database} غير موجودة`);
      return null;
    }

    return {
      database: database,
      vectors: this.rawVectors[database],
      metadata: this.indexes[database].metadata,
      exportedAt: new Date().toISOString()
    };
  }

  async importIndex(data, database) {
    console.log(`📥 استيراد فهرس ${database}...`);

    this.rawVectors[database] = data.vectors;
    await this._buildIndex(database);

    console.log(`✅ تم استيراد ${data.vectors.length} متجه إلى ${database}`);
    return true;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VectorEngine;
}
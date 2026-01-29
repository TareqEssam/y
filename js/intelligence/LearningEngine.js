/**
 * ═══════════════════════════════════════════════════════════════════
 * LearningEngine.js
 * محرك التعلم المستمر - التحسين الذاتي للنظام
 * ═══════════════════════════════════════════════════════════════════
 * 
 * القدرات:
 * 1. التعلم من التفاعلات الناجحة والفاشلة
 * 2. تحسين العتبة الديناميكية
 * 3. كشف الأنماط الجديدة
 * 4. تحسين الأوزان
 * 5. حفظ واستعادة النماذج المتعلمة
 * 
 * @version 1.0.0
 * @author Committee Assistant System
 */

class LearningEngine {
  constructor(config = {}) {
    this.config = {
      learningRate: config.learningRate || 0.05,      // معدل التعلم
      minInteractions: config.minInteractions || 10,   // الحد الأدنى للتعلم
      patternThreshold: config.patternThreshold || 3,  // تكرار النمط
      autoSave: config.autoSave !== false,             // حفظ تلقائي
      saveInterval: config.saveInterval || 50,         // عدد التفاعلات قبل الحفظ
      maxHistorySize: config.maxHistorySize || 1000    // حجم السجل
    };

    // سجل التفاعلات
    this.interactionHistory = [];
    
    // الأنماط المتعلمة
    this.learnedPatterns = {
      successfulQueries: new Map(),    // أسئلة ناجحة
      failedQueries: new Map(),        // أسئلة فاشلة
      intentPatterns: new Map(),       // أنماط النوايا
      entityPatterns: new Map(),       // أنماط الكيانات
      contextPatterns: new Map()       // أنماط السياق
    };

    // الأوزان المتعلمة
    this.learnedWeights = {
      vectorWeight: 0.6,
      textWeight: 0.3,
      semanticWeight: 0.1,
      contextBoost: 0.15,
      baseThreshold: 0.65
    };

    // إحصائيات التعلم
    this.learningStats = {
      totalInteractions: 0,
      successfulInteractions: 0,
      failedInteractions: 0,
      patternsDiscovered: 0,
      weightsUpdated: 0,
      thresholdAdjustments: 0,
      lastSaved: null,
      lastLearned: null
    };

    // قاعدة المعرفة المتراكمة
    this.knowledgeBase = new Map();
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التعلم من التفاعل
   * ═══════════════════════════════════════════════════════════════════
   */
  async learnFromInteraction(query, answer, feedback = null) {
    console.log('📚 التعلم من التفاعل...');

    // تسجيل التفاعل
    const interaction = {
      query: query,
      answer: answer,
      feedback: feedback,
      timestamp: Date.now(),
      success: this._evaluateSuccess(answer, feedback),
      confidence: answer.confidence || 0.5,
      intent: answer.intent,
      entities: answer.entities,
      databases: answer.databases || []
    };

    // إضافة للسجل
    this._addToHistory(interaction);

    // التعلم من النمط
    await this._learnPattern(interaction);

    // تحديث الأوزان
    if (this._shouldUpdateWeights()) {
      await this._updateWeights();
    }

    // تحديث العتبة
    if (this._shouldAdjustThreshold()) {
      await this._adjustThreshold();
    }

    // كشف أنماط جديدة
    await this._detectNewPatterns();

    // الحفظ التلقائي
    if (this.config.autoSave && this._shouldAutoSave()) {
      await this.save();
    }

    // تحديث الإحصائيات
    this._updateLearningStats(interaction);

    console.log('✅ تم التعلم من التفاعل');
    return true;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تسجيل البحث
   * ═══════════════════════════════════════════════════════════════════
   */
  async recordSearch(query, results, analyzedQuery) {
    const searchRecord = {
      query: query,
      analyzedQuery: analyzedQuery,
      results: results,
      resultCount: results.length,
      topScore: results.length > 0 ? results[0].score : 0,
      timestamp: Date.now()
    };

    // تحليل جودة النتائج
    const quality = this._assessSearchQuality(searchRecord);

    // التعلم من البحث الناجح
    if (quality.isGood) {
      await this._learnSuccessfulSearch(searchRecord);
    } else {
      await this._learnFailedSearch(searchRecord);
    }

    return quality;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التعلم من النمط
   * ═══════════════════════════════════════════════════════════════════
   */
  async _learnPattern(interaction) {
    const { query, success, intent, entities } = interaction;

    // تسجيل الأسئلة الناجحة
    if (success) {
      const key = this._normalizeQuery(query);
      const count = this.learnedPatterns.successfulQueries.get(key) || 0;
      this.learnedPatterns.successfulQueries.set(key, count + 1);

      // تسجيل نمط النية
      if (intent) {
        const intentKey = `${intent.type}_${intent.subType || 'general'}`;
        const intentCount = this.learnedPatterns.intentPatterns.get(intentKey) || 0;
        this.learnedPatterns.intentPatterns.set(intentKey, intentCount + 1);
      }

      // تسجيل أنماط الكيانات
      if (entities) {
        Object.entries(entities).forEach(([entityType, value]) => {
          const entityKey = `${entityType}:${value}`;
          const entityCount = this.learnedPatterns.entityPatterns.get(entityKey) || 0;
          this.learnedPatterns.entityPatterns.set(entityKey, entityCount + 1);
        });
      }
    } else {
      // تسجيل الأسئلة الفاشلة
      const key = this._normalizeQuery(query);
      const count = this.learnedPatterns.failedQueries.get(key) || 0;
      this.learnedPatterns.failedQueries.set(key, count + 1);
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحديث الأوزان
   * ═══════════════════════════════════════════════════════════════════
   */
  async _updateWeights() {
    console.log('⚖️  تحديث الأوزان...');

    // تحليل النتائج السابقة
    const recentInteractions = this._getRecentInteractions(50);
    
    if (recentInteractions.length < this.config.minInteractions) {
      console.log('⏸️  بيانات غير كافية لتحديث الأوزان');
      return;
    }

    // حساب معدل النجاح لكل نوع بحث
    const vectorSuccess = this._calculateSuccessRate(recentInteractions, 'vector');
    const textSuccess = this._calculateSuccessRate(recentInteractions, 'text');

    // تعديل الأوزان بناءً على الأداء
    if (vectorSuccess > textSuccess) {
      this.learnedWeights.vectorWeight = Math.min(
        this.learnedWeights.vectorWeight + this.config.learningRate,
        0.8
      );
      this.learnedWeights.textWeight = Math.max(
        this.learnedWeights.textWeight - this.config.learningRate,
        0.2
      );
    } else {
      this.learnedWeights.textWeight = Math.min(
        this.learnedWeights.textWeight + this.config.learningRate,
        0.8
      );
      this.learnedWeights.vectorWeight = Math.max(
        this.learnedWeights.vectorWeight - this.config.learningRate,
        0.2
      );
    }

    // إعادة توازن الأوزان
    this._normalizeWeights();

    this.learningStats.weightsUpdated++;
    console.log('✅ تم تحديث الأوزان:', this.learnedWeights);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تعديل العتبة الديناميكية
   * ═══════════════════════════════════════════════════════════════════
   */
  async _adjustThreshold() {
    console.log('🎯 تعديل العتبة...');

    const recentInteractions = this._getRecentInteractions(30);
    
    if (recentInteractions.length < this.config.minInteractions) {
      return;
    }

    // حساب معدل النجاح الحالي
    const successRate = recentInteractions.filter(i => i.success).length / recentInteractions.length;

    // تعديل العتبة
    if (successRate < 0.6) {
      // معدل نجاح منخفض - تخفيض العتبة
      this.learnedWeights.baseThreshold = Math.max(
        this.learnedWeights.baseThreshold - 0.02,
        0.5
      );
      console.log('📉 تخفيض العتبة:', this.learnedWeights.baseThreshold);
    } else if (successRate > 0.85) {
      // معدل نجاح عالي - رفع العتبة لدقة أعلى
      this.learnedWeights.baseThreshold = Math.min(
        this.learnedWeights.baseThreshold + 0.01,
        0.75
      );
      console.log('📈 رفع العتبة:', this.learnedWeights.baseThreshold);
    }

    this.learningStats.thresholdAdjustments++;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * كشف أنماط جديدة
   * ═══════════════════════════════════════════════════════════════════
   */
  async _detectNewPatterns() {
    // كشف أنماط الأسئلة المتكررة
    const patterns = this._findFrequentPatterns();

    patterns.forEach(pattern => {
      if (!this.knowledgeBase.has(pattern.key)) {
        console.log('🆕 نمط جديد:', pattern);
        this.knowledgeBase.set(pattern.key, pattern);
        this.learningStats.patternsDiscovered++;
      }
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التعلم من البحث الناجح
   * ═══════════════════════════════════════════════════════════════════
   */
  async _learnSuccessfulSearch(searchRecord) {
    const { query, analyzedQuery, topScore } = searchRecord;

    // حفظ الاستراتيجية الناجحة
    const strategy = {
      query: query,
      intent: analyzedQuery.intent,
      entities: analyzedQuery.entities,
      score: topScore,
      timestamp: Date.now()
    };

    const key = this._generateStrategyKey(strategy);
    this.knowledgeBase.set(key, strategy);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التعلم من البحث الفاشل
   * ═══════════════════════════════════════════════════════════════════
   */
  async _learnFailedSearch(searchRecord) {
    const { query, results } = searchRecord;

    // تسجيل الفشل لتجنبه مستقبلاً
    const failureKey = this._normalizeQuery(query);
    const failureCount = this.learnedPatterns.failedQueries.get(failureKey) || 0;
    this.learnedPatterns.failedQueries.set(failureKey, failureCount + 1);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * دوال مساعدة
   * ═══════════════════════════════════════════════════════════════════
   */

  _addToHistory(interaction) {
    this.interactionHistory.push(interaction);

    // الحفاظ على حجم السجل
    if (this.interactionHistory.length > this.config.maxHistorySize) {
      this.interactionHistory.shift();
    }
  }

  _evaluateSuccess(answer, feedback) {
    // تقييم النجاح بناءً على الثقة والملاحظات
    if (feedback !== null) {
      return feedback.success === true;
    }

    // تقييم تلقائي بناءً على الثقة
    return answer.confidence >= 0.7 && answer.results && answer.results.length > 0;
  }

  _assessSearchQuality(searchRecord) {
    const { resultCount, topScore } = searchRecord;

    const isGood = resultCount > 0 && topScore >= 0.7;
    const isFair = resultCount > 0 && topScore >= 0.5;

    return {
      isGood,
      isFair,
      quality: isGood ? 'good' : (isFair ? 'fair' : 'poor'),
      score: topScore
    };
  }

  _getRecentInteractions(limit) {
    return this.interactionHistory.slice(-limit);
  }

  _calculateSuccessRate(interactions, type) {
    const typeInteractions = interactions.filter(i => 
      i.databases && i.databases.includes(type)
    );

    if (typeInteractions.length === 0) return 0.5;

    const successful = typeInteractions.filter(i => i.success).length;
    return successful / typeInteractions.length;
  }

  _normalizeWeights() {
    const total = this.learnedWeights.vectorWeight + 
                  this.learnedWeights.textWeight + 
                  this.learnedWeights.semanticWeight;

    if (total !== 1.0) {
      this.learnedWeights.vectorWeight /= total;
      this.learnedWeights.textWeight /= total;
      this.learnedWeights.semanticWeight /= total;
    }
  }

  _shouldUpdateWeights() {
    return this.learningStats.totalInteractions % 20 === 0 &&
           this.learningStats.totalInteractions >= this.config.minInteractions;
  }

  _shouldAdjustThreshold() {
    return this.learningStats.totalInteractions % 30 === 0 &&
           this.learningStats.totalInteractions >= this.config.minInteractions;
  }

  _shouldAutoSave() {
    return this.learningStats.totalInteractions % this.config.saveInterval === 0;
  }

  _normalizeQuery(query) {
    return query.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  _findFrequentPatterns() {
    const patterns = [];

    // كشف الأسئلة المتكررة
    this.learnedPatterns.successfulQueries.forEach((count, query) => {
      if (count >= this.config.patternThreshold) {
        patterns.push({
          type: 'query',
          key: query,
          frequency: count,
          discovered: Date.now()
        });
      }
    });

    // كشف أنماط النوايا المتكررة
    this.learnedPatterns.intentPatterns.forEach((count, intent) => {
      if (count >= this.config.patternThreshold) {
        patterns.push({
          type: 'intent',
          key: intent,
          frequency: count,
          discovered: Date.now()
        });
      }
    });

    return patterns;
  }

  _generateStrategyKey(strategy) {
    return `${strategy.intent?.type || 'unknown'}_${JSON.stringify(strategy.entities)}`;
  }

  _updateLearningStats(interaction) {
    this.learningStats.totalInteractions++;
    
    if (interaction.success) {
      this.learningStats.successfulInteractions++;
    } else {
      this.learningStats.failedInteractions++;
    }

    this.learningStats.lastLearned = new Date().toISOString();
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * الحصول على البيانات المتعلمة
   * ═══════════════════════════════════════════════════════════════════
   */

  getLearnedWeights() {
    return { ...this.learnedWeights };
  }

  getLearnedPatterns() {
    return {
      successfulQueries: Array.from(this.learnedPatterns.successfulQueries.entries()),
      failedQueries: Array.from(this.learnedPatterns.failedQueries.entries()),
      intentPatterns: Array.from(this.learnedPatterns.intentPatterns.entries()),
      entityPatterns: Array.from(this.learnedPatterns.entityPatterns.entries())
    };
  }

  getKnowledgeBase() {
    return Array.from(this.knowledgeBase.entries());
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * الحفظ والاستعادة
   * ═══════════════════════════════════════════════════════════════════
   */

  async save() {
    console.log('💾 حفظ البيانات المتعلمة...');

    const data = {
      weights: this.learnedWeights,
      patterns: this.getLearnedPatterns(),
      knowledgeBase: this.getKnowledgeBase(),
      stats: this.learningStats,
      savedAt: new Date().toISOString()
    };

    try {
      // الحفظ في localStorage
      localStorage.setItem('learned_data', JSON.stringify(data));
      this.learningStats.lastSaved = data.savedAt;
      console.log('✅ تم الحفظ بنجاح');
      return true;
    } catch (error) {
      console.error('❌ خطأ في الحفظ:', error);
      return false;
    }
  }

  async load() {
    console.log('📂 تحميل البيانات المتعلمة...');

    try {
      const savedData = localStorage.getItem('learned_data');
      
      if (!savedData) {
        console.log('ℹ️  لا توجد بيانات محفوظة');
        return false;
      }

      const data = JSON.parse(savedData);

      // استعادة الأوزان
      this.learnedWeights = data.weights;

      // استعادة الأنماط
      if (data.patterns) {
        this.learnedPatterns.successfulQueries = new Map(data.patterns.successfulQueries);
        this.learnedPatterns.failedQueries = new Map(data.patterns.failedQueries);
        this.learnedPatterns.intentPatterns = new Map(data.patterns.intentPatterns);
        this.learnedPatterns.entityPatterns = new Map(data.patterns.entityPatterns);
      }

      // استعادة قاعدة المعرفة
      if (data.knowledgeBase) {
        this.knowledgeBase = new Map(data.knowledgeBase);
      }

      // استعادة الإحصائيات
      if (data.stats) {
        this.learningStats = data.stats;
      }

      console.log('✅ تم التحميل بنجاح');
      console.log('📊 الإحصائيات:', this.learningStats);
      return true;

    } catch (error) {
      console.error('❌ خطأ في التحميل:', error);
      return false;
    }
  }

  async export() {
    const data = {
      weights: this.learnedWeights,
      patterns: this.getLearnedPatterns(),
      knowledgeBase: this.getKnowledgeBase(),
      stats: this.learningStats,
      exportedAt: new Date().toISOString()
    };

    return data;
  }

  async import(data) {
    try {
      this.learnedWeights = data.weights || this.learnedWeights;
      
      if (data.patterns) {
        this.learnedPatterns.successfulQueries = new Map(data.patterns.successfulQueries || []);
        this.learnedPatterns.failedQueries = new Map(data.patterns.failedQueries || []);
        this.learnedPatterns.intentPatterns = new Map(data.patterns.intentPatterns || []);
        this.learnedPatterns.entityPatterns = new Map(data.patterns.entityPatterns || []);
      }

      if (data.knowledgeBase) {
        this.knowledgeBase = new Map(data.knowledgeBase);
      }

      console.log('✅ تم استيراد البيانات بنجاح');
      return true;
    } catch (error) {
      console.error('❌ خطأ في الاستيراد:', error);
      return false;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * APIs الإحصائيات
   * ═══════════════════════════════════════════════════════════════════
   */

  getStats() {
    return {
      ...this.learningStats,
      successRate: this.learningStats.totalInteractions > 0
        ? (this.learningStats.successfulInteractions / this.learningStats.totalInteractions * 100).toFixed(2) + '%'
        : '0%',
      totalPatterns: this.learnedPatterns.successfulQueries.size + 
                     this.learnedPatterns.intentPatterns.size +
                     this.learnedPatterns.entityPatterns.size,
      knowledgeBaseSize: this.knowledgeBase.size
    };
  }

  reset() {
    this.interactionHistory = [];
    this.learnedPatterns = {
      successfulQueries: new Map(),
      failedQueries: new Map(),
      intentPatterns: new Map(),
      entityPatterns: new Map(),
      contextPatterns: new Map()
    };
    this.learnedWeights = {
      vectorWeight: 0.6,
      textWeight: 0.3,
      semanticWeight: 0.1,
      contextBoost: 0.15,
      baseThreshold: 0.65
    };
    this.learningStats = {
      totalInteractions: 0,
      successfulInteractions: 0,
      failedInteractions: 0,
      patternsDiscovered: 0,
      weightsUpdated: 0,
      thresholdAdjustments: 0,
      lastSaved: null,
      lastLearned: null
    };
    this.knowledgeBase.clear();
    console.log('🔄 تم إعادة تعيين محرك التعلم');
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LearningEngine;
}
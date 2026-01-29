/**
 * ═══════════════════════════════════════════════════════════════════
 * HybridSearchEngine.js
 * محرك البحث الهجين المتقدم - الجوهر الأساسي للنظام
 * ═══════════════════════════════════════════════════════════════════
 * 
 * الوظائف الرئيسية:
 * 1. دمج البحث المتجه (Vector) + النصي (BM25) + الدلالي (Semantic)
 * 2. فهم النية العميق (Intent Understanding)
 * 3. البحث متعدد المستويات (Multi-level Search)
 * 4. إعادة الترتيب الذكي (Intelligent Reranking)
 * 5. الفلترة الديناميكية (Dynamic Filtering)
 * 
 * @version 1.0.0
 * @author Committee Assistant System
 */

class HybridSearchEngine {
  constructor(config = {}) {
    this.config = {
      vectorWeight: config.vectorWeight || 0.6,        // وزن البحث المتجه
      textWeight: config.textWeight || 0.3,            // وزن البحث النصي
      semanticWeight: config.semanticWeight || 0.1,    // وزن البحث الدلالي
      baseThreshold: config.baseThreshold || 0.65,     // العتبة الأساسية
      adaptiveThreshold: config.adaptiveThreshold || true, // عتبة ديناميكية
      topK: config.topK || 10,                         // عدد النتائج
      deepSearchEnabled: config.deepSearchEnabled || true, // بحث عميق
      contextBoost: config.contextBoost || 0.15,       // تعزيز السياق
      minConfidence: config.minConfidence || 0.5       // الحد الأدنى للثقة
    };

    this.vectorEngine = null;
    this.textSearchEngine = null;
    this.intentClassifier = null;
    this.contextManager = null;
    this.learningEngine = null;
    
    this.searchCache = new Map();  // ذاكرة تخزين مؤقت
    this.performanceMetrics = {
      totalSearches: 0,
      avgResponseTime: 0,
      cacheHitRate: 0
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تهيئة المحرك
   * ═══════════════════════════════════════════════════════════════════
   */
  async initialize(engines) {
    console.log('🚀 تهيئة محرك البحث الهجين...');
    
    this.vectorEngine = engines.vectorEngine;
    this.textSearchEngine = engines.textSearchEngine;
    this.intentClassifier = engines.intentClassifier;
    this.contextManager = engines.contextManager;
    this.learningEngine = engines.learningEngine;

    // تحميل الأوزان المتعلمة من التفاعلات السابقة
    await this._loadLearnedWeights();
    
    console.log('✅ تم تهيئة محرك البحث الهجين');
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * البحث الهجين الرئيسي - القلب النابض للنظام
   * ═══════════════════════════════════════════════════════════════════
   */
  async search(query, options = {}) {
    const startTime = performance.now();
    
    try {
      // 1️⃣ التحقق من الذاكرة المؤقتة
      const cacheKey = this._generateCacheKey(query, options);
      if (this.searchCache.has(cacheKey)) {
        console.log('⚡ نتيجة من الذاكرة المؤقتة');
        return this.searchCache.get(cacheKey);
      }

      // 2️⃣ تحليل السؤال وتصنيف النية
      const analyzedQuery = await this._analyzeQuery(query);
      console.log('🔍 تحليل السؤال:', analyzedQuery);

      // 3️⃣ تحديد استراتيجية البحث حسب نوع السؤال
      const searchStrategy = this._determineSearchStrategy(analyzedQuery);
      console.log('🎯 استراتيجية البحث:', searchStrategy.type);

      // 4️⃣ تنفيذ البحث حسب الاستراتيجية
      let results;
      switch (searchStrategy.type) {
        case 'SIMPLE':
          results = await this._simpleSearch(analyzedQuery);
          break;
        case 'COMPLEX':
          results = await this._complexSearch(analyzedQuery);
          break;
        case 'STATISTICAL':
          results = await this._statisticalSearch(analyzedQuery);
          break;
        case 'COMPARISON':
          results = await this._comparisonSearch(analyzedQuery);
          break;
        case 'SEQUENTIAL':
          results = await this._sequentialSearch(analyzedQuery);
          break;
        case 'DEEP':
          results = await this._deepSearch(analyzedQuery);
          break;
        default:
          results = await this._hybridSearch(analyzedQuery);
      }

      // 5️⃣ إعادة الترتيب الذكي
      results = await this._intelligentReranking(results, analyzedQuery);

      // 6️⃣ تعزيز بالسياق
      results = await this._contextualBoost(results, analyzedQuery);

      // 7️⃣ الفلترة النهائية
      results = this._finalFiltering(results, analyzedQuery);

      // 8️⃣ حساب الثقة
      results = this._calculateConfidence(results, analyzedQuery);

      // 9️⃣ التعلم من البحث
      await this._learnFromSearch(query, results, analyzedQuery);

      // 🔟 التخزين المؤقت
      this.searchCache.set(cacheKey, results);
      if (this.searchCache.size > 100) {
        const firstKey = this.searchCache.keys().next().value;
        this.searchCache.delete(firstKey);
      }

      // 📊 تحديث الإحصائيات
      const endTime = performance.now();
      this._updateMetrics(endTime - startTime);

      return results;

    } catch (error) {
      console.error('❌ خطأ في البحث الهجين:', error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحليل السؤال - فهم عميق للنية
   * ═══════════════════════════════════════════════════════════════════
   */
  async _analyzeQuery(query) {
    // 1. تصنيف النية الرئيسية
    const intent = await this.intentClassifier.classify(query);

    // 2. استخراج الكيانات (أماكن، أنشطة، قوانين)
    const entities = await this.intentClassifier.extractEntities(query);

    // 3. تحليل نوع السؤال
    const questionType = this._analyzeQuestionType(query);

    // 4. كشف الأسئلة المركبة
    const subQuestions = this._detectSubQuestions(query);

    // 5. جلب السياق من المحادثة السابقة
    const context = this.contextManager.getRelevantContext(query);

    // 6. حل الضمائر والإشارات
    const resolvedQuery = this.contextManager.resolvePronouns(query, context);

    return {
      original: query,
      resolved: resolvedQuery,
      intent: intent,
      entities: entities,
      questionType: questionType,
      subQuestions: subQuestions,
      context: context,
      complexity: this._calculateComplexity(query, subQuestions),
      databases: this._identifyTargetDatabases(entities, intent)
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحديد استراتيجية البحث
   * ═══════════════════════════════════════════════════════════════════
   */
  _determineSearchStrategy(analyzedQuery) {
    const { intent, questionType, complexity, subQuestions } = analyzedQuery;

    // سؤال إحصائي
    if (intent.type === 'STATISTICAL' || questionType.isStatistical) {
      return { type: 'STATISTICAL', priority: 'aggregation' };
    }

    // سؤال مقارنة
    if (intent.type === 'COMPARISON' || questionType.isComparison) {
      return { type: 'COMPARISON', priority: 'multi-source' };
    }

    // سؤال متتابع
    if (intent.type === 'FOLLOWUP' || analyzedQuery.context.length > 0) {
      return { type: 'SEQUENTIAL', priority: 'context' };
    }

    // سؤال مركب (يحتاج بحث عميق)
    if (complexity > 7 || subQuestions.length > 2) {
      return { type: 'DEEP', priority: 'comprehensive' };
    }

    // سؤال معقد (متعدد المصادر)
    if (complexity > 4 || analyzedQuery.databases.length > 1) {
      return { type: 'COMPLEX', priority: 'multi-database' };
    }

    // سؤال بسيط
    return { type: 'SIMPLE', priority: 'speed' };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * البحث البسيط - سؤال مباشر في قاعدة واحدة
   * ═══════════════════════════════════════════════════════════════════
   */
  async _simpleSearch(analyzedQuery) {
    const targetDB = analyzedQuery.databases[0];
    
    // بحث متجه
    const vectorResults = await this.vectorEngine.search(
      analyzedQuery.resolved,
      targetDB,
      { topK: 5, threshold: this.config.baseThreshold }
    );

    // بحث نصي
    const textResults = await this.textSearchEngine.search(
      analyzedQuery.resolved,
      targetDB,
      { topK: 5 }
    );

    // دمج النتائج
    return this._fuseResults([
      { source: 'vector', results: vectorResults, weight: this.config.vectorWeight },
      { source: 'text', results: textResults, weight: this.config.textWeight }
    ]);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * البحث المعقد - أسئلة متعددة المصادر
   * ═══════════════════════════════════════════════════════════════════
   */
  async _complexSearch(analyzedQuery) {
    const allResults = [];

    // البحث في كل قاعدة بيانات مستهدفة
    for (const db of analyzedQuery.databases) {
      // بحث متجه متوازي
      const vectorPromise = this.vectorEngine.search(
        analyzedQuery.resolved,
        db,
        { topK: 8, threshold: this.config.baseThreshold - 0.05 }
      );

      // بحث نصي متوازي
      const textPromise = this.textSearchEngine.search(
        analyzedQuery.resolved,
        db,
        { topK: 8 }
      );

      const [vectorResults, textResults] = await Promise.all([
        vectorPromise,
        textPromise
      ]);

      allResults.push({
        database: db,
        vector: vectorResults,
        text: textResults
      });
    }

    // دمج النتائج من جميع القواعد
    return this._fuseMultiDatabaseResults(allResults, analyzedQuery);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * البحث الإحصائي - عد وتجميع
   * ═══════════════════════════════════════════════════════════════════
   */
  async _statisticalSearch(analyzedQuery) {
    const { entities, intent } = analyzedQuery;

    // تحديد نوع الإحصائية المطلوبة
    const statType = this._detectStatisticalType(analyzedQuery.original);

    // جلب البيانات الكاملة من القواعد المستهدفة
    const data = await this._fetchFullData(analyzedQuery.databases);

    // تطبيق الفلاتر حسب الكيانات المستخرجة
    let filtered = data;
    if (entities.governorate) {
      filtered = filtered.filter(item => 
        item.governorate === entities.governorate ||
        item.المحافظة === entities.governorate
      );
    }
    if (entities.dependency) {
      filtered = filtered.filter(item => 
        item.dependency === entities.dependency ||
        item.التبعية === entities.dependency
      );
    }

    // تنفيذ العملية الإحصائية
    let result;
    switch (statType) {
      case 'COUNT':
        result = { type: 'count', value: filtered.length, data: filtered };
        break;
      case 'GROUP_BY':
        result = this._groupBy(filtered, entities.groupField);
        break;
      case 'LIST':
        result = { type: 'list', data: filtered };
        break;
      case 'AGGREGATE':
        result = this._aggregate(filtered, entities.aggregateField);
        break;
      default:
        result = { type: 'unknown', data: filtered };
    }

    return [{
      score: 1.0,
      confidence: 0.95,
      type: 'statistical',
      result: result,
      metadata: { statType, filterCount: filtered.length }
    }];
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * البحث بالمقارنة - مقارنة بين كيانات
   * ═══════════════════════════════════════════════════════════════════
   */
  async _comparisonSearch(analyzedQuery) {
    const { entities } = analyzedQuery;

    // استخراج العناصر المراد مقارنتها
    const itemsToCompare = this._extractComparisonItems(analyzedQuery);

    if (itemsToCompare.length < 2) {
      // إذا لم يتم تحديد عناصر محددة، ابحث عنها
      return await this._complexSearch(analyzedQuery);
    }

    // جلب بيانات كل عنصر
    const comparisonData = await Promise.all(
      itemsToCompare.map(item => this._fetchItemData(item, analyzedQuery.databases))
    );

    // تحليل الفروقات
    const differences = this._analyzeDifferences(comparisonData, analyzedQuery);

    return [{
      score: 1.0,
      confidence: 0.92,
      type: 'comparison',
      items: comparisonData,
      differences: differences,
      metadata: { comparisonCount: itemsToCompare.length }
    }];
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * البحث المتتابع - أسئلة متتابعة مع ذاكرة
   * ═══════════════════════════════════════════════════════════════════
   */
  async _sequentialSearch(analyzedQuery) {
    const { context } = analyzedQuery;

    // دمج السياق السابق مع السؤال الحالي
    const enrichedQuery = this._enrichWithContext(analyzedQuery);

    // تنفيذ البحث مع التركيز على السياق
    const results = await this._hybridSearch(enrichedQuery);

    // تعزيز النتائج المرتبطة بالسياق السابق
    return results.map(result => {
      const contextRelevance = this._calculateContextRelevance(result, context);
      return {
        ...result,
        score: result.score * (1 + contextRelevance * this.config.contextBoost),
        contextBoosted: contextRelevance > 0.3
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * البحث العميق - للأسئلة شديدة التعقيد
   * ═══════════════════════════════════════════════════════════════════
   */
  async _deepSearch(analyzedQuery) {
    console.log('🔬 بدء البحث العميق...');

    // 1. تقسيم السؤال إلى أسئلة فرعية
    const subQuestions = analyzedQuery.subQuestions.length > 0
      ? analyzedQuery.subQuestions
      : this._decomposeQuestion(analyzedQuery);

    console.log(`📝 تقسيم السؤال إلى ${subQuestions.length} أسئلة فرعية`);

    // 2. البحث عن كل سؤال فرعي
    const subResults = await Promise.all(
      subQuestions.map(async (subQ, index) => {
        console.log(`  ${index + 1}. ${subQ}`);
        const subAnalysis = await this._analyzeQuery(subQ);
        return await this._hybridSearch(subAnalysis);
      })
    );

    // 3. دمج النتائج الفرعية
    const fusedResults = this._fuseDeepSearchResults(subResults, analyzedQuery);

    // 4. الاستنتاج المنطقي
    const reasonedResults = await this._applyReasoning(fusedResults, analyzedQuery);

    console.log('✅ اكتمل البحث العميق');
    return reasonedResults;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * البحث الهجين الأساسي - الدمج المتوازن
   * ═══════════════════════════════════════════════════════════════════
   */
  async _hybridSearch(analyzedQuery) {
    const targetDB = analyzedQuery.databases[0] || 'activities';

    // تنفيذ البحث بالتوازي
    const [vectorResults, textResults] = await Promise.all([
      this.vectorEngine.search(analyzedQuery.resolved, targetDB, {
        topK: this.config.topK,
        threshold: this.config.baseThreshold
      }),
      this.textSearchEngine.search(analyzedQuery.resolved, targetDB, {
        topK: this.config.topK
      })
    ]);

    // دمج النتائج بالأوزان
    return this._fuseResults([
      { source: 'vector', results: vectorResults, weight: this.config.vectorWeight },
      { source: 'text', results: textResults, weight: this.config.textWeight }
    ]);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * دمج النتائج من مصادر متعددة
   * ═══════════════════════════════════════════════════════════════════
   */
  _fuseResults(sources) {
    const resultMap = new Map();

    // جمع كل النتائج مع حساب الدرجات المرجحة
    sources.forEach(({ source, results, weight }) => {
      results.forEach(result => {
        const key = result.id || result.text || JSON.stringify(result);
        
        if (resultMap.has(key)) {
          const existing = resultMap.get(key);
          existing.score += result.score * weight;
          existing.sources.push(source);
          existing.sourceCount++;
        } else {
          resultMap.set(key, {
            ...result,
            score: result.score * weight,
            sources: [source],
            sourceCount: 1
          });
        }
      });
    });

    // تحويل إلى مصفوفة وترتيب
    return Array.from(resultMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.topK);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * دمج النتائج من قواعد بيانات متعددة
   * ═══════════════════════════════════════════════════════════════════
   */
  _fuseMultiDatabaseResults(allResults, analyzedQuery) {
    const fusedByDB = allResults.map(dbResult => {
      return this._fuseResults([
        { source: 'vector', results: dbResult.vector, weight: this.config.vectorWeight },
        { source: 'text', results: dbResult.text, weight: this.config.textWeight }
      ]).map(r => ({ ...r, database: dbResult.database }));
    });

    // دمج جميع النتائج
    const allFused = fusedByDB.flat();

    // إعادة ترتيب حسب الصلة بالسؤال
    return allFused
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.topK * 1.5);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * إعادة الترتيب الذكي - مرحلة حاسمة
   * ═══════════════════════════════════════════════════════════════════
   */
  async _intelligentReranking(results, analyzedQuery) {
    return results.map(result => {
      let rerankScore = result.score;

      // 1. تعزيز حسب نوع النية
      if (this._matchesIntent(result, analyzedQuery.intent)) {
        rerankScore *= 1.2;
      }

      // 2. تعزيز حسب الكيانات المطابقة
      const entityMatch = this._calculateEntityMatch(result, analyzedQuery.entities);
      rerankScore *= (1 + entityMatch * 0.3);

      // 3. تعزيز حسب اكتمال المعلومات
      const completeness = this._assessCompleteness(result, analyzedQuery);
      rerankScore *= (1 + completeness * 0.15);

      // 4. تعزيز حسب الطزاجة (freshness) - إذا كانت البيانات محدثة
      if (result.metadata && result.metadata.updated) {
        const freshness = this._calculateFreshness(result.metadata.updated);
        rerankScore *= (1 + freshness * 0.1);
      }

      // 5. تعزيز حسب مصادر متعددة
      if (result.sourceCount > 1) {
        rerankScore *= 1.15;
      }

      return { ...result, originalScore: result.score, score: rerankScore };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التعزيز بالسياق
   * ═══════════════════════════════════════════════════════════════════
   */
  async _contextualBoost(results, analyzedQuery) {
    if (!analyzedQuery.context || analyzedQuery.context.length === 0) {
      return results;
    }

    return results.map(result => {
      const contextRelevance = this._calculateContextRelevance(
        result,
        analyzedQuery.context
      );

      if (contextRelevance > 0.3) {
        result.score *= (1 + this.config.contextBoost);
        result.contextBoosted = true;
      }

      return result;
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * الفلترة النهائية
   * ═══════════════════════════════════════════════════════════════════
   */
  _finalFiltering(results, analyzedQuery) {
    // 1. إزالة التكرارات الدقيقة
    const unique = this._removeDuplicates(results);

    // 2. فلترة بالعتبة الديناميكية
    const threshold = this._calculateDynamicThreshold(unique, analyzedQuery);
    const filtered = unique.filter(r => r.score >= threshold);

    // 3. التأكد من وجود نتائج كافية
    if (filtered.length === 0 && unique.length > 0) {
      // إذا كانت العتبة صارمة جداً، خذ أفضل 3 نتائج
      return unique.slice(0, 3);
    }

    // 4. الحد الأقصى للنتائج
    return filtered.slice(0, this.config.topK);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * حساب الثقة في النتائج
   * ═══════════════════════════════════════════════════════════════════
   */
  _calculateConfidence(results, analyzedQuery) {
    return results.map((result, index) => {
      let confidence = result.score;

      // 1. تقليل الثقة حسب الترتيب
      confidence *= (1 - index * 0.05);

      // 2. زيادة الثقة للنتائج من مصادر متعددة
      if (result.sourceCount > 1) {
        confidence = Math.min(confidence * 1.1, 1.0);
      }

      // 3. تقليل الثقة للأسئلة المعقدة
      if (analyzedQuery.complexity > 7) {
        confidence *= 0.9;
      }

      // 4. زيادة الثقة إذا كانت النتيجة مطابقة تماماً
      if (result.exactMatch) {
        confidence = Math.min(confidence * 1.2, 0.98);
      }

      result.confidence = Math.max(confidence, this.config.minConfidence);
      return result;
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * دوال مساعدة
   * ═══════════════════════════════════════════════════════════════════
   */

  _generateCacheKey(query, options) {
    return `${query.toLowerCase().trim()}_${JSON.stringify(options)}`;
  }

  _analyzeQuestionType(query) {
    const q = query.toLowerCase();
    return {
      isStatistical: /كم عدد|كم|ما عدد|احصي|إحصائية/i.test(q),
      isComparison: /الفرق|مقارنة|أيهما|أي من|versus/i.test(q),
      isDefinition: /ما هو|ما هي|ماذا يعني|تعريف|define/i.test(q),
      isLocation: /أين|فين|موقع|مكان|location/i.test(q),
      isHow: /كيف|how/i.test(q),
      isWhy: /لماذا|ليه|why/i.test(q),
      isYesNo: /هل|is|are|does/i.test(q)
    };
  }

  _detectSubQuestions(query) {
    // كشف الأسئلة المركبة بالعطف
    const connectors = ['و', 'ثم', 'بعد ذلك', 'أيضاً', 'كذلك'];
    const subQuestions = [];
    
    let remaining = query;
    connectors.forEach(conn => {
      if (remaining.includes(conn)) {
        const parts = remaining.split(conn);
        if (parts.length > 1) {
          subQuestions.push(...parts.map(p => p.trim()));
        }
      }
    });

    return subQuestions.length > 1 ? subQuestions : [query];
  }

  _calculateComplexity(query, subQuestions) {
    let complexity = 0;
    
    // طول السؤال
    complexity += Math.min(query.length / 50, 3);
    
    // عدد الأسئلة الفرعية
    complexity += subQuestions.length * 2;
    
    // كلمات معقدة
    const complexWords = ['اشتراطات', 'متطلبات', 'قانون', 'مقارنة', 'تحليل'];
    complexWords.forEach(word => {
      if (query.includes(word)) complexity += 1;
    });
    
    return Math.min(complexity, 10);
  }

  _identifyTargetDatabases(entities, intent) {
    const databases = new Set();
    
    // حسب نوع الكيانات
    if (entities.activity || intent.type === 'ACTIVITY') {
      databases.add('activities');
    }
    if (entities.location || entities.governorate || intent.type === 'LOCATION') {
      databases.add('industrial');
    }
    if (entities.decision104 || intent.type === 'INCENTIVES') {
      databases.add('decision104');
    }
    
    // إذا لم يتم تحديد قاعدة، ابحث في الجميع
    return databases.size > 0 ? Array.from(databases) : ['activities', 'industrial', 'decision104'];
  }

  _detectStatisticalType(query) {
    const q = query.toLowerCase();
    if (/كم عدد|ما عدد/.test(q)) return 'COUNT';
    if (/اذكر|أعطني|قائمة|list/.test(q)) return 'LIST';
    if (/حسب|تبعية|جهة/.test(q)) return 'GROUP_BY';
    if (/مجموع|متوسط|sum|avg/.test(q)) return 'AGGREGATE';
    return 'COUNT';
  }

  async _fetchFullData(databases) {
    // جلب البيانات الكاملة من القواعد المحددة
    // هذا سيتم ربطه بـ DatabaseManager
    return [];
  }

  _groupBy(data, field) {
    const groups = {};
    data.forEach(item => {
      const key = item[field] || 'غير محدد';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return { type: 'grouped', groups: groups };
  }

  _aggregate(data, field) {
    // تجميع حسب حقل معين
    return { type: 'aggregate', result: data.length };
  }

  _extractComparisonItems(analyzedQuery) {
    // استخراج العناصر المراد مقارنتها من السؤال
    return [];
  }

  async _fetchItemData(item, databases) {
    // جلب بيانات عنصر محدد
    return {};
  }

  _analyzeDifferences(items, analyzedQuery) {
    // تحليل الفروقات بين العناصر
    return {};
  }

  _enrichWithContext(analyzedQuery) {
    // إضافة السياق للسؤال
    return analyzedQuery;
  }

  _calculateContextRelevance(result, context) {
    // حساب ملاءمة النتيجة للسياق
    return 0;
  }

  _decomposeQuestion(analyzedQuery) {
    // تقسيم السؤال المعقد
    return [analyzedQuery.original];
  }

  _fuseDeepSearchResults(subResults, analyzedQuery) {
    // دمج نتائج البحث العميق
    return subResults.flat();
  }

  async _applyReasoning(results, analyzedQuery) {
    // تطبيق المنطق والاستنتاج
    return results;
  }

  _matchesIntent(result, intent) {
    // التحقق من مطابقة النتيجة للنية
    return true;
  }

  _calculateEntityMatch(result, entities) {
    // حساب تطابق الكيانات
    return 0.5;
  }

  _assessCompleteness(result, analyzedQuery) {
    // تقييم اكتمال المعلومات
    return 0.8;
  }

  _calculateFreshness(updateDate) {
    // حساب حداثة البيانات
    return 0.5;
  }

  _calculateDynamicThreshold(results, analyzedQuery) {
    if (!this.config.adaptiveThreshold) {
      return this.config.baseThreshold;
    }

    // حساب عتبة ديناميكية حسب توزيع الدرجات
    if (results.length === 0) return this.config.baseThreshold;

    const scores = results.map(r => r.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);

    // إذا كان الفرق كبير بين الأعلى والمتوسط، استخدم عتبة أعلى
    if (maxScore - avgScore > 0.3) {
      return Math.max(avgScore, this.config.baseThreshold);
    }

    return this.config.baseThreshold * 0.85;
  }

  _removeDuplicates(results) {
    const seen = new Set();
    return results.filter(result => {
      const key = result.id || result.text?.substring(0, 100);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async _learnFromSearch(query, results, analyzedQuery) {
    // التعلم من البحث - سيتم ربطه بـ LearningEngine
    if (this.learningEngine) {
      await this.learningEngine.recordSearch(query, results, analyzedQuery);
    }
  }

  async _loadLearnedWeights() {
    // تحميل الأوزان المتعلمة
    if (this.learningEngine) {
      const weights = await this.learningEngine.getLearnedWeights();
      if (weights) {
        this.config.vectorWeight = weights.vectorWeight || this.config.vectorWeight;
        this.config.textWeight = weights.textWeight || this.config.textWeight;
      }
    }
  }

  _updateMetrics(responseTime) {
    this.performanceMetrics.totalSearches++;
    this.performanceMetrics.avgResponseTime = 
      (this.performanceMetrics.avgResponseTime * (this.performanceMetrics.totalSearches - 1) + responseTime) 
      / this.performanceMetrics.totalSearches;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * APIs عامة
   * ═══════════════════════════════════════════════════════════════════
   */

  getMetrics() {
    return this.performanceMetrics;
  }

  clearCache() {
    this.searchCache.clear();
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HybridSearchEngine;
}
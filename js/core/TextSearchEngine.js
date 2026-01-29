/**
 * ═══════════════════════════════════════════════════════════════════
 * TextSearchEngine.js
 * محرك البحث النصي - BM25 للبحث الدقيق
 * ═══════════════════════════════════════════════════════════════════
 * 
 * التقنيات:
 * 1. BM25 (Best Match 25) للترتيب
 * 2. TF-IDF للوزن
 * 3. N-gram للكلمات الجزئية
 * 4. Fuzzy matching للتشابه التقريبي
 * 5. Arabic text processing
 * 
 * @version 1.0.0
 * @author Committee Assistant System
 */

class TextSearchEngine {
  constructor(config = {}) {
    this.config = {
      k1: config.k1 || 1.5,              // BM25 parameter
      b: config.b || 0.75,                // BM25 parameter
      minScore: config.minScore || 0.3,   // الحد الأدنى للنتيجة
      fuzzyThreshold: config.fuzzyThreshold || 0.7,
      ngramSize: config.ngramSize || 3,
      useNgrams: config.useNgrams !== false,
      useFuzzy: config.useFuzzy !== false
    };

    // الفهارس النصية
    this.indexes = {
      activities: null,
      industrial: null,
      decision104: null
    };

    // إحصائيات الوثائق
    this.docStats = {
      activities: { totalDocs: 0, avgDocLength: 0 },
      industrial: { totalDocs: 0, avgDocLength: 0 },
      decision104: { totalDocs: 0, avgDocLength: 0 }
    };

    // IDF cache
    this.idfCache = new Map();

    // إحصائيات
    this.stats = {
      totalSearches: 0,
      avgSearchTime: 0
    };

    this.initialized = false;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التهيئة - بناء الفهارس النصية
   * ═══════════════════════════════════════════════════════════════════
   */
  async initialize(textData) {
    console.log('🔧 تهيئة محرك البحث النصي...');
    const startTime = performance.now();

    try {
      // بناء الفهارس
      this.indexes.activities = this._buildTextIndex(textData.activities || [], 'activities');
      this.indexes.industrial = this._buildTextIndex(textData.industrial || [], 'industrial');
      this.indexes.decision104 = this._buildTextIndex(textData.decision104 || [], 'decision104');

      // حساب IDF
      this._calculateIDF('activities');
      this._calculateIDF('industrial');
      this._calculateIDF('decision104');

      const endTime = performance.now();
      console.log(`✅ تم بناء الفهارس النصية في ${(endTime - startTime).toFixed(2)} ms`);

      this.initialized = true;
      return true;

    } catch (error) {
      console.error('❌ خطأ في تهيئة محرك البحث النصي:', error);
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
      throw new Error('TextSearchEngine not initialized');
    }

    const startTime = performance.now();

    try {
      // معالجة النص
      const processedQuery = this._processText(query);
      const queryTerms = this._tokenize(processedQuery);

      // البحث بـ BM25
      let results = this._bm25Search(queryTerms, database, options.topK || 10);

      // إضافة Fuzzy matching إذا كانت النتائج قليلة
      if (results.length < 3 && this.config.useFuzzy) {
        const fuzzyResults = this._fuzzySearch(query, database, 5);
        results = this._mergeResults(results, fuzzyResults);
      }

      // الفلترة بالحد الأدنى
      results = results.filter(r => r.score >= this.config.minScore);

      // تحديث الإحصائيات
      const endTime = performance.now();
      this._updateStats(endTime - startTime);

      return results;

    } catch (error) {
      console.error('❌ خطأ في البحث النصي:', error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * بناء الفهرس النصي
   * ═══════════════════════════════════════════════════════════════════
   */
  _buildTextIndex(documents, database) {
    console.log(`🏗️  بناء فهرس نصي لـ ${database}...`);

    const index = {
      documents: [],
      termFrequency: new Map(),    // TF for each term in each document
      documentFrequency: new Map(), // DF for each term
      documentLengths: []
    };

    let totalLength = 0;

    documents.forEach((doc, docIndex) => {
      // استخراج النص من الوثيقة
      const text = this._extractText(doc);
      const processedText = this._processText(text);
      const terms = this._tokenize(processedText);

      // حساب TF
      const termFreq = new Map();
      terms.forEach(term => {
        termFreq.set(term, (termFreq.get(term) || 0) + 1);
      });

      // تحديث DF
      const uniqueTerms = new Set(terms);
      uniqueTerms.forEach(term => {
        index.documentFrequency.set(
          term,
          (index.documentFrequency.get(term) || 0) + 1
        );
      });

      // حفظ الوثيقة
      index.documents.push({
        ...doc,
        _processedText: processedText,
        _terms: terms,
        _termFreq: termFreq
      });

      index.documentLengths.push(terms.length);
      totalLength += terms.length;
    });

    // حساب متوسط طول الوثيقة
    const avgLength = documents.length > 0 ? totalLength / documents.length : 0;
    this.docStats[database] = {
      totalDocs: documents.length,
      avgDocLength: avgLength
    };

    console.log(`✅ تم بناء فهرس ${database}: ${documents.length} وثيقة`);
    return index;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * حساب IDF (Inverse Document Frequency)
   * ═══════════════════════════════════════════════════════════════════
   */
  _calculateIDF(database) {
    const index = this.indexes[database];
    if (!index) return;

    const N = index.documents.length;

    index.documentFrequency.forEach((df, term) => {
      const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
      this.idfCache.set(`${database}:${term}`, idf);
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * بحث BM25
   * ═══════════════════════════════════════════════════════════════════
   */
  _bm25Search(queryTerms, database, topK) {
    const index = this.indexes[database];
    if (!index) return [];

    const { k1, b } = this.config;
    const { avgDocLength } = this.docStats[database];
    const results = [];

    index.documents.forEach((doc, docIndex) => {
      let score = 0;
      const docLength = index.documentLengths[docIndex];

      queryTerms.forEach(term => {
        const tf = doc._termFreq.get(term) || 0;
        if (tf === 0) return;

        const idf = this.idfCache.get(`${database}:${term}`) || 0;
        
        // BM25 formula
        const numerator = tf * (k1 + 1);
        const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));
        
        score += idf * (numerator / denominator);
      });

      if (score > 0) {
        results.push({
          ...doc,
          score: score / queryTerms.length,  // Normalize
          database: database,
          matchedTerms: queryTerms.filter(t => doc._termFreq.has(t))
        });
      }
    });

    // ترتيب وإرجاع أعلى النتائج
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * بحث Fuzzy (تقريبي)
   * ═══════════════════════════════════════════════════════════════════
   */
  _fuzzySearch(query, database, topK) {
    const index = this.indexes[database];
    if (!index) return [];

    const processedQuery = this._processText(query);
    const results = [];

    index.documents.forEach(doc => {
      const similarity = this._levenshteinSimilarity(
        processedQuery,
        doc._processedText
      );

      if (similarity >= this.config.fuzzyThreshold) {
        results.push({
          ...doc,
          score: similarity * 0.8,  // خصم بسيط للـ fuzzy
          database: database,
          fuzzy: true
        });
      }
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * معالجة النصوص العربية
   * ═══════════════════════════════════════════════════════════════════
   */

  _processText(text) {
    if (!text) return '';

    let processed = text.toLowerCase();

    // إزالة التشكيل
    processed = processed.replace(/[\u0617-\u061A\u064B-\u0652]/g, '');

    // توحيد الهمزات
    processed = processed
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه');

    // إزالة علامات الترقيم
    processed = processed.replace(/[^\w\s\u0600-\u06FF]/g, ' ');

    // توحيد المسافات
    processed = processed.replace(/\s+/g, ' ').trim();

    return processed;
  }

  _tokenize(text) {
    // تقسيم النص إلى كلمات
    const words = text.split(/\s+/).filter(word => word.length > 1);

    // إضافة n-grams إذا كان مفعلاً
    if (this.config.useNgrams) {
      const ngrams = this._generateNgrams(text, this.config.ngramSize);
      return [...words, ...ngrams];
    }

    return words;
  }

  _generateNgrams(text, n) {
    const ngrams = [];
    const cleanText = text.replace(/\s+/g, '');

    for (let i = 0; i <= cleanText.length - n; i++) {
      ngrams.push(cleanText.substring(i, i + n));
    }

    return ngrams;
  }

  _extractText(doc) {
    // استخراج كل النصوص من الوثيقة
    const texts = [];

    if (doc.text) texts.push(doc.text);
    if (doc.enriched_text) texts.push(doc.enriched_text);
    if (doc.name) texts.push(doc.name);
    if (doc.description) texts.push(doc.description);
    
    // من الـ details
    if (doc.details) {
      Object.values(doc.details).forEach(value => {
        if (typeof value === 'string') {
          texts.push(value);
        }
      });
    }

    // من الكلمات المفتاحية
    if (doc.keywords && Array.isArray(doc.keywords)) {
      texts.push(...doc.keywords);
    }

    return texts.join(' ');
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * Levenshtein Distance للتشابه التقريبي
   * ═══════════════════════════════════════════════════════════════════
   */
  _levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  _levenshteinSimilarity(str1, str2) {
    // تحديد طول محدود لتجنب العمليات الثقيلة
    const maxLen = 200;
    const s1 = str1.substring(0, maxLen);
    const s2 = str2.substring(0, maxLen);

    const distance = this._levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    if (maxLength === 0) return 1.0;

    return 1 - (distance / maxLength);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * دمج النتائج
   * ═══════════════════════════════════════════════════════════════════
   */
  _mergeResults(results1, results2) {
    const merged = new Map();

    // إضافة النتائج الأولى
    results1.forEach(result => {
      const key = result.id || result.text;
      merged.set(key, result);
    });

    // إضافة النتائج الثانية (إذا لم تكن موجودة)
    results2.forEach(result => {
      const key = result.id || result.text;
      if (!merged.has(key)) {
        merged.set(key, result);
      }
    });

    return Array.from(merged.values())
      .sort((a, b) => b.score - a.score);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحديث الإحصائيات
   * ═══════════════════════════════════════════════════════════════════
   */
  _updateStats(searchTime) {
    this.stats.totalSearches++;
    this.stats.avgSearchTime = 
      (this.stats.avgSearchTime * (this.stats.totalSearches - 1) + searchTime) 
      / this.stats.totalSearches;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * APIs عامة
   * ═══════════════════════════════════════════════════════════════════
   */

  getStats() {
    return {
      ...this.stats,
      databases: {
        activities: this.docStats.activities,
        industrial: this.docStats.industrial,
        decision104: this.docStats.decision104
      }
    };
  }

  isInitialized() {
    return this.initialized;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TextSearchEngine;
}
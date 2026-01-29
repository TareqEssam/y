/**
 * ═══════════════════════════════════════════════════════════════════
 * IntentClassifier.js
 * مصنف النوايا المتقدم - فهم عميق للنية الحقيقية
 * ═══════════════════════════════════════════════════════════════════
 * 
 * القدرات:
 * 1. تصنيف 15+ نوع من النوايا
 * 2. استخراج الكيانات (NER) - أماكن، أنشطة، قوانين
 * 3. فهم العامية المصرية والفصحى
 * 4. كشف الأسئلة الضمنية
 * 5. تحليل متعدد المستويات
 * 
 * @version 1.0.0
 * @author Committee Assistant System
 */

class IntentClassifier {
  constructor() {
    this.intentPatterns = this._initializeIntentPatterns();
    this.entityPatterns = this._initializeEntityPatterns();
    this.dialectMappings = this._initializeDialectMappings();
    this.synonyms = this._initializeSynonyms();
    
    // إحصائيات
    this.stats = {
      totalClassifications: 0,
      intentDistribution: {},
      averageConfidence: 0
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التصنيف الرئيسي - تحديد النية
   * ═══════════════════════════════════════════════════════════════════
   */
  async classify(query) {
    const normalized = this._normalizeQuery(query);
    
    // تصنيف متعدد المستويات
    const intentScores = this._scoreAllIntents(normalized);
    
    // اختيار أعلى نية
    const topIntent = this._selectTopIntent(intentScores);
    
    // تحديد المستوى الثانوي
    const subIntent = this._detectSubIntent(normalized, topIntent);
    
    // حساب الثقة
    const confidence = this._calculateIntentConfidence(topIntent, intentScores);
    
    // تحديث الإحصائيات
    this._updateStats(topIntent.type, confidence);
    
    return {
      type: topIntent.type,
      subType: subIntent,
      confidence: confidence,
      matched: topIntent.matched,
      normalized: normalized,
      original: query
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * استخراج الكيانات (Named Entity Recognition)
   * ═══════════════════════════════════════════════════════════════════
   */
  async extractEntities(query) {
    const normalized = this._normalizeQuery(query);
    
    const entities = {
      // الكيانات الجغرافية
      governorate: this._extractGovernorate(normalized),
      location: this._extractLocation(normalized),
      industrialZone: this._extractIndustrialZone(normalized),
      
      // الكيانات القانونية
      law: this._extractLaw(normalized),
      decision104: this._extractDecision104(normalized),
      authority: this._extractAuthority(normalized),
      
      // الكيانات الاقتصادية
      activity: this._extractActivity(normalized),
      sector: this._extractSector(normalized),
      productType: this._extractProductType(normalized),
      
      // كيانات إدارية
      dependency: this._extractDependency(normalized),
      
      // كيانات رقمية
      numbers: this._extractNumbers(normalized),
      dates: this._extractDates(normalized),
      
      // حقول التجميع والفلترة
      groupField: this._extractGroupField(normalized),
      aggregateField: this._extractAggregateField(normalized)
    };
    
    // إزالة القيم الفارغة
    return Object.fromEntries(
      Object.entries(entities).filter(([_, v]) => v !== null && v !== undefined)
    );
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تهيئة أنماط النوايا
   * ═══════════════════════════════════════════════════════════════════
   */
  _initializeIntentPatterns() {
    return {
      // 1. البحث عن نشاط
      ACTIVITY_SEARCH: {
        patterns: [
          /نشاط\s*(صناع|تجار|خدم|سياح)/,
          /عايز\s*افتح\s*(مصنع|محل|شركة)/,
          /ما هي\s*(اشتراطات|متطلبات|تراخيص)/,
          /كيف\s*(اسجل|افتح|اعمل)\s*(مصنع|نشاط)/,
          /(تأسيس|إنشاء|فتح)\s*(مصنع|شركة|محل)/
        ],
        weight: 1.0,
        keywords: ['نشاط', 'مصنع', 'شركة', 'ترخيص', 'تسجيل']
      },

      // 2. البحث عن موقع
      LOCATION_SEARCH: {
        patterns: [
          /أين\s*(توجد|تقع|موقع)/,
          /فين\s*(منطقة|المنطقة)/,
          /منطقة\s*(صناعية|حرة)/,
          /مكان\s*(المنطقة|المصنع)/,
          /(خريطة|موقع|إحداثيات)/
        ],
        weight: 1.0,
        keywords: ['أين', 'فين', 'موقع', 'منطقة', 'خريطة']
      },

      // 3. استعلام إحصائي
      STATISTICAL: {
        patterns: [
          /كم\s*عدد\s*(المناطق|المصانع|الأنشطة)/,
          /ما\s*عدد/,
          /احصائية|إحصاء/,
          /عدد\s*المناطق/,
          /كام\s*(منطقة|مصنع)/
        ],
        weight: 1.0,
        keywords: ['كم', 'عدد', 'إحصائية', 'كام']
      },

      // 4. المقارنة
      COMPARISON: {
        patterns: [
          /(الفرق|مقارنة)\s*بين/,
          /أيهما\s*(أفضل|أكبر|أصغر)/,
          /أي\s*من\s*(المناطق|الأنشطة)/,
          /الفروق\s*بين/,
          /(versus|vs|مقابل)/
        ],
        weight: 1.0,
        keywords: ['الفرق', 'مقارنة', 'أيهما', 'مقابل']
      },

      // 5. استعلام عن حوافز
      INCENTIVES: {
        patterns: [
          /قرار\s*104/,
          /حوافز|تحفيز/,
          /قطاع\s*[أاآ]/,
          /قطاع\s*ب/,
          /مشروعات\s*مدعومة/,
          /استثمار\s*استراتيجي/
        ],
        weight: 1.0,
        keywords: ['قرار', '104', 'حوافز', 'قطاع']
      },

      // 6. استعلام قانوني
      LEGAL: {
        patterns: [
          /قانون\s*رقم/,
          /لائحة\s*تنفيذية/,
          /السند\s*القانوني/,
          /التشريع|القرار\s*الوزاري/,
          /النص\s*القانوني/
        ],
        weight: 0.9,
        keywords: ['قانون', 'لائحة', 'قرار', 'تشريع']
      },

      // 7. استعلام عن جهة
      AUTHORITY: {
        patterns: [
          /الجهة\s*(المختصة|المسؤولة|التابعة)/,
          /من\s*هي\s*الجهة/,
          /مين\s*المسؤول/,
          /أي\s*جهة/,
          /وزارة|هيئة|مصلحة/
        ],
        weight: 0.9,
        keywords: ['جهة', 'وزارة', 'هيئة', 'مسؤول']
      },

      // 8. استعلام عن اشتراطات فنية
      TECHNICAL_REQUIREMENTS: {
        patterns: [
          /اشتراطات\s*فنية/,
          /متطلبات\s*السلامة/,
          /شروط\s*الحماية/,
          /معايير\s*الجودة/,
          /الاشتراطات\s*الصحية/
        ],
        weight: 0.95,
        keywords: ['اشتراطات', 'معايير', 'شروط', 'سلامة']
      },

      // 9. سؤال متتابع
      FOLLOWUP: {
        patterns: [
          /^(و|ثم|وأيضاً|كمان)/,
          /^(طيب|وبعدين)/,
          /(ها|دي|ده|دول)/,
          /^(ماذا عن|what about)/,
          /المذكور\s*(سابقاً|أعلاه)/
        ],
        weight: 1.0,
        keywords: ['و', 'ثم', 'أيضاً', 'ها', 'دي']
      },

      // 10. تحليل وتفسير
      ANALYSIS: {
        patterns: [
          /حلل|تحليل/,
          /فسر|تفسير/,
          /اشرح|شرح/,
          /ما\s*معنى/,
          /توضيح/
        ],
        weight: 0.85,
        keywords: ['تحليل', 'تفسير', 'شرح', 'توضيح']
      },

      // 11. توصية
      RECOMMENDATION: {
        patterns: [
          /أفضل\s*(منطقة|نشاط)/,
          /انصحني|نصيحة/,
          /ما\s*رأيك/,
          /توصية|اقتراح/
        ],
        weight: 0.8,
        keywords: ['أفضل', 'نصيحة', 'توصية', 'رأي']
      },

      // 12. التحقق
      VERIFICATION: {
        patterns: [
          /هل\s*(يوجد|توجد|موجود)/,
          /is\s*there/,
          /التحقق\s*من/,
          /تأكيد/
        ],
        weight: 0.9,
        keywords: ['هل', 'موجود', 'تأكيد', 'التحقق']
      },

      // 13. عمليات متعددة
      MULTI_OPERATION: {
        patterns: [
          /و.*و.*و/,  // أكثر من "و"
          /ثم.*ثم/,
          /،.*،.*،/   // أكثر من فاصلة
        ],
        weight: 1.0,
        keywords: []
      },

      // 14. القائمة
      LIST_REQUEST: {
        patterns: [
          /اذكر|أعطني|قائمة/,
          /list|show\s*all/,
          /جميع\s*(المناطق|الأنشطة)/,
          /كل\s*ال/
        ],
        weight: 0.9,
        keywords: ['اذكر', 'قائمة', 'جميع', 'كل']
      },

      // 15. استفسار عام
      GENERAL_INQUIRY: {
        patterns: [
          /ما\s*هو/,
          /ماذا|what/,
          /معلومات\s*عن/,
          /أخبرني\s*عن/
        ],
        weight: 0.7,
        keywords: ['ما', 'معلومات', 'أخبرني']
      }
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تهيئة أنماط الكيانات
   * ═══════════════════════════════════════════════════════════════════
   */
  _initializeEntityPatterns() {
    return {
      // المحافظات
      governorates: [
        'القاهرة', 'الجيزة', 'الإسكندرية', 'بورسعيد', 'السويس',
        'دمياط', 'الدقهلية', 'الشرقية', 'القليوبية', 'كفر الشيخ',
        'الغربية', 'المنوفية', 'البحيرة', 'الإسماعيلية',
        'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج',
        'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد',
        'مطروح', 'شمال سيناء', 'جنوب سيناء'
      ],

      // المناطق الصناعية الشهيرة
      industrialZones: [
        'العاشر من رمضان', 'السادس من أكتوبر', 'العبور', 'بدر',
        'شق الثعبان', 'الروبيكي', 'كوم أوشيم', 'بياض العرب',
        'العين السخنة', 'برج العرب', 'الصالحية الجديدة',
        'أبو رواش', 'السويس', 'جرزا', 'الجلود'
      ],

      // الجهات والهيئات
      authorities: [
        'هيئة التنمية الصناعية', 'IDA', 'الهيئة العامة للاستثمار',
        'GAFI', 'هيئة المجتمعات العمرانية', 'المحافظة',
        'وزارة التجارة والصناعة', 'هيئة سلامة الغذاء',
        'وزارة الصحة', 'هيئة الدواء', 'الحماية المدنية',
        'مصلحة الرقابة الصناعية', 'الهيئة القومية للاعتماد'
      ],

      // الأنشطة
      activities: [
        'صناعي', 'تجاري', 'خدمي', 'سياحي', 'زراعي',
        'مصنع', 'معمل', 'ورشة', 'مخزن', 'محل',
        'فندق', 'مطعم', 'مخبز', 'صيدلية', 'عيادة'
      ],

      // القطاعات
      sectors: [
        'قطاع أ', 'قطاع ب', 'قطاع (أ)', 'قطاع (ب)',
        'القطاع الأول', 'القطاع الثاني'
      ],

      // التبعيات
      dependencies: [
        'هيئة المجتمعات العمرانية', 'المحافظة',
        'الهيئة العامة للاستثمار', 'منطقة حرة',
        'وزارة الصناعة', 'هيئة التنمية الصناعية'
      ],

      // القوانين
      laws: [
        'قانون 15 لسنة 2017', 'قانون 21 لسنة 1958',
        'قانون 95 لسنة 2018', 'قرار 104',
        'اللائحة التنفيذية'
      ]
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تهيئة تعيين اللهجة المصرية
   * ═══════════════════════════════════════════════════════════════════
   */
  _initializeDialectMappings() {
    return {
      // أسئلة
      'فين': 'أين',
      'إزاي': 'كيف',
      'ليه': 'لماذا',
      'ايه': 'ما',
      'كام': 'كم',
      'منين': 'من أين',
      'إمتى': 'متى',
      
      // أفعال
      'عايز': 'أريد',
      'عاوز': 'أريد',
      'محتاج': 'أحتاج',
      'بدور': 'أبحث',
      'حابب': 'أحب',
      'نفسي': 'أرغب',
      
      // صفات
      'كويس': 'جيد',
      'حلو': 'جميل',
      'وحش': 'سيء',
      'كبير': 'كبير',
      'صغير': 'صغير',
      
      // أسماء إشارة
      'ده': 'هذا',
      'دي': 'هذه',
      'دول': 'هؤلاء',
      'ها': 'هذا',
      
      // أدوات
      'اللي': 'الذي',
      'بتاع': 'الخاص بـ',
      'بتاعة': 'الخاصة بـ',
      'بتوع': 'الخاصون بـ',
      
      // حروف
      'علشان': 'لأن',
      'عشان': 'لأن',
      'بس': 'لكن',
      'برضه': 'أيضاً',
      'كمان': 'أيضاً',
      
      // أفعال مساعدة
      'ممكن': 'يمكن',
      'لازم': 'يجب',
      'المفروض': 'ينبغي'
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تهيئة المترادفات
   * ═══════════════════════════════════════════════════════════════════
   */
  _initializeSynonyms() {
    return {
      'مصنع': ['معمل', 'ورشة', 'منشأة صناعية', 'وحدة إنتاج'],
      'منطقة صناعية': ['مدينة صناعية', 'تجمع صناعي', 'حي صناعي'],
      'ترخيص': ['رخصة', 'تصريح', 'سجل', 'إذن'],
      'اشتراطات': ['متطلبات', 'شروط', 'معايير', 'ضوابط'],
      'جهة': ['هيئة', 'مؤسسة', 'وزارة', 'مصلحة'],
      'تبعية': ['إشراف', 'ولاية', 'اختصاص', 'إدارة'],
      'حوافز': ['تحفيز', 'مزايا', 'دعم', 'تسهيلات'],
      'قرار': ['قانون', 'تشريع', 'لائحة', 'مرسوم']
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تطبيع السؤال
   * ═══════════════════════════════════════════════════════════════════
   */
  _normalizeQuery(query) {
    let normalized = query;

    // 1. تحويل اللهجة المصرية للفصحى
    Object.entries(this.dialectMappings).forEach(([dialect, fusha]) => {
      const regex = new RegExp(`\\b${dialect}\\b`, 'gi');
      normalized = normalized.replace(regex, fusha);
    });

    // 2. توحيد الهمزات
    normalized = normalized
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه');

    // 3. إزالة التشكيل
    normalized = normalized.replace(/[\u0617-\u061A\u064B-\u0652]/g, '');

    // 4. توحيد المسافات
    normalized = normalized.replace(/\s+/g, ' ').trim();

    // 5. توسيع المترادفات (اختياري - للتحسين)
    // نتركه للاحقاً لتجنب التداخل

    return normalized;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * حساب درجات جميع النوايا
   * ═══════════════════════════════════════════════════════════════════
   */
  _scoreAllIntents(normalizedQuery) {
    const scores = {};

    Object.entries(this.intentPatterns).forEach(([intentType, intentData]) => {
      let score = 0;
      let matchedPatterns = [];

      // 1. فحص الأنماط regex
      intentData.patterns.forEach(pattern => {
        if (pattern.test(normalizedQuery)) {
          score += intentData.weight;
          matchedPatterns.push(pattern.source);
        }
      });

      // 2. فحص الكلمات المفتاحية
      intentData.keywords.forEach(keyword => {
        if (normalizedQuery.includes(keyword)) {
          score += 0.3;
          matchedPatterns.push(keyword);
        }
      });

      scores[intentType] = {
        score: score,
        matched: matchedPatterns
      };
    });

    return scores;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * اختيار أعلى نية
   * ═══════════════════════════════════════════════════════════════════
   */
  _selectTopIntent(intentScores) {
    let topIntent = { type: 'GENERAL_INQUIRY', score: 0, matched: [] };

    Object.entries(intentScores).forEach(([type, data]) => {
      if (data.score > topIntent.score) {
        topIntent = { type, ...data };
      }
    });

    // إذا لم تُحدد أي نية، استخدم GENERAL_INQUIRY
    if (topIntent.score === 0) {
      topIntent.type = 'GENERAL_INQUIRY';
    }

    return topIntent;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * كشف النية الفرعية
   * ═══════════════════════════════════════════════════════════════════
   */
  _detectSubIntent(normalizedQuery, topIntent) {
    // حسب النية الرئيسية، حدد الفرعية
    switch (topIntent.type) {
      case 'ACTIVITY_SEARCH':
        if (/اشتراطات|متطلبات/.test(normalizedQuery)) return 'REQUIREMENTS';
        if (/جهة|هيئة/.test(normalizedQuery)) return 'AUTHORITY';
        if (/قانون|تشريع/.test(normalizedQuery)) return 'LEGAL';
        return 'GENERAL';

      case 'LOCATION_SEARCH':
        if (/خريطة|موقع/.test(normalizedQuery)) return 'MAP';
        if (/تبعية|إشراف/.test(normalizedQuery)) return 'DEPENDENCY';
        if (/قرار|إنشاء/.test(normalizedQuery)) return 'LEGAL';
        return 'GENERAL';

      case 'STATISTICAL':
        if (/حسب|تبعية/.test(normalizedQuery)) return 'GROUP_BY';
        if (/قائمة|اذكر/.test(normalizedQuery)) return 'LIST';
        return 'COUNT';

      case 'COMPARISON':
        if (/أفضل|أسوأ/.test(normalizedQuery)) return 'RANKING';
        return 'DIFFERENCES';

      default:
        return null;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * حساب ثقة النية
   * ═══════════════════════════════════════════════════════════════════
   */
  _calculateIntentConfidence(topIntent, allScores) {
    const scores = Object.values(allScores).map(s => s.score).sort((a, b) => b - a);
    
    if (scores.length < 2) return 0.8;

    const topScore = scores[0];
    const secondScore = scores[1];

    // إذا كان الفرق كبير، الثقة عالية
    if (topScore > secondScore * 2) return 0.95;
    if (topScore > secondScore * 1.5) return 0.85;
    if (topScore > secondScore * 1.2) return 0.75;
    
    // إذا كان الفرق ضئيل، الثقة منخفضة
    return 0.6;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * استخراج الكيانات - دوال فرعية
   * ═══════════════════════════════════════════════════════════════════
   */

  _extractGovernorate(query) {
    for (const gov of this.entityPatterns.governorates) {
      if (query.includes(gov)) return gov;
    }
    return null;
  }

  _extractLocation(query) {
    for (const zone of this.entityPatterns.industrialZones) {
      if (query.includes(zone)) return zone;
    }
    return null;
  }

  _extractIndustrialZone(query) {
    return this._extractLocation(query);
  }

  _extractLaw(query) {
    for (const law of this.entityPatterns.laws) {
      if (query.includes(law)) return law;
    }
    
    // استخراج قوانين بصيغة "قانون رقم X لسنة Y"
    const lawMatch = query.match(/قانون\s*رقم\s*(\d+)\s*لسنة\s*(\d+)/);
    if (lawMatch) return lawMatch[0];
    
    return null;
  }

  _extractDecision104(query) {
    if (/قرار\s*104/.test(query)) return 'قرار 104';
    return null;
  }

  _extractAuthority(query) {
    for (const auth of this.entityPatterns.authorities) {
      if (query.includes(auth)) return auth;
    }
    return null;
  }

  _extractActivity(query) {
    for (const activity of this.entityPatterns.activities) {
      if (query.includes(activity)) return activity;
    }
    return null;
  }

  _extractSector(query) {
    for (const sector of this.entityPatterns.sectors) {
      if (query.includes(sector)) return sector;
    }
    
    // كشف القطاع من السياق
    if (/قطاع\s*[أا]/.test(query)) return 'قطاع أ';
    if (/قطاع\s*ب/.test(query)) return 'قطاع ب';
    
    return null;
  }

  _extractProductType(query) {
    // استخراج نوع المنتج من السياق
    const products = {
      'خلايا شمسية': 'طاقة متجددة',
      'هيدروجين': 'طاقة',
      'سيارات كهربائية': 'سيارات',
      'أدوية': 'دوائي',
      'أغذية': 'غذائي',
      'مستحضرات تجميل': 'تجميلي'
    };

    for (const [product, type] of Object.entries(products)) {
      if (query.includes(product)) return type;
    }

    return null;
  }

  _extractDependency(query) {
    for (const dep of this.entityPatterns.dependencies) {
      if (query.includes(dep)) return dep;
    }
    return null;
  }

  _extractNumbers(query) {
    const numbers = query.match(/\d+/g);
    return numbers ? numbers.map(Number) : [];
  }

  _extractDates(query) {
    // استخراج تواريخ بصيغ مختلفة
    const datePatterns = [
      /\d{4}\/\d{1,2}\/\d{1,2}/,  // 2024/01/15
      /\d{1,2}\/\d{1,2}\/\d{4}/,  // 15/01/2024
      /لسنة\s*(\d{4})/             // لسنة 2024
    ];

    for (const pattern of datePatterns) {
      const match = query.match(pattern);
      if (match) return match[0];
    }

    return null;
  }

  _extractGroupField(query) {
    if (/حسب\s*(المحافظ|محافظ)/.test(query)) return 'governorate';
    if (/حسب\s*(التبعي|تبعي|جه)/.test(query)) return 'dependency';
    if (/حسب\s*(القطاع|قطاع)/.test(query)) return 'sector';
    return null;
  }

  _extractAggregateField(query) {
    if (/مساح/.test(query)) return 'area';
    if (/عدد/.test(query)) return 'count';
    return null;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحديث الإحصائيات
   * ═══════════════════════════════════════════════════════════════════
   */
  _updateStats(intentType, confidence) {
    this.stats.totalClassifications++;
    
    if (!this.stats.intentDistribution[intentType]) {
      this.stats.intentDistribution[intentType] = 0;
    }
    this.stats.intentDistribution[intentType]++;
    
    this.stats.averageConfidence = 
      (this.stats.averageConfidence * (this.stats.totalClassifications - 1) + confidence) 
      / this.stats.totalClassifications;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * APIs عامة
   * ═══════════════════════════════════════════════════════════════════
   */

  getStats() {
    return this.stats;
  }

  resetStats() {
    this.stats = {
      totalClassifications: 0,
      intentDistribution: {},
      averageConfidence: 0
    };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IntentClassifier;
}
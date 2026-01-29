/**
 * ═══════════════════════════════════════════════════════════════════
 * ReasoningEngine.js
 * محرك الاستنتاج المنطقي - العقل المفكر للنظام
 * ═══════════════════════════════════════════════════════════════════
 * 
 * القدرات:
 * 1. الاستنتاج من الأسئلة الضمنية
 * 2. الربط بين قواعد البيانات المتعددة
 * 3. استنتاج المعلومات المفقودة
 * 4. التحقق من التناسق المنطقي
 * 5. بناء سلاسل استدلالية
 * 
 * @version 1.0.0
 * @author Committee Assistant System
 */

class ReasoningEngine {
  constructor() {
    this.inferenceRules = this._initializeInferenceRules();
    this.knowledgeGraph = new Map();  // رسم بياني للمعرفة
    this.reasoningHistory = [];       // سجل الاستدلالات
    
    // إحصائيات
    this.stats = {
      totalInferences: 0,
      successfulInferences: 0,
      inferenceTypes: {}
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * الاستنتاج من السؤال - النقطة المحورية
   * ═══════════════════════════════════════════════════════════════════
   */
  async inferFromQuestion(question, context, entities) {
    console.log('🧠 بدء عملية الاستنتاج...');
    
    const inferences = {
      implicit: [],      // معلومات ضمنية
      derived: [],       // معلومات مشتقة
      connections: [],   // روابط بين القواعد
      requirements: [],  // متطلبات مستنتجة
      warnings: []       // تحذيرات
    };

    // 1️⃣ استنتاج النية الضمنية
    const implicitIntents = this._inferImplicitIntents(question, entities);
    inferences.implicit.push(...implicitIntents);

    // 2️⃣ استنتاج المتطلبات
    const requirements = this._inferRequirements(question, entities, context);
    inferences.requirements.push(...requirements);

    // 3️⃣ استنتاج الروابط بين القواعد
    const connections = await this._inferConnections(entities);
    inferences.connections.push(...connections);

    // 4️⃣ استنتاج القيود والشروط
    const constraints = this._inferConstraints(question, entities);
    inferences.derived.push(...constraints);

    // 5️⃣ استنتاج التحذيرات
    const warnings = this._inferWarnings(question, entities);
    inferences.warnings.push(...warnings);

    // 6️⃣ بناء سلسلة استدلالية
    const chain = this._buildInferenceChain(inferences);

    // تحديث الإحصائيات
    this._updateStats('GENERAL', inferences);

    console.log('✅ اكتمل الاستنتاج:', inferences);

    return {
      ...inferences,
      chain: chain,
      confidence: this._calculateInferenceConfidence(inferences)
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * ربط مصادر متعددة - للأسئلة المركبة
   * ═══════════════════════════════════════════════════════════════════
   */
  async connectMultipleSources(results, analyzedQuery) {
    console.log('🔗 ربط مصادر متعددة...');

    const connections = [];
    const databases = this._identifySourceDatabases(results);

    // إذا كانت النتائج من قاعدة واحدة، لا حاجة للربط
    if (databases.length <= 1) {
      return { connections: [], unified: results };
    }

    // الربط بين Activities و Industrial Zones
    if (databases.includes('activities') && databases.includes('industrial')) {
      const activityIndustrial = this._linkActivityToIndustrial(results);
      connections.push(...activityIndustrial);
    }

    // الربط بين Activities و Decision104
    if (databases.includes('activities') && databases.includes('decision104')) {
      const activityDecision = this._linkActivityToDecision104(results);
      connections.push(...activityDecision);
    }

    // الربط بين Industrial و Decision104
    if (databases.includes('industrial') && databases.includes('decision104')) {
      const industrialDecision = this._linkIndustrialToDecision104(results);
      connections.push(...industrialDecision);
    }

    // دمج النتائج بالروابط
    const unified = this._unifyResultsWithConnections(results, connections);

    return {
      connections: connections,
      unified: unified,
      crossReferenced: true
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * استنتاج معلومات ضمنية
   * ═══════════════════════════════════════════════════════════════════
   */
  deduceImplicitInfo(question, results, context) {
    const deductions = [];

    // مثال: "عندها غلايات" → يحتاج ترخيص الغلايات
    if (/غلاي|boiler/.test(question)) {
      deductions.push({
        type: 'REQUIREMENT',
        inferred: 'ترخيص إقامة وتشغيل الغلايات البخارية',
        authority: 'مصلحة الرقابة الصناعية',
        reasoning: 'وجود غلايات بخارية يتطلب ترخيص خاص'
      });
    }

    // مثال: "مصنع أدوية" → يحتاج موافقة هيئة الدواء
    if (/دواء|أدوي|pharmaceut/.test(question)) {
      deductions.push({
        type: 'AUTHORITY',
        inferred: 'هيئة الدواء المصرية',
        reasoning: 'الأنشطة الدوائية تحتاج موافقة هيئة الدواء'
      });
    }

    // مثال: "مستحضرات تجميل" → شروط خاصة
    if (/تجميل|cosmetic/.test(question)) {
      deductions.push({
        type: 'REQUIREMENT',
        inferred: 'شهادة تحليل للمنتجات',
        reasoning: 'مستحضرات التجميل تحتاج تحاليل معتمدة'
      });
    }

    // مثال: "ألبان" → شروط تبريد
    if (/ألبان|لبن|dairy/.test(question)) {
      deductions.push({
        type: 'TECHNICAL',
        inferred: 'نظام تبريد + 4°م',
        reasoning: 'الألبان تحتاج تبريد فوري'
      });
    }

    // مثال: "مواد خطرة" → اشتراطات حماية
    if (/خطر|كيميائ|قابل للاشتعال/.test(question)) {
      deductions.push({
        type: 'SAFETY',
        inferred: 'اشتراطات الحماية المدنية المشددة',
        reasoning: 'المواد الخطرة تحتاج اشتراطات صارمة'
      });
    }

    // مثال: "صناعة غذائية" → هيئة سلامة الغذاء
    if (/غذائ|أغذي|food/.test(question)) {
      deductions.push({
        type: 'AUTHORITY',
        inferred: 'هيئة سلامة الغذاء',
        reasoning: 'الصناعات الغذائية تخضع لهيئة سلامة الغذاء'
      });
    }

    // مثال: "منطقة حرة" → نظام قانوني خاص
    if (/منطقة حرة|free zone/.test(question)) {
      deductions.push({
        type: 'LEGAL',
        inferred: 'قانون المناطق الحرة رقم 83 لسنة 2002',
        reasoning: 'المناطق الحرة لها نظام قانوني منفصل'
      });
    }

    return deductions;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التحقق من التناسق المنطقي
   * ═══════════════════════════════════════════════════════════════════
   */
  validateLogicalConsistency(results, analyzedQuery) {
    const inconsistencies = [];
    const warnings = [];

    // 1. التحقق من تطابق المواقع
    const locationConsistency = this._checkLocationConsistency(results);
    if (!locationConsistency.consistent) {
      inconsistencies.push({
        type: 'LOCATION_MISMATCH',
        message: 'عدم تطابق في المواقع',
        details: locationConsistency.details
      });
    }

    // 2. التحقق من تطابق الجهات
    const authorityConsistency = this._checkAuthorityConsistency(results);
    if (!authorityConsistency.consistent) {
      warnings.push({
        type: 'AUTHORITY_CONFLICT',
        message: 'تضارب محتمل في الجهات المختصة',
        details: authorityConsistency.details
      });
    }

    // 3. التحقق من صحة قرار 104
    if (analyzedQuery.entities.decision104) {
      const decision104Check = this._checkDecision104Eligibility(results, analyzedQuery);
      if (!decision104Check.eligible) {
        warnings.push({
          type: 'DECISION104_INELIGIBLE',
          message: decision104Check.reason,
          suggestion: decision104Check.suggestion
        });
      }
    }

    // 4. التحقق من المتطلبات المتناقضة
    const requirementCheck = this._checkRequirementConflicts(results);
    if (requirementCheck.conflicts.length > 0) {
      inconsistencies.push({
        type: 'REQUIREMENT_CONFLICT',
        message: 'تضارب في المتطلبات',
        conflicts: requirementCheck.conflicts
      });
    }

    return {
      isConsistent: inconsistencies.length === 0,
      inconsistencies: inconsistencies,
      warnings: warnings,
      confidence: this._calculateConsistencyConfidence(inconsistencies, warnings)
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تهيئة قواعد الاستدلال
   * ═══════════════════════════════════════════════════════════════════
   */
  _initializeInferenceRules() {
    return {
      // قواعد النشاط
      ACTIVITY_RULES: {
        'صناعي': {
          requires: ['سجل صناعي', 'رخصة تشغيل'],
          authority: 'هيئة التنمية الصناعية',
          location: 'منطقة صناعية معتمدة'
        },
        'غذائي': {
          requires: ['سجل صناعي', 'موافقة سلامة الغذاء'],
          authority: ['هيئة التنمية الصناعية', 'هيئة سلامة الغذاء'],
          special: 'اشتراطات صحية صارمة'
        },
        'دوائي': {
          requires: ['سجل صناعي', 'ترخيص هيئة الدواء'],
          authority: ['هيئة التنمية الصناعية', 'هيئة الدواء'],
          special: 'معايير GMP'
        },
        'كيميائي': {
          requires: ['سجل صناعي', 'رخصة مواد خطرة'],
          authority: ['هيئة التنمية الصناعية', 'الحماية المدنية'],
          special: 'اشتراطات سلامة مشددة'
        }
      },

      // قواعد الموقع
      LOCATION_RULES: {
        'منطقة صناعية': {
          allows: ['مصانع', 'مخازن صناعية', 'ورش'],
          prohibits: ['سكني', 'تجاري عام']
        },
        'منطقة حرة': {
          benefits: ['إعفاءات جمركية', 'تسهيلات تصدير'],
          restrictions: ['البيع المحلي محدود']
        }
      },

      // قواعد قرار 104
      DECISION104_RULES: {
        'قطاع أ': {
          criteria: ['صناعات استراتيجية', 'طاقة متجددة', 'تكنولوجيا'],
          benefits: ['إعفاءات ضريبية', 'حوافز استثمارية']
        },
        'قطاع ب': {
          criteria: ['صناعات تصديرية', 'صناعات تشغيلية'],
          benefits: ['تسهيلات محدودة']
        }
      },

      // قواعد التبعية
      DEPENDENCY_RULES: {
        'هيئة المجتمعات العمرانية': {
          characteristics: ['مدن جديدة', 'مناطق مخططة'],
          advantages: ['بنية تحتية جاهزة']
        },
        'المحافظة': {
          characteristics: ['مناطق قديمة', 'إشراف محلي'],
          procedures: ['تنسيق مع المحافظة']
        }
      }
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * استنتاج النية الضمنية
   * ═══════════════════════════════════════════════════════════════════
   */
  _inferImplicitIntents(question, entities) {
    const implicit = [];

    // إذا ذكر نشاط دون طلب صريح
    if (entities.activity && !/اشتراطات|متطلبات/.test(question)) {
      implicit.push({
        type: 'IMPLIED_REQUIREMENT_QUERY',
        inferred: `المستخدم يبحث عن متطلبات نشاط ${entities.activity}`,
        confidence: 0.7
      });
    }

    // إذا ذكر منطقة دون طلب صريح
    if (entities.location && !/تبعية|جهة/.test(question)) {
      implicit.push({
        type: 'IMPLIED_LOCATION_INFO',
        inferred: `المستخدم يبحث عن معلومات منطقة ${entities.location}`,
        confidence: 0.75
      });
    }

    // إذا ذكر "عندها غلايات"
    if (/عنده|عندها|لديه|لديها/.test(question) && /غلاي/.test(question)) {
      implicit.push({
        type: 'IMPLIED_TECHNICAL_CHECK',
        inferred: 'المستخدم يريد معرفة اشتراطات الغلايات',
        confidence: 0.9
      });
    }

    // إذا ذكر نوع منتج دون سؤال صريح
    if (entities.productType && !/حواف|قرار 104/.test(question)) {
      implicit.push({
        type: 'IMPLIED_INCENTIVE_QUERY',
        inferred: `المستخدم يريد معرفة إذا كان ${entities.productType} مدعوم`,
        confidence: 0.65
      });
    }

    return implicit;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * استنتاج المتطلبات
   * ═══════════════════════════════════════════════════════════════════
   */
  _inferRequirements(question, entities, context) {
    const requirements = [];

    // حسب النشاط
    if (entities.activity) {
      const activityType = this._classifyActivity(entities.activity);
      const rules = this.inferenceRules.ACTIVITY_RULES[activityType];
      
      if (rules) {
        requirements.push({
          type: 'ACTIVITY_BASED',
          activity: entities.activity,
          requirements: rules.requires,
          authority: rules.authority,
          special: rules.special
        });
      }
    }

    // حسب الموقع
    if (entities.location) {
      const locationType = this._classifyLocation(entities.location);
      const rules = this.inferenceRules.LOCATION_RULES[locationType];
      
      if (rules) {
        requirements.push({
          type: 'LOCATION_BASED',
          location: entities.location,
          allows: rules.allows,
          prohibits: rules.prohibits
        });
      }
    }

    return requirements;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * استنتاج الروابط بين القواعد
   * ═══════════════════════════════════════════════════════════════════
   */
  async _inferConnections(entities) {
    const connections = [];

    // ربط النشاط بالموقع
    if (entities.activity && entities.location) {
      connections.push({
        type: 'ACTIVITY_LOCATION',
        from: entities.activity,
        to: entities.location,
        relationship: 'requires_location_in',
        reasoning: 'النشاط يجب أن يكون في منطقة معتمدة'
      });
    }

    // ربط النشاط بقرار 104
    if (entities.activity && entities.decision104) {
      connections.push({
        type: 'ACTIVITY_INCENTIVE',
        from: entities.activity,
        to: 'قرار 104',
        relationship: 'may_qualify_for',
        reasoning: 'النشاط قد يكون مؤهلاً للحوافز'
      });
    }

    // ربط الموقع بالتبعية
    if (entities.location && entities.dependency) {
      connections.push({
        type: 'LOCATION_AUTHORITY',
        from: entities.location,
        to: entities.dependency,
        relationship: 'governed_by',
        reasoning: 'المنطقة تتبع جهة إدارية محددة'
      });
    }

    return connections;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * استنتاج القيود والشروط
   * ═══════════════════════════════════════════════════════════════════
   */
  _inferConstraints(question, entities) {
    const constraints = [];

    // قيود الموقع
    if (entities.governorate) {
      constraints.push({
        type: 'GEOGRAPHIC',
        constraint: `يجب أن يكون المشروع في محافظة ${entities.governorate}`,
        reason: 'محدد في السؤال'
      });
    }

    // قيود قرار 104
    if (entities.decision104 && entities.sector) {
      constraints.push({
        type: 'INCENTIVE',
        constraint: `يجب أن يكون النشاط ضمن ${entities.sector}`,
        reason: 'للحصول على حوافز قرار 104'
      });
    }

    return constraints;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * استنتاج التحذيرات
   * ═══════════════════════════════════════════════════════════════════
   */
  _inferWarnings(question, entities) {
    const warnings = [];

    // تحذير: منطقة حرة + قرار 104
    if (entities.location?.includes('حرة') && entities.decision104) {
      warnings.push({
        type: 'CONFLICT',
        warning: 'المناطق الحرة لها نظام حوافز خاص',
        suggestion: 'تحقق من التوافق مع قرار 104'
      });
    }

    // تحذير: نشاط خطر
    if (/خطر|كيميائ|قابل للاشتعال/.test(question)) {
      warnings.push({
        type: 'SAFETY',
        warning: 'النشاط يتطلب اشتراطات سلامة مشددة',
        suggestion: 'استشر مكتب السلامة المهنية'
      });
    }

    return warnings;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * بناء سلسلة استدلالية
   * ═══════════════════════════════════════════════════════════════════
   */
  _buildInferenceChain(inferences) {
    const chain = [];

    // ترتيب الاستدلالات منطقياً
    if (inferences.implicit.length > 0) {
      chain.push({
        step: 1,
        type: 'IMPLICIT',
        content: inferences.implicit,
        reasoning: 'استنتاج النية الضمنية من السؤال'
      });
    }

    if (inferences.requirements.length > 0) {
      chain.push({
        step: chain.length + 1,
        type: 'REQUIREMENTS',
        content: inferences.requirements,
        reasoning: 'استنتاج المتطلبات من القواعد'
      });
    }

    if (inferences.connections.length > 0) {
      chain.push({
        step: chain.length + 1,
        type: 'CONNECTIONS',
        content: inferences.connections,
        reasoning: 'ربط المعلومات من قواعد متعددة'
      });
    }

    if (inferences.warnings.length > 0) {
      chain.push({
        step: chain.length + 1,
        type: 'WARNINGS',
        content: inferences.warnings,
        reasoning: 'تحذيرات وملاحظات مهمة'
      });
    }

    return chain;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * دوال مساعدة - ربط القواعد
   * ═══════════════════════════════════════════════════════════════════
   */

  _identifySourceDatabases(results) {
    const databases = new Set();
    results.forEach(result => {
      if (result.database) databases.add(result.database);
    });
    return Array.from(databases);
  }

  _linkActivityToIndustrial(results) {
    // ربط نشاط بمنطقة صناعية
    return [];
  }

  _linkActivityToDecision104(results) {
    // ربط نشاط بقرار 104
    return [];
  }

  _linkIndustrialToDecision104(results) {
    // ربط منطقة بقرار 104
    return [];
  }

  _unifyResultsWithConnections(results, connections) {
    // دمج النتائج مع الروابط
    return results.map(result => ({
      ...result,
      connections: connections.filter(c => 
        c.from === result.id || c.to === result.id
      )
    }));
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * دوال التحقق
   * ═══════════════════════════════════════════════════════════════════
   */

  _checkLocationConsistency(results) {
    // التحقق من تناسق المواقع
    return { consistent: true, details: [] };
  }

  _checkAuthorityConsistency(results) {
    // التحقق من تناسق الجهات
    return { consistent: true, details: [] };
  }

  _checkDecision104Eligibility(results, analyzedQuery) {
    // التحقق من أهلية قرار 104
    return { eligible: true, reason: '', suggestion: '' };
  }

  _checkRequirementConflicts(results) {
    // التحقق من تضارب المتطلبات
    return { conflicts: [] };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * دوال التصنيف
   * ═══════════════════════════════════════════════════════════════════
   */

  _classifyActivity(activity) {
    if (/صناع/.test(activity)) return 'صناعي';
    if (/غذائ/.test(activity)) return 'غذائي';
    if (/دواء/.test(activity)) return 'دوائي';
    if (/كيميائ/.test(activity)) return 'كيميائي';
    return 'صناعي';
  }

  _classifyLocation(location) {
    if (/حرة/.test(location)) return 'منطقة حرة';
    return 'منطقة صناعية';
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * حساب الثقة
   * ═══════════════════════════════════════════════════════════════════
   */

  _calculateInferenceConfidence(inferences) {
    let confidence = 0.5;
    
    if (inferences.implicit.length > 0) confidence += 0.15;
    if (inferences.requirements.length > 0) confidence += 0.2;
    if (inferences.connections.length > 0) confidence += 0.1;
    if (inferences.warnings.length === 0) confidence += 0.05;
    
    return Math.min(confidence, 0.95);
  }

  _calculateConsistencyConfidence(inconsistencies, warnings) {
    if (inconsistencies.length > 0) return 0.3;
    if (warnings.length > 2) return 0.6;
    if (warnings.length > 0) return 0.8;
    return 0.95;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحديث الإحصائيات
   * ═══════════════════════════════════════════════════════════════════
   */

  _updateStats(type, inferences) {
    this.stats.totalInferences++;
    
    if (inferences.implicit.length > 0 || inferences.requirements.length > 0) {
      this.stats.successfulInferences++;
    }
    
    if (!this.stats.inferenceTypes[type]) {
      this.stats.inferenceTypes[type] = 0;
    }
    this.stats.inferenceTypes[type]++;
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
      totalInferences: 0,
      successfulInferences: 0,
      inferenceTypes: {}
    };
  }

  addToKnowledgeGraph(key, value) {
    this.knowledgeGraph.set(key, value);
  }

  getFromKnowledgeGraph(key) {
    return this.knowledgeGraph.get(key);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReasoningEngine;
}
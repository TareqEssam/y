/**
 * ═══════════════════════════════════════════════════════════════════
 * AnswerGenerator.js
 * مولد الإجابات الطبيعية - صياغة احترافية
 * ═══════════════════════════════════════════════════════════════════
 * 
 * القدرات:
 * 1. توليد إجابات طبيعية بشرية
 * 2. تنسيق حسب نوع السؤال
 * 3. نبرة خبير مهني
 * 4. كتابة متتابعة (streaming)
 * 5. إجابات متعددة الأنماط
 * 
 * @version 1.0.0
 * @author Committee Assistant System
 */

class AnswerGenerator {
  constructor(config = {}) {
    this.config = {
      tone: config.tone || 'professional',  // professional, friendly, formal
      streaming: config.streaming !== false,
      maxLength: config.maxLength || 2000,
      includeSource: config.includeSource !== false
    };

    // قوالب الإجابات
    this.templates = this._initializeTemplates();

    // عبارات الربط
    this.connectors = this._initializeConnectors();

    // إحصائيات
    this.stats = {
      totalGenerated: 0,
      avgLength: 0
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * توليد الإجابة الرئيسية
   * ═══════════════════════════════════════════════════════════════════
   */
  async generateAnswer(results, analyzedQuery, options = {}) {
    console.log('✍️  توليد الإجابة...');

    try {
      // تحديد نوع الإجابة
      const answerType = this._determineAnswerType(analyzedQuery);

      // توليد حسب النوع
      let answer;
      switch (answerType) {
        case 'STATISTICAL':
          answer = this._generateStatisticalAnswer(results, analyzedQuery);
          break;
        case 'COMPARISON':
          answer = this._generateComparisonAnswer(results, analyzedQuery);
          break;
        case 'DEFINITION':
          answer = this._generateDefinitionAnswer(results, analyzedQuery);
          break;
        case 'LOCATION':
          answer = this._generateLocationAnswer(results, analyzedQuery);
          break;
        case 'LIST':
          answer = this._generateListAnswer(results, analyzedQuery);
          break;
        case 'PROCEDURE':
          answer = this._generateProcedureAnswer(results, analyzedQuery);
          break;
        default:
          answer = this._generateGeneralAnswer(results, analyzedQuery);
      }

      // إضافة المصادر
      if (this.config.includeSource && results.length > 0) {
        answer += this._formatSources(results);
      }

      // تحديث الإحصائيات
      this._updateStats(answer);

      return {
        text: answer,
        type: answerType,
        confidence: this._calculateAnswerConfidence(results),
        sources: results.slice(0, 3)
      };

    } catch (error) {
      console.error('❌ خطأ في توليد الإجابة:', error);
      return this._generateErrorAnswer();
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * توليد إجابة إحصائية
   * ═══════════════════════════════════════════════════════════════════
   */
  _generateStatisticalAnswer(results, analyzedQuery) {
    if (results.length === 0 || !results[0].result) {
      return this._noResultsMessage(analyzedQuery);
    }

    const result = results[0].result;
    let answer = '';

    switch (result.type) {
      case 'count':
        answer = this._formatCountAnswer(result, analyzedQuery);
        break;
      case 'grouped':
        answer = this._formatGroupedAnswer(result, analyzedQuery);
        break;
      case 'list':
        answer = this._formatListItems(result.data, analyzedQuery);
        break;
      default:
        answer = `العدد الإجمالي: ${result.value || result.data?.length || 0}`;
    }

    return answer;
  }

  _formatCountAnswer(result, query) {
    const count = result.value;
    const entities = query.entities;

    let answer = '';

    // مقدمة طبيعية
    if (count === 0) {
      answer = 'للأسف، ';
    } else if (count === 1) {
      answer = 'يوجد ';
    } else {
      answer = `يوجد إجمالي `;
    }

    // الرقم
    answer += `**${count}**`;

    // نوع العنصر
    if (entities.location) {
      answer += ' منطقة صناعية';
    } else if (entities.activity) {
      answer += ' نشاط';
    } else {
      answer += ' عنصر';
    }

    // الفلتر
    if (entities.governorate) {
      answer += ` في محافظة **${entities.governorate}**`;
    }
    if (entities.dependency) {
      answer += ` تابعة لـ **${entities.dependency}**`;
    }

    answer += '.';

    return answer;
  }

  _formatGroupedAnswer(result, query) {
    const groups = result.groups;
    let answer = 'إليك التوزيع:\n\n';

    Object.entries(groups)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([key, items]) => {
        answer += `• **${key}**: ${items.length} عنصر\n`;
      });

    return answer;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * توليد إجابة مقارنة
   * ═══════════════════════════════════════════════════════════════════
   */
  _generateComparisonAnswer(results, analyzedQuery) {
    if (results.length === 0 || !results[0].items) {
      return this._noResultsMessage(analyzedQuery);
    }

    const comparison = results[0];
    let answer = 'المقارنة بين العناصر:\n\n';

    comparison.items.forEach((item, index) => {
      answer += `${index + 1}. **${item.name || item.text}**\n`;
      
      // عرض الفروقات الرئيسية
      if (comparison.differences && comparison.differences[index]) {
        const diffs = comparison.differences[index];
        Object.entries(diffs).forEach(([key, value]) => {
          answer += `   - ${this._formatKey(key)}: ${value}\n`;
        });
      }
      
      answer += '\n';
    });

    // ملخص المقارنة
    if (comparison.summary) {
      answer += `\n**الملخص**: ${comparison.summary}`;
    }

    return answer;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * توليد إجابة تعريفية
   * ═══════════════════════════════════════════════════════════════════
   */
  _generateDefinitionAnswer(results, analyzedQuery) {
    if (results.length === 0) {
      return this._noResultsMessage(analyzedQuery);
    }

    const topResult = results[0];
    let answer = '';

    // المقدمة
    if (topResult.text) {
      answer += `**${topResult.text}** هو `;
    }

    // التعريف
    if (topResult.enriched_text) {
      answer += topResult.enriched_text;
    } else if (topResult.description) {
      answer += topResult.description;
    }

    // التفاصيل الإضافية
    if (topResult.details) {
      answer += '\n\n**التفاصيل**:\n';
      
      if (topResult.details.act) {
        answer += `\n📋 **النشاط**: ${topResult.details.act}`;
      }
      if (topResult.details.req) {
        answer += `\n\n📝 **المتطلبات**: ${topResult.details.req}`;
      }
      if (topResult.details.auth) {
        answer += `\n\n🏛️ **الجهة المختصة**: ${topResult.details.auth}`;
      }
      if (topResult.details.leg) {
        answer += `\n\n⚖️ **السند القانوني**: ${topResult.details.leg}`;
      }
    }

    return answer;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * توليد إجابة موقع
   * ═══════════════════════════════════════════════════════════════════
   */
  _generateLocationAnswer(results, analyzedQuery) {
    if (results.length === 0) {
      return this._noResultsMessage(analyzedQuery);
    }

    const location = results[0];
    let answer = `📍 **${location.name || location.text}**\n\n`;

    if (location.governorate || location.المحافظة) {
      answer += `🏙️ **المحافظة**: ${location.governorate || location.المحافظة}\n`;
    }

    if (location.dependency || location.التبعية) {
      answer += `🏛️ **التبعية**: ${location.dependency || location.التبعية}\n`;
    }

    if (location.area || location.المساحة) {
      answer += `📏 **المساحة**: ${location.area || location.المساحة} فدان\n`;
    }

    if (location.decision || location.القرار) {
      answer += `📜 **قرار الإنشاء**: ${location.decision || location.القرار}\n`;
    }

    // إحداثيات الخريطة
    if (location.x && location.y) {
      const mapsUrl = `https://www.google.com/maps?q=${location.y},${location.x}`;
      answer += `\n🗺️ [عرض على الخريطة](${mapsUrl})`;
    }

    return answer;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * توليد إجابة قائمة
   * ═══════════════════════════════════════════════════════════════════
   */
  _generateListAnswer(results, analyzedQuery) {
    if (results.length === 0) {
      return this._noResultsMessage(analyzedQuery);
    }

    let answer = `وجدت **${results.length}** نتيجة:\n\n`;

    results.slice(0, 10).forEach((item, index) => {
      const name = item.name || item.text || item.id;
      answer += `${index + 1}. **${name}**`;
      
      // معلومات إضافية مختصرة
      if (item.governorate || item.المحافظة) {
        answer += ` - ${item.governorate || item.المحافظة}`;
      }
      
      answer += '\n';
    });

    if (results.length > 10) {
      answer += `\n_... و ${results.length - 10} نتيجة أخرى_`;
    }

    return answer;
  }

  _formatListItems(items, query) {
    let answer = `وجدت ${items.length} عنصر:\n\n`;

    items.slice(0, 15).forEach((item, index) => {
      const name = item.name || item.text || item.id;
      answer += `${index + 1}. ${name}\n`;
    });

    if (items.length > 15) {
      answer += `\n_... و ${items.length - 15} عنصر آخر_`;
    }

    return answer;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * توليد إجابة إجرائية
   * ═══════════════════════════════════════════════════════════════════
   */
  _generateProcedureAnswer(results, analyzedQuery) {
    if (results.length === 0) {
      return this._noResultsMessage(analyzedQuery);
    }

    const result = results[0];
    let answer = '';

    // المقدمة
    if (result.text) {
      answer += `للحصول على **${result.text}**، اتبع الخطوات التالية:\n\n`;
    }

    // الخطوات
    if (result.details && result.details.req) {
      const requirements = result.details.req.split('\\n');
      requirements.forEach((req, index) => {
        if (req.trim()) {
          answer += `${index + 1}. ${req.trim()}\n`;
        }
      });
    }

    // الجهة المختصة
    if (result.details && result.details.auth) {
      answer += `\n\n**الجهة المختصة**: ${result.details.auth}`;
    }

    // الملاحظات الفنية
    if (result.technicalNotes) {
      answer += `\n\n**ملاحظات فنية مهمة**:\n${result.technicalNotes}`;
    }

    return answer;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * توليد إجابة عامة
   * ═══════════════════════════════════════════════════════════════════
   */
  _generateGeneralAnswer(results, analyzedQuery) {
    if (results.length === 0) {
      return this._noResultsMessage(analyzedQuery);
    }

    const topResult = results[0];
    let answer = '';

    // استخدام أفضل نتيجة
    if (topResult.enriched_text) {
      answer = topResult.enriched_text;
    } else if (topResult.text) {
      answer = topResult.text;
    } else if (topResult.description) {
      answer = topResult.description;
    }

    // إضافة معلومات إضافية إذا كانت متاحة
    if (results.length > 1) {
      answer += '\n\n**معلومات إضافية**:';
      results.slice(1, 3).forEach((result, index) => {
        answer += `\n${index + 2}. ${result.text || result.name}`;
      });
    }

    return answer;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * رسالة عدم وجود نتائج
   * ═══════════════════════════════════════════════════════════════════
   */
  _noResultsMessage(analyzedQuery) {
    const alternatives = [
      'عذراً، لم أجد معلومات محددة حول استفسارك.',
      'للأسف، لا توجد نتائج تطابق السؤال بدقة.',
      'لم أتمكن من العثور على معلومات مطابقة.'
    ];

    let message = alternatives[Math.floor(Math.random() * alternatives.length)];

    // اقتراحات
    message += '\n\n**اقتراحات**:';
    message += '\n• حاول إعادة صياغة السؤال';
    message += '\n• تأكد من كتابة الأسماء بشكل صحيح';
    message += '\n• استخدم كلمات أكثر عمومية';

    return message;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تنسيق المصادر
   * ═══════════════════════════════════════════════════════════════════
   */
  _formatSources(results) {
    if (results.length === 0) return '';

    let sources = '\n\n---\n**المصادر**:\n';

    results.slice(0, 3).forEach((result, index) => {
      const source = result.database || 'قاعدة البيانات';
      const confidence = (result.score * 100).toFixed(0);
      sources += `${index + 1}. ${source} (دقة: ${confidence}%)\n`;
    });

    return sources;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * دوال مساعدة
   * ═══════════════════════════════════════════════════════════════════
   */

  _determineAnswerType(analyzedQuery) {
    const intent = analyzedQuery.intent?.type;
    
    if (intent === 'STATISTICAL') return 'STATISTICAL';
    if (intent === 'COMPARISON') return 'COMPARISON';
    if (intent === 'LOCATION_SEARCH') return 'LOCATION';
    if (intent === 'LIST_REQUEST') return 'LIST';
    if (intent === 'TECHNICAL_REQUIREMENTS') return 'PROCEDURE';
    
    if (analyzedQuery.questionType?.isDefinition) return 'DEFINITION';
    
    return 'GENERAL';
  }

  _formatKey(key) {
    const keyMap = {
      'governorate': 'المحافظة',
      'dependency': 'التبعية',
      'area': 'المساحة',
      'decision': 'القرار'
    };

    return keyMap[key] || key;
  }

  _calculateAnswerConfidence(results) {
    if (results.length === 0) return 0;

    const topScore = results[0].score || 0;
    const avgScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;

    return (topScore * 0.7 + avgScore * 0.3);
  }

  _generateErrorAnswer() {
    return {
      text: 'حدث خطأ أثناء معالجة السؤال. يرجى المحاولة مرة أخرى.',
      type: 'ERROR',
      confidence: 0,
      sources: []
    };
  }

  _updateStats(answer) {
    this.stats.totalGenerated++;
    const length = answer.length;
    this.stats.avgLength = 
      (this.stats.avgLength * (this.stats.totalGenerated - 1) + length) 
      / this.stats.totalGenerated;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تهيئة القوالب والموصلات
   * ═══════════════════════════════════════════════════════════════════
   */

  _initializeTemplates() {
    return {
      greeting: [
        'بالتأكيد،',
        'إليك المعلومات:',
        'وفقاً للبيانات المتاحة:',
        'بناءً على المعلومات:'
      ],
      transition: [
        'بالإضافة إلى ذلك،',
        'كما أن',
        'من المهم ملاحظة أن',
        'علاوة على ذلك،'
      ],
      conclusion: [
        'في الختام،',
        'وبذلك،',
        'إجمالاً،',
        'بشكل عام،'
      ]
    };
  }

  _initializeConnectors() {
    return {
      addition: ['أيضاً', 'كذلك', 'بالإضافة', 'علاوة على ذلك'],
      contrast: ['لكن', 'بينما', 'في المقابل', 'من ناحية أخرى'],
      cause: ['لذلك', 'بالتالي', 'نتيجة لذلك', 'وعليه'],
      example: ['على سبيل المثال', 'مثلاً', 'كمثال على ذلك']
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * كتابة متتابعة (Streaming)
   * ═══════════════════════════════════════════════════════════════════
   */

  async *streamAnswer(answer) {
    if (!this.config.streaming) {
      yield answer;
      return;
    }

    // تقسيم النص إلى أجزاء صغيرة
    const words = answer.split(' ');
    const chunkSize = 3;  // عدد الكلمات في كل جزء

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
      yield chunk;
      
      // تأخير صغير لمحاكاة الكتابة
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * APIs عامة
   * ═══════════════════════════════════════════════════════════════════
   */

  getStats() {
    return { ...this.stats };
  }

  setTone(tone) {
    this.config.tone = tone;
  }

  enableStreaming(enabled) {
    this.config.streaming = enabled;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnswerGenerator;
}
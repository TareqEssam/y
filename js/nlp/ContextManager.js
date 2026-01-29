/**
 * ═══════════════════════════════════════════════════════════════════
 * ContextManager.js
 * مدير السياق - الذاكرة الذكية للمحادثة
 * ═══════════════════════════════════════════════════════════════════
 * 
 * القدرات:
 * 1. إدارة سياق المحادثة المتعددة الأدوار
 * 2. حل الضمائر والإشارات
 * 3. تتبع الكيانات المذكورة
 * 4. كشف الأسئلة المتتابعة
 * 5. الذاكرة قصيرة وطويلة المدى
 * 
 * @version 1.0.0
 * @author Committee Assistant System
 */

class ContextManager {
  constructor(config = {}) {
    this.config = {
      maxContextLength: config.maxContextLength || 10,     // عدد الرسائل
      maxShortTermMemory: config.maxShortTermMemory || 5,  // ذاكرة قصيرة
      maxLongTermMemory: config.maxLongTermMemory || 50,   // ذاكرة طويلة
      contextWindow: config.contextWindow || 3,            // نافذة السياق
      entityLifetime: config.entityLifetime || 300000,     // عمر الكيان (5 دقائق)
      autoCleanup: config.autoCleanup !== false
    };

    // سياق المحادثة الحالي
    this.conversationHistory = [];
    
    // الذاكرة قصيرة المدى (آخر تفاعلات)
    this.shortTermMemory = [];
    
    // الذاكرة طويلة المدى (معلومات مهمة)
    this.longTermMemory = new Map();
    
    // الكيانات المذكورة مع timestamp
    this.mentionedEntities = new Map();
    
    // السياق الحالي النشط
    this.activeContext = {
      lastIntent: null,
      lastEntities: {},
      lastDatabase: null,
      lastResults: [],
      focusEntity: null,  // الكيان المحوري الحالي
      topic: null         // الموضوع الحالي
    };

    // مؤشرات المحادثة
    this.conversationMetadata = {
      sessionId: this._generateSessionId(),
      startTime: Date.now(),
      totalTurns: 0,
      lastActivity: Date.now()
    };

    // إحصائيات
    this.stats = {
      totalMessages: 0,
      resolvedPronouns: 0,
      contextSwitches: 0,
      entityReferences: 0
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * إضافة رسالة للسياق
   * ═══════════════════════════════════════════════════════════════════
   */
  addMessage(role, content, metadata = {}) {
    const message = {
      role: role,              // 'user' أو 'assistant'
      content: content,
      metadata: metadata,
      timestamp: Date.now(),
      turn: this.conversationMetadata.totalTurns++
    };

    // إضافة للسجل
    this.conversationHistory.push(message);

    // إضافة للذاكرة قصيرة المدى
    this._addToShortTermMemory(message);

    // تحديث السياق النشط
    this._updateActiveContext(message);

    // استخراج وحفظ الكيانات
    if (metadata.entities) {
      this._trackEntities(metadata.entities);
    }

    // تنظيف تلقائي
    if (this.config.autoCleanup) {
      this._cleanup();
    }

    this.conversationMetadata.lastActivity = Date.now();
    this.stats.totalMessages++;

    return message;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * حل الضمائر والإشارات
   * ═══════════════════════════════════════════════════════════════════
   */
  resolvePronouns(query, context = null) {
    console.log('🔍 حل الضمائر في:', query);

    let resolved = query;
    const useContext = context || this.getRelevantContext(query);

    // قائمة الضمائر والإشارات العربية
    const pronouns = {
      'ها': this._resolveDemonstrativePronoun('ها', useContext),
      'دي': this._resolveDemonstrativePronoun('دي', useContext),
      'ده': this._resolveDemonstrativePronoun('ده', useContext),
      'دول': this._resolveDemonstrativePronoun('دول', useContext),
      'هذا': this._resolveDemonstrativePronoun('هذا', useContext),
      'هذه': this._resolveDemonstrativePronoun('هذه', useContext),
      'هؤلاء': this._resolveDemonstrativePronoun('هؤلاء', useContext),
      'هي': this._resolvePersonalPronoun('هي', useContext),
      'هو': this._resolvePersonalPronoun('هو', useContext),
      'هم': this._resolvePersonalPronoun('هم', useContext)
    };

    // استبدال الضمائر
    Object.entries(pronouns).forEach(([pronoun, resolved]) => {
      if (resolved) {
        const regex = new RegExp(`\\b${pronoun}\\b`, 'gi');
        resolved = query.replace(regex, resolved);
        this.stats.resolvedPronouns++;
      }
    });

    // حل الإشارات الضمنية
    resolved = this._resolveImplicitReferences(resolved, useContext);

    if (resolved !== query) {
      console.log('✅ بعد حل الضمائر:', resolved);
    }

    return resolved;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * الحصول على السياق ذي الصلة
   * ═══════════════════════════════════════════════════════════════════
   */
  getRelevantContext(query = null) {
    // جلب آخر N رسائل
    const recentMessages = this.conversationHistory.slice(-this.config.contextWindow);

    // إضافة السياق النشط
    const context = {
      messages: recentMessages,
      activeContext: { ...this.activeContext },
      recentEntities: this._getRecentEntities(),
      topic: this.activeContext.topic,
      focusEntity: this.activeContext.focusEntity
    };

    // إذا كان هناك سؤال، أضف السياق الأكثر صلة
    if (query) {
      context.relevantMemory = this._searchLongTermMemory(query);
    }

    return context;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * كشف الأسئلة المتتابعة
   * ═══════════════════════════════════════════════════════════════════
   */
  detectFollowUpQuestion(query) {
    // مؤشرات السؤال المتتابع
    const followUpIndicators = [
      /^(و|ثم|وأيضاً|كمان|برضه)/,
      /^(طيب|وبعدين|وإيه)/,
      /(ها|دي|ده|دول)/,
      /^(ماذا عن|what about)/,
      /المذكور\s*(سابقاً|أعلاه)/,
      /^(وكمان|وكذلك)/
    ];

    const isFollowUp = followUpIndicators.some(pattern => pattern.test(query.trim()));

    if (isFollowUp) {
      console.log('➡️  تم كشف سؤال متتابع');
    }

    return {
      isFollowUp: isFollowUp,
      previousContext: isFollowUp ? this.activeContext : null,
      relatedEntities: isFollowUp ? this._getRecentEntities() : []
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحديث الموضوع
   * ═══════════════════════════════════════════════════════════════════
   */
  updateTopic(newTopic) {
    if (this.activeContext.topic !== newTopic) {
      console.log(`📌 تغيير الموضوع: ${this.activeContext.topic} → ${newTopic}`);
      this.stats.contextSwitches++;
    }

    this.activeContext.topic = newTopic;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تحديث الكيان المحوري
   * ═══════════════════════════════════════════════════════════════════
   */
  setFocusEntity(entity, entityType) {
    console.log(`🎯 كيان محوري جديد: ${entity} (${entityType})`);
    
    this.activeContext.focusEntity = {
      value: entity,
      type: entityType,
      setAt: Date.now()
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * حفظ في الذاكرة طويلة المدى
   * ═══════════════════════════════════════════════════════════════════
   */
  saveToLongTermMemory(key, value, importance = 1) {
    this.longTermMemory.set(key, {
      value: value,
      importance: importance,
      savedAt: Date.now(),
      accessCount: 0
    });

    // تنظيف إذا تجاوز الحد
    if (this.longTermMemory.size > this.config.maxLongTermMemory) {
      this._pruneLongTermMemory();
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * دوال مساعدة - حل الضمائر
   * ═══════════════════════════════════════════════════════════════════
   */

  _resolveDemonstrativePronoun(pronoun, context) {
    // حل ضمائر الإشارة (ها، دي، ده، دول)
    
    if (!context || context.messages.length === 0) {
      return null;
    }

    // البحث في الرسائل الأخيرة
    for (let i = context.messages.length - 1; i >= 0; i--) {
      const message = context.messages[i];
      
      if (message.role === 'assistant' && message.metadata.results) {
        const results = message.metadata.results;
        
        if (results.length > 0) {
          const lastResult = results[0];
          
          // حسب نوع الضمير
          if (pronoun === 'ها' || pronoun === 'هذا' || pronoun === 'ده') {
            return lastResult.text || lastResult.name || lastResult.id;
          }
          if (pronoun === 'دي' || pronoun === 'هذه') {
            return lastResult.name || lastResult.text;
          }
          if (pronoun === 'دول' || pronoun === 'هؤلاء') {
            return results.map(r => r.name || r.text).join(' و ');
          }
        }
      }
    }

    // إذا لم يُجد في النتائج، ابحث في الكيان المحوري
    if (this.activeContext.focusEntity) {
      return this.activeContext.focusEntity.value;
    }

    return null;
  }

  _resolvePersonalPronoun(pronoun, context) {
    // حل الضمائر الشخصية (هو، هي، هم)
    
    if (!this.activeContext.focusEntity) {
      return null;
    }

    const entity = this.activeContext.focusEntity;

    // تطابق الجنس/العدد
    if (pronoun === 'هو' && entity.type !== 'female') {
      return entity.value;
    }
    if (pronoun === 'هي' && entity.type === 'female') {
      return entity.value;
    }
    if (pronoun === 'هم') {
      return entity.value;  // يمكن أن يشير لجمع
    }

    return null;
  }

  _resolveImplicitReferences(query, context) {
    // حل الإشارات الضمنية مثل "المنطقة" → "منطقة شق الثعبان"
    
    if (!context || !this.activeContext.lastEntities) {
      return query;
    }

    const entities = this.activeContext.lastEntities;
    let resolved = query;

    // إذا ذكر "المنطقة" وكانت هناك منطقة محددة مسبقاً
    if (/\bالمنطقة\b/.test(query) && entities.location) {
      resolved = resolved.replace(/\bالمنطقة\b/, entities.location);
    }

    // إذا ذكر "النشاط" وكان هناك نشاط محدد مسبقاً
    if (/\bالنشاط\b/.test(query) && entities.activity) {
      resolved = resolved.replace(/\bالنشاط\b/, entities.activity);
    }

    // إذا ذكر "القانون" وكان هناك قانون محدد مسبقاً
    if (/\bالقانون\b/.test(query) && entities.law) {
      resolved = resolved.replace(/\bالقانون\b/, entities.law);
    }

    return resolved;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * تتبع الكيانات
   * ═══════════════════════════════════════════════════════════════════
   */

  _trackEntities(entities) {
    const timestamp = Date.now();

    Object.entries(entities).forEach(([type, value]) => {
      const key = `${type}:${value}`;
      
      this.mentionedEntities.set(key, {
        type: type,
        value: value,
        lastMentioned: timestamp,
        mentionCount: (this.mentionedEntities.get(key)?.mentionCount || 0) + 1
      });

      this.stats.entityReferences++;
    });

    // تحديث الكيان المحوري إذا كان مهماً
    const primaryEntity = this._identifyPrimaryEntity(entities);
    if (primaryEntity) {
      this.setFocusEntity(primaryEntity.value, primaryEntity.type);
    }
  }

  _getRecentEntities(maxAge = null) {
    const cutoff = maxAge || this.config.entityLifetime;
    const now = Date.now();
    const recent = [];

    this.mentionedEntities.forEach((entity, key) => {
      if (now - entity.lastMentioned < cutoff) {
        recent.push(entity);
      }
    });

    // ترتيب حسب الأهمية (آخر ذكر + عدد الذكر)
    recent.sort((a, b) => {
      const scoreA = a.lastMentioned + (a.mentionCount * 10000);
      const scoreB = b.lastMentioned + (b.mentionCount * 10000);
      return scoreB - scoreA;
    });

    return recent;
  }

  _identifyPrimaryEntity(entities) {
    // تحديد الكيان الرئيسي من مجموعة كيانات
    const priorities = ['location', 'activity', 'decision104', 'governorate'];

    for (const type of priorities) {
      if (entities[type]) {
        return { type, value: entities[type] };
      }
    }

    // أول كيان متاح
    const firstEntry = Object.entries(entities)[0];
    if (firstEntry) {
      return { type: firstEntry[0], value: firstEntry[1] };
    }

    return null;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * إدارة الذاكرة
   * ═══════════════════════════════════════════════════════════════════
   */

  _addToShortTermMemory(message) {
    this.shortTermMemory.push(message);

    if (this.shortTermMemory.length > this.config.maxShortTermMemory) {
      this.shortTermMemory.shift();
    }
  }

  _updateActiveContext(message) {
    if (message.role === 'user' && message.metadata.intent) {
      this.activeContext.lastIntent = message.metadata.intent;
    }

    if (message.metadata.entities) {
      this.activeContext.lastEntities = message.metadata.entities;
    }

    if (message.metadata.database) {
      this.activeContext.lastDatabase = message.metadata.database;
    }

    if (message.role === 'assistant' && message.metadata.results) {
      this.activeContext.lastResults = message.metadata.results;
    }
  }

  _searchLongTermMemory(query) {
    const relevant = [];
    const queryLower = query.toLowerCase();

    this.longTermMemory.forEach((memory, key) => {
      if (key.toLowerCase().includes(queryLower) || 
          JSON.stringify(memory.value).toLowerCase().includes(queryLower)) {
        
        // زيادة عداد الوصول
        memory.accessCount++;
        memory.lastAccessed = Date.now();
        
        relevant.push({
          key: key,
          ...memory
        });
      }
    });

    // ترتيب حسب الأهمية
    relevant.sort((a, b) => b.importance - a.importance);

    return relevant.slice(0, 5);
  }

  _pruneLongTermMemory() {
    // حذف الذكريات الأقل أهمية
    const entries = Array.from(this.longTermMemory.entries());
    
    // ترتيب حسب الأهمية وعدد الوصول
    entries.sort((a, b) => {
      const scoreA = a[1].importance * 10 + a[1].accessCount;
      const scoreB = b[1].importance * 10 + b[1].accessCount;
      return scoreA - scoreB;
    });

    // حذف الأقل أهمية
    const toDelete = entries.slice(0, entries.length - this.config.maxLongTermMemory);
    toDelete.forEach(([key]) => this.longTermMemory.delete(key));

    console.log(`🗑️  تم حذف ${toDelete.length} ذكرى قديمة`);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التنظيف
   * ═══════════════════════════════════════════════════════════════════
   */

  _cleanup() {
    const now = Date.now();

    // تنظيف الكيانات القديمة
    const entitiesToDelete = [];
    this.mentionedEntities.forEach((entity, key) => {
      if (now - entity.lastMentioned > this.config.entityLifetime) {
        entitiesToDelete.push(key);
      }
    });

    entitiesToDelete.forEach(key => this.mentionedEntities.delete(key));

    // تنظيف سجل المحادثة
    if (this.conversationHistory.length > this.config.maxContextLength * 2) {
      const toRemove = this.conversationHistory.length - this.config.maxContextLength;
      this.conversationHistory.splice(0, toRemove);
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * APIs عامة
   * ═══════════════════════════════════════════════════════════════════
   */

  getConversationHistory() {
    return [...this.conversationHistory];
  }

  getLastUserMessage() {
    for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
      if (this.conversationHistory[i].role === 'user') {
        return this.conversationHistory[i];
      }
    }
    return null;
  }

  getLastAssistantMessage() {
    for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
      if (this.conversationHistory[i].role === 'assistant') {
        return this.conversationHistory[i];
      }
    }
    return null;
  }

  clearContext() {
    this.conversationHistory = [];
    this.shortTermMemory = [];
    this.mentionedEntities.clear();
    this.activeContext = {
      lastIntent: null,
      lastEntities: {},
      lastDatabase: null,
      lastResults: [],
      focusEntity: null,
      topic: null
    };
    console.log('🗑️  تم مسح السياق');
  }

  getStats() {
    return {
      ...this.stats,
      conversationLength: this.conversationHistory.length,
      activeEntities: this.mentionedEntities.size,
      longTermMemorySize: this.longTermMemory.size,
      sessionDuration: Date.now() - this.conversationMetadata.startTime
    };
  }

  _generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSessionInfo() {
    return {
      ...this.conversationMetadata,
      duration: Date.now() - this.conversationMetadata.startTime,
      isActive: Date.now() - this.conversationMetadata.lastActivity < 300000 // 5 دقائق
    };
  }

  export() {
    return {
      conversationHistory: this.conversationHistory,
      activeContext: this.activeContext,
      longTermMemory: Array.from(this.longTermMemory.entries()),
      mentionedEntities: Array.from(this.mentionedEntities.entries()),
      metadata: this.conversationMetadata,
      stats: this.stats
    };
  }

  import(data) {
    if (data.conversationHistory) {
      this.conversationHistory = data.conversationHistory;
    }
    if (data.activeContext) {
      this.activeContext = data.activeContext;
    }
    if (data.longTermMemory) {
      this.longTermMemory = new Map(data.longTermMemory);
    }
    if (data.mentionedEntities) {
      this.mentionedEntities = new Map(data.mentionedEntities);
    }
    console.log('✅ تم استيراد السياق');
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContextManager;
}
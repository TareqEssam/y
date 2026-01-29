/**
 * ═══════════════════════════════════════════════════════════════════
 * app.js
 * نقطة الدخول الرئيسية للتطبيق
 * ═══════════════════════════════════════════════════════════════════
 */

class CommitteeAssistant {
  constructor() {
    // المحركات الأساسية
    this.databaseManager = null;
    this.dataLoader = null;
    this.vectorEngine = null;
    this.textSearchEngine = null;
    this.hybridSearchEngine = null;

    // معالجة اللغة
    this.intentClassifier = null;
    this.contextManager = null;

    // الذكاء
    this.reasoningEngine = null;
    this.learningEngine = null;
    this.answerGenerator = null;

    // الصوت
    this.audioController = null;

    // الواجهة
    this.chatInterface = null;

    // الحالة
    this.initialized = false;
    this.ready = false;
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * التهيئة الرئيسية
   * ═══════════════════════════════════════════════════════════════════
   */
  async initialize() {
    console.log('🚀 بدء تهيئة المساعد الذكي...');

    try {
      // 1. تهيئة قاعدة البيانات
      await this._initializeDatabase();

      // 2. تحميل البيانات
      await this._loadData();

      // 3. تهيئة المحركات
      await this._initializeEngines();

      // 4. تهيئة الذكاء
      await this._initializeIntelligence();

      // 5. تهيئة الصوت
      await this._initializeAudio();

      // 6. تهيئة الواجهة
      await this._initializeUI();

      // 7. ربط المكونات
      this._connectComponents();

      this.initialized = true;
      this.ready = true;

      console.log('✅ اكتملت التهيئة بنجاح!');
      this._showWelcomeMessage();

      return true;

    } catch (error) {
      console.error('❌ خطأ في التهيئة:', error);
      this._showErrorMessage(error);
      return false;
    }
  }

  /**
   * تهيئة قاعدة البيانات
   */
  async _initializeDatabase() {
    console.log('📊 تهيئة قاعدة البيانات...');
    
    this.databaseManager = new DatabaseManager();
    await this.databaseManager.init();
    
    console.log('✅ قاعدة البيانات جاهزة');
  }

  /**
   * تحميل البيانات
   */
  async _loadData() {
    console.log('📥 تحميل البيانات...');
    
    this.dataLoader = new DataLoader();
    await this.dataLoader.initialize(this.databaseManager);
    
    const data = await this.dataLoader.loadAll((progress, name) => {
      console.log(`📦 ${name}: ${progress}%`);
      this._updateLoadingProgress(progress, name);
    });

    console.log('✅ اكتمل تحميل البيانات');
    return data;
  }

  /**
   * تهيئة المحركات
   */
  async _initializeEngines() {
    console.log('⚙️  تهيئة المحركات...');

    const data = this.dataLoader.getData();

    // محرك البحث المتجه
    this.vectorEngine = new VectorEngine();
    await this.vectorEngine.initialize(data.vectors);

    // محرك البحث النصي
    this.textSearchEngine = new TextSearchEngine();
    await this.textSearchEngine.initialize(data.databases);

    // المحرك الهجين
    this.hybridSearchEngine = new HybridSearchEngine();
    await this.hybridSearchEngine.initialize({
      vectorEngine: this.vectorEngine,
      textSearchEngine: this.textSearchEngine,
      intentClassifier: null,  // سيتم تعيينه لاحقاً
      contextManager: null,
      learningEngine: null
    });

    console.log('✅ المحركات جاهزة');
  }

  /**
   * تهيئة الذكاء
   */
  async _initializeIntelligence() {
    console.log('🧠 تهيئة الذكاء...');

    // مصنف النوايا
    this.intentClassifier = new IntentClassifier();

    // مدير السياق
    this.contextManager = new ContextManager();

    // محرك الاستنتاج
    this.reasoningEngine = new ReasoningEngine();

    // محرك التعلم
    this.learningEngine = new LearningEngine();
    await this.learningEngine.load();

    // مولد الإجابات
    this.answerGenerator = new AnswerGenerator();

    // ربط مع المحرك الهجين
    this.hybridSearchEngine.intentClassifier = this.intentClassifier;
    this.hybridSearchEngine.contextManager = this.contextManager;
    this.hybridSearchEngine.learningEngine = this.learningEngine;

    console.log('✅ الذكاء جاهز');
  }

  /**
   * تهيئة الصوت
   */
  async _initializeAudio() {
    console.log('🎤 تهيئة الصوت...');

    this.audioController = new AudioController();
    await this.audioController.initialize();

    // ربط الأحداث
    this.audioController.onUserSpoke = async (text) => {
      await this.handleUserInput(text);
    };

    console.log('✅ الصوت جاهز');
  }

  /**
   * تهيئة الواجهة
   */
  async _initializeUI() {
    console.log('🎨 تهيئة الواجهة...');

    // سيتم إنشاء ChatInterface في ملف منفصل
    // this.chatInterface = new ChatInterface();

    console.log('✅ الواجهة جاهزة');
  }

  /**
   * ربط المكونات
   */
  _connectComponents() {
    console.log('🔗 ربط المكونات...');
    // المكونات مربوطة بالفعل
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * معالجة المدخلات
   * ═══════════════════════════════════════════════════════════════════
   */
  async handleUserInput(query) {
    if (!this.ready) {
      console.warn('⚠️  النظام غير جاهز بعد');
      return;
    }

    console.log('💬 سؤال المستخدم:', query);

    try {
      // 1. إضافة للسياق
      this.contextManager.addMessage('user', query, { query });

      // 2. تحليل السؤال
      const intent = await this.intentClassifier.classify(query);
      const entities = await this.intentClassifier.extractEntities(query);

      const analyzedQuery = {
        original: query,
        intent: intent,
        entities: entities,
        context: this.contextManager.getRelevantContext(query)
      };

      console.log('🔍 التحليل:', analyzedQuery);

      // 3. البحث
      const results = await this.hybridSearchEngine.search(query, analyzedQuery);

      console.log('📊 النتائج:', results.length);

      // 4. الاستنتاج
      const inferences = await this.reasoningEngine.inferFromQuestion(
        query,
        analyzedQuery.context,
        entities
      );

      // 5. توليد الإجابة
      const answer = await this.answerGenerator.generateAnswer(results, analyzedQuery);

      console.log('✅ الإجابة:', answer.text);

      // 6. إضافة للسياق
      this.contextManager.addMessage('assistant', answer.text, {
        results: results,
        intent: intent,
        entities: entities
      });

      // 7. التعلم
      await this.learningEngine.learnFromInteraction(query, answer);

      // 8. الحفظ في قاعدة البيانات
      await this.databaseManager.saveInteraction(query, answer.text, answer.confidence);

      // 9. عرض الإجابة
      this._displayAnswer(answer);

      // 10. نطق الإجابة
      if (!this.audioController.state.speakerMuted) {
        this.audioController.speak(answer.text);
      }

      return answer;

    } catch (error) {
      console.error('❌ خطأ في معالجة السؤال:', error);
      this._showErrorMessage(error);
      return null;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * الواجهة
   * ═══════════════════════════════════════════════════════════════════
   */

  _updateLoadingProgress(progress, name) {
    const loadingElement = document.getElementById('loading-progress');
    if (loadingElement) {
      loadingElement.textContent = `${progress}% - ${name}`;
    }
  }

  _showWelcomeMessage() {
    const message = 'مرحباً! أنا مساعدك الذكي للجان الفنية. كيف يمكنني مساعدتك؟';
    console.log('👋', message);
    
    // عرض في الواجهة
    this._displayMessage('assistant', message);
  }

  _displayAnswer(answer) {
    this._displayMessage('assistant', answer.text);
  }

  _displayMessage(role, text) {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${role}-message`;
      messageDiv.textContent = text;
      chatContainer.appendChild(messageDiv);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  _showErrorMessage(error) {
    const message = `عذراً، حدث خطأ: ${error.message}`;
    this._displayMessage('system', message);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * APIs عامة
   * ═══════════════════════════════════════════════════════════════════
   */

  getStats() {
    return {
      database: this.databaseManager?.getStats(),
      vector: this.vectorEngine?.getStats(),
      learning: this.learningEngine?.getStats(),
      context: this.contextManager?.getStats()
    };
  }

  async reset() {
    console.log('🔄 إعادة تعيين النظام...');
    
    this.contextManager?.clearContext();
    await this.databaseManager?.clearCache();
    
    console.log('✅ تمت إعادة التعيين');
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════
 * تهيئة التطبيق عند تحميل الصفحة
 * ═══════════════════════════════════════════════════════════════════
 */
let app = null;

window.addEventListener('DOMContentLoaded', async () => {
  console.log('📱 تحميل التطبيق...');

  // إنشاء المساعد
  app = new CommitteeAssistant();

  // التهيئة
  await app.initialize();

  // ربط الأزرار
  setupUIControls();

  console.log('✅ التطبيق جاهز!');
});

/**
 * ربط عناصر الواجهة
 */
function setupUIControls() {
  // زر الإرسال
  const sendBtn = document.getElementById('send-btn');
  const inputField = document.getElementById('user-input');

  if (sendBtn && inputField) {
    sendBtn.addEventListener('click', () => {
      const query = inputField.value.trim();
      if (query) {
        app.handleUserInput(query);
        inputField.value = '';
      }
    });

    inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendBtn.click();
      }
    });
  }

  // زر المايك
  const micBtn = document.getElementById('mic-btn');
  if (micBtn && app.audioController) {
    micBtn.addEventListener('click', () => {
      app.audioController.toggleMic();
      micBtn.classList.toggle('muted');
    });
  }

  // زر السماعة
  const speakerBtn = document.getElementById('speaker-btn');
  if (speakerBtn && app.audioController) {
    speakerBtn.addEventListener('click', () => {
      app.audioController.toggleSpeaker();
      speakerBtn.classList.toggle('muted');
    });
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CommitteeAssistant;
}
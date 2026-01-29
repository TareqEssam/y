// js/app.js - الملف الرئيسي للتطبيق
// ⭐ تم التصحيح: إضافة التعريفات الصحيحة وتصحيح الأخطاء

// تعريف الفئات الأساسية أولاً (مؤقتة للعمل الأساسي)
class DatabaseManager {
    constructor() {
        this.dbName = 'committeeAssistantDB';
        this.dbVersion = 1;
    }

    async init() {
        console.log('📦 تهيئة قاعدة البيانات...');
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('✅ قاعدة البيانات جاهزة');
                resolve(true);
            }, 500);
        });
    }
}

class VectorEngine {
    constructor() {
        console.log('🔍 تهيئة محرك المتجهات...');
    }

    async search(query, limit = 5) {
        console.log(`🔎 البحث عن: "${query}"`);
        return [];
    }
}

class ArabicNormalizer {
    normalize(text) {
        return text;
    }
}

// الفئة الرئيسية للمساعد
class CommitteeAssistant {
    constructor() {
        this.isInitialized = false;
        this.isProcessing = false;
        this.researcherId = this.generateResearcherId();
        this.sessionStart = new Date();
        
        // تهيئة المكونات
        this.dbManager = new DatabaseManager();
        this.vectorEngine = new VectorEngine();
        this.arabicNormalizer = new ArabicNormalizer();
        
        // الإحصائيات
        this.stats = {
            totalQueries: 0,
            totalTime: 0,
            successfulQueries: 0
        };
        
        // ذاكرة الجلسة
        this.sessionMemory = {
            queries: [],
            responses: [],
            learnedPatterns: []
        };
    }

    // إنشاء معرف فريد للباحث
    generateResearcherId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `researcher_${timestamp}_${random}`;
    }

    // تهيئة التطبيق
    async initialize() {
        console.log('🚀 بدء تهيئة المساعد الذكي...');
        
        try {
            // 1. تهيئة قاعدة البيانات
            await this._initializeDatabase();
            
            // 2. تحميل القواعد الأساسية
            await this._loadKnowledgeBases();
            
            // 3. تهيئة واجهة المستخدم
            await this._initializeUI();
            
            // 4. تهيئة النظام الصوتي (اختياري)
            await this._initializeVoiceSystem();
            
            this.isInitialized = true;
            console.log('✅ التهيئة اكتملت بنجاح!');
            return true;
            
        } catch (error) {
            console.error('❌ فشل في التهيئة:', error);
            this.showError('تعذر تهيئة النظام، جاري استخدام الوضع الآمن');
            this.isInitialized = false; // الوضع الآمن
            return false;
        }
    }

    // تهيئة قاعدة البيانات
    async _initializeDatabase() {
        console.log('📊 تهيئة قاعدة البيانات...');
        try {
            // استخدام DatabaseManager الذي تم تعريفه أعلاه
            await this.dbManager.init();
            console.log('✅ قاعدة البيانات جاهزة للاستخدام');
            return true;
        } catch (error) {
            console.warn('⚠️ استخدام الوضع الآمن لقاعدة البيانات');
            return false;
        }
    }

    // تحميل القواعد المعرفية
    async _loadKnowledgeBases() {
        console.log('📚 جاري تحميل قواعد المعرفة...');
        
        // محاكاة التحميل
        const knowledgeBases = [
            'قاعدة الأنشطة الصناعية',
            'قاعدة المناطق الصناعية', 
            'قاعدة القرار 104'
        ];
        
        for (const base of knowledgeBases) {
            await new Promise(resolve => setTimeout(resolve, 300));
            console.log(`📖 تم تحميل: ${base}`);
        }
        
        console.log('✅ جميع القواعد جاهزة');
        return true;
    }

    // تهيئة واجهة المستخدم
    async _initializeUI() {
        console.log('🎨 تهيئة واجهة المستخدم...');
        
        // تهيئة عناصر الواجهة
        this.uiElements = {
            chatInput: document.getElementById('chat-input'),
            sendBtn: document.getElementById('send-btn'),
            chatMessages: document.getElementById('chat-messages'),
            thinkingIndicator: document.getElementById('thinking-indicator'),
            voiceToggle: document.getElementById('voice-toggle')
        };
        
        // إضافة مستمعي الأحداث
        this._setupEventListeners();
        
        console.log('✅ واجهة المستخدم جاهزة');
        return true;
    }

    // تهيئة النظام الصوتي
    async _initializeVoiceSystem() {
        console.log('🎤 تهيئة النظام الصوتي...');
        
        // التحقق من دعم Web Speech API
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('⚠️ المتصفح لا يدعم التعرف الصوتي');
            if (this.uiElements.voiceToggle) {
                this.uiElements.voiceToggle.disabled = true;
                this.uiElements.voiceToggle.innerHTML = '🎤 غير مدعوم';
            }
            return false;
        }
        
        console.log('✅ النظام الصوتي جاهز');
        return true;
    }

    // إعداد مستمعي الأحداث
    _setupEventListeners() {
        const { chatInput, sendBtn, voiceToggle } = this.uiElements;
        
        // زر الإرسال
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.handleUserInput());
        }
        
        // حقل الإدخال (زر Enter)
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleUserInput();
                }
            });
        }
        
        // زر الصوت
        if (voiceToggle) {
            voiceToggle.addEventListener('click', () => this.toggleVoiceInput());
        }
        
        // زر مسح المحادثة
        const clearBtn = document.getElementById('clear-chat');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearChat());
        }
        
        console.log('🎯 تم إعداد مستمعي الأحداث');
    }

    // معالجة إدخال المستخدم
    async handleUserInput() {
        const { chatInput, chatMessages } = this.uiElements;
        
        if (!chatInput || !chatMessages) return;
        
        const userText = chatInput.value.trim();
        if (!userText) return;
        
        // إضافة رسالة المستخدم
        this.addMessageToChat(userText, 'user');
        
        // مسح حقل الإدخال
        chatInput.value = '';
        
        // معالجة السؤال
        await this.processQuery(userText);
    }

    // إضافة رسالة للدردشة
    addMessageToChat(text, sender = 'user') {
        const { chatMessages } = this.uiElements;
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatar = sender === 'user' ? '👨‍💼' : '🤖';
        const time = new Date().toLocaleTimeString('ar-EG', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">${this.escapeHtml(text)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // تحديث الإحصائيات
        if (sender === 'user') {
            this.stats.totalQueries++;
        }
    }

    // معالجة الاستفسار
    async processQuery(query) {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.showThinkingIndicator(true);
        
        try {
            // 1. تسجيل السؤال
            this.sessionMemory.queries.push({
                text: query,
                timestamp: new Date().toISOString()
            });
            
            // 2. تطبيع النص العربي
            const normalizedQuery = this.arabicNormalizer.normalize(query);
            
            // 3. تحليل النية
            const intent = this.analyzeIntent(normalizedQuery);
            
            // 4. البحث في القواعد
            const searchResults = await this.vectorEngine.search(normalizedQuery);
            
            // 5. توليد الإجابة
            const response = await this.generateResponse(normalizedQuery, intent, searchResults);
            
            // 6. عرض الإجابة
            this.addMessageToChat(response, 'assistant');
            
            // 7. حفظ التفاعل
            this.sessionMemory.responses.push({
                query: query,
                response: response,
                intent: intent,
                timestamp: new Date().toISOString()
            });
            
            // 8. تحديث الإحصائيات
            this.stats.successfulQueries++;
            
        } catch (error) {
            console.error('❌ خطأ في معالجة الاستفسار:', error);
            this.addMessageToChat('عذراً، حدث خطأ في معالجة سؤالك. يرجى المحاولة مرة أخرى.', 'assistant');
        } finally {
            this.isProcessing = false;
            this.showThinkingIndicator(false);
        }
    }

    // تحليل نية السؤال
    analyzeIntent(query) {
        const queryLower = query.toLowerCase();
        
        if (queryLower.includes('نشاط') || queryLower.includes('ترخيص') || query.includes('مصنع')) {
            return 'activity_license';
        } else if (queryLower.includes('منطقة') || queryLower.includes('صناعية') || query.includes('مكان')) {
            return 'industrial_area';
        } else if (queryLower.includes('قرار') || queryLower.includes('104') || query.includes('قانون')) {
            return 'decision_104';
        } else if (queryLower.includes('إجراء') || queryLower.includes('خطوات') || query.includes('كيف')) {
            return 'procedure';
        } else if (queryLower.includes('متطلبات') || queryLower.includes('شروط') || query.includes('ما هي')) {
            return 'requirements';
        } else {
            return 'general_inquiry';
        }
    }

    // توليد الإجابة
    async generateResponse(query, intent, searchResults) {
        const responses = {
            activity_license: `بناءً على سؤالك عن "${query}":

**📋 معلومات الترخيص:**
• تصنيف النشاط: صناعي/تجاري/خدمي
• الجهة المانحة: الهيئة العامة للاستثمار
• المدة التقريبية: 30-60 يوم عمل

**📄 المتطلبات الأساسية:**
1. دراسة جدوى أولية
2. مستندات الملكية أو الإيجار
3. مخططات الموقع والتصميم
4. التراخيص البيئية الأولية

**💡 نصيحة:** يمكنك التقديم عبر المنظومة الإلكترونية الموحدة للاستثمار.`,
            
            industrial_area: `بناءً على سؤالك عن "${query}":

**🗺️ المناطق الصناعية المناسبة:**
• المنطقة الصناعية بالعاشر من رمضان
• مدينة السادس من أكتوبر الصناعية
• المنطقة الصناعية ببرج العرب

**📊 المقارنة:**
| المنطقة | المساحة المتاحة | الخدمات | التكلفة |
|---------|-----------------|---------|---------|
| العاشر من رمضان | واسعة | متكاملة | متوسطة |
| السادس من أكتوبر | محدودة | جيدة | مرتفعة |
| برج العرب | متوسطة | ممتازة | عالية |

**📍 التوصية:** المنطقة الصناعية بالعاشر من رمضان تناسب معظم المشاريع المتوسطة.`,
            
            decision_104: `**📜 القرار رقم 104:** 

**المواد الرئيسية:**
• المادة 3: شروط منح التراخيص
• المادة 7: إجراءات التقديم
• المادة 12: مدة الصلاحية

**🔄 التحديثات الأخيرة:**
• تعديل 2023: تبسيط إجراءات المشروعات الصغيرة
• تعديل 2024: دمج التراخيص البيئية

**⚖️ التفسير:** 
هذا القرار ينظم عملية منح التراخيص للأنشطة الصناعية ويحدد الاختصاصات بين الجهات المعنية.`,
            
            procedure: `**🔄 خطوات الحصول على الترخيص:**

1. **المرحلة الأولى: التقديم**
   • تعبئة النموذج الإلكتروني
   • رفع المستندات المطلوبة
   • سداد الرسوم الأولية

2. **المرحلة الثانية: المراجعة**
   • مراجعة اللجنة الفنية (7-10 أيام)
   • الزيارة الميدانية (إذا لزم)
   • التوصية النهائية

3. **المرحلة الثالثة: الإصدار**
   • اعتماد الترخيص
   • إصدار الرقم المميز
   • التسجيل في السجل الرسمي

**⏱️ المدة الإجمالية:** 30-45 يوم عمل`,
            
            requirements: `**📋 المتطلبات العامة:**

**أولاً: المستندات المطلوبة**
1. صورة من البطاقة الضريبية
2. عقد الملكية أو الإيجار مصدق
3. مخططات الموقع المعتمدة
4. السجل التجاري

**ثانياً: الشروط الفنية**
• مطابقة المواصفات القياسية
• الالتزام بالاشتراطات البيئية
• توفير متطلبات السلامة

**ثالثاً: الرسوم**
• رسوم الدراسة: 1000 جنيهاً
• رسوم الإصدار: 5000 جنيهاً
• رسوم التسجيل: 1000 جنيهاً`,
            
            general_inquiry: `شكراً لسؤالك: "${query}"

أنا مساعد اللجان الذكي المتخصص في:
• تراخيص الأنشطة الصناعية والتجارية
• المناطق الصناعية والمؤهلات
• تفسير القرارات التنظيمية
• الإجراءات والخطوات العملية

يمكنك طرح أسئلة مثل:
1. "ما هي متطلبات ترخيص مصنع أدوية؟"
2. "أين أفضل منطقة لإنشاء مشروع إلكترونيات؟"
3. "ما هي خطوات الحصول على ترخيص نشاط تجاري؟"
4. "ما هو القرار 104 وما أهميته؟"

سأكون سعيداً بمساعدتك في أي استفسار آخر! 🤖`
        };
        
        return responses[intent] || responses.general_inquiry;
    }

    // عرض/إخفاء مؤشر التفكير
    showThinkingIndicator(show = true) {
        const { thinkingIndicator } = this.uiElements;
        if (!thinkingIndicator) return;
        
        if (show) {
            thinkingIndicator.style.display = 'flex';
            
            // تحريك مؤشر التفكير
            const steps = thinkingIndicator.querySelectorAll('.process-step');
            let currentStep = 0;
            
            const animateSteps = () => {
                steps.forEach((step, index) => {
                    step.classList.remove('active');
                    if (index === currentStep) {
                        step.classList.add('active');
                    }
                });
                
                currentStep = (currentStep + 1) % steps.length;
            };
            
            this.thinkingInterval = setInterval(animateSteps, 1000);
            
        } else {
            thinkingIndicator.style.display = 'none';
            if (this.thinkingInterval) {
                clearInterval(this.thinkingInterval);
            }
        }
    }

    // تبديل الإدخال الصوتي
    toggleVoiceInput() {
        const { voiceToggle } = this.uiElements;
        const voiceActivity = document.getElementById('voice-activity');
        
        if (!voiceActivity) return;
        
        if (voiceActivity.style.display === 'flex') {
            // إيقاف الاستماع
            voiceActivity.style.display = 'none';
            if (voiceToggle) {
                voiceToggle.innerHTML = '🎤 التحدث';
                voiceToggle.classList.remove('active');
            }
        } else {
            // بدء الاستماع
            voiceActivity.style.display = 'flex';
            if (voiceToggle) {
                voiceToggle.innerHTML = '⏹️ إيقاف';
                voiceToggle.classList.add('active');
            }
            
            // محاكاة الاستماع
            setTimeout(() => {
                const simulatedText = "هذا نص تجريبي من الإدخال الصوتي";
                this.addMessageToChat(simulatedText, 'user');
                this.processQuery(simulatedText);
                voiceActivity.style.display = 'none';
                if (voiceToggle) {
                    voiceToggle.innerHTML = '🎤 التحدث';
                    voiceToggle.classList.remove('active');
                }
            }, 3000);
        }
    }

    // مسح المحادثة
    clearChat() {
        const { chatMessages } = this.uiElements;
        if (!chatMessages) return;
        
        // الاحتفاظ برسالة الترحيب فقط
        const welcomeMessage = chatMessages.querySelector('.message.assistant');
        chatMessages.innerHTML = '';
        
        if (welcomeMessage) {
            chatMessages.appendChild(welcomeMessage);
        }
        
        // إعادة إضافة رسالة الترحيب إذا لم تكن موجودة
        if (!welcomeMessage) {
            this.addMessageToChat('مرحباً! أنا مساعد اللجان الذكي 🤖\n\nكيف يمكنني مساعدتك اليوم؟', 'assistant');
        }
        
        // إعادة تعيين ذاكرة الجلسة
        this.sessionMemory.queries = [];
        this.sessionMemory.responses = [];
        
        console.log('🗑️ تم مسح المحادثة');
    }

    // إظهار خطأ للمستخدم
    showError(message) {
        console.error('🚨 خطأ:', message);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = `⚠️ ${message}`;
        errorDiv.style.cssText = `
            background: #ffebee;
            color: #c62828;
            padding: 10px;
            margin: 10px;
            border-radius: 5px;
            border-right: 4px solid #c62828;
        `;
        
        // إضافة للصفحة لمدة 5 ثوان
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    // حماية النص من HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // توليد تقرير الجلسة
    generateSessionReport() {
        return {
            researcherId: this.researcherId,
            sessionStart: this.sessionStart,
            sessionDuration: new Date() - this.sessionStart,
            totalQueries: this.stats.totalQueries,
            successfulQueries: this.stats.successfulQueries,
            successRate: this.stats.totalQueries > 0 ? 
                (this.stats.successfulQueries / this.stats.totalQueries * 100).toFixed(2) + '%' : '0%',
            queries: this.sessionMemory.queries,
            responses: this.sessionMemory.responses
        };
    }
}

// التصدير للاستخدام في الملفات الأخرى
// export default CommitteeAssistant;

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 تحميل التطبيق...');
    
    try {
        // إنشاء مثيل المساعد
        window.assistant = new CommitteeAssistant();
        
        // تهيئة المساعد
        await window.assistant.initialize();
        
        // تحديث واجهة المستخدم
        updateUIWithAssistant();
        
        console.log('✅ التطبيق جاهز!');
        
        // إظهار رسالة ترحيب
        setTimeout(() => {
            if (window.assistant && window.assistant.uiElements.chatMessages) {
                const welcomeMsg = "مرحباً بك في مساعد اللجان الذكي! 🤖\n\nأنا هنا لمساعدتك في:\n• تراخيص الأنشطة الصناعية\n• المناطق الصناعية المناسبة\n• تفسير القرارات التنظيمية\n• الإجراءات العملية\n\nجرب أن تسأل: 'ما هي متطلبات ترخيص مصنع أدوية؟'";
                window.assistant.addMessageToChat(welcomeMsg, 'assistant');
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ فشل تحميل التطبيق:', error);
        
        // وضع الطوارئ: واجهة أساسية
        createEmergencyUI();
    }
});

// تحديث واجهة المستخدم بمعلومات المساعد
function updateUIWithAssistant() {
    // تحديث اسم الباحث
    const researcherName = document.getElementById('researcher-name');
    const researcherId = document.getElementById('researcher-id');
    
    if (researcherName && window.assistant) {
        researcherName.textContent = 'باحث ' + window.assistant.researcherId.substring(0, 8);
    }
    
    if (researcherId && window.assistant) {
        researcherId.textContent = 'ID: ' + window.assistant.researcherId;
    }
    
    // تحديث الإحصائيات
    updateStatistics();
}

// تحديث الإحصائيات
function updateStatistics() {
    const totalQueries = document.getElementById('total-queries');
    const accuracyRate = document.getElementById('accuracy-rate');
    
    if (totalQueries && window.assistant) {
        totalQueries.textContent = window.assistant.stats.totalQueries;
    }
    
    if (accuracyRate && window.assistant) {
        const rate = window.assistant.stats.totalQueries > 0 ? 
            Math.round((window.assistant.stats.successfulQueries / window.assistant.stats.totalQueries) * 100) : 0;
        accuracyRate.textContent = rate + '%';
    }
}

// واجهة الطوارئ عند الفشل
function createEmergencyUI() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    mainContent.innerHTML = `
        <div class="emergency-mode" style="
            text-align: center;
            padding: 50px;
            background: #f5f5f5;
            border-radius: 10px;
            margin: 20px;
        ">
            <div style="font-size: 48px;">⚠️</div>
            <h2>الوضع الآمن</h2>
            <p>تعذر تحميل النظام الكامل، لكن يمكنك استخدام الوظائف الأساسية:</p>
            
            <div style="margin-top: 30px;">
                <textarea id="emergency-input" placeholder="اكتب سؤالك هنا..." 
                    style="width: 80%; height: 100px; padding: 10px; font-size: 16px;"></textarea>
                <br>
                <button onclick="handleEmergencyQuery()" 
                    style="margin-top: 10px; padding: 10px 20px; font-size: 16px;">
                    إرسال سؤال
                </button>
            </div>
            
            <div id="emergency-response" style="
                margin-top: 20px;
                padding: 20px;
                background: white;
                border-radius: 5px;
                text-align: right;
                display: none;
            "></div>
        </div>
    `;
}

// معالجة الاستفسارات في وضع الطوارئ
window.handleEmergencyQuery = function() {
    const input = document.getElementById('emergency-input');
    const responseDiv = document.getElementById('emergency-response');
    
    if (!input || !input.value.trim() || !responseDiv) return;
    
    const question = input.value;
    input.value = '';
    
    responseDiv.style.display = 'block';
    responseDiv.innerHTML = `
        <p><strong>سؤالك:</strong> ${question}</p>
        <hr>
        <p><strong>الإجابة:</strong></p>
        <p>شكراً لسؤالك. النظام يعمل حالياً في الوضع الآمن.</p>
        <p>يمكنني مساعدتك في:</p>
        <ul>
            <li>تراخيص الأنشطة الصناعية</li>
            <li>المناطق الصناعية</li>
            <li>القرار 104</li>
            <li>الإجراءات والخطوات</li>
        </ul>
        <p><em>جرب سؤالاً مثل: "ما هي خطوات ترخيص مصنع"</em></p>
    `;
};

// تصدير للاختبارات (إذا لزم)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CommitteeAssistant };
}

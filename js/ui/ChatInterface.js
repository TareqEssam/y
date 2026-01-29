/**
 * ChatInterface.js
 * واجهة المحادثة الرئيسية
 * تدير التفاعل بين المستخدم والنظام
 */

class ChatInterface {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.messages = [];
        this.isProcessing = false;
        this.currentSessionId = this.generateSessionId();
        
        this.initializeInterface();
        this.attachEventListeners();
    }

    /**
     * تهيئة الواجهة
     */
    initializeInterface() {
        this.container.innerHTML = `
            <div class="chat-container">
                <!-- رأس المحادثة -->
                <div class="chat-header">
                    <div class="header-title">
                        <span class="header-icon">🤖</span>
                        <h2>مساعد اللجنة الذكي</h2>
                    </div>
                    <div class="header-status">
                        <span class="status-indicator online"></span>
                        <span>متصل</span>
                    </div>
                </div>

                <!-- منطقة الرسائل -->
                <div class="chat-messages" id="chatMessages">
                    <div class="welcome-message">
                        <div class="welcome-icon">👋</div>
                        <h3>مرحباً بك في مساعد اللجنة الذكي</h3>
                        <p>أنا هنا لمساعدتك في الإجابة على أسئلة المستثمرين حول:</p>
                        <ul>
                            <li>الأنشطة الاقتصادية والتراخيص</li>
                            <li>المناطق الصناعية والمواقع</li>
                            <li>القرار 104 واللوائح</li>
                            <li>المتطلبات والإجراءات</li>
                        </ul>
                        <p class="welcome-hint">اكتب سؤالك أدناه وسأساعدك...</p>
                    </div>
                </div>

                <!-- مؤشر الكتابة -->
                <div class="typing-indicator hidden" id="typingIndicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <span>المساعد يفكر...</span>
                </div>

                <!-- منطقة الإدخال -->
                <div class="chat-input-area">
                    <div class="input-wrapper">
                        <button class="btn-attach" id="btnAttach" title="إرفاق ملف">
                            📎
                        </button>
                        <textarea 
                            id="chatInput" 
                            class="chat-input" 
                            placeholder="اكتب سؤالك هنا... (اضغط Enter للإرسال)"
                            rows="1"
                        ></textarea>
                        <button class="btn-send" id="btnSend" title="إرسال">
                            ➤
                        </button>
                    </div>
                    <div class="input-hints">
                        <span class="hint">💡 جرّب: "ما هي خطوات الترخيص لمصنع أدوية؟"</span>
                    </div>
                </div>

                <!-- شريط الأدوات السريعة -->
                <div class="quick-actions hidden" id="quickActions">
                    <button class="quick-action" data-action="activities">
                        📋 الأنشطة
                    </button>
                    <button class="quick-action" data-action="locations">
                        📍 المناطق
                    </button>
                    <button class="quick-action" data-action="decision104">
                        📜 القرار 104
                    </button>
                    <button class="quick-action" data-action="procedures">
                        ⚡ الإجراءات
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * ربط المستمعات
     */
    attachEventListeners() {
        // زر الإرسال
        const btnSend = document.getElementById('btnSend');
        btnSend.addEventListener('click', () => this.handleSend());

        // مربع الإدخال
        const chatInput = document.getElementById('chatInput');
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });

        // التوسع التلقائي لمربع النص
        chatInput.addEventListener('input', () => {
            this.autoResize(chatInput);
        });

        // زر الإرفاق
        const btnAttach = document.getElementById('btnAttach');
        btnAttach.addEventListener('click', () => this.handleAttachment());

        // الإجراءات السريعة
        const quickActions = document.querySelectorAll('.quick-action');
        quickActions.forEach(action => {
            action.addEventListener('click', (e) => {
                const actionType = e.target.getAttribute('data-action');
                this.handleQuickAction(actionType);
            });
        });
    }

    /**
     * معالجة الإرسال
     */
    async handleSend() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message || this.isProcessing) {
            return;
        }

        // إضافة رسالة المستخدم
        this.addMessage('user', message);
        input.value = '';
        this.autoResize(input);

        // بدء المعالجة
        this.isProcessing = true;
        this.showTypingIndicator();

        try {
            // إرسال للنظام الخلفي
            const response = await this.processQuery(message);

            // إخفاء المؤشر
            this.hideTypingIndicator();

            // إضافة رد المساعد
            this.addMessage('assistant', response.answer, response);

        } catch (error) {
            console.error('خطأ في معالجة السؤال:', error);
            this.hideTypingIndicator();
            this.addMessage('assistant', 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.', { error: true });
        }

        this.isProcessing = false;
    }

    /**
     * إضافة رسالة
     */
    addMessage(role, content, metadata = {}) {
        const messagesContainer = document.getElementById('chatMessages');
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${role}-message`;
        
        // إنشاء محتوى الرسالة
        messageElement.innerHTML = `
            <div class="message-avatar">
                ${role === 'user' ? '👤' : '🤖'}
            </div>
            <div class="message-content">
                <div class="message-text">${this.formatMessage(content)}</div>
                ${metadata.confidence ? this.renderConfidence(metadata.confidence) : ''}
                ${metadata.sources ? this.renderSources(metadata.sources) : ''}
                ${metadata.suggestions ? this.renderSuggestions(metadata.suggestions) : ''}
                <div class="message-time">${this.formatTime(new Date())}</div>
            </div>
            ${role === 'assistant' ? this.renderMessageActions(metadata) : ''}
        `;

        // إزالة رسالة الترحيب إذا كانت موجودة
        const welcomeMessage = messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        messagesContainer.appendChild(messageElement);
        
        // التمرير للأسفل
        this.scrollToBottom();

        // حفظ في السجل
        this.messages.push({
            role: role,
            content: content,
            metadata: metadata,
            timestamp: Date.now()
        });
    }

    /**
     * تنسيق الرسالة
     */
    formatMessage(content) {
        // تحويل النص إلى HTML مع دعم التنسيق
        let formatted = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // نص عريض
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // نص مائل
            .replace(/\n/g, '<br>') // أسطر جديدة
            .replace(/`(.*?)`/g, '<code>$1</code>'); // كود

        // تحويل القوائم
        if (formatted.includes('- ')) {
            formatted = formatted.replace(/^- (.+)$/gm, '<li>$1</li>');
            formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        }

        return formatted;
    }

    /**
     * عرض درجة الثقة
     */
    renderConfidence(confidence) {
        const level = confidence.level || 'medium';
        const score = (confidence.score * 100).toFixed(0);

        const colors = {
            very_high: '#4caf50',
            high: '#8bc34a',
            medium: '#ff9800',
            low: '#ff5722',
            very_low: '#f44336'
        };

        const labels = {
            very_high: 'ثقة عالية جداً',
            high: 'ثقة عالية',
            medium: 'ثقة متوسطة',
            low: 'ثقة منخفضة',
            very_low: 'ثقة منخفضة جداً'
        };

        return `
            <div class="confidence-indicator">
                <div class="confidence-bar" style="background: ${colors[level]}; width: ${score}%"></div>
                <span class="confidence-label">${labels[level]} (${score}%)</span>
            </div>
        `;
    }

    /**
     * عرض المصادر
     */
    renderSources(sources) {
        if (!sources || sources.length === 0) {
            return '';
        }

        const sourceItems = sources.map(source => `
            <div class="source-item">
                <span class="source-icon">📚</span>
                <span class="source-name">${source.name || source.source}</span>
                ${source.similarity ? `<span class="source-score">${(source.similarity * 100).toFixed(0)}%</span>` : ''}
            </div>
        `).join('');

        return `
            <div class="message-sources">
                <div class="sources-header">المصادر:</div>
                <div class="sources-list">${sourceItems}</div>
            </div>
        `;
    }

    /**
     * عرض الاقتراحات
     */
    renderSuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            return '';
        }

        const suggestionItems = suggestions.map(sugg => `
            <button class="suggestion-btn" data-suggestion="${sugg}">
                ${sugg}
            </button>
        `).join('');

        return `
            <div class="message-suggestions">
                <div class="suggestions-header">أسئلة مقترحة:</div>
                <div class="suggestions-list">${suggestionItems}</div>
            </div>
        `;
    }

    /**
     * عرض إجراءات الرسالة
     */
    renderMessageActions(metadata) {
        return `
            <div class="message-actions">
                <button class="action-btn" data-action="copy" title="نسخ">
                    📋
                </button>
                <button class="action-btn" data-action="feedback-good" title="مفيد">
                    👍
                </button>
                <button class="action-btn" data-action="feedback-bad" title="غير مفيد">
                    👎
                </button>
                <button class="action-btn" data-action="details" title="تفاصيل أكثر">
                    ℹ️
                </button>
            </div>
        `;
    }

    /**
     * تنسيق الوقت
     */
    formatTime(date) {
        return date.toLocaleTimeString('ar-EG', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    /**
     * التمرير للأسفل
     */
    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * إظهار مؤشر الكتابة
     */
    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.classList.remove('hidden');
        this.scrollToBottom();
    }

    /**
     * إخفاء مؤشر الكتابة
     */
    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.classList.add('hidden');
    }

    /**
     * التوسع التلقائي لمربع النص
     */
    autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }

    /**
     * معالجة المرفقات
     */
    handleAttachment() {
        alert('ميزة المرفقات قيد التطوير');
    }

    /**
     * معالجة الإجراءات السريعة
     */
    handleQuickAction(actionType) {
        const quickQueries = {
            activities: 'ما هي الأنشطة المتاحة؟',
            locations: 'أين المناطق الصناعية؟',
            decision104: 'ما هو القرار 104؟',
            procedures: 'ما هي خطوات الترخيص؟'
        };

        const query = quickQueries[actionType];
        if (query) {
            document.getElementById('chatInput').value = query;
            this.handleSend();
        }
    }

    /**
     * معالجة الاستعلام (الاتصال بالنظام الخلفي)
     */
    async processQuery(query) {
        // هذه الدالة ستتصل بالنظام الخلفي
        // في الوقت الحالي، سنعيد رداً تجريبياً

        // محاكاة تأخير الشبكة
        await this.delay(1000);

        return {
            answer: 'شكراً على سؤالك. هذا رد تجريبي. سيتم الاتصال بالنظام الخلفي قريباً.',
            confidence: {
                score: 0.85,
                level: 'high'
            },
            sources: [
                { name: 'قاعدة الأنشطة', source: 'activity_database', similarity: 0.92 },
                { name: 'القرار 104', source: 'decision104_database', similarity: 0.78 }
            ],
            suggestions: [
                'ما هي المستندات المطلوبة؟',
                'كم يستغرق الترخيص؟'
            ]
        };
    }

    /**
     * تأخير (للمحاكاة)
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * توليد معرف الجلسة
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * مسح المحادثة
     */
    clearChat() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = '';
        this.messages = [];
        this.initializeInterface();
    }

    /**
     * تصدير المحادثة
     */
    exportChat() {
        return {
            sessionId: this.currentSessionId,
            messages: this.messages,
            timestamp: Date.now()
        };
    }

    /**
     * إحصائيات
     */
    getStatistics() {
        return {
            sessionId: this.currentSessionId,
            messagesCount: this.messages.length,
            userMessages: this.messages.filter(m => m.role === 'user').length,
            assistantMessages: this.messages.filter(m => m.role === 'assistant').length
        };
    }
}

// تصدير
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatInterface;
}
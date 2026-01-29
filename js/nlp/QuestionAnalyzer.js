/**
 * QuestionAnalyzer.js
 * محلل الأسئلة - يحدد نوع السؤال وتعقيده ومكوناته
 */

class QuestionAnalyzer {
    constructor() {
        this.questionTypes = this.initializeQuestionTypes();
        this.complexityIndicators = this.initializeComplexityIndicators();
        this.analysisCache = new Map();
    }

    /**
     * الدالة الرئيسية: تحليل السؤال بالكامل
     */
    async analyzeQuestion(question) {
        // التحقق من الذاكرة المؤقتة
        const cacheKey = question.trim().toLowerCase();
        if (this.analysisCache.has(cacheKey)) {
            return this.analysisCache.get(cacheKey);
        }

        const analysis = {
            type: await this.identifyQuestionType(question),
            complexity: await this.assessComplexity(question),
            components: await this.extractQuestionComponents(question),
            intent: await this.identifyIntent(question),
            focus: await this.identifyFocus(question),
            scope: await this.determineScope(question),
            expectedAnswerType: await this.predictAnswerType(question),
            priority: await this.calculatePriority(question),
            metadata: {
                length: question.length,
                wordCount: question.split(/\s+/).length,
                hasNumbers: /\d/.test(question),
                hasLocation: await this.containsLocation(question),
                hasActivity: await this.containsActivity(question),
                hasLaw: await this.containsLaw(question)
            }
        };

        // حفظ في الذاكرة المؤقتة
        this.analysisCache.set(cacheKey, analysis);

        return analysis;
    }

    /**
     * تحديد نوع السؤال
     */
    async identifyQuestionType(question) {
        const types = [];

        // السؤال البسيط (سؤال واحد مباشر)
        if (this.isSimpleQuestion(question)) {
            types.push({ type: 'simple', confidence: 0.9 });
        }

        // السؤال المركب (عدة أسئلة في سؤال واحد)
        if (this.isCompoundQuestion(question)) {
            types.push({ type: 'compound', confidence: 0.85 });
        }

        // السؤال المتسلسل (يعتمد على سياق سابق)
        if (this.isSequentialQuestion(question)) {
            types.push({ type: 'sequential', confidence: 0.8 });
        }

        // سؤال مقارنة
        if (this.isComparisonQuestion(question)) {
            types.push({ type: 'comparison', confidence: 0.88 });
        }

        // سؤال إجرائي (كيف أفعل X؟)
        if (this.isProceduralQuestion(question)) {
            types.push({ type: 'procedural', confidence: 0.9 });
        }

        // سؤال معلوماتي (ما هو X؟)
        if (this.isInformationalQuestion(question)) {
            types.push({ type: 'informational', confidence: 0.85 });
        }

        // سؤال تحقق (هل X صحيح؟)
        if (this.isVerificationQuestion(question)) {
            types.push({ type: 'verification', confidence: 0.92 });
        }

        // سؤال استشاري (ما رأيك في X؟)
        if (this.isConsultativeQuestion(question)) {
            types.push({ type: 'consultative', confidence: 0.87 });
        }

        // ترتيب حسب الثقة والإرجاع
        return types.length > 0 
            ? types.sort((a, b) => b.confidence - a.confidence)[0]
            : { type: 'unknown', confidence: 0.5 };
    }

    /**
     * تقييم درجة تعقيد السؤال
     */
    async assessComplexity(question) {
        let complexityScore = 0;
        const indicators = [];

        // عدد الكلمات
        const wordCount = question.split(/\s+/).length;
        if (wordCount > 20) {
            complexityScore += 2;
            indicators.push('long_question');
        } else if (wordCount > 10) {
            complexityScore += 1;
            indicators.push('medium_length');
        }

        // وجود أكثر من سؤال
        const questionMarks = (question.match(/؟/g) || []).length;
        if (questionMarks > 1) {
            complexityScore += 3;
            indicators.push('multiple_questions');
        }

        // وجود أدوات الربط (و، أو، ثم، لكن)
        const conjunctions = question.match(/\s+(و|أو|ثم|لكن|أيضا|كذلك)\s+/g) || [];
        complexityScore += conjunctions.length * 1.5;
        if (conjunctions.length > 0) {
            indicators.push('has_conjunctions');
        }

        // وجود أرقام وقوانين
        if (/\d+/.test(question)) {
            complexityScore += 1;
            indicators.push('contains_numbers');
        }

        // وجود مواقع جغرافية
        if (await this.containsLocation(question)) {
            complexityScore += 1;
            indicators.push('contains_location');
        }

        // وجود أنشطة متعددة
        const activities = question.match(/صناعة|إنتاج|مصنع|معمل|تجارة|تخزين/g) || [];
        if (activities.length > 1) {
            complexityScore += 2;
            indicators.push('multiple_activities');
        }

        // وجود شروط (إذا، في حالة، عندما)
        const conditions = question.match(/إذا|في حالة|عندما|لو|بشرط/g) || [];
        if (conditions.length > 0) {
            complexityScore += 2;
            indicators.push('conditional');
        }

        // تحديد مستوى التعقيد
        let level;
        if (complexityScore <= 2) level = 'simple';
        else if (complexityScore <= 5) level = 'moderate';
        else if (complexityScore <= 8) level = 'complex';
        else level = 'very_complex';

        return {
            score: complexityScore,
            level: level,
            indicators: indicators,
            requiresDecomposition: complexityScore > 5
        };
    }

    /**
     * استخراج مكونات السؤال
     */
    async extractQuestionComponents(question) {
        const components = {
            mainQuestion: '',
            subQuestions: [],
            keywords: [],
            entities: [],
            conditions: [],
            expectedOutputs: []
        };

        // السؤال الرئيسي (إذا كان مركب)
        if (this.isCompoundQuestion(question)) {
            const parts = this.splitCompoundQuestion(question);
            components.mainQuestion = parts[0];
            components.subQuestions = parts.slice(1);
        } else {
            components.mainQuestion = question;
        }

        // الكلمات المفتاحية
        components.keywords = await this.extractKeywords(question);

        // الكيانات (ستحتاج EntityExtractor)
        // components.entities = await entityExtractor.extractEntities(question);

        // الشروط
        components.conditions = this.extractConditions(question);

        // ما المتوقع في الإجابة
        components.expectedOutputs = this.predictExpectedOutputs(question);

        return components;
    }

    /**
     * تحديد نية السؤال
     */
    async identifyIntent(question) {
        const intents = [];

        // نية الحصول على معلومات
        if (/ما هو|ما هي|أخبرني عن|معلومات عن/.test(question)) {
            intents.push({ intent: 'get_information', confidence: 0.9 });
        }

        // نية الحصول على إجراءات
        if (/كيف|خطوات|إجراءات|طريقة/.test(question)) {
            intents.push({ intent: 'get_procedure', confidence: 0.92 });
        }

        // نية التحقق
        if (/هل|أيمكن|هل يمكن|هل يجب/.test(question)) {
            intents.push({ intent: 'verify', confidence: 0.88 });
        }

        // نية المقارنة
        if (/الفرق بين|مقارنة|أفضل|الأنسب/.test(question)) {
            intents.push({ intent: 'compare', confidence: 0.87 });
        }

        // نية الحصول على توصية
        if (/أنصحني|اقترح|ما رأيك|توصية/.test(question)) {
            intents.push({ intent: 'get_recommendation', confidence: 0.85 });
        }

        // نية الحصول على قائمة
        if (/اذكر|عدد|قائمة|ما هي|ماهي/.test(question)) {
            intents.push({ intent: 'get_list', confidence: 0.86 });
        }

        // نية الحساب
        if (/احسب|كم|المساحة|التكلفة|الوقت/.test(question)) {
            intents.push({ intent: 'calculate', confidence: 0.9 });
        }

        return intents.length > 0
            ? intents.sort((a, b) => b.confidence - a.confidence)[0]
            : { intent: 'general_inquiry', confidence: 0.6 };
    }

    /**
     * تحديد محور السؤال (النقطة الرئيسية)
     */
    async identifyFocus(question) {
        const focuses = [];

        // التركيز على النشاط
        if (/نشاط|صناعة|إنتاج|مصنع/.test(question)) {
            focuses.push({ focus: 'activity', confidence: 0.9 });
        }

        // التركيز على الموقع
        if (/منطقة|محافظة|مدينة|موقع|مكان/.test(question)) {
            focuses.push({ focus: 'location', confidence: 0.88 });
        }

        // التركيز على الترخيص
        if (/ترخيص|رخصة|موافقة|تصريح/.test(question)) {
            focuses.push({ focus: 'license', confidence: 0.92 });
        }

        // التركيز على القانون
        if (/قانون|قرار|لائحة|تشريع/.test(question)) {
            focuses.push({ focus: 'law', confidence: 0.9 });
        }

        // التركيز على المتطلبات
        if (/متطلبات|شروط|مستندات|أوراق/.test(question)) {
            focuses.push({ focus: 'requirements', confidence: 0.87 });
        }

        // التركيز على الإجراءات
        if (/إجراءات|خطوات|كيفية|طريقة/.test(question)) {
            focuses.push({ focus: 'procedures', confidence: 0.89 });
        }

        // التركيز على التكلفة والوقت
        if (/تكلفة|سعر|وقت|مدة/.test(question)) {
            focuses.push({ focus: 'cost_time', confidence: 0.85 });
        }

        return focuses.length > 0
            ? focuses.sort((a, b) => b.confidence - a.confidence)
            : [{ focus: 'general', confidence: 0.5 }];
    }

    /**
     * تحديد نطاق السؤال
     */
    async determineScope(question) {
        let scope = 'specific';

        // نطاق عام (عن كل شيء)
        if (/كل|جميع|عامة|شامل/.test(question)) {
            scope = 'general';
        }

        // نطاق محدد (عن شيء واحد)
        else if (/هذا|هذه|المحدد|معين/.test(question)) {
            scope = 'specific';
        }

        // نطاق متوسط (عن فئة)
        else if (/الصناعات|الأنشطة|المناطق/.test(question)) {
            scope = 'categorical';
        }

        return {
            type: scope,
            breadth: scope === 'general' ? 'wide' : scope === 'specific' ? 'narrow' : 'medium'
        };
    }

    /**
     * التنبؤ بنوع الإجابة المتوقعة
     */
    async predictAnswerType(question) {
        // إجابة نعم/لا
        if (/^هل/.test(question.trim())) {
            return { type: 'yes_no', format: 'boolean' };
        }

        // إجابة رقمية
        if (/كم|احسب|عدد/.test(question)) {
            return { type: 'numeric', format: 'number' };
        }

        // قائمة
        if (/اذكر|عدد لي|قائمة|ما هي/.test(question)) {
            return { type: 'list', format: 'array' };
        }

        // خطوات
        if (/خطوات|إجراءات|كيفية/.test(question)) {
            return { type: 'steps', format: 'ordered_list' };
        }

        // تفصيلي
        if (/شرح|وضح|اشرح|تفاصيل/.test(question)) {
            return { type: 'detailed', format: 'paragraph' };
        }

        // مقارنة
        if (/الفرق|مقارنة|أفضل/.test(question)) {
            return { type: 'comparison', format: 'table' };
        }

        return { type: 'general', format: 'text' };
    }

    /**
     * حساب أولوية السؤال
     */
    async calculatePriority(question) {
        let priority = 50; // أولوية متوسطة

        // أسئلة عاجلة
        if (/عاجل|سريع|فوري|ضروري/.test(question)) {
            priority += 30;
        }

        // أسئلة مهمة
        if (/مهم|أساسي|حيوي/.test(question)) {
            priority += 20;
        }

        // أسئلة بسيطة (أولوية أعلى للإجابة السريعة)
        const complexity = await this.assessComplexity(question);
        if (complexity.level === 'simple') {
            priority += 10;
        }

        // أسئلة تحتاج بحث عميق (أولوية أقل)
        if (complexity.level === 'very_complex') {
            priority -= 10;
        }

        // تحديد المستوى
        let level;
        if (priority >= 80) level = 'urgent';
        else if (priority >= 60) level = 'high';
        else if (priority >= 40) level = 'medium';
        else level = 'low';

        return {
            score: Math.min(100, Math.max(0, priority)),
            level: level
        };
    }

    // ============= دوال مساعدة =============

    isSimpleQuestion(question) {
        const questionMarks = (question.match(/؟/g) || []).length;
        const wordCount = question.split(/\s+/).length;
        const hasConjunctions = /\s+(و|أو|ثم|لكن)\s+/.test(question);
        
        return questionMarks === 1 && wordCount <= 15 && !hasConjunctions;
    }

    isCompoundQuestion(question) {
        const questionMarks = (question.match(/؟/g) || []).length;
        const hasConjunctions = /\s+(و|أو|ثم|كذلك|أيضا)\s+/.test(question);
        
        return questionMarks > 1 || (questionMarks === 1 && hasConjunctions);
    }

    isSequentialQuestion(question) {
        return /أيضا|كذلك|وبعد ذلك|ثم|بالإضافة/.test(question);
    }

    isComparisonQuestion(question) {
        return /الفرق|مقارنة|أفضل|الأنسب|مقابل|ضد/.test(question);
    }

    isProceduralQuestion(question) {
        return /كيف|خطوات|إجراءات|طريقة|كيفية/.test(question);
    }

    isInformationalQuestion(question) {
        return /ما هو|ما هي|معلومات|تعريف|شرح/.test(question);
    }

    isVerificationQuestion(question) {
        return /^هل|أيمكن|هل يمكن|هل يجب|صحيح/.test(question);
    }

    isConsultativeQuestion(question) {
        return /أنصحني|اقترح|ما رأيك|توصية|رأي/.test(question);
    }

    splitCompoundQuestion(question) {
        // تقسيم الأسئلة المركبة
        const parts = [];
        
        // تقسيم على علامات الاستفهام
        if ((question.match(/؟/g) || []).length > 1) {
            return question.split(/؟/).filter(p => p.trim().length > 0).map(p => p + '؟');
        }

        // تقسيم على "و" أو "أو"
        const conjunctionPattern = /\s+(و|أو)\s+/;
        if (conjunctionPattern.test(question)) {
            return question.split(conjunctionPattern).filter(p => p.trim().length > 2);
        }

        return [question];
    }

    async extractKeywords(question) {
        const stopWords = ['ما', 'هو', 'هي', 'في', 'على', 'من', 'إلى', 'عن', 'هل', 'أن', 'التي', 'الذي'];
        const words = question.split(/\s+/)
            .map(w => w.replace(/[؟.,!]/g, ''))
            .filter(w => w.length > 2 && !stopWords.includes(w));
        
        return [...new Set(words)]; // إزالة التكرار
    }

    extractConditions(question) {
        const conditions = [];
        const conditionPatterns = [
            /إذا\s+(.+?)(?=\s+فإن|\s+ف)/g,
            /في حالة\s+(.+?)(?=\s+يجب|\s+ف)/g,
            /عندما\s+(.+?)(?=\s+يكون|\s+ف)/g,
            /بشرط\s+(.+?)(?=\s|$)/g
        ];

        for (const pattern of conditionPatterns) {
            const matches = question.matchAll(pattern);
            for (const match of matches) {
                conditions.push({
                    type: 'condition',
                    text: match[1].trim()
                });
            }
        }

        return conditions;
    }

    predictExpectedOutputs(question) {
        const outputs = [];

        if (/قائمة|اذكر|عدد/.test(question)) {
            outputs.push('list');
        }
        if (/جدول|مقارنة/.test(question)) {
            outputs.push('table');
        }
        if (/خريطة|موقع/.test(question)) {
            outputs.push('map');
        }
        if (/خطوات|إجراءات/.test(question)) {
            outputs.push('steps');
        }

        return outputs.length > 0 ? outputs : ['text'];
    }

    async containsLocation(question) {
        const governorates = ['القاهرة', 'الجيزة', 'الإسكندرية', 'المنيا', 'أسيوط'];
        return governorates.some(gov => question.includes(gov)) || /منطقة|محافظة/.test(question);
    }

    async containsActivity(question) {
        return /نشاط|صناعة|إنتاج|مصنع|معمل|تجارة/.test(question);
    }

    async containsLaw(question) {
        return /قانون|قرار|لائحة|104/.test(question);
    }

    /**
     * تهيئة أنواع الأسئلة
     */
    initializeQuestionTypes() {
        return [
            'simple', 'compound', 'sequential', 'comparison',
            'procedural', 'informational', 'verification', 'consultative'
        ];
    }

    /**
     * تهيئة مؤشرات التعقيد
     */
    initializeComplexityIndicators() {
        return {
            wordCount: { simple: 10, moderate: 20, complex: 30 },
            questionMarks: { simple: 1, moderate: 2, complex: 3 },
            conjunctions: { simple: 0, moderate: 2, complex: 4 }
        };
    }

    /**
     * مسح الذاكرة المؤقتة
     */
    clearCache() {
        this.analysisCache.clear();
    }

    /**
     * إحصائيات
     */
    getStatistics() {
        return {
            cacheSize: this.analysisCache.size,
            questionTypesCount: this.questionTypes.length
        };
    }
}

// تصدير
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestionAnalyzer;
}
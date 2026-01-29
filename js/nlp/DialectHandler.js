/**
 * DialectHandler.js
 * معالج اللهجة المصرية
 * متخصص في فهم وتحليل اللهجة المصرية العامية
 */

class DialectHandler {
    constructor() {
        this.egyptianPhrases = this.initializeEgyptianPhrases();
        this.commonExpressions = this.initializeCommonExpressions();
        this.contextualMeanings = this.initializeContextualMeanings();
        this.slangDictionary = this.initializeSlangDictionary();
    }

    /**
     * الدالة الرئيسية: تحليل النص العامي
     */
    async handleDialect(text) {
        const analysis = {
            originalText: text,
            dialectType: await this.detectDialectType(text),
            formalEquivalent: await this.convertToFormal(text),
            colloquialLevel: await this.assessColloquialLevel(text),
            regionalVariations: await this.detectRegionalVariations(text),
            slangTerms: await this.extractSlangTerms(text),
            intent: await this.understandColloquialIntent(text),
            emotionalTone: await this.detectEmotionalTone(text)
        };

        return analysis;
    }

    /**
     * كشف نوع اللهجة
     */
    async detectDialectType(text) {
        const indicators = {
            egyptian: 0,
            formal: 0,
            mixed: 0
        };

        // مؤشرات اللهجة المصرية
        const egyptianMarkers = [
            'ازاي', 'ايه', 'فين', 'امتى', 'ليه',
            'عايز', 'مش', 'كده', 'ده', 'دي',
            'علشان', 'بتاع', 'حاجة', 'اوي', 'قوي'
        ];

        for (const marker of egyptianMarkers) {
            if (text.includes(marker)) {
                indicators.egyptian += 1;
            }
        }

        // مؤشرات الفصحى
        const formalMarkers = [
            'كيف', 'ما', 'أين', 'متى', 'لماذا',
            'أريد', 'ليس', 'هكذا', 'هذا', 'هذه',
            'لأجل', 'شيء', 'جدا'
        ];

        for (const marker of formalMarkers) {
            if (text.includes(marker)) {
                indicators.formal += 1;
            }
        }

        // تحديد النوع
        const total = indicators.egyptian + indicators.formal;
        if (total === 0) {
            return { type: 'neutral', confidence: 0.5 };
        }

        if (indicators.egyptian > indicators.formal * 2) {
            return { type: 'egyptian', confidence: 0.9, score: indicators.egyptian };
        } else if (indicators.formal > indicators.egyptian * 2) {
            return { type: 'formal', confidence: 0.9, score: indicators.formal };
        } else {
            return { type: 'mixed', confidence: 0.7, egyptian: indicators.egyptian, formal: indicators.formal };
        }
    }

    /**
     * تحويل للفصحى مع الحفاظ على المعنى
     */
    async convertToFormal(text) {
        let formal = text;

        // 1. استبدال العبارات الكاملة أولاً
        for (const [colloquial, formalPhrase] of Object.entries(this.egyptianPhrases)) {
            const regex = new RegExp(colloquial, 'gi');
            formal = formal.replace(regex, formalPhrase);
        }

        // 2. استبدال التعبيرات الشائعة
        for (const [expr, meaning] of Object.entries(this.commonExpressions)) {
            const regex = new RegExp(expr, 'gi');
            formal = formal.replace(regex, meaning);
        }

        // 3. معالجة الأفعال العامية
        formal = this.convertColloquialVerbs(formal);

        // 4. معالجة أدوات الاستفهام
        formal = this.convertQuestionWords(formal);

        // 5. معالجة النفي
        formal = this.convertNegation(formal);

        return formal;
    }

    /**
     * تقييم مستوى العامية
     */
    async assessColloquialLevel(text) {
        let colloquialScore = 0;
        const features = [];

        // تشكيل الأفعال بطريقة عامية (بـ يعمل)
        if (/\bب[يتن]/.test(text)) {
            colloquialScore += 2;
            features.push('colloquial_verb_form');
        }

        // حذف الهمزة في نهاية الكلمات
        if (/ازاي|ايه|ليه/.test(text)) {
            colloquialScore += 2;
            features.push('dropped_hamza');
        }

        // استخدام "مش" بدلاً من "ليس"
        if (/\bمش\b/.test(text)) {
            colloquialScore += 1.5;
            features.push('mish_negation');
        }

        // الإشارة بـ "ده/دي"
        if (/\bده\b|\bدي\b|\bدول\b/.test(text)) {
            colloquialScore += 1.5;
            features.push('demonstrative_de_di');
        }

        // "علشان" بدلاً من "لأجل/لكي"
        if (/علشان/.test(text)) {
            colloquialScore += 1;
            features.push('colloquial_conjunction');
        }

        // "اوي/قوي" بدلاً من "جداً"
        if (/اوي|قوي/.test(text)) {
            colloquialScore += 1;
            features.push('colloquial_intensifier');
        }

        // تحديد المستوى
        let level;
        if (colloquialScore === 0) level = 'formal';
        else if (colloquialScore <= 2) level = 'slightly_colloquial';
        else if (colloquialScore <= 5) level = 'moderately_colloquial';
        else if (colloquialScore <= 8) level = 'highly_colloquial';
        else level = 'pure_dialect';

        return {
            score: colloquialScore,
            level: level,
            features: features
        };
    }

    /**
     * كشف التنوعات الإقليمية
     */
    async detectRegionalVariations(text) {
        const regions = {
            cairo: [], // قاهري
            alexandria: [], // إسكندراني
            delta: [], // دلتا
            upperEgypt: [] // صعيدي
        };

        // مؤشرات قاهرية
        if (/ازاي|كده|بتاع/.test(text)) {
            regions.cairo.push('standard_cairene');
        }

        // مؤشرات إسكندرانية
        if (/فين|ايه/.test(text)) {
            regions.alexandria.push('alexandrian_markers');
        }

        // مؤشرات صعيدية
        if (/يا|بقى|كدا/.test(text)) {
            regions.upperEgypt.push('upper_egyptian_markers');
        }

        // العثور على المنطقة الأكثر احتمالاً
        let dominantRegion = 'general';
        let maxCount = 0;

        for (const [region, markers] of Object.entries(regions)) {
            if (markers.length > maxCount) {
                maxCount = markers.length;
                dominantRegion = region;
            }
        }

        return {
            dominantRegion: dominantRegion,
            confidence: maxCount > 0 ? Math.min(0.9, maxCount * 0.3) : 0.5,
            details: regions
        };
    }

    /**
     * استخراج المصطلحات العامية
     */
    async extractSlangTerms(text) {
        const slangTerms = [];
        const words = text.split(/\s+/);

        for (const word of words) {
            const normalized = word.toLowerCase().replace(/[؟.,!]/g, '');
            if (this.slangDictionary[normalized]) {
                slangTerms.push({
                    slang: normalized,
                    formal: this.slangDictionary[normalized],
                    category: this.categorizeSlang(normalized)
                });
            }
        }

        return slangTerms;
    }

    /**
     * فهم النية من النص العامي
     */
    async understandColloquialIntent(text) {
        // أسئلة استفهامية
        if (/ازاي|فين|ليه|امتى|ايه/.test(text)) {
            if (/ازاي/.test(text)) return { intent: 'how_to', confidence: 0.9 };
            if (/فين/.test(text)) return { intent: 'location', confidence: 0.92 };
            if (/ليه/.test(text)) return { intent: 'reason', confidence: 0.88 };
            if (/امتى/.test(text)) return { intent: 'time', confidence: 0.9 };
            if (/ايه/.test(text)) return { intent: 'what', confidence: 0.85 };
        }

        // طلب المساعدة
        if (/عايز|محتاج|ممكن/.test(text)) {
            return { intent: 'request_help', confidence: 0.88 };
        }

        // تعبير عن مشكلة
        if (/مش عارف|مش فاهم|مش عاجبني/.test(text)) {
            return { intent: 'problem_expression', confidence: 0.85 };
        }

        // استفسار عام
        return { intent: 'general_inquiry', confidence: 0.6 };
    }

    /**
     * كشف النبرة العاطفية
     */
    async detectEmotionalTone(text) {
        const emotions = {
            positive: 0,
            negative: 0,
            neutral: 0,
            urgent: 0
        };

        // إيجابي
        const positiveWords = ['تمام', 'كويس', 'حلو', 'جميل', 'ممتاز', 'شكرا'];
        for (const word of positiveWords) {
            if (text.includes(word)) emotions.positive += 1;
        }

        // سلبي
        const negativeWords = ['مش كويس', 'مش تمام', 'وحش', 'صعب', 'مشكلة'];
        for (const word of negativeWords) {
            if (text.includes(word)) emotions.negative += 1;
        }

        // عاجل
        const urgentWords = ['دلوقتي', 'بسرعة', 'ضروري', 'مستعجل'];
        for (const word of urgentWords) {
            if (text.includes(word)) emotions.urgent += 2;
        }

        // تحديد النبرة السائدة
        const maxEmotion = Math.max(emotions.positive, emotions.negative, emotions.urgent);
        let dominantTone = 'neutral';

        if (emotions.positive === maxEmotion && maxEmotion > 0) {
            dominantTone = 'positive';
        } else if (emotions.negative === maxEmotion && maxEmotion > 0) {
            dominantTone = 'negative';
        } else if (emotions.urgent === maxEmotion && maxEmotion > 0) {
            dominantTone = 'urgent';
        }

        return {
            tone: dominantTone,
            scores: emotions,
            intensity: maxEmotion > 2 ? 'high' : maxEmoton > 0 ? 'medium' : 'low'
        };
    }

    // ============= دوال مساعدة =============

    /**
     * تحويل الأفعال العامية
     */
    convertColloquialVerbs(text) {
        const verbMap = {
            'بيعمل': 'يعمل',
            'بتعمل': 'تعمل',
            'بنعمل': 'نعمل',
            'بيقول': 'يقول',
            'بتقول': 'تقول',
            'بيروح': 'يذهب',
            'بتروح': 'تذهب',
            'بييجي': 'يأتي',
            'بتيجي': 'تأتي'
        };

        for (const [colloquial, formal] of Object.entries(verbMap)) {
            const regex = new RegExp(`\\b${colloquial}\\b`, 'g');
            text = text.replace(regex, formal);
        }

        return text;
    }

    /**
     * تحويل أدوات الاستفهام
     */
    convertQuestionWords(text) {
        const questionMap = {
            'ازاي': 'كيف',
            'ايه': 'ما',
            'فين': 'أين',
            'امتى': 'متى',
            'ليه': 'لماذا',
            'منين': 'من أين'
        };

        for (const [colloquial, formal] of Object.entries(questionMap)) {
            const regex = new RegExp(`\\b${colloquial}\\b`, 'g');
            text = text.replace(regex, formal);
        }

        return text;
    }

    /**
     * تحويل النفي
     */
    convertNegation(text) {
        return text
            .replace(/\bمش\b/g, 'ليس')
            .replace(/\bمفيش\b/g, 'ليس هناك')
            .replace(/\bمحدش\b/g, 'لا أحد')
            .replace(/\bمكانش\b/g, 'لم يكن');
    }

    /**
     * تصنيف المصطلح العامي
     */
    categorizeSlang(slangWord) {
        const categories = {
            question: ['ازاي', 'ايه', 'فين', 'امتى', 'ليه'],
            verb: ['عايز', 'بيعمل', 'بيقول', 'بيروح'],
            negation: ['مش', 'مفيش', 'محدش'],
            demonstrative: ['ده', 'دي', 'دول'],
            conjunction: ['علشان', 'بس', 'لكن'],
            intensifier: ['اوي', 'قوي', 'خالص']
        };

        for (const [category, words] of Object.entries(categories)) {
            if (words.includes(slangWord)) {
                return category;
            }
        }

        return 'general';
    }

    /**
     * تهيئة العبارات المصرية
     */
    initializeEgyptianPhrases() {
        return {
            'عايز اعرف': 'أريد أن أعرف',
            'ممكن تقولي': 'هل يمكنك إخباري',
            'ازاي اعمل': 'كيف أفعل',
            'فين اروح': 'أين أذهب',
            'محتاج اعمل ايه': 'ماذا يجب أن أفعل',
            'مش عارف': 'لا أعرف',
            'مش فاهم': 'لا أفهم',
            'يعني ايه': 'ما معنى',
            'ده معناه ايه': 'ما معنى هذا'
        };
    }

    /**
     * تهيئة التعبيرات الشائعة
     */
    initializeCommonExpressions() {
        return {
            'يا ريت': 'أتمنى',
            'على طول': 'مباشرة',
            'يلا': 'هيا',
            'خلاص': 'انتهى',
            'تمام': 'حسناً',
            'ماشي': 'موافق',
            'يا سلام': 'رائع',
            'معلش': 'عذراً'
        };
    }

    /**
     * تهيئة المعاني السياقية
     */
    initializeContextualMeanings() {
        return {
            'حاجة': {
                general: 'شيء',
                business: 'مسألة',
                question: 'موضوع'
            },
            'بتاع': {
                possession: 'خاص بـ',
                related: 'المتعلق بـ',
                type: 'نوع'
            }
        };
    }

    /**
     * تهيئة قاموس العامية
     */
    initializeSlangDictionary() {
        return {
            // أسئلة
            'ازاي': 'كيف',
            'ايه': 'ما',
            'فين': 'أين',
            'امتى': 'متى',
            'ليه': 'لماذا',
            'منين': 'من أين',
            
            // أفعال
            'عايز': 'أريد',
            'عاوز': 'أريد',
            'محتاج': 'أحتاج',
            'ممكن': 'يمكن',
            'لازم': 'يجب',
            
            // نفي
            'مش': 'ليس',
            'مفيش': 'ليس هناك',
            'محدش': 'لا أحد',
            
            // إشارة
            'ده': 'هذا',
            'دي': 'هذه',
            'دول': 'هؤلاء',
            'كده': 'هكذا',
            
            // ظروف
            'دلوقتي': 'الآن',
            'بكره': 'غداً',
            'امبارح': 'أمس',
            
            // صفات
            'كويس': 'جيد',
            'حلو': 'جميل',
            'وحش': 'سيء',
            
            // أخرى
            'علشان': 'لأجل',
            'بتاع': 'خاص بـ',
            'حاجة': 'شيء',
            'اوي': 'جداً',
            'قوي': 'جداً',
            'خالص': 'تماماً'
        };
    }

    /**
     * إحصائيات
     */
    getStatistics() {
        return {
            egyptianPhrasesCount: Object.keys(this.egyptianPhrases).length,
            commonExpressionsCount: Object.keys(this.commonExpressions).length,
            slangDictionarySize: Object.keys(this.slangDictionary).length
        };
    }
}

// تصدير
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DialectHandler;
}
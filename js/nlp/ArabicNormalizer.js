/**
 * ArabicNormalizer.js
 * محلل توحيد النصوص العربية
 * يوحد بين الفصحى والعامية المصرية والتشكيل المختلف
 */

class ArabicNormalizer {
    constructor() {
        this.normalizationRules = this.initializeNormalizationRules();
        this.dialectMap = this.initializeDialectMap();
        this.diacriticsPattern = /[\u064B-\u065F\u0670]/g; // التشكيل
        this.tatweel = /ـ/g; // التطويل
        this.normalizationCache = new Map();
    }

    /**
     * الدالة الرئيسية: توحيد النص العربي
     */
    async normalizeText(text) {
        if (!text || text.trim().length === 0) {
            return '';
        }

        // التحقق من الذاكرة المؤقتة
        const cacheKey = text.substring(0, 100);
        if (this.normalizationCache.has(cacheKey)) {
            return this.normalizationCache.get(cacheKey);
        }

        let normalized = text;

        // 1. إزالة التشكيل
        normalized = this.removeDiacritics(normalized);

        // 2. إزالة التطويل
        normalized = this.removeTatweel(normalized);

        // 3. توحيد الهمزات
        normalized = this.normalizeHamza(normalized);

        // 4. توحيد التاء المربوطة والهاء
        normalized = this.normalizeTa(normalized);

        // 5. توحيد الألف
        normalized = this.normalizeAlef(normalized);

        // 6. تحويل العامية للفصحى
        normalized = await this.dialectToFormal(normalized);

        // 7. توحيد المسافات
        normalized = this.normalizeSpaces(normalized);

        // 8. توحيد الأرقام
        normalized = this.normalizeNumbers(normalized);

        // 9. توحيد علامات الترقيم
        normalized = this.normalizePunctuation(normalized);

        // حفظ في الذاكرة المؤقتة
        this.normalizationCache.set(cacheKey, normalized);

        return normalized;
    }

    /**
     * إزالة التشكيل (الفتحة، الضمة، الكسرة، إلخ)
     */
    removeDiacritics(text) {
        return text.replace(this.diacriticsPattern, '');
    }

    /**
     * إزالة التطويل (ـ)
     */
    removeTatweel(text) {
        return text.replace(this.tatweel, '');
    }

    /**
     * توحيد الهمزات
     * أ، إ، آ → ا
     * ؤ → و
     * ئ → ي
     */
    normalizeHamza(text) {
        return text
            .replace(/[أإآ]/g, 'ا')
            .replace(/ؤ/g, 'و')
            .replace(/ئ/g, 'ي')
            .replace(/ء/g, ''); // حذف الهمزة المفردة في بعض الحالات
    }

    /**
     * توحيد التاء المربوطة والهاء
     * ة → ه (في نهاية الكلمة)
     */
    normalizeTa(text) {
        // التاء المربوطة في نهاية الكلمة
        return text.replace(/ة\b/g, 'ه');
    }

    /**
     * توحيد الألف
     * ى → ا (الألف المقصورة)
     */
    normalizeAlef(text) {
        return text.replace(/ى/g, 'ا');
    }

    /**
     * تحويل العامية المصرية للفصحى
     */
    async dialectToFormal(text) {
        let formal = text;

        // تطبيق قاموس التحويل من العامية للفصحى
        for (const [dialect, formal_word] of Object.entries(this.dialectMap)) {
            const regex = new RegExp(`\\b${dialect}\\b`, 'g');
            formal = formal.replace(regex, formal_word);
        }

        return formal;
    }

    /**
     * توحيد المسافات
     */
    normalizeSpaces(text) {
        return text
            .replace(/\s+/g, ' ') // مسافات متعددة → مسافة واحدة
            .trim(); // حذف المسافات من البداية والنهاية
    }

    /**
     * توحيد الأرقام (عربي → إنجليزي)
     */
    normalizeNumbers(text) {
        const arabicNumbers = {
            '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
            '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
        };

        for (const [arabic, english] of Object.entries(arabicNumbers)) {
            text = text.replace(new RegExp(arabic, 'g'), english);
        }

        return text;
    }

    /**
     * توحيد علامات الترقيم
     */
    normalizePunctuation(text) {
        return text
            .replace(/[""]/g, '"') // توحيد علامات الاقتباس
            .replace(/['']/g, "'") // توحيد الفاصلة العليا
            .replace(/،/g, ',') // الفاصلة العربية → إنجليزية
            .replace(/؛/g, ';') // الفاصلة المنقوطة العربية
            .replace(/\s*([؟!,.])\s*/g, '$1 ') // مسافة بعد علامات الترقيم
            .trim();
    }

    /**
     * تحويل النص لأحرف صغيرة (للمقارنة)
     */
    toLowerCase(text) {
        // العربية ليس بها أحرف كبيرة وصغيرة، لكن الإنجليزية نعم
        return text.toLowerCase();
    }

    /**
     * إزالة الكلمات الشائعة (Stop Words)
     */
    removeStopWords(text) {
        const stopWords = [
            'في', 'من', 'إلى', 'على', 'عن', 'هذا', 'هذه', 'ذلك', 'تلك',
            'الذي', 'التي', 'اللذان', 'اللتان', 'اللذين', 'اللتين', 'اللواتي',
            'ما', 'من', 'كل', 'كيف', 'أين', 'متى', 'لماذا',
            'هو', 'هي', 'هم', 'هن', 'أنا', 'نحن', 'أنت', 'أنتم', 'أنتن',
            'و', 'أو', 'لكن', 'ثم', 'إذا', 'لو', 'بل'
        ];

        const words = text.split(/\s+/);
        const filtered = words.filter(word => !stopWords.includes(word));
        return filtered.join(' ');
    }

    /**
     * استخراج الجذر (Stemming) - نسخة بسيطة
     */
    stem(word) {
        // إزالة البادئات الشائعة
        const prefixes = ['ال', 'و', 'ف', 'ب', 'ك', 'ل', 'لل'];
        for (const prefix of prefixes) {
            if (word.startsWith(prefix)) {
                word = word.substring(prefix.length);
            }
        }

        // إزالة اللواحق الشائعة
        const suffixes = ['ها', 'هم', 'هن', 'كم', 'كن', 'نا', 'ني', 'وا', 'ون', 'ين', 'ان', 'تان', 'تين'];
        for (const suffix of suffixes) {
            if (word.endsWith(suffix) && word.length > suffix.length + 2) {
                word = word.substring(0, word.length - suffix.length);
            }
        }

        return word;
    }

    /**
     * توحيد الكلمة (شامل)
     */
    async normalizeWord(word) {
        let normalized = word;
        
        // توحيد أساسي
        normalized = this.removeDiacritics(normalized);
        normalized = this.normalizeHamza(normalized);
        normalized = this.normalizeAlef(normalized);
        normalized = this.normalizeTa(normalized);

        // التحويل من عامية
        if (this.dialectMap[normalized]) {
            normalized = this.dialectMap[normalized];
        }

        return normalized;
    }

    /**
     * مقارنة نصين مع التوحيد
     */
    async areEqual(text1, text2) {
        const normalized1 = await this.normalizeText(text1);
        const normalized2 = await this.normalizeText(text2);
        return normalized1 === normalized2;
    }

    /**
     * مقارنة نصين مع درجة التشابه
     */
    async similarityScore(text1, text2) {
        const normalized1 = await this.normalizeText(text1);
        const normalized2 = await this.normalizeText(text2);

        // حساب تشابه بسيط (Levenshtein أو Jaccard)
        const words1 = new Set(normalized1.split(/\s+/));
        const words2 = new Set(normalized2.split(/\s+/));

        const intersection = new Set([...words1].filter(w => words2.has(w)));
        const union = new Set([...words1, ...words2]);

        return intersection.size / union.size;
    }

    /**
     * تنظيف النص من الرموز الخاصة
     */
    cleanText(text) {
        return text
            .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s,.!?؟]/g, '')
            .trim();
    }

    /**
     * تحليل نوع اللهجة
     */
    detectDialect(text) {
        const egyptianIndicators = ['ازاي', 'ايه', 'عايز', 'مش', 'كده', 'دي', 'ده'];
        const egyptianCount = egyptianIndicators.filter(word => text.includes(word)).length;

        if (egyptianCount >= 2) {
            return { dialect: 'egyptian', confidence: Math.min(0.9, egyptianCount * 0.3) };
        }

        return { dialect: 'formal', confidence: 0.8 };
    }

    /**
     * تهيئة قواعد التوحيد
     */
    initializeNormalizationRules() {
        return {
            hamza: { from: /[أإآ]/g, to: 'ا' },
            alef: { from: /ى/g, to: 'ا' },
            ta: { from: /ة\b/g, to: 'ه' }
        };
    }

    /**
     * تهيئة قاموس العامية → الفصحى
     */
    initializeDialectMap() {
        return {
            // أسئلة
            'ازاي': 'كيف',
            'ايه': 'ما',
            'فين': 'أين',
            'امتى': 'متى',
            'ليه': 'لماذا',
            
            // أفعال
            'عايز': 'أريد',
            'عاوز': 'أريد',
            'محتاج': 'أحتاج',
            'ممكن': 'يمكن',
            'لازم': 'يجب',
            
            // نفي
            'مش': 'ليس',
            'مفيش': 'ليس هناك',
            
            // إشارة
            'ده': 'هذا',
            'دي': 'هذه',
            'دول': 'هؤلاء',
            'كده': 'هكذا',
            
            // أماكن
            'هنا': 'هنا',
            'هناك': 'هناك',
            
            // أفعال شائعة
            'بيعمل': 'يعمل',
            'بيقول': 'يقول',
            'بيروح': 'يذهب',
            
            // كلمات عامية أخرى
            'علشان': 'لأجل',
            'بتاع': 'خاص ب',
            'حاجة': 'شيء',
            'حاجات': 'أشياء',
            'خالص': 'تماما',
            'اوي': 'جدا',
            'قوي': 'جدا',
            
            // مصطلحات استثمارية عامية
            'مكان': 'موقع',
            'شغل': 'عمل',
            'ورق': 'مستندات',
            'فلوس': 'أموال'
        };
    }

    /**
     * تحديث قاموس العامية (للتعلم)
     */
    updateDialectMap(dialectWord, formalWord) {
        this.dialectMap[dialectWord] = formalWord;
    }

    /**
     * مسح الذاكرة المؤقتة
     */
    clearCache() {
        this.normalizationCache.clear();
    }

    /**
     * إحصائيات
     */
    getStatistics() {
        return {
            cacheSize: this.normalizationCache.size,
            dialectMapSize: Object.keys(this.dialectMap).length,
            normalizationRules: Object.keys(this.normalizationRules).length
        };
    }

    /**
     * تصدير قاموس العامية (للنسخ الاحتياطي)
     */
    exportDialectMap() {
        return JSON.stringify(this.dialectMap, null, 2);
    }

    /**
     * استيراد قاموس عامية
     */
    importDialectMap(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.dialectMap = { ...this.dialectMap, ...imported };
            return true;
        } catch (e) {
            console.error('فشل استيراد قاموس العامية:', e);
            return false;
        }
    }
}

// تصدير
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArabicNormalizer;
}
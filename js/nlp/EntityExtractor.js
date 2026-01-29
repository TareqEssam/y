/**
 * EntityExtractor.js
 * مستخرج الكيانات من النصوص العربية
 * يستخرج: الأنشطة، الأماكن، القوانين، الأرقام، التواريخ
 */

class EntityExtractor {
    constructor() {
        this.activityPatterns = this.initializeActivityPatterns();
        this.locationPatterns = this.initializeLocationPatterns();
        this.lawPatterns = this.initializeLawPatterns();
        this.numberPatterns = this.initializeNumberPatterns();
        this.datePatterns = this.initializeDatePatterns();
        this.entityCache = new Map();
    }

    /**
     * الدالة الرئيسية: استخراج جميع الكيانات من النص
     */
    async extractEntities(text) {
        // التحقق من الذاكرة المؤقتة
        const cacheKey = this.generateCacheKey(text);
        if (this.entityCache.has(cacheKey)) {
            return this.entityCache.get(cacheKey);
        }

        const entities = {
            activities: await this.extractActivities(text),
            locations: await this.extractLocations(text),
            laws: await this.extractLaws(text),
            numbers: await this.extractNumbers(text),
            dates: await this.extractDates(text),
            measurements: await this.extractMeasurements(text),
            authorities: await this.extractAuthorities(text),
            confidence: 0
        };

        // حساب مستوى الثقة في الاستخراج
        entities.confidence = this.calculateExtractionConfidence(entities);

        // حفظ في الذاكرة المؤقتة
        this.entityCache.set(cacheKey, entities);

        return entities;
    }

    /**
     * استخراج الأنشطة الاقتصادية
     */
    async extractActivities(text) {
        const activities = [];
        
        // البحث عن الأنشطة الصريحة
        for (const pattern of this.activityPatterns) {
            const matches = text.matchAll(pattern.regex);
            for (const match of matches) {
                activities.push({
                    text: match[0],
                    type: pattern.type,
                    position: match.index,
                    confidence: pattern.confidence
                });
            }
        }

        // البحث عن الأنشطة الضمنية (من السياق)
        const implicitActivities = await this.extractImplicitActivities(text);
        activities.push(...implicitActivities);

        return this.deduplicateAndRank(activities);
    }

    /**
     * استخراج المواقع الجغرافية
     */
    async extractLocations(text) {
        const locations = [];

        // المحافظات المصرية
        const governorates = [
            'القاهرة', 'الجيزة', 'الإسكندرية', 'بورسعيد', 'السويس',
            'الدقهلية', 'الشرقية', 'القليوبية', 'كفر الشيخ', 'الغربية',
            'المنوفية', 'البحيرة', 'الإسماعيلية', 'دمياط', 'الفيوم',
            'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'أسوان',
            'الأقصر', 'البحر الأحمر', 'الوادي الجديد', 'مطروح',
            'شمال سيناء', 'جنوب سيناء'
        ];

        for (const gov of governorates) {
            const regex = new RegExp(`\\b${gov}\\b`, 'g');
            const matches = text.matchAll(regex);
            for (const match of matches) {
                locations.push({
                    text: match[0],
                    type: 'governorate',
                    position: match.index,
                    confidence: 0.95
                });
            }
        }

        // المناطق الصناعية
        const industrialZones = await this.extractIndustrialZones(text);
        locations.push(...industrialZones);

        // الأحياء والمدن
        const cities = await this.extractCities(text);
        locations.push(...cities);

        return this.deduplicateAndRank(locations);
    }

    /**
     * استخراج القوانين والقرارات
     */
    async extractLaws(text) {
        const laws = [];

        // قوانين بصيغة "قانون رقم X لسنة Y"
        const lawPattern = /قانون\s+رقم\s+(\d+)\s+لسنة\s+(\d{4})/g;
        const lawMatches = text.matchAll(lawPattern);
        for (const match of lawMatches) {
            laws.push({
                text: match[0],
                type: 'law',
                number: match[1],
                year: match[2],
                position: match.index,
                confidence: 0.98
            });
        }

        // قرارات بصيغة "قرار رقم X"
        const decisionPattern = /قرار\s+(?:رقم\s+)?(\d+)/g;
        const decisionMatches = text.matchAll(decisionPattern);
        for (const match of decisionMatches) {
            laws.push({
                text: match[0],
                type: 'decision',
                number: match[1],
                position: match.index,
                confidence: 0.95
            });
        }

        // القرار 104 تحديدًا (مهم جدًا)
        if (text.includes('104') || text.includes('قرار 104')) {
            laws.push({
                text: 'قرار 104',
                type: 'decision',
                number: '104',
                importance: 'high',
                confidence: 0.99
            });
        }

        return this.deduplicateAndRank(laws);
    }

    /**
     * استخراج الأرقام والقيم الرقمية
     */
    async extractNumbers(text) {
        const numbers = [];

        // الأرقام العربية والإنجليزية
        const numberPattern = /(?:\d+(?:[,\.]\d+)*|\d+)/g;
        const matches = text.matchAll(numberPattern);
        
        for (const match of matches) {
            const value = parseFloat(match[0].replace(/,/g, ''));
            numbers.push({
                text: match[0],
                value: value,
                position: match.index,
                type: this.inferNumberType(text, match.index, value)
            });
        }

        // الأرقام المكتوبة بالحروف
        const writtenNumbers = this.extractWrittenNumbers(text);
        numbers.push(...writtenNumbers);

        return numbers;
    }

    /**
     * استخراج التواريخ
     */
    async extractDates(text) {
        const dates = [];

        // تاريخ بصيغة DD/MM/YYYY
        const datePattern1 = /(\d{1,2})\/(\d{1,2})\/(\d{4})/g;
        let matches = text.matchAll(datePattern1);
        for (const match of matches) {
            dates.push({
                text: match[0],
                day: match[1],
                month: match[2],
                year: match[3],
                format: 'DD/MM/YYYY',
                position: match.index
            });
        }

        // تاريخ بصيغة "15 يناير 2024"
        const monthsArabic = {
            'يناير': 1, 'فبراير': 2, 'مارس': 3, 'إبريل': 4,
            'مايو': 5, 'يونيو': 6, 'يوليو': 7, 'أغسطس': 8,
            'سبتمبر': 9, 'أكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12
        };

        for (const [monthName, monthNum] of Object.entries(monthsArabic)) {
            const pattern = new RegExp(`(\\d{1,2})\\s+${monthName}\\s+(\\d{4})`, 'g');
            matches = text.matchAll(pattern);
            for (const match of matches) {
                dates.push({
                    text: match[0],
                    day: match[1],
                    month: monthNum,
                    year: match[2],
                    format: 'DD Month YYYY',
                    position: match.index
                });
            }
        }

        return dates;
    }

    /**
     * استخراج القياسات (متر مربع، فدان، إلخ)
     */
    async extractMeasurements(text) {
        const measurements = [];

        const measurementPatterns = [
            { regex: /(\d+(?:[,\.]\d+)?)\s*متر\s*مربع/g, unit: 'm²', type: 'area' },
            { regex: /(\d+(?:[,\.]\d+)?)\s*م²/g, unit: 'm²', type: 'area' },
            { regex: /(\d+(?:[,\.]\d+)?)\s*فدان/g, unit: 'فدان', type: 'area' },
            { regex: /(\d+(?:[,\.]\d+)?)\s*كيلومتر/g, unit: 'km', type: 'distance' },
            { regex: /(\d+(?:[,\.]\d+)?)\s*متر/g, unit: 'm', type: 'distance' },
            { regex: /(\d+(?:[,\.]\d+)?)\s*جنيه/g, unit: 'EGP', type: 'currency' },
            { regex: /(\d+(?:[,\.]\d+)?)\s*دولار/g, unit: 'USD', type: 'currency' }
        ];

        for (const pattern of measurementPatterns) {
            const matches = text.matchAll(pattern.regex);
            for (const match of matches) {
                measurements.push({
                    text: match[0],
                    value: parseFloat(match[1].replace(/,/g, '')),
                    unit: pattern.unit,
                    type: pattern.type,
                    position: match.index
                });
            }
        }

        return measurements;
    }

    /**
     * استخراج الجهات الحكومية
     */
    async extractAuthorities(text) {
        const authorities = [];

        const authorityKeywords = [
            'الهيئة العامة للاستثمار',
            'وزارة التجارة والصناعة',
            'الهيئة العامة للتنمية الصناعية',
            'وزارة البيئة',
            'المحافظة',
            'مجلس المدينة',
            'الحي',
            'اللجنة'
        ];

        for (const keyword of authorityKeywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = text.matchAll(regex);
            for (const match of matches) {
                authorities.push({
                    text: match[0],
                    type: 'authority',
                    position: match.index,
                    confidence: 0.9
                });
            }
        }

        return this.deduplicateAndRank(authorities);
    }

    /**
     * استخراج الأنشطة الضمنية من السياق
     */
    async extractImplicitActivities(text) {
        const implicit = [];
        
        // إذا ذكر "مصنع" أو "معمل"
        if (/مصنع|معمل/.test(text)) {
            implicit.push({
                text: 'نشاط صناعي',
                type: 'industrial',
                source: 'implicit',
                confidence: 0.7
            });
        }

        // إذا ذكر "مخزن" أو "تخزين"
        if (/مخزن|تخزين|مستودع/.test(text)) {
            implicit.push({
                text: 'نشاط تخزيني',
                type: 'storage',
                source: 'implicit',
                confidence: 0.75
            });
        }

        return implicit;
    }

    /**
     * استخراج المناطق الصناعية
     */
    async extractIndustrialZones(text) {
        const zones = [];

        const zonePatterns = [
            /منطقة\s+صناعية/g,
            /المنطقة\s+الصناعية/g,
            /منطقة\s+\w+\s+الصناعية/g,
            /المنطقة\s+الحرة/g
        ];

        for (const pattern of zonePatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                zones.push({
                    text: match[0],
                    type: 'industrial_zone',
                    position: match.index,
                    confidence: 0.9
                });
            }
        }

        return zones;
    }

    /**
     * استخراج المدن والأحياء
     */
    async extractCities(text) {
        const cities = [];
        
        // يمكن توسيع هذه القائمة
        const cityPatterns = [
            /مدينة\s+(\w+)/g,
            /حي\s+(\w+)/g,
            /منطقة\s+(\w+)/g
        ];

        for (const pattern of cityPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                cities.push({
                    text: match[0],
                    name: match[1],
                    type: 'city',
                    position: match.index,
                    confidence: 0.8
                });
            }
        }

        return cities;
    }

    /**
     * استخراج الأرقام المكتوبة بالحروف
     */
    extractWrittenNumbers(text) {
        const writtenNumbers = {
            'واحد': 1, 'اثنين': 2, 'ثلاثة': 3, 'أربعة': 4, 'خمسة': 5,
            'ستة': 6, 'سبعة': 7, 'ثمانية': 8, 'تسعة': 9, 'عشرة': 10,
            'عشرين': 20, 'ثلاثين': 30, 'أربعين': 40, 'خمسين': 50,
            'مائة': 100, 'ألف': 1000, 'مليون': 1000000
        };

        const numbers = [];
        for (const [word, value] of Object.entries(writtenNumbers)) {
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            const matches = text.matchAll(regex);
            for (const match of matches) {
                numbers.push({
                    text: match[0],
                    value: value,
                    position: match.index,
                    type: 'written'
                });
            }
        }

        return numbers;
    }

    /**
     * تحديد نوع الرقم من السياق
     */
    inferNumberType(text, position, value) {
        const before = text.substring(Math.max(0, position - 20), position);
        const after = text.substring(position, Math.min(text.length, position + 20));
        
        if (/مساحة|متر|فدان/.test(before + after)) return 'area';
        if (/سنة|عام/.test(after)) return 'year';
        if (/قانون|قرار/.test(before)) return 'law_number';
        if (/جنيه|دولار|ريال/.test(after)) return 'currency';
        if (/كيلو|طن/.test(after)) return 'weight';
        
        return 'generic';
    }

    /**
     * إزالة التكرار وترتيب حسب الثقة
     */
    deduplicateAndRank(entities) {
        const unique = new Map();
        
        for (const entity of entities) {
            const key = entity.text.trim().toLowerCase();
            if (!unique.has(key) || unique.get(key).confidence < entity.confidence) {
                unique.set(key, entity);
            }
        }

        return Array.from(unique.values())
            .sort((a, b) => (b.confidence || 0.5) - (a.confidence || 0.5));
    }

    /**
     * حساب مستوى الثقة في الاستخراج الكلي
     */
    calculateExtractionConfidence(entities) {
        let totalConfidence = 0;
        let count = 0;

        for (const category of Object.values(entities)) {
            if (Array.isArray(category)) {
                for (const entity of category) {
                    if (entity.confidence) {
                        totalConfidence += entity.confidence;
                        count++;
                    }
                }
            }
        }

        return count > 0 ? totalConfidence / count : 0.5;
    }

    /**
     * توليد مفتاح للذاكرة المؤقتة
     */
    generateCacheKey(text) {
        return text.trim().substring(0, 100).toLowerCase();
    }

    /**
     * تهيئة أنماط الأنشطة
     */
    initializeActivityPatterns() {
        return [
            { regex: /صناعة\s+\w+/g, type: 'manufacturing', confidence: 0.9 },
            { regex: /إنتاج\s+\w+/g, type: 'production', confidence: 0.85 },
            { regex: /مصنع\s+\w+/g, type: 'factory', confidence: 0.9 },
            { regex: /معمل\s+\w+/g, type: 'workshop', confidence: 0.85 },
            { regex: /تصنيع\s+\w+/g, type: 'manufacturing', confidence: 0.88 },
            { regex: /تجارة\s+\w+/g, type: 'trade', confidence: 0.8 },
            { regex: /تخزين\s+\w+/g, type: 'storage', confidence: 0.85 },
            { regex: /نشاط\s+\w+/g, type: 'activity', confidence: 0.75 }
        ];
    }

    /**
     * تهيئة أنماط المواقع
     */
    initializeLocationPatterns() {
        return [
            { regex: /محافظة\s+\w+/g, type: 'governorate', confidence: 0.95 },
            { regex: /منطقة\s+\w+/g, type: 'zone', confidence: 0.85 },
            { regex: /مدينة\s+\w+/g, type: 'city', confidence: 0.9 }
        ];
    }

    /**
     * تهيئة أنماط القوانين
     */
    initializeLawPatterns() {
        return [
            { regex: /قانون\s+رقم\s+\d+/g, type: 'law', confidence: 0.98 },
            { regex: /قرار\s+رقم\s+\d+/g, type: 'decision', confidence: 0.95 },
            { regex: /لائحة\s+\w+/g, type: 'regulation', confidence: 0.9 }
        ];
    }

    /**
     * تهيئة أنماط الأرقام
     */
    initializeNumberPatterns() {
        return [
            { regex: /\d+/g, type: 'numeric', confidence: 0.99 }
        ];
    }

    /**
     * تهيئة أنماط التواريخ
     */
    initializeDatePatterns() {
        return [
            { regex: /\d{1,2}\/\d{1,2}\/\d{4}/g, type: 'date', confidence: 0.95 }
        ];
    }

    /**
     * مسح الذاكرة المؤقتة
     */
    clearCache() {
        this.entityCache.clear();
    }

    /**
     * الحصول على إحصائيات الاستخراج
     */
    getStatistics() {
        return {
            cacheSize: this.entityCache.size,
            patternsCount: {
                activities: this.activityPatterns.length,
                locations: this.locationPatterns.length,
                laws: this.lawPatterns.length
            }
        };
    }
}

// تصدير الكلاس
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityExtractor;
}
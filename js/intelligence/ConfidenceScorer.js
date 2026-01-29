/**
 * ConfidenceScorer.js
 * حاسب مستوى الثقة في الإجابات
 * يقيّم جودة ودقة الإجابات ويعطي درجة ثقة
 */

class ConfidenceScorer {
    constructor() {
        this.weights = this.initializeWeights();
        this.scoringHistory = [];
    }

    /**
     * الدالة الرئيسية: حساب درجة الثقة
     */
    async calculateConfidence(query, results, context = {}) {
        const scores = {
            dataQuality: await this.scoreDataQuality(results),
            relevance: await this.scoreRelevance(query, results),
            completeness: await this.scoreCompleteness(results, context),
            consistency: await this.scoreConsistency(results),
            sourceReliability: await this.scoreSourceReliability(results),
            freshness: await this.scoreFreshness(results),
            contextAlignment: await this.scoreContextAlignment(query, results, context)
        };

        // حساب الدرجة الإجمالية المرجحة
        const overallScore = this.calculateWeightedScore(scores);

        // تحديد مستوى الثقة
        const confidenceLevel = this.determineConfidenceLevel(overallScore);

        const confidence = {
            score: overallScore,
            level: confidenceLevel,
            breakdown: scores,
            recommendation: this.generateRecommendation(overallScore, scores),
            shouldAnswer: overallScore >= 0.6,
            warnings: this.identifyWarnings(scores)
        };

        // حفظ في السجل
        this.scoringHistory.push({
            timestamp: Date.now(),
            query: query.substring(0, 50),
            confidence: confidence
        });

        return confidence;
    }

    /**
     * تقييم جودة البيانات
     */
    async scoreDataQuality(results) {
        if (!results || results.length === 0) {
            return { score: 0, reason: 'no_results' };
        }

        let qualityScore = 0;
        const factors = [];

        // عدد النتائج
        if (results.length >= 3) {
            qualityScore += 0.3;
            factors.push('sufficient_results');
        } else if (results.length >= 1) {
            qualityScore += 0.15;
            factors.push('minimal_results');
        }

        // درجة التشابه
        const avgSimilarity = this.calculateAverageSimilarity(results);
        if (avgSimilarity >= 0.8) {
            qualityScore += 0.4;
            factors.push('high_similarity');
        } else if (avgSimilarity >= 0.6) {
            qualityScore += 0.25;
            factors.push('moderate_similarity');
        } else {
            qualityScore += 0.1;
            factors.push('low_similarity');
        }

        // اكتمال المعلومات
        const completenessRatio = this.assessDataCompleteness(results);
        qualityScore += completenessRatio * 0.3;
        factors.push(`completeness_${(completenessRatio * 100).toFixed(0)}%`);

        return {
            score: Math.min(1, qualityScore),
            factors: factors,
            avgSimilarity: avgSimilarity,
            completenessRatio: completenessRatio
        };
    }

    /**
     * تقييم الملاءمة للسؤال
     */
    async scoreRelevance(query, results) {
        if (!results || results.length === 0) {
            return { score: 0, reason: 'no_results' };
        }

        let relevanceScore = 0;

        // استخراج الكلمات المفتاحية من السؤال
        const queryKeywords = this.extractKeywords(query);

        // التحقق من تطابق الكلمات المفتاحية
        for (const result of results) {
            const resultText = JSON.stringify(result).toLowerCase();
            let matchCount = 0;

            for (const keyword of queryKeywords) {
                if (resultText.includes(keyword.toLowerCase())) {
                    matchCount++;
                }
            }

            const matchRatio = queryKeywords.length > 0 ? matchCount / queryKeywords.length : 0;
            relevanceScore += matchRatio;
        }

        relevanceScore = results.length > 0 ? relevanceScore / results.length : 0;

        return {
            score: Math.min(1, relevanceScore),
            keywordMatchRatio: relevanceScore,
            queryKeywords: queryKeywords
        };
    }

    /**
     * تقييم اكتمال الإجابة
     */
    async scoreCompleteness(results, context) {
        if (!results || results.length === 0) {
            return { score: 0, reason: 'no_results' };
        }

        let completenessScore = 0;
        const missingElements = [];

        // التحقق من وجود العناصر الأساسية
        const hasActivity = results.some(r => r.activity || r.نشاط);
        const hasLocation = results.some(r => r.location || r.موقع || r.محافظة);
        const hasLaw = results.some(r => r.law || r.قانون || r.قرار);
        const hasRequirements = results.some(r => r.requirements || r.متطلبات || r.شروط);

        if (hasActivity) {
            completenessScore += 0.25;
        } else {
            missingElements.push('activity');
        }

        if (hasLocation) {
            completenessScore += 0.25;
        } else {
            missingElements.push('location');
        }

        if (hasLaw) {
            completenessScore += 0.25;
        } else {
            missingElements.push('legal_reference');
        }

        if (hasRequirements) {
            completenessScore += 0.25;
        } else {
            missingElements.push('requirements');
        }

        return {
            score: completenessScore,
            hasActivity: hasActivity,
            hasLocation: hasLocation,
            hasLaw: hasLaw,
            hasRequirements: hasRequirements,
            missingElements: missingElements
        };
    }

    /**
     * تقييم التناسق بين النتائج
     */
    async scoreConsistency(results) {
        if (!results || results.length <= 1) {
            return { score: 0.8, reason: 'single_or_no_result' };
        }

        let consistencyScore = 1.0;
        const conflicts = [];

        // مقارنة النتائج مع بعضها
        for (let i = 0; i < results.length - 1; i++) {
            for (let j = i + 1; j < results.length; j++) {
                const conflict = this.detectConflict(results[i], results[j]);
                if (conflict) {
                    conflicts.push(conflict);
                    consistencyScore -= 0.15;
                }
            }
        }

        return {
            score: Math.max(0, consistencyScore),
            conflictsCount: conflicts.length,
            conflicts: conflicts
        };
    }

    /**
     * تقييم موثوقية المصدر
     */
    async scoreSourceReliability(results) {
        if (!results || results.length === 0) {
            return { score: 0.5, reason: 'no_results' };
        }

        let reliabilityScore = 0;
        const sources = [];

        for (const result of results) {
            // مصادر موثوقة (قواعد البيانات الرسمية)
            if (result.source === 'activity_database') {
                reliabilityScore += 0.35;
                sources.push({ source: 'activity_database', reliability: 0.95 });
            } else if (result.source === 'industrial_database') {
                reliabilityScore += 0.35;
                sources.push({ source: 'industrial_database', reliability: 0.95 });
            } else if (result.source === 'decision104_database') {
                reliabilityScore += 0.3;
                sources.push({ source: 'decision104_database', reliability: 0.9 });
            } else {
                reliabilityScore += 0.2;
                sources.push({ source: result.source || 'unknown', reliability: 0.6 });
            }
        }

        reliabilityScore = results.length > 0 ? reliabilityScore / results.length : 0.5;

        return {
            score: Math.min(1, reliabilityScore),
            sources: sources,
            avgReliability: reliabilityScore
        };
    }

    /**
     * تقييم حداثة البيانات
     */
    async scoreFreshness(results) {
        if (!results || results.length === 0) {
            return { score: 0.7, reason: 'no_results' };
        }

        // في هذا المشروع، البيانات ثابتة (قوانين ولوائح)
        // لذا الحداثة عالية بشكل افتراضي
        // يمكن تطويرها لاحقاً بإضافة تواريخ للبيانات

        return {
            score: 0.9,
            reason: 'static_regulatory_data',
            note: 'البيانات من مصادر رسمية ثابتة'
        };
    }

    /**
     * تقييم التوافق مع السياق
     */
    async scoreContextAlignment(query, results, context) {
        if (!context || Object.keys(context).length === 0) {
            return { score: 0.7, reason: 'no_context' };
        }

        let alignmentScore = 0;

        // إذا كان هناك سياق سابق (محادثة مستمرة)
        if (context.previousQuery) {
            const contextualRelevance = this.assessContextualRelevance(query, context.previousQuery);
            alignmentScore += contextualRelevance * 0.5;
        }

        // إذا كان هناك تفضيلات مستخدم
        if (context.userPreferences) {
            const preferenceMatch = this.matchUserPreferences(results, context.userPreferences);
            alignmentScore += preferenceMatch * 0.5;
        }

        return {
            score: Math.min(1, alignmentScore),
            hasContext: true
        };
    }

    /**
     * حساب الدرجة الإجمالية المرجحة
     */
    calculateWeightedScore(scores) {
        let weightedSum = 0;
        let totalWeight = 0;

        for (const [category, weight] of Object.entries(this.weights)) {
            if (scores[category]) {
                weightedSum += scores[category].score * weight;
                totalWeight += weight;
            }
        }

        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    /**
     * تحديد مستوى الثقة
     */
    determineConfidenceLevel(score) {
        if (score >= 0.9) return 'very_high';
        if (score >= 0.75) return 'high';
        if (score >= 0.6) return 'medium';
        if (score >= 0.4) return 'low';
        return 'very_low';
    }

    /**
     * توليد توصية
     */
    generateRecommendation(overallScore, scores) {
        if (overallScore >= 0.75) {
            return {
                action: 'answer_confidently',
                message: 'يمكن الإجابة بثقة عالية'
            };
        } else if (overallScore >= 0.6) {
            return {
                action: 'answer_with_caution',
                message: 'يمكن الإجابة مع ذكر احتمالية عدم الدقة الكاملة'
            };
        } else if (overallScore >= 0.4) {
            return {
                action: 'answer_with_warnings',
                message: 'الإجابة مع تحذيرات واضحة وطلب التحقق'
            };
        } else {
            return {
                action: 'do_not_answer',
                message: 'يُفضل عدم الإجابة أو طلب توضيح السؤال'
            };
        }
    }

    /**
     * تحديد التحذيرات
     */
    identifyWarnings(scores) {
        const warnings = [];

        if (scores.dataQuality.score < 0.5) {
            warnings.push({ type: 'low_data_quality', message: 'جودة البيانات منخفضة' });
        }

        if (scores.relevance.score < 0.6) {
            warnings.push({ type: 'low_relevance', message: 'الملاءمة للسؤال منخفضة' });
        }

        if (scores.completeness.score < 0.5) {
            warnings.push({ type: 'incomplete', message: 'الإجابة غير مكتملة' });
        }

        if (scores.consistency.conflictsCount > 0) {
            warnings.push({ 
                type: 'inconsistency', 
                message: `تعارض في ${scores.consistency.conflictsCount} عنصر` 
            });
        }

        return warnings;
    }

    // ============= دوال مساعدة =============

    calculateAverageSimilarity(results) {
        if (!results || results.length === 0) return 0;
        
        const similarities = results.map(r => r.similarity || 0);
        return similarities.reduce((a, b) => a + b, 0) / similarities.length;
    }

    assessDataCompleteness(results) {
        if (!results || results.length === 0) return 0;

        let totalFields = 0;
        let filledFields = 0;

        for (const result of results) {
            const fields = Object.keys(result);
            totalFields += fields.length;

            for (const field of fields) {
                if (result[field] && result[field] !== '' && result[field] !== null) {
                    filledFields++;
                }
            }
        }

        return totalFields > 0 ? filledFields / totalFields : 0;
    }

    extractKeywords(text) {
        const stopWords = ['ما', 'هو', 'هي', 'في', 'على', 'من', 'إلى', 'عن', 'هل', 'كيف'];
        const words = text.toLowerCase().split(/\s+/)
            .map(w => w.replace(/[؟.,!]/g, ''))
            .filter(w => w.length > 2 && !stopWords.includes(w));
        
        return [...new Set(words)];
    }

    detectConflict(result1, result2) {
        // مثال: إذا كان نفس النشاط يتطلب جهات مختلفة
        if (result1.activity === result2.activity) {
            if (result1.authority && result2.authority && result1.authority !== result2.authority) {
                return {
                    type: 'authority_conflict',
                    activity: result1.activity,
                    authorities: [result1.authority, result2.authority]
                };
            }
        }

        return null;
    }

    assessContextualRelevance(currentQuery, previousQuery) {
        const currentWords = this.extractKeywords(currentQuery);
        const previousWords = this.extractKeywords(previousQuery);

        const commonWords = currentWords.filter(w => previousWords.includes(w));
        const relevance = currentWords.length > 0 ? commonWords.length / currentWords.length : 0;

        return relevance;
    }

    matchUserPreferences(results, preferences) {
        // مثال بسيط - يمكن تطويره
        let matchScore = 0.5;

        if (preferences.preferredRegion) {
            const hasPreferredRegion = results.some(r => 
                r.location === preferences.preferredRegion || 
                r.محافظة === preferences.preferredRegion
            );
            if (hasPreferredRegion) matchScore += 0.3;
        }

        return Math.min(1, matchScore);
    }

    /**
     * تهيئة الأوزان
     */
    initializeWeights() {
        return {
            dataQuality: 0.25,
            relevance: 0.2,
            completeness: 0.15,
            consistency: 0.15,
            sourceReliability: 0.15,
            freshness: 0.05,
            contextAlignment: 0.05
        };
    }

    /**
     * تحديث وزن معيار
     */
    updateWeight(category, weight) {
        if (this.weights.hasOwnProperty(category)) {
            this.weights[category] = Math.max(0, Math.min(1, weight));
            
            // إعادة توزيع الأوزان لتكون مجموعها 1
            const total = Object.values(this.weights).reduce((a, b) => a + b, 0);
            for (const key in this.weights) {
                this.weights[key] /= total;
            }
            
            return true;
        }
        return false;
    }

    /**
     * تصدير السجل
     */
    exportHistory() {
        return {
            scoringHistory: this.scoringHistory,
            weights: this.weights
        };
    }

    /**
     * إحصائيات
     */
    getStatistics() {
        if (this.scoringHistory.length === 0) {
            return {
                totalScorings: 0,
                avgConfidence: 0,
                distribution: {}
            };
        }

        const scores = this.scoringHistory.map(h => h.confidence.score);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        const distribution = {
            very_high: scores.filter(s => s >= 0.9).length,
            high: scores.filter(s => s >= 0.75 && s < 0.9).length,
            medium: scores.filter(s => s >= 0.6 && s < 0.75).length,
            low: scores.filter(s => s >= 0.4 && s < 0.6).length,
            very_low: scores.filter(s => s < 0.4).length
        };

        return {
            totalScorings: this.scoringHistory.length,
            avgConfidence: avgScore,
            distribution: distribution,
            weights: this.weights
        };
    }

    /**
     * مسح السجل
     */
    clearHistory() {
        this.scoringHistory = [];
    }
}

// تصدير
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfidenceScorer;
}
/**
 * ThresholdOptimizer.js
 * محسن العتبات الديناميكي
 * يتعلم ويحسن معايير البحث والثقة بناءً على الأداء
 */

class ThresholdOptimizer {
    constructor() {
        this.thresholds = this.initializeThresholds();
        this.performanceHistory = [];
        this.adjustmentHistory = [];
        this.learningRate = 0.1; // معدل التعلم
        this.minThreshold = 0.3; // الحد الأدنى للعتبة
        this.maxThreshold = 0.95; // الحد الأقصى للعتبة
    }

    /**
     * الدالة الرئيسية: تحسين العتبات
     */
    async optimizeThresholds(performanceData) {
        const optimizations = {
            similarityThreshold: await this.optimizeSimilarityThreshold(performanceData),
            confidenceThreshold: await this.optimizeConfidenceThreshold(performanceData),
            relevanceThreshold: await this.optimizeRelevanceThreshold(performanceData),
            complexityThreshold: await this.optimizeComplexityThreshold(performanceData),
            summary: await this.generateOptimizationSummary()
        };

        // حفظ التحسينات في السجل
        this.adjustmentHistory.push({
            timestamp: Date.now(),
            optimizations: optimizations,
            performanceImpact: await this.predictPerformanceImpact(optimizations)
        });

        return optimizations;
    }

    /**
     * تحسين عتبة التشابه (Similarity)
     */
    async optimizeSimilarityThreshold(performanceData) {
        const current = this.thresholds.similarity;
        let optimal = current;

        // تحليل الأداء
        const analysis = this.analyzePerformance(performanceData, 'similarity');

        // إذا كانت النتائج قليلة جداً (< 1 نتيجة في المتوسط)
        if (analysis.avgResultsCount < 1) {
            optimal = Math.max(this.minThreshold, current - (this.learningRate * 0.5));
            this.logAdjustment('similarity', current, optimal, 'too_few_results');
        }
        // إذا كانت النتائج كثيرة جداً (> 20 نتيجة)
        else if (analysis.avgResultsCount > 20) {
            optimal = Math.min(this.maxThreshold, current + (this.learningRate * 0.3));
            this.logAdjustment('similarity', current, optimal, 'too_many_results');
        }
        // إذا كانت جودة النتائج منخفضة
        else if (analysis.avgQualityScore < 0.6) {
            optimal = Math.min(this.maxThreshold, current + (this.learningRate * 0.2));
            this.logAdjustment('similarity', current, optimal, 'low_quality');
        }
        // إذا كان المستخدم يرفض النتائج كثيراً
        else if (analysis.rejectionRate > 0.4) {
            optimal = Math.min(this.maxThreshold, current + (this.learningRate * 0.4));
            this.logAdjustment('similarity', current, optimal, 'high_rejection');
        }

        this.thresholds.similarity = optimal;
        return {
            previous: current,
            optimized: optimal,
            change: optimal - current,
            reason: this.getOptimizationReason(analysis)
        };
    }

    /**
     * تحسين عتبة الثقة (Confidence)
     */
    async optimizeConfidenceThreshold(performanceData) {
        const current = this.thresholds.confidence;
        let optimal = current;

        const analysis = this.analyzePerformance(performanceData, 'confidence');

        // إذا كانت الإجابات غير دقيقة
        if (analysis.accuracyRate < 0.7) {
            optimal = Math.min(this.maxThreshold, current + (this.learningRate * 0.3));
            this.logAdjustment('confidence', current, optimal, 'low_accuracy');
        }
        // إذا كانت الإجابات دقيقة لكن قليلة
        else if (analysis.accuracyRate > 0.9 && analysis.answerRate < 0.5) {
            optimal = Math.max(this.minThreshold, current - (this.learningRate * 0.2));
            this.logAdjustment('confidence', current, optimal, 'high_precision_low_recall');
        }

        this.thresholds.confidence = optimal;
        return {
            previous: current,
            optimized: optimal,
            change: optimal - current,
            reason: this.getOptimizationReason(analysis)
        };
    }

    /**
     * تحسين عتبة الملاءمة (Relevance)
     */
    async optimizeRelevanceThreshold(performanceData) {
        const current = this.thresholds.relevance;
        let optimal = current;

        const analysis = this.analyzePerformance(performanceData, 'relevance');

        // إذا كانت النتائج غير ملائمة للسياق
        if (analysis.contextMatchRate < 0.6) {
            optimal = Math.min(this.maxThreshold, current + (this.learningRate * 0.25));
            this.logAdjustment('relevance', current, optimal, 'poor_context_match');
        }

        this.thresholds.relevance = optimal;
        return {
            previous: current,
            optimized: optimal,
            change: optimal - current,
            reason: this.getOptimizationReason(analysis)
        };
    }

    /**
     * تحسين عتبة التعقيد (Complexity)
     */
    async optimizeComplexityThreshold(performanceData) {
        const current = this.thresholds.complexity;
        let optimal = current;

        const analysis = this.analyzePerformance(performanceData, 'complexity');

        // إذا كانت الأسئلة البسيطة تُصنف كمعقدة
        if (analysis.falseComplexityRate > 0.3) {
            optimal = Math.min(this.maxThreshold, current + (this.learningRate * 0.15));
            this.logAdjustment('complexity', current, optimal, 'over_complicating');
        }
        // إذا كانت الأسئلة المعقدة تُصنف كبسيطة
        else if (analysis.missedComplexityRate > 0.3) {
            optimal = Math.max(this.minThreshold, current - (this.learningRate * 0.15));
            this.logAdjustment('complexity', current, optimal, 'under_complicating');
        }

        this.thresholds.complexity = optimal;
        return {
            previous: current,
            optimized: optimal,
            change: optimal - current,
            reason: this.getOptimizationReason(analysis)
        };
    }

    /**
     * تحليل الأداء
     */
    analyzePerformance(performanceData, metric) {
        if (!performanceData || performanceData.length === 0) {
            return this.getDefaultAnalysis();
        }

        const recentData = this.getRecentData(performanceData, 100); // آخر 100 استعلام

        return {
            avgResultsCount: this.calculateAverage(recentData.map(d => d.resultsCount || 0)),
            avgQualityScore: this.calculateAverage(recentData.map(d => d.qualityScore || 0.5)),
            rejectionRate: this.calculateRejectionRate(recentData),
            accuracyRate: this.calculateAccuracyRate(recentData),
            answerRate: this.calculateAnswerRate(recentData),
            contextMatchRate: this.calculateContextMatchRate(recentData),
            falseComplexityRate: this.calculateFalseComplexityRate(recentData),
            missedComplexityRate: this.calculateMissedComplexityRate(recentData),
            timestamp: Date.now()
        };
    }

    /**
     * التنبؤ بتأثير التحسينات على الأداء
     */
    async predictPerformanceImpact(optimizations) {
        let expectedImpact = {
            precision: 0,
            recall: 0,
            f1Score: 0,
            userSatisfaction: 0
        };

        // تأثير تغيير التشابه
        if (optimizations.similarityThreshold) {
            const change = optimizations.similarityThreshold.change;
            if (change > 0) {
                expectedImpact.precision += 0.05;
                expectedImpact.recall -= 0.03;
            } else {
                expectedImpact.precision -= 0.03;
                expectedImpact.recall += 0.05;
            }
        }

        // تأثير تغيير الثقة
        if (optimizations.confidenceThreshold) {
            const change = optimizations.confidenceThreshold.change;
            if (change > 0) {
                expectedImpact.precision += 0.07;
                expectedImpact.userSatisfaction += 0.05;
            } else {
                expectedImpact.recall += 0.04;
            }
        }

        // حساب F1 Score
        const precision = Math.max(0, Math.min(1, 0.8 + expectedImpact.precision));
        const recall = Math.max(0, Math.min(1, 0.75 + expectedImpact.recall));
        expectedImpact.f1Score = 2 * (precision * recall) / (precision + recall);

        return expectedImpact;
    }

    /**
     * توليد ملخص التحسينات
     */
    async generateOptimizationSummary() {
        return {
            totalAdjustments: this.adjustmentHistory.length,
            currentThresholds: { ...this.thresholds },
            recentPerformance: this.getRecentPerformanceMetrics(),
            recommendations: await this.generateRecommendations()
        };
    }

    /**
     * توليد توصيات
     */
    async generateRecommendations() {
        const recommendations = [];

        // توصية بناءً على التاريخ
        if (this.adjustmentHistory.length > 10) {
            const recentAdjustments = this.adjustmentHistory.slice(-10);
            const frequentAdjustments = this.findFrequentAdjustments(recentAdjustments);

            if (frequentAdjustments.similarity > 5) {
                recommendations.push({
                    type: 'similarity',
                    message: 'عتبة التشابه تتغير كثيراً - قد تحتاج لمراجعة جودة البيانات',
                    priority: 'high'
                });
            }
        }

        // توصية بناءً على الأداء
        const performance = this.getRecentPerformanceMetrics();
        if (performance.overallScore < 0.6) {
            recommendations.push({
                type: 'general',
                message: 'الأداء العام منخفض - يُنصح بمراجعة جميع العتبات',
                priority: 'critical'
            });
        }

        return recommendations;
    }

    // ============= دوال مساعدة =============

    getRecentData(data, count) {
        return data.slice(-count);
    }

    calculateAverage(numbers) {
        if (numbers.length === 0) return 0;
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }

    calculateRejectionRate(data) {
        const rejected = data.filter(d => d.userFeedback === 'rejected' || d.userFeedback === 'irrelevant').length;
        return data.length > 0 ? rejected / data.length : 0;
    }

    calculateAccuracyRate(data) {
        const accurate = data.filter(d => d.userFeedback === 'accurate' || d.userFeedback === 'helpful').length;
        return data.length > 0 ? accurate / data.length : 0.5;
    }

    calculateAnswerRate(data) {
        const answered = data.filter(d => d.hasAnswer === true).length;
        return data.length > 0 ? answered / data.length : 0.5;
    }

    calculateContextMatchRate(data) {
        const matched = data.filter(d => d.contextMatch === true).length;
        return data.length > 0 ? matched / data.length : 0.5;
    }

    calculateFalseComplexityRate(data) {
        const falseComplex = data.filter(d => d.classifiedAsComplex === true && d.actuallyComplex === false).length;
        return data.length > 0 ? falseComplex / data.length : 0;
    }

    calculateMissedComplexityRate(data) {
        const missed = data.filter(d => d.classifiedAsComplex === false && d.actuallyComplex === true).length;
        return data.length > 0 ? missed / data.length : 0;
    }

    logAdjustment(metric, oldValue, newValue, reason) {
        console.log(`[Threshold Optimizer] ${metric}: ${oldValue.toFixed(3)} → ${newValue.toFixed(3)} (${reason})`);
    }

    getOptimizationReason(analysis) {
        if (analysis.avgResultsCount < 1) return 'زيادة عدد النتائج';
        if (analysis.avgQualityScore < 0.6) return 'تحسين جودة النتائج';
        if (analysis.rejectionRate > 0.4) return 'تقليل الرفض من المستخدمين';
        if (analysis.accuracyRate < 0.7) return 'زيادة الدقة';
        return 'تحسين عام';
    }

    getDefaultAnalysis() {
        return {
            avgResultsCount: 5,
            avgQualityScore: 0.7,
            rejectionRate: 0.2,
            accuracyRate: 0.75,
            answerRate: 0.8,
            contextMatchRate: 0.7,
            falseComplexityRate: 0.1,
            missedComplexityRate: 0.1
        };
    }

    getRecentPerformanceMetrics() {
        if (this.performanceHistory.length === 0) {
            return { overallScore: 0.7 };
        }

        const recent = this.getRecentData(this.performanceHistory, 50);
        const avgScore = this.calculateAverage(recent.map(p => p.score || 0.7));

        return {
            overallScore: avgScore,
            dataPoints: recent.length
        };
    }

    findFrequentAdjustments(adjustments) {
        const counts = {
            similarity: 0,
            confidence: 0,
            relevance: 0,
            complexity: 0
        };

        for (const adj of adjustments) {
            if (adj.optimizations.similarityThreshold.change !== 0) counts.similarity++;
            if (adj.optimizations.confidenceThreshold.change !== 0) counts.confidence++;
            if (adj.optimizations.relevanceThreshold.change !== 0) counts.relevance++;
            if (adj.optimizations.complexityThreshold.change !== 0) counts.complexity++;
        }

        return counts;
    }

    /**
     * تهيئة العتبات الافتراضية
     */
    initializeThresholds() {
        return {
            similarity: 0.7,      // عتبة التشابه (Vector Similarity)
            confidence: 0.75,     // عتبة الثقة في الإجابة
            relevance: 0.65,      // عتبة الملاءمة للسياق
            complexity: 0.6,      // عتبة تصنيف التعقيد
            minResults: 1,        // الحد الأدنى للنتائج
            maxResults: 10        // الحد الأقصى للنتائج
        };
    }

    /**
     * الحصول على العتبات الحالية
     */
    getCurrentThresholds() {
        return { ...this.thresholds };
    }

    /**
     * تعيين عتبة يدوياً
     */
    setThreshold(metric, value) {
        if (this.thresholds.hasOwnProperty(metric)) {
            this.thresholds[metric] = Math.max(this.minThreshold, Math.min(this.maxThreshold, value));
            return true;
        }
        return false;
    }

    /**
     * إعادة تعيين العتبات للقيم الافتراضية
     */
    resetThresholds() {
        this.thresholds = this.initializeThresholds();
        this.adjustmentHistory = [];
    }

    /**
     * تسجيل أداء جديد
     */
    recordPerformance(performanceData) {
        this.performanceHistory.push({
            ...performanceData,
            timestamp: Date.now()
        });

        // الاحتفاظ بآخر 1000 سجل فقط
        if (this.performanceHistory.length > 1000) {
            this.performanceHistory = this.performanceHistory.slice(-1000);
        }
    }

    /**
     * تصدير السجل (للتحليل أو النسخ الاحتياطي)
     */
    exportHistory() {
        return {
            thresholds: this.thresholds,
            performanceHistory: this.performanceHistory,
            adjustmentHistory: this.adjustmentHistory
        };
    }

    /**
     * استيراد سجل
     */
    importHistory(data) {
        if (data.thresholds) this.thresholds = data.thresholds;
        if (data.performanceHistory) this.performanceHistory = data.performanceHistory;
        if (data.adjustmentHistory) this.adjustmentHistory = data.adjustmentHistory;
    }

    /**
     * إحصائيات
     */
    getStatistics() {
        return {
            currentThresholds: this.thresholds,
            performanceRecordsCount: this.performanceHistory.length,
            adjustmentsCount: this.adjustmentHistory.length,
            learningRate: this.learningRate
        };
    }
}

// تصدير
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThresholdOptimizer;
}
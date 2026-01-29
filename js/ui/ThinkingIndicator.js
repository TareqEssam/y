/**
 * ThinkingIndicator.js
 * مؤشر التفكير المتحرك
 * يظهر للمستخدم أثناء معالجة السؤال مع رسائل ديناميكية
 */

class ThinkingIndicator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.isVisible = false;
        this.currentStep = 0;
        this.thinkingSteps = this.initializeThinkingSteps();
        this.animationInterval = null;
        this.stepInterval = null;
    }

    /**
     * إظهار المؤشر
     */
    show(customSteps = null) {
        if (this.isVisible) {
            return;
        }

        this.isVisible = true;
        this.currentStep = 0;
        
        if (customSteps) {
            this.thinkingSteps = customSteps;
        }

        this.render();
        this.startAnimation();
        this.startStepProgress();
    }

    /**
     * إخفاء المؤشر
     */
    hide() {
        if (!this.isVisible) {
            return;
        }

        this.isVisible = false;
        this.stopAnimation();
        this.stopStepProgress();
        
        // إخفاء تدريجي
        if (this.container) {
            this.container.style.opacity = '0';
            setTimeout(() => {
                this.container.classList.add('hidden');
                this.container.style.opacity = '1';
            }, 300);
        }
    }

    /**
     * رسم المؤشر
     */
    render() {
        this.container.classList.remove('hidden');
        this.container.innerHTML = `
            <div class="thinking-indicator-wrapper">
                <div class="thinking-animation">
                    <div class="thinking-dot"></div>
                    <div class="thinking-dot"></div>
                    <div class="thinking-dot"></div>
                </div>
                <div class="thinking-text">
                    <span class="thinking-label">المساعد يفكر</span>
                    <span class="thinking-step" id="thinkingStep">${this.thinkingSteps[0]}</span>
                </div>
                <div class="thinking-progress">
                    <div class="progress-bar" id="progressBar" style="width: 0%"></div>
                </div>
            </div>
        `;
    }

    /**
     * بدء الأنيميشن
     */
    startAnimation() {
        // الأنيميشن يتم عن طريق CSS
        // يمكن إضافة أنيميشن JS إضافي هنا إذا لزم الأمر
    }

    /**
     * إيقاف الأنيميشن
     */
    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }

    /**
     * بدء تقدم الخطوات
     */
    startStepProgress() {
        this.currentStep = 0;
        this.updateStep();

        this.stepInterval = setInterval(() => {
            this.currentStep = (this.currentStep + 1) % this.thinkingSteps.length;
            this.updateStep();
            this.updateProgress();
        }, 2000); // تغيير الخطوة كل ثانيتين
    }

    /**
     * إيقاف تقدم الخطوات
     */
    stopStepProgress() {
        if (this.stepInterval) {
            clearInterval(this.stepInterval);
            this.stepInterval = null;
        }
    }

    /**
     * تحديث الخطوة
     */
    updateStep() {
        const stepElement = document.getElementById('thinkingStep');
        if (stepElement) {
            stepElement.style.opacity = '0';
            setTimeout(() => {
                stepElement.textContent = this.thinkingSteps[this.currentStep];
                stepElement.style.opacity = '1';
            }, 200);
        }
    }

    /**
     * تحديث شريط التقدم
     */
    updateProgress() {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            const progress = ((this.currentStep + 1) / this.thinkingSteps.length) * 100;
            progressBar.style.width = progress + '%';
        }
    }

    /**
     * تعيين خطوة محددة
     */
    setStep(stepText) {
        const stepElement = document.getElementById('thinkingStep');
        if (stepElement) {
            stepElement.textContent = stepText;
        }
    }

    /**
     * تعيين نسبة التقدم
     */
    setProgress(percentage) {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = Math.min(100, Math.max(0, percentage)) + '%';
        }
    }

    /**
     * تهيئة خطوات التفكير
     */
    initializeThinkingSteps() {
        return [
            '🔍 تحليل السؤال...',
            '🧠 فهم النية...',
            '📊 البحث في قواعد البيانات...',
            '🔗 ربط المعلومات...',
            '✅ التحقق من الدقة...',
            '📝 تجهيز الإجابة...'
        ];
    }

    /**
     * تعيين خطوات مخصصة
     */
    setCustomSteps(steps) {
        this.thinkingSteps = steps;
    }

    /**
     * إعادة تعيين للخطوات الافتراضية
     */
    resetSteps() {
        this.thinkingSteps = this.initializeThinkingSteps();
    }

    /**
     * نوع العملية (بسيط، متوسط، معقد)
     */
    setOperationType(type) {
        switch (type) {
            case 'simple':
                this.thinkingSteps = [
                    '🔍 تحليل السؤال...',
                    '📊 البحث...',
                    '📝 تجهيز الإجابة...'
                ];
                break;
            case 'complex':
                this.thinkingSteps = [
                    '🔍 تحليل السؤال المركب...',
                    '🧩 تقسيم الأسئلة الفرعية...',
                    '📊 البحث في عدة قواعد بيانات...',
                    '🔗 المراجعة المتبادلة...',
                    '🧠 الاستنتاج المنطقي...',
                    '✅ التحقق من الاتساق...',
                    '📝 صياغة إجابة شاملة...'
                ];
                break;
            default:
                this.resetSteps();
        }
    }
}

// تصدير
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThinkingIndicator;
}
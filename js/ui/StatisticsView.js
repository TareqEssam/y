/**
 * StatisticsView.js
 * عرض الإحصائيات - يعرض إحصائيات الاستخدام والأداء
 */

class StatisticsView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.stats = this.initializeStats();
    }

    render() {
        this.container.innerHTML = `
            <div class="statistics-panel">
                <h3>📊 إحصائيات الأداء</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.totalQueries}</div>
                        <div class="stat-label">إجمالي الاستعلامات</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.avgResponseTime}s</div>
                        <div class="stat-label">متوسط وقت الاستجابة</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.accuracy}%</div>
                        <div class="stat-label">معدل الدقة</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.satisfaction}%</div>
                        <div class="stat-label">رضا المستخدمين</div>
                    </div>
                </div>
            </div>
        `;
    }

    initializeStats() {
        return {
            totalQueries: 0,
            avgResponseTime: 0,
            accuracy: 0,
            satisfaction: 0
        };
    }

    updateStats(newStats) {
        this.stats = { ...this.stats, ...newStats };
        this.render();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatisticsView;
}

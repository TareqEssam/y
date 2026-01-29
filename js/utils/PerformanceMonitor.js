class PerformanceMonitor {
    constructor() {
        this.metrics = [];
    }
    recordMetric(name, value) {
        this.metrics.push({ name, value, timestamp: Date.now() });
    }
    getAverageMetric(name) {
        const filtered = this.metrics.filter(m => m.name === name);
        if (filtered.length === 0) return 0;
        return filtered.reduce((a, b) => a + b.value, 0) / filtered.length;
    }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = PerformanceMonitor; }
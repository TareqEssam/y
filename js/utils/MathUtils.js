/**
 * ═══════════════════════════════════════════════════════════════════
 * MathUtils.js
 * دوال رياضية مساعدة
 * ═══════════════════════════════════════════════════════════════════
 */

class MathUtils {
  /**
   * حساب تشابه Cosine بين متجهين
   */
  static cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * تطبيع متجه
   */
  static normalizeVector(vector) {
    if (!vector || !Array.isArray(vector)) return vector;

    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return norm === 0 ? vector : vector.map(val => val / norm);
  }

  /**
   * المتوسط
   */
  static mean(numbers) {
    if (!numbers || numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  /**
   * الوسيط
   */
  static median(numbers) {
    if (!numbers || numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  /**
   * الانحراف المعياري
   */
  static standardDeviation(numbers) {
    if (!numbers || numbers.length === 0) return 0;
    const avg = this.mean(numbers);
    const squareDiffs = numbers.map(n => Math.pow(n - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  /**
   * تقريب لعدد معين من المنازل
   */
  static round(number, decimals = 2) {
    return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * حساب النسبة المئوية
   */
  static percentage(value, total) {
    if (total === 0) return 0;
    return (value / total) * 100;
  }

  /**
   * Sigmoid function
   */
  static sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  /**
   * Softmax
   */
  static softmax(values) {
    const max = Math.max(...values);
    const exp = values.map(v => Math.exp(v - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map(e => e / sum);
  }

  /**
   * حساب المسافة الإقليدية
   */
  static euclideanDistance(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return Infinity;
    return Math.sqrt(
      vec1.reduce((sum, val, i) => sum + Math.pow(val - vec2[i], 2), 0)
    );
  }

  /**
   * تطبيع قيمة بين min و max
   */
  static normalize(value, min, max) {
    if (max === min) return 0;
    return (value - min) / (max - min);
  }

  /**
   * Clamp قيمة بين حدين
   */
  static clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MathUtils;
}
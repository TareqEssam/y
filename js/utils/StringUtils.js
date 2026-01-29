/**
 * ═══════════════════════════════════════════════════════════════════
 * StringUtils.js
 * دوال معالجة النصوص العربية والإنجليزية
 * ═══════════════════════════════════════════════════════════════════
 */

class StringUtils {
  /**
   * إزالة التشكيل من النص العربي
   */
  static removeDiacritics(text) {
    return text.replace(/[\u0617-\u061A\u064B-\u0652]/g, '');
  }

  /**
   * توحيد الهمزات
   */
  static normalizeArabic(text) {
    return text
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه');
  }

  /**
   * معالجة كاملة للنص العربي
   */
  static processArabicText(text) {
    let processed = text.toLowerCase();
    processed = this.removeDiacritics(processed);
    processed = this.normalizeArabic(processed);
    processed = processed.replace(/[^\w\s\u0600-\u06FF]/g, ' ');
    processed = processed.replace(/\s+/g, ' ').trim();
    return processed;
  }

  /**
   * تقصير النص
   */
  static truncate(text, maxLength, suffix = '...') {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * استخراج الأرقام من النص
   */
  static extractNumbers(text) {
    const matches = text.match(/\d+/g);
    return matches ? matches.map(Number) : [];
  }

  /**
   * تحويل إلى Title Case
   */
  static toTitleCase(text) {
    return text.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  /**
   * إزالة HTML tags
   */
  static stripHtml(html) {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  /**
   * تحويل إلى slug
   */
  static slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * عد الكلمات
   */
  static wordCount(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * تمييز الكلمات المطابقة
   */
  static highlight(text, query, className = 'highlight') {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, `<span class="${className}">$1</span>`);
  }

  /**
   * التحقق من وجود نص عربي
   */
  static hasArabic(text) {
    return /[\u0600-\u06FF]/.test(text);
  }

  /**
   * التحقق من وجود نص إنجليزي
   */
  static hasEnglish(text) {
    return /[a-zA-Z]/.test(text);
  }

  /**
   * عكس النص (للعربي RTL)
   */
  static reverse(text) {
    return text.split('').reverse().join('');
  }

  /**
   * إزالة مسافات زائدة
   */
  static normalizeWhitespace(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Escape HTML
   */
  static escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * مقارنة نصين (case insensitive)
   */
  static equals(str1, str2, caseInsensitive = true) {
    if (caseInsensitive) {
      return str1.toLowerCase() === str2.toLowerCase();
    }
    return str1 === str2;
  }

  /**
   * البحث عن نص
   */
  static contains(text, search, caseInsensitive = true) {
    if (caseInsensitive) {
      return text.toLowerCase().includes(search.toLowerCase());
    }
    return text.includes(search);
  }

  /**
   * تنسيق رقم مع فواصل
   */
  static formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * تحويل إلى camelCase
   */
  static toCamelCase(text) {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  }

  /**
   * تحويل من camelCase إلى kebab-case
   */
  static toKebabCase(text) {
    return text
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StringUtils;
}
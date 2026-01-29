class DateUtils {
    static formatDate(date) {
        return new Date(date).toLocaleDateString('ar-EG');
    }
    static getDaysDifference(date1, date2) {
        return Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));
    }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = DateUtils; }
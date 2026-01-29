class DataValidator {
    validateData(data) {
        return Array.isArray(data) && data.length > 0;
    }
    validateVector(vector) {
        return Array.isArray(vector) && vector.length > 0;
    }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = DataValidator; }
/**
 * IndexBuilder.js
 * بناء الفهارس - لتسريع البحث
 */

class IndexBuilder {
    constructor() {
        this.indexes = {};
    }

    async buildIndex(data, fields) {
        const index = {};
        for (const item of data) {
            for (const field of fields) {
                const value = item[field];
                if (value) {
                    const key = value.toString().toLowerCase();
                    if (!index[key]) index[key] = [];
                    index[key].push(item);
                }
            }
        }
        return index;
    }

    async buildFullTextIndex(data, textFields) {
        const index = new Map();
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            for (const field of textFields) {
                const text = item[field];
                if (text) {
                    const words = text.toLowerCase().split(/\s+/);
                    for (const word of words) {
                        if (word.length > 2) {
                            if (!index.has(word)) index.set(word, []);
                            index.get(word).push(i);
                        }
                    }
                }
            }
        }
        return index;
    }

    getIndex(name) {
        return this.indexes[name];
    }

    saveIndex(name, index) {
        this.indexes[name] = index;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = IndexBuilder;
}
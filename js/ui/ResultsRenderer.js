/**
 * ResultsRenderer.js
 * عارض النتائج - يعرض البيانات في أشكال مختلفة (جداول، خرائط، رسوم)
 */

class ResultsRenderer {
    constructor() {
        this.renderers = {
            table: this.renderTable.bind(this),
            list: this.renderList.bind(this),
            map: this.renderMap.bind(this),
            chart: this.renderChart.bind(this),
            cards: this.renderCards.bind(this)
        };
    }

    /**
     * الدالة الرئيسية: عرض النتائج
     */
    render(data, type = 'list', container) {
        const renderer = this.renderers[type] || this.renderers.list;
        return renderer(data, container);
    }

    /**
     * عرض كجدول
     */
    renderTable(data, container) {
        if (!Array.isArray(data) || data.length === 0) {
            return '<p class="no-data">لا توجد بيانات لعرضها</p>';
        }

        const headers = Object.keys(data[0]);
        const tableHTML = `
            <div class="table-container">
                <table class="results-table">
                    <thead>
                        <tr>
                            ${headers.map(h => `<th>${this.translateHeader(h)}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                ${headers.map(h => `<td>${row[h] || '-'}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        if (container) {
            container.innerHTML = tableHTML;
        }
        return tableHTML;
    }

    /**
     * عرض كقائمة
     */
    renderList(data, container) {
        if (!Array.isArray(data) || data.length === 0) {
            return '<p class="no-data">لا توجد نتائج</p>';
        }

        const listHTML = `
            <div class="results-list">
                ${data.map((item, index) => `
                    <div class="list-item">
                        <div class="item-number">${index + 1}</div>
                        <div class="item-content">
                            ${this.renderListItem(item)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        if (container) {
            container.innerHTML = listHTML;
        }
        return listHTML;
    }

    /**
     * عرض عنصر القائمة
     */
    renderListItem(item) {
        return Object.entries(item)
            .map(([key, value]) => {
                if (key === 'similarity' || key === 'score') {
                    return '';
                }
                return `<div class="item-field"><strong>${this.translateHeader(key)}:</strong> ${value}</div>`;
            })
            .join('');
    }

    /**
     * عرض كخريطة
     */
    renderMap(data, container) {
        // خريطة بسيطة - يمكن التطوير لدمج Leaflet أو Google Maps
        const mapHTML = `
            <div class="map-container">
                <div class="map-placeholder">
                    🗺️ <p>خريطة المواقع (قيد التطوير)</p>
                </div>
            </div>
        `;

        if (container) {
            container.innerHTML = mapHTML;
        }
        return mapHTML;
    }

    /**
     * عرض كرسم بياني
     */
    renderChart(data, container) {
        // رسم بياني بسيط - يمكن التطوير لدمج Chart.js
        const chartHTML = `
            <div class="chart-container">
                <div class="chart-placeholder">
                    📊 <p>رسم بياني (قيد التطوير)</p>
                </div>
            </div>
        `;

        if (container) {
            container.innerHTML = chartHTML;
        }
        return chartHTML;
    }

    /**
     * عرض كبطاقات
     */
    renderCards(data, container) {
        if (!Array.isArray(data) || data.length === 0) {
            return '<p class="no-data">لا توجد بطاقات لعرضها</p>';
        }

        const cardsHTML = `
            <div class="cards-grid">
                ${data.map(item => `
                    <div class="result-card">
                        <div class="card-header">
                            ${item.title || item.name || 'بطاقة'}
                        </div>
                        <div class="card-body">
                            ${this.renderCardContent(item)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        if (container) {
            container.innerHTML = cardsHTML;
        }
        return cardsHTML;
    }

    /**
     * عرض محتوى البطاقة
     */
    renderCardContent(item) {
        return Object.entries(item)
            .filter(([key]) => key !== 'title' && key !== 'name')
            .map(([key, value]) => `
                <div class="card-field">
                    <span class="field-label">${this.translateHeader(key)}:</span>
                    <span class="field-value">${value}</span>
                </div>
            `)
            .join('');
    }

    /**
     * ترجمة رؤوس الجداول
     */
    translateHeader(header) {
        const translations = {
            'activity': 'النشاط',
            'location': 'الموقع',
            'law': 'القانون',
            'requirements': 'المتطلبات',
            'authority': 'الجهة المختصة',
            'similarity': 'التشابه',
            'score': 'الدرجة',
            'name': 'الاسم',
            'description': 'الوصف',
            'governorate': 'المحافظة',
            'zone': 'المنطقة'
        };

        return translations[header] || header;
    }
}

// تصدير
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResultsRenderer;
}
/**
 * SettingsPanel.js
 * لوحة الإعدادات - للتحكم في إعدادات النظام
 */

class SettingsPanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.settings = this.loadSettings();
    }

    render() {
        this.container.innerHTML = `
            <div class="settings-panel">
                <h3>⚙️ الإعدادات</h3>
                <div class="settings-section">
                    <label>
                        <input type="checkbox" id="setting-voice" ${this.settings.voice ? 'checked' : ''}>
                        تفعيل الأوامر الصوتية
                    </label>
                </div>
                <div class="settings-section">
                    <label>
                        العتبة الافتراضية:
                        <input type="range" id="setting-threshold" min="0" max="100" value="${this.settings.threshold * 100}">
                        <span id="threshold-value">${(this.settings.threshold * 100).toFixed(0)}%</span>
                    </label>
                </div>
                <div class="settings-section">
                    <button class="btn-primary" id="btn-save-settings">حفظ الإعدادات</button>
                    <button class="btn-secondary" id="btn-reset-settings">إعادة تعيين</button>
                </div>
            </div>
        `;
        this.attachListeners();
    }

    attachListeners() {
        document.getElementById('btn-save-settings')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('btn-reset-settings')?.addEventListener('click', () => this.resetSettings());
    }

    loadSettings() {
        const saved = localStorage.getItem('app_settings');
        return saved ? JSON.parse(saved) : { voice: false, threshold: 0.7 };
    }

    saveSettings() {
        this.settings.voice = document.getElementById('setting-voice').checked;
        this.settings.threshold = document.getElementById('setting-threshold').value / 100;
        localStorage.setItem('app_settings', JSON.stringify(this.settings));
        alert('تم حفظ الإعدادات');
    }

    resetSettings() {
        this.settings = { voice: false, threshold: 0.7 };
        this.render();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsPanel;
}
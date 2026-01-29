/**
 * ═══════════════════════════════════════════════════════════════════
 * SpeechSynthesizer.js
 * تحويل النص إلى صوت - Web Speech API
 * ═══════════════════════════════════════════════════════════════════
 */

class SpeechSynthesizer {
  constructor(config = {}) {
    this.config = {
      lang: config.lang || 'ar-EG',
      rate: config.rate || 1.0,           // سرعة (0.1 - 10)
      pitch: config.pitch || 1.0,         // نغمة (0 - 2)
      volume: config.volume || 1.0        // صوت (0 - 1)
    };

    this.synthesis = window.speechSynthesis;
    this.isSupported = !!this.synthesis;
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentUtterance = null;

    // الأصوات المتاحة
    this.voices = [];
    this.selectedVoice = null;

    // Callbacks
    this.onStart = null;
    this.onEnd = null;
    this.onPause = null;
    this.onResume = null;
    this.onError = null;

    this._initialize();
  }

  /**
   * التهيئة
   */
  _initialize() {
    if (!this.isSupported) {
      console.warn('⚠️  Speech Synthesis غير مدعوم في هذا المتصفح');
      return;
    }

    // تحميل الأصوات
    this._loadVoices();

    // مستمع لتحميل الأصوات (بعض المتصفحات تحملها لاحقاً)
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => {
        this._loadVoices();
      };
    }

    console.log('✅ تم تهيئة محرك تحويل النص لصوت');
  }

  /**
   * تحميل الأصوات المتاحة
   */
  _loadVoices() {
    this.voices = this.synthesis.getVoices();

    // اختيار صوت عربي تلقائياً
    this.selectedVoice = this.voices.find(voice => 
      voice.lang.startsWith('ar')
    ) || this.voices[0];

    console.log(`📢 تم تحميل ${this.voices.length} صوت`);
  }

  /**
   * النطق
   */
  speak(text, options = {}) {
    if (!this.isSupported) {
      console.error('❌ Speech Synthesis غير مدعوم');
      return false;
    }

    if (!text || text.trim().length === 0) {
      console.warn('⚠️  النص فارغ');
      return false;
    }

    // إيقاف أي نطق حالي
    if (this.isSpeaking) {
      this.stop();
    }

    // إنشاء utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // التكوين
    utterance.lang = options.lang || this.config.lang;
    utterance.rate = options.rate || this.config.rate;
    utterance.pitch = options.pitch || this.config.pitch;
    utterance.volume = options.volume || this.config.volume;
    utterance.voice = this.selectedVoice;

    // الأحداث
    utterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
      console.log('🔊 بدء النطق...');
      if (this.onStart) this.onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      console.log('🔇 انتهى النطق');
      if (this.onEnd) this.onEnd();
    };

    utterance.onpause = () => {
      this.isPaused = true;
      console.log('⏸️  تم إيقاف النطق مؤقتاً');
      if (this.onPause) this.onPause();
    };

    utterance.onresume = () => {
      this.isPaused = false;
      console.log('▶️  تم استئناف النطق');
      if (this.onResume) this.onResume();
    };

    utterance.onerror = (event) => {
      console.error('❌ خطأ في النطق:', event.error);
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (this.onError) this.onError(event.error);
    };

    // النطق
    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);

    return true;
  }

  /**
   * إيقاف مؤقت
   */
  pause() {
    if (!this.isSpeaking || this.isPaused) {
      return false;
    }

    try {
      this.synthesis.pause();
      return true;
    } catch (error) {
      console.error('❌ خطأ في الإيقاف المؤقت:', error);
      return false;
    }
  }

  /**
   * استئناف
   */
  resume() {
    if (!this.isPaused) {
      return false;
    }

    try {
      this.synthesis.resume();
      return true;
    } catch (error) {
      console.error('❌ خطأ في الاستئناف:', error);
      return false;
    }
  }

  /**
   * إيقاف
   */
  stop() {
    if (!this.isSpeaking) {
      return false;
    }

    try {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      return true;
    } catch (error) {
      console.error('❌ خطأ في الإيقاف:', error);
      return false;
    }
  }

  /**
   * اختيار صوت
   */
  setVoice(voiceIndex) {
    if (voiceIndex >= 0 && voiceIndex < this.voices.length) {
      this.selectedVoice = this.voices[voiceIndex];
      return true;
    }
    return false;
  }

  /**
   * اختيار صوت عربي
   */
  setArabicVoice() {
    const arabicVoice = this.voices.find(voice => 
      voice.lang.startsWith('ar')
    );

    if (arabicVoice) {
      this.selectedVoice = arabicVoice;
      return true;
    }

    return false;
  }

  /**
   * الحصول على الأصوات المتاحة
   */
  getVoices(filterLang = null) {
    if (filterLang) {
      return this.voices.filter(voice => 
        voice.lang.startsWith(filterLang)
      );
    }
    return this.voices;
  }

  /**
   * تعيين السرعة
   */
  setRate(rate) {
    this.config.rate = Math.max(0.1, Math.min(10, rate));
  }

  /**
   * تعيين النغمة
   */
  setPitch(pitch) {
    this.config.pitch = Math.max(0, Math.min(2, pitch));
  }

  /**
   * تعيين الصوت
   */
  setVolume(volume) {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * الحالة
   */
  getState() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      isSupported: this.isSupported,
      selectedVoice: this.selectedVoice?.name || null,
      config: { ...this.config }
    };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpeechSynthesizer;
}
/**
 * ═══════════════════════════════════════════════════════════════════
 * SpeechRecognizer.js
 * التعرف الصوتي - Web Speech API
 * ═══════════════════════════════════════════════════════════════════
 */

class SpeechRecognizer {
  constructor(config = {}) {
    this.config = {
      lang: config.lang || 'ar-EG',          // اللغة العربية المصرية
      continuous: config.continuous !== false,
      interimResults: config.interimResults !== false,
      maxAlternatives: config.maxAlternatives || 3
    };

    this.recognition = null;
    this.isListening = false;
    this.isSupported = false;

    // Callbacks
    this.onResult = null;
    this.onError = null;
    this.onStart = null;
    this.onEnd = null;
    this.onInterim = null;

    this._initialize();
  }

  /**
   * التهيئة
   */
  _initialize() {
    // التحقق من الدعم
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('⚠️  Speech Recognition غير مدعوم في هذا المتصفح');
      this.isSupported = false;
      return;
    }

    this.isSupported = true;
    this.recognition = new SpeechRecognition();

    // التكوين
    this.recognition.lang = this.config.lang;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    // ربط الأحداث
    this._setupEventListeners();

    console.log('✅ تم تهيئة محرك التعرف الصوتي');
  }

  /**
   * إعداد مستمعي الأحداث
   */
  _setupEventListeners() {
    // عند بدء التعرف
    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('🎤 بدء الاستماع...');
      if (this.onStart) this.onStart();
    };

    // عند انتهاء التعرف
    this.recognition.onend = () => {
      this.isListening = false;
      console.log('🔇 توقف الاستماع');
      if (this.onEnd) this.onEnd();
    };

    // عند استلام النتائج
    this.recognition.onresult = (event) => {
      const results = [];
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalText += transcript;
          
          // جمع البدائل
          const alternatives = [];
          for (let j = 0; j < result.length; j++) {
            alternatives.push({
              transcript: result[j].transcript,
              confidence: result[j].confidence
            });
          }

          results.push({
            transcript: transcript,
            confidence: result[0].confidence,
            isFinal: true,
            alternatives: alternatives
          });

        } else {
          interimText += transcript;
        }
      }

      // إرسال النتائج المؤقتة
      if (interimText && this.onInterim) {
        this.onInterim(interimText);
      }

      // إرسال النتائج النهائية
      if (finalText && this.onResult) {
        this.onResult(finalText, results);
      }
    };

    // عند حدوث خطأ
    this.recognition.onerror = (event) => {
      console.error('❌ خطأ في التعرف الصوتي:', event.error);
      
      const errorMessages = {
        'no-speech': 'لم يتم اكتشاف صوت',
        'audio-capture': 'لم يتم العثور على ميكروفون',
        'not-allowed': 'لم يتم السماح باستخدام الميكروفون',
        'network': 'خطأ في الشبكة',
        'aborted': 'تم إيقاف التعرف'
      };

      const message = errorMessages[event.error] || event.error;

      if (this.onError) {
        this.onError(message, event.error);
      }
    };
  }

  /**
   * بدء الاستماع
   */
  start() {
    if (!this.isSupported) {
      console.error('❌ Speech Recognition غير مدعوم');
      return false;
    }

    if (this.isListening) {
      console.warn('⚠️  الاستماع قيد التشغيل بالفعل');
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('❌ خطأ في بدء الاستماع:', error);
      return false;
    }
  }

  /**
   * إيقاف الاستماع
   */
  stop() {
    if (!this.isListening) {
      return false;
    }

    try {
      this.recognition.stop();
      return true;
    } catch (error) {
      console.error('❌ خطأ في إيقاف الاستماع:', error);
      return false;
    }
  }

  /**
   * إلغاء الاستماع
   */
  abort() {
    if (!this.isListening) {
      return false;
    }

    try {
      this.recognition.abort();
      return true;
    } catch (error) {
      console.error('❌ خطأ في إلغاء الاستماع:', error);
      return false;
    }
  }

  /**
   * تغيير اللغة
   */
  setLanguage(lang) {
    this.config.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  /**
   * الحالة
   */
  getState() {
    return {
      isListening: this.isListening,
      isSupported: this.isSupported,
      language: this.config.lang
    };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpeechRecognizer;
}
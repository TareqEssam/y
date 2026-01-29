/**
 * ═══════════════════════════════════════════════════════════════════
 * AudioController.js
 * التحكم الشامل في الصوت
 * ═══════════════════════════════════════════════════════════════════
 */

class AudioController {
  constructor() {
    this.speechRecognizer = null;
    this.speechSynthesizer = null;
    this.vadDetector = null;

    this.state = {
      micMuted: false,
      speakerMuted: false,
      autoListen: true,        // فتح مايك تلقائي
      isProcessing: false
    };

    // Callbacks
    this.onUserSpoke = null;
    this.onAssistantSpeaking = null;
    this.onAssistantFinished = null;
  }

  /**
   * التهيئة
   */
  async initialize() {
    console.log('🔧 تهيئة نظام الصوت...');

    try {
      // تهيئة المكونات
      this.speechRecognizer = new SpeechRecognizer({
        lang: 'ar-EG',
        continuous: false,
        interimResults: true
      });

      this.speechSynthesizer = new SpeechSynthesizer({
        lang: 'ar-EG',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
      });

      this.vadDetector = new VADDetector({
        threshold: 0.01,
        silenceThreshold: 1500
      });

      // إعداد الأحداث
      this._setupEventHandlers();

      console.log('✅ تم تهيئة نظام الصوت');
      return true;

    } catch (error) {
      console.error('❌ خطأ في تهيئة الصوت:', error);
      return false;
    }
  }

  /**
   * إعداد معالجات الأحداث
   */
  _setupEventHandlers() {
    // التعرف الصوتي
    if (this.speechRecognizer) {
      this.speechRecognizer.onResult = (text, results) => {
        console.log('📝 نص معترف به:', text);
        if (this.onUserSpoke) {
          this.onUserSpoke(text, results);
        }
      };

      this.speechRecognizer.onEnd = () => {
        // إعادة الاستماع تلقائياً إذا كان مفعلاً
        if (this.state.autoListen && !this.state.isProcessing) {
          setTimeout(() => {
            this.startListening();
          }, 500);
        }
      };
    }

    // تحويل النص لصوت
    if (this.speechSynthesizer) {
      this.speechSynthesizer.onStart = () => {
        console.log('🔊 المساعد يتكلم...');
        this.state.isProcessing = true;
        
        // إيقاف الاستماع أثناء كلام المساعد
        this.stopListening();

        if (this.onAssistantSpeaking) {
          this.onAssistantSpeaking();
        }
      };

      this.speechSynthesizer.onEnd = () => {
        console.log('✅ انتهى المساعد من الكلام');
        this.state.isProcessing = false;

        if (this.onAssistantFinished) {
          this.onAssistantFinished();
        }

        // بدء الاستماع تلقائياً
        if (this.state.autoListen) {
          setTimeout(() => {
            this.startListening();
          }, 500);
        }
      };
    }

    // VAD
    if (this.vadDetector) {
      this.vadDetector.onSpeechStart = () => {
        console.log('🎤 بدء الكلام...');
      };

      this.vadDetector.onSpeechEnd = (duration) => {
        console.log(`✅ انتهى الكلام (${duration}ms)`);
      };
    }
  }

  /**
   * بدء الاستماع
   */
  startListening() {
    if (this.state.micMuted || this.state.isProcessing) {
      return false;
    }

    if (this.speechRecognizer && this.speechRecognizer.isSupported) {
      return this.speechRecognizer.start();
    }

    return false;
  }

  /**
   * إيقاف الاستماع
   */
  stopListening() {
    if (this.speechRecognizer) {
      return this.speechRecognizer.stop();
    }
    return false;
  }

  /**
   * نطق نص
   */
  speak(text) {
    if (this.state.speakerMuted) {
      console.log('🔇 السماعة مكتومة');
      return false;
    }

    if (this.speechSynthesizer && this.speechSynthesizer.isSupported) {
      return this.speechSynthesizer.speak(text);
    }

    return false;
  }

  /**
   * إيقاف النطق
   */
  stopSpeaking() {
    if (this.speechSynthesizer) {
      return this.speechSynthesizer.stop();
    }
    return false;
  }

  /**
   * كتم/إلغاء كتم الميكروفون
   */
  toggleMic() {
    this.state.micMuted = !this.state.micMuted;
    
    if (this.state.micMuted) {
      this.stopListening();
      console.log('🔇 تم كتم الميكروفون');
    } else {
      console.log('🎤 تم إلغاء كتم الميكروفون');
      if (this.state.autoListen) {
        this.startListening();
      }
    }

    return this.state.micMuted;
  }

  /**
   * كتم/إلغاء كتم السماعة
   */
  toggleSpeaker() {
    this.state.speakerMuted = !this.state.speakerMuted;
    
    if (this.state.speakerMuted) {
      this.stopSpeaking();
      console.log('🔇 تم كتم السماعة');
    } else {
      console.log('🔊 تم إلغاء كتم السماعة');
    }

    return this.state.speakerMuted;
  }

  /**
   * تفعيل/تعطيل الاستماع التلقائي
   */
  toggleAutoListen() {
    this.state.autoListen = !this.state.autoListen;
    
    if (this.state.autoListen) {
      console.log('🔄 تم تفعيل الاستماع التلقائي');
      this.startListening();
    } else {
      console.log('⏸️  تم تعطيل الاستماع التلقائي');
      this.stopListening();
    }

    return this.state.autoListen;
  }

  /**
   * تهيئة VAD
   */
  async startVAD() {
    if (this.vadDetector) {
      const initialized = await this.vadDetector.initialize();
      if (initialized) {
        return this.vadDetector.start();
      }
    }
    return false;
  }

  /**
   * إيقاف VAD
   */
  stopVAD() {
    if (this.vadDetector) {
      this.vadDetector.stop();
    }
  }

  /**
   * الحصول على الحالة
   */
  getState() {
    return {
      ...this.state,
      recognizerState: this.speechRecognizer?.getState(),
      synthesizerState: this.speechSynthesizer?.getState(),
      vadState: this.vadDetector?.getState()
    };
  }

  /**
   * تغيير اللغة
   */
  setLanguage(lang) {
    if (this.speechRecognizer) {
      this.speechRecognizer.setLanguage(lang);
    }
  }

  /**
   * تغيير السرعة
   */
  setRate(rate) {
    if (this.speechSynthesizer) {
      this.speechSynthesizer.setRate(rate);
    }
  }

  /**
   * تغيير الصوت
   */
  setVolume(volume) {
    if (this.speechSynthesizer) {
      this.speechSynthesizer.setVolume(volume);
    }
  }

  /**
   * تنظيف
   */
  cleanup() {
    this.stopListening();
    this.stopSpeaking();
    
    if (this.vadDetector) {
      this.vadDetector.cleanup();
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioController;
}
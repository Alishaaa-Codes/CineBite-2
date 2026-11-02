/**
 * Web Audio API synthesized alert chime for CineBite Food Department
 * Generates a clean two-tone cinema chime (880Hz -> 1320Hz) without needing external audio files.
 */
class KitchenAudioAlert {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;

    // Load saved preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cinebite_kitchen_muted');
      this.isMuted = saved === 'true';
    }
  }

  initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('cinebite_kitchen_muted', String(this.isMuted));
    }
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cinebite_kitchen_muted', String(this.isMuted));
    }
  }

  /**
   * Plays a dual-tone ascending kitchen bell chime
   */
  playNewOrderChime() {
    if (this.isMuted) return;

    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Note 1: 587.33 Hz (D5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);

      osc1.start(now);
      osc1.stop(now + 0.45);

      // Note 2: 880 Hz (A5)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.15);

      gain2.gain.setValueAtTime(0, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.35, now + 0.17);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);

      osc2.start(now + 0.15);
      osc2.stop(now + 0.75);
    } catch (err) {
      console.warn('Audio alert unavailable or blocked by browser autoplay policy:', err);
    }
  }

  /**
   * Plays a subtle click chime for status change
   */
  playStatusChangeChime() {
    if (this.isMuted) return;

    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (err) {
      // Ignore
    }
  }
}

export const kitchenAudio = new KitchenAudioAlert();

// Procedural Web Audio API sound effects system for "Singularity: City Eater"
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgOsc = null;
    this.bgGain = null;
    this.isBgPlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.bgGain) {
      this.bgGain.gain.setValueAtTime(this.muted ? 0 : 0.05, this.ctx?.currentTime || 0);
    }
    return this.muted;
  }

  // Tier 1 swallow: high-pitch crisp suction pop
  playPopSmall() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(550 + Math.random() * 200, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.12);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Tier 2 swallow: punchy hollow thud / wooden or metallic gulp
  playSwallowMedium() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.22);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Tier 3 swallow: heavy mechanical crunch and vacuum suction
  playSwallowLarge() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Sub oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.38);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(600, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 0.2);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.38);
    noise.start(t);
    noise.stop(t + 0.2);
  }

  // Tier 4 swallow: Massive deep bass earthquake rumble + cosmic singularity implosion
  playEarthquakeRumble() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Sub-bass rumble
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(95, t);
    subOsc.frequency.linearRampToValueAtTime(32, t + 0.7);

    subGain.gain.setValueAtTime(0.45, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + 0.75);

    // Structural crunch noise
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, t);
    filter.Q.value = 1.2;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.28, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.45);
  }

  // Play swallow based on tier
  playSwallow(tier) {
    if (tier === 1) this.playPopSmall();
    else if (tier === 2) this.playSwallowMedium();
    else if (tier === 3) this.playSwallowLarge();
    else if (tier === 4) this.playEarthquakeRumble();
  }

  // Devouring another rival black hole
  playRivalDevoured() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Fanfare chord
    const freqs = [330, 440, 554, 659];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.45);

      gain.gain.setValueAtTime(0.15, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.04);
      osc.stop(t + 0.5);
    });
    this.playEarthquakeRumble();
  }

  // Player got devoured
  playPlayerDevoured() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.linearRampToValueAtTime(65, t + 0.6);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.6);
  }

  // Combo chime: ascends with combo level
  playComboChime(comboLevel) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [440, 493.88, 554.37, 659.25, 739.99, 880, 987.77, 1108.73];
    const freq = notes[Math.min(notes.length - 1, comboLevel - 1)] || 440;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Countdown clock tick
  playTick(isUrgent = false) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isUrgent ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isUrgent ? 880 : 520, t);
    osc.frequency.exponentialRampToValueAtTime(isUrgent ? 440 : 260, t + 0.06);

    gain.gain.setValueAtTime(isUrgent ? 0.25 : 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Final match end buzzer
  playMatchEnd() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    [220, 277, 330].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.8);
    });
  }

  // Tier Level-Up growth fanfare
  playGrowthTierUp() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const freqs = [440, 554, 659, 880];
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);

      gain.gain.setValueAtTime(0.2, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.35);
    });
  }

  // Subtle ambient techno groove
  startBgMusic() {
    if (!this.ctx || this.isBgPlaying) return;
    try {
      this.isBgPlaying = true;
      let step = 0;
      const bassNotes = [55, 55, 65.4, 55, 73.4, 55, 65.4, 82.4];
      
      const loop = () => {
        if (!this.isBgPlaying) return;
        if (!this.muted && this.ctx) {
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = 'sawtooth';
          const freq = bassNotes[step % bassNotes.length];
          osc.frequency.setValueAtTime(freq, t);
          
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(250 + (step % 4) * 80, t);
          filter.frequency.exponentialRampToValueAtTime(70, t + 0.18);
          
          gain.gain.setValueAtTime(0.04, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          
          osc.start(t);
          osc.stop(t + 0.19);
          step++;
        }
        setTimeout(loop, 220); // ~136 BPM sixteenth notes
      };
      loop();
    } catch (e) {
      console.warn("Background music init skipped", e);
    }
  }

  stopBgMusic() {
    this.isBgPlaying = false;
  }
}

export const sound = new SoundManager();

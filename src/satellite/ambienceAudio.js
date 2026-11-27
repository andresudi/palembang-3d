// Procedural Web Audio API soundscape for Explore Palembang 3D
// Zero external MP3s, zero copyright risk, lazy AudioContext created only on user interaction:
// - Gentle Sungai Musi water lapping (LFO-modulated bandpass noise)
// - Soft tropical river breeze
// - Occasional mellow distant riverboat horn (and 1-shot chime on demand)
// - Scalable tropical rain layer (ready for Phase 3 live weather)

export function createAmbienceAudio() {
  let ctx = null;
  let masterGain = null;
  let waterGain = null;
  let rainGain = null;
  let hornTimer = null;
  let enabled = false;
  let volume = 0.55;
  let rainLevel = 0.0;
  let mood = 'siang';

  function createNoiseBuffer(audioCtx, durationSec = 4) {
    const sampleRate = audioCtx.sampleRate;
    const len = sampleRate * durationSec;
    const buffer = audioCtx.createBuffer(2, len, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      // Pink-ish smoothed noise for organic water & rain textures
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  function initGraph() {
    if (ctx) return true;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    try {
      ctx = new AudioCtx();
    } catch {
      return false;
    }

    masterGain = ctx.createGain();
    masterGain.gain.value = 0.0001;
    masterGain.connect(ctx.destination);

    const noiseBuf = createNoiseBuffer(ctx, 4);

    // 1. Sungai Musi water lapping (slow-swelling bandpass noise)
    const waterSrc = ctx.createBufferSource();
    waterSrc.buffer = noiseBuf;
    waterSrc.loop = true;

    const waterFilter = ctx.createBiquadFilter();
    waterFilter.type = 'bandpass';
    waterFilter.frequency.value = 380;
    waterFilter.Q.value = 0.85;

    // Slow gentle river wave LFO modulating filter frequency
    const waveLfo = ctx.createOscillator();
    waveLfo.type = 'sine';
    waveLfo.frequency.value = 0.16;
    const waveLfoGain = ctx.createGain();
    waveLfoGain.gain.value = 140;
    waveLfo.connect(waveLfoGain);
    waveLfoGain.connect(waterFilter.frequency);
    waveLfo.start();

    waterGain = ctx.createGain();
    waterGain.gain.value = 0.42;

    waterSrc.connect(waterFilter);
    waterFilter.connect(waterGain);
    waterGain.connect(masterGain);
    waterSrc.start();

    // 2. Soft low tropical breeze bed
    const breezeSrc = ctx.createBufferSource();
    breezeSrc.buffer = noiseBuf;
    breezeSrc.loop = true;
    const breezeFilter = ctx.createBiquadFilter();
    breezeFilter.type = 'lowpass';
    breezeFilter.frequency.value = 165;
    const breezeGain = ctx.createGain();
    breezeGain.gain.value = 0.28;
    breezeSrc.connect(breezeFilter);
    breezeFilter.connect(breezeGain);
    breezeGain.connect(masterGain);
    breezeSrc.start();

    // 3. Rain layer (muted at 0 until rainLevel > 0 in Phase 3)
    const rainSrc = ctx.createBufferSource();
    rainSrc.buffer = noiseBuf;
    rainSrc.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 1100;
    rainGain = ctx.createGain();
    rainGain.gain.value = 0.0;
    rainSrc.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(masterGain);
    rainSrc.start();

    return true;
  }

  // Play a warm, distant Musi riverboat / tugboat horn chime
  function playBoatHorn(isDeepBarge = false) {
    if (!enabled || !ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const baseFreq = isDeepBarge ? 116 : 168;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq * 1.498, now); // warm fifth interval

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(isDeepBarge ? 320 : 480, now);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(0.065, now + 0.35);
    env.gain.exponentialRampToValueAtTime(0.045, now + 1.25);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);

    osc1.connect(lp);
    osc2.connect(lp);
    lp.connect(env);
    env.connect(masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.2);
    osc2.stop(now + 2.2);
  }

  function scheduleNextHorn() {
    clearTimeout(hornTimer);
    if (!enabled) return;
    const delayMs = 15000 + Math.random() * 14000;
    hornTimer = setTimeout(() => {
      playBoatHorn(Math.random() < 0.45);
      scheduleNextHorn();
    }, delayMs);
  }

  function applyGains() {
    if (!ctx || !masterGain) return;
    const now = ctx.currentTime;
    const targetMaster = enabled ? Math.max(0.0001, volume * 0.7) : 0.0001;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(targetMaster, now, 0.25);

    if (waterGain) {
      const moodFactor = mood === 'malam' ? 0.8 : 1.0;
      waterGain.gain.setTargetAtTime(0.42 * moodFactor, now, 0.4);
    }
    if (rainGain) {
      rainGain.gain.setTargetAtTime(rainLevel * 0.52, now, 0.5);
    }
  }

  function setEnabled(flag) {
    enabled = Boolean(flag);
    if (enabled) {
      if (!initGraph()) {
        enabled = false;
        return false;
      }
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      applyGains();
      scheduleNextHorn();
      // Subtle welcoming distant horn after 1.5s so user immediately feels the river atmosphere
      setTimeout(() => {
        if (enabled) playBoatHorn(false);
      }, 1500);
    } else {
      clearTimeout(hornTimer);
      applyGains();
    }
    return enabled;
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, Number(v) || 0));
    applyGains();
  }

  function setMood(m) {
    mood = m;
    applyGains();
  }

  function setRainIntensity(level) {
    rainLevel = Math.max(0, Math.min(1, Number(level) || 0));
    applyGains();
  }

  function cleanup() {
    enabled = false;
    clearTimeout(hornTimer);
    if (ctx) {
      ctx.close().catch(() => {});
      ctx = null;
    }
  }

  return {
    setEnabled,
    toggle: () => setEnabled(!enabled),
    isEnabled: () => enabled,
    setVolume,
    getVolume: () => volume,
    setMood,
    setRainIntensity,
    playBoatHorn,
    cleanup,
  };
}

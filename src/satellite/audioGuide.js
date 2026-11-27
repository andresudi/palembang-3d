// v3.0 Procedural Browser Web Speech API Audio Guide (ID / EN, Zero API Key, 0 KB assets)
// Speaks landmark/culinary/historical narratives ONLY on explicit user click or opt-in Tour Narration.

export function createAudioGuide({ onStateChange } = {}) {
  const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  let speaking = false;
  let autoTourNarration = false;
  let currentId = null;

  function emit() {
    onStateChange?.(getState());
  }

  function pickVoice(lang) {
    if (!synth) return null;
    const voices = synth.getVoices?.() || [];
    const prefix = lang === 'en' ? 'en' : 'id';
    return (
      voices.find((v) => v.lang?.toLowerCase().startsWith(prefix) && v.localService) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith(prefix)) ||
      null
    );
  }

  function stop() {
    if (synth) {
      try {
        synth.cancel();
      } catch {}
    }
    speaking = false;
    currentId = null;
    emit();
  }

  function speak(text, { lang = 'id', id = null } = {}) {
    if (!text) return false;
    if (!synth) {
      // Graceful state toggle even in headless environments without TTS voices
      speaking = false;
      emit();
      return false;
    }
    try {
      synth.cancel();
      const clean = String(text).replace(/\*/g, '');
      const utt = new SpeechSynthesisUtterance(clean);
      utt.lang = lang === 'en' ? 'en-US' : 'id-ID';
      utt.rate = 0.96;
      utt.pitch = 1.0;
      const voice = pickVoice(lang);
      if (voice) utt.voice = voice;

      speaking = true;
      currentId = id;
      emit();

      utt.onend = () => {
        speaking = false;
        currentId = null;
        emit();
      };
      utt.onerror = () => {
        speaking = false;
        currentId = null;
        emit();
      };
      synth.speak(utt);
      return true;
    } catch {
      speaking = false;
      currentId = null;
      emit();
      return false;
    }
  }

  function setAutoTourNarration(flag) {
    autoTourNarration = Boolean(flag);
    if (!autoTourNarration && speaking) stop();
    emit();
  }

  function getState() {
    return Object.freeze({
      supported: Boolean(synth),
      speaking,
      currentId,
      autoTourNarration,
    });
  }

  return {
    speak,
    stop,
    setAutoTourNarration,
    toggleAutoTourNarration: () => setAutoTourNarration(!autoTourNarration),
    getState,
    cleanup: stop,
  };
}

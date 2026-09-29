/**
 * Short practice cues. Web Audio only, no asset files.
 * If the browser blocks audio, callers continue without sound.
 */

export function createCue(isEnabled) {
  let ctx = null;

  function context() {
    if (!isEnabled()) return null;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!ctx) ctx = new Ctx();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, start, duration, level) {
    const audio = context();
    if (!audio) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const t = audio.currentTime + start;
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  return {
    tap() {
      tone(740, 0, 0.05, 0.02);
    },
    correct() {
      tone(523.25, 0, 0.12, 0.045);
      tone(659.25, 0.09, 0.18, 0.04);
    },
    wrong() {
      tone(196, 0, 0.16, 0.03);
    },
    done() {
      tone(523.25, 0, 0.12, 0.035);
      tone(659.25, 0.1, 0.14, 0.03);
      tone(783.99, 0.2, 0.22, 0.03);
    },
  };
}

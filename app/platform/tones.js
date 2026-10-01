/**
 * The practice cues as notes, for any Web-Audio-shaped context
 * (the browser's AudioContext, or WeChat's createWebAudioContext()).
 * Same notes as main's h5/sound.js. Audio failures are swallowed: the
 * learning flow never waits on sound.
 */
export const CUES = {
  tap: [[740, 0, 0.05, 0.02]],
  correct: [[523.25, 0, 0.12, 0.045], [659.25, 0.09, 0.18, 0.04]],
  wrong: [[196, 0, 0.16, 0.03]],
  done: [[523.25, 0, 0.12, 0.035], [659.25, 0.1, 0.14, 0.03], [783.99, 0.2, 0.22, 0.03]],
};

export function createToneCue(getContext, isEnabled) {
  function play(name) {
    if (!isEnabled()) return;
    try {
      const audio = getContext();
      if (!audio) return;
      for (const [freq, start, duration, level] of CUES[name] || []) {
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
    } catch {
      // no sound on this device; practice continues
    }
  }
  return {
    tap: () => play("tap"),
    correct: () => play("correct"),
    wrong: () => play("wrong"),
    done: () => play("done"),
  };
}

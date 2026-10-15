/**
 * Synthesized UI sounds (Web Audio API). Generating them keeps the bundle
 * small and avoids shipping Microsoft's copyrighted .wav files, while still
 * sounding like XP's short "tk" navigation click.
 */

let context: AudioContext | null = null;

/** Created lazily: browsers only allow audio after a user gesture anyway. */
function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

/** Plays the click at `level` (0–1, already curved for loudness). */
export function playClick(level: number) {
  const ctx = getContext();
  if (!ctx || level <= 0) return;
  const now = ctx.currentTime;

  const output = ctx.createGain();
  output.gain.value = level;
  output.connect(ctx.destination);

  // Body: a short, falling tone.
  const tone = ctx.createOscillator();
  const toneGain = ctx.createGain();
  tone.type = 'triangle';
  tone.frequency.setValueAtTime(1900, now);
  tone.frequency.exponentialRampToValueAtTime(700, now + 0.03);
  toneGain.gain.setValueAtTime(0.5, now);
  toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  tone.connect(toneGain).connect(output);
  tone.start(now);
  tone.stop(now + 0.05);

  // Attack: a burst of band-passed noise for the "tick".
  const length = Math.floor(ctx.sampleRate * 0.02);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    samples[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 3000;
  band.Q.value = 1.2;
  noise.connect(band).connect(output);
  noise.start(now);
}

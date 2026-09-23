/**
 * Synthesizes a pleasant two-tone mobile push notification chime
 * (similar to WhatsApp / smartphone heads-up notification chime)
 * Uses native Web Audio API — requires zero external assets.
 */
export const playNotificationChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Tone 1: High crisp initial ding (587.33 Hz - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Tone 2: Harmonic resolving chime (880 Hz - A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.3);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (err) {
    // Gracefully ignore audio errors (e.g. user hasn't interacted with page yet)
    console.debug("Notification chime skipped:", err);
  }
};

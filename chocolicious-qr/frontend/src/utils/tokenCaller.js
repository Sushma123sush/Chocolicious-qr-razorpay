/**
 * Speaks a token announcement using the browser's SpeechSynthesis API
 * when available. Isolated in its own module so this can be swapped
 * for a real PA/announcement system later without touching any
 * component.
 *
 * Returns true if speech was actually triggered, false if the browser
 * doesn't support it (caller should fall back to a visual-only
 * confirmation in that case).
 */
export function speakTokenAnnouncement(tokenNumber) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(
      `Token ${tokenNumber}, your order is ready.`
    );
    utterance.rate = 0.95;
    window.speechSynthesis.cancel(); // don't stack announcements
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

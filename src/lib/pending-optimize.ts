"use client";

/** "Copy & optimize": handoff for an AI message across a resume-duplicate
 * navigation, since editor-store's pendingAiMessage gets reset by
 * useEditor's cleanup when the route's resumeId changes. */

const PREFIX = "careerhelper:pending-optimize:";
const LEGACY_PREFIX = "jade:pending-optimize:";

export function setPendingOptimizeMessage(resumeId: string, message: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PREFIX + resumeId, message);
}

export function takePendingOptimizeMessage(resumeId: string): string | null {
  if (typeof window === "undefined") return null;
  const key = PREFIX + resumeId;
  const legacyKey = LEGACY_PREFIX + resumeId;
  const message = window.sessionStorage.getItem(key);
  if (message !== null) {
    window.sessionStorage.removeItem(key);
    return message;
  }
  const legacyMessage = window.sessionStorage.getItem(legacyKey);
  if (legacyMessage !== null) window.sessionStorage.removeItem(legacyKey);
  return legacyMessage;
}

"use client";

const FINGERPRINT_KEY = "careerhelper_fingerprint";
const LEGACY_FINGERPRINT_KEY = "jade_fingerprint";

export function getStoredFingerprint(): string | null {
  if (typeof window === "undefined") return null;
  const fingerprint = localStorage.getItem(FINGERPRINT_KEY);
  if (fingerprint) return fingerprint;

  const legacyFingerprint = localStorage.getItem(LEGACY_FINGERPRINT_KEY);
  if (legacyFingerprint) {
    localStorage.setItem(FINGERPRINT_KEY, legacyFingerprint);
    localStorage.removeItem(LEGACY_FINGERPRINT_KEY);
  }
  return legacyFingerprint;
}

export function setStoredFingerprint(fingerprint: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FINGERPRINT_KEY, fingerprint);
  localStorage.removeItem(LEGACY_FINGERPRINT_KEY);
}

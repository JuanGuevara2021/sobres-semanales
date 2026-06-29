import { esPublica } from "./appMode";

const IS_NATIVE = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();
const STORAGE_KEY = "sobres_review";
const MIN_DAYS = 14;

function getReviewState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveReviewState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function markFirstUse() {
  const state = getReviewState();
  if (!state.firstUse) {
    state.firstUse = Date.now();
    saveReviewState(state);
  }
}

export async function tryRequestReview() {
  if (!esPublica || !IS_NATIVE) return;
  const state = getReviewState();
  if (state.prompted) return;
  if (!state.firstUse) return;

  const daysSinceFirst = (Date.now() - state.firstUse) / (1000 * 60 * 60 * 24);
  if (daysSinceFirst < MIN_DAYS) return;

  try {
    const { InAppReview } = await import("@capacitor-community/in-app-review");
    await InAppReview.requestReview();
    state.prompted = true;
    state.promptedAt = Date.now();
    saveReviewState(state);
  } catch {}
}

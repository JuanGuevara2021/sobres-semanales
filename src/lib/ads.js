import { esPublica } from "./appMode";
import { getNivelAds } from "./pilares";

const IS_NATIVE = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();

const AD_IDS = {
  banner: "ca-app-pub-3168566594532069/5449500315",
  interstitial: "ca-app-pub-3168566594532069/8659941416",
};

let admobPlugin = null;
let interstitialReady = false;
let lastInterstitial = 0;
const MIN_INTERSTITIAL_GAP_MS = 3 * 60 * 1000; // 3 minutos entre interstitials

async function getAdMob() {
  if (admobPlugin) return admobPlugin;
  if (!IS_NATIVE) return null;
  try {
    const mod = await import("@capacitor-community/admob");
    admobPlugin = mod.AdMob;
    await admobPlugin.initialize({});
    return admobPlugin;
  } catch {
    return null;
  }
}

export async function initAds() {
  if (!esPublica || !IS_NATIVE) return;
  await getAdMob();
}

export async function showBanner(pilar) {
  const nivel = getNivelAds(pilar);
  if (nivel === "ninguno") return;
  const adMob = await getAdMob();
  if (!adMob) return;
  try {
    await adMob.showBanner({
      adId: AD_IDS.banner,
      adSize: "ADAPTIVE_BANNER",
      position: "BOTTOM_CENTER",
      margin: 60,
    });
  } catch {}
}

export async function hideBanner() {
  const adMob = await getAdMob();
  if (!adMob) return;
  try { await adMob.removeBanner(); } catch {}
}

export async function prepareInterstitial(pilar) {
  const nivel = getNivelAds(pilar);
  if (!nivel.includes("interstitial")) return;
  const adMob = await getAdMob();
  if (!adMob) return;
  try {
    await adMob.prepareInterstitial({ adId: AD_IDS.interstitial });
    interstitialReady = true;
  } catch {
    interstitialReady = false;
  }
}

export async function showInterstitial(pilar) {
  const nivel = getNivelAds(pilar);
  if (!nivel.includes("interstitial")) return false;
  if (!interstitialReady) return false;
  const now = Date.now();
  if (now - lastInterstitial < MIN_INTERSTITIAL_GAP_MS) return false;
  const adMob = await getAdMob();
  if (!adMob) return false;
  try {
    await adMob.showInterstitial();
    lastInterstitial = now;
    interstitialReady = false;
    prepareInterstitial(pilar);
    return true;
  } catch {
    return false;
  }
}

export function shouldShowAds(pilar) {
  if (!esPublica) return false;
  return getNivelAds(pilar) !== "ninguno";
}

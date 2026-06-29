const IS_NATIVE = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();

let crashPlugin = null;

async function getCrashlytics() {
  if (crashPlugin) return crashPlugin;
  if (!IS_NATIVE) return null;
  try {
    const mod = await import("@capacitor-firebase/crashlytics");
    crashPlugin = mod.FirebaseCrashlytics;
    return crashPlugin;
  } catch {
    return null;
  }
}

export async function initCrashlytics(userId) {
  const crash = await getCrashlytics();
  if (!crash) return;
  try {
    await crash.setEnabled({ enabled: true });
    if (userId) await crash.setUserId({ userId });
  } catch {}
}

export async function logError(message, error) {
  const crash = await getCrashlytics();
  if (!crash) return;
  try {
    await crash.log({ message: `${message}: ${error?.message || error}` });
    await crash.recordException({ message: error?.message || String(error) });
  } catch {}
}

import { esPublica } from "./appMode";

const IS_NATIVE = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();

let rcPlugin = null;

async function getRC() {
  if (rcPlugin) return rcPlugin;
  if (!IS_NATIVE) return null;
  try {
    const mod = await import("@revenuecat/purchases-capacitor");
    rcPlugin = mod.Purchases;
    return rcPlugin;
  } catch {
    return null;
  }
}

export async function initPurchases(userId) {
  if (!esPublica || !IS_NATIVE) return;
  const rc = await getRC();
  if (!rc) return;
  try {
    await rc.configure({ apiKey: "REVENUECAT_API_KEY_PENDIENTE" });
    if (userId) await rc.logIn({ appUserID: userId });
  } catch {}
}

export async function checkProStatus() {
  if (!esPublica) return true;
  if (!IS_NATIVE) return false;
  const rc = await getRC();
  if (!rc) return false;
  try {
    const { customerInfo } = await rc.getCustomerInfo();
    return customerInfo.entitlements.active["pro"] !== undefined;
  } catch {
    return false;
  }
}

export async function purchasePro() {
  const rc = await getRC();
  if (!rc) return { success: false, error: "No disponible en esta plataforma" };
  try {
    const { products } = await rc.getProducts({ productIdentifiers: ["sobres_pro_anual"] });
    if (!products.length) return { success: false, error: "Producto no encontrado" };
    const { customerInfo } = await rc.purchaseStoreProduct({ product: products[0] });
    const isPro = customerInfo.entitlements.active["pro"] !== undefined;
    return { success: isPro, error: isPro ? null : "Compra no completada" };
  } catch (e) {
    if (e.userCancelled) return { success: false, error: null };
    return { success: false, error: "Error al procesar la compra" };
  }
}

export async function restorePurchases() {
  const rc = await getRC();
  if (!rc) return false;
  try {
    const { customerInfo } = await rc.restorePurchases();
    return customerInfo.entitlements.active["pro"] !== undefined;
  } catch {
    return false;
  }
}

export function exportGastosCSV(gastos, sobres, money) {
  const sobreMap = {};
  sobres.forEach((s) => { sobreMap[s.id] = s.nombre; });
  const header = "Fecha,Monto,Sobre,Categoria,Medio de pago,Nota";
  const rows = gastos.map((g) => {
    const sobre = g.sobre_id ? (sobreMap[g.sobre_id] || "") : "Fuera de sobres";
    const nota = (g.nota || "").replace(/"/g, '""');
    return `${g.fecha},${g.monto},"${sobre}","${g.categoria || ""}","${g.medio_pago || ""}","${nota}"`;
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sobres-semanales-gastos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

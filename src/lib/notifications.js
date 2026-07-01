import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

const STORAGE_KEY = "sobres_notif_dias_antes";
const DEFAULT_DIAS = 0; // mismo dia

export function getDiasAntes() {
  const v = localStorage.getItem(STORAGE_KEY);
  return v != null ? parseInt(v, 10) : DEFAULT_DIAS;
}

export function setDiasAntes(dias) {
  localStorage.setItem(STORAGE_KEY, String(dias));
}

export const OPCIONES_ANTELACION = [
  { value: 0, label: "El mismo dia" },
  { value: 1, label: "1 dia antes" },
  { value: 2, label: "2 dias antes" },
  { value: 3, label: "3 dias antes" },
];

function esNativo() {
  return Capacitor.isNativePlatform();
}

export async function initNotifications() {
  if (!esNativo()) return false;
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === "granted") return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === "granted";
  } catch {
    return false;
  }
}

function buildId(pagoId, dia, mes) {
  let hash = 0;
  const str = `${pagoId}-${dia}-${mes}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2000000000;
}

function proximaFechaPago(pago) {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  const fechas = [];

  if (pago.frecuencia === "semanal") {
    const diaSem = pago.dia_pago != null ? pago.dia_pago : hoy.getDay();
    for (let offset = 0; offset <= 7; offset++) {
      const d = new Date(anio, mes, hoy.getDate() + offset);
      if (d.getDay() === diaSem && d >= hoy) {
        fechas.push(d);
        break;
      }
    }
  } else if (pago.frecuencia === "quincenal") {
    const d1 = pago.dia_pago || 1;
    const d2 = pago.dia_pago_2 || 15;
    [d1, d2].forEach((dia) => {
      const f = new Date(anio, mes, dia);
      if (f < hoy) f.setMonth(f.getMonth() + 1);
      fechas.push(f);
    });
  } else {
    const dia = pago.dia_pago || 1;
    const f = new Date(anio, mes, dia);
    if (f < hoy) f.setMonth(f.getMonth() + 1);
    fechas.push(f);
  }

  fechas.sort((a, b) => a - b);
  return fechas[0] || null;
}

export async function programarNotificaciones(pagos, tarjetas) {
  if (!esNativo()) return;

  const permitido = await initNotifications();
  if (!permitido) return;

  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  } catch {}

  const diasAntes = getDiasAntes();
  const notifs = [];
  const ahora = new Date();

  pagos.filter((p) => p.activo && p.categoria !== "tarjetas").forEach((p) => {
    const fecha = proximaFechaPago(p);
    if (!fecha) return;
    const fechaNotif = new Date(fecha);
    fechaNotif.setDate(fechaNotif.getDate() - diasAntes);
    fechaNotif.setHours(9, 0, 0, 0);
    if (fechaNotif <= ahora) return;

    notifs.push({
      id: buildId(p.id, fecha.getDate(), fecha.getMonth()),
      title: "Recordatorio de pago",
      body: diasAntes === 0
        ? `Hoy toca pagar: ${p.nombre} ($${Number(p.monto_estimado).toLocaleString()})`
        : `En ${diasAntes} dia${diasAntes > 1 ? "s" : ""} toca pagar: ${p.nombre} ($${Number(p.monto_estimado).toLocaleString()})`,
      schedule: { at: fechaNotif },
      sound: "default",
      smallIcon: "ic_notification",
      iconColor: "#0B7A4B",
    });
  });

  tarjetas.filter((t) => t.activo && t.dia_pago).forEach((t) => {
    const dia = t.dia_pago;
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth(), dia);
    if (fecha < ahora) fecha.setMonth(fecha.getMonth() + 1);
    const fechaNotif = new Date(fecha);
    fechaNotif.setDate(fechaNotif.getDate() - diasAntes);
    fechaNotif.setHours(9, 0, 0, 0);
    if (fechaNotif <= ahora) return;

    notifs.push({
      id: buildId(t.id, fecha.getDate(), fecha.getMonth()),
      title: "Pago de tarjeta",
      body: diasAntes === 0
        ? `Hoy vence el pago de tu tarjeta ${t.nombre}`
        : `En ${diasAntes} dia${diasAntes > 1 ? "s" : ""} vence el pago de tu tarjeta ${t.nombre}`,
      schedule: { at: fechaNotif },
      sound: "default",
      smallIcon: "ic_notification",
      iconColor: "#0B7A4B",
    });
  });

  if (notifs.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications: notifs });
    } catch {}
  }
}

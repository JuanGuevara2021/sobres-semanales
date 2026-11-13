import { supabase } from "./supabase";

/* Configuracion de la quincena: sueldo y dias de cobro.

   Vive en la tabla `cuentas` (sueldo_quincenal, dia_cobro_1, dia_cobro_2),
   asi la comparten los dos usuarios del hogar y todos sus dispositivos.
   Ademas se guarda una copia en este dispositivo: si la base aun no tiene
   las columnas (migracion pendiente) o no hay red, la quincena sigue
   funcionando aqui y se sube sola en cuanto la base este lista.

   En la base: NULL = nunca configurado · 0 = el usuario la desactivo. */

const clave = (cuentaId) => `sobres_quincena_${cuentaId}`;
const claveOculta = (cuentaId) => `sobres_quincena_oculta_${cuentaId}`;

function normalizar(raw) {
  const sueldo = Number(raw?.sueldo);
  if (!sueldo || sueldo <= 0) return null;
  return { sueldo, dia1: Number(raw.dia1) || 15, dia2: Number(raw.dia2) || 30 };
}

export function leerQuincenaLocal(cuentaId) {
  try { return normalizar(JSON.parse(localStorage.getItem(clave(cuentaId)))); }
  catch { return null; }
}

function guardarLocal(cuentaId, cfg) {
  try {
    if (cfg) localStorage.setItem(clave(cuentaId), JSON.stringify(cfg));
    else localStorage.removeItem(clave(cuentaId));
  } catch { /* sin almacenamiento local: seguimos solo con la base */ }
}

const aFila = (cfg) => (cfg
  ? { sueldo_quincenal: cfg.sueldo, dia_cobro_1: cfg.dia1, dia_cobro_2: cfg.dia2 }
  : { sueldo_quincenal: 0 });

export async function cargarQuincenaCfg(cuentaId) {
  const local = leerQuincenaLocal(cuentaId);
  const { data, error } = await supabase.from("cuentas").select("sueldo_quincenal, dia_cobro_1, dia_cobro_2").eq("id", cuentaId).single();
  if (error || !data) return local; // base sin las columnas o sin red: manda la copia local
  if (data.sueldo_quincenal == null) {
    // la base nunca lo ha tenido: si aqui ya estaba configurado, subirlo
    if (local) await supabase.from("cuentas").update(aFila(local)).eq("id", cuentaId);
    return local;
  }
  const cfg = normalizar({ sueldo: data.sueldo_quincenal, dia1: data.dia_cobro_1, dia2: data.dia_cobro_2 });
  guardarLocal(cuentaId, cfg);
  return cfg;
}

/* Devuelve { enNube }: false si solo quedo guardado en este dispositivo */
export async function guardarQuincenaCfg(cuentaId, cfg) {
  const limpio = normalizar(cfg);
  guardarLocal(cuentaId, limpio);
  const { error } = await supabase.from("cuentas").update(aFila(limpio)).eq("id", cuentaId);
  return { cfg: limpio, enNube: !error };
}

export const invitacionOculta = (cuentaId) => {
  try { return localStorage.getItem(claveOculta(cuentaId)) === "1"; } catch { return false; }
};
export const ocultarInvitacion = (cuentaId) => {
  try { localStorage.setItem(claveOculta(cuentaId), "1"); } catch { /* nada */ }
};

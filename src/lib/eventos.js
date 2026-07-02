import { supabase } from "./supabase";
import { Capacitor } from "@capacitor/core";

/* Registro de eventos del embudo de activacion.
   Fire-and-forget: nunca bloquea la UI ni rompe nada si falla.
   No registrar datos sensibles (montos, notas, nombres). */

const plataforma = Capacitor.isNativePlatform() ? "android" : "web";

export function logEvento(evento, props = {}) {
  try {
    supabase.from("eventos").insert({ evento, props, plataforma }).then(() => {});
  } catch {
    /* analytics jamas debe tirar la app */
  }
}

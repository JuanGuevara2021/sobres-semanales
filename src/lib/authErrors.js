/* ============================================================
   Traduccion de errores de Supabase Auth al español.
   Feedback de tester (2026-07-04): los errores en ingles
   ("For security purposes...") hacen sentir insegura la app.
   Nunca mostrar ingles crudo: si no hay traduccion, mensaje generico.
   ============================================================ */

const TRADUCCIONES = [
  [/invalid login credentials/i, () => "Correo o contraseña incorrectos."],
  [/email not confirmed/i, () => "Tu correo aún no está confirmado. Busca el correo de confirmación en tu bandeja (y en spam)."],
  [/user already registered/i, () => "Ya existe una cuenta con ese correo. Prueba iniciar sesión."],
  [/password should be at least (\d+)/i, (m) => `La contraseña debe tener al menos ${m[1]} caracteres.`],
  [/for security purposes, you can only request this after (\d+) seconds?/i, (m) => `Por seguridad, espera ${m[1]} segundos y vuelve a intentar.`],
  [/email rate limit exceeded|over_email_send_rate_limit/i, () => "Se enviaron demasiados correos. Espera unos minutos e intenta de nuevo."],
  [/unable to validate email address|invalid format|is invalid/i, () => "Escribe un correo válido."],
  [/new password should be different/i, () => "La nueva contraseña debe ser diferente a la anterior."],
  [/signups? not allowed|signup.*disabled/i, () => "El registro está desactivado por el momento."],
  [/failed to fetch|networkerror|network request failed/i, () => "Sin conexión. Revisa tu internet e intenta de nuevo."],
];

export function traducirErrorAuth(mensaje) {
  if (mensaje) {
    for (const [regex, traducir] of TRADUCCIONES) {
      const m = mensaje.match(regex);
      if (m) return traducir(m);
    }
    console.warn("Error de auth sin traduccion:", mensaje);
  }
  return "Ocurrió un error. Intenta de nuevo en un momento.";
}

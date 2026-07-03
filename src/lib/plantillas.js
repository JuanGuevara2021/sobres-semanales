/* ============================================================
   Logica pura de plantillas de sobres para el onboarding:
   escalado de montos por moneda y reparto de un total semanal.
   (Los montos de plantillas_sobres estan pensados en MXN.)
   ============================================================ */

/* factor: multiplicador MXN → moneda (orden de magnitud realista, no tipo de
   cambio exacto — el usuario ajusta despues). paso: redondeo a cifra natural. */
export const ESCALA_MONEDA = {
  MXN: { factor: 1, paso: 10 },
  USD: { factor: 0.05, paso: 1 },
  ARS: { factor: 75, paso: 500 },
  COP: { factor: 220, paso: 1000 },
  CLP: { factor: 50, paso: 500 },
  PEN: { factor: 0.2, paso: 1 },
};

const escala = (moneda) => ESCALA_MONEDA[moneda] || ESCALA_MONEDA.MXN;

export const redondearAPaso = (monto, paso) => Math.max(paso, Math.round(monto / paso) * paso);

/* Convierte un monto base (MXN) de plantilla a la moneda elegida. */
export function escalarMonto(montoMXN, moneda) {
  const { factor, paso } = escala(moneda);
  return redondearAPaso(montoMXN * factor, paso);
}

/* Escala los sobres de una plantilla a la moneda elegida. */
export function escalarSobres(sobres, moneda) {
  return sobres.map((s) => ({ ...s, aportacion_semanal: escalarMonto(Number(s.aportacion_semanal), moneda) }));
}

/* Reparte un total semanal entre los sobres proporcionalmente a sus montos
   actuales (o en partes iguales si todos estan en cero), redondeando al paso
   de la moneda. La suma resultante puede diferir un poco del total tecleado
   por el redondeo; la UI muestra la suma real. */
export function repartirTotal(total, sobres, moneda) {
  const { paso } = escala(moneda);
  const montos = sobres.map((s) => Number(s.aportacion_semanal) || 0);
  const suma = montos.reduce((a, b) => a + b, 0);
  const proporciones = suma > 0 ? montos.map((m) => m / suma) : montos.map(() => 1 / (montos.length || 1));
  return sobres.map((s, i) => ({ ...s, aportacion_semanal: redondearAPaso(total * proporciones[i], paso) }));
}

export const sumaSobres = (sobres) => sobres.reduce((a, s) => a + (Number(s.aportacion_semanal) || 0), 0);

import { esPublica } from "./appMode";

export const PILAR = { REGISTRAR: 1, SOBRES: 2, AHORRO: 3, DOMINIO: 4 };

const TABS_POR_PILAR = {
  1: ["semana"],
  2: ["semana", "sobres"],
  3: ["semana", "libreta", "sobres"],
  4: ["semana", "libreta", "sobres", "pagos", "analisis"],
};

export function getTabsVisibles(pilar) {
  if (!esPublica) return TABS_POR_PILAR[4];
  return TABS_POR_PILAR[pilar] || TABS_POR_PILAR[1];
}

export function calcPilarSugerido(pilar, gastosCount, cierresCount, semanasConGastos) {
  if (!esPublica) return 4;
  if (pilar >= 4) return 4;
  if (pilar === 1 && gastosCount >= 3) return 2;
  if (pilar === 2 && cierresCount >= 1) return 3;
  if (pilar === 3 && semanasConGastos >= 2) return 4;
  return pilar;
}

const TRANSICIONES = {
  2: {
    emoji: "✉️",
    titulo: "Ya llevas 3 gastos!",
    mensaje: "Ahora te enseno como funcionan los sobres. Cada sobre tiene un limite semanal — cuando registras un gasto, se descuenta automaticamente.",
    boton: "Ver mis sobres",
    tabDestino: "sobres",
  },
  3: {
    emoji: "🐷",
    titulo: "Tu primer ahorro!",
    mensaje: "Lo que no gastaste de tus sobres se fue al cochinito automaticamente. Asi funciona el sistema: tu solo registras gastos, el ahorro llega solo.",
    boton: "Ver mi ahorro",
    tabDestino: "sobres",
  },
  4: {
    emoji: "📊",
    titulo: "Ya dominas lo basico!",
    mensaje: "Ahora tienes acceso a herramientas avanzadas: graficas para entender a donde se va tu dinero, pagos recurrentes para nunca olvidar una fecha, y rastreo de compras a meses.",
    boton: "Explorar",
    tabDestino: "analisis",
  },
};

export function getTransicion(nuevoPilar) {
  return TRANSICIONES[nuevoPilar] || null;
}

export const NIVEL_ADS = {
  1: "ninguno",
  2: "banner",
  3: "banner_interstitial_light",
  4: "banner_interstitial_full",
};

export function getNivelAds(pilar) {
  if (!esPublica) return "ninguno";
  return NIVEL_ADS[pilar] || "ninguno";
}

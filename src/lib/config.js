const MONEDA_CONFIG = {
  MXN: { locale: "es-MX", code: "MXN", symbol: "$", decimals: 0, flag: "\u{1F1F2}\u{1F1FD}", label: "Peso mexicano" },
  COP: { locale: "es-CO", code: "COP", symbol: "$", decimals: 0, flag: "\u{1F1E8}\u{1F1F4}", label: "Peso colombiano" },
  ARS: { locale: "es-AR", code: "ARS", symbol: "$", decimals: 0, flag: "\u{1F1E6}\u{1F1F7}", label: "Peso argentino" },
  PEN: { locale: "es-PE", code: "PEN", symbol: "S/", decimals: 2, flag: "\u{1F1F5}\u{1F1EA}", label: "Sol peruano" },
  CLP: { locale: "es-CL", code: "CLP", symbol: "$", decimals: 0, flag: "\u{1F1E8}\u{1F1F1}", label: "Peso chileno" },
  USD: { locale: "en-US", code: "USD", symbol: "$", decimals: 2, flag: "\u{1F1FA}\u{1F1F8}", label: "Dolar estadounidense" },
};

export const MONEDAS = Object.keys(MONEDA_CONFIG);
export const getMonedaConfig = (moneda) => MONEDA_CONFIG[moneda] || MONEDA_CONFIG.MXN;

export function createMoneyFormatter(moneda) {
  const cfg = getMonedaConfig(moneda);
  return (n) =>
    new Intl.NumberFormat(cfg.locale, {
      style: "currency",
      currency: cfg.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: Math.abs(n % 1) > 0.001 ? 2 : cfg.decimals,
    }).format(n);
}

const DIAS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const DIAS_FULL = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export { DIAS, MESES };

const pad = (n) => String(n).padStart(2, "0");
export const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromStr = (s) => { const [y, m, dd] = s.split("-").map(Number); return new Date(y, m - 1, dd); };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export function createWeekHelpers(diaInicio = 6) {
  const weekStartOf = (d) => addDays(d, -((d.getDay() - diaInicio + 7) % 7));
  const weekOf = (fechaStr) => toStr(weekStartOf(fromStr(fechaStr)));
  const diaFin = (diaInicio + 6) % 7;
  const weekLabel = (ws) => {
    const a = fromStr(ws);
    const b = addDays(a, 6);
    return `${DIAS[diaInicio]} ${a.getDate()} ${MESES[a.getMonth()]} – ${DIAS[diaFin]} ${b.getDate()} ${MESES[b.getMonth()]}`;
  };
  const fmtDia = (s) => { const d = fromStr(s); return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`; };
  const weekDayOrder = Array.from({ length: 7 }, (_, i) => (diaInicio + i) % 7);

  return { weekStartOf, weekOf, weekLabel, fmtDia, weekDayOrder, diaInicio, diaFin };
}

export const DIAS_INICIO_OPTIONS = [
  { value: 6, label: "Sabado" },
  { value: 1, label: "Lunes" },
  { value: 0, label: "Domingo" },
];

export const CATEGORIAS_DEFAULT = [
  { nombre: "casa",      label: "Casa",      color: "#2563eb" },
  { nombre: "renta",     label: "Renta",     color: "#7c3aed" },
  { nombre: "diversion", label: "Diversion", color: "#db2777" },
  { nombre: "salud",     label: "Salud",     color: "#059669" },
  { nombre: "escuela",   label: "Escuela",   color: "#d97706" },
  { nombre: "tarjetas",  label: "Tarjetas",  color: "#dc2626" },
];

export const COLORES_CATEGORIA = [
  "#2563eb", "#7c3aed", "#db2777", "#059669", "#d97706", "#dc2626",
  "#0891b2", "#4f46e5", "#c026d3", "#16a34a", "#ea580c", "#e11d48",
];

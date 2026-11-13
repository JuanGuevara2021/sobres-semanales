import { describe, it, expect } from "vitest";
import { periodoQuincena, fechaDia, cicloQueSePaga, compromisosQuincena, calcularQuincena } from "./quincena";
import { createWeekHelpers, toStr } from "./config";

/* "Hoy" fijo: miercoles 2026-11-18. Semana sabado-viernes → la actual
   empieza el sabado 2026-11-14. Con cobro los dias 15 y 30 la quincena
   en curso va del 15 al 29 de noviembre. */
const HOY = new Date(2026, 10, 18);
const { weekOf } = createWeekHelpers(6);

/* ============ periodoQuincena ============ */
describe("periodoQuincena", () => {
  it("a media quincena: del ultimo cobro al dia anterior al siguiente", () => {
    expect(periodoQuincena(HOY, 15, 30)).toEqual({
      inicio: "2026-11-15", fin: "2026-11-29", siguienteCobro: "2026-11-30",
      diasTotales: 15, diaActual: 4, diasRestantes: 12,
    });
  });

  it("el dia de cobro arranca una quincena nueva", () => {
    const p = periodoQuincena(new Date(2026, 10, 15), 15, 30);
    expect(p.inicio).toBe("2026-11-15");
    expect(p.diaActual).toBe(1);
    const q = periodoQuincena(new Date(2026, 10, 30), 15, 30);
    expect(q).toMatchObject({ inicio: "2026-11-30", fin: "2026-12-14", siguienteCobro: "2026-12-15" });
  });

  it("el dia antes del cobro es el ultimo de la quincena", () => {
    const p = periodoQuincena(new Date(2026, 10, 29), 15, 30);
    expect(p).toMatchObject({ inicio: "2026-11-15", fin: "2026-11-29", diasRestantes: 1 });
  });

  it("dia 30 en febrero usa el ultimo dia del mes", () => {
    const p = periodoQuincena(new Date(2027, 1, 20), 15, 30);
    expect(p).toMatchObject({ inicio: "2027-02-15", fin: "2027-02-27", siguienteCobro: "2027-02-28" });
    const q = periodoQuincena(new Date(2027, 2, 1), 15, 30);
    expect(q).toMatchObject({ inicio: "2027-02-28", fin: "2027-03-14" });
  });

  it("dia 31 significa fin de mes", () => {
    expect(periodoQuincena(new Date(2026, 10, 30), 15, 31).inicio).toBe("2026-11-30");
    expect(periodoQuincena(new Date(2026, 11, 30), 15, 31)).toMatchObject({ inicio: "2026-12-15", fin: "2026-12-30", siguienteCobro: "2026-12-31" });
  });

  it("cobro los dias 1 y 16", () => {
    expect(periodoQuincena(HOY, 1, 16)).toMatchObject({ inicio: "2026-11-16", fin: "2026-11-30", siguienteCobro: "2026-12-01" });
  });

  it("los dos dias iguales = sueldo mensual", () => {
    expect(periodoQuincena(HOY, 1, 1)).toMatchObject({ inicio: "2026-11-01", fin: "2026-11-30", diasTotales: 30 });
  });

  it("cruza el cambio de año", () => {
    expect(periodoQuincena(new Date(2027, 0, 3), 15, 30)).toMatchObject({ inicio: "2026-12-30", fin: "2027-01-14" });
  });
});

describe("fechaDia y cicloQueSePaga", () => {
  it("fechaDia recorta al ultimo dia y acepta meses desbordados", () => {
    expect(toStr(fechaDia(2027, 1, 30))).toBe("2027-02-28");
    expect(toStr(fechaDia(2026, 12, 5))).toBe("2027-01-05");
    expect(toStr(fechaDia(2027, -1, 31))).toBe("2026-12-31");
  });

  it("el pago liquida el ciclo que cerro en el ultimo corte", () => {
    expect(cicloQueSePaga(5, new Date(2026, 10, 25))).toEqual({ inicio: "2026-10-06", fin: "2026-11-05" });
    expect(cicloQueSePaga(15, new Date(2026, 11, 5))).toEqual({ inicio: "2026-10-16", fin: "2026-11-15" });
  });
});

/* ============ datos de ejemplo ============ */
const pago = (over = {}) => ({ id: "p", nombre: "Pago", monto_estimado: 100, dia_pago: 20, frecuencia: "mensual", medio_pago: "debito", categoria: "casa", destino_sobre_id: null, tarjeta_id: null, activo: true, ...over });
const gasto = (over = {}) => ({ id: Math.random().toString(36).slice(2), fecha: "2026-11-16", monto: 100, medio_pago: "efectivo", categoria: "casa", sobre_id: null, tarjeta_id: null, nota: "", ...over });

const TARJETA = { id: "t1", nombre: "BBVA", dia_corte: 5, dia_pago: 25, activo: true };
const MSI = [{ id: "m1", tarjeta_id: "t1", monto_total: 1200, num_meses: 12, mes_primer_pago: "2026-10-01", activo: true }];
const PAGOS = [
  pago({ id: "renta", nombre: "Renta", monto_estimado: 6000, dia_pago: 16, categoria: "renta" }),
  pago({ id: "internet", nombre: "Internet", monto_estimado: 500, dia_pago: 20, destino_sobre_id: "s2" }),
  pago({ id: "luz", nombre: "Luz", monto_estimado: 350, dia_pago: 5 }),
  pago({ id: "gym", nombre: "Gym", monto_estimado: 300, dia_pago: 1, dia_pago_2: 16, frecuencia: "quincenal", categoria: "salud" }),
  pago({ id: "mesada", nombre: "Mesada", monto_estimado: 100, dia_pago: 5, frecuencia: "semanal" }),
  pago({ id: "netflix", nombre: "Netflix", monto_estimado: 199, dia_pago: 22, medio_pago: "credito", tarjeta_id: "t1", categoria: "diversion" }),
  pago({ id: "viejo", nombre: "Cable", monto_estimado: 800, dia_pago: 18, activo: false }),
  pago({ id: "ptar", nombre: "Tarjeta BBVA", monto_estimado: 2500, dia_pago: 25, categoria: "tarjetas", tarjeta_id: "t1" }),
];
const SOBRES = [
  { id: "s1", nombre: "Despensa", aportacion_semanal: 700, es_ahorro: false },
  { id: "s2", nombre: "Servicios", aportacion_semanal: 700, es_ahorro: false },
  { id: "sa", nombre: "Ahorro", aportacion_semanal: 500, es_ahorro: true },
];
const GASTOS = [
  gasto({ fecha: "2026-11-16", monto: 320, medio_pago: "debito", categoria: "salud", nota: "Gym" }),
  gasto({ fecha: "2026-11-15", monto: 800, medio_pago: "efectivo", categoria: "casa", sobre_id: "s1", nota: "super" }),
  gasto({ fecha: "2026-11-17", monto: 200, medio_pago: "credito", tarjeta_id: "t1", categoria: "diversion", sobre_id: "s2", nota: "tacos" }),
  gasto({ fecha: "2026-11-17", monto: 150, medio_pago: "debito", categoria: "diversion", nota: "cine" }),
  // fuera de la quincena
  gasto({ fecha: "2026-11-10", monto: 999, medio_pago: "credito", tarjeta_id: "t1", nota: "ya en el ciclo siguiente" }),
  gasto({ fecha: "2026-10-20", monto: 400, medio_pago: "credito", tarjeta_id: "t1", nota: "compra del corte" }),
];
const BASE = { sueldo: 20000, dia1: 15, dia2: 30, gastos: GASTOS, pagos: PAGOS, tarjetas: [TARJETA], msi: MSI, sobres: SOBRES, weekOf, diaInicioSemana: 6, hoy: HOY };

/* ============ compromisosQuincena ============ */
describe("compromisosQuincena", () => {
  const lista = compromisosQuincena({ pagos: PAGOS, tarjetas: [TARJETA], msi: MSI, gastos: GASTOS, inicio: "2026-11-15", fin: "2026-11-29", hoy: HOY, weekOf, diaInicioSemana: 6 });
  const de = (nombre) => lista.filter((c) => c.nombre === nombre);

  it("solo incluye lo que cae dentro de la quincena y esta activo", () => {
    expect(de("Luz")).toHaveLength(0);    // dia 5: quincena anterior
    expect(de("Cable")).toHaveLength(0);  // inactivo
    expect(lista.map((c) => c.fecha)).toEqual([...lista.map((c) => c.fecha)].sort());
  });

  it("mensual: vencido si ya paso la fecha sin gasto, pendiente si aun no llega", () => {
    expect(de("Renta")[0]).toMatchObject({ fecha: "2026-11-16", monto: 6000, estado: "vencido", tipo: "fijo" });
    expect(de("Internet")[0]).toMatchObject({ fecha: "2026-11-20", estado: "pendiente", viaSobre: true });
  });

  it("quincenal: solo la mitad que toca, pagada con el monto real del gasto", () => {
    expect(de("Gym")).toHaveLength(1);
    expect(de("Gym")[0]).toMatchObject({ fecha: "2026-11-16", monto: 320, estado: "pagado" });
  });

  it("semanal: una vez por cada semana de la quincena", () => {
    expect(de("Mesada").map((c) => c.fecha)).toEqual(["2026-11-20", "2026-11-27"]);
  });

  it("un pago fijo con credito queda marcado: no sale de este sueldo", () => {
    expect(de("Netflix")[0]).toMatchObject({ aCredito: true, estado: "pendiente" });
  });

  it("tarjeta: estima MSI + compras a credito del corte que se paga", () => {
    // el pago recurrente 'Tarjeta BBVA' no se duplica: manda la tarjeta
    expect(de("Tarjeta BBVA")).toHaveLength(0);
    expect(de("Pago BBVA")[0]).toMatchObject({ tipo: "tarjeta", fecha: "2026-11-25", monto: 500, estado: "pendiente", detalle: { msi: 100, compras: 400 } });
  });

  it("tarjeta ya pagada usa el monto real", () => {
    const l = compromisosQuincena({ pagos: PAGOS, tarjetas: [TARJETA], msi: MSI, gastos: [...GASTOS, gasto({ fecha: "2026-11-25", monto: 640, medio_pago: "debito", categoria: "tarjetas", nota: "Pago BBVA" })], inicio: "2026-11-15", fin: "2026-11-29", hoy: new Date(2026, 10, 26), weekOf });
    expect(l.find((c) => c.nombre === "Pago BBVA")).toMatchObject({ monto: 640, estado: "pagado" });
  });

  it("tarjeta sin MSI ni compras cae al monto del pago recurrente", () => {
    const l = compromisosQuincena({ pagos: PAGOS, tarjetas: [TARJETA], msi: [], gastos: [], inicio: "2026-11-15", fin: "2026-11-29", hoy: HOY, weekOf });
    expect(l.find((c) => c.nombre === "Pago BBVA").monto).toBe(2500);
  });

  it("pago de categoria tarjetas sin tarjeta registrada se trata como pago fijo", () => {
    const l = compromisosQuincena({ pagos: [pago({ id: "x", nombre: "Tarjeta Liverpool", monto_estimado: 900, dia_pago: 28, categoria: "tarjetas" })], tarjetas: [], msi: [], gastos: [], inicio: "2026-11-15", fin: "2026-11-29", hoy: HOY, weekOf });
    expect(l).toHaveLength(1);
    expect(l[0]).toMatchObject({ tipo: "fijo", monto: 900, fecha: "2026-11-28" });
  });
});

/* ============ calcularQuincena ============ */
describe("calcularQuincena", () => {
  const q = calcularQuincena(BASE);

  it("lo que ya salio: solo efectivo, debito y transferencia de la quincena", () => {
    expect(q.salidas).toEqual({ fijos: 320, tarjetas: 0, diario: 950, total: 1270 });
    expect(q.aCredito).toBe(200);
    expect(q.diarioPorCategoria).toEqual([{ categoria: "casa", monto: 800 }, { categoria: "diversion", monto: 150 }]);
  });

  it("lo comprometido: fijos y tarjetas pendientes, sin lo que va a credito", () => {
    expect(q.porPagar).toEqual({ fijos: 6700, tarjetas: 500, aCredito: 199, total: 7200 });
  });

  it("te va a quedar = sueldo - lo que salio - lo por pagar", () => {
    expect(q.disponibleHoy).toBe(18730);
    expect(q.teQueda).toBe(11530);
  });

  it("reserva de sobres: resto de la semana + plan diario, sin duplicar fijos que salen de un sobre", () => {
    // semana: 1400 - 1000 gastados = 400; despues 9 dias x 200 = 1800; menos Internet (500, via sobre)
    expect(q.reservaSobres).toBeCloseTo(1700, 6);
    expect(q.libre).toBeCloseTo(9830, 6);
  });

  it("las partes suman exactamente el sueldo cuando alcanza", () => {
    const suma = q.partes.reduce((a, p) => a + p.monto, 0);
    expect(suma).toBeCloseTo(20000, 6);
    expect(q.partes.map((p) => p.clave)).toEqual(["fijos_pagados", "diario", "fijos_por_pagar", "tarjetas_por_pagar", "sobres", "libre"]);
    expect(q.partes.find((p) => p.clave === "fijos_por_pagar").pct).toBeCloseTo(0.335, 6);
  });

  it("si el sueldo no alcanza: queda negativo y no hay parte libre", () => {
    const corto = calcularQuincena({ ...BASE, sueldo: 5000 });
    expect(corto.teQueda).toBe(5000 - 1270 - 7200);
    expect(corto.libre).toBeLessThan(0);
    expect(corto.partes.some((p) => p.clave === "libre")).toBe(false);
  });

  it("el pago de la tarjeta registrado cuenta como salida y deja de estar por pagar", () => {
    const r = calcularQuincena({ ...BASE, hoy: new Date(2026, 10, 26), gastos: [...GASTOS, gasto({ fecha: "2026-11-25", monto: 640, medio_pago: "debito", categoria: "tarjetas", nota: "Pago BBVA" })] });
    expect(r.salidas.tarjetas).toBe(640);
    expect(r.porPagar.tarjetas).toBe(0);
  });

  it("sin datos no truena", () => {
    const vacio = calcularQuincena({ sueldo: 10000, weekOf, hoy: HOY });
    expect(vacio.teQueda).toBe(10000);
    expect(vacio.partes).toEqual([{ clave: "libre", etiqueta: "Libre", monto: 10000, grupo: "libre", pct: 1 }]);
  });
});

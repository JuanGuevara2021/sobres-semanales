import { describe, it, expect } from "vitest";
import { getPagosProximos, getCicloActual, calcEstimadoTarjeta, getTarjetaRecordatorios, calcMSI } from "./pagos";
import { createWeekHelpers } from "./config";

/* "Hoy" fijo: miercoles 2026-07-01 (dia 1 del mes, dia 3 de la semana).
   Semana sabado-viernes → la actual empieza el 2026-06-27. */
const HOY = new Date(2026, 6, 1);
const { weekStartOf, weekOf } = createWeekHelpers(6);

/* ============ calcMSI ============ */
describe("calcMSI", () => {
  const msi = (over = {}) => ({ monto_total: 1200, num_meses: 12, mes_primer_pago: "2026-05-01", ...over });

  it("pendiente si el primer pago es en el futuro", () => {
    const st = calcMSI(msi({ mes_primer_pago: "2026-08-01" }), false, HOY);
    expect(st).toEqual({ estatus: "pendiente", pagados: 0, meses: 12, mensual: 100, restante: 1200 });
  });

  it("activo: cuenta meses transcurridos desde el primer pago", () => {
    // may y jun transcurridos → 2 pagados, restan 10 meses
    const st = calcMSI(msi(), false, HOY);
    expect(st).toEqual({ estatus: "activo", pagados: 2, meses: 12, mensual: 100, restante: 1000 });
  });

  it("pagoEsteMes suma un mes pagado", () => {
    const st = calcMSI(msi(), true, HOY);
    expect(st.pagados).toBe(3);
    expect(st.restante).toBe(900);
  });

  it("el mes del primer pago cuenta como activo con 0 pagados", () => {
    const st = calcMSI(msi({ mes_primer_pago: "2026-07-15" }), false, HOY);
    expect(st.estatus).toBe("activo");
    expect(st.pagados).toBe(0);
  });

  it("liquidado cuando pagados >= meses, restante 0", () => {
    const st = calcMSI(msi({ num_meses: 3, mes_primer_pago: "2026-03-01" }), false, HOY);
    expect(st).toEqual({ estatus: "liquidado", pagados: 3, meses: 3, mensual: 400, restante: 0 });
  });

  it("pagoEsteMes puede liquidar el ultimo mes", () => {
    const st = calcMSI(msi({ num_meses: 3, mes_primer_pago: "2026-05-01" }), true, HOY);
    expect(st.estatus).toBe("liquidado");
  });
});

/* ============ getCicloActual ============ */
describe("getCicloActual", () => {
  it("antes o en el dia de corte: ciclo del mes pasado a este mes", () => {
    expect(getCicloActual(15, HOY)).toEqual({ inicio: "2026-06-16", fin: "2026-07-15" });
  });

  it("despues del corte: ciclo de este mes al siguiente", () => {
    expect(getCicloActual(15, new Date(2026, 6, 20))).toEqual({ inicio: "2026-07-16", fin: "2026-08-15" });
  });

  it("cruza el año", () => {
    expect(getCicloActual(15, new Date(2026, 0, 10))).toEqual({ inicio: "2025-12-16", fin: "2026-01-15" });
  });
});

/* ============ calcEstimadoTarjeta ============ */
describe("calcEstimadoTarjeta", () => {
  const tarjeta = { id: "t1" };
  const msis = [
    { tarjeta_id: "t1", activo: true, monto_total: 1200, num_meses: 12, mes_primer_pago: "2026-05-01" },  // activo, 100/mes
    { tarjeta_id: "t1", activo: true, monto_total: 900, num_meses: 3, mes_primer_pago: "2026-03-01" },    // liquidado
    { tarjeta_id: "t2", activo: true, monto_total: 600, num_meses: 6, mes_primer_pago: "2026-05-01" },    // otra tarjeta
    { tarjeta_id: "t1", activo: false, monto_total: 500, num_meses: 5, mes_primer_pago: "2026-05-01" },   // inactivo
  ];

  it("suma solo los MSI activos de esa tarjeta", () => {
    const est = calcEstimadoTarjeta(tarjeta, [], msis, [], false, HOY);
    expect(est).toEqual({ msi: 100, numMSI: 1, total: 100 });
  });
});

/* ============ getPagosProximos ============ */
describe("getPagosProximos", () => {
  const pago = (over = {}) => ({
    nombre: "Luz", activo: true, categoria: "casa", frecuencia: "mensual",
    dia_pago: 2, pospuesto_hasta: null, ...over,
  });
  const gasto = (fecha, nota) => ({ fecha, nota, sobre_id: null, monto: 100 });
  const run = (pagos, gastos = []) => getPagosProximos(pagos, gastos, weekStartOf, weekOf, HOY);

  it("mensual: aparece dentro de la ventana (-2 a +3 dias)", () => {
    expect(run([pago({ dia_pago: 2 })])).toHaveLength(1);  // mañana
    expect(run([pago({ dia_pago: 4 })])).toHaveLength(1);  // en 3 dias
    expect(run([pago({ dia_pago: 10 })])).toHaveLength(0); // lejos
  });

  it("mensual: no aparece si ya se pago este mes (por nota)", () => {
    expect(run([pago()], [gasto("2026-07-01", "Luz")])).toHaveLength(0);
    expect(run([pago()], [gasto("2026-06-02", "Luz")])).toHaveLength(1); // pago del mes pasado no cuenta
  });

  it("semanal: solo aparece el dia exacto de la semana", () => {
    // HOY es miercoles (dia 3)
    expect(run([pago({ frecuencia: "semanal", dia_pago: 3 })])).toHaveLength(1);
    expect(run([pago({ frecuencia: "semanal", dia_pago: 4 })])).toHaveLength(0);
  });

  it("semanal: no aparece si ya se pago esta semana", () => {
    const p = pago({ frecuencia: "semanal", dia_pago: 3 });
    expect(run([p], [gasto("2026-06-28", "Luz")])).toHaveLength(0); // domingo de esta semana
    expect(run([p], [gasto("2026-06-26", "Luz")])).toHaveLength(1); // viernes de la semana pasada
  });

  it("quincenal: avisa cerca del primer dia y distingue las dos quincenas", () => {
    const p = pago({ frecuencia: "quincenal", dia_pago: 1, dia_pago_2: 15 });
    const r = run([p]);
    expect(r).toHaveLength(1);
    expect(r[0]._diaProximo).toBe(1);
    // ya pagada la primera quincena (dia <= 8) → no avisa
    expect(run([p], [gasto("2026-07-01", "Luz")])).toHaveLength(0);
  });

  it("quincenal: cerca del dia 15 avisa la segunda quincena", () => {
    const p = pago({ frecuencia: "quincenal", dia_pago: 1, dia_pago_2: 15 });
    const hoy14 = new Date(2026, 6, 14);
    const r = getPagosProximos([p], [gasto("2026-07-01", "Luz")], weekStartOf, weekOf, hoy14);
    expect(r).toHaveLength(1);
    expect(r[0]._diaProximo).toBe(15); // el pago del dia 1 no tapa al del 15
  });

  it("excluye inactivos, categoria tarjetas y pospuestos", () => {
    expect(run([pago({ activo: false })])).toHaveLength(0);
    expect(run([pago({ categoria: "tarjetas" })])).toHaveLength(0);
    expect(run([pago({ pospuesto_hasta: "2026-07-05" })])).toHaveLength(0);
    expect(run([pago({ pospuesto_hasta: "2026-06-30" })])).toHaveLength(1); // posposicion vencida
  });
});

/* ============ getTarjetaRecordatorios ============ */
describe("getTarjetaRecordatorios", () => {
  const tarjeta = (over = {}) => ({ id: "t1", nombre: "BBVA", activo: true, dia_pago: 3, ...over });
  const run = (tarjetas, gastos = []) => getTarjetaRecordatorios(tarjetas, [], gastos, HOY);

  it("avisa dentro de la ventana (-2 a +3 dias del dia de pago)", () => {
    expect(run([tarjeta({ dia_pago: 3 })])).toHaveLength(1);
    expect(run([tarjeta({ dia_pago: 10 })])).toHaveLength(0);
  });

  it("no avisa si ya se pago este mes (nota 'Pago <nombre>')", () => {
    expect(run([tarjeta()], [{ fecha: "2026-07-01", nota: "Pago BBVA" }])).toHaveLength(0);
    expect(run([tarjeta()], [{ fecha: "2026-06-03", nota: "Pago BBVA" }])).toHaveLength(1);
  });

  it("ignora tarjetas inactivas o sin dia de pago", () => {
    expect(run([tarjeta({ activo: false })])).toHaveLength(0);
    expect(run([tarjeta({ dia_pago: null })])).toHaveLength(0);
  });
});

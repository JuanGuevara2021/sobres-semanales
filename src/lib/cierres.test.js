import { describe, it, expect } from "vitest";
import { calcularCierres } from "./cierres";
import { createWeekHelpers } from "./config";

/* Semana sabado-viernes (diaInicio 6, el default de la app).
   "Hoy" fijo: miercoles 2026-07-01 → la semana actual empieza el sabado 2026-06-27.
   Semanas pasadas: 2026-06-20 (sab) y 2026-06-13 (sab). */
const { weekStartOf, weekOf } = createWeekHelpers(6);
const HOY = new Date(2026, 6, 1); // 1 jul 2026, miercoles

const sobre = (over = {}) => ({
  id: "s1", nombre: "Comida", emoji: "🍎", aportacion_semanal: 500,
  tipo_cierre: "ahorro", es_ahorro: false, saldo_acumulado: 0, ...over,
});
const gasto = (fecha, monto, sobre_id = "s1") => ({ fecha, monto, sobre_id });

const run = ({ sobres, gastos, cierres = [] }) =>
  calcularCierres({ sobres, gastos, cierresExistentes: cierres, weekStartOf, weekOf, hoy: HOY });

describe("que semanas se cierran", () => {
  it("cierra una semana pasada con gastos", () => {
    const r = run({ sobres: [sobre()], gastos: [gasto("2026-06-22", 100)] });
    expect(r.nuevos).toHaveLength(1);
    expect(r.nuevos[0].semana).toBe("2026-06-20");
  });

  it("NO cierra la semana actual", () => {
    const r = run({ sobres: [sobre()], gastos: [gasto("2026-06-29", 100)] });
    expect(r.nuevos).toHaveLength(0);
  });

  it("NO cierra semanas sin gastos (no inflar ahorro)", () => {
    // gastos solo en la semana del 13; la del 20 queda vacia y no debe cerrarse
    const r = run({ sobres: [sobre()], gastos: [gasto("2026-06-15", 100)] });
    expect(r.nuevos.map((c) => c.semana)).toEqual(["2026-06-13"]);
  });

  it("salta semanas ya cerradas", () => {
    const r = run({
      sobres: [sobre()],
      gastos: [gasto("2026-06-15", 100), gasto("2026-06-22", 100)],
      cierres: [{ semana: "2026-06-13" }],
    });
    expect(r.nuevos.map((c) => c.semana)).toEqual(["2026-06-20"]);
  });

  it("un gasto fuera de sobres dispara el cierre pero no afecta a ningun sobre", () => {
    const r = run({ sobres: [sobre()], gastos: [gasto("2026-06-22", 100, null)] });
    expect(r.nuevos).toHaveLength(1);
    const d = r.nuevos[0].detalle[0];
    expect(d.gastado).toBe(0);
    expect(d.sobrante).toBe(500); // aportacion completa sobra
  });
});

describe("sobre tipo ahorro", () => {
  it("sobrante positivo pasa al ahorro y el sobre reinicia a 0", () => {
    const r = run({ sobres: [sobre()], gastos: [gasto("2026-06-22", 300)] });
    const d = r.nuevos[0].detalle[0];
    expect(d.sobrante).toBe(200); // 0 + 500 - 300
    expect(r.totalAhorrado).toBe(200);
    expect(r.saldosActualizados).toHaveLength(0); // saldo era 0 y queda 0
  });

  it("sobregiro es rescatado por el Ahorro y el sobre reinicia a 0", () => {
    const r = run({ sobres: [sobre()], gastos: [gasto("2026-06-22", 600)] });
    const d = r.nuevos[0].detalle[0];
    expect(d.sobrante).toBe(0);
    expect(d.rescate).toBe(100);
    expect(r.totalAhorrado).toBe(-100);
    expect(r.saldosActualizados).toHaveLength(0); // saldo era 0 y queda 0
  });

  it("tras un rescate, la semana siguiente arranca limpia con su aportacion completa", () => {
    // semana 1: gasta 600 (rescate 100, reinicia a 0); semana 2: gasta 100 → sobrante 400
    const r = run({
      sobres: [sobre()],
      gastos: [gasto("2026-06-15", 600), gasto("2026-06-22", 100)],
    });
    expect(r.nuevos[0].detalle[0].rescate).toBe(100);
    expect(r.nuevos[1].detalle[0].saldo_inicio).toBe(0);
    expect(r.nuevos[1].detalle[0].sobrante).toBe(400);
    expect(r.totalAhorrado).toBe(300); // -100 + 400
  });

  it("sobrantes y rescates de varios sobres se netean en total_a_ahorro", () => {
    const s2 = sobre({ id: "s2", nombre: "Otro" });
    const r = run({
      sobres: [sobre(), s2],
      gastos: [gasto("2026-06-22", 300), gasto("2026-06-22", 800, "s2")],
    });
    // s1 sobra 200, s2 rescatado con 300 → neto -100
    expect(r.nuevos[0].total_a_ahorro).toBe(-100);
  });
});

describe("sobre tipo acumula", () => {
  it("arrastra saldo positivo sin mandar nada al ahorro", () => {
    const s = sobre({ tipo_cierre: "acumula" });
    const r = run({ sobres: [s], gastos: [gasto("2026-06-22", 300)] });
    expect(r.nuevos[0].detalle[0].sobrante).toBe(0);
    expect(r.totalAhorrado).toBe(0);
    expect(r.saldosActualizados).toEqual([{ sobre_id: "s1", saldo_acumulado: 200 }]);
  });

  it("un acumula en negativo tambien es rescatado y reinicia a 0", () => {
    const s = sobre({ tipo_cierre: "acumula" });
    const r = run({
      sobres: [s],
      gastos: [gasto("2026-06-15", 800), gasto("2026-06-22", 100)],
    });
    // semana 1: 0+500-800 = -300 → rescate 300, reinicia; semana 2: 0+500-100 = 400
    expect(r.nuevos[0].detalle[0].rescate).toBe(300);
    expect(r.nuevos[1].detalle[0].saldo_inicio).toBe(0);
    expect(r.saldosActualizados).toEqual([{ sobre_id: "s1", saldo_acumulado: 400 }]);
    expect(r.totalAhorrado).toBe(-300); // el rescate salio del Ahorro; el saldo positivo se queda en el sobre
  });

  it("el saldo acumulado amortigua el deficit antes de pedir rescate", () => {
    const s = sobre({ tipo_cierre: "acumula", saldo_acumulado: 200 });
    const r = run({ sobres: [s], gastos: [gasto("2026-06-22", 600)] });
    // 200 + 500 - 600 = 100 → no hay rescate, conserva 100
    expect(r.nuevos[0].detalle[0].rescate).toBe(0);
    expect(r.saldosActualizados).toEqual([{ sobre_id: "s1", saldo_acumulado: 100 }]);
  });
});

describe("sobre Ahorro", () => {
  const ahorro = sobre({ id: "ah", nombre: "Ahorro", es_ahorro: true, tipo_cierre: "acumula", aportacion_semanal: 200, saldo_acumulado: 1000 });

  it("recibe su aportacion por semana cerrada + sobrantes de otros sobres", () => {
    const r = run({ sobres: [sobre(), ahorro], gastos: [gasto("2026-06-22", 300)] });
    // sobrante 200 + aportacion propia 200 = +400 → 1400
    expect(r.ahorroActualizado).toEqual({ sobre_id: "ah", saldo_acumulado: 1400 });
  });

  it("descuenta gastos hechos desde el Ahorro en semanas cerradas", () => {
    const r = run({
      sobres: [sobre(), ahorro],
      gastos: [gasto("2026-06-22", 300), gasto("2026-06-23", 500, "ah")],
    });
    // 1000 + 200 (sobrante) + 200 (aportacion) - 500 (gasto ahorro) = 900
    expect(r.ahorroActualizado).toEqual({ sobre_id: "ah", saldo_acumulado: 900 });
  });

  it("el sobregiro de otro sobre SI descuenta del Ahorro (rescate)", () => {
    const r = run({ sobres: [sobre(), ahorro], gastos: [gasto("2026-06-22", 900)] });
    // rescate 400; aportacion propia 200: 1000 + 200 - 400 = 800
    expect(r.ahorroActualizado).toEqual({ sobre_id: "ah", saldo_acumulado: 800 });
  });

  it("puede quedar negativo: 'me debo a mi mismo'", () => {
    const pobre = { ...ahorro, saldo_acumulado: 0, aportacion_semanal: 0 };
    const r = run({
      sobres: [sobre(), pobre],
      gastos: [gasto("2026-06-22", 500), gasto("2026-06-23", 800, "ah")],
    });
    // sobre s1 cierra exacto (sobrante 0); gasto de 800 desde el Ahorro → -800
    expect(r.ahorroActualizado.saldo_acumulado).toBe(-800);
  });

  it("no se actualiza si no hubo cierres", () => {
    const r = run({ sobres: [sobre(), ahorro], gastos: [gasto("2026-06-29", 100)] });
    expect(r.ahorroActualizado).toBeNull();
  });
});

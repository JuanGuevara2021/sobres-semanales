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

  it("sobregiro deja saldo negativo que se arrastra, sobrante 0", () => {
    const r = run({ sobres: [sobre()], gastos: [gasto("2026-06-22", 600)] });
    const d = r.nuevos[0].detalle[0];
    expect(d.sobrante).toBe(0);
    expect(r.totalAhorrado).toBe(0);
    expect(r.saldosActualizados).toEqual([{ sobre_id: "s1", saldo_acumulado: -100 }]);
  });

  it("el deficit arrastrado reduce el sobrante de la semana siguiente", () => {
    // semana 1: gasta 600 (deficit -100); semana 2: gasta 100 → neto -100+500-100 = 300
    const r = run({
      sobres: [sobre()],
      gastos: [gasto("2026-06-15", 600), gasto("2026-06-22", 100)],
    });
    expect(r.nuevos[0].detalle[0].sobrante).toBe(0);
    expect(r.nuevos[1].detalle[0].saldo_inicio).toBe(-100);
    expect(r.nuevos[1].detalle[0].sobrante).toBe(300);
    expect(r.totalAhorrado).toBe(300);
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

  it("arrastra saldo negativo entre semanas", () => {
    const s = sobre({ tipo_cierre: "acumula" });
    const r = run({
      sobres: [s],
      gastos: [gasto("2026-06-15", 800), gasto("2026-06-22", 100)],
    });
    // semana 1: 0+500-800 = -300; semana 2: -300+500-100 = 100
    expect(r.nuevos[1].detalle[0].saldo_inicio).toBe(-300);
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

  it("el sobregiro de otro sobre NO descuenta del Ahorro", () => {
    const r = run({ sobres: [sobre(), ahorro], gastos: [gasto("2026-06-22", 900)] });
    // sobrante 0; solo entra la aportacion propia: 1000 + 200 = 1200
    expect(r.ahorroActualizado).toEqual({ sobre_id: "ah", saldo_acumulado: 1200 });
  });

  it("nunca baja de 0", () => {
    const pobre = { ...ahorro, saldo_acumulado: 0, aportacion_semanal: 0 };
    const r = run({
      sobres: [sobre(), pobre],
      gastos: [gasto("2026-06-22", 500), gasto("2026-06-23", 800, "ah")],
    });
    expect(r.ahorroActualizado.saldo_acumulado).toBe(0);
  });

  it("no se actualiza si no hubo cierres", () => {
    const r = run({ sobres: [sobre(), ahorro], gastos: [gasto("2026-06-29", 100)] });
    expect(r.ahorroActualizado).toBeNull();
  });
});

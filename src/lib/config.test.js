import { describe, it, expect } from "vitest";
import { createWeekHelpers, toStr, fromStr, addDays } from "./config";

/* Fechas de referencia (verificadas contra calendario):
   - 2026-06-27 es sabado, 2026-06-29 lunes, 2026-06-30 martes
   - 2026-01-01 es jueves; el sabado anterior es 2025-12-27 */

describe("toStr / fromStr", () => {
  it("son inversas y sin lios de zona horaria", () => {
    expect(toStr(fromStr("2026-06-30"))).toBe("2026-06-30");
    expect(toStr(fromStr("2026-01-01"))).toBe("2026-01-01");
  });

  it("addDays cruza fin de mes y de año", () => {
    expect(toStr(addDays(fromStr("2026-06-30"), 1))).toBe("2026-07-01");
    expect(toStr(addDays(fromStr("2025-12-31"), 1))).toBe("2026-01-01");
  });
});

describe("semana que inicia sabado (diaInicio 6, default)", () => {
  const { weekOf } = createWeekHelpers(6);

  it("un martes pertenece a la semana del sabado anterior", () => {
    expect(weekOf("2026-06-30")).toBe("2026-06-27");
  });

  it("el sabado mismo es inicio de su propia semana", () => {
    expect(weekOf("2026-06-27")).toBe("2026-06-27");
  });

  it("el viernes cierra la semana (dia 7)", () => {
    expect(weekOf("2026-07-03")).toBe("2026-06-27");
    expect(weekOf("2026-07-04")).toBe("2026-07-04"); // sabado siguiente, semana nueva
  });

  it("cruza el año hacia atras", () => {
    expect(weekOf("2026-01-01")).toBe("2025-12-27");
  });
});

describe("semana que inicia lunes (diaInicio 1)", () => {
  const { weekOf } = createWeekHelpers(1);

  it("un martes pertenece a la semana del lunes anterior", () => {
    expect(weekOf("2026-06-30")).toBe("2026-06-29");
  });

  it("el domingo cierra la semana", () => {
    expect(weekOf("2026-07-05")).toBe("2026-06-29");
    expect(weekOf("2026-07-06")).toBe("2026-07-06"); // lunes siguiente
  });
});

describe("semana que inicia domingo (diaInicio 0)", () => {
  const { weekOf } = createWeekHelpers(0);

  it("un martes pertenece a la semana del domingo anterior", () => {
    expect(weekOf("2026-06-30")).toBe("2026-06-28");
  });

  it("el sabado cierra la semana", () => {
    expect(weekOf("2026-07-04")).toBe("2026-06-28");
    expect(weekOf("2026-07-05")).toBe("2026-07-05"); // domingo siguiente
  });
});

describe("weekDayOrder", () => {
  it("ordena los 7 dias empezando por el dia de inicio", () => {
    expect(createWeekHelpers(6).weekDayOrder).toEqual([6, 0, 1, 2, 3, 4, 5]);
    expect(createWeekHelpers(1).weekDayOrder).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(createWeekHelpers(0).weekDayOrder).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

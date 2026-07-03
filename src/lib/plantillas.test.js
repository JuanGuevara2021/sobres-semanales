import { describe, it, expect } from "vitest";
import { escalarMonto, escalarSobres, repartirTotal, sumaSobres, redondearAPaso } from "./plantillas";

/* ============ escalarMonto ============ */
describe("escalarMonto", () => {
  it("MXN queda igual (redondeado a 10)", () => {
    expect(escalarMonto(500, "MXN")).toBe(500);
    expect(escalarMonto(304, "MXN")).toBe(300);
  });

  it("ARS escala ×75 y redondea a 500 (caso Franco: 300 MXN ya no son 300 ARS)", () => {
    expect(escalarMonto(300, "ARS")).toBe(22500);
    expect(escalarMonto(100, "ARS")).toBe(7500);
  });

  it("COP escala ×220 y redondea a 1000", () => {
    expect(escalarMonto(500, "COP")).toBe(110000);
  });

  it("USD escala ×0.05 y redondea a 1", () => {
    expect(escalarMonto(500, "USD")).toBe(25);
    expect(escalarMonto(100, "USD")).toBe(5);
  });

  it("nunca baja del paso minimo", () => {
    expect(escalarMonto(1, "ARS")).toBe(500);
    expect(escalarMonto(1, "USD")).toBe(1);
  });

  it("moneda desconocida usa MXN", () => {
    expect(escalarMonto(500, "XXX")).toBe(500);
  });
});

/* ============ escalarSobres / repartirTotal ============ */
const SOBRES = [
  { nombre: "Necesidades", aportacion_semanal: 500 },
  { nombre: "Gustos", aportacion_semanal: 300 },
  { nombre: "Emergencias", aportacion_semanal: 200 },
  { nombre: "Ahorro", aportacion_semanal: 100 },
];

describe("escalarSobres", () => {
  it("escala cada sobre y conserva el resto de campos", () => {
    const out = escalarSobres(SOBRES, "ARS");
    expect(out[0]).toEqual({ nombre: "Necesidades", aportacion_semanal: 37500 });
    expect(out.map((s) => s.aportacion_semanal)).toEqual([37500, 22500, 15000, 7500]);
  });

  it("no muta el arreglo original", () => {
    escalarSobres(SOBRES, "ARS");
    expect(SOBRES[0].aportacion_semanal).toBe(500);
  });
});

describe("repartirTotal", () => {
  it("reparte proporcionalmente conservando las proporciones de la plantilla", () => {
    // plantilla basico: 500/300/200/100 → total 2200 en MXN. Doblar el total dobla cada sobre.
    const out = repartirTotal(2200, SOBRES, "MXN");
    expect(out.map((s) => s.aportacion_semanal)).toEqual([1000, 600, 400, 200]);
  });

  it("la suma queda cerca del total tecleado (dentro del redondeo)", () => {
    const out = repartirTotal(3000, SOBRES, "MXN");
    expect(Math.abs(sumaSobres(out) - 3000)).toBeLessThanOrEqual(out.length * 10);
  });

  it("con todos los sobres en cero reparte en partes iguales", () => {
    const ceros = SOBRES.map((s) => ({ ...s, aportacion_semanal: 0 }));
    const out = repartirTotal(400, ceros, "MXN");
    expect(out.map((s) => s.aportacion_semanal)).toEqual([100, 100, 100, 100]);
  });

  it("respeta el paso de la moneda", () => {
    const out = repartirTotal(100000, escalarSobres(SOBRES, "ARS"), "ARS");
    out.forEach((s) => expect(s.aportacion_semanal % 500).toBe(0));
  });
});

describe("redondearAPaso", () => {
  it("redondea al multiplo mas cercano", () => {
    expect(redondearAPaso(1249, 500)).toBe(1000);
    expect(redondearAPaso(1250, 500)).toBe(1500);
  });
});

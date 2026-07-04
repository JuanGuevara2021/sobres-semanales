import { describe, it, expect } from "vitest";
import { traducirErrorAuth } from "./authErrors";

describe("traducirErrorAuth", () => {
  it("credenciales invalidas", () => {
    expect(traducirErrorAuth("Invalid login credentials")).toBe("Correo o contraseña incorrectos.");
  });

  it("correo sin confirmar", () => {
    expect(traducirErrorAuth("Email not confirmed")).toMatch(/no está confirmado/);
  });

  it("el error de los 19 segundos (el que reporto el tester)", () => {
    expect(traducirErrorAuth("For security purposes, you can only request this after 19 seconds."))
      .toBe("Por seguridad, espera 19 segundos y vuelve a intentar.");
  });

  it("interpola cualquier cantidad de segundos", () => {
    expect(traducirErrorAuth("For security purposes, you can only request this after 7 seconds."))
      .toMatch(/espera 7 segundos/);
  });

  it("contraseña corta con minimo interpolado", () => {
    expect(traducirErrorAuth("Password should be at least 6 characters.")).toBe("La contraseña debe tener al menos 6 caracteres.");
  });

  it("usuario ya registrado", () => {
    expect(traducirErrorAuth("User already registered")).toMatch(/Ya existe una cuenta/);
  });

  it("sin conexion", () => {
    expect(traducirErrorAuth("Failed to fetch")).toMatch(/Sin conexión/);
  });

  it("error desconocido NUNCA muestra ingles crudo", () => {
    expect(traducirErrorAuth("Some weird internal error XYZ")).toBe("Ocurrió un error. Intenta de nuevo en un momento.");
  });

  it("mensaje vacio o nulo da el generico", () => {
    expect(traducirErrorAuth("")).toMatch(/Ocurrió un error/);
    expect(traducirErrorAuth(null)).toMatch(/Ocurrió un error/);
  });
});

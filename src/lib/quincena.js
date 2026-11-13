import { toStr, fromStr, addDays } from "./config";
import { calcEstimadoTarjeta } from "./pagos";

/* ============================================================
   Logica pura de la QUINCENA (sin Supabase; `hoy` inyectable)

   Pregunta que responde: de mi sueldo de esta quincena, cuanto ya
   salio, cuanto ya esta comprometido y cuanto me va a quedar.

   Modelo de flujo de efectivo (decision 2026-11-13, ver DECISIONES.md):
   - El sueldo solo baja cuando el dinero SALE de verdad: gastos en
     efectivo, debito o transferencia, y los pagos de la tarjeta.
   - Una compra a credito NO baja el sueldo de esta quincena: saldra
     cuando se pague la tarjeta. Se informa aparte para no contarla dos
     veces (una al comprar y otra al pagar la tarjeta).
   - "Por pagar" = pagos fijos y pagos de tarjeta cuya fecha cae dentro
     de la quincena y que aun no tienen su gasto registrado.
   ============================================================ */

const soloDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const diasEnMes = (anio, mes) => new Date(anio, mes + 1, 0).getDate();
const diffDias = (a, b) => Math.round((soloDia(b) - soloDia(a)) / 86400000);
const num = (x) => Number(x) || 0;

/* Fecha del `dia` dentro del mes; si el mes no tiene ese dia (30 en febrero,
   31 en abril) usa el ultimo dia del mes. `mes` puede desbordarse (-1, 12). */
export function fechaDia(anio, mes, dia) {
  const base = new Date(anio, mes, 1);
  const y = base.getFullYear();
  const m = base.getMonth();
  return new Date(y, m, Math.min(Math.max(1, dia), diasEnMes(y, m)));
}

/* Quincena en curso: del ultimo dia de cobro (<= hoy) al dia anterior al
   siguiente cobro. dia 31 = "fin de mes". */
export function periodoQuincena(hoy = new Date(), dia1 = 15, dia2 = 30) {
  const h = soloDia(hoy);
  let dias = [...new Set([dia1, dia2].map(Number).filter((d) => d >= 1 && d <= 31))];
  if (!dias.length) dias = [15, 30];
  const candidatas = [];
  for (let dm = -1; dm <= 1; dm++) {
    for (const d of dias) candidatas.push(toStr(fechaDia(h.getFullYear(), h.getMonth() + dm, d)));
  }
  const fechas = [...new Set(candidatas)].sort().map(fromStr);
  const inicio = [...fechas].reverse().find((f) => f <= h);
  const siguiente = fechas.find((f) => f > h);
  return {
    inicio: toStr(inicio),
    fin: toStr(addDays(siguiente, -1)),
    siguienteCobro: toStr(siguiente),
    diasTotales: diffDias(inicio, siguiente),
    diaActual: diffDias(inicio, h) + 1,
    diasRestantes: diffDias(h, siguiente), // contando hoy
  };
}

/* Fechas en que cae un dia del mes dentro de [inicio, fin] */
function ocurrenciasDia(dia, inicio, fin) {
  const out = [];
  for (let i = 0; i < 3; i++) {
    const f = fechaDia(inicio.getFullYear(), inicio.getMonth() + i, dia);
    if (f >= inicio && f <= fin) out.push(f);
  }
  return out;
}

const mismoMes = (fechaStr, f) => {
  const g = fromStr(fechaStr);
  return g.getMonth() === f.getMonth() && g.getFullYear() === f.getFullYear();
};

/* Ciclo de la tarjeta que se liquida en `fechaPago`: el que cerro en el
   ultimo corte en o antes de esa fecha. */
export function cicloQueSePaga(diaCorte, fechaPago) {
  let fin = fechaDia(fechaPago.getFullYear(), fechaPago.getMonth(), diaCorte);
  if (fin > fechaPago) fin = fechaDia(fechaPago.getFullYear(), fechaPago.getMonth() - 1, diaCorte);
  const corteAnterior = fechaDia(fin.getFullYear(), fin.getMonth() - 1, diaCorte);
  return { inicio: toStr(addDays(corteAnterior, 1)), fin: toStr(fin) };
}

function estadoDe(pagado, fecha, hoy) {
  if (pagado) return "pagado";
  return fecha < hoy ? "vencido" : "pendiente";
}

/* Pagos fijos y pagos de tarjeta que caen dentro de la quincena */
export function compromisosQuincena({ pagos = [], tarjetas = [], msi = [], gastos = [], inicio, fin, hoy, weekOf, diaInicioSemana = 6 }) {
  const ini = fromStr(inicio);
  const fn = fromStr(fin);
  const h = soloDia(hoy);
  const lista = [];

  const tarjetasConPago = tarjetas.filter((t) => t.activo && t.dia_pago);
  const idsTarjetasConPago = new Set(tarjetasConPago.map((t) => t.id));

  for (const p of pagos) {
    if (!p.activo) continue;
    // el pago de una tarjeta registrada se calcula abajo, desde la tarjeta
    if (p.categoria === "tarjetas" && p.tarjeta_id && idsTarjetasConPago.has(p.tarjeta_id)) continue;

    const base = {
      tipo: "fijo", id: p.id, nombre: p.nombre, categoria: p.categoria,
      aCredito: p.medio_pago === "credito", viaSobre: !!p.destino_sobre_id,
    };
    const agregar = (fecha, gasto) => lista.push({
      ...base, fecha: toStr(fecha),
      monto: gasto ? num(gasto.monto) : num(p.monto_estimado),
      estado: estadoDe(!!gasto, fecha, h),
    });
    const delPago = gastos.filter((g) => g.nota === p.nombre);

    if (p.frecuencia === "semanal") {
      const diaSem = p.dia_pago != null ? p.dia_pago : diaInicioSemana;
      for (let f = ini; f <= fn; f = addDays(f, 1)) {
        if (f.getDay() !== diaSem) continue;
        const semana = weekOf(toStr(f));
        agregar(f, delPago.find((g) => weekOf(g.fecha) === semana));
      }
    } else if (p.frecuencia === "quincenal") {
      const d1 = p.dia_pago || 1;
      const d2 = p.dia_pago_2 || 15;
      const medio = Math.round((d1 + d2) / 2);
      for (const f of ocurrenciasDia(d1, ini, fn)) agregar(f, delPago.find((g) => mismoMes(g.fecha, f) && fromStr(g.fecha).getDate() <= medio));
      for (const f of ocurrenciasDia(d2, ini, fn)) agregar(f, delPago.find((g) => mismoMes(g.fecha, f) && fromStr(g.fecha).getDate() > medio));
    } else {
      for (const f of ocurrenciasDia(p.dia_pago || 1, ini, fn)) agregar(f, delPago.find((g) => mismoMes(g.fecha, f)));
    }
  }

  for (const t of tarjetasConPago) {
    const notaPago = `Pago ${t.nombre}`;
    for (const f of ocurrenciasDia(t.dia_pago, ini, fn)) {
      const gasto = gastos.find((g) => g.nota === notaPago && mismoMes(g.fecha, f));
      let monto = 0;
      let detalle = null;
      if (gasto) {
        monto = num(gasto.monto);
      } else {
        const msiMes = calcEstimadoTarjeta(t, gastos, msi, pagos, false, f).total;
        let compras = 0;
        if (t.dia_corte) {
          const ciclo = cicloQueSePaga(t.dia_corte, f);
          compras = gastos
            .filter((g) => g.medio_pago === "credito" && g.tarjeta_id === t.id && g.fecha >= ciclo.inicio && g.fecha <= ciclo.fin)
            .reduce((a, g) => a + num(g.monto), 0);
        }
        monto = msiMes + compras;
        detalle = { msi: msiMes, compras };
        if (monto === 0) {
          const rec = pagos.find((p) => p.activo && p.categoria === "tarjetas" && p.tarjeta_id === t.id);
          if (rec) monto = num(rec.monto_estimado);
        }
      }
      lista.push({
        tipo: "tarjeta", id: t.id, nombre: notaPago, categoria: "tarjetas",
        aCredito: false, viaSobre: false, fecha: toStr(f), monto, detalle,
        estado: estadoDe(!!gasto, f, h),
      });
    }
  }

  return lista.sort((a, b) => (a.fecha === b.fecha ? a.nombre.localeCompare(b.nombre) : a.fecha < b.fecha ? -1 : 1));
}

/* Lo que falta gastar del plan de sobres de hoy al fin de la quincena:
   lo que queda de la semana en curso + el plan diario de los dias siguientes. */
function reservaDeSobres({ sobres, gastos, periodo, hoy, weekOf }) {
  const gastables = sobres.filter((s) => !s.es_ahorro);
  const semanal = gastables.reduce((a, s) => a + num(s.aportacion_semanal), 0);
  if (semanal <= 0 || !weekOf) return 0;
  const h = soloDia(hoy);
  const semanaHoy = weekOf(toStr(h));
  const diasSemanaRestan = 7 - diffDias(fromStr(semanaHoy), h); // contando hoy
  const dentro = Math.min(diasSemanaRestan, periodo.diasRestantes);
  const despues = periodo.diasRestantes - dentro;
  const ids = new Set(gastables.map((s) => s.id));
  const gastadoSemana = gastos
    .filter((g) => ids.has(g.sobre_id) && weekOf(g.fecha) === semanaHoy)
    .reduce((a, g) => a + num(g.monto), 0);
  const restanteSemana = Math.max(0, semanal - gastadoSemana) * (dentro / diasSemanaRestan);
  return restanteSemana + (semanal / 7) * despues;
}

export function calcularQuincena({ sueldo, dia1 = 15, dia2 = 30, gastos = [], pagos = [], tarjetas = [], msi = [], sobres = [], weekOf, diaInicioSemana = 6, hoy = new Date() }) {
  const total = num(sueldo);
  const periodo = periodoQuincena(hoy, dia1, dia2);
  const delPeriodo = gastos.filter((g) => g.fecha >= periodo.inicio && g.fecha <= periodo.fin);

  // --- lo que ya salio (y lo cargado a credito, que no sale de este sueldo) ---
  const nombresPagos = new Set(pagos.map((p) => p.nombre));
  const salidas = { fijos: 0, tarjetas: 0, diario: 0, total: 0 };
  const porCategoria = {};
  let aCredito = 0;
  for (const g of delPeriodo) {
    const m = num(g.monto);
    if (g.medio_pago === "credito") { aCredito += m; continue; }
    if (g.categoria === "tarjetas") salidas.tarjetas += m;
    else if (g.nota && nombresPagos.has(g.nota)) salidas.fijos += m;
    else { salidas.diario += m; porCategoria[g.categoria] = (porCategoria[g.categoria] || 0) + m; }
    salidas.total += m;
  }
  const diarioPorCategoria = Object.entries(porCategoria)
    .map(([categoria, monto]) => ({ categoria, monto }))
    .sort((a, b) => b.monto - a.monto);

  // --- lo comprometido ---
  const compromisos = compromisosQuincena({ pagos, tarjetas, msi, gastos, inicio: periodo.inicio, fin: periodo.fin, hoy, weekOf, diaInicioSemana });
  const pendientes = compromisos.filter((c) => c.estado !== "pagado");
  const suma = (arr) => arr.reduce((a, c) => a + c.monto, 0);
  const porPagar = {
    fijos: suma(pendientes.filter((c) => c.tipo === "fijo" && !c.aCredito)),
    tarjetas: suma(pendientes.filter((c) => c.tipo === "tarjeta")),
    aCredito: suma(pendientes.filter((c) => c.aCredito)), // se cargara a la tarjeta, no a este sueldo
  };
  porPagar.total = porPagar.fijos + porPagar.tarjetas;

  // --- lo que queda ---
  const disponibleHoy = total - salidas.total;
  const teQueda = disponibleHoy - porPagar.total;
  // los fijos pendientes que salen de un sobre ya estan contados en "por pagar"
  const fijosViaSobre = suma(pendientes.filter((c) => c.tipo === "fijo" && !c.aCredito && c.viaSobre));
  const reservaSobres = Math.max(0, reservaDeSobres({ sobres, gastos, periodo, hoy, weekOf }) - fijosViaSobre);
  const libre = teQueda - reservaSobres;

  const pct = (m) => (total > 0 ? m / total : 0);
  const partes = [
    { clave: "fijos_pagados", etiqueta: "Pagos fijos ya pagados", monto: salidas.fijos, grupo: "salio" },
    { clave: "tarjetas_pagadas", etiqueta: "Tarjetas ya pagadas", monto: salidas.tarjetas, grupo: "salio" },
    { clave: "diario", etiqueta: "Gastos del día a día", monto: salidas.diario, grupo: "salio" },
    { clave: "fijos_por_pagar", etiqueta: "Pagos fijos por pagar", monto: porPagar.fijos, grupo: "comprometido" },
    { clave: "tarjetas_por_pagar", etiqueta: "Tarjetas por pagar", monto: porPagar.tarjetas, grupo: "comprometido" },
    { clave: "sobres", etiqueta: "Reservado para tus sobres", monto: reservaSobres, grupo: "plan" },
    { clave: "libre", etiqueta: "Libre", monto: Math.max(0, libre), grupo: "libre" },
  ].filter((p) => p.monto > 0.005).map((p) => ({ ...p, pct: pct(p.monto) }));

  return {
    periodo, sueldo: total, salidas, aCredito, diarioPorCategoria,
    compromisos: compromisos.map((c) => ({ ...c, pct: pct(c.monto) })),
    porPagar, disponibleHoy, teQueda, reservaSobres, libre, partes,
  };
}

import { toStr, fromStr } from "./config";

/* ============================================================
   Logica pura de pagos recurrentes, tarjetas y MSI
   (sin Supabase; `hoy` inyectable para poder testear)
   ============================================================ */

/* ---------- pagos recurrentes ---------- */
export function getPagosProximos(pagos, gastos, weekStartOf, weekOf, hoy = new Date()) {
  const diaHoy = hoy.getDate();
  const diaSemHoy = hoy.getDay();
  const mesHoy = hoy.getMonth();
  const anioHoy = hoy.getFullYear();
  const wsHoy = toStr(weekStartOf(hoy));
  const cercaDeDia = (dia) => { const d = dia - diaHoy; return d >= -2 && d <= 3; };
  return pagos.flatMap((p) => {
    if (!p.activo) return [];
    if (p.categoria === "tarjetas") return [];
    if (p.pospuesto_hasta && p.pospuesto_hasta >= toStr(hoy)) return [];
    if (p.frecuencia === "semanal") {
      if (p.dia_pago != null && diaSemHoy !== p.dia_pago) return [];
      if (gastos.some((g) => g.nota === p.nombre && weekOf(g.fecha) === wsHoy)) return [];
      return [{ ...p, _diaProximo: p.dia_pago }];
    }
    if (p.frecuencia === "quincenal") {
      const dia1 = p.dia_pago || 1;
      const dia2 = p.dia_pago_2 || 15;
      if (!cercaDeDia(dia1) && !cercaDeDia(dia2)) return [];
      const pagosEsteMes = gastos.filter((g) => g.nota === p.nombre && fromStr(g.fecha).getMonth() === mesHoy && fromStr(g.fecha).getFullYear() === anioHoy);
      const medio = Math.round((dia1 + dia2) / 2);
      if (cercaDeDia(dia1) && !pagosEsteMes.some((g) => fromStr(g.fecha).getDate() <= medio)) return [{ ...p, _diaProximo: dia1 }];
      if (cercaDeDia(dia2) && !pagosEsteMes.some((g) => fromStr(g.fecha).getDate() > medio)) return [{ ...p, _diaProximo: dia2 }];
      return [];
    }
    const dia = p.dia_pago || 1;
    if (!cercaDeDia(dia)) return [];
    if (gastos.some((g) => g.nota === p.nombre && fromStr(g.fecha).getMonth() === mesHoy && fromStr(g.fecha).getFullYear() === anioHoy)) return [];
    return [{ ...p, _diaProximo: dia }];
  });
}

/* ---------- tarjetas ---------- */
export function getCicloActual(diaCorte, hoy = new Date()) {
  const y = hoy.getFullYear(), m = hoy.getMonth();
  if (hoy.getDate() <= diaCorte) {
    return { inicio: toStr(new Date(y, m - 1, diaCorte + 1)), fin: toStr(new Date(y, m, diaCorte)) };
  }
  return { inicio: toStr(new Date(y, m, diaCorte + 1)), fin: toStr(new Date(y, m + 1, diaCorte)) };
}

export function calcEstimadoTarjeta(tarjeta, gastos, msiList, pagosRec, pagoEsteMes = false, hoy = new Date()) {
  const msiMensual = msiList
    .filter((m) => m.tarjeta_id === tarjeta.id && m.activo)
    .reduce((a, m) => {
      const st = calcMSI(m, pagoEsteMes, hoy);
      return st.estatus === "activo" ? a + st.mensual : a;
    }, 0);
  const numMSI = msiList.filter((m) => m.tarjeta_id === tarjeta.id && m.activo && calcMSI(m, pagoEsteMes, hoy).estatus === "activo").length;
  return { msi: msiMensual, numMSI, total: msiMensual };
}

export function getTarjetaRecordatorios(tarjetas, pagosRec, gastos, hoy = new Date()) {
  const diaHoy = hoy.getDate();
  const mesHoy = hoy.getMonth();
  const anioHoy = hoy.getFullYear();
  return tarjetas.filter((t) => {
    if (!t.activo || !t.dia_pago) return false;
    const diff = t.dia_pago - diaHoy;
    if (diff < -2 || diff > 3) return false;
    const notaPago = `Pago ${t.nombre}`;
    return !gastos.some((g) => g.nota === notaPago && fromStr(g.fecha).getMonth() === mesHoy && fromStr(g.fecha).getFullYear() === anioHoy);
  });
}

/* ---------- MSI ---------- */
export function calcMSI(msi, pagoEsteMes = false, hoy = new Date()) {
  const pp = fromStr(msi.mes_primer_pago);
  const total = Number(msi.monto_total);
  const meses = msi.num_meses;
  const mensual = total / meses;
  const mesesTranscurridos = (hoy.getFullYear() - pp.getFullYear()) * 12 + (hoy.getMonth() - pp.getMonth());
  if (mesesTranscurridos < 0) return { estatus: "pendiente", pagados: 0, meses, mensual, restante: total };
  const pagados = mesesTranscurridos + (pagoEsteMes ? 1 : 0);
  if (pagados >= meses) return { estatus: "liquidado", pagados: meses, meses, mensual, restante: 0 };
  return { estatus: "activo", pagados, meses, mensual, restante: mensual * (meses - pagados) };
}

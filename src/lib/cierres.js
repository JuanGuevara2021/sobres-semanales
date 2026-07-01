import { toStr } from "./config";

/* ============================================================
   Logica pura del cierre semanal v2.2 (sin Supabase, testeable)

   Reglas (ver CLAUDE.md):
   - Solo se cierran semanas pasadas con >=1 gasto; cada cierre es snapshot.
   - Sobre tipo `ahorro`: sobrante positivo pasa al Ahorro y el sobre reinicia a 0;
     sobregiro deja saldo negativo que se arrastra (NO descuenta del Ahorro).
   - Sobre tipo `acumula`: el saldo se arrastra entre semanas (positivo o negativo).
   - El sobre Ahorro recibe su aportacion por semana cerrada + sobrantes,
     menos sus propios gastos; nunca baja de 0.
   ============================================================ */

export function calcularCierres({ sobres, gastos, cierresExistentes, weekStartOf, weekOf, hoy = new Date() }) {
  const todayWS = toStr(weekStartOf(hoy));
  const semanasConGastos = [...new Set(gastos.map((g) => weekOf(g.fecha)))]
    .filter((ws) => ws < todayWS)
    .sort();
  const yaCerradas = new Set(cierresExistentes.map((c) => c.semana));

  // Saldo corriente por sobre (arranca del valor en BD)
  const saldoR = {};
  for (const s of sobres) saldoR[s.id] = Number(s.saldo_acumulado) || 0;

  const nuevos = [];
  for (const ws of semanasConGastos) {
    if (yaCerradas.has(ws)) continue;
    const detalle = sobres
      .filter((s) => !s.es_ahorro)
      .map((s) => {
        const gastado = gastos.filter((g) => g.sobre_id === s.id && weekOf(g.fecha) === ws).reduce((a, g) => a + Number(g.monto), 0);
        const saldoInicio = saldoR[s.id];
        let sobrante = 0;
        if (s.tipo_cierre === "ahorro") {
          const neto = saldoR[s.id] + Number(s.aportacion_semanal) - gastado;
          if (neto >= 0) { sobrante = neto; saldoR[s.id] = 0; }
          else { sobrante = 0; saldoR[s.id] = neto; }
        } else {
          saldoR[s.id] += Number(s.aportacion_semanal) - gastado;
        }
        return { sobre_id: s.id, nombre: s.nombre, emoji: s.emoji, aportacion: Number(s.aportacion_semanal), gastado, sobrante, tipo_cierre: s.tipo_cierre, saldo_inicio: saldoInicio };
      });
    const totalAAhorro = detalle.reduce((a, x) => a + x.sobrante, 0);
    nuevos.push({ semana: ws, detalle, total_a_ahorro: totalAAhorro });
  }

  const totalAhorrado = nuevos.reduce((a, c) => a + c.total_a_ahorro, 0);

  // Saldos finales de sobres regulares (solo los que cambiaron)
  const saldosActualizados = sobres
    .filter((s) => !s.es_ahorro && saldoR[s.id] !== Number(s.saldo_acumulado))
    .map((s) => ({ sobre_id: s.id, saldo_acumulado: saldoR[s.id] }));

  // Ahorro: aportacion propia + sobrantes recibidos - gastos desde ahorro
  let ahorroActualizado = null;
  const sobreAhorro = sobres.find((s) => s.es_ahorro);
  if (sobreAhorro && nuevos.length) {
    const ahorroAport = Number(sobreAhorro.aportacion_semanal) * nuevos.length;
    const semanasCerradas = nuevos.map((c) => c.semana);
    const gastadoDeAhorro = gastos
      .filter((g) => g.sobre_id === sobreAhorro.id && semanasCerradas.includes(weekOf(g.fecha)))
      .reduce((a, g) => a + Number(g.monto), 0);
    const netChange = ahorroAport + totalAhorrado - gastadoDeAhorro;
    if (netChange !== 0) {
      ahorroActualizado = { sobre_id: sobreAhorro.id, saldo_acumulado: Math.max(0, Number(sobreAhorro.saldo_acumulado) + netChange) };
    }
  }

  return { nuevos, saldosActualizados, ahorroActualizado, totalAhorrado };
}

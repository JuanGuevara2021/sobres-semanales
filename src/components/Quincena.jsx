import { useState } from "react";
import { useCuenta } from "../contexts/CuentaContext";
import { fromStr, MESES } from "../lib/config";

/* ============================================================
   Quincena: cuanto queda del sueldo, ya descontados los gastos
   que salieron y los pagos fijos / tarjetas que faltan.
   Los numeros vienen de calcularQuincena (lib/quincena.js);
   aqui solo se pintan.
   ============================================================ */

const COLOR = {
  fijos_pagados: "var(--ink)",
  tarjetas_pagadas: "color-mix(in srgb, var(--ink) 60%, var(--red))",
  diario: "var(--ink-soft)",
  fijos_por_pagar: "var(--amber)",
  tarjetas_por_pagar: "var(--red)",
  sobres: "color-mix(in srgb, var(--green) 40%, var(--card))",
  libre: "var(--green)",
};

const PRESETS_COBRO = [
  { label: "15 y 30", dias: [15, 30] },
  { label: "15 y fin de mes", dias: [15, 31] },
  { label: "1 y 16", dias: [1, 16] },
];

const pctTxt = (p) => (p > 0 && p < 0.01 ? "<1%" : `${Math.round(p * 100)}%`);

function rango(inicio, fin) {
  const a = fromStr(inicio);
  const b = fromStr(fin);
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()} – ${b.getDate()} ${MESES[b.getMonth()]}`
    : `${a.getDate()} ${MESES[a.getMonth()]} – ${b.getDate()} ${MESES[b.getMonth()]}`;
}

const cobroTxt = (dias) => (dias === 0 ? "Cobras hoy" : dias === 1 ? "Cobras mañana" : `Cobras en ${dias} días`);

/* Barra apilada: cada pedazo del sueldo con su color. Si lo comprometido
   rebasa el sueldo, la barra se escala para que quepa todo. */
function Barra({ partes, sueldo, alto = 10 }) {
  const total = Math.max(sueldo, partes.reduce((a, p) => a + p.monto, 0)) || 1;
  return (
    <div className="flex rounded-full overflow-hidden" style={{ height: alto, background: "var(--line)", gap: 1 }}>
      {partes.map((p) => (
        <div key={p.clave} style={{ width: `${(p.monto / total) * 100}%`, background: COLOR[p.clave] }} />
      ))}
    </div>
  );
}

/* ---------- Tarjeta compacta (va en la pestaña Semana) ---------- */
export function QuincenaCard({ q, onAbrir }) {
  const { money } = useCuenta();
  return (
    <button onClick={onAbrir} className="sobre-card w-full text-left p-4 mb-3 block">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-bold" style={{ color: "var(--ink)" }}>💵 Quincena · {rango(q.periodo.inicio, q.periodo.fin)}</span>
        <span className="text-[11px] font-semibold shrink-0" style={{ color: "var(--ink-soft)" }}>{cobroTxt(q.periodo.diasRestantes)}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-xs" style={{ color: "var(--ink-soft)" }}>Te va a quedar</div>
          <div className="num text-2xl font-bold" style={{ color: q.teQueda < 0 ? "var(--red)" : "var(--ink)" }}>{money(Math.round(q.teQueda))}</div>
        </div>
        <div className="text-[11px] text-right pb-1" style={{ color: "var(--ink-soft)" }}>
          de {money(q.sueldo)}
        </div>
      </div>
      <div className="mt-2"><Barra partes={q.partes} sueldo={q.sueldo} alto={8} /></div>
      <div className="flex items-center justify-between gap-2 mt-2 text-[11px]" style={{ color: "var(--ink-soft)" }}>
        <span>Ya salió <span className="num font-semibold">{money(Math.round(q.salidas.total))}</span></span>
        <span>Por pagar <span className="num font-semibold">{money(Math.round(q.porPagar.total))}</span></span>
        <span className="font-bold" style={{ color: "var(--green)" }}>Ver detalle ›</span>
      </div>
    </button>
  );
}

/* ---------- Invitacion a configurar (cuando aun no hay sueldo) ---------- */
export function QuincenaInvitacion({ onConfigurar, onOcultar }) {
  return (
    <div className="rounded-2xl px-4 py-3 mb-3" style={{ border: "1.5px dashed var(--line)", background: "color-mix(in srgb, var(--card) 60%, transparent)" }}>
      <div className="flex items-start gap-2">
        <span className="text-lg">💵</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold" style={{ color: "var(--ink)" }}>¿Cuánto te queda de la quincena?</div>
          <div className="text-xs" style={{ color: "var(--ink-soft)" }}>Pon tu sueldo y la app le descuenta tus pagos fijos y tarjetas.</div>
        </div>
        <button onClick={onOcultar} aria-label="Ocultar" className="text-sm px-1 -mt-0.5 shrink-0" style={{ color: "var(--ink-soft)" }}>✕</button>
      </div>
      <button onClick={onConfigurar} className="w-full text-xs font-bold py-2 mt-2.5 md3-btn-tonal">Poner mi sueldo</button>
    </div>
  );
}

const ESTADO = {
  pagado: { txt: "Pagado", color: "var(--green)" },
  pendiente: { txt: "Pendiente", color: "var(--amber)" },
  vencido: { txt: "Sin pagar", color: "var(--red)" },
};

function Renglon({ etiqueta, monto, signo = "", fuerte = false, color }) {
  const { money } = useCuenta();
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className={fuerte ? "text-sm font-bold" : "text-sm"} style={{ color: fuerte ? "var(--ink)" : "var(--ink-soft)" }}>{etiqueta}</span>
      <span className={`num ${fuerte ? "text-xl font-bold" : "text-sm font-semibold"}`} style={{ color: color || "var(--ink)" }}>{signo}{money(Math.round(monto))}</span>
    </div>
  );
}

/* ---------- Detalle a pantalla completa ---------- */
export function QuincenaDetalle({ q, onClose, onConfigurar }) {
  const { money, fmtDia, catLabel, catColor } = useCuenta();
  const { periodo } = q;
  const usado = q.sueldo > 0 ? (q.salidas.total + q.porPagar.total) / q.sueldo : 0;
  const titulo = "text-xs font-bold mb-2 mt-5";
  const tituloStyle = { color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" };

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto" style={{ background: "var(--paper)" }}>
      <div className="max-w-md mx-auto px-4 pt-5 pb-10">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-extrabold" style={{ color: "var(--ink)" }}>Tu quincena</h2>
          <button className="text-sm px-2 py-1 font-semibold" style={{ color: "var(--ink-soft)" }} onClick={onClose}>Cerrar</button>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--ink-soft)" }}>
          {rango(periodo.inicio, periodo.fin)} · día {periodo.diaActual} de {periodo.diasTotales} · {cobroTxt(periodo.diasRestantes).toLowerCase()}
        </p>

        {/* Resumen: la cuenta completa, de arriba hacia abajo */}
        <div className="sobre-card p-4">
          <Renglon etiqueta="Tu sueldo" monto={q.sueldo} />
          <Renglon etiqueta="Ya salió" monto={q.salidas.total} signo="− " />
          <Renglon etiqueta="Por pagar esta quincena" monto={q.porPagar.total} signo="− " />
          <div className="my-1" style={{ borderTop: "1px solid var(--line)" }} />
          <Renglon etiqueta="Te va a quedar" monto={q.teQueda} fuerte color={q.teQueda < 0 ? "var(--red)" : "var(--green)"} />
          {q.reservaSobres > 0 && (
            <>
              <Renglon etiqueta="Reservado para tus sobres" monto={q.reservaSobres} signo="− " />
              <Renglon etiqueta="Libre de verdad" monto={q.libre} color={q.libre < 0 ? "var(--red)" : "var(--ink)"} />
            </>
          )}
          <div className="text-xs mt-2 rounded-xl px-3 py-2" style={{ background: "var(--paper)", color: "var(--ink-soft)" }}>
            {q.teQueda < 0
              ? `Con lo que falta por pagar, esta quincena te faltan ${money(Math.round(-q.teQueda))}.`
              : `De cada $100 de tu sueldo, $${Math.round(usado * 100)} ya salieron o están apartados para pagos.`}
          </div>
        </div>

        {/* A donde se va el sueldo */}
        <p className={titulo} style={tituloStyle}>A dónde se va tu sueldo</p>
        <div className="sobre-card p-4">
          <Barra partes={q.partes} sueldo={q.sueldo} alto={14} />
          <div className="mt-3 space-y-2">
            {q.partes.map((p) => (
              <div key={p.clave} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLOR[p.clave] }} />
                <span className="text-sm flex-1 min-w-0 truncate" style={{ color: "var(--ink)" }}>{p.etiqueta}</span>
                <span className="num text-sm font-semibold" style={{ color: "var(--ink)" }}>{money(Math.round(p.monto))}</span>
                <span className="num text-xs w-9 text-right" style={{ color: "var(--ink-soft)" }}>{pctTxt(p.pct)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pagos fijos y tarjetas de la quincena */}
        <p className={titulo} style={tituloStyle}>Pagos de esta quincena</p>
        {q.compromisos.length === 0 && (
          <div className="text-sm rounded-xl px-3 py-3" style={{ background: "var(--card)", color: "var(--ink-soft)", border: "1px solid var(--line)" }}>
            No hay pagos fijos ni de tarjeta con fecha en esta quincena. Agrégalos en la pestaña Pagos.
          </div>
        )}
        <div className="space-y-2">
          {q.compromisos.map((c) => {
            const est = ESTADO[c.estado];
            return (
              <div key={`${c.tipo}-${c.id}-${c.fecha}`} className="rounded-xl px-3 py-2.5" style={{ background: "var(--card)", border: "1px solid var(--line)", opacity: c.estado === "pagado" ? 0.7 : 1 }}>
                <div className="flex items-center gap-2">
                  <span className="text-base shrink-0">{c.tipo === "tarjeta" ? "💳" : "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>{c.nombre}</div>
                    <div className="text-[11px]" style={{ color: "var(--ink-soft)" }}>
                      {fmtDia(c.fecha)}
                      {c.aCredito ? " · se carga a tu tarjeta" : c.monto > 0 ? ` · ${pctTxt(c.pct)} de tu sueldo` : ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="num text-sm font-bold" style={{ color: "var(--ink)" }}>{money(Math.round(c.monto))}</div>
                    <div className="text-[10px] font-bold" style={{ color: est.color }}>{est.txt}</div>
                  </div>
                </div>
                {c.detalle && c.estado !== "pagado" && (c.detalle.msi > 0 || c.detalle.compras > 0) && (
                  <div className="text-[11px] mt-1 pl-7" style={{ color: "var(--ink-soft)" }}>
                    Estimado: meses sin intereses {money(Math.round(c.detalle.msi))} + compras del corte {money(Math.round(c.detalle.compras))}
                  </div>
                )}
                {c.tipo === "tarjeta" && c.estado !== "pagado" && c.monto === 0 && (
                  <div className="text-[11px] mt-1 pl-7" style={{ color: "var(--ink-soft)" }}>
                    Sin compras registradas para este corte.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Gasto del dia a dia por categoria */}
        {q.diarioPorCategoria.length > 0 && (
          <>
            <p className={titulo} style={tituloStyle}>Gastos del día a día</p>
            <div className="sobre-card p-4 space-y-2">
              {q.diarioPorCategoria.map((d) => (
                <div key={d.categoria} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: catColor[d.categoria] || "var(--ink-soft)" }} />
                  <span className="text-sm flex-1 min-w-0 truncate" style={{ color: "var(--ink)" }}>{catLabel[d.categoria] || d.categoria}</span>
                  <span className="num text-sm font-semibold" style={{ color: "var(--ink)" }}>{money(Math.round(d.monto))}</span>
                  <span className="num text-xs w-9 text-right" style={{ color: "var(--ink-soft)" }}>{pctTxt(q.sueldo > 0 ? d.monto / q.sueldo : 0)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {(q.aCredito > 0 || q.porPagar.aCredito > 0) && (
          <div className="text-xs rounded-xl px-3 py-2.5 mt-4" style={{ background: "color-mix(in srgb, var(--amber) 14%, var(--card))", color: "var(--ink)" }}>
            💳 {q.aCredito > 0 && <>Esta quincena cargaste <span className="num font-bold">{money(Math.round(q.aCredito))}</span> a crédito. </>}
            {q.porPagar.aCredito > 0 && <>Faltan <span className="num font-bold">{money(Math.round(q.porPagar.aCredito))}</span> de pagos fijos que se cobran a la tarjeta. </>}
            Eso no baja este sueldo: sale cuando pagues la tarjeta.
          </div>
        )}

        <p className="text-[11px] mt-4 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          Cómo se calcula: «Ya salió» suma lo que pagaste en efectivo, débito o transferencia desde el día de cobro.
          «Por pagar» son tus pagos fijos y tarjetas con fecha en esta quincena que aún no registras.
          «Reservado para tus sobres» es lo que te falta gastar de tu plan semanal de aquí al siguiente cobro.
        </p>

        <button onClick={onConfigurar} className="w-full py-3 font-bold text-sm mt-5 md3-btn-tonal">
          Cambiar sueldo o días de cobro
        </button>
      </div>
    </div>
  );
}

/* ---------- Formulario: sueldo y dias de cobro ---------- */
export function QuincenaConfig({ cfg, onSave, onClose }) {
  const [sueldo, setSueldo] = useState(cfg?.sueldo ? String(cfg.sueldo) : "");
  const diasIni = cfg ? [cfg.dia1, cfg.dia2] : [15, 30];
  const esPreset = PRESETS_COBRO.some((p) => p.dias[0] === diasIni[0] && p.dias[1] === diasIni[1]);
  const [otros, setOtros] = useState(!esPreset);
  const [dia1, setDia1] = useState(String(diasIni[0]));
  const [dia2, setDia2] = useState(String(diasIni[1]));
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const guardar = async (valor) => {
    setGuardando(true); setError("");
    try { await onSave(valor); onClose(); }
    catch (err) { setError(err.message || "Error al guardar."); setGuardando(false); }
  };

  const submit = () => {
    const s = parseFloat(sueldo);
    if (!s || s <= 0) return setError("Pon cuánto recibes cada quincena.");
    const d1 = parseInt(dia1, 10);
    const d2 = parseInt(dia2, 10);
    if (![d1, d2].every((d) => d >= 1 && d <= 31)) return setError("Los días de cobro van del 1 al 31.");
    guardar({ sueldo: s, dia1: Math.min(d1, d2), dia2: Math.max(d1, d2) });
  };

  const chipOn = { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" };
  const inputStyle = { border: "1px solid var(--line)", color: "var(--ink)", background: "var(--paper)" };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center md3-sheet-backdrop" onClick={onClose}>
      <div className="w-full max-w-md p-4 pb-6 overflow-y-auto md3-sheet" style={{ background: "var(--card)", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="md3-drag-handle" />
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold" style={{ color: "var(--ink)" }}>Tu sueldo</h2>
          <button className="text-sm px-2 py-1" style={{ color: "var(--ink-soft)" }} onClick={onClose}>Cerrar</button>
        </div>

        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>¿Cuánto recibes cada quincena?</label>
        <input type="number" inputMode="decimal" placeholder="0" value={sueldo} onChange={(e) => setSueldo(e.target.value)}
          className="w-full num text-2xl font-semibold rounded-xl px-3 py-2 mb-1 outline-none" style={inputStyle} />
        <p className="text-[11px] mb-3" style={{ color: "var(--ink-soft)" }}>Lo que te llega ya libre, después de impuestos.</p>

        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>¿Qué días cobras?</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {PRESETS_COBRO.map((p) => (
            <button key={p.label} className="chip" onClick={() => { setOtros(false); setDia1(String(p.dias[0])); setDia2(String(p.dias[1])); }}
              style={!otros && Number(dia1) === p.dias[0] && Number(dia2) === p.dias[1] ? chipOn : {}}>
              {p.label}
            </button>
          ))}
          <button className="chip" onClick={() => setOtros(true)} style={otros ? chipOn : {}}>Otros días</button>
        </div>
        {otros && (
          <div className="flex items-center gap-2 mb-2">
            <input type="number" inputMode="numeric" min="1" max="31" value={dia1} onChange={(e) => setDia1(e.target.value)}
              className="w-20 num text-sm font-semibold rounded-xl px-3 py-2 text-center outline-none" style={inputStyle} />
            <span className="text-sm" style={{ color: "var(--ink-soft)" }}>y</span>
            <input type="number" inputMode="numeric" min="1" max="31" value={dia2} onChange={(e) => setDia2(e.target.value)}
              className="w-20 num text-sm font-semibold rounded-xl px-3 py-2 text-center outline-none" style={inputStyle} />
          </div>
        )}
        <p className="text-[11px] mb-4" style={{ color: "var(--ink-soft)" }}>Si el mes no tiene ese día, se toma el último del mes.</p>

        {error && <div className="text-xs mb-2" style={{ color: "var(--red)" }}>{error}</div>}
        <button onClick={submit} disabled={guardando} className="w-full py-3 font-bold text-sm md3-btn-filled"
          style={{ background: "var(--green)", color: "#fff", opacity: guardando ? 0.6 : 1 }}>
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        {cfg?.sueldo > 0 && (
          <button onClick={() => guardar(null)} disabled={guardando} className="w-full py-2.5 text-xs font-semibold mt-1" style={{ color: "var(--ink-soft)" }}>
            Dejar de usar la quincena
          </button>
        )}
      </div>
    </div>
  );
}

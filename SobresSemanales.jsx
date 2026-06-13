import { useState, useEffect } from "react";

/* ============================================================
   SOBRES SEMANALES — prototipo MVP
   Une la libreta de gastos + cartera de sobres.
   Semana: sábado a viernes. Sobrante semanal → Ahorro.
   ============================================================ */

const KEY = "finanzas-v1";
const MEDIOS = ["Efectivo", "Débito", "Crédito", "Transferencia"];
const EMOJIS = ["🛒", "🍽️", "🏠", "🎮", "💊", "📚", "🚇", "👕", "🐶", "🎁", "☕", "⚽"];

/* ---------- helpers de fecha (semana sáb–vie) ---------- */
const pad = (n) => String(n).padStart(2, "0");
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromStr = (s) => {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
// sábado=6 en getDay(); el inicio de semana es el sábado anterior o igual
const weekStartOf = (d) => addDays(d, -((d.getDay() + 1) % 7));
const weekOf = (fechaStr) => toStr(weekStartOf(fromStr(fechaStr)));

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const fmtDia = (s) => {
  const d = fromStr(s);
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
};
const weekLabel = (ws) => {
  const a = fromStr(ws);
  const b = addDays(a, 6);
  return `Sáb ${a.getDate()} ${MESES[a.getMonth()]} – Vie ${b.getDate()} ${MESES[b.getMonth()]}`;
};
const money = (n) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.abs(n % 1) > 0.001 ? 2 : 0,
  }).format(n);

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/* ---------- datos iniciales ---------- */
const defaultData = () => ({
  version: 1,
  sobres: [
    { id: "s-super", nombre: "Súper", emoji: "🛒", presupuesto: 800, esAhorro: false },
    { id: "s-comida", nombre: "Comida fuera", emoji: "🍽️", presupuesto: 500, esAhorro: false },
    { id: "s-casa", nombre: "Casa", emoji: "🏠", presupuesto: 500, esAhorro: false },
    { id: "s-diversion", nombre: "Diversión", emoji: "🎮", presupuesto: 400, esAhorro: false },
    { id: "s-salud", nombre: "Salud", emoji: "💊", presupuesto: 200, esAhorro: false },
    { id: "s-escuela", nombre: "Escuela", emoji: "📚", presupuesto: 200, esAhorro: false },
    { id: "s-transporte", nombre: "Transporte", emoji: "🚇", presupuesto: 300, esAhorro: false },
    { id: "s-ahorro", nombre: "Ahorro", emoji: "💰", presupuesto: 0, esAhorro: true },
  ],
  gastos: [],
  cierres: [],
});

/* ---------- cierre automático de semanas pasadas ---------- */
function autoClose(data) {
  const todayWS = toStr(weekStartOf(new Date()));
  const semanasConGastos = [...new Set(data.gastos.map((g) => weekOf(g.fecha)))];
  const yaCerradas = new Set(data.cierres.map((c) => c.semana));
  const nuevos = [];
  for (const ws of semanasConGastos) {
    if (ws >= todayWS || yaCerradas.has(ws)) continue;
    const detalle = data.sobres
      .filter((s) => !s.esAhorro)
      .map((s) => {
        const gastado = data.gastos
          .filter((g) => g.sobreId === s.id && weekOf(g.fecha) === ws)
          .reduce((a, g) => a + g.monto, 0);
        return {
          sobreId: s.id,
          nombre: s.nombre,
          emoji: s.emoji,
          presupuesto: s.presupuesto,
          gastado,
          sobrante: Math.max(0, s.presupuesto - gastado),
        };
      });
    const total = detalle.reduce((a, x) => a + x.sobrante, 0);
    nuevos.push({ semana: ws, detalle, total, cerradoEn: new Date().toISOString() });
  }
  if (!nuevos.length) return { data, changed: false };
  const cierres = [...data.cierres, ...nuevos].sort((a, b) => (a.semana < b.semana ? -1 : 1));
  return { data: { ...data, cierres }, changed: true };
}

/* ============================================================
   Componentes
   ============================================================ */

function SobreCard({ sobre, gastado }) {
  const restante = sobre.presupuesto - gastado;
  const pct = sobre.presupuesto > 0 ? Math.max(0, Math.min(1, restante / sobre.presupuesto)) : 0;
  const estado = restante < 0 ? "rojo" : pct <= 0.25 ? "ambar" : "verde";
  const colorVar = estado === "rojo" ? "var(--red)" : estado === "ambar" ? "var(--amber)" : "var(--green)";
  return (
    <div className="sobre-card">
      <div className="sobre-flap" />
      <div className="px-3 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{sobre.emoji}</span>
          <span className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>
            {sobre.nombre}
          </span>
        </div>
        <div className="mt-2 num text-xl font-semibold" style={{ color: colorVar }}>
          {money(restante)}
        </div>
        <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
          de {money(sobre.presupuesto)}
          {restante < 0 ? " · te pasaste" : ""}
        </div>
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${pct * 100}%`, background: colorVar, transition: "width .3s" }}
          />
        </div>
      </div>
    </div>
  );
}

function GastoForm({ sobres, viewedWS, isCurrent, onAdd, onClose }) {
  const hoy = toStr(new Date());
  const gastables = sobres.filter((s) => !s.esAhorro);
  const [monto, setMonto] = useState("");
  const [sobreId, setSobreId] = useState(gastables[0]?.id || "");
  const [medio, setMedio] = useState("Efectivo");
  const [nota, setNota] = useState("");
  const [fecha, setFecha] = useState(isCurrent ? hoy : viewedWS);
  const [error, setError] = useState("");

  const dias = [];
  for (let i = 0; i < 7; i++) {
    const d = toStr(addDays(fromStr(viewedWS), i));
    if (isCurrent && d > hoy) break;
    dias.push(d);
  }

  const submit = () => {
    const m = parseFloat(monto);
    if (!m || m <= 0) return setError("Pon un monto válido.");
    if (!sobreId) return setError("Elige un sobre.");
    onAdd({ id: uid(), fecha, monto: m, sobreId, medio, nota: nota.trim(), creadoEn: Date.now() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" style={{ background: "rgba(34,50,74,.45)" }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl p-4 pb-6"
        style={{ background: "var(--card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold" style={{ color: "var(--ink)" }}>Registrar gasto</h2>
          <button className="text-sm px-2 py-1" style={{ color: "var(--ink-soft)" }} onClick={onClose}>Cerrar</button>
        </div>

        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>¿Cuánto?</label>
        <input
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={monto}
          autoFocus
          onChange={(e) => setMonto(e.target.value)}
          className="w-full num text-2xl font-semibold rounded-xl px-3 py-2 mb-3 outline-none"
          style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--paper)" }}
        />

        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>¿De qué sobre sale?</label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {gastables.map((s) => (
            <button
              key={s.id}
              onClick={() => setSobreId(s.id)}
              className="chip"
              style={
                sobreId === s.id
                  ? { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" }
                  : {}
              }
            >
              {s.emoji} {s.nombre}
            </button>
          ))}
        </div>

        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Medio de pago</label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {MEDIOS.map((m) => (
            <button
              key={m}
              onClick={() => setMedio(m)}
              className="chip"
              style={medio === m ? { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" } : {}}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Día</label>
            <select
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--paper)" }}
            >
              {dias.map((d) => (
                <option key={d} value={d}>{fmtDia(d)}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Nota (opcional)</label>
            <input
              type="text"
              placeholder="Walmart, tacos…"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--paper)" }}
            />
          </div>
        </div>

        {error && <div className="text-xs mb-2" style={{ color: "var(--red)" }}>{error}</div>}

        <button
          onClick={submit}
          className="w-full rounded-xl py-3 font-bold text-sm"
          style={{ background: "var(--green)", color: "#fff" }}
        >
          Guardar gasto
        </button>
      </div>
    </div>
  );
}

function TabSemana({ data, offset, setOffset, onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const hoy = new Date();
  const viewedWS = toStr(addDays(weekStartOf(hoy), offset * 7));
  const isCurrent = offset === 0;
  const cierre = data.cierres.find((c) => c.semana === viewedWS);

  const gastables = data.sobres.filter((s) => !s.esAhorro);
  const gastosSemana = data.gastos
    .filter((g) => weekOf(g.fecha) === viewedWS)
    .sort((a, b) => (a.fecha === b.fecha ? b.creadoEn - a.creadoEn : a.fecha < b.fecha ? 1 : -1));

  const gastadoPor = (id) => gastosSemana.filter((g) => g.sobreId === id).reduce((a, g) => a + g.monto, 0);
  const presupTotal = gastables.reduce((a, s) => a + s.presupuesto, 0);
  const gastadoTotal = gastosSemana.reduce((a, g) => a + g.monto, 0);
  const restanteTotal = presupTotal - gastadoTotal;

  const porDia = gastosSemana.reduce((acc, g) => {
    (acc[g.fecha] = acc[g.fecha] || []).push(g);
    return acc;
  }, {});
  const sobreDe = (id) => data.sobres.find((s) => s.id === id);

  return (
    <div>
      {/* navegación de semana */}
      <div className="flex items-center justify-between mb-3">
        <button className="nav-arrow" onClick={() => setOffset(offset - 1)}>‹</button>
        <div className="text-center">
          <div className="text-sm font-bold" style={{ color: "var(--ink)" }}>{weekLabel(viewedWS)}</div>
          <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
            {isCurrent ? "Semana actual" : cierre ? "Semana cerrada" : "Semana pasada"}
          </div>
        </div>
        <button
          className="nav-arrow"
          onClick={() => setOffset(Math.min(0, offset + 1))}
          style={offset === 0 ? { opacity: 0.25 } : {}}
        >
          ›
        </button>
      </div>

      {/* resumen */}
      <div className="rounded-2xl p-4 mb-3" style={{ background: "var(--ink)" }}>
        <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,.65)" }}>
          {isCurrent ? "Te queda esta semana" : "Quedó esta semana"}
        </div>
        <div className="num text-3xl font-bold" style={{ color: restanteTotal < 0 ? "#FFB4A0" : "#fff" }}>
          {money(restanteTotal)}
        </div>
        <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,.65)" }}>
          Gastado {money(gastadoTotal)} de {money(presupTotal)} · {gastosSemana.length} gasto{gastosSemana.length === 1 ? "" : "s"}
        </div>
      </div>

      {cierre && (
        <div className="rounded-xl px-3 py-2 mb-3 text-sm font-semibold" style={{ background: "#E7F3EC", color: "var(--green)" }}>
          💰 {money(cierre.total)} pasaron al Ahorro al cerrar
        </div>
      )}

      {/* sobres */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {gastables.map((s) => (
          <SobreCard key={s.id} sobre={s} gastado={gastadoPor(s.id)} />
        ))}
      </div>

      {isCurrent && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-xl py-3 font-bold text-sm mb-4"
          style={{ background: "var(--green)", color: "#fff" }}
        >
          + Registrar gasto
        </button>
      )}

      {/* libreta de la semana */}
      <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--ink-soft)" }}>
        Libreta de la semana
      </h3>
      {gastosSemana.length === 0 && (
        <div className="text-sm py-6 text-center" style={{ color: "var(--ink-soft)" }}>
          Sin gastos registrados.{isCurrent ? " Registra el primero arriba." : ""}
        </div>
      )}
      {Object.keys(porDia).map((dia) => (
        <div key={dia} className="mb-3">
          <div className="text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>{fmtDia(dia)}</div>
          {porDia[dia].map((g) => {
            const s = sobreDe(g.sobreId);
            return (
              <div
                key={g.id}
                className="flex items-center gap-2 rounded-xl px-3 py-2 mb-1"
                style={{ background: "var(--card)", border: "1px solid var(--line)" }}
              >
                <span>{s ? s.emoji : "❓"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>
                    {g.nota || (s ? s.nombre : "Sobre eliminado")}
                  </div>
                  <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
                    {s ? s.nombre + " · " : ""}{g.medio}
                  </div>
                </div>
                <div className="num text-sm font-semibold" style={{ color: "var(--ink)" }}>{money(g.monto)}</div>
                {isCurrent &&
                  (pendingDelete === g.id ? (
                    <button
                      className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ background: "var(--red)", color: "#fff" }}
                      onClick={() => {
                        onDelete(g.id);
                        setPendingDelete(null);
                      }}
                    >
                      ¿Borrar?
                    </button>
                  ) : (
                    <button
                      className="text-xs px-2 py-1"
                      style={{ color: "var(--ink-soft)" }}
                      onClick={() => setPendingDelete(g.id)}
                    >
                      ✕
                    </button>
                  ))}
              </div>
            );
          })}
        </div>
      ))}

      {showForm && (
        <GastoForm
          sobres={data.sobres}
          viewedWS={viewedWS}
          isCurrent={isCurrent}
          onAdd={onAdd}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function TabSobres({ data, onSave }) {
  const [editing, setEditing] = useState(null); // id | "nuevo" | null
  const [nombre, setNombre] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [presupuesto, setPresupuesto] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [msg, setMsg] = useState("");

  const gastables = data.sobres.filter((s) => !s.esAhorro);
  const presupTotal = gastables.reduce((a, s) => a + s.presupuesto, 0);

  const startEdit = (s) => {
    setEditing(s.id);
    setNombre(s.nombre);
    setEmoji(s.emoji);
    setPresupuesto(String(s.presupuesto));
    setMsg("");
  };
  const startNew = () => {
    setEditing("nuevo");
    setNombre("");
    setEmoji(EMOJIS[0]);
    setPresupuesto("");
    setMsg("");
  };
  const cancel = () => setEditing(null);

  const save = () => {
    const p = parseFloat(presupuesto);
    if (!nombre.trim()) return setMsg("Ponle nombre al sobre.");
    if (isNaN(p) || p < 0) return setMsg("Presupuesto inválido.");
    let sobres;
    if (editing === "nuevo") {
      sobres = [...data.sobres];
      const idxAhorro = sobres.findIndex((s) => s.esAhorro);
      const nuevo = { id: uid(), nombre: nombre.trim(), emoji, presupuesto: p, esAhorro: false };
      if (idxAhorro >= 0) sobres.splice(idxAhorro, 0, nuevo);
      else sobres.push(nuevo);
    } else {
      sobres = data.sobres.map((s) =>
        s.id === editing ? { ...s, nombre: nombre.trim(), emoji, presupuesto: p } : s
      );
    }
    onSave(sobres);
    setEditing(null);
  };

  const tryDelete = (id) => {
    const tieneGastos = data.gastos.some((g) => g.sobreId === id);
    if (tieneGastos) {
      setMsg("Ese sobre tiene gastos registrados; no se puede eliminar para no perder historia.");
      setPendingDelete(null);
      return;
    }
    if (pendingDelete !== id) {
      setPendingDelete(id);
      return;
    }
    onSave(data.sobres.filter((s) => s.id !== id));
    setPendingDelete(null);
  };

  const formRow = (
    <div className="rounded-xl p-3 mb-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
      <div className="flex flex-wrap gap-1 mb-2">
        {EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            className="text-lg px-1.5 py-0.5 rounded-lg"
            style={emoji === e ? { background: "var(--line)" } : {}}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Nombre del sobre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
          style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }}
        />
        <input
          type="number"
          inputMode="decimal"
          placeholder="$/sem"
          value={presupuesto}
          onChange={(e) => setPresupuesto(e.target.value)}
          className="w-24 num rounded-xl px-3 py-2 text-sm outline-none"
          style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }}
        />
      </div>
      {msg && <div className="text-xs mb-2" style={{ color: "var(--red)" }}>{msg}</div>}
      <div className="flex gap-2">
        <button onClick={save} className="flex-1 rounded-xl py-2 text-sm font-bold" style={{ background: "var(--green)", color: "#fff" }}>
          Guardar
        </button>
        <button onClick={cancel} className="px-4 rounded-xl py-2 text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>
          Cancelar
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-base font-bold" style={{ color: "var(--ink)" }}>Mis sobres</h2>
        <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
          Presupuesto semanal: <span className="num font-semibold">{money(presupTotal)}</span>
        </div>
      </div>

      {msg && editing === null && (
        <div className="text-xs mb-2 rounded-xl px-3 py-2" style={{ background: "#FBEAE5", color: "var(--red)" }}>{msg}</div>
      )}

      {gastables.map((s) =>
        editing === s.id ? (
          <div key={s.id}>{formRow}</div>
        ) : (
          <div
            key={s.id}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-2"
            style={{ background: "var(--card)", border: "1px solid var(--line)" }}
          >
            <span className="text-lg">{s.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>{s.nombre}</div>
              <div className="text-xs num" style={{ color: "var(--ink-soft)" }}>{money(s.presupuesto)} / semana</div>
            </div>
            <button className="text-xs font-semibold px-2 py-1" style={{ color: "var(--ink-soft)" }} onClick={() => startEdit(s)}>
              Editar
            </button>
            <button
              className="text-xs px-2 py-1 rounded-lg font-semibold"
              style={pendingDelete === s.id ? { background: "var(--red)", color: "#fff" } : { color: "var(--ink-soft)" }}
              onClick={() => tryDelete(s.id)}
            >
              {pendingDelete === s.id ? "¿Seguro?" : "✕"}
            </button>
          </div>
        )
      )}

      {editing === "nuevo" ? (
        formRow
      ) : (
        <button
          onClick={startNew}
          className="w-full rounded-xl py-2.5 text-sm font-bold mt-1"
          style={{ border: "1.5px dashed var(--ink-soft)", color: "var(--ink)" }}
        >
          + Agregar sobre
        </button>
      )}

      <p className="text-xs mt-4 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        El sobre 💰 Ahorro es especial: no se gasta y recibe automáticamente lo que sobre de los demás al cerrar cada semana (viernes en la noche).
      </p>
    </div>
  );
}

function TabAhorro({ data }) {
  const [open, setOpen] = useState(null);
  const cierres = [...data.cierres].sort((a, b) => (a.semana < b.semana ? 1 : -1));
  const total = cierres.reduce((a, c) => a + c.total, 0);

  return (
    <div>
      <div className="rounded-2xl p-5 mb-4 text-center" style={{ background: "var(--green)" }}>
        <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,.75)" }}>💰 Ahorro acumulado</div>
        <div className="num text-4xl font-bold text-white mt-1">{money(total)}</div>
        <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,.75)" }}>
          {cierres.length} semana{cierres.length === 1 ? "" : "s"} cerrada{cierres.length === 1 ? "" : "s"}
        </div>
      </div>

      {cierres.length === 0 && (
        <div className="text-sm text-center py-6 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          Aún no hay semanas cerradas.
          <br />
          Cuando termine el viernes, lo que sobre en cada sobre caerá aquí solito.
        </div>
      )}

      {cierres.map((c) => (
        <div
          key={c.semana}
          className="rounded-xl mb-2 overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--line)" }}
        >
          <button
            className="w-full flex items-center justify-between px-3 py-2.5"
            onClick={() => setOpen(open === c.semana ? null : c.semana)}
          >
            <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{weekLabel(c.semana)}</span>
            <span className="num text-sm font-bold" style={{ color: "var(--green)" }}>+{money(c.total)}</span>
          </button>
          {open === c.semana && (
            <div className="px-3 pb-3">
              {c.detalle.map((d) => (
                <div key={d.sobreId} className="flex items-center justify-between text-xs py-1" style={{ color: "var(--ink-soft)" }}>
                  <span>
                    {d.emoji} {d.nombre} — gastó {money(d.gastado)} de {money(d.presupuesto)}
                  </span>
                  <span className="num font-semibold" style={{ color: d.sobrante > 0 ? "var(--green)" : "var(--ink-soft)" }}>
                    +{money(d.sobrante)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   App principal
   ============================================================ */
export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("semana");
  const [offset, setOffset] = useState(0);
  const [err, setErr] = useState("");

  const persist = async (d) => {
    setData(d);
    try {
      if (window.storage) await window.storage.set(KEY, JSON.stringify(d));
    } catch (e) {
      setErr("No se pudo guardar el último cambio. Revisa tu conexión.");
    }
  };

  useEffect(() => {
    (async () => {
      let d;
      try {
        const r = await window.storage.get(KEY);
        d = JSON.parse(r.value);
      } catch (e) {
        d = defaultData();
      }
      const res = autoClose(d);
      setData(res.data);
      setLoading(false);
      if (res.changed) {
        try {
          if (window.storage) await window.storage.set(KEY, JSON.stringify(res.data));
        } catch (e) {}
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F4ED" }}>
        <div className="text-sm" style={{ color: "#5A6B85" }}>Abriendo tu libreta…</div>
      </div>
    );
  }

  const addGasto = (g) => persist({ ...data, gastos: [...data.gastos, g] });
  const deleteGasto = (id) => persist({ ...data, gastos: data.gastos.filter((g) => g.id !== id) });
  const saveSobres = (sobres) => persist({ ...data, sobres });

  const TABS = [
    { id: "semana", label: "Semana", icon: "📓" },
    { id: "sobres", label: "Sobres", icon: "✉️" },
    { id: "ahorro", label: "Ahorro", icon: "💰" },
  ];

  return (
    <div className="app-root min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .app-root {
          --paper: #F6F4ED;
          --line: #E3DECF;
          --card: #FFFFFF;
          --ink: #22324A;
          --ink-soft: #5A6B85;
          --green: #0B7A4B;
          --amber: #B07A1F;
          --red: #B3402A;
          --flap: #EFEBDF;
          font-family: 'Sora', system-ui, sans-serif;
          background:
            repeating-linear-gradient(to bottom, transparent 0 31px, rgba(34,50,74,.045) 31px 32px),
            var(--paper);
          color: var(--ink);
        }
        .num { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
        .sobre-card {
          position: relative;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 12px;
          overflow: hidden;
        }
        .sobre-flap {
          position: absolute; top: 0; left: 0; right: 0; height: 13px;
          background: var(--flap);
          clip-path: polygon(0 0, 100% 0, 50% 100%);
        }
        .chip {
          font-size: 12px; font-weight: 600;
          padding: 6px 10px; border-radius: 9999px;
          border: 1px solid var(--line);
          background: var(--paper); color: var(--ink);
        }
        .nav-arrow {
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid var(--line); background: var(--card);
          color: var(--ink); font-size: 18px; font-weight: 700;
        }
        input::placeholder { color: #9AA6B8; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      <div className="max-w-md mx-auto px-4 pt-5 pb-28">
        <header className="mb-4">
          <h1 className="text-lg font-bold" style={{ color: "var(--ink)" }}>Sobres semanales</h1>
          <p className="text-xs" style={{ color: "var(--ink-soft)" }}>Tu libreta + tu cartera de sobres, en un solo lugar</p>
        </header>

        {err && (
          <div className="text-xs rounded-xl px-3 py-2 mb-3" style={{ background: "#FBEAE5", color: "var(--red)" }}>
            {err}
          </div>
        )}

        {tab === "semana" && (
          <TabSemana data={data} offset={offset} setOffset={setOffset} onAdd={addGasto} onDelete={deleteGasto} />
        )}
        {tab === "sobres" && <TabSobres data={data} onSave={saveSobres} />}
        {tab === "ahorro" && <TabAhorro data={data} />}
      </div>

      {/* navegación inferior */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20"
        style={{ background: "rgba(255,255,255,.94)", borderTop: "1px solid var(--line)", backdropFilter: "blur(6px)" }}
      >
        <div className="max-w-md mx-auto flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 text-center"
              style={{ color: tab === t.id ? "var(--ink)" : "var(--ink-soft)" }}
            >
              <div className="text-lg leading-none">{t.icon}</div>
              <div className="text-xs font-semibold mt-0.5">{t.label}</div>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

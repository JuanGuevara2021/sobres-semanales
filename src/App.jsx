import { useState, useEffect, useCallback, useRef } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CuentaProvider, useCuenta } from "./contexts/CuentaContext";
import { supabase } from "./lib/supabase";
import { toStr, fromStr, addDays, MESES, DIAS, DIAS_INICIO_OPTIONS, COLORES_CATEGORIA } from "./lib/config";
import Login from "./components/Login";
import Landing from "./components/Landing";
import OnboardingWizard from "./components/OnboardingWizard";
import PinLock, { hasPin, isUnlocked, setPin, getPin, clearUnlock } from "./components/PinLock";
import WelcomeTour, { needsTour, markTourDone } from "./components/WelcomeTour";
import { esPublica } from "./lib/appMode";
import { getTabsVisibles, calcPilarSugerido, getTransicion } from "./lib/pilares";
import { initAds, showBanner, hideBanner, prepareInterstitial, showInterstitial, shouldShowAds } from "./lib/ads";
import { exportGastosCSV, purchasePro, restorePurchases, isProAvailable, PRECIO_PRO, APP_VERSION } from "./lib/pro";
import { initCrashlytics, logError } from "./lib/crashlytics";
import { markFirstUse, tryRequestReview } from "./lib/review";
import { initNotifications, programarNotificaciones, getDiasAntes, setDiasAntes, OPCIONES_ANTELACION } from "./lib/notifications";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ReferenceLine, CartesianGrid, LabelList,
} from "recharts";
import {
  BookOpen, Notebook, Mail, CreditCard, BarChart3,
  ChevronLeft, ChevronRight, Settings, LogOut, Plus, Trash2, Pencil, X,
  Image as ImageIcon, Check,
} from "lucide-react";

/* ============================================================
   SOBRES SEMANALES v2.1 — conectado a Supabase
   ============================================================ */

const MEDIOS = ["efectivo", "debito", "credito", "transferencia"];
const MEDIOS_LABEL = { efectivo: "Efectivo", debito: "Debito", credito: "Credito", transferencia: "Transferencia" };
const EMOJIS = ["🛒", "🍽️", "🏠", "🎮", "💊", "📚", "🚇", "👕", "🐶", "🎁", "☕", "⚽", "📱", "📞", "🎉", "🐷"];
const FREQ_LABEL = { semanal: "Semanal", quincenal: "Quincenal", mensual: "Mensual" };

const TEMAS = {
  claro: {
    label: "Claro", paper: "#F6F4ED", line: "#E3DECF", card: "#FFFFFF",
    ink: "#22324A", inkSoft: "#5A6B85", green: "#0B7A4B", amber: "#B07A1F",
    red: "#B3402A", flap: "#EFEBDF",
    bg: "repeating-linear-gradient(to bottom,transparent 0 31px,rgba(34,50,74,.045) 31px 32px),#F6F4ED",
  },
  oscuro: {
    label: "Oscuro", paper: "#16171F", line: "#2A2C3A", card: "#1E2030",
    ink: "#E0DEF0", inkSoft: "#8E8CA4", green: "#34D399", amber: "#FBBF24",
    red: "#F87171", flap: "#2A2C3A", accent: "#3B3D52",
    bg: "#16171F",
  },
  coquette: {
    label: "Coquette", paper: "#FFF5F7", line: "#F5D0D8", card: "#FFFFFF",
    ink: "#5C2040", inkSoft: "#9B6B82", green: "#D4608A", amber: "#E8A87C",
    red: "#C53D4D", flap: "#FDE8EE",
    bg: "repeating-linear-gradient(to bottom,transparent 0 31px,rgba(200,100,140,.06) 31px 32px),#FFF5F7",
  },
  periodico: {
    label: "Periodico", paper: "#F2EFE4", line: "#C8C3B4", card: "#FAFAF5",
    ink: "#1A1A1A", inkSoft: "#555555", green: "#2D5016", amber: "#8B7500",
    red: "#8B0000", flap: "#E8E4D8",
    bg: "repeating-linear-gradient(to bottom,transparent 0 23px,rgba(0,0,0,.08) 23px 24px),#F2EFE4",
  },
  mariposas: {
    label: "Mariposas", paper: "#F0EEFF", line: "#D0CCEE", card: "#FFFFFF",
    ink: "#2D1B69", inkSoft: "#7B6FA6", green: "#6B48C8", amber: "#D4A017",
    red: "#C53D4D", flap: "#E4E0F8",
    bg: "repeating-linear-gradient(to bottom,transparent 0 31px,rgba(100,60,200,.05) 31px 32px),#F0EEFF",
  },
  oceano: {
    label: "Oceano", paper: "#EDF4F8", line: "#C4D9E8", card: "#FFFFFF",
    ink: "#1B3A4B", inkSoft: "#5B7D8F", green: "#0891B2", amber: "#D97706",
    red: "#DC2626", flap: "#D6E8F0", pro: true,
    bg: "repeating-linear-gradient(to bottom,transparent 0 31px,rgba(8,145,178,.05) 31px 32px),#EDF4F8",
  },
  bosque: {
    label: "Bosque", paper: "#F0F5ED", line: "#C4D4BC", card: "#FAFCF8",
    ink: "#1A3020", inkSoft: "#5A7060", green: "#2D6A1E", amber: "#A67C00",
    red: "#B83030", flap: "#DCE8D6", pro: true,
    bg: "repeating-linear-gradient(to bottom,transparent 0 31px,rgba(45,106,30,.05) 31px 32px),#F0F5ED",
  },
  medianoche: {
    label: "Noche", paper: "#0F172A", line: "#1E293B", card: "#1E293B",
    ink: "#E2E8F0", inkSoft: "#94A3B8", green: "#22D3EE", amber: "#FBBF24",
    red: "#FB7185", flap: "#334155", accent: "#3B4C63", pro: true,
    bg: "#0F172A",
  },
};

/* ---------- helpers de fecha importados de config.js ---------- */

/* ---------- helpers para pagos recurrentes ---------- */
function getPagosProximos(pagos, gastos, weekStartOf, weekOf) {
  const hoy = new Date();
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

/* ---------- helpers para tarjetas ---------- */
function getCicloActual(diaCorte) {
  const hoy = new Date();
  const y = hoy.getFullYear(), m = hoy.getMonth();
  if (hoy.getDate() <= diaCorte) {
    return { inicio: toStr(new Date(y, m - 1, diaCorte + 1)), fin: toStr(new Date(y, m, diaCorte)) };
  }
  return { inicio: toStr(new Date(y, m, diaCorte + 1)), fin: toStr(new Date(y, m + 1, diaCorte)) };
}

function calcEstimadoTarjeta(tarjeta, gastos, msiList, pagosRec, pagoEsteMes = false) {
  const msiMensual = msiList
    .filter((m) => m.tarjeta_id === tarjeta.id && m.activo)
    .reduce((a, m) => {
      const st = calcMSI(m, pagoEsteMes);
      return st.estatus === "activo" ? a + st.mensual : a;
    }, 0);
  const numMSI = msiList.filter((m) => m.tarjeta_id === tarjeta.id && m.activo && calcMSI(m, pagoEsteMes).estatus === "activo").length;
  return { msi: msiMensual, numMSI, total: msiMensual };
}

function getTarjetaRecordatorios(tarjetas, pagosRec, gastos) {
  const hoy = new Date();
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

/* ---------- helpers para MSI ---------- */
function calcMSI(msi, pagoEsteMes = false) {
  const hoy = new Date();
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

/* ---------- cierre automatico v2.2 ---------- */
async function autoClose(sobres, gastos, cierresExistentes, cuentaId, weekStartOf, weekOf) {
  const todayWS = toStr(weekStartOf(new Date()));
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
    nuevos.push({ cuenta_id: cuentaId, semana: ws, detalle, total_a_ahorro: totalAAhorro });
  }
  if (!nuevos.length) return { nuevos: [], totalAhorrado: 0 };
  const { data: insertados, error } = await supabase.from("cierres").insert(nuevos).select();
  if (error) { console.error("Error al cerrar semanas:", error); return { nuevos: [], totalAhorrado: 0 }; }

  // Actualizar saldo_acumulado de TODOS los sobres (ahorro y acumula)
  for (const s of sobres.filter((s) => !s.es_ahorro)) {
    if (saldoR[s.id] !== Number(s.saldo_acumulado)) {
      await supabase.from("sobres").update({ saldo_acumulado: saldoR[s.id] }).eq("id", s.id);
    }
  }

  // Actualizar Ahorro: aportacion propia + sobrantes recibidos - gastos desde ahorro
  const sobreAhorro = sobres.find((s) => s.es_ahorro);
  if (sobreAhorro) {
    const totalAhorrado = nuevos.reduce((a, c) => a + c.total_a_ahorro, 0);
    const ahorroAport = Number(sobreAhorro.aportacion_semanal) * nuevos.length;
    const semanasCerradas = nuevos.map((c) => c.semana);
    const gastadoDeAhorro = gastos
      .filter((g) => g.sobre_id === sobreAhorro.id && semanasCerradas.includes(weekOf(g.fecha)))
      .reduce((a, g) => a + Number(g.monto), 0);
    const netChange = ahorroAport + totalAhorrado - gastadoDeAhorro;
    if (netChange !== 0) await supabase.from("sobres").update({ saldo_acumulado: Math.max(0, Number(sobreAhorro.saldo_acumulado) + netChange) }).eq("id", sobreAhorro.id);
  }
  return { nuevos: insertados || [], totalAhorrado: nuevos.reduce((a, c) => a + c.total_a_ahorro, 0) };
}

/* ============================================================
   Modal Pro
   ============================================================ */
function ProModal({ onClose, onUpgrade }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);
    const result = await purchasePro();
    setLoading(false);
    if (result.success) onUpgrade();
    else if (result.error) setError(result.error);
  };

  const handleRestore = async () => {
    setLoading(true);
    const restored = await restorePurchases();
    setLoading(false);
    if (restored) onUpgrade();
    else setError("No se encontraron compras anteriores");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md3-sheet-backdrop" onClick={onClose}>
      <div className="w-full max-w-md md3-sheet p-5 pb-8 overflow-y-auto" style={{ background: "var(--card)", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="md3-drag-handle" />
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">⭐</div>
          <h2 className="text-xl font-extrabold mb-1" style={{ color: "var(--ink)" }}>Sobres Pro</h2>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Saca el maximo provecho de tu dinero</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
            <span className="text-lg">🚫</span>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Sin anuncios</div>
              <div className="text-xs" style={{ color: "var(--ink-soft)" }}>Usa la app sin interrupciones</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
            <span className="text-lg">📊</span>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Exportar gastos</div>
              <div className="text-xs" style={{ color: "var(--ink-soft)" }}>Descarga tus datos en CSV/Excel</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
            <span className="text-lg">🎨</span>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Temas exclusivos</div>
              <div className="text-xs" style={{ color: "var(--ink-soft)" }}>Oceano, Bosque y Medianoche</div>
            </div>
          </div>
        </div>

        <div className="text-center mb-4">
          <div className="text-2xl font-extrabold" style={{ color: "var(--green)" }}>{PRECIO_PRO}<span className="text-sm font-normal" style={{ color: "var(--ink-soft)" }}> / año</span></div>
          <div className="text-xs" style={{ color: "var(--ink-soft)" }}>Solo $10/mes — menos que un café</div>
          <div className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>Cancela cuando quieras desde Google Play</div>
        </div>

        {error && <div className="text-xs text-center mb-3" style={{ color: "var(--red)" }}>{error}</div>}

        {!isProAvailable() && (
          <div className="text-xs text-center mb-3 rounded-xl px-3 py-2" style={{ background: "var(--paper)", color: "var(--ink-soft)", border: "1px solid var(--line)" }}>
            Disponible solo en la app de Google Play
          </div>
        )}

        <button onClick={handlePurchase} disabled={loading || !isProAvailable()} className="w-full py-3.5 font-bold text-sm md3-btn-filled mb-2"
          style={{ background: "var(--green)", color: "#fff", opacity: loading || !isProAvailable() ? 0.6 : 1 }}>
          {loading ? "Procesando..." : "Suscribirse a Pro"}
        </button>
        <button onClick={handleRestore} disabled={loading || !isProAvailable()} className="w-full py-2.5 text-xs font-semibold"
          style={{ color: "var(--ink-soft)" }}>
          Ya compré Pro — restaurar compra
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Pilares — transicion y guia
   ============================================================ */

function PilarTransicion({ transicion, onContinuar }) {
  if (!transicion) return null;
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-6 md3-sheet-backdrop`}>
      <div className="w-full max-w-sm p-6 text-center md3-card" style={{ background: "var(--card)", borderRadius: "28px" }}>
        <div className="text-5xl mb-3">{transicion.emoji}</div>
        <h2 className="text-xl font-extrabold mb-2" style={{ color: "var(--ink)" }}>{transicion.titulo}</h2>
        <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--ink-soft)" }}>{transicion.mensaje}</p>
        <button onClick={onContinuar} className="w-full py-3 font-bold text-sm md3-btn-filled" style={{ background: "var(--green)", color: "#fff", borderRadius: "20px" }}>
          {transicion.boton}
        </button>
      </div>
    </div>
  );
}

function GuiaPilar1({ gastosCount, onAvanzar }) {
  return (
    <div className="rounded-2xl p-4 mb-3" style={{ background: "var(--green)", color: "#fff" }}>
      <div className="text-sm font-bold mb-1">Registra tus gastos</div>
      <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,.8)" }}>
        Cada vez que gastes algo, anotalo aqui. El sobre se descuenta solo.
        {gastosCount < 3 && ` Llevas ${gastosCount} de 3 para desbloquear mas.`}
      </p>
      <div className="flex gap-1 mb-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i < gastosCount ? "#fff" : "rgba(255,255,255,.3)" }} />
        ))}
      </div>
      <button onClick={onAvanzar} className="text-xs font-semibold underline" style={{ color: "rgba(255,255,255,.75)" }}>
        Ya se como funciona, avanzar
      </button>
    </div>
  );
}

/* ============================================================
   Componentes
   ============================================================ */

function SobreCard({ sobre, gastado }) {
  const { money, catLabel, catColor } = useCuenta();
  const presup = Number(sobre.aportacion_semanal);
  const catDef = sobre.categoria_default;
  const disponible = Number(sobre.saldo_acumulado) + presup - gastado;
  const pct = presup > 0 ? Math.max(0, Math.min(1, disponible / presup)) : 0;
  const estado = disponible < 0 ? "rojo" : pct <= 0.25 ? "ambar" : "verde";
  const colorVar = estado === "rojo" ? "var(--red)" : estado === "ambar" ? "var(--amber)" : "var(--green)";
  const cc = catColor[catDef] || "#666";
  return (
    <div className="sobre-card">
      <div className="sobre-flap" />
      <div className="px-3 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{sobre.emoji}</span>
          <span className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>{sobre.nombre}</span>
        </div>
        <div className="mt-2 num text-xl font-semibold" style={{ color: colorVar }}>{money(disponible)}</div>
        <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
          de {money(presup)}/sem{disponible < 0 ? " · te pasaste" : ""}{sobre.tipo_cierre === "acumula" ? " · acumula" : ""}
        </div>
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
          <div className="h-full rounded-full" style={{ width: `${Math.max(0, pct) * 100}%`, background: colorVar, transition: "width .3s" }} />
        </div>
        <div className="mt-1.5">
          <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: cc + "18", color: cc }}>
            {catLabel[catDef]}
          </span>
        </div>
      </div>
    </div>
  );
}

function GastoForm({ sobres, tarjetas, viewedWS, isCurrent, onAdd, onEdit, onClose, prefill, editingId }) {
  const { money, fmtDia, categorias, catLabel, catColor } = useCuenta();
  const isEdit = !!editingId;
  const hoy = toStr(new Date());
  const gastables = sobres.filter((s) => !s.es_ahorro);
  const catDef = (s) => s.categoria_default;
  const [monto, setMonto] = useState(prefill?.monto ? String(prefill.monto) : "");
  const [sobreId, setSobreId] = useState(prefill?.fuera ? "" : prefill?.sobre_id || (isEdit ? "" : gastables[0]?.id || ""));
  const [fueraDeSobres, setFueraDeSobres] = useState(prefill?.fuera || (isEdit && !prefill?.sobre_id));
  const [medio, setMedio] = useState(prefill?.medio_pago || "efectivo");
  const [tarjetaId, setTarjetaId] = useState(prefill?.tarjeta_id || "");
  const [categoria, setCategoria] = useState(prefill?.categoria || (gastables[0] ? catDef(gastables[0]) : categorias[0]?.nombre || "casa"));
  const [nota, setNota] = useState(prefill?.nota || "");
  const [fecha, setFecha] = useState(prefill?.fecha || (isCurrent ? hoy : viewedWS));
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const dias = [];
  for (let i = 0; i < 7; i++) { const d = toStr(addDays(fromStr(viewedWS), i)); if (isCurrent && d > hoy) break; dias.push(d); }
  if (isEdit && prefill?.fecha && !dias.includes(prefill.fecha)) dias.push(prefill.fecha);

  const tarjetasActivas = (tarjetas || []).filter((t) => t.activo);

  const seleccionarSobre = (id) => { setSobreId(id); setFueraDeSobres(false); const s = sobres.find((x) => x.id === id); if (s && !isEdit) setCategoria(catDef(s)); };
  const marcarFuera = () => { setFueraDeSobres(true); setSobreId(""); if (!isEdit) setCategoria(categorias[0]?.nombre || "casa"); };

  const submit = async () => {
    const m = parseFloat(monto);
    if (!m || m <= 0) return setError("Pon un monto valido.");
    if (!fueraDeSobres && !sobreId) return setError("Elige un sobre o marca 'Fuera de sobres'.");
    if (medio === "credito" && !tarjetaId && tarjetasActivas.length > 0) return setError("Elige la tarjeta.");
    setGuardando(true); setError("");
    try {
      const data = { fecha, monto: m, sobre_id: fueraDeSobres ? null : sobreId, medio_pago: medio, tarjeta_id: medio === "credito" && tarjetaId ? tarjetaId : null, categoria, nota: nota.trim() };
      if (isEdit) await onEdit(editingId, data);
      else await onAdd(data);
      onClose();
    } catch (err) { setError(err.message || "Error al guardar."); setGuardando(false); }
  };

  return (
    <div className={`fixed inset-0 z-30 flex items-end justify-center md3-sheet-backdrop`} onClick={onClose}>
      <div className={`w-full max-w-md p-4 pb-6 overflow-y-auto md3-sheet`} style={{ background: "var(--card)", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="md3-drag-handle" />
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold" style={{ color: "var(--ink)" }}>{isEdit ? "Modificar gasto" : "Registrar gasto"}</h2>
          <button className="text-sm px-2 py-1" style={{ color: "var(--ink-soft)" }} onClick={onClose}>Cerrar</button>
        </div>
        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Cuanto?</label>
        <input type="number" inputMode="decimal" placeholder="0.00" value={monto} autoFocus onChange={(e) => setMonto(e.target.value)}
          className="w-full num text-2xl font-semibold rounded-xl px-3 py-2 mb-3 outline-none"
          style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--paper)" }} />

        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>De que sobre sale?</label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {gastables.map((s) => (
            <button key={s.id} onClick={() => seleccionarSobre(s.id)} className="chip"
              style={!fueraDeSobres && sobreId === s.id ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : {}}>
              {s.emoji} {s.nombre}
            </button>
          ))}
          {sobres.filter((s) => s.es_ahorro).map((s) => (
            <button key={s.id} onClick={() => seleccionarSobre(s.id)} className="chip"
              style={!fueraDeSobres && sobreId === s.id ? { background: "var(--green)", color: "#fff", borderColor: "var(--green)" } : {}}>
              🐷 {s.nombre}
            </button>
          ))}
          <button onClick={marcarFuera} className="chip" style={fueraDeSobres ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : {}}>
            🚫 Fuera de sobres
          </button>
        </div>

        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Categoria</label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {categorias.map((c) => (
            <button key={c.nombre} onClick={() => setCategoria(c.nombre)} className="chip"
              style={categoria === c.nombre ? { background: c.color, color: "#fff", borderColor: c.color } : {}}>
              {c.label}
            </button>
          ))}
        </div>

        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Medio de pago</label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {MEDIOS.map((m) => (
            <button key={m} onClick={() => { setMedio(m); if (m !== "credito") setTarjetaId(""); }} className="chip"
              style={medio === m ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : {}}>
              {MEDIOS_LABEL[m]}
            </button>
          ))}
        </div>

        {medio === "credito" && tarjetasActivas.length > 0 && (
          <>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Tarjeta</label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tarjetasActivas.map((t) => (
                <button key={t.id} onClick={() => setTarjetaId(t.id)} className="chip"
                  style={tarjetaId === t.id ? { background: "var(--red)", color: "#fff", borderColor: "var(--red)" } : {}}>
                  💳 {t.nombre}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Dia</label>
            <select value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--paper)" }}>
              {dias.map((dd) => <option key={dd} value={dd}>{fmtDia(dd)}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Nota (opcional)</label>
            <input type="text" placeholder="Walmart, tacos..." value={nota} onChange={(e) => setNota(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--paper)" }} />
          </div>
        </div>
        {error && <div className="text-xs mb-2" style={{ color: "var(--red)" }}>{error}</div>}
        <button onClick={submit} disabled={guardando} className={`w-full py-3 font-bold text-sm md3-btn-filled`}
          style={{ background: "var(--green)", color: "#fff", opacity: guardando ? 0.6 : 1 }}>
          {guardando ? "Guardando..." : isEdit ? "Guardar cambios" : "Guardar gasto"}
        </button>
      </div>
    </div>
  );
}


/* ---------- Modal para configurar saldos iniciales ---------- */
function ConfigSaldosModal({ sobres, onSave, onClose }) {
  const todos = [...sobres.filter((s) => !s.es_ahorro), ...sobres.filter((s) => s.es_ahorro)];
  const [saldos, setSaldos] = useState(
    Object.fromEntries(todos.map((s) => [s.id, String(s.saldo_acumulado || 0)]))
  );
  const [guardando, setGuardando] = useState(false);

  const submit = async () => {
    setGuardando(true);
    const updates = Object.entries(saldos).map(([id, val]) => ({ id, saldo_acumulado: parseFloat(val) || 0 }));
    try { await onSave(updates); onClose(); }
    catch { setGuardando(false); }
  };

  return (
    <div className={`fixed inset-0 z-30 flex items-end justify-center md3-sheet-backdrop`} onClick={onClose}>
      <div className={`w-full max-w-md p-4 pb-6 overflow-y-auto md3-sheet`} style={{ background: "var(--card)", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="md3-drag-handle" />
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold" style={{ color: "var(--ink)" }}>Configurar saldos</h2>
          <button className="text-sm px-2 py-1" style={{ color: "var(--ink-soft)" }} onClick={onClose}>Cerrar</button>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--ink-soft)" }}>
          Pon el saldo actual de cada sobre. De aqui en adelante el sistema los actualiza solo.
        </p>
        {todos.map((s) => (
          <div key={s.id} className="flex items-center gap-2 mb-2.5">
            <span className="text-lg">{s.emoji}</span>
            <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>
              {s.nombre}{s.es_ahorro ? " (Ahorro)" : ""}
            </span>
            <span className="text-sm" style={{ color: "var(--ink-soft)" }}>$</span>
            <input type="number" inputMode="decimal" value={saldos[s.id]} onChange={(e) => setSaldos({ ...saldos, [s.id]: e.target.value })}
              className="w-24 num text-sm font-semibold rounded-xl px-2 py-1.5 text-right outline-none"
              style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--paper)" }} />
          </div>
        ))}
        <button onClick={submit} disabled={guardando} className={`w-full py-3 font-bold text-sm mt-3 md3-btn-filled`}
          style={{ background: "var(--green)", color: "#fff", opacity: guardando ? 0.6 : 1 }}>
          {guardando ? "Guardando..." : "Guardar saldos"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Tab Semana (F2 completo) ---------- */
function TabSemana({ sobres, gastos, cierres, pagos, tarjetas, msi, presupSemanal, offset, setOffset, onAdd, onDelete, onEditGasto, onPagar, onPosponer, onPagarTarjeta }) {
  const { money, weekStartOf, weekOf, weekLabel, fmtDia, categorias, catLabel, catColor } = useCuenta();
  const [showForm, setShowForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [editingGasto, setEditingGasto] = useState(null);
  const [filtro, setFiltro] = useState("todos");

  const hoy = new Date();
  const viewedWS = toStr(addDays(weekStartOf(hoy), offset * 7));
  const isCurrent = offset === 0;
  const cierre = cierres.find((c) => c.semana === viewedWS);
  const gastables = sobres.filter((s) => !s.es_ahorro);

  const gastosSemana = gastos
    .filter((g) => weekOf(g.fecha) === viewedWS)
    .sort((a, b) => (a.fecha === b.fecha ? new Date(b.creado_en) - new Date(a.creado_en) : a.fecha < b.fecha ? 1 : -1));

  const gastosFiltrados = gastosSemana.filter((g) => {
    if (filtro === "sobres") return g.sobre_id != null;
    if (filtro === "fuera") return g.sobre_id == null;
    return true;
  });

  const gastadoPor = (id) => gastosSemana.filter((g) => g.sobre_id === id).reduce((a, g) => a + Number(g.monto), 0);
  const gastadoTotal = gastosSemana.filter((g) => g.sobre_id).reduce((a, g) => a + Number(g.monto), 0);
  const gastadoFuera = gastosSemana.filter((g) => !g.sobre_id).reduce((a, g) => a + Number(g.monto), 0);
  const restanteTotal = presupSemanal - gastadoTotal;

  const porDia = gastosFiltrados.reduce((acc, g) => { (acc[g.fecha] = acc[g.fecha] || []).push(g); return acc; }, {});
  const sobreDe = (id) => sobres.find((s) => s.id === id);
  const tarjetaDe = (id) => (tarjetas || []).find((t) => t.id === id);
  const pagosProximos = isCurrent ? getPagosProximos(pagos, gastos, weekStartOf, weekOf) : [];
  const tarjetasProximas = isCurrent ? getTarjetaRecordatorios(tarjetas || [], pagos, gastos) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button className="nav-arrow" onClick={() => setOffset(offset - 1)}>‹</button>
        <div className="text-center">
          <div className="text-sm font-bold" style={{ color: "var(--ink)" }}>{weekLabel(viewedWS)}</div>
          <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
            {isCurrent ? "Semana actual" : cierre ? "Semana cerrada" : "Semana pasada"}
          </div>
        </div>
        <button className="nav-arrow" onClick={() => setOffset(Math.min(0, offset + 1))} style={offset === 0 ? { opacity: 0.25 } : {}}>›</button>
      </div>

      {/* Resumen con desglose por categoria */}
      <div className="rounded-2xl p-4 mb-3" style={{ background: "var(--accent)" }}>
        <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,.65)" }}>
          {isCurrent ? "Te queda esta semana" : "Quedo esta semana"}
        </div>
        <div className="num text-3xl font-bold" style={{ color: restanteTotal < 0 ? "#FFB4A0" : "#fff" }}>{money(restanteTotal)}</div>
        <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,.65)" }}>
          Sobres: {money(gastadoTotal)} de {money(presupSemanal)}{gastadoFuera > 0 ? ` · Fuera: ${money(gastadoFuera)}` : ""} · {gastosSemana.length} gasto{gastosSemana.length === 1 ? "" : "s"}
        </div>
        {gastadoTotal > 0 && (
          <>
            <div className="flex gap-0.5 mt-2 h-2 rounded-full overflow-hidden">
              {categorias.map((c) => {
                const m = gastosSemana.filter((g) => g.categoria === c.nombre).reduce((a, g) => a + Number(g.monto), 0);
                if (!m) return null;
                return <div key={c.nombre} style={{ width: `${(m / gastadoTotal) * 100}%`, background: c.color }} />;
              })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
              {categorias.map((c) => {
                const m = gastosSemana.filter((g) => g.categoria === c.nombre).reduce((a, g) => a + Number(g.monto), 0);
                if (!m) return null;
                return (
                  <span key={c.nombre} className="text-[10px]" style={{ color: "rgba(255,255,255,.75)" }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full mr-0.5 align-middle" style={{ background: c.color }} />
                    {c.label} {money(m)}
                  </span>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Recordatorios de tarjetas */}
      {tarjetasProximas.map((t) => {
        const est = calcEstimadoTarjeta(t, gastos, msi, pagos);
        return (
          <div key={t.id} className="rounded-xl px-3 py-2.5 mb-2 flex items-center gap-2" style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}>
            <span className="text-lg">💳</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Pago {t.nombre}</div>
              <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
                Dia {t.dia_pago}{est && est.total > 0 ? ` · MSI: ${money(est.total)}` : ""}
              </div>
            </div>
            <button onClick={() => onPagarTarjeta(t, est)} className="text-xs font-bold px-2.5 py-1.5 rounded-lg" style={{ background: "var(--green)", color: "#fff" }}>Ya pague</button>
          </div>
        );
      })}

      {/* Recordatorios de pagos regulares */}
      {pagosProximos.map((p) => (
        <div key={p.id} className="rounded-xl px-3 py-2.5 mb-2 flex items-center gap-2" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
          <span className="text-lg">🔔</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{p.nombre}</div>
            <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
              {money(Number(p.monto_estimado))} · {FREQ_LABEL[p.frecuencia] || "Mensual"}{p._diaProximo != null ? ` · dia ${p._diaProximo}` : ""}
            </div>
          </div>
          <button onClick={() => onPagar(p)} className="text-xs font-bold px-2.5 py-1.5 rounded-lg" style={{ background: "var(--green)", color: "#fff" }}>Ya pague</button>
          <button onClick={() => onPosponer(p.id)} className="text-xs font-semibold px-2 py-1.5 rounded-lg" style={{ color: "var(--ink-soft)", border: "1px solid var(--line)" }}>Luego</button>
        </div>
      ))}

      {cierre && (
        <div className="rounded-xl px-3 py-2 mb-3 text-sm font-semibold" style={{ background: "#E7F3EC", color: "var(--green)" }}>
          💰 {money(cierre.total_a_ahorro)} pasaron al Ahorro al cerrar
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-4">
        {gastables.map((s) => {
          const d = cierre && cierre.detalle.find((x) => x.sobre_id === s.id);
          const sobreVista = d && d.saldo_inicio != null ? { ...s, saldo_acumulado: d.saldo_inicio } : s;
          return <SobreCard key={s.id} sobre={sobreVista} gastado={gastadoPor(s.id)} />;
        })}
        {sobres.filter((s) => s.es_ahorro).map((s) => {
          const ahorroDisp = Number(s.saldo_acumulado) + Number(s.aportacion_semanal) - gastadoPor(s.id);
          return (
          <div key={s.id} className="sobre-card col-span-2">
            <div className="sobre-flap" style={{ background: "var(--green)" }} />
            <div className="px-3 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🐷</span>
                <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{s.nombre}</span>
              </div>
              <div className="mt-2 num text-xl font-semibold" style={{ color: ahorroDisp < 0 ? "var(--red)" : "var(--green)" }}>{money(ahorroDisp)}</div>
              <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
                +{money(Number(s.aportacion_semanal))}/sem · gastado: {money(gastadoPor(s.id))}
              </div>
            </div>
          </div>
          );
        })}
      </div>

      <button onClick={() => setShowForm(true)} className="md3-fab">
        <Plus size={24} />
      </button>

      {/* Libreta con filtro */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>Libreta de la semana</h3>
        <div className="flex gap-1">
          {[["todos", "Todos"], ["sobres", "Sobres"], ["fuera", "Fuera"]].map(([v, l]) => (
            <button key={v} onClick={() => setFiltro(v)} className="text-[10px] font-semibold px-2 py-1 rounded-full"
              style={filtro === v ? { background: "var(--accent)", color: "#fff" } : { background: "var(--line)", color: "var(--ink)" }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {gastosFiltrados.length === 0 && (
        <div className="text-sm py-6 text-center" style={{ color: "var(--ink-soft)" }}>
          Sin gastos{filtro !== "todos" ? " en este filtro" : " registrados"}.{isCurrent && filtro === "todos" ? " Registra el primero arriba." : ""}
        </div>
      )}
      {Object.keys(porDia).map((dia) => (
        <div key={dia} className="mb-3">
          <div className="text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>{fmtDia(dia)}</div>
          {porDia[dia].map((g) => {
            const s = sobreDe(g.sobre_id);
            const tc = tarjetaDe(g.tarjeta_id);
            const cc = catColor[g.categoria] || "#666";
            return (
              <div key={g.id} className="flex items-center gap-2 px-3 py-2 mb-1 md3-card" style={{ borderRadius: "16px" }}>
                <span>{s ? s.emoji : "🚫"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>{g.nota || (s ? s.nombre : "Fuera de sobres")}</span>
                    <span className="inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: cc + "18", color: cc }}>
                      {catLabel[g.categoria]}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
                    {s ? s.nombre + " · " : "Fuera · "}{MEDIOS_LABEL[g.medio_pago]}
                    {tc ? ` · 💳 ${tc.nombre}` : ""}
                  </div>
                </div>
                <div className="num text-sm font-semibold" style={{ color: "var(--ink)" }}>{money(Number(g.monto))}</div>
                <button className="text-xs px-1 py-1" style={{ color: "var(--ink-soft)" }} onClick={() => setEditingGasto(g)}>✎</button>
                {pendingDelete === g.id ? (
                  <button className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: "var(--red)", color: "#fff" }}
                    onClick={() => { onDelete(g.id); setPendingDelete(null); }}>Borrar?</button>
                ) : (
                  <button className="text-xs px-1 py-1" style={{ color: "var(--ink-soft)" }} onClick={() => setPendingDelete(g.id)}>✕</button>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {showForm && <GastoForm sobres={sobres} tarjetas={tarjetas} viewedWS={viewedWS} isCurrent={isCurrent} onAdd={onAdd} onClose={() => setShowForm(false)} />}
      {editingGasto && <GastoForm
        sobres={sobres} tarjetas={tarjetas} viewedWS={viewedWS} isCurrent={isCurrent}
        onEdit={onEditGasto} onClose={() => setEditingGasto(null)}
        editingId={editingGasto.id}
        prefill={{ monto: editingGasto.monto, sobre_id: editingGasto.sobre_id, fuera: !editingGasto.sobre_id, medio_pago: editingGasto.medio_pago, tarjeta_id: editingGasto.tarjeta_id, categoria: editingGasto.categoria, nota: editingGasto.nota || "", fecha: editingGasto.fecha }}
      />}
    </div>
  );
}

/* ---------- Tab Sobres ---------- */
function TabSobres({ sobres, gastos, cierres, presupSemanal, onSaveSobre, onDeleteSobre, onSavePresup, onConfigSaldos }) {
  const { money, weekOf, weekLabel, fmtDia, categorias, catLabel, catColor } = useCuenta();
  const [editing, setEditing] = useState(null);
  const [nombre, setNombre] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [aportacion, setAportacion] = useState("");
  const [tipoCierre, setTipoCierre] = useState("ahorro");
  const [catDefault, setCatDefault] = useState(null);
  const [saldoInicial, setSaldoInicial] = useState("0");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [msg, setMsg] = useState("");
  const [editPresup, setEditPresup] = useState(false);
  const [tempPresup, setTempPresup] = useState(String(presupSemanal));
  const [showConfig, setShowConfig] = useState(false);

  const gastables = sobres.filter((s) => !s.es_ahorro);
  const sumaSobres = sobres.reduce((a, s) => a + Number(s.aportacion_semanal), 0);

  const startEdit = (s) => { setEditing(s.id); setNombre(s.nombre); setEmoji(s.emoji); setAportacion(String(s.aportacion_semanal)); setTipoCierre(s.tipo_cierre); setCatDefault(s.categoria_default); setMsg(""); };
  const startNew = () => { setEditing("nuevo"); setNombre(""); setEmoji(EMOJIS[0]); setAportacion(""); setTipoCierre("ahorro"); setCatDefault(categorias[0]?.nombre || "casa"); setSaldoInicial("0"); setMsg(""); };
  const cancel = () => setEditing(null);

  const save = async () => {
    const p = parseFloat(aportacion);
    if (!nombre.trim()) return setMsg("Ponle nombre al sobre.");
    if (isNaN(p) || p < 0) return setMsg("Aportacion invalida.");
    try {
      const payload = { id: editing === "nuevo" ? undefined : editing, nombre: nombre.trim(), emoji, aportacion_semanal: p, tipo_cierre: tipoCierre, categoria_default: catDefault };
      if (editing === "nuevo") payload.saldo_inicial = parseFloat(saldoInicial) || 0;
      await onSaveSobre(payload);
      setEditing(null);
    } catch (err) { setMsg(err.message || "Error al guardar."); }
  };

  const tryDelete = async (id) => {
    const tieneGastos = gastos.some((g) => g.sobre_id === id);
    if (tieneGastos) { setMsg("Ese sobre tiene gastos registrados; no se puede eliminar."); setPendingDelete(null); return; }
    if (pendingDelete !== id) { setPendingDelete(id); return; }
    try { await onDeleteSobre(id); setPendingDelete(null); } catch (err) { setMsg(err.message || "Error al eliminar."); }
  };

  const guardarPresup = async () => { const v = parseFloat(tempPresup); if (isNaN(v) || v <= 0) return; await onSavePresup(v); setEditPresup(false); };

  const formRow = (
    <div className="rounded-xl p-3 mb-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
      <div className="flex flex-wrap gap-1 mb-2">
        {EMOJIS.map((e) => (
          <button key={e} onClick={() => setEmoji(e)} className="text-lg px-1.5 py-0.5 rounded-lg" style={emoji === e ? { background: "var(--line)" } : {}}>{e}</button>
        ))}
      </div>
      <div className="flex gap-2 mb-2">
        <input type="text" placeholder="Nombre del sobre" value={nombre} onChange={(e) => setNombre(e.target.value)}
          className="flex-1 rounded-xl px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }} />
        <input type="number" inputMode="decimal" placeholder="$/sem" value={aportacion} onChange={(e) => setAportacion(e.target.value)}
          className="w-24 num rounded-xl px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }} />
      </div>
      <div className="flex gap-2 mb-2">
        <select value={tipoCierre} onChange={(e) => setTipoCierre(e.target.value)} className="flex-1 rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--paper)" }}>
          <option value="ahorro">Ahorro (reinicia)</option>
          <option value="acumula">Acumula (arrastra)</option>
        </select>
        <select value={catDefault} onChange={(e) => setCatDefault(e.target.value)} className="flex-1 rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--paper)" }}>
          {categorias.map((c) => <option key={c.nombre} value={c.nombre}>{c.label}</option>)}
        </select>
      </div>
      {editing === "nuevo" && (
        <div className="mb-2">
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Saldo inicial</label>
          <input type="number" inputMode="decimal" placeholder="0" value={saldoInicial} onChange={(e) => setSaldoInicial(e.target.value)}
            className="w-full num rounded-xl px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }} />
        </div>
      )}
      {msg && <div className="text-xs mb-2" style={{ color: "var(--red)" }}>{msg}</div>}
      <div className="flex gap-2">
        <button onClick={save} className="flex-1 rounded-xl py-2 text-sm font-bold" style={{ background: "var(--green)", color: "#fff" }}>Guardar</button>
        <button onClick={cancel} className="px-4 rounded-xl py-2 text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>Cancelar</button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="rounded-xl px-3 py-3 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold" style={{ color: "var(--ink-soft)" }}>Presupuesto semanal</div>
            {editPresup ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm" style={{ color: "var(--ink)" }}>$</span>
                <input type="number" inputMode="decimal" value={tempPresup} onChange={(e) => setTempPresup(e.target.value)} autoFocus
                  className="num text-lg font-bold w-28 rounded-lg px-2 py-1 outline-none" style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--paper)" }} />
                <button onClick={guardarPresup} className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: "var(--green)", color: "#fff" }}>OK</button>
                <button onClick={() => setEditPresup(false)} className="text-xs px-2 py-1" style={{ color: "var(--ink-soft)" }}>✕</button>
              </div>
            ) : (
              <div className="num text-xl font-bold" style={{ color: "var(--ink)" }}>{money(presupSemanal)}</div>
            )}
          </div>
          {!editPresup && (
            <button onClick={() => { setTempPresup(String(presupSemanal)); setEditPresup(true); }} className="text-xs font-semibold px-2 py-1" style={{ color: "var(--ink-soft)" }}>Editar</button>
          )}
        </div>
        <div className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>Suma de sobres: <span className="num font-semibold">{money(sumaSobres)}</span></div>
      </div>

      <button onClick={() => setShowConfig(true)} className="w-full rounded-xl py-2 text-sm font-semibold mb-3"
        style={{ color: "var(--ink)", border: "1px solid var(--line)", background: "var(--card)" }}>
        Configurar saldos actuales
      </button>

      <h2 className="text-base font-bold mb-3" style={{ color: "var(--ink)" }}>Mis sobres</h2>
      {msg && editing === null && <div className="text-xs mb-2 rounded-xl px-3 py-2" style={{ background: "#FBEAE5", color: "var(--red)" }}>{msg}</div>}

      {gastables.map((s) => editing === s.id ? <div key={s.id}>{formRow}</div> : (
        <div key={s.id} className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <span className="text-lg">{s.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>{s.nombre}</span>
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: (catColor[s.categoria_default] || "#666") + "18", color: catColor[s.categoria_default] || "#666" }}>{catLabel[s.categoria_default]}</span>
            </div>
            <div className="text-xs num" style={{ color: "var(--ink-soft)" }}>{money(Number(s.aportacion_semanal))} / sem · {s.tipo_cierre === "acumula" ? "acumula" : "ahorro"}</div>
          </div>
          <button className="text-xs font-semibold px-2 py-1" style={{ color: "var(--ink-soft)" }} onClick={() => startEdit(s)}>Editar</button>
          <button className="text-xs px-2 py-1 rounded-lg font-semibold" style={pendingDelete === s.id ? { background: "var(--red)", color: "#fff" } : { color: "var(--ink-soft)" }} onClick={() => tryDelete(s.id)}>
            {pendingDelete === s.id ? "Seguro?" : "✕"}
          </button>
        </div>
      ))}

      {editing === "nuevo" ? formRow : (
        <button onClick={startNew} className="w-full rounded-xl py-2.5 text-sm font-bold mt-1" style={{ background: "color-mix(in srgb, var(--green) 10%, transparent)", color: "var(--green)", borderRadius: "20px" }}>+ Agregar sobre</button>
      )}
      <p className="text-xs mt-4 mb-6 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        🐷 El sobre Ahorro recibe automaticamente lo que sobra de los sobres tipo "ahorro". Los tipo "acumula" arrastran su saldo.
      </p>

      {/* Seccion Ahorro */}
      {(() => {
        const sobreAhorro = sobres.find((s) => s.es_ahorro);
        const saldoAhorro = sobreAhorro ? Number(sobreAhorro.saldo_acumulado) : 0;
        const retiros = sobreAhorro ? gastos.filter((g) => g.sobre_id === sobreAhorro.id).sort((a, b) => a.fecha < b.fecha ? 1 : -1) : [];
        const cierresOrden = [...(cierres || [])].sort((a, b) => (a.semana < b.semana ? 1 : -1));
        return (
          <>
            <div className="rounded-2xl p-4 mb-3 text-center" style={{ background: "var(--green)" }}>
              <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,.75)" }}>🐷 Ahorro acumulado</div>
              <div className="num text-3xl font-bold text-white mt-1">{money(saldoAhorro)}</div>
              <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,.75)" }}>
                {cierresOrden.length} semana{cierresOrden.length === 1 ? "" : "s"} cerrada{cierresOrden.length === 1 ? "" : "s"}
                {sobreAhorro ? ` · +${money(Number(sobreAhorro.aportacion_semanal))}/sem` : ""}
              </div>
            </div>
            {retiros.length > 0 && (
              <div className="mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--ink-soft)" }}>Gastos desde ahorro</h3>
                {retiros.map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded-xl px-3 py-2 mb-1" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--ink)" }}>{g.nota || "Gasto"}</div>
                      <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{fmtDia(g.fecha)}</div>
                    </div>
                    <div className="num text-sm font-semibold" style={{ color: "var(--red)" }}>-{money(Number(g.monto))}</div>
                  </div>
                ))}
              </div>
            )}
            {cierresOrden.length === 0 && retiros.length === 0 && (
              <div className="text-sm text-center py-4 mb-3" style={{ color: "var(--ink-soft)" }}>
                Cuando termine el viernes, lo que sobre caera al ahorro.
              </div>
            )}
            {cierresOrden.map((c) => {
              const detalle = Array.isArray(c.detalle) ? c.detalle : [];
              return (
                <div key={c.semana} className="rounded-xl mb-2 overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{weekLabel(c.semana)}</span>
                    <span className="num text-sm font-bold" style={{ color: "var(--green)" }}>+{money(Number(c.total_a_ahorro))}</span>
                  </div>
                </div>
              );
            })}
          </>
        );
      })()}

      {showConfig && <ConfigSaldosModal sobres={sobres} onSave={onConfigSaldos} onClose={() => setShowConfig(false)} />}
    </div>
  );
}

/* ---------- Tab Libreta ---------- */
function TabLibreta({ sobres, gastos, tarjetas, onEditGasto, onDelete }) {
  const { money, weekStartOf, weekOf, weekLabel, fmtDia, categorias, catLabel, catColor } = useCuenta();
  const [offsetLib, setOffsetLib] = useState(0);
  const [filtro, setFiltro] = useState("todos");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [editingGasto, setEditingGasto] = useState(null);

  const hoy = new Date();
  const viewedWS = toStr(addDays(weekStartOf(hoy), offsetLib * 7));
  const isCurrent = offsetLib === 0;

  const gastosSemana = gastos
    .filter((g) => weekOf(g.fecha) === viewedWS)
    .sort((a, b) => (a.fecha === b.fecha ? new Date(b.creado_en) - new Date(a.creado_en) : a.fecha < b.fecha ? 1 : -1));

  const gastosFiltrados = gastosSemana.filter((g) => {
    if (filtro === "sobres") return g.sobre_id != null;
    if (filtro === "fuera") return g.sobre_id == null;
    return true;
  });

  const porDia = gastosFiltrados.reduce((acc, g) => { (acc[g.fecha] = acc[g.fecha] || []).push(g); return acc; }, {});
  const sobreDe = (id) => sobres.find((s) => s.id === id);
  const tarjetaDe = (id) => (tarjetas || []).find((t) => t.id === id);
  const totalSemana = gastosSemana.reduce((a, g) => a + Number(g.monto), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button className="nav-arrow" onClick={() => setOffsetLib(offsetLib - 1)}>‹</button>
        <div className="text-center">
          <div className="text-sm font-bold" style={{ color: "var(--ink)" }}>{weekLabel(viewedWS)}</div>
          <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{isCurrent ? "Semana actual" : `Hace ${Math.abs(offsetLib)} semana${Math.abs(offsetLib) > 1 ? "s" : ""}`}</div>
        </div>
        <button className="nav-arrow" onClick={() => setOffsetLib(Math.min(0, offsetLib + 1))} style={offsetLib === 0 ? { opacity: 0.25 } : {}}>›</button>
      </div>

      <div className="rounded-xl p-3 mb-3 text-center" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <div className="text-xs" style={{ color: "var(--ink-soft)" }}>Total de la semana</div>
        <div className="num text-2xl font-bold" style={{ color: "var(--ink)" }}>{money(totalSemana)}</div>
        <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{gastosSemana.length} gasto{gastosSemana.length === 1 ? "" : "s"}</div>
      </div>

      {totalSemana > 0 && (
        <div className="rounded-xl p-3 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <div className="flex gap-0.5 h-2 rounded-full overflow-hidden mb-1.5">
            {categorias.map((c) => {
              const m = gastosSemana.filter((g) => g.categoria === c.nombre).reduce((a, g) => a + Number(g.monto), 0);
              if (!m) return null;
              return <div key={c.nombre} style={{ width: `${(m / totalSemana) * 100}%`, background: c.color }} />;
            })}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {categorias.map((c) => {
              const m = gastosSemana.filter((g) => g.categoria === c.nombre).reduce((a, g) => a + Number(g.monto), 0);
              if (!m) return null;
              return (
                <span key={c.nombre} className="text-[10px]" style={{ color: "var(--ink-soft)" }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-0.5 align-middle" style={{ background: c.color }} />
                  {c.label} {money(m)} ({Math.round((m / totalSemana) * 100)}%)
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>Gastos</h3>
        <div className="flex gap-1">
          {[["todos", "Todos"], ["sobres", "Sobres"], ["fuera", "Fuera"]].map(([v, l]) => (
            <button key={v} onClick={() => setFiltro(v)} className="text-[10px] font-semibold px-2 py-1 rounded-full"
              style={filtro === v ? { background: "var(--accent)", color: "#fff" } : { background: "var(--line)", color: "var(--ink)" }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {gastosFiltrados.length === 0 && (
        <div className="text-sm py-6 text-center" style={{ color: "var(--ink-soft)" }}>
          Sin gastos{filtro !== "todos" ? " en este filtro" : " esta semana"}.
        </div>
      )}
      {Object.keys(porDia).map((dia) => (
        <div key={dia} className="mb-3">
          <div className="text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>{fmtDia(dia)}</div>
          {porDia[dia].map((g) => {
            const s = sobreDe(g.sobre_id);
            const tc = tarjetaDe(g.tarjeta_id);
            const cc = catColor[g.categoria] || "#666";
            return (
              <div key={g.id} className="flex items-center gap-2 px-3 py-2 mb-1 md3-card" style={{ borderRadius: "16px" }}>
                <span>{s ? s.emoji : "🚫"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>{g.nota || (s ? s.nombre : "Fuera de sobres")}</span>
                    <span className="inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: cc + "18", color: cc }}>
                      {catLabel[g.categoria]}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
                    {s ? s.nombre + " · " : "Fuera · "}{MEDIOS_LABEL[g.medio_pago]}
                    {tc ? ` · 💳 ${tc.nombre}` : ""}
                  </div>
                </div>
                <div className="num text-sm font-semibold" style={{ color: "var(--ink)" }}>{money(Number(g.monto))}</div>
                <button className="text-xs px-1 py-1" style={{ color: "var(--ink-soft)" }} onClick={() => setEditingGasto(g)}>✎</button>
                {pendingDelete === g.id ? (
                  <button className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: "var(--red)", color: "#fff" }}
                    onClick={() => { onDelete(g.id); setPendingDelete(null); }}>Borrar?</button>
                ) : (
                  <button className="text-xs px-1 py-1" style={{ color: "var(--ink-soft)" }} onClick={() => setPendingDelete(g.id)}>✕</button>
                )}
              </div>
            );
          })}
        </div>
      ))}
      {editingGasto && <GastoForm
        sobres={sobres} tarjetas={tarjetas} viewedWS={weekOf(editingGasto.fecha)} isCurrent={weekOf(editingGasto.fecha) === toStr(weekStartOf(new Date()))}
        onEdit={onEditGasto} onClose={() => setEditingGasto(null)}
        editingId={editingGasto.id}
        prefill={{ monto: editingGasto.monto, sobre_id: editingGasto.sobre_id, fuera: !editingGasto.sobre_id, medio_pago: editingGasto.medio_pago, tarjeta_id: editingGasto.tarjeta_id, categoria: editingGasto.categoria, nota: editingGasto.nota || "", fecha: editingGasto.fecha }}
      />}
    </div>
  );
}

/* ---------- Tab Ahorro ---------- */
function TabAhorro({ sobres, cierres, gastos }) {
  const { money, weekLabel, fmtDia } = useCuenta();
  const [open, setOpen] = useState(null);
  const cierresOrden = [...cierres].sort((a, b) => (a.semana < b.semana ? 1 : -1));
  const sobreAhorro = sobres.find((s) => s.es_ahorro);
  const saldoAhorro = sobreAhorro ? Number(sobreAhorro.saldo_acumulado) : 0;
  const retiros = sobreAhorro ? gastos.filter((g) => g.sobre_id === sobreAhorro.id).sort((a, b) => a.fecha < b.fecha ? 1 : -1) : [];

  return (
    <div>
      <div className="rounded-2xl p-5 mb-4 text-center" style={{ background: "var(--green)" }}>
        <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,.75)" }}>🐷 Ahorro acumulado</div>
        <div className="num text-4xl font-bold text-white mt-1">{money(saldoAhorro)}</div>
        <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,.75)" }}>
          {cierresOrden.length} semana{cierresOrden.length === 1 ? "" : "s"} cerrada{cierresOrden.length === 1 ? "" : "s"}
          {sobreAhorro ? ` · +${money(Number(sobreAhorro.aportacion_semanal))}/sem` : ""}
        </div>
      </div>

      {retiros.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--ink-soft)" }}>Gastos desde ahorro</h3>
          {retiros.map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-xl px-3 py-2 mb-1" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
              <div>
                <div className="text-sm font-medium" style={{ color: "var(--ink)" }}>{g.nota || "Gasto"}</div>
                <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{fmtDia(g.fecha)}</div>
              </div>
              <div className="num text-sm font-semibold" style={{ color: "var(--red)" }}>-{money(Number(g.monto))}</div>
            </div>
          ))}
        </div>
      )}

      {cierresOrden.length === 0 && retiros.length === 0 && <div className="text-sm text-center py-6 leading-relaxed" style={{ color: "var(--ink-soft)" }}>Aun no hay semanas cerradas.<br />Cuando termine el viernes, lo que sobre caera aqui solito.</div>}
      {cierresOrden.map((c) => {
        const detalle = Array.isArray(c.detalle) ? c.detalle : [];
        return (
          <div key={c.semana} className="rounded-xl mb-2 overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <button className="w-full flex items-center justify-between px-3 py-2.5" onClick={() => setOpen(open === c.semana ? null : c.semana)}>
              <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{weekLabel(c.semana)}</span>
              <span className="num text-sm font-bold" style={{ color: "var(--green)" }}>+{money(Number(c.total_a_ahorro))}</span>
            </button>
            {open === c.semana && (
              <div className="px-3 pb-3">
                {detalle.map((d, i) => (
                  <div key={d.sobre_id || i} className="flex items-center justify-between text-xs py-1" style={{ color: "var(--ink-soft)" }}>
                    <span>{d.emoji} {d.nombre} — gasto {money(d.gastado)} de {money(d.aportacion || d.presupuesto)}{d.tipo_cierre === "acumula" ? " (acumula)" : ""}</span>
                    <span className="num font-semibold" style={{ color: d.sobrante > 0 ? "var(--green)" : "var(--ink-soft)" }}>+{money(d.sobrante)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Tab Pagos (F3 + F4 + Tarjetas) ---------- */
function TabPagos({ pagos, sobres, msi, tarjetas, gastos, onSavePago, onDeletePago, onPagar, onSaveMSI, onDeleteMSI, onSaveTarjeta, onDeleteTarjeta, onPagarTarjeta }) {
  const { money, categorias, catLabel, catColor } = useCuenta();
  const [editing, setEditing] = useState(null);
  const [nombre, setNombre] = useState(""); const [monto, setMonto] = useState(""); const [diaPago, setDiaPago] = useState(""); const [diaPago2, setDiaPago2] = useState("");
  const [frecuencia, setFrecuencia] = useState("mensual"); const [medio, setMedio] = useState("debito");
  const [pagoTarjetaId, setPagoTarjetaId] = useState("");
  const [sobreId, setSobreId] = useState(""); const [categoria, setCategoria] = useState(null);
  const [msg, setMsg] = useState(""); const [pendingDel, setPendingDel] = useState(null);

  const [editMSI, setEditMSI] = useState(null);
  const [msiConcepto, setMsiConcepto] = useState(""); const [msiMonto, setMsiMonto] = useState(""); const [msiTarjetaId, setMsiTarjetaId] = useState("");
  const [msiMeses, setMsiMeses] = useState(""); const [msiFecha, setMsiFecha] = useState(""); const [msiPrimer, setMsiPrimer] = useState("");
  const [msiMsg, setMsiMsg] = useState("");

  const [editTarjeta, setEditTarjeta] = useState(null);
  const [tNombre, setTNombre] = useState(""); const [tBanco, setTBanco] = useState("");
  const [tUltimos4, setTUltimos4] = useState(""); const [tDiaCorte, setTDiaCorte] = useState("");
  const [tDiaPago, setTDiaPago] = useState(""); const [tMsg, setTMsg] = useState("");

  const gastables = sobres.filter((s) => !s.es_ahorro);
  const pagosActivos = pagos.filter((p) => p.activo);
  const tarjetasActivas = (tarjetas || []).filter((t) => t.activo);
  const msiActivos = msi.filter((m) => m.activo);
  const tarjetaPagadaEsteMes = (tarjetaId) => {
    const t = tarjetasActivas.find((x) => x.id === tarjetaId);
    if (!t) return false;
    const hoy = new Date();
    const notaPago = `Pago ${t.nombre}`;
    return gastos.some((g) => g.nota === notaPago && fromStr(g.fecha).getMonth() === hoy.getMonth() && fromStr(g.fecha).getFullYear() === hoy.getFullYear());
  };
  const cargaMSI = msiActivos.reduce((a, m) => { const s = calcMSI(m, tarjetaPagadaEsteMes(m.tarjeta_id)); return s.estatus === "activo" ? a + s.mensual : a; }, 0);
  const msiDeTarjeta = (tarjetaId) => { const pagado = tarjetaPagadaEsteMes(tarjetaId); return msiActivos.filter((m) => m.tarjeta_id === tarjetaId).reduce((a, m) => { const s = calcMSI(m, pagado); return s.estatus === "activo" ? a + s.mensual : a; }, 0); };
  const montoReal = (p) => p.categoria === "tarjetas" && p.tarjeta_id ? msiDeTarjeta(p.tarjeta_id) : Number(p.monto_estimado);
  const totalMensual = pagosActivos.reduce((a, p) => a + montoReal(p) * (p.frecuencia === "semanal" ? 4 : p.frecuencia === "quincenal" ? 2 : 1), 0);

  const startEditPago = (p) => { setEditing(p.id); setNombre(p.nombre); setMonto(String(p.monto_estimado)); setDiaPago(p.dia_pago != null ? String(p.dia_pago) : ""); setDiaPago2(p.dia_pago_2 != null ? String(p.dia_pago_2) : ""); setFrecuencia(p.frecuencia || "mensual"); setMedio(p.medio_pago || "debito"); setPagoTarjetaId(p.tarjeta_id || ""); setSobreId(p.destino_sobre_id || ""); setCategoria(p.categoria); setMsg(""); };
  const startNewPago = () => { setEditing("nuevo"); setNombre(""); setMonto(""); setDiaPago(""); setDiaPago2(""); setFrecuencia("mensual"); setMedio("debito"); setPagoTarjetaId(""); setSobreId(""); setCategoria(categorias[0]?.nombre || "casa"); setMsg(""); };
  const savePago = async () => {
    if (!nombre.trim()) return setMsg("Ponle nombre."); const m = parseFloat(monto); if (isNaN(m) || m <= 0) return setMsg("Monto invalido.");
    try { await onSavePago({ id: editing === "nuevo" ? undefined : editing, nombre: nombre.trim(), monto_estimado: m, dia_pago: diaPago !== "" ? parseInt(diaPago) : null, dia_pago_2: frecuencia === "quincenal" && diaPago2 ? parseInt(diaPago2) : null, frecuencia, medio_pago: medio, tarjeta_id: medio === "credito" && pagoTarjetaId ? pagoTarjetaId : null, destino_sobre_id: sobreId || null, categoria, activo: true }); setEditing(null); }
    catch (err) { setMsg(err.message || "Error al guardar."); }
  };
  const tryDeletePago = async (id) => { if (pendingDel !== id) { setPendingDel(id); return; } try { await onDeletePago(id); setPendingDel(null); } catch (err) { setMsg(err.message); } };

  const startEditTarjeta = (t) => { setEditTarjeta(t.id); setTNombre(t.nombre); setTBanco(t.banco || ""); setTUltimos4(t.ultimos4 || ""); setTDiaCorte(t.dia_corte != null ? String(t.dia_corte) : ""); setTDiaPago(t.dia_pago != null ? String(t.dia_pago) : ""); setTMsg(""); };
  const startNewTarjeta = () => { setEditTarjeta("nuevo"); setTNombre(""); setTBanco(""); setTUltimos4(""); setTDiaCorte(""); setTDiaPago(""); setTMsg(""); };
  const saveTarjeta = async () => {
    if (!tNombre.trim()) return setTMsg("Ponle nombre.");
    try {
      await onSaveTarjeta({
        id: editTarjeta === "nuevo" ? undefined : editTarjeta,
        nombre: tNombre.trim(), banco: tBanco.trim() || null, ultimos4: tUltimos4.trim() || null,
        dia_corte: tDiaCorte ? parseInt(tDiaCorte) : null, dia_pago: tDiaPago ? parseInt(tDiaPago) : null, activo: true,
      });
      setEditTarjeta(null);
    } catch (err) { setTMsg(err.message || "Error al guardar."); }
  };

  const startEditMSIItem = (m) => { setEditMSI(m.id); setMsiConcepto(m.concepto); setMsiMonto(String(m.monto_total)); setMsiTarjetaId(m.tarjeta_id || ""); setMsiMeses(String(m.num_meses)); setMsiFecha(m.fecha_compra); setMsiPrimer(m.mes_primer_pago); setMsiMsg(""); };
  const startNewMSI = () => { setEditMSI("nuevo"); setMsiConcepto(""); setMsiMonto(""); setMsiTarjetaId(tarjetasActivas[0]?.id || ""); setMsiMeses(""); setMsiFecha(toStr(new Date())); setMsiPrimer(""); setMsiMsg(""); };
  const saveMSI = async () => {
    if (!msiConcepto.trim()) return setMsiMsg("Ponle nombre."); const m = parseFloat(msiMonto); if (isNaN(m) || m <= 0) return setMsiMsg("Monto invalido.");
    const meses = parseInt(msiMeses); if (isNaN(meses) || meses <= 0) return setMsiMsg("Meses invalido.");
    if (!msiFecha || !msiPrimer) return setMsiMsg("Fechas requeridas.");
    if (!msiTarjetaId) return setMsiMsg("Elige la tarjeta.");
    const tarjeta = tarjetasActivas.find((t) => t.id === msiTarjetaId);
    try { await onSaveMSI({ id: editMSI === "nuevo" ? undefined : editMSI, concepto: msiConcepto.trim(), monto_total: m, tarjeta: tarjeta?.nombre || "", tarjeta_id: msiTarjetaId, num_meses: meses, fecha_compra: msiFecha, mes_primer_pago: msiPrimer, activo: true }); setEditMSI(null); }
    catch (err) { setMsiMsg(err.message || "Error al guardar."); }
  };

  return (
    <div>
      {/* === TARJETAS === */}
      <h2 className="text-base font-bold mb-1" style={{ color: "var(--ink)" }}>💳 Mis tarjetas</h2>

      {tarjetasActivas.map((t) => {
        if (editTarjeta === t.id) return <div key={t.id}>{tarjetaForm()}</div>;
        const est = calcEstimadoTarjeta(t, gastos, msi, pagos, tarjetaPagadaEsteMes(t.id));
        return (
          <div key={t.id} className="rounded-xl px-3 py-3 mb-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold" style={{ color: "var(--ink)" }}>{t.nombre}</span>
                  {t.banco && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--line)", color: "var(--ink-soft)" }}>{t.banco}</span>}
                  {t.ultimos4 && <span className="text-[10px] num" style={{ color: "var(--ink-soft)" }}>•{t.ultimos4}</span>}
                </div>
                <div className="text-xs num mt-0.5" style={{ color: "var(--ink-soft)" }}>
                  {t.dia_corte ? `Corte: dia ${t.dia_corte}` : "Sin corte"} · {t.dia_pago ? `Pago: dia ${t.dia_pago}` : "Sin pago"}
                </div>
              </div>
              <div className="flex gap-1">
                <button className="text-xs px-1.5 py-1" style={{ color: "var(--ink-soft)" }} onClick={() => startEditTarjeta(t)}>✎</button>
                <button className="text-xs px-1.5 py-1" style={{ color: "var(--ink-soft)" }} onClick={() => onDeleteTarjeta(t.id)}>✕</button>
              </div>
            </div>

            {est.total > 0 && (
              <div className="mt-2 rounded-lg px-2.5 py-2" style={{ background: "var(--paper)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: "var(--ink)" }}>MSI este mes</span>
                  <span className="num text-sm font-bold" style={{ color: "var(--ink)" }}>{money(est.total)}</span>
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: "var(--ink-soft)" }}>
                  {est.numMSI} compra{est.numMSI === 1 ? "" : "s"} a meses activa{est.numMSI === 1 ? "" : "s"}
                </div>
              </div>
            )}
            {est.total === 0 && (
              <div className="text-[10px] mt-1.5" style={{ color: "var(--ink-soft)" }}>Sin MSI activos</div>
            )}
          </div>
        );
      })}
      {editTarjeta === "nuevo" && tarjetaForm()}
      {editTarjeta !== "nuevo" && <button onClick={startNewTarjeta} className="w-full rounded-xl py-2 text-sm font-bold mt-1 mb-6" style={{ background: "color-mix(in srgb, var(--green) 10%, transparent)", color: "var(--green)", borderRadius: "20px" }}>+ Agregar tarjeta</button>}

      {/* === PAGOS RECURRENTES (sin tarjetas) === */}
      <h2 className="text-base font-bold mb-1" style={{ color: "var(--ink)" }}>🔄 Pagos recurrentes</h2>
      <div className="text-xs mb-3" style={{ color: "var(--ink-soft)" }}>Carga mensual: <span className="num font-semibold">{money(totalMensual)}</span></div>

      {pagosActivos.map((p) => (
        <div key={p.id} className="rounded-xl px-3 py-2.5 mb-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{p.nombre}</span>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: (catColor[p.categoria] || "#666") + "18", color: catColor[p.categoria] || "#666" }}>{catLabel[p.categoria]}</span>
              </div>
              <div className="text-xs num" style={{ color: "var(--ink-soft)" }}>
                {money(montoReal(p))} · {FREQ_LABEL[p.frecuencia] || "Mensual"}
                {(() => {
                  if (p.categoria === "tarjetas" && p.tarjeta_id) { const dia = tarjetasActivas.find((t) => t.id === p.tarjeta_id)?.dia_pago; return dia ? ` · dia ${dia}` : ""; }
                  if (p.frecuencia === "semanal") return p.dia_pago != null ? ` · ${DIAS[p.dia_pago]}` : "";
                  if (p.frecuencia === "quincenal") return p.dia_pago ? ` · dias ${p.dia_pago}${p.dia_pago_2 ? ` y ${p.dia_pago_2}` : ""}` : "";
                  return p.dia_pago ? ` · dia ${p.dia_pago}` : "";
                })()}
                {p.tarjeta_id ? ` · 💳 ${tarjetasActivas.find((t) => t.id === p.tarjeta_id)?.nombre || ""}` : ""}
                {p.destino_sobre_id ? ` → ${sobres.find((s) => s.id === p.destino_sobre_id)?.nombre || ""}` : " → Fuera"}
              </div>
            </div>
            <button onClick={() => onPagar({ ...p, monto_estimado: montoReal(p) })} className="text-[10px] font-bold px-2 py-1.5 rounded-lg" style={{ background: "var(--green)", color: "#fff" }}>Pague</button>
            <button className="text-xs px-1.5 py-1" style={{ color: "var(--ink-soft)" }} onClick={() => startEditPago(p)}>✎</button>
            <button className="text-xs px-1.5 py-1 rounded-lg" style={pendingDel === p.id ? { background: "var(--red)", color: "#fff" } : { color: "var(--ink-soft)" }} onClick={() => tryDeletePago(p.id)}>
              {pendingDel === p.id ? "?" : "✕"}
            </button>
          </div>
        </div>
      ))}
      <button onClick={startNewPago} className="w-full rounded-xl py-2 text-sm font-bold mt-1 mb-6" style={{ background: "color-mix(in srgb, var(--green) 10%, transparent)", color: "var(--green)", borderRadius: "20px" }}>+ Agregar pago</button>
      {editing && pagoForm()}

      {/* === COMPRAS MSI === */}
      <h2 className="text-base font-bold mb-1" style={{ color: "var(--ink)" }}>📅 Compras a meses (MSI)</h2>
      <div className="text-xs mb-3" style={{ color: "var(--ink-soft)" }}>Carga mensual activa: <span className="num font-semibold">{money(cargaMSI)}</span></div>

      {msiActivos.map((m) => {
        const st = calcMSI(m, tarjetaPagadaEsteMes(m.tarjeta_id));
        const tarjeta = tarjetasActivas.find((t) => t.id === m.tarjeta_id);
        if (editMSI === m.id) return <div key={m.id}>{msiForm()}</div>;
        return (
          <div key={m.id} className="rounded-xl px-3 py-2.5 mb-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{m.concepto}</div>
                <div className="text-xs num" style={{ color: "var(--ink-soft)" }}>
                  {money(Number(m.monto_total))} en {m.num_meses} meses
                  {tarjeta ? ` · 💳 ${tarjeta.nombre}` : m.tarjeta ? ` · ${m.tarjeta}` : ""}
                </div>
              </div>
              <div className="flex gap-1">
                <button className="text-xs px-1.5 py-1" style={{ color: "var(--ink-soft)" }} onClick={() => startEditMSIItem(m)}>✎</button>
                <button className="text-xs px-1.5 py-1" style={{ color: "var(--ink-soft)" }} onClick={() => onDeleteMSI(m.id)}>✕</button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
                <div className="h-full rounded-full" style={{ width: `${(st.pagados / st.meses) * 100}%`, background: st.estatus === "liquidado" ? "var(--green)" : "var(--amber)", transition: "width .3s" }} />
              </div>
              <span className="text-[10px] font-semibold num" style={{ color: st.estatus === "liquidado" ? "var(--green)" : "var(--ink-soft)" }}>
                {st.estatus === "liquidado" ? "Liquidado" : st.estatus === "pendiente" ? "Pendiente" : `${st.pagados}/${st.meses}`}
              </span>
            </div>
            {st.estatus === "activo" && (
              <div className="text-[10px] mt-1 num" style={{ color: "var(--ink-soft)" }}>
                {money(st.mensual)}/mes · Resta {money(st.restante)}
              </div>
            )}
          </div>
        );
      })}
      {editMSI === "nuevo" && msiForm()}
      {editMSI !== "nuevo" && <button onClick={startNewMSI} className="w-full rounded-xl py-2 text-sm font-bold mt-1" style={{ background: "color-mix(in srgb, var(--green) 10%, transparent)", color: "var(--green)", borderRadius: "20px" }}>+ Agregar compra MSI</button>}
    </div>
  );

  function tarjetaForm() {
    return (
      <div className={`fixed inset-0 z-30 flex items-end justify-center md3-sheet-backdrop`} onClick={() => setEditTarjeta(null)}>
        <div className={`w-full max-w-md p-4 pb-6 overflow-y-auto md3-sheet`} style={{ background: "var(--card)", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
          <div className="md3-drag-handle" />
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ color: "var(--ink)" }}>{editTarjeta === "nuevo" ? "Nueva tarjeta" : "Editar tarjeta"}</h2>
            <button className="text-sm px-2 py-1" style={{ color: "var(--ink-soft)" }} onClick={() => setEditTarjeta(null)}>Cerrar</button>
          </div>

          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Nombre</label>
          <input type="text" placeholder="ej: BBVA Azul" value={tNombre} onChange={(e) => setTNombre(e.target.value)} autoFocus
            className="w-full rounded-xl px-3 py-2 text-sm outline-none mb-3" style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }} />

          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Banco</label>
          <input type="text" placeholder="ej: BBVA, Banorte..." value={tBanco} onChange={(e) => setTBanco(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm outline-none mb-3" style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }} />

          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Ultimos 4</label>
              <input type="text" placeholder="1234" value={tUltimos4} onChange={(e) => setTUltimos4(e.target.value)} maxLength={4}
                className="w-full num rounded-xl px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Dia corte</label>
              <input type="number" inputMode="numeric" placeholder="15" value={tDiaCorte} onChange={(e) => setTDiaCorte(e.target.value)}
                className="w-full num rounded-xl px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Dia pago</label>
              <input type="number" inputMode="numeric" placeholder="5" value={tDiaPago} onChange={(e) => setTDiaPago(e.target.value)}
                className="w-full num rounded-xl px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }} />
            </div>
          </div>

          {tMsg && <div className="text-xs mb-2" style={{ color: "var(--red)" }}>{tMsg}</div>}
          <div className="flex gap-2">
            <button onClick={saveTarjeta} className="flex-1 rounded-xl py-2.5 text-sm font-bold" style={{ background: "var(--green)", color: "#fff" }}>Guardar</button>
            <button onClick={() => setEditTarjeta(null)} className="px-4 rounded-xl py-2.5 text-sm font-semibold" style={{ color: "var(--ink-soft)", border: "1px solid var(--line)" }}>Cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  function pagoForm() {
    return (
      <div className={`fixed inset-0 z-30 flex items-end justify-center md3-sheet-backdrop`} onClick={() => setEditing(null)}>
        <div className={`w-full max-w-md p-4 pb-6 overflow-y-auto md3-sheet`} style={{ background: "var(--card)", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
          <div className="md3-drag-handle" />
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ color: "var(--ink)" }}>{editing === "nuevo" ? "Nuevo pago recurrente" : "Editar pago recurrente"}</h2>
            <button className="text-sm px-2 py-1" style={{ color: "var(--ink-soft)" }} onClick={() => setEditing(null)}>Cerrar</button>
          </div>

          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Nombre</label>
          <input type="text" placeholder="ej: Internet, Spotify..." value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus
            className="w-full rounded-xl px-3 py-2 text-sm outline-none mb-3"
            style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }} />

          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Cuanto?</label>
          <input type="number" inputMode="decimal" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)}
            className="w-full num text-2xl font-semibold rounded-xl px-3 py-2 mb-3 outline-none"
            style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--paper)" }} />

          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Cada cuando?</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[["semanal", "Semanal"], ["quincenal", "Quincenal"], ["mensual", "Mensual"]].map(([v, l]) => (
              <button key={v} onClick={() => setFrecuencia(v)} className="chip"
                style={frecuencia === v ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : {}}>
                {l}
              </button>
            ))}
          </div>

          {frecuencia === "semanal" && (
            <>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Que dia de la semana?</label>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {DIAS.map((d, i) => (
                  <button key={i} onClick={() => setDiaPago(String(i))} className="chip"
                    style={diaPago === String(i) ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : {}}>
                    {d}
                  </button>
                ))}
              </div>
            </>
          )}
          {frecuencia === "quincenal" && (
            <>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Dias del mes</label>
              <div className="flex items-center gap-2 mb-3">
                <input type="number" inputMode="numeric" placeholder="ej: 1" min="1" max="31" value={diaPago} onChange={(e) => setDiaPago(e.target.value)}
                  className="w-20 num rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>y</span>
                <input type="number" inputMode="numeric" placeholder="ej: 15" min="1" max="31" value={diaPago2} onChange={(e) => setDiaPago2(e.target.value)}
                  className="w-20 num rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }} />
              </div>
            </>
          )}
          {frecuencia === "mensual" && (
            <>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Dia del mes</label>
              <input type="number" inputMode="numeric" placeholder="ej: 15" min="1" max="31" value={diaPago} onChange={(e) => setDiaPago(e.target.value)}
                className="w-24 num rounded-xl px-3 py-2 text-sm outline-none mb-3"
                style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }} />
            </>
          )}

          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>De que sobre sale?</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {gastables.map((s) => (
              <button key={s.id} onClick={() => setSobreId(s.id)} className="chip"
                style={sobreId === s.id ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : {}}>
                {s.emoji} {s.nombre}
              </button>
            ))}
            <button onClick={() => setSobreId("")} className="chip"
              style={!sobreId ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : {}}>
              🚫 Fuera de sobres
            </button>
          </div>

          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Categoria</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {categorias.map((c) => (
              <button key={c.nombre} onClick={() => setCategoria(c.nombre)} className="chip"
                style={categoria === c.nombre ? { background: c.color, color: "#fff", borderColor: c.color } : {}}>
                {c.label}
              </button>
            ))}
          </div>

          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Medio de pago</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {MEDIOS.map((m) => (
              <button key={m} onClick={() => { setMedio(m); if (m !== "credito") setPagoTarjetaId(""); }} className="chip"
                style={medio === m ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : {}}>
                {MEDIOS_LABEL[m]}
              </button>
            ))}
          </div>

          {medio === "credito" && (
            <>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>Tarjeta</label>
              {tarjetasActivas.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tarjetasActivas.map((t) => (
                    <button key={t.id} onClick={() => setPagoTarjetaId(t.id)} className="chip"
                      style={pagoTarjetaId === t.id ? { background: "var(--red)", color: "#fff", borderColor: "var(--red)" } : {}}>
                      💳 {t.nombre}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs rounded-xl px-3 py-2 mb-3" style={{ background: "var(--paper)", color: "var(--ink-soft)" }}>
                  No tienes tarjetas. Agregalas arriba en "Mis tarjetas".
                </div>
              )}
            </>
          )}

          {msg && <div className="text-xs mb-2" style={{ color: "var(--red)" }}>{msg}</div>}
          <button onClick={savePago} className={`w-full py-3 font-bold text-sm md3-btn-filled`}
            style={{ background: "var(--green)", color: "#fff" }}>
            {editing === "nuevo" ? "Agregar pago" : "Guardar cambios"}
          </button>
        </div>
      </div>
    );
  }

  function msiForm() {
    const montoNum = parseFloat(msiMonto) || 0;
    const mesesNum = parseInt(msiMeses) || 0;
    const mensual = mesesNum > 0 ? montoNum / mesesNum : 0;
    return (
      <div className="rounded-xl p-3 mb-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <label className="block text-[10px] font-semibold mb-0.5" style={{ color: "var(--ink-soft)" }}>Que compraste?</label>
        <input type="text" placeholder="ej: PlayStation Plus" value={msiConcepto} onChange={(e) => setMsiConcepto(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm outline-none mb-2" style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }} />
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <label className="block text-[10px] font-semibold mb-0.5" style={{ color: "var(--ink-soft)" }}>Monto total</label>
            <input type="number" inputMode="decimal" placeholder="12000" value={msiMonto} onChange={(e) => setMsiMonto(e.target.value)} className="w-full num rounded-xl px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }} />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-semibold mb-0.5" style={{ color: "var(--ink-soft)" }}>A cuantos meses?</label>
            <input type="number" inputMode="numeric" placeholder="12" min="1" value={msiMeses} onChange={(e) => setMsiMeses(e.target.value)} className="w-full num rounded-xl px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }} />
          </div>
        </div>
        {mensual > 0 && <div className="text-xs mb-2 num font-semibold" style={{ color: "var(--green)" }}>Mensualidad: {money(mensual)}</div>}
        <div className="mb-2">
          <label className="block text-[10px] font-semibold mb-0.5" style={{ color: "var(--ink-soft)" }}>Con que tarjeta?</label>
          <select value={msiTarjetaId} onChange={(e) => setMsiTarjetaId(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--paper)" }}>
            <option value="">-- Elige tarjeta --</option>
            {tarjetasActivas.map((t) => <option key={t.id} value={t.id}>💳 {t.nombre}</option>)}
          </select>
        </div>
        <div className="flex gap-2 mb-2">
          <div className="flex-1"><label className="block text-[10px] font-semibold mb-0.5" style={{ color: "var(--ink-soft)" }}>Fecha de compra</label><input type="date" value={msiFecha} onChange={(e) => setMsiFecha(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--paper)" }} /></div>
          <div className="flex-1"><label className="block text-[10px] font-semibold mb-0.5" style={{ color: "var(--ink-soft)" }}>Primer pago</label><input type="date" value={msiPrimer} onChange={(e) => setMsiPrimer(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--paper)" }} /></div>
        </div>
        {msiMsg && <div className="text-xs mb-2" style={{ color: "var(--red)" }}>{msiMsg}</div>}
        <div className="flex gap-2">
          <button onClick={saveMSI} className="flex-1 rounded-xl py-2 text-sm font-bold" style={{ background: "var(--green)", color: "#fff" }}>Guardar</button>
          <button onClick={() => setEditMSI(null)} className="px-4 rounded-xl py-2 text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>Cancelar</button>
        </div>
      </div>
    );
  }
}

/* ---------- Tab Analisis (F5) ---------- */
function TabAnalisis({ gastos, sobres, tarjetas, presupSemanal, onNavToWeek, inicioSobres }) {
  const { money, weekStartOf, weekOf, weekLabel, categorias, catLabel, catColor, weekDayOrder, diaInicio } = useCuenta();
  const [excluir, setExcluir] = useState(false);
  const [periodo, setPeriodo] = useState("semana");
  const [modoDia, setModoDia] = useState("monto");
  const [vistaTemp, setVistaTemp] = useState("semana");
  const [rangoInicio, setRangoInicio] = useState("");
  const [rangoFin, setRangoFin] = useState("");

  const hoy = new Date();
  const wsActual = toStr(weekStartOf(hoy));
  const gf = excluir ? gastos.filter((g) => g.categoria !== "tarjetas" && g.categoria !== "renta") : gastos;

  let gastosEnPeriodo;
  let periodoLabel = "";
  if (periodo === "rango") {
    const ri = rangoInicio || toStr(addDays(hoy, -30));
    const rf = rangoFin || toStr(hoy);
    gastosEnPeriodo = gf.filter((g) => g.fecha >= ri && g.fecha <= rf);
    periodoLabel = `${fromStr(ri).getDate()} ${MESES[fromStr(ri).getMonth()]} – ${fromStr(rf).getDate()} ${MESES[fromStr(rf).getMonth()]}`;
  } else if (periodo === "sem_pasada") {
    const wsPasada = toStr(addDays(fromStr(wsActual), -7));
    gastosEnPeriodo = gf.filter((g) => weekOf(g.fecha) === wsPasada);
    periodoLabel = "semana pasada";
  } else if (periodo === "mes") {
    const inicioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
    gastosEnPeriodo = gf.filter((g) => g.fecha >= inicioMes);
    periodoLabel = "este mes calendario";
  } else if (periodo === "semana") {
    gastosEnPeriodo = gf.filter((g) => weekOf(g.fecha) === wsActual);
    periodoLabel = "esta semana";
  } else {
    const numSem = periodo === "2sem" ? 2 : 4;
    const startWS = toStr(addDays(fromStr(wsActual), -numSem * 7));
    gastosEnPeriodo = gf.filter((g) => { const ws = weekOf(g.fecha); return ws >= startWS && ws < wsActual; });
    periodoLabel = `${numSem} semanas previas`;
  }
  const totalPeriodo = gastosEnPeriodo.reduce((a, g) => a + Number(g.monto), 0);

  const porDia = weekDayOrder.map((d) => {
    const gs = gastosEnPeriodo.filter((g) => fromStr(g.fecha).getDay() === d);
    return { dia: DIAS[d], monto: gs.reduce((a, g) => a + Number(g.monto), 0), compras: gs.length };
  });

  const porCat = categorias.map((c) => {
    const val = gastosEnPeriodo.filter((g) => g.categoria === c.nombre).reduce((a, g) => a + Number(g.monto), 0);
    return { name: c.label, value: val, pct: totalPeriodo > 0 ? Math.round((val / totalPeriodo) * 100) : 0, color: c.color };
  }).filter((x) => x.value > 0);

  const todasSemanas = [...new Set(gf.map((g) => weekOf(g.fecha)))].sort();
  const moneyShort = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : n > 0 ? `$${Math.round(n)}` : "";

  const semanasTemporal = todasSemanas.slice(-8).map((ws) => {
    const diff = Math.round((fromStr(wsActual).getTime() - fromStr(ws).getTime()) / (7 * 86400000));
    const d0 = fromStr(ws), d1 = addDays(d0, 6);
    return {
      ws, label: diff === 0 ? "Esta" : `Hace ${diff}`,
      rango: weekLabel(ws),
      monto: gf.filter((g) => weekOf(g.fecha) === ws).reduce((sum, g) => sum + Number(g.monto), 0),
      offset: -diff,
    };
  });

  const mesesUnicos = [...new Set(gf.map((g) => g.fecha.substring(0, 7)))].sort();
  const mesesTemporal = mesesUnicos.slice(-6).map((m) => {
    const [y, mm] = m.split("-").map(Number);
    const diffM = (hoy.getFullYear() - y) * 12 + (hoy.getMonth() + 1 - mm);
    const finMes = new Date(y, mm, 0);
    return {
      label: diffM === 0 ? "Este" : `Hace ${diffM}`,
      rango: `1–${finMes.getDate()} ${MESES[mm - 1]} ${y}`,
      monto: gf.filter((g) => g.fecha.startsWith(m)).reduce((sum, g) => sum + Number(g.monto), 0),
    };
  });

  const wsInicio = inicioSobres ? toStr(weekStartOf(fromStr(inicioSobres))) : wsActual;
  const tendencia = todasSemanas.filter((ws) => ws >= wsInicio).slice(-8).map((ws) => {
    const diff = Math.round((fromStr(wsActual).getTime() - fromStr(ws).getTime()) / (7 * 86400000));
    return {
      label: diff === 0 ? "Esta" : `Hace ${diff}`,
      gasto: gf.filter((g) => weekOf(g.fecha) === ws).reduce((sum, g) => sum + Number(g.monto), 0),
    };
  });

  const ttStyle = { contentStyle: { background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, fontSize: 12 }, labelStyle: { color: "var(--ink)", fontWeight: 600 } };

  const TempTooltip = ({ active, payload }) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-lg px-3 py-2" style={{ background: "var(--card)", border: "1px solid var(--line)", fontSize: 12 }}>
        <div className="font-semibold" style={{ color: "var(--ink)" }}>{d.rango}</div>
        <div className="num font-bold" style={{ color: "var(--green)" }}>{money(d.monto)}</div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold" style={{ color: "var(--ink)" }}>Analisis</h2>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none" style={{ color: "var(--ink-soft)" }}>
          <input type="checkbox" checked={excluir} onChange={() => setExcluir(!excluir)} className="rounded" />Sin tarjetas/renta
        </label>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {[["semana", "Esta sem"], ["sem_pasada", "Pasada"], ["2sem", "2 sem"], ["4sem", "4 sem"], ["mes", "Mes"], ["rango", "Rango"]].map(([v, l]) => (
          <button key={v} className="text-xs font-semibold py-1.5 px-3 rounded-xl"
            style={periodo === v ? { background: "var(--accent)", color: "#fff" } : { background: "var(--card)", color: "var(--ink)", border: "1px solid var(--line)" }}
            onClick={() => setPeriodo(v)}>{l}</button>
        ))}
      </div>

      {periodo === "rango" && (
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="text-[10px] font-semibold block mb-0.5" style={{ color: "var(--ink-soft)" }}>Desde</label>
            <input type="date" value={rangoInicio || toStr(addDays(hoy, -30))} onChange={(e) => setRangoInicio(e.target.value)}
              className="w-full rounded-lg px-2 py-1.5 text-xs outline-none" style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--paper)" }} />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-semibold block mb-0.5" style={{ color: "var(--ink-soft)" }}>Hasta</label>
            <input type="date" value={rangoFin || toStr(hoy)} onChange={(e) => setRangoFin(e.target.value)}
              className="w-full rounded-lg px-2 py-1.5 text-xs outline-none" style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--paper)" }} />
          </div>
        </div>
      )}

      <div className="rounded-xl p-3 mb-3 text-center" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <div className="text-xs" style={{ color: "var(--ink-soft)" }}>Total {periodoLabel}</div>
        <div className="num text-2xl font-bold mt-0.5" style={{ color: "var(--ink)" }}>{money(totalPeriodo)}</div>
        <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{gastosEnPeriodo.length} gasto{gastosEnPeriodo.length === 1 ? "" : "s"}</div>
      </div>

      <div className="rounded-xl p-3 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>Por dia de la semana</h3>
          <button className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: "var(--line)", color: "var(--ink)" }}
            onClick={() => setModoDia(modoDia === "monto" ? "compras" : "monto")}>{modoDia === "monto" ? "$" : "#"}</button>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={porDia}>
            <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => modoDia === "monto" ? (v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`) : v} />
            <Tooltip {...ttStyle} formatter={(v) => modoDia === "monto" ? money(v) : `${v} compras`} />
            <Bar dataKey={modoDia} fill="var(--ink)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl p-3 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--ink-soft)" }}>Por categoria</h3>
        {porCat.length > 0 ? (
          <>
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={porCat} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2}>
                    {porCat.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip {...ttStyle} formatter={(v) => money(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 pl-2">
                {porCat.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-xs py-0.5">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: c.color }} />
                      <span style={{ color: "var(--ink-soft)" }}>{c.name}</span>
                    </span>
                    <span className="num font-semibold" style={{ color: "var(--ink)" }}>{c.pct}% · {money(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-xs mt-2 text-right num font-semibold" style={{ color: "var(--ink-soft)" }}>Total: {money(totalPeriodo)}</div>
          </>
        ) : (
          <div className="text-sm text-center py-4" style={{ color: "var(--ink-soft)" }}>Sin gastos en este periodo</div>
        )}
      </div>

      <div className="rounded-xl p-3 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>Gasto por periodo</h3>
          <div className="flex gap-1">
            {[["semana", "Sem"], ["mes", "Mes"]].map(([v, l]) => (
              <button key={v} className="text-[10px] font-semibold px-2 py-1 rounded-full"
                style={vistaTemp === v ? { background: "var(--accent)", color: "#fff" } : { background: "var(--line)", color: "var(--ink)" }}
                onClick={() => setVistaTemp(v)}>{l}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={vistaTemp === "semana" ? semanasTemporal : mesesTemporal}>
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<TempTooltip />} />
            <Bar dataKey="monto" fill="var(--green)" radius={[4, 4, 0, 0]}
              cursor={vistaTemp === "semana" ? "pointer" : "default"}
              onClick={vistaTemp === "semana" ? (data) => { const item = data?.payload || data; if (item?.offset !== undefined && onNavToWeek) onNavToWeek(item.offset); } : undefined}>
              <LabelList dataKey="monto" position="top" fontSize={9} fill="var(--ink-soft)" formatter={moneyShort} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="text-[10px] text-center mt-1" style={{ color: "var(--ink-soft)" }}>
          {vistaTemp === "semana" ? "semanas atras · toca para ver detalle" : "meses atras"}
        </div>
      </div>

      <div className="rounded-xl p-3 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--ink-soft)" }}>Tendencia vs presupuesto</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={tendencia}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
            <Tooltip {...ttStyle} formatter={(v, name) => [money(v), name === "gasto" ? "Gasto" : "Meta"]} />
            <ReferenceLine y={presupSemanal} stroke="var(--green)" strokeDasharray="5 5" label={{ value: `Meta ${money(presupSemanal)}`, position: "insideTopRight", fontSize: 9, fill: "var(--green)" }} />
            <Line type="monotone" dataKey="gasto" stroke="var(--ink)" strokeWidth={2} dot={{ r: 3, fill: "var(--ink)" }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="text-[10px] text-center mt-1" style={{ color: "var(--ink-soft)" }}>semanas atras</div>
      </div>

      {(() => {
        const MEDIO_COLORS = { efectivo: "#16a34a", debito: "#2563eb", credito: "#dc2626", transferencia: "#7c3aed" };
        const porMedio = MEDIOS.map((m) => {
          const val = gastosEnPeriodo.filter((g) => g.medio_pago === m).reduce((a, g) => a + Number(g.monto), 0);
          return { name: MEDIOS_LABEL[m], value: val, pct: totalPeriodo > 0 ? Math.round((val / totalPeriodo) * 100) : 0, color: MEDIO_COLORS[m], count: gastosEnPeriodo.filter((g) => g.medio_pago === m).length };
        }).filter((x) => x.value > 0);

        const tarjetasActivas = (tarjetas || []).filter((t) => t.activo);
        const porTarjeta = tarjetasActivas.map((t) => {
          const gs = gastosEnPeriodo.filter((g) => g.tarjeta_id === t.id);
          return { nombre: t.nombre, banco: t.banco, ultimos4: t.ultimos4, total: gs.reduce((a, g) => a + Number(g.monto), 0), count: gs.length };
        }).filter((x) => x.total > 0).sort((a, b) => b.total - a.total);
        const maxTarjeta = porTarjeta.length > 0 ? porTarjeta[0].total : 1;

        return (
          <>
            <div className="rounded-xl p-3 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
              <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--ink-soft)" }}>Por medio de pago</h3>
              {porMedio.length > 0 ? (
                <>
                  <div className="flex items-center">
                    <ResponsiveContainer width="50%" height={160}>
                      <PieChart>
                        <Pie data={porMedio} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2}>
                          {porMedio.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip {...ttStyle} formatter={(v) => money(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 pl-2">
                      {porMedio.map((m) => (
                        <div key={m.name} className="flex items-center justify-between text-xs py-0.5">
                          <span className="flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full" style={{ background: m.color }} />
                            <span style={{ color: "var(--ink-soft)" }}>{m.name}</span>
                          </span>
                          <span className="num font-semibold" style={{ color: "var(--ink)" }}>{m.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1 mt-2">
                    {porMedio.map((m) => (
                      <div key={m.name} className="flex items-center justify-between text-xs">
                        <span style={{ color: "var(--ink-soft)" }}>{m.name} · {m.count} gasto{m.count === 1 ? "" : "s"}</span>
                        <span className="num font-semibold" style={{ color: "var(--ink)" }}>{money(m.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-sm text-center py-4" style={{ color: "var(--ink-soft)" }}>Sin gastos en este periodo</div>
              )}
            </div>

            {porTarjeta.length > 0 && (
              <div className="rounded-xl p-3 mb-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
                <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--ink-soft)" }}>Gasto por tarjeta</h3>
                <div className="space-y-2">
                  {porTarjeta.map((t, i) => (
                    <div key={t.nombre}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold" style={{ color: "var(--ink)" }}>
                          {i === 0 && "👑 "}{t.nombre}
                          {t.banco && <span className="font-normal" style={{ color: "var(--ink-soft)" }}> · {t.banco}</span>}
                          {t.ultimos4 && <span className="num font-normal" style={{ color: "var(--ink-soft)" }}> •{t.ultimos4}</span>}
                        </span>
                        <span className="num text-xs font-bold" style={{ color: "var(--ink)" }}>{money(t.total)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
                          <div className="h-full rounded-full" style={{ width: `${(t.total / maxTarjeta) * 100}%`, background: "var(--red)" }} />
                        </div>
                        <span className="text-[10px] num" style={{ color: "var(--ink-soft)" }}>{t.count} gasto{t.count === 1 ? "" : "s"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}

/* ---------- Ajustes (F6) ---------- */
function SettingsPanel({ tema, onChangeTema, fondoCustom, onChangeFondo, onClose, esPro, onShowPro, gastos, sobres, pagos, tarjetas }) {
  const { categorias, diaInicio, updateDiaInicio, addCategoria, removeCategoria } = useCuenta();
  const [newCatNombre, setNewCatNombre] = useState("");
  const [newCatColor, setNewCatColor] = useState(COLORES_CATEGORIA[0]);
  const [showAddCat, setShowAddCat] = useState(false);
  const [pinActivo, setPinActivo] = useState(hasPin());
  const [pinInput, setPinInput] = useState("");
  const [showPinSetup, setShowPinSetup] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          const scale = MAX / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        onChangeFondo(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleAddCat = async () => {
    const nombre = newCatNombre.trim().toLowerCase().replace(/\s+/g, "_");
    const label = newCatNombre.trim();
    if (!nombre) return;
    const orden = categorias.length + 1;
    await addCategoria({ nombre, label, color: newCatColor, orden });
    setNewCatNombre("");
    setShowAddCat(false);
  };

  return (
    <div className={`fixed inset-0 z-30 flex items-end justify-center md3-sheet-backdrop`} onClick={onClose}>
      <div className={`w-full max-w-md p-4 pb-6 overflow-y-auto md3-sheet`} style={{ background: "var(--card)", maxHeight: "80vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="md3-drag-handle" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold" style={{ color: "var(--ink)" }}>Ajustes</h2>
          <button className="text-sm px-2 py-1 font-semibold" style={{ color: "var(--ink-soft)" }} onClick={onClose}>Cerrar</button>
        </div>

        <p className="text-xs font-bold mb-2" style={{ color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Inicio de semana</p>
        <div className="flex gap-2 mb-5">
          {DIAS_INICIO_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => updateDiaInicio(opt.value)} className="flex-1 rounded-xl py-2 text-sm font-semibold"
              style={diaInicio === opt.value
                ? { background: "var(--green)", color: "#fff", border: "2px solid var(--green)" }
                : { background: "var(--paper)", color: "var(--ink)", border: "2px solid var(--line)" }}>
              {opt.label}
            </button>
          ))}
        </div>

        <p className="text-xs font-bold mb-2" style={{ color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Categorias</p>
        <div className="space-y-1.5 mb-3">
          {categorias.map((c) => (
            <div key={c.nombre} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
              <span className="w-3 h-3 rounded-full" style={{ background: c.color }} />
              <span className="text-sm font-semibold flex-1" style={{ color: "var(--ink)" }}>{c.label}</span>
              {categorias.length > 1 && (
                <button onClick={() => removeCategoria(c.nombre)} className="text-xs px-1.5 py-0.5" style={{ color: "var(--ink-soft)" }}>✕</button>
              )}
            </div>
          ))}
        </div>
        {showAddCat ? (
          <div className="rounded-xl p-3 mb-5" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
            <input type="text" value={newCatNombre} onChange={(e) => setNewCatNombre(e.target.value)} placeholder="Nombre de categoria"
              autoFocus className="w-full rounded-lg px-2 py-1.5 text-sm mb-2 outline-none" style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--card)" }} />
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {COLORES_CATEGORIA.map((color) => (
                <button key={color} onClick={() => setNewCatColor(color)} className="w-6 h-6 rounded-full" style={{ background: color, border: newCatColor === color ? "3px solid var(--ink)" : "2px solid transparent" }} />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddCat(false)} className="flex-1 text-xs font-semibold py-1.5 rounded-lg" style={{ color: "var(--ink-soft)", border: "1px solid var(--line)" }}>Cancelar</button>
              <button onClick={handleAddCat} className="flex-1 text-xs font-bold py-1.5 rounded-lg" style={{ background: "var(--green)", color: "#fff" }}>Agregar</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddCat(true)} className="flex items-center gap-1 text-xs font-semibold mb-5 px-2 py-1" style={{ color: "var(--green)" }}>
            <Plus size={14} /> Agregar categoria
          </button>
        )}

        <p className="text-xs font-bold mb-2" style={{ color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tema</p>
        <div className="grid grid-cols-5 gap-2 mb-5">
          {Object.entries(TEMAS).map(([key, t]) => {
            const locked = t.pro && !esPro;
            return (
              <button key={key} onClick={() => locked ? onShowPro() : onChangeTema(key)}
                className="rounded-xl p-1.5 text-center relative" style={{ border: tema === key ? `2px solid ${t.ink}` : "2px solid transparent", background: "var(--paper)", opacity: locked ? 0.6 : 1 }}>
                <div className="rounded-lg overflow-hidden mb-1" style={{ border: "1px solid var(--line)" }}>
                  <div style={{ background: t.paper, height: 20 }} />
                  <div className="flex">
                    <div style={{ background: t.ink, height: 8, flex: 1 }} />
                    <div style={{ background: t.green, height: 8, flex: 1 }} />
                  </div>
                  <div style={{ background: t.card, height: 12 }} />
                </div>
                <div className="text-[10px] font-bold" style={{ color: tema === key ? "var(--ink)" : "var(--ink-soft)" }}>{locked ? "🔒" : ""} {t.label}</div>
              </button>
            );
          })}
        </div>

        <p className="text-xs font-bold mb-2" style={{ color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Fondo de pantalla</p>
        <div className="flex gap-3 items-center">
          {fondoCustom ? (
            <div className="relative rounded-xl overflow-hidden" style={{ width: 64, height: 64, border: "2px solid var(--green)" }}>
              <img src={fondoCustom} alt="fondo" className="w-full h-full object-cover" />
              <button onClick={() => onChangeFondo("")} className="absolute top-0 right-0 rounded-bl-lg p-0.5" style={{ background: "var(--red)", color: "#fff" }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="rounded-xl flex items-center justify-center" style={{ width: 64, height: 64, border: "2px dashed var(--line)", background: "var(--paper)" }}>
              <ImageIcon size={20} style={{ color: "var(--ink-soft)" }} />
            </div>
          )}
          <label className="chip cursor-pointer flex items-center gap-1.5" style={{ background: "var(--card)" }}>
            <ImageIcon size={14} />
            {fondoCustom ? "Cambiar" : "Elegir de galeria"}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>

        <p className="text-xs font-bold mb-2 mt-5" style={{ color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Seguridad</p>
        <div className="rounded-xl p-3" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
          {!showPinSetup ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>PIN de acceso</div>
                <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{pinActivo ? "Activado — se pide al abrir" : "Desactivado"}</div>
              </div>
              {pinActivo ? (
                <button onClick={() => setShowPinSetup("remove")} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ color: "var(--red)", border: "1px solid var(--line)" }}>Quitar</button>
              ) : (
                <button onClick={() => setShowPinSetup(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ color: "var(--green)", border: "1px solid var(--line)" }}>Activar</button>
              )}
            </div>
          ) : showPinSetup === "remove" ? (
            <div>
              <div className="text-sm font-semibold mb-2" style={{ color: "var(--ink)" }}>Ingresa tu PIN actual para quitar</div>
              <div className="flex gap-2 items-center">
                <input type="password" inputMode="numeric" maxLength={4} pattern="[0-9]*" value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                  autoFocus className="w-24 rounded-lg px-3 py-2 text-center text-lg font-mono tracking-widest outline-none"
                  style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--card)" }} />
                <button onClick={() => {
                  const stored = getPin();
                  if (pinInput === stored) { setPin(null); clearUnlock(); setPinActivo(false); setShowPinSetup(false); setPinInput(""); }
                  else { setPinInput(""); }
                }}
                  disabled={pinInput.length !== 4} className="text-xs font-bold px-3 py-2 rounded-lg"
                  style={{ background: pinInput.length === 4 ? "var(--red)" : "var(--line)", color: pinInput.length === 4 ? "#fff" : "var(--ink-soft)" }}>Quitar PIN</button>
                <button onClick={() => { setShowPinSetup(false); setPinInput(""); }} className="text-xs px-2 py-2" style={{ color: "var(--ink-soft)" }}>✕</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-semibold mb-2" style={{ color: "var(--ink)" }}>Elige un PIN de 4 dígitos</div>
              <div className="flex gap-2 items-center">
                <input type="password" inputMode="numeric" maxLength={4} pattern="[0-9]*" value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                  autoFocus className="w-24 rounded-lg px-3 py-2 text-center text-lg font-mono tracking-widest outline-none"
                  style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "var(--card)" }} />
                <button onClick={() => { if (pinInput.length === 4) { setPin(pinInput); setPinActivo(true); setShowPinSetup(false); setPinInput(""); } }}
                  disabled={pinInput.length !== 4} className="text-xs font-bold px-3 py-2 rounded-lg"
                  style={{ background: pinInput.length === 4 ? "var(--green)" : "var(--line)", color: pinInput.length === 4 ? "#fff" : "var(--ink-soft)" }}>Guardar</button>
                <button onClick={() => { setShowPinSetup(false); setPinInput(""); }} className="text-xs px-2 py-2" style={{ color: "var(--ink-soft)" }}>✕</button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs font-bold mb-2 mt-5" style={{ color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Notificaciones</p>
        <div className="rounded-xl p-3 mb-5" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
          <div className="text-sm font-semibold mb-1" style={{ color: "var(--ink)" }}>Recordatorio de pagos</div>
          <div className="text-xs mb-2" style={{ color: "var(--ink-soft)" }}>Cuando avisarte de un pago proximo</div>
          <div className="flex flex-wrap gap-1.5">
            {OPCIONES_ANTELACION.map((opt) => (
              <button key={opt.value} onClick={() => { setDiasAntes(opt.value); programarNotificaciones(pagos, tarjetas); }}
                className="text-xs font-semibold py-1.5 px-3 rounded-xl"
                style={getDiasAntes() === opt.value
                  ? { background: "var(--green)", color: "#fff" }
                  : { background: "var(--card)", color: "var(--ink)", border: "1px solid var(--line)" }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs font-bold mb-2 mt-5" style={{ color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Datos</p>
        <button onClick={() => {
          if (!esPro) { onShowPro(); return; }
          exportGastosCSV(gastos, sobres);
        }} className="w-full flex items-center gap-3 rounded-xl px-3 py-3 mb-2" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
          <span className="text-lg">📊</span>
          <div className="text-left flex-1">
            <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Exportar gastos a CSV</div>
            <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{esPro ? "Descarga tus datos" : "Funcion Pro"}</div>
          </div>
          {!esPro && <span className="text-sm">🔒</span>}
        </button>

        {esPro ? (
          <div className="w-full rounded-xl px-4 py-3 mb-2 flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.1))", border: "1px solid rgba(255,215,0,0.3)" }}>
            <span className="text-xl">⭐</span>
            <div className="text-left flex-1">
              <div className="text-sm font-bold" style={{ color: "var(--ink)" }}>Tienes Sobres Pro</div>
              <div className="text-xs" style={{ color: "var(--ink-soft)" }}>Sin anuncios · exportar · temas exclusivos</div>
            </div>
          </div>
        ) : (
          <button onClick={onShowPro} className="w-full rounded-xl px-4 py-3 mb-2 flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)", border: "none" }}>
            <span className="text-xl">⭐</span>
            <div className="text-left flex-1">
              <div className="text-sm font-bold" style={{ color: "#1a1a1a" }}>Hazte Pro</div>
              <div className="text-xs" style={{ color: "#4a3500" }}>Sin anuncios + exportar + temas</div>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: "rgba(0,0,0,.15)", color: "#1a1a1a" }}>{PRECIO_PRO}/año</span>
          </button>
        )}

        <p className="text-xs font-bold mb-2 mt-5" style={{ color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ayuda</p>
        <div className="space-y-2">
          <button onClick={() => {
            const info = [
              `App: Sobres Semanales v${APP_VERSION}`,
              `Plataforma: ${navigator.userAgent}`,
              `Pantalla: ${screen.width}x${screen.height}`,
              `Fecha: ${new Date().toISOString()}`,
            ].join("\n");
            window.open(`mailto:soporte@sobressemanales.com?subject=${encodeURIComponent("Reporte de problema — Sobres Semanales")}&body=${encodeURIComponent("Describe el problema:\n\n\n\n--- Info del dispositivo ---\n" + info)}`);
          }} className="w-full flex items-center gap-3 rounded-xl px-3 py-3" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
            <span className="text-lg">🐛</span>
            <div className="text-left flex-1">
              <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Reportar problema</div>
              <div className="text-xs" style={{ color: "var(--ink-soft)" }}>Envianos un correo con los detalles</div>
            </div>
          </button>
          <button onClick={() => {
            window.open(`mailto:soporte@sobressemanales.com?subject=${encodeURIComponent("Sugerencia — Sobres Semanales")}&body=${encodeURIComponent("Me gustaria que la app...\n\n")}`);
          }} className="w-full flex items-center gap-3 rounded-xl px-3 py-3" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
            <span className="text-lg">💡</span>
            <div className="text-left flex-1">
              <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Sugerir mejora</div>
              <div className="text-xs" style={{ color: "var(--ink-soft)" }}>Cuentanos que te gustaria que agregemos</div>
            </div>
          </button>
        </div>

        <div className="text-center mt-6 mb-2">
          <div className="text-[10px]" style={{ color: "var(--ink-soft)" }}>Sobres Semanales v{APP_VERSION}</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   App principal
   ============================================================ */
function AppMain() {
  const { perfil, logout } = useAuth();
  const cuentaId = perfil?.cuenta_id;
  const { money, weekStartOf, weekOf, weekLabel, loaded: cuentaLoaded } = useCuenta();

  const [sobres, setSobres] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [cierres, setCierres] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [msi, setMsi] = useState([]);
  const [tarjetas, setTarjetas] = useState([]);
  const [presupSemanal, setPresupSemanal] = useState(3000);
  const [inicioSobres, setInicioSobres] = useState(toStr(new Date()));
  const [tema, setTemaState] = useState(perfil?.tema || "claro");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("semana");
  const [offset, setOffset] = useState(0);
  const [err, setErr] = useState("");
  const [showPagoForm, setShowPagoForm] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [fondoCustom, setFondoCustom] = useState(() => localStorage.getItem("sobres_fondo") || "");
  const [pilar, setPilar] = useState(esPublica ? (perfil?.pilar_actual || 1) : 4);
  const [showTransicion, setShowTransicion] = useState(null);
  const [esPro, setEsPro] = useState(!esPublica || !!perfil?.es_pro);
  const [showProModal, setShowProModal] = useState(false);

  const cargarDatos = useCallback(async () => {
    if (!cuentaId) return;
    const [sobresRes, gastosRes, cierresRes, pagosRes, msiRes, tarjetasRes, cuentaRes] = await Promise.all([
      supabase.from("sobres").select("*").eq("cuenta_id", cuentaId).eq("activo", true).order("orden"),
      supabase.from("gastos").select("*").eq("cuenta_id", cuentaId).order("fecha", { ascending: false }),
      supabase.from("cierres").select("*").eq("cuenta_id", cuentaId).order("semana", { ascending: false }),
      supabase.from("pagos_recurrentes").select("*").eq("cuenta_id", cuentaId).order("nombre"),
      supabase.from("compras_msi").select("*").eq("cuenta_id", cuentaId).order("fecha_compra", { ascending: false }),
      supabase.from("tarjetas").select("*").eq("cuenta_id", cuentaId).order("nombre"),
      supabase.from("cuentas").select("presupuesto_semanal, inicio_sobres").eq("id", cuentaId).single(),
    ]);
    if (sobresRes.error || gastosRes.error || cierresRes.error) { setErr("Error cargando datos."); setLoading(false); return; }
    setSobres(sobresRes.data || []); setGastos(gastosRes.data || []); setCierres(cierresRes.data || []);
    setPagos(pagosRes.data || []); setMsi(msiRes.data || []); setTarjetas(tarjetasRes.data || []);
    if (cuentaRes.data) {
      setPresupSemanal(Number(cuentaRes.data.presupuesto_semanal) || 3000);
      if (cuentaRes.data.inicio_sobres) setInicioSobres(cuentaRes.data.inicio_sobres);
    }
    setLoading(false);

    programarNotificaciones(pagosRes.data || [], tarjetasRes.data || []);

    const result = await autoClose(sobresRes.data || [], gastosRes.data || [], cierresRes.data || [], cuentaId, weekStartOf, weekOf);
    if (result.nuevos.length > 0) {
      setCierres((prev) => [...prev, ...result.nuevos]);
      const { data: sa } = await supabase.from("sobres").select("*").eq("cuenta_id", cuentaId).eq("activo", true).order("orden");
      if (sa) setSobres(sa);
    }
  }, [cuentaId, weekStartOf, weekOf]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  useEffect(() => {
    if (!cuentaId) return;
    const channel = supabase.channel("datos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "gastos", filter: `cuenta_id=eq.${cuentaId}` }, (payload) => {
        if (payload.eventType === "INSERT") setGastos((prev) => [payload.new, ...prev]);
        else if (payload.eventType === "DELETE") setGastos((prev) => prev.filter((g) => g.id !== payload.old.id));
        else if (payload.eventType === "UPDATE") setGastos((prev) => prev.map((g) => (g.id === payload.new.id ? payload.new : g)));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sobres", filter: `cuenta_id=eq.${cuentaId}` }, () => {
        supabase.from("sobres").select("*").eq("cuenta_id", cuentaId).eq("activo", true).order("orden").then(({ data }) => { if (data) setSobres(data); });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "cierres", filter: `cuenta_id=eq.${cuentaId}` }, () => {
        supabase.from("cierres").select("*").eq("cuenta_id", cuentaId).order("semana", { ascending: false }).then(({ data }) => { if (data) setCierres(data); });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [cuentaId]);

  // --- Pilares: avance automatico ---
  const semanasConGastos = new Set(gastos.map((g) => weekOf(g.fecha))).size;
  const avanzarPilar = useCallback(async (nuevoPilar) => {
    if (nuevoPilar <= pilar || !esPublica) return;
    setPilar(nuevoPilar);
    setShowTransicion(getTransicion(nuevoPilar));
    await supabase.from("perfiles").update({ pilar_actual: nuevoPilar }).eq("user_id", perfil.user_id);
  }, [pilar, perfil?.user_id]);

  const avanzarManual = useCallback(() => {
    avanzarPilar(Math.min(pilar + 1, 4));
  }, [pilar, avanzarPilar]);

  useEffect(() => {
    if (!esPublica || loading) return;
    const sugerido = calcPilarSugerido(pilar, gastos.length, cierres.length, semanasConGastos);
    if (sugerido > pilar) avanzarPilar(sugerido);
  }, [gastos.length, cierres.length, semanasConGastos, pilar, loading, avanzarPilar]);

  useEffect(() => {
    const visibles = getTabsVisibles(pilar);
    if (!visibles.includes(tab)) setTab("semana");
  }, [pilar, tab]);

  // Crashlytics + review prompt
  useEffect(() => {
    initCrashlytics(perfil?.user_id);
    markFirstUse();
  }, []);

  useEffect(() => {
    if (gastos.length > 0 && gastos.length % 20 === 0) tryRequestReview();
  }, [gastos.length]);

  // Ads: inicializar y mostrar banner segun pilar (Pro = sin ads)
  const gastosCountRef = useRef(gastos.length);
  useEffect(() => {
    if (esPro) return;
    initAds().then(() => {
      if (shouldShowAds(pilar)) {
        showBanner(pilar);
        prepareInterstitial(pilar);
      }
    });
    return () => { hideBanner(); };
  }, [esPro]);

  useEffect(() => {
    if (esPro) { hideBanner(); return; }
    if (shouldShowAds(pilar)) { showBanner(pilar); prepareInterstitial(pilar); }
    else hideBanner();
  }, [pilar, esPro]);

  const handleUpgradePro = async () => {
    setEsPro(true);
    setShowProModal(false);
    hideBanner();
    await supabase.from("perfiles").update({ es_pro: true }).eq("user_id", perfil.user_id);
  };

  const addGasto = async (gasto) => {
    const { error } = await supabase.from("gastos").insert({ ...gasto, cuenta_id: cuentaId, usuario_id: perfil.user_id });
    if (error) throw error;
    gastosCountRef.current += 1;
    if (!esPro && gastosCountRef.current % 5 === 0 && shouldShowAds(pilar)) {
      setTimeout(() => showInterstitial(pilar), 800);
    }
  };
  const deleteGasto = async (id) => {
    const { error } = await supabase.from("gastos").delete().eq("id", id);
    if (error) setErr("Error al borrar gasto.");
    else setGastos((prev) => prev.filter((g) => g.id !== id));
  };
  const editGasto = async (id, cambios) => {
    const { error } = await supabase.from("gastos").update(cambios).eq("id", id);
    if (error) throw error;
    setGastos((prev) => prev.map((g) => (g.id === id ? { ...g, ...cambios } : g)));
  };

  const saveSobre = async ({ id, saldo_inicial, ...datos }) => {
    if (id) { const { error } = await supabase.from("sobres").update(datos).eq("id", id); if (error) throw error; }
    else {
      const maxOrden = sobres.filter((s) => !s.es_ahorro).length;
      const { error } = await supabase.from("sobres").insert({ ...datos, cuenta_id: cuentaId, saldo_acumulado: saldo_inicial || 0, es_ahorro: false, orden: maxOrden + 1 });
      if (error) throw error;
    }
  };
  const deleteSobre = async (id) => { const { error } = await supabase.from("sobres").update({ activo: false }).eq("id", id); if (error) throw error; setSobres((prev) => prev.filter((s) => s.id !== id)); };
  const savePresup = async (valor) => { const { error } = await supabase.from("cuentas").update({ presupuesto_semanal: valor }).eq("id", cuentaId); if (error) { setErr("Error al guardar presupuesto."); return; } setPresupSemanal(valor); };

  const savePago = async ({ id, ...datos }) => {
    if (id) { const { error } = await supabase.from("pagos_recurrentes").update(datos).eq("id", id); if (error) throw error; setPagos((prev) => prev.map((p) => (p.id === id ? { ...p, ...datos } : p))); }
    else { const { data, error } = await supabase.from("pagos_recurrentes").insert({ ...datos, cuenta_id: cuentaId }).select().single(); if (error) throw error; setPagos((prev) => [...prev, data]); }
  };
  const deletePago = async (id) => { const { error } = await supabase.from("pagos_recurrentes").delete().eq("id", id); if (error) throw error; setPagos((prev) => prev.filter((p) => p.id !== id)); };

  const saveMSI = async ({ id, ...datos }) => {
    if (id) { const { error } = await supabase.from("compras_msi").update(datos).eq("id", id); if (error) throw error; setMsi((prev) => prev.map((m) => (m.id === id ? { ...m, ...datos } : m))); }
    else { const { data, error } = await supabase.from("compras_msi").insert({ ...datos, cuenta_id: cuentaId }).select().single(); if (error) throw error; setMsi((prev) => [...prev, data]); }
  };
  const deleteMSI = async (id) => { const { error } = await supabase.from("compras_msi").update({ activo: false }).eq("id", id); if (error) throw error; setMsi((prev) => prev.map((m) => m.id === id ? { ...m, activo: false } : m)); };

  const saveTarjeta = async ({ id, ...datos }) => {
    if (id) { const { error } = await supabase.from("tarjetas").update(datos).eq("id", id); if (error) throw error; setTarjetas((prev) => prev.map((t) => (t.id === id ? { ...t, ...datos } : t))); }
    else { const { data, error } = await supabase.from("tarjetas").insert({ ...datos, cuenta_id: cuentaId }).select().single(); if (error) throw error; setTarjetas((prev) => [...prev, data]); }
  };
  const deleteTarjeta = async (id) => { const { error } = await supabase.from("tarjetas").update({ activo: false }).eq("id", id); if (error) throw error; setTarjetas((prev) => prev.map((t) => t.id === id ? { ...t, activo: false } : t)); };

  const configSaldos = async (updates) => {
    for (const { id, saldo_acumulado } of updates) {
      const { error } = await supabase.from("sobres").update({ saldo_acumulado }).eq("id", id);
      if (error) throw error;
    }
    const { data } = await supabase.from("sobres").select("*").eq("cuenta_id", cuentaId).eq("activo", true).order("orden");
    if (data) setSobres(data);
  };

  const navToWeek = (weekOffset) => { setOffset(weekOffset); setTab("semana"); };

  const pagarRecurrente = (pago) => { setShowPagoForm({ monto: String(pago.monto_estimado), sobre_id: pago.destino_sobre_id || "", fuera: !pago.destino_sobre_id, medio_pago: pago.medio_pago || "debito", categoria: pago.categoria, nota: pago.nombre, _pagoId: pago.id }); };
  const confirmarPago = async (gasto) => {
    await addGasto(gasto);
    setShowPagoForm(null);
  };
  const posponerPago = async (id) => { const sig = toStr(addDays(new Date(), 7)); await supabase.from("pagos_recurrentes").update({ pospuesto_hasta: sig }).eq("id", id); setPagos((prev) => prev.map((p) => (p.id === id ? { ...p, pospuesto_hasta: sig } : p))); };

  const pagarTarjeta = (tarjeta, estimado) => {
    const pagoRec = pagos.find((p) => p.tarjeta_id === tarjeta.id);
    const montoEst = estimado?.total || (pagoRec ? Number(pagoRec.monto_estimado) : 0);
    setShowPagoForm({
      monto: String(Math.round(montoEst)), fuera: true, medio_pago: "debito",
      categoria: "tarjetas", nota: `Pago ${tarjeta.nombre}`,
      _pagoId: pagoRec?.id || null,
    });
  };

  const cambiarTema = async (t) => {
    setTemaState(t);
    await supabase.from("perfiles").update({ tema: t }).eq("user_id", perfil.user_id);
  };

  const cambiarFondo = (dataUrl) => {
    setFondoCustom(dataUrl);
    if (dataUrl) localStorage.setItem("sobres_fondo", dataUrl);
    else localStorage.removeItem("sobres_fondo");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F4ED" }}><div className="text-sm" style={{ color: "#5A6B85" }}>Abriendo tu libreta...</div></div>;

  const ALL_TABS = [
    { id: "semana", label: "Semana", Icon: Notebook },
    { id: "libreta", label: "Libreta", Icon: BookOpen },
    { id: "sobres", label: "Sobres", Icon: Mail },
    { id: "pagos", label: "Pagos", Icon: CreditCard },
    { id: "analisis", label: "Analisis", Icon: BarChart3 },
  ];
  const tabsVisibles = getTabsVisibles(pilar);
  const TABS = ALL_TABS.filter((t) => tabsVisibles.includes(t.id));

  const temaObj = TEMAS[tema] || TEMAS.claro;
  const hoy = new Date();
  const viewedWS = toStr(addDays(weekStartOf(hoy), offset * 7));

  return (
    <div className={`app-root md3 min-h-screen${fondoCustom ? " has-bg" : ""}`} style={{
      "--paper": temaObj.paper, "--line": temaObj.line, "--card": temaObj.card,
      "--ink": temaObj.ink, "--ink-soft": temaObj.inkSoft, "--green": temaObj.green,
      "--amber": temaObj.amber, "--red": temaObj.red, "--flap": temaObj.flap, "--accent": temaObj.accent || temaObj.ink,
      background: fondoCustom ? `url(${fondoCustom}) center/cover fixed` : temaObj.bg,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .app-root { font-family: 'Nunito', system-ui, sans-serif; color: var(--ink); letter-spacing: -0.01em; }
        .num { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
        .sobre-card { position: relative; background: var(--card); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
        .has-bg .sobre-card, .has-bg .chip { backdrop-filter: blur(12px); background: color-mix(in srgb, var(--card) 85%, transparent); }
        .sobre-flap { position: absolute; top: 0; left: 0; right: 0; height: 13px; background: var(--flap); clip-path: polygon(0 0, 100% 0, 50% 100%); }
        .chip { font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--line); background: var(--paper); color: var(--ink); transition: all .15s; }
        .nav-arrow { width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--line); background: var(--card); color: var(--ink); display: flex; align-items: center; justify-content: center; }
        input::placeholder { color: #9AA6B8; }
        .has-bg .content-glass { background: color-mix(in srgb, var(--paper) 80%, transparent); backdrop-filter: blur(16px) saturate(1.3); border-radius: 20px; padding: 16px; margin: -16px; margin-bottom: 0; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }

        /* === Material Design 3 overrides (solo version publica) === */
        .md3 .sobre-card { border: none; border-radius: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06); }
        .md3 .sobre-flap { height: 11px; border-radius: 0 0 50% 50% / 0 0 100% 100%; clip-path: none; }
        .md3 .chip { border: none; border-radius: 8px; background: color-mix(in srgb, var(--ink) 8%, transparent); font-weight: 600; padding: 7px 14px; }
        .md3 .chip:active { transform: scale(0.96); }
        .md3 .nav-arrow { border: none; border-radius: 12px; background: color-mix(in srgb, var(--ink) 6%, transparent); }
        .md3 input, .md3 select { border-radius: 12px !important; }
        .md3 .md3-card { background: var(--card); border-radius: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06); border: none; }

        /* MD3 Nav bar */
        .md3-nav { border-top: none !important; box-shadow: 0 -1px 6px rgba(0,0,0,.06); }
        .md3-nav-item { position: relative; gap: 2px; }
        .md3-nav-pill { position: absolute; top: 6px; left: 50%; transform: translateX(-50%); width: 0; height: 28px; border-radius: 14px; background: color-mix(in srgb, var(--green) 16%, transparent); transition: width .25s cubic-bezier(.2,0,0,1); }
        .md3-nav-item.active .md3-nav-pill { width: 56px; }
        .md3-nav-item .md3-nav-icon { position: relative; z-index: 1; }

        /* MD3 FAB */
        .md3-fab { position: fixed; bottom: 88px; right: max(16px, calc(50% - 224px + 16px)); z-index: 15; width: 56px; height: 56px; border-radius: 16px; background: var(--green); color: #fff; border: none; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,.2), 0 1px 3px rgba(0,0,0,.1); transition: transform .15s, box-shadow .15s; cursor: pointer; }
        .md3-fab:active { transform: scale(0.94); box-shadow: 0 1px 4px rgba(0,0,0,.15); }

        /* MD3 Bottom sheet */
        .md3-sheet-backdrop { background: rgba(0,0,0,.32) !important; }
        .md3-sheet { border-radius: 28px 28px 0 0 !important; animation: md3SlideUp .3s cubic-bezier(.2,0,0,1); }
        .md3-drag-handle { width: 32px; height: 4px; border-radius: 2px; background: color-mix(in srgb, var(--ink) 25%, transparent); margin: 10px auto 6px; }
        @keyframes md3SlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

        /* MD3 buttons */
        .md3 .md3-btn-filled { border: none; border-radius: 20px; font-weight: 600; letter-spacing: .01em; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
        .md3 .md3-btn-filled:active { box-shadow: none; transform: scale(0.98); }
        .md3 .md3-btn-tonal { border: none; border-radius: 20px; background: color-mix(in srgb, var(--green) 12%, transparent); color: var(--green); font-weight: 600; }
        .md3 .md3-btn-outlined { background: transparent; border: 1px solid var(--line); border-radius: 20px; font-weight: 600; }
      `}</style>

      <div className="max-w-md mx-auto px-4 pt-5 pb-28">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-extrabold" style={{ color: "var(--ink)" }}>Sobres semanales</h1>
            <p className="text-xs" style={{ color: "var(--ink-soft)" }}>Hola, {perfil?.nombre}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(true)} className="flex items-center justify-center w-8 h-8 rounded-xl" style={{ color: "var(--ink-soft)", background: "color-mix(in srgb, var(--ink) 6%, transparent)" }}>
              <Settings size={16} />
            </button>
            <button onClick={logout} className="flex items-center justify-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl" style={{ color: "var(--ink-soft)", background: "color-mix(in srgb, var(--ink) 6%, transparent)" }}>
              <LogOut size={13} /> Salir
            </button>
          </div>
        </header>

        {err && <div className="text-xs rounded-xl px-3 py-2 mb-3" style={{ background: "#FBEAE5", color: "var(--red)" }}>{err}</div>}

        {esPublica && pilar === 1 && tab === "semana" && (
          <GuiaPilar1 gastosCount={gastos.length} onAvanzar={avanzarManual} />
        )}

        {tab === "semana" && <TabSemana sobres={sobres} gastos={gastos} cierres={cierres} pagos={pagos} tarjetas={tarjetas} msi={msi} presupSemanal={presupSemanal} offset={offset} setOffset={setOffset} onAdd={addGasto} onDelete={deleteGasto} onEditGasto={editGasto} onPagar={pagarRecurrente} onPosponer={posponerPago} onPagarTarjeta={pagarTarjeta} />}
        {tab === "libreta" && <TabLibreta sobres={sobres} gastos={gastos} tarjetas={tarjetas} onEditGasto={editGasto} onDelete={deleteGasto} />}
        {tab === "sobres" && <TabSobres sobres={sobres} gastos={gastos} cierres={cierres} presupSemanal={presupSemanal} onSaveSobre={saveSobre} onDeleteSobre={deleteSobre} onSavePresup={savePresup} onConfigSaldos={configSaldos} />}
        {tab === "pagos" && <TabPagos pagos={pagos} sobres={sobres} msi={msi} tarjetas={tarjetas} gastos={gastos} onSavePago={savePago} onDeletePago={deletePago} onPagar={pagarRecurrente} onSaveMSI={saveMSI} onDeleteMSI={deleteMSI} onSaveTarjeta={saveTarjeta} onDeleteTarjeta={deleteTarjeta} onPagarTarjeta={pagarTarjeta} />}
        {tab === "analisis" && <TabAnalisis gastos={gastos} sobres={sobres} tarjetas={tarjetas} presupSemanal={presupSemanal} onNavToWeek={navToWeek} inicioSobres={inicioSobres} />}
      </div>

      {showPagoForm && <GastoForm sobres={sobres} tarjetas={tarjetas} viewedWS={viewedWS} isCurrent={true} onAdd={confirmarPago} onClose={() => setShowPagoForm(null)} prefill={showPagoForm} />}
      {showSettings && <SettingsPanel tema={tema} onChangeTema={cambiarTema} fondoCustom={fondoCustom} onChangeFondo={cambiarFondo} onClose={() => setShowSettings(false)} esPro={esPro} onShowPro={() => { setShowSettings(false); setShowProModal(true); }} gastos={gastos} sobres={sobres} pagos={pagos} tarjetas={tarjetas} />}
      {showProModal && <ProModal onClose={() => setShowProModal(false)} onUpgrade={handleUpgradePro} />}

      <PilarTransicion transicion={showTransicion} onContinuar={() => {
        const destino = showTransicion?.tabDestino;
        setShowTransicion(null);
        if (destino && tabsVisibles.includes(destino)) setTab(destino);
      }} />

      <nav className="fixed bottom-0 left-0 right-0 z-20 md3-nav" style={{ background: fondoCustom ? `${temaObj.card}CC` : `${temaObj.card}EE`, backdropFilter: fondoCustom ? "blur(16px) saturate(1.4)" : "blur(6px)" }}>
        <div className="max-w-md mx-auto flex">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2.5 flex flex-col items-center md3-nav-item${tab === t.id ? " active" : ""}`} style={{ color: tab === t.id ? "var(--ink)" : "var(--ink-soft)" }}>
              <div className="md3-nav-pill" />
              <span className="md3-nav-icon"><t.Icon size={20} strokeWidth={tab === t.id ? 2.2 : 1.5} /></span>
              <div className="text-[10px] font-semibold mt-0.5">{t.label}</div>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

/* ============================================================
   Root
   ============================================================ */
export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}

function AppContent() {
  const { session, perfil, cargando } = useAuth();
  const [pinOk, setPinOk] = useState(!hasPin() || isUnlocked());
  const [showLogin, setShowLogin] = useState(false);
  const [tourDone, setTourDone] = useState(!needsTour());

  if (cargando) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F4ED" }}><div className="text-sm" style={{ color: "#5A6B85" }}>Cargando...</div></div>;
  if (!session) {
    if (esPublica && !showLogin) return <Landing onLogin={() => setShowLogin(true)} />;
    return <Login />;
  }
  if (!perfil) return <OnboardingWizard />;
  if (!tourDone) return <WelcomeTour onDone={() => { markTourDone(); setTourDone(true); }} />;
  if (hasPin() && !pinOk) return <PinLock nombre={perfil.nombre} onUnlock={() => setPinOk(true)} />;
  return <CuentaProvider cuentaId={perfil.cuenta_id}><AppMain /></CuentaProvider>;
}

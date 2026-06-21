import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { MONEDAS, getMonedaConfig, DIAS_INICIO_OPTIONS, CATEGORIAS_DEFAULT, createMoneyFormatter } from "../lib/config";

const PLANTILLAS = [
  { id: "hogar_mexicano", nombre: "Hogar", emoji: "🏠", desc: "11 sobres para gastos del hogar" },
  { id: "estudiante", nombre: "Estudiante", emoji: "📚", desc: "6 sobres para vida universitaria" },
  { id: "basico", nombre: "Basico", emoji: "✨", desc: "4 sobres esenciales" },
];

export default function OnboardingWizard() {
  const { setupPerfil, logout } = useAuth();
  const [paso, setPaso] = useState(0);
  const [nombre, setNombre] = useState("");
  const [moneda, setMoneda] = useState("MXN");
  const [plantilla, setPlantilla] = useState("basico");
  const [diaInicio, setDiaInicio] = useState(6);
  const [sobresPreview, setSobresPreview] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    supabase.from("plantillas_sobres").select("*").eq("plantilla", plantilla).order("orden")
      .then(({ data }) => { if (data) setSobresPreview(data); });
  }, [plantilla]);

  const money = createMoneyFormatter(moneda);

  const siguiente = () => {
    if (paso === 0 && !nombre.trim()) { setError("Escribe tu nombre."); return; }
    setError("");
    setPaso(paso + 1);
  };

  const atras = () => setPaso(Math.max(0, paso - 1));

  const crear = async () => {
    setCargando(true);
    setError("");
    try {
      await setupPerfil(nombre.trim(), moneda, plantilla, diaInicio);
    } catch (err) {
      setError(err.message);
      setCargando(false);
    }
  };

  const monedaCfg = getMonedaConfig(moneda);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F6F4ED" }}>
      <div className="w-full max-w-sm">
        <div className="flex gap-1 mb-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i <= paso ? "#16a34a" : "#E0DDD5" }} />
          ))}
        </div>

        {paso === 0 && (
          <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #E0DDD5" }}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">👋</div>
              <h1 className="text-xl font-bold" style={{ color: "#22324A" }}>Bienvenido</h1>
              <p className="text-xs mt-1" style={{ color: "#5A6B85" }}>Como te llamas?</p>
            </div>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre"
              autoFocus className="w-full rounded-xl px-3 py-2.5 text-sm mb-4 outline-none"
              style={{ border: "1px solid #E0DDD5", color: "#22324A", background: "#F6F4ED" }} />

            <p className="text-xs font-bold mb-2" style={{ color: "#5A6B85", textTransform: "uppercase", letterSpacing: "0.05em" }}>Moneda</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {MONEDAS.map((m) => {
                const cfg = getMonedaConfig(m);
                return (
                  <button key={m} onClick={() => setMoneda(m)} className="rounded-xl py-2 px-2 text-center text-sm font-semibold"
                    style={moneda === m
                      ? { background: "#16a34a", color: "#fff", border: "2px solid #16a34a" }
                      : { background: "#F6F4ED", color: "#22324A", border: "2px solid #E0DDD5" }}>
                    {cfg.flag} {m}
                  </button>
                );
              })}
            </div>

            <p className="text-xs font-bold mb-2" style={{ color: "#5A6B85", textTransform: "uppercase", letterSpacing: "0.05em" }}>La semana empieza el</p>
            <div className="flex gap-2 mb-4">
              {DIAS_INICIO_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setDiaInicio(opt.value)} className="flex-1 rounded-xl py-2 text-sm font-semibold"
                  style={diaInicio === opt.value
                    ? { background: "#16a34a", color: "#fff", border: "2px solid #16a34a" }
                    : { background: "#F6F4ED", color: "#22324A", border: "2px solid #E0DDD5" }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {error && <div className="text-xs mb-3 rounded-xl px-3 py-2" style={{ background: "#FBEAE5", color: "#dc2626" }}>{error}</div>}
            <button onClick={siguiente} className="w-full rounded-xl py-3 font-bold text-sm" style={{ background: "#16a34a", color: "#fff" }}>Siguiente</button>
            <button type="button" onClick={logout} className="w-full text-xs font-semibold mt-3 py-1" style={{ color: "#5A6B85" }}>Cerrar sesion</button>
          </div>
        )}

        {paso === 1 && (
          <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #E0DDD5" }}>
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold" style={{ color: "#22324A" }}>Elige una plantilla</h2>
              <p className="text-xs mt-1" style={{ color: "#5A6B85" }}>Podras personalizar despues</p>
            </div>
            <div className="space-y-2 mb-4">
              {PLANTILLAS.map((p) => (
                <button key={p.id} onClick={() => setPlantilla(p.id)} className="w-full rounded-xl px-4 py-3 text-left flex items-center gap-3"
                  style={plantilla === p.id
                    ? { background: "#16a34a15", border: "2px solid #16a34a" }
                    : { background: "#F6F4ED", border: "2px solid #E0DDD5" }}>
                  <span className="text-2xl">{p.emoji}</span>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "#22324A" }}>{p.nombre}</div>
                    <div className="text-xs" style={{ color: "#5A6B85" }}>{p.desc}</div>
                  </div>
                  {plantilla === p.id && <span className="ml-auto text-lg">✓</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={atras} className="flex-1 rounded-xl py-3 font-bold text-sm" style={{ background: "#F6F4ED", color: "#22324A", border: "1px solid #E0DDD5" }}>Atras</button>
              <button onClick={siguiente} className="flex-1 rounded-xl py-3 font-bold text-sm" style={{ background: "#16a34a", color: "#fff" }}>Siguiente</button>
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #E0DDD5" }}>
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold" style={{ color: "#22324A" }}>Tus sobres</h2>
              <p className="text-xs mt-1" style={{ color: "#5A6B85" }}>Vista previa — podras editar en la app</p>
            </div>
            <div className="space-y-1.5 mb-4 max-h-64 overflow-y-auto">
              {sobresPreview.map((s, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "#F6F4ED", border: "1px solid #E0DDD5" }}>
                  <span>{s.emoji}</span>
                  <span className="text-sm font-semibold flex-1" style={{ color: "#22324A" }}>{s.nombre}</span>
                  <span className="text-xs font-mono" style={{ color: "#5A6B85" }}>{money(Number(s.aportacion_semanal))}/sem</span>
                  {s.es_ahorro && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#16a34a22", color: "#16a34a" }}>AHORRO</span>}
                </div>
              ))}
              {sobresPreview.length === 0 && (
                <div className="text-center py-4 text-xs" style={{ color: "#5A6B85" }}>Cargando sobres...</div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={atras} className="flex-1 rounded-xl py-3 font-bold text-sm" style={{ background: "#F6F4ED", color: "#22324A", border: "1px solid #E0DDD5" }}>Atras</button>
              <button onClick={siguiente} className="flex-1 rounded-xl py-3 font-bold text-sm" style={{ background: "#16a34a", color: "#fff" }}>Siguiente</button>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #E0DDD5" }}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-lg font-bold" style={{ color: "#22324A" }}>Todo listo!</h2>
            </div>
            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-sm px-1">
                <span style={{ color: "#5A6B85" }}>Nombre</span>
                <span className="font-semibold" style={{ color: "#22324A" }}>{nombre}</span>
              </div>
              <div className="flex justify-between text-sm px-1">
                <span style={{ color: "#5A6B85" }}>Moneda</span>
                <span className="font-semibold" style={{ color: "#22324A" }}>{monedaCfg.flag} {moneda}</span>
              </div>
              <div className="flex justify-between text-sm px-1">
                <span style={{ color: "#5A6B85" }}>Plantilla</span>
                <span className="font-semibold" style={{ color: "#22324A" }}>{PLANTILLAS.find((p) => p.id === plantilla)?.nombre}</span>
              </div>
              <div className="flex justify-between text-sm px-1">
                <span style={{ color: "#5A6B85" }}>Semana inicia</span>
                <span className="font-semibold" style={{ color: "#22324A" }}>{DIAS_INICIO_OPTIONS.find((o) => o.value === diaInicio)?.label}</span>
              </div>
              <div className="flex justify-between text-sm px-1">
                <span style={{ color: "#5A6B85" }}>Sobres</span>
                <span className="font-semibold" style={{ color: "#22324A" }}>{sobresPreview.length}</span>
              </div>
            </div>
            {error && <div className="text-xs mb-3 rounded-xl px-3 py-2" style={{ background: "#FBEAE5", color: "#dc2626" }}>{error}</div>}
            <div className="flex gap-2">
              <button onClick={atras} className="flex-1 rounded-xl py-3 font-bold text-sm" style={{ background: "#F6F4ED", color: "#22324A", border: "1px solid #E0DDD5" }}>Atras</button>
              <button onClick={crear} disabled={cargando} className="flex-1 rounded-xl py-3 font-bold text-sm"
                style={{ background: "#16a34a", color: "#fff", opacity: cargando ? 0.6 : 1 }}>
                {cargando ? "Creando..." : "Crear mi cuenta"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

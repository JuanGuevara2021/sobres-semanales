import { APP_VERSION } from "../lib/version";

const FEATURES = [
  { icon: "✉️", title: "Sobres semanales", desc: "Divide tu presupuesto en sobres por concepto y controla cuánto te queda" },
  { icon: "📝", title: "Libreta de gastos", desc: "Registra cada gasto con categoría, medio de pago y nota" },
  { icon: "💰", title: "Ahorro automático", desc: "Lo que sobra de tus sobres se acumula sin que tengas que pensarlo" },
  { icon: "📊", title: "Análisis visual", desc: "Gráficas por categoría, tendencias y patrones de gasto" },
  { icon: "🔄", title: "Sincronizado", desc: "Usa la app en varios dispositivos — todo se actualiza al instante" },
  { icon: "🔒", title: "Privado y seguro", desc: "Tus datos están protegidos con conexión segura y solo tu cuenta puede acceder a ellos" },
];

const STEPS = [
  { num: "1", text: "Elige una plantilla de sobres o crea la tuya" },
  { num: "2", text: "Registra tus gastos día a día" },
  { num: "3", text: "Al cerrar la semana, el sobrante se ahorra solo" },
];

export default function Landing({ onLogin }) {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #0B7A4B 0%, #064E2B 40%, #22324A 100%)" }}>

      {/* Hero */}
      <div className="px-5 pt-14 pb-10 text-center max-w-lg mx-auto">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-5" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}>
          <span className="text-5xl">✉️</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
          Sobres Semanales
        </h1>
        <p className="text-base mt-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
          Ahorra sin pensarlo — controla tus gastos semana a semana con el método de sobres
        </p>

        <div className="flex flex-col gap-3 mt-8 max-w-xs mx-auto">
          <button onClick={onLogin}
            className="w-full rounded-2xl py-3.5 font-bold text-sm shadow-lg"
            style={{ background: "#fff", color: "#0B7A4B" }}>
            Comenzar gratis
          </button>
        </div>
      </div>

      {/* Cómo funciona */}
      <div className="px-5 py-10 max-w-lg mx-auto">
        <h2 className="text-lg font-extrabold text-white text-center mb-6">Cómo funciona</h2>
        <div className="space-y-4">
          {STEPS.map((s) => (
            <div key={s.num} className="flex items-start gap-4 rounded-2xl px-4 py-4"
              style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(5px)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0"
                style={{ background: "#0B7A4B", color: "#fff" }}>{s.num}</div>
              <p className="text-sm font-medium pt-1" style={{ color: "rgba(255,255,255,0.85)" }}>{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="px-5 py-10 max-w-lg mx-auto">
        <h2 className="text-lg font-extrabold text-white text-center mb-6">Todo lo que necesitas</h2>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(5px)" }}>
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-sm font-bold text-white mb-1">{f.title}</div>
              <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA final */}
      <div className="px-5 py-10 pb-16 max-w-lg mx-auto text-center">
        <p className="text-sm font-medium mb-5" style={{ color: "rgba(255,255,255,0.6)" }}>
          Empieza hoy — gratis, sin anuncios y sin compromisos
        </p>
        <button onClick={onLogin}
          className="rounded-2xl px-10 py-3.5 font-bold text-sm shadow-lg"
          style={{ background: "#fff", color: "#0B7A4B" }}>
          Crear mi cuenta gratis
        </button>
      </div>

      {/* Footer */}
      <div className="px-5 py-6 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          <a href="/terminos.html" className="hover:underline">Términos</a>
          <span className="mx-2">·</span>
          <a href="/privacidad.html" className="hover:underline">Privacidad</a>
          <span className="mx-2">·</span>
          <a href="mailto:soporte@sobressemanales.com" className="hover:underline">Contacto</a>
        </div>
        <div className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
          Sobres Semanales v{APP_VERSION}
        </div>
      </div>
    </div>
  );
}

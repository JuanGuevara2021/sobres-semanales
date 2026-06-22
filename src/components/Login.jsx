import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login, registro } = useAuth();
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [msgRegistro, setMsgRegistro] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMsgRegistro("");
    setCargando(true);
    try {
      if (modo === "login") {
        await login(email, password);
      } else {
        await registro(email, password);
        setMsgRegistro("Revisa tu correo para confirmar la cuenta.");
      }
    } catch (err) {
      setError(
        err.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : err.message
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #0B7A4B 0%, #064E2B 40%, #22324A 100%)" }}>
      <div className="flex-1 flex flex-col items-center justify-center px-5">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}>
            <span className="text-4xl">✉️</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Sobres Semanales</h1>
          <p className="text-sm mt-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>
            Tu libreta de gastos + cartera de sobres
          </p>
        </div>

        <div className="w-full max-w-sm">
          <form onSubmit={submit} className="rounded-2xl p-5 shadow-xl" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)" }}>

            <h2 className="text-base font-bold mb-4" style={{ color: "#22324A" }}>
              {modo === "login" ? "Iniciar sesion" : "Crear cuenta"}
            </h2>

            <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#5A6B85" }}>Correo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required autoFocus
              className="w-full rounded-xl px-3.5 py-2.5 text-sm mb-3 outline-none transition-shadow focus:ring-2 focus:ring-emerald-400/40"
              style={{ border: "1px solid #E3DECF", color: "#22324A", background: "#F6F4ED" }} />

            <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#5A6B85" }}>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required minLength={6}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm mb-4 outline-none transition-shadow focus:ring-2 focus:ring-emerald-400/40"
              style={{ border: "1px solid #E3DECF", color: "#22324A", background: "#F6F4ED" }} />

            {error && (
              <div className="text-xs mb-3 rounded-xl px-3 py-2 flex items-center gap-1.5" style={{ background: "#FBEAE5", color: "#B3402A" }}>
                <span>⚠</span> {error}
              </div>
            )}
            {msgRegistro && (
              <div className="text-xs mb-3 rounded-xl px-3 py-2 flex items-center gap-1.5" style={{ background: "#E7F3EC", color: "#0B7A4B" }}>
                <span>✓</span> {msgRegistro}
              </div>
            )}

            <button type="submit" disabled={cargando}
              className="w-full rounded-xl py-3 font-bold text-sm shadow-md transition-opacity"
              style={{ background: "linear-gradient(135deg, #0B7A4B, #0a6b42)", color: "#fff", opacity: cargando ? 0.6 : 1 }}>
              {cargando ? "Cargando..." : modo === "login" ? "Entrar" : "Crear cuenta"}
            </button>

            <div className="text-center mt-4">
              <button type="button"
                onClick={() => { setModo(modo === "login" ? "registro" : "login"); setError(""); setMsgRegistro(""); }}
                className="text-xs font-semibold py-1" style={{ color: "#5A6B85" }}>
                {modo === "login" ? "No tengo cuenta — registrarme" : "Ya tengo cuenta — entrar"}
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3 mt-5 px-2">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Seguro y privado</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
          </div>

          <div className="flex justify-center gap-6 mt-3 mb-4">
            {[["🔒", "Encriptado"], ["📱", "Sincronizado"], ["💰", "Gratuito"]].map(([icon, label]) => (
              <div key={label} className="text-center">
                <div className="text-lg">{icon}</div>
                <div className="text-[10px] font-semibold mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</div>
              </div>
            ))}
          </div>

          <div className="text-center mb-6">
            <a href="/terminos.html" target="_blank" className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>Terminos de servicio</a>
            <span className="mx-2 text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <a href="/privacidad.html" target="_blank" className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>Privacidad</a>
          </div>
        </div>
      </div>
    </div>
  );
}

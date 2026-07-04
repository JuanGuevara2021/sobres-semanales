import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { traducirErrorAuth } from "../lib/authErrors";

/* Campo de contraseña con "ojito" para verla (feedback de tester 2026-07-04) */
function CampoPassword({ label, value, onChange, show, onToggle, placeholder = "••••••" }) {
  return (
    <>
      <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#5A6B85" }}>{label}</label>
      <div className="relative mb-3">
        <input type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} required minLength={6}
          className="w-full rounded-xl px-3.5 py-2.5 pr-11 text-sm outline-none transition-shadow focus:ring-2 focus:ring-emerald-400/40"
          style={{ border: "1px solid #E3DECF", color: "#22324A", background: "#F6F4ED" }} />
        <button type="button" onClick={onToggle} aria-label={show ? "Ocultar contraseña" : "Ver contraseña"}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5" style={{ color: "#5A6B85" }}>
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </>
  );
}

export default function Login() {
  const { login, registro, recuperar } = useAuth();
  const [modo, setModo] = useState("login"); // login | registro | recuperar
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cambiarModo = (m) => { setModo(m); setError(""); setMensaje(""); setPassword2(""); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    if (modo === "registro" && password !== password2) {
      setError("Las contraseñas no coinciden. Escríbelas de nuevo.");
      return;
    }
    setCargando(true);
    try {
      if (modo === "login") {
        await login(email, password);
      } else if (modo === "registro") {
        await registro(email, password);
        setMensaje("Revisa tu correo para confirmar la cuenta (también en spam).");
      } else {
        await recuperar(email);
        setMensaje("Te mandamos un correo con el enlace para cambiar tu contraseña. Revisa tu bandeja y spam.");
      }
    } catch (err) {
      setError(traducirErrorAuth(err.message));
    } finally {
      setCargando(false);
    }
  };

  const titulos = { login: "Iniciar sesion", registro: "Crear cuenta", recuperar: "Recuperar contraseña" };
  const botones = { login: "Entrar", registro: "Crear cuenta", recuperar: "Enviarme el enlace" };

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

            <h2 className="text-base font-bold mb-1" style={{ color: "#22324A" }}>{titulos[modo]}</h2>
            {modo === "recuperar" && (
              <p className="text-xs mb-3" style={{ color: "#5A6B85" }}>
                Escribe tu correo y te mandamos un enlace para poner una contraseña nueva.
              </p>
            )}
            {modo !== "recuperar" && <div className="mb-3" />}

            <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wide" style={{ color: "#5A6B85" }}>Correo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required
              className="w-full rounded-xl px-3.5 py-2.5 text-sm mb-3 outline-none transition-shadow focus:ring-2 focus:ring-emerald-400/40"
              style={{ border: "1px solid #E3DECF", color: "#22324A", background: "#F6F4ED" }} />

            {modo !== "recuperar" && (
              <CampoPassword label="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)}
                show={showPass} onToggle={() => setShowPass(!showPass)} />
            )}

            {modo === "registro" && (
              <CampoPassword label="Confirma tu contraseña" value={password2} onChange={(e) => setPassword2(e.target.value)}
                show={showPass} onToggle={() => setShowPass(!showPass)} placeholder="Escríbela otra vez" />
            )}

            {modo === "login" && (
              <div className="text-right mb-3 -mt-1">
                <button type="button" onClick={() => cambiarModo("recuperar")}
                  className="text-xs font-semibold underline py-1" style={{ color: "#0B7A4B" }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {error && (
              <div className="text-xs mb-3 rounded-xl px-3 py-2 flex items-center gap-1.5" style={{ background: "#FBEAE5", color: "#B3402A" }}>
                <span>⚠</span> {error}
              </div>
            )}
            {mensaje && (
              <div className="text-xs mb-3 rounded-xl px-3 py-2 flex items-center gap-1.5" style={{ background: "#E7F3EC", color: "#0B7A4B" }}>
                <span>✓</span> {mensaje}
              </div>
            )}

            <button type="submit" disabled={cargando}
              className="w-full rounded-xl py-3 font-bold text-sm shadow-md transition-opacity"
              style={{ background: "linear-gradient(135deg, #0B7A4B, #0a6b42)", color: "#fff", opacity: cargando ? 0.6 : 1 }}>
              {cargando ? "Cargando..." : botones[modo]}
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: "#E3DECF" }} />
              <span className="text-[10px] font-semibold" style={{ color: "#5A6B85" }}>o</span>
              <div className="flex-1 h-px" style={{ background: "#E3DECF" }} />
            </div>

            {/* Boton real con contraste (antes era un texto gris que nadie veia) */}
            <button type="button"
              onClick={() => cambiarModo(modo === "login" ? "registro" : "login")}
              className="w-full rounded-xl py-2.5 font-bold text-sm"
              style={{ background: "#fff", color: "#0B7A4B", border: "2px solid #0B7A4B" }}>
              {modo === "login" ? "No tengo cuenta — Registrarme" : "Ya tengo cuenta — Entrar"}
            </button>
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

/* Pantalla para poner la contraseña nueva al llegar desde el enlace del correo */
export function NuevaPassword() {
  const { cambiarPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== password2) { setError("Las contraseñas no coinciden. Escríbelas de nuevo."); return; }
    setCargando(true);
    try {
      await cambiarPassword(password); // al terminar, AuthContext deja pasar a la app
    } catch (err) {
      setError(traducirErrorAuth(err.message));
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "linear-gradient(160deg, #0B7A4B 0%, #064E2B 40%, #22324A 100%)" }}>
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl p-5 shadow-xl" style={{ background: "rgba(255,255,255,0.95)" }}>
        <h2 className="text-base font-bold mb-1" style={{ color: "#22324A" }}>Nueva contraseña</h2>
        <p className="text-xs mb-4" style={{ color: "#5A6B85" }}>Pon tu contraseña nueva y vuelve a entrar con ella la próxima vez.</p>

        <CampoPassword label="Contraseña nueva" value={password} onChange={(e) => setPassword(e.target.value)}
          show={showPass} onToggle={() => setShowPass(!showPass)} />
        <CampoPassword label="Confírmala" value={password2} onChange={(e) => setPassword2(e.target.value)}
          show={showPass} onToggle={() => setShowPass(!showPass)} placeholder="Escríbela otra vez" />

        {error && (
          <div className="text-xs mb-3 rounded-xl px-3 py-2 flex items-center gap-1.5" style={{ background: "#FBEAE5", color: "#B3402A" }}>
            <span>⚠</span> {error}
          </div>
        )}

        <button type="submit" disabled={cargando}
          className="w-full rounded-xl py-3 font-bold text-sm shadow-md"
          style={{ background: "linear-gradient(135deg, #0B7A4B, #0a6b42)", color: "#fff", opacity: cargando ? 0.6 : 1 }}>
          {cargando ? "Guardando..." : "Guardar y entrar"}
        </button>
      </form>
    </div>
  );
}

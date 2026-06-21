import { useState, useEffect, useCallback } from "react";

const PIN_KEY = "sobres_pin";
const PIN_OK_KEY = "sobres_pin_ok";

export function hasPin() {
  return !!localStorage.getItem(PIN_KEY);
}

export function isUnlocked() {
  return sessionStorage.getItem(PIN_OK_KEY) === "1";
}

export function setPin(pin) {
  if (pin) localStorage.setItem(PIN_KEY, pin);
  else localStorage.removeItem(PIN_KEY);
}

export function clearUnlock() {
  sessionStorage.removeItem(PIN_OK_KEY);
}

export default function PinLock({ nombre, onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const pin = localStorage.getItem(PIN_KEY);

  const checkPin = useCallback((val) => {
    if (val === pin) {
      sessionStorage.setItem(PIN_OK_KEY, "1");
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => { setShake(false); setError(false); setInput(""); }, 600);
    }
  }, [pin, onUnlock]);

  const handleKey = useCallback((digit) => {
    if (input.length >= 4) return;
    const next = input + digit;
    setInput(next);
    if (next.length === 4) setTimeout(() => checkPin(next), 150);
  }, [input, checkPin]);

  const handleDelete = () => setInput((p) => p.slice(0, -1));

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key >= "0" && e.key <= "9") handleKey(e.key);
      else if (e.key === "Backspace") handleDelete();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  const keys = [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["", "0", "⌫"]];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: "linear-gradient(160deg, #0B7A4B 0%, #064E2B 40%, #22324A 100%)" }}>

      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
        style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}>
        <span className="text-3xl">🔒</span>
      </div>

      <h1 className="text-lg font-bold text-white mb-1">Hola, {nombre}</h1>
      <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>Ingresa tu PIN</p>

      <div className={`flex gap-3 mb-8 ${shake ? "animate-shake" : ""}`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-4 h-4 rounded-full transition-all duration-150"
            style={{
              background: i < input.length
                ? (error ? "#F87171" : "#fff")
                : "rgba(255,255,255,0.2)",
              transform: i < input.length ? "scale(1.2)" : "scale(1)",
            }} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
        {keys.flat().map((k, i) => {
          if (k === "") return <div key={i} />;
          return (
            <button key={i} onClick={() => k === "⌫" ? handleDelete() : handleKey(k)}
              className="h-14 rounded-2xl text-xl font-semibold transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.12)", color: "#fff", backdropFilter: "blur(4px)" }}>
              {k}
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}

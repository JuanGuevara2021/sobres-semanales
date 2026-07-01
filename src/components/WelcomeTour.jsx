import { useState } from "react";

const TOUR_KEY = "sobres_tour_done";

export function needsTour() {
  return !localStorage.getItem(TOUR_KEY);
}

export function markTourDone() {
  localStorage.setItem(TOUR_KEY, "1");
}

const slides = [
  {
    emoji: "✉️",
    title: "Sobres: tu presupuesto semanal",
    desc: "Reparte tu dinero en sobres cada semana: tianguis, casa, antojos... Cada sobre tiene su limite y no puedes gastar de mas.",
  },
  {
    emoji: "📝",
    title: "Registra cada gasto",
    desc: "Anota lo que gastas dia a dia. Cada gasto se descuenta automaticamente de su sobre. Tu libreta digital siempre contigo.",
  },
  {
    emoji: "🐷",
    title: "Lo que sobra, se ahorra solo",
    desc: "Al cerrar la semana, lo que no gastaste de sobres tipo 'ahorro' pasa al cochinito automaticamente. Sin esfuerzo.",
  },
  {
    emoji: "🔄",
    title: "Sobres que acumulan",
    desc: "Los sobres tipo 'acumula' guardan su saldo entre semanas. Perfectos para gastos que no son cada semana, como salidas o ropa.",
  },
  {
    emoji: "💳",
    title: "Tarjetas y pagos recurrentes",
    desc: "Registra tus tarjetas de credito, configura pagos recurrentes y nunca olvides una fecha de pago. Todo en un solo lugar.",
  },
  {
    emoji: "🏷️",
    title: "Compras a meses sin intereses",
    desc: "Registra tus MSI y ve cuanto te queda por pagar. Calcula automaticamente la carga mensual por tarjeta — sin sorpresas.",
  },
  {
    emoji: "📊",
    title: "Analiza a donde se va tu dinero",
    desc: "Graficas por categoria, por dia, por medio de pago y por tarjeta. Compara semanas y toma mejores decisiones.",
  },
  {
    emoji: "🚀",
    title: "Listo para empezar!",
    desc: "Tu presupuesto semanal ya esta configurado. Registra tu primer gasto y deja que el sistema trabaje por ti.",
  },
];

export default function WelcomeTour({ onDone }) {
  const [idx, setIdx] = useState(0);
  const slide = slides[idx];
  const isLast = idx === slides.length - 1;

  const next = () => {
    if (isLast) {
      markTourDone();
      onDone();
    } else {
      setIdx(idx + 1);
    }
  };

  const skip = () => {
    markTourDone();
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg, #0B7A4B 0%, #064E2B 40%, #22324A 100%)" }}>

      <div className="flex gap-1.5 mb-8 w-full max-w-xs">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i <= idx ? "#fff" : "rgba(255,255,255,0.2)" }} />
        ))}
      </div>

      <div className="flex items-center justify-center w-24 h-24 rounded-3xl mb-6"
        style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}>
        <span className="text-5xl">{slide.emoji}</span>
      </div>

      <h2 className="text-xl font-extrabold text-white text-center mb-3">{slide.title}</h2>
      <p className="text-sm text-center leading-relaxed max-w-xs mb-10" style={{ color: "rgba(255,255,255,0.75)" }}>
        {slide.desc}
      </p>

      <div className="w-full max-w-xs">
        <button onClick={next}
          className="w-full rounded-xl py-3.5 font-bold text-sm shadow-lg transition-all active:scale-95"
          style={{ background: "#fff", color: "#22324A" }}>
          {isLast ? "Comenzar" : "Siguiente"}
        </button>

        {!isLast && (
          <button onClick={skip}
            className="w-full text-xs font-semibold mt-3 py-2"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            Saltar tour
          </button>
        )}
      </div>
    </div>
  );
}

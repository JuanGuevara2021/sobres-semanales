# Design Brief — Sobres Semanales

App de finanzas personales (React 19 + Tailwind CSS v4). Mobile-first (~380px), PWA. Este documento contiene todo lo necesario para rediseñar la interfaz en Claude Design.

---

## 1. DESIGN TOKENS — Sistema de temas

La app usa CSS custom properties aplicadas en el root via `style={{}}`. Hay 5 temas; cada uno define 10 tokens:

### Tema Claro (default)
```
--paper: #F6F4ED    (fondo general, inputs)
--line: #E3DECF     (bordes, separadores)
--card: #FFFFFF     (tarjetas, modales)
--ink: #22324A      (texto principal)
--ink-soft: #5A6B85 (texto secundario, labels)
--green: #0B7A4B    (positivo, botones primarios, ahorro)
--amber: #B07A1F    (advertencia, sobre casi agotado)
--red: #B3402A      (negativo, sobregiro, eliminar)
--flap: #EFEBDF     (solapa triangular del sobre)
--bg: repeating-linear-gradient(to bottom, transparent 0 31px, rgba(34,50,74,.045) 31px 32px), #F6F4ED
```

### Tema Oscuro
```
--paper: #16171F    --line: #2A2C3A    --card: #1E2030
--ink: #E0DEF0      --ink-soft: #8E8CA4
--green: #34D399    --amber: #FBBF24   --red: #F87171
--flap: #2A2C3A     --bg: #16171F
```

### Tema Coquette
```
--paper: #FFF5F7    --line: #F5D0D8    --card: #FFFFFF
--ink: #5C2040      --ink-soft: #9B6B82
--green: #D4608A    --amber: #E8A87C   --red: #C53D4D
--flap: #FDE8EE     --bg: repeating-linear-gradient(...rgba(200,100,140,.06)...), #FFF5F7
```

### Tema Periodico
```
--paper: #F2EFE4    --line: #C8C3B4    --card: #FAFAF5
--ink: #1A1A1A      --ink-soft: #555555
--green: #2D5016    --amber: #8B7500   --red: #8B0000
--flap: #E8E4D8     --bg: repeating-linear-gradient(...rgba(0,0,0,.08)...), #F2EFE4
```

### Tema Mariposas
```
--paper: #F0EEFF    --line: #D0CCEE    --card: #FFFFFF
--ink: #2D1B69      --ink-soft: #7B6FA6
--green: #6B48C8    --amber: #D4A017   --red: #C53D4D
--flap: #E4E0F8     --bg: repeating-linear-gradient(...rgba(100,60,200,.05)...), #F0EEFF
```

**Regla:** SIEMPRE usar `var(--token)` para colores. Nunca hardcodear colores en componentes nuevos.

---

## 2. TIPOGRAFIA

```css
/* Texto general */
font-family: 'Nunito', system-ui, sans-serif;
letter-spacing: -0.01em;
/* Pesos: 400 (body), 600 (semibold), 700 (bold), 800 (extrabold para titulos) */

/* Numeros y montos — clase .num */
font-family: 'IBM Plex Mono', ui-monospace, monospace;
font-variant-numeric: tabular-nums;
/* Pesos: 500, 600 */
```

Google Fonts URL:
```
https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap
```

---

## 3. ESTILOS GLOBALES (CSS)

```css
/* Tarjeta de sobre */
.sobre-card {
  position: relative;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}

/* Solapa triangular del sobre */
.sobre-flap {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 13px;
  background: var(--flap);
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}

/* Chip de seleccion (sobres, categorias, medios pago) */
.chip {
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 9999px;
  border: 1px solid var(--line);
  background: var(--paper);
  color: var(--ink);
  transition: all .15s;
}
/* Chip activo: background: var(--ink), color: #fff, borderColor: var(--ink) */
/* Chip categoria activo: background: <color-categoria>, color: #fff */

/* Flecha de navegacion semanal */
.nav-arrow {
  width: 36px; height: 36px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  display: flex; align-items: center; justify-content: center;
}

/* Glassmorphism cuando hay fondo custom */
.has-bg .sobre-card,
.has-bg .chip {
  backdrop-filter: blur(12px);
  background: color-mix(in srgb, var(--card) 85%, transparent);
}

/* Placeholders */
input::placeholder { color: #9AA6B8; }

/* Accesibilidad */
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
```

---

## 4. CATEGORIAS (colores fijos, usados en badges y graficas)

| Categoria | Label | Color | Uso |
|-----------|-------|-------|-----|
| casa | Casa | `#2563eb` | Despensa, limpieza, servicios |
| renta | Renta | `#7c3aed` | Pago mensual vivienda |
| diversion | Diversion | `#db2777` | Entretenimiento, salidas |
| salud | Salud | `#059669` | Medicos, medicamentos |
| escuela | Escuela | `#d97706` | Colegiaturas, materiales |
| tarjetas | Tarjetas | `#dc2626` | Pagos de credito, deudas |

**Badge de categoria:**
```jsx
<span style={{ background: color + "18", color: color }}>
  {label}
</span>
// "18" = ~9% opacidad del color como fondo
```

---

## 5. ICONOS

Lucide React (stroke icons). Usados actualmente:
- `Notebook` — Tab Semana
- `BookOpen` — Tab Libreta
- `Mail` — Tab Sobres
- `CreditCard` — Tab Pagos
- `BarChart3` — Tab Analisis
- `Settings`, `LogOut`, `Plus`, `Trash2`, `Pencil`, `X`, `Image`, `Check`, `ChevronLeft`, `ChevronRight`

Tab activo: `strokeWidth={2.2}`, color `var(--ink)`
Tab inactivo: `strokeWidth={1.5}`, color `var(--ink-soft)`

---

## 6. COMPONENTES ACTUALES

### Layout principal
```
┌─────────────────────────────┐
│ Header                       │ ← h1 "Sobres semanales" + "Hola, nombre"
│   [Settings] [Salir]         │    + botones derecha
├─────────────────────────────┤
│                              │
│  Tab Content                 │ ← max-w-md mx-auto px-4 pt-5 pb-28
│  (scroll vertical)           │
│                              │
├─────────────────────────────┤
│ Nav inferior (fixed)         │ ← 5 tabs, blur background
│ [Semana][Libreta][Sobres]    │    borderTop: 1px solid var(--line)
│ [Pagos] [Analisis]           │
└─────────────────────────────┘
```

### SobreCard (grid 2 columnas)
```
┌─────────────────────┐
│    △ (flap)          │ ← .sobre-flap, clip-path triangulo
├─────────────────────┤
│ 🛒 Tianguis          │ ← emoji + nombre
│ $350                 │ ← .num, color segun estado (verde/ambar/rojo)
│ de $500/sem          │ ← texto secundario
│ ████████░░░          │ ← barra progreso h-1.5
│ [Casa]               │ ← badge categoria
└─────────────────────┘
```
Estados: verde (>25% disponible), ambar (<=25%), rojo (sobregiro)

### Card resumen semanal (fondo var(--ink))
```
┌─────────────────────────────┐
│ Te queda esta semana         │ ← texto rgba(255,255,255,.65)
│ $1,250                       │ ← .num text-3xl, blanco o #FFB4A0 si negativo
│ Sobres: $1,750 de $3,000     │
│ ████▓▓▓░░░                   │ ← barra categorias multi-color h-2
│ ● Casa $800 ● Diversion $500 │ ← leyenda categorias
└─────────────────────────────┘
```

### Bottom-sheet (modales: GastoForm, ConfigSaldos, Settings, tarjetaForm, pagoForm)
```
Fondo: rgba(34,50,74,.45)
┌─────────────────────────────┐
│ Titulo              [Cerrar] │
│                              │
│ (contenido del formulario)   │
│                              │
│ [██ Boton primario ██]       │ ← var(--green), full-width
└─────────────────────────────┘
Estilo: rounded-t-2xl, max-w-md, maxHeight 90vh, overflow-y-auto
```

### Recordatorios (PROBLEMA: colores hardcodeados, no theme-aware)
```
Tarjetas:  bg #FEF3C7, border #FDE68A  ← amarillo fijo
Pagos:     bg #FFF7ED, border #FED7AA  ← naranja fijo  
Cierre:    bg #E7F3EC, color var(--green) ← parcialmente theme-aware
```

### Fila de gasto (en libreta)
```
┌─────────────────────────────────────────┐
│ 🛒 | Walmart [Casa]  | $350  | ✎ | ✕  │
│    | Tianguis · Efectivo                │
└─────────────────────────────────────────┘
Estilo: rounded-xl, bg var(--card), border 1px solid var(--line)
```

### Nav inferior
```
background: ${temaObj.card}EE (con fondo custom: CC + blur 16px)
borderTop: 1px solid var(--line)
backdropFilter: blur(6px) (sin fondo custom)
```

---

## 7. MEDIOS DE PAGO
Efectivo, Debito, Credito, Transferencia — seleccionados como chips.

---

## 8. PATRON DE FORMULARIOS
Todos los formularios usan el mismo patron:
- Labels: `text-xs font-semibold`, color `var(--ink-soft)`
- Inputs: `rounded-xl px-3 py-2 text-sm`, border `var(--line)`, bg `var(--paper)`
- Seleccion multiple: chips (`.chip`) en flex-wrap gap-1.5
- Boton submit: `rounded-xl py-3 font-bold text-sm`, bg `var(--green)`, full-width
- Errores: `text-xs`, color `var(--red)`

---

## 9. OBJETIVOS DE REDISEÑO (en orden de prioridad)

### 9.1 TabSemana (Home) — Mejor jerarquia visual
**Problema actual:** Todo tiene el mismo peso visual. La card de resumen, los recordatorios, los sobres y la libreta compiten por atencion.
**Lo que quiero:** 
- Que el resumen semanal sea el hero indiscutible
- Los sobres con mejor diferenciacion visual por estado (verde/ambar/rojo)
- La libreta de gastos mas compacta y escaneable
- Transiciones suaves al navegar entre semanas

### 9.2 TabPagos — La vista mas cruda
**Problema actual:** 3 secciones (tarjetas, pagos recurrentes, compras MSI) se ven como una lista interminable. Los formularios son funciones internas largas sin estructura visual.
**Lo que quiero:**
- Separacion visual clara entre secciones con headers distinguibles
- Las tarjetas de credito con un diseño tipo "tarjeta fisica" (no solo texto)
- Los MSI con mejor visualizacion del progreso
- Los formularios inline convertidos a bottom-sheets consistentes

### 9.3 Nav inferior + Header
**Problema actual:** Header muy simple (solo texto), nav sin indicador activo fuerte.
**Lo que quiero:**
- Indicador activo visible (dot, barra, background) en la nav
- Header con mas personalidad pero sin ocupar mas espacio
- Posible: mostrar el saldo restante en el header cuando no estas en TabSemana

### 9.4 Recordatorios theme-aware
**Problema actual:** Los recordatorios de tarjetas (bg `#FEF3C7`) y pagos (bg `#FFF7ED`) usan colores fijos que no respetan el tema oscuro ni los otros temas.
**Solucion:** Derivar los colores de los tokens del tema:
```
// Propuesta para recordatorios
Tarjetas: bg var(--amber) con 10% opacidad, border var(--amber) con 25% opacidad
Pagos:    bg var(--green) con 10% opacidad, border var(--green) con 25% opacidad
// Funciona en todos los temas automaticamente
```

### 9.5 Animaciones para bottom-sheets
**Problema actual:** Los modales aparecen instantaneamente sin transicion.
**Lo que quiero:**
- Slide-up con ease-out al abrir
- Fade del backdrop
- Posiblemente: drag-to-dismiss

---

## 10. CONSTRAINTS

- **Mobile-first siempre** — ancho principal ~380px, max-w-md (448px)
- **5 temas deben funcionar** — diseña con tokens, verifica en tema oscuro
- **Moneda MXN** — formato `$1,234` sin decimales normalmente
- **Emojis como iconos de sobres** — no reemplazar con iconos vectoriales
- **Lucide React para iconos UI** — no mezclar con otra libreria
- **Tailwind para layout** — flex, grid, padding, margin, rounded, text sizes
- **Colores siempre via `var(--token)`** — nunca clases Tailwind de color
- **Nunito + IBM Plex Mono** — no cambiar tipografia
- **Sin router** — navegacion por tabs con useState, no agregar react-router
- **pb-28 en contenido** — espacio para nav inferior fixed

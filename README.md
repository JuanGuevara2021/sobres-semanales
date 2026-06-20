# Sobres Semanales

App de finanzas personales que une la **libreta de gastos** (registro diario con categoria)
con la **cartera de sobres** (presupuesto semanal por concepto). Dos tipos de cierre:
los sobres tipo "ahorro" pasan sobrante al Ahorro y reinician; los tipo "acumula" arrastran saldo.

## Stack

- React 19 + Vite 8
- Tailwind CSS 4 (via plugin de Vite)
- Supabase (Postgres + Auth + Realtime)

## Como correr el proyecto localmente

Requisitos: Node.js 20+ y npm.

```bash
# 1. Instalar dependencias (solo la primera vez)
npm install

# 2. Crear archivo .env con tus credenciales de Supabase
# (ya debe existir si Claude Code lo creo)
# VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
# VITE_SUPABASE_ANON_KEY=tu-anon-key

# 3. Levantar el servidor de desarrollo
npm run dev
```

Vite imprime una URL local (normalmente `http://localhost:5173`). Abrela en el navegador.
Para probar la vista movil: F12 → icono de dispositivo movil → ancho ~380px.

## Setup de Supabase (primera vez)

1. Ejecuta `supabase/schema.sql` en Supabase → SQL Editor (crea tablas, indices, RLS)
2. Registra tu usuario en la app (pantalla de registro)
3. Ejecuta `supabase/seed.sql` en Supabase → SQL Editor (crea sobres y carga datos historicos)
   - Antes de ejecutar el seed, reemplaza `<USER_ID>` con tu UUID de auth.users
   - Para obtener tu UUID: `SELECT id FROM auth.users WHERE email = 'tu@email.com';`
4. Descomenta el bloque de INSERT de gastos en seed.sql y ejecutalo

## Otros comandos

```bash
npm run build     # genera la version de produccion en dist/
npm run preview   # sirve localmente lo que hay en dist/
```

## Estructura

```
src/
  main.jsx              # punto de entrada de React
  App.jsx               # app principal con Supabase
  index.css             # importa Tailwind
  lib/
    supabase.js          # cliente de Supabase
  contexts/
    AuthContext.jsx       # manejo de sesion y perfil
  components/
    Login.jsx             # pantalla de login/registro
    SetupPerfil.jsx       # setup de primera vez
supabase/
  schema.sql             # esquema de la base de datos v2.1
  seed.sql               # datos iniciales (sobres + gastos historicos)
SobresSemanales.jsx      # prototipo original (referencia, no se usa en el build)
```

## Documentacion

- `CLAUDE.md` — contexto del proyecto y reglas de negocio v2.1
- `ROADMAP.md` — fases y backlog (F1-F6)
- `docs/DECISIONES.md` — bitacora de decisiones y supuestos
- `docs/PLAN_COMERCIAL.md` — analisis de mercado, competencia, proyecciones de ingreso y roadmap de comercializacion
- `ESPECIFICACIONES_V2.1.md` — especificaciones completas del modelo v2.1

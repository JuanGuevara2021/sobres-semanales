# ROADMAP — Sobres Semanales

Etiquetas: **[JUAN]** = solo tu puedes hacerlo · **[CC]** = lo hace Claude Code en la terminal

---

## Fase 0 — Preparacion (una sola vez)

- [x] **[JUAN]** Crear carpeta del proyecto y colocar dentro: `CLAUDE.md`, `ROADMAP.md` y `SobresSemanales.jsx`
- [x] **[JUAN]** Crear cuenta en https://supabase.com
- [x] **[JUAN]** En Supabase: New Project → nombre `sobres-semanales` → region mas cercana → guardar contrasena de la base
- [x] **[JUAN]** En Supabase: Settings → API → copiar `Project URL` y `anon public key`
- [ ] **[JUAN]** Crear cuenta en https://vercel.com (boton "Sign Up", entra con tu GitHub)
- [x] **[JUAN]** Abrir terminal en la carpeta del proyecto y ejecutar `claude`

## Fase 1 — App corriendo local en tu PC

- [x] **[CC]** Crear proyecto Vite + React y estructura de carpetas
- [x] **[CC]** Portar `SobresSemanales.jsx` al proyecto (guardado local temporal mientras llega Supabase)
- [x] **[CC]** Crear `README.md` con instrucciones para correr el proyecto
- [x] **[CC]** Levantar servidor de desarrollo (`npm run dev`)
- [ ] **[JUAN]** Abrir la URL local en el navegador y validar que la app funciona igual que el prototipo

## Fase 2 — Datos compartidos con Supabase (modelo v2.1)

- [x] **[CC]** Escribir esquema SQL v2.1: tablas `cuentas`, `perfiles`, `sobres`, `gastos`, `cierres`, `pagos_recurrentes`, `compras_msi` + enum `categoria_t` + politicas RLS
- [x] **[CC]** Crear `.env` con URL y anon key de Supabase
- [x] **[JUAN]** Ejecutar el SQL del archivo `supabase/schema.sql` en Supabase → SQL Editor
- [x] **[CC]** Crear seed de datos base (`supabase/seed_base.sql`) y ~292 gastos historicos (`supabase/seed_gastos.sql`)
- [x] **[CC]** Instalar `@supabase/supabase-js` y crear cliente en `src/lib/supabase.js`
- [x] **[CC]** Conectar la app a Supabase: login (correo y contrasena), lectura/escritura de sobres y gastos
- [x] **[CC]** Migrar la logica de cierre semanal para que corra contra la base
- [x] **[CC]** Activar sincronizacion en tiempo real (un gasto registrado en un telefono aparece en el otro)
- [x] **[CC]** Migracion v2.1b: `presupuesto_semanal` en cuentas, `frecuencia`/`medio_pago` en pagos_recurrentes, seed de 12 pagos
- [ ] **[JUAN]** Crear los 2 usuarios (tu correo y el de la otra persona) cuando la pantalla de registro exista
- [ ] **[JUAN]** Prueba de fuego: registrar un gasto desde dos navegadores a la vez y ver que se sincroniza

## Fase 3 — PWA en los celulares

- [x] **[CC]** Configurar la PWA: manifest, iconos, service worker (funciona aunque se vaya el internet un momento)
- [x] **[CC]** Crear repositorio Git, primer commit y subir a GitHub → https://github.com/JuanGuevara2021/sobres-semanales
- [ ] **[JUAN]** En Vercel: Add New Project → importar el repo de GitHub → pegar las 2 variables de entorno (URL y anon key) → Deploy
- [ ] **[JUAN]** Abrir la URL de Vercel en cada celular → menu del navegador → "Agregar a pantalla de inicio"
- [ ] **[JUAN]** Usarla 2 semanas completas (el experimento que acordamos)

## Fase 4 — Features v2.1

### F1 — Registro con doble dimension (sobre + categoria)
- [x] **[CC]** Formulario de gasto con selector de sobre (chips) + chip "Fuera de sobres"
- [x] **[CC]** Al elegir sobre, auto-llenar categoria con su default + selector secundario visible para cambiarla
- [x] **[CC]** Al elegir "Fuera de sobres", selector de categoria obligatorio
- [x] **[CC]** Badge de color de categoria en la libreta junto al sobre
- [ ] **[JUAN]** Validar: todo gasto tiene categoria no nula

### F2 — Vista semanal completa
- [x] **[CC]** Resumen superior: total general (sobres + fuera) con desglose por categoria (barras de color + etiquetas)
- [x] **[CC]** Tarjetas de sobre (control de presupuesto)
- [x] **[CC]** Libreta con filtro: Todos / Solo sobres / Solo fuera de sobres
- [x] **[CC]** Cada entrada muestra sobre (si aplica) + categoria como badge

### F3 — Pagos recurrentes con recordatorio
- [x] **[CC]** CRUD de pagos recurrentes con nombre, monto, dia, destino sobre, categoria, frecuencia, medio de pago
- [x] **[CC]** Seed con los 12 pagos recurrentes iniciales
- [x] **[CC]** Banner recordatorio 3 dias antes del dia de pago
- [x] **[CC]** Boton "Ya pague" que genera gasto con sobre + categoria prellenados (monto editable)
- [x] **[CC]** Boton "Posponer"

### F4 — Compras a meses (MSI)
- [x] **[CC]** CRUD de compras MSI: concepto, monto total, tarjeta, meses, fecha compra, mes primer pago, dia corte
- [x] **[CC]** Estatus calculado desde fecha actual (pendiente/activo/liquidado) con barra de progreso
- [x] **[CC]** Vista de carga mensual comprometida

### F5 — Analisis por categoria
- [x] **[CC]** Nueva pestana "Analisis" con graficas recharts
- [x] **[CC]** (a) Gasto por dia de la semana (barras, toggle $/# compras)
- [x] **[CC]** (b) Gasto por semana y por mes (toggle Sem/Mes)
- [x] **[CC]** (c) Gasto por categoria (dona con leyenda)
- [x] **[CC]** (d) Distribucion porcentual con selector de ventana (2, 3, 4 semanas)
- [x] **[CC]** (e) Tendencia semanal vs presupuesto total (linea de meta)
- [x] **[CC]** (f) Toggle global: incluir/excluir tarjetas y renta

### F6 — Temas visuales
- [x] **[CC]** Temas: Claro, Oscuro, Coquette, Periodico, Mariposas (CSS variables + selector)
- [x] **[CC]** Selector por usuario en ajustes (guardado en perfiles.tema)

### F7 — Frecuencias semanal y quincenal en pagos recurrentes (2026-06-16)
- [x] **[CC]** Pagos semanales: selector de dia de la semana (Lun, Mar, etc.)
- [x] **[CC]** Pagos quincenales: dos dias del mes (ej: dia 1 y dia 15)
- [x] **[CC]** Recordatorios ajustados a cada frecuencia

### F8 — Mejoras de usabilidad (2026-06-20)
- [x] **[CC]** Permitir registrar gastos en semanas pasadas (boton visible siempre, no solo semana actual)
- [x] **[CC]** Permitir borrar gastos en semanas pasadas
- [x] **[CC]** Mostrar sobre de Ahorro como card en la vista semanal (saldo acumulado + aportacion + gastado)

---

## Bugs corregidos

### Presupuesto y sobres (2026-06-16)
- [x] **[CC]** Presupuesto semanal solo descuenta gastos asignados a sobres, no los "fuera de sobres" (`01057d9`)

### Tarjetas y MSI (2026-06-16)
- [x] **[CC]** Tarjetas refactorizadas como entidad informativa: solo muestran MSI activos y dia de corte/pago (`88485da`, `9cdde45`)
- [x] **[CC]** Pagos recurrentes de tarjetas usan monto MSI calculado en vez de monto fijo (`26fdf77`)
- [x] **[CC]** Recordatorio de pago de tarjeta usa `dia_pago` de la tarjeta, no del pago recurrente (`ccf9af1`)
- [x] **[CC]** Carga mensual en pestana Pagos usa montos reales (MSI calculado para tarjetas) (`ff3ce16`)
- [x] **[CC]** MSI liquidados ya no suman en la carga de la tarjeta ni en pagos recurrentes (`d5f462c`)
- [x] **[CC]** Al marcar "Ya pague" en tarjeta, los MSI avanzan un mes pagado (`ff3ce16`)

### Pagos recurrentes (2026-06-16)
- [x] **[CC]** Alertas de pagos recurrentes aparecen correctamente segun ventana de dias (`b0be4f5`)

### Graficas (2026-06-16)
- [x] **[CC]** Eje Y visible en grafica de gasto por dia de la semana (`db8fe5a`)

---

> Backlog abierto:
> - [ ] Revisar regla de sobregiro tras el periodo de prueba
> - [ ] Respaldo automatico de la base (export periodico gratuito)

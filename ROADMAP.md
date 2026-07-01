# ROADMAP — Sobres Semanales

Etiquetas: **[JUAN]** = solo tu puedes hacerlo · **[CC]** = lo hace Claude Code en la terminal

---

## Fase 0 — Preparacion (una sola vez)

- [x] **[JUAN]** Crear carpeta del proyecto y colocar dentro: `CLAUDE.md`, `ROADMAP.md` y `SobresSemanales.jsx`
- [x] **[JUAN]** Crear cuenta en https://supabase.com
- [x] **[JUAN]** En Supabase: New Project → nombre `sobres-semanales` → region mas cercana → guardar contrasena de la base
- [x] **[JUAN]** En Supabase: Settings → API → copiar `Project URL` y `anon public key`
- [x] **[JUAN]** Crear cuenta en https://vercel.com (boton "Sign Up", entra con tu GitHub)
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
- [x] **[JUAN]** Crear los 2 usuarios (tu correo y el de la otra persona) cuando la pantalla de registro exista
- [x] **[JUAN]** Prueba de fuego: registrar un gasto desde dos navegadores a la vez y ver que se sincroniza

## Fase 3 — PWA en los celulares

- [x] **[CC]** Configurar la PWA: manifest, iconos, service worker (funciona aunque se vaya el internet un momento)
- [x] **[CC]** Crear repositorio Git, primer commit y subir a GitHub → https://github.com/JuanGuevara2021/sobres-semanales
- [x] **[JUAN]** En Vercel: Add New Project → importar el repo de GitHub → pegar las 2 variables de entorno (URL y anon key) → Deploy
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

## Fase C — Comercializacion (Google Play)

### Estado actual: preparando version publica

#### Fase C1 — Preparar app para usuarios publicos ✅ COMPLETADA (2026-06-28)

- [x] **[CC]** Onboarding para nuevos usuarios (wizard con plantillas de sobres)
- [x] **[CC]** Tour de bienvenida (7 slides explicando el metodo)
- [x] **[CC]** Dia de inicio de semana configurable (sabado, lunes, domingo)
- [x] **[CC]** Soporte para multiples monedas (MXN, COP, ARS, PEN, CLP, USD)
- [x] **[CC]** Flag `VITE_APP_MODE` (personal vs public) en `src/lib/appMode.js`
- [x] **[CC]** Sistema de pilares progresivos en `src/lib/pilares.js`
- [x] **[CC]** Migracion SQL: `pilar_actual` en tabla perfiles
- [x] **[CC]** Terminos de servicio (`docs/TERMINOS_DE_SERVICIO.md`)
- [x] **[CC]** Politica de privacidad (`docs/POLITICA_DE_PRIVACIDAD.md`)
- [x] **[CC]** Documentacion de pilares (`docs/PILARES_ONBOARDING.md`)
- [x] **[CC]** Plan comercial con analisis de mercado, proyecciones y estrategia de ads (`docs/PLAN_COMERCIAL.md`)

#### Fase C2 — Look Material Design 3 ✅ COMPLETADA (2026-06-28)

- [x] **[CC]** Adaptar look de la version publica a Material Design 3 (Material You)
- [x] **[CC]** Botones: filled, outlined, tonal (3 niveles)
- [x] **[CC]** Cards: elevacion sutil, bordes mas redondeados (20px, sin border, shadow)
- [x] **[CC]** Nav inferior: pill indicator en tab activo
- [x] **[CC]** FAB (boton flotante) para "Registrar gasto"
- [x] **[CC]** Bottom sheets: slide-up con drag handle + animacion
- [x] **[CC]** Chips: mas redondeados, estilo tonal (sin borde, fondo sutil)
- [x] **[CC]** Solo aplica a `VITE_APP_MODE=public`, la version personal no cambia

#### Fase C3 — Publicar en Google Play (EN PROGRESO)

- [x] **[CC]** Generar keystore de firma (`~/.android-keystore/sobres-semanales.jks`)
- [x] **[CC]** Configurar signing release en `android/app/build.gradle`
- [x] **[CC]** Generar AAB firmado v1.0.0 (`android/app/release/sobres-semanales-v1.0.0.aab`, 3.2 MB)
- [x] **[CC]** Script de build release (`build-release.sh`)
- [x] **[CC]** Preparar textos de tienda: titulo, descripcion, data safety (`docs/GOOGLE_PLAY_LISTING.md`)
- [x] **[JUAN]** Crear cuenta de Google Play Developer ($25 USD, pago unico) — en verificacion
- [x] **[JUAN/CC]** Crear icono 512x512 y feature graphic 1024x500
- [x] **[JUAN]** Tomar capturas de pantalla de la app (9 capturas en `store-assets/`)
- [ ] **[JUAN]** Subir AAB y assets a Google Play Console
- [ ] **[JUAN]** Llenar formularios: clasificacion, declaracion de datos (guia en `docs/GOOGLE_PLAY_LISTING.md`)
- [ ] **[JUAN]** Pegar URLs: `https://sobres-semanales.vercel.app/terminos.html` y `/privacidad.html`
- [ ] **[JUAN]** Enviar a revision (tarda 1-7 dias para apps nuevas)

#### Fase C4 — Monetizacion base (EN PROGRESO)

- [x] **[JUAN]** Crear cuenta en Google AdMob (admob.google.com, gratis)
- [x] **[CC]** Instalar plugin Capacitor para AdMob (`@capacitor-community/admob`)
- [x] **[CC]** Modulo `src/lib/ads.js`: logica centralizada de ads por pilar
- [x] **[CC]** Configurar banner (abajo del contenido) — escalado por pilar
- [x] **[CC]** Configurar interstitial (cada 5 gastos, min 3 min entre c/u) — escalado por pilar
- [x] **[CC]** AndroidManifest con App ID de AdMob (IDs de prueba, cambiar por reales)
- [x] **[JUAN]** Crear ad units en AdMob (banner + interstitial) y dar IDs reales
- [x] **[CC]** IDs reales configurados en `ads.js` y AndroidManifest
- [x] **[CC]** Modulo `src/lib/pro.js`: logica Pro (RevenueCat, exportar CSV)
- [x] **[CC]** Campo `es_pro` en tabla perfiles (migracion SQL aplicada)
- [x] **[CC]** Modal "Hazte Pro" con beneficios y boton de compra
- [x] **[CC]** 3 temas Pro (Oceano, Bosque, Medianoche) con candado en Ajustes
- [x] **[CC]** Exportar gastos a CSV (funcion Pro)
- [x] **[CC]** Pro = sin anuncios (ads se ocultan automaticamente)
- [x] **[CC]** Banner dorado "Hazte Pro" en Ajustes (solo version gratuita)
- [x] **[JUAN]** Crear cuenta en RevenueCat (revenuecat.com, gratis hasta $2.5k/mes)
- [x] **[JUAN]** En RevenueCat: crear app Android, crear entitlement "pro", crear producto "sobres_pro_anual"
- [x] **[CC]** Configurar API key real de RevenueCat en `src/lib/pro.js`
- [x] **[CC]** Cambiar `isTesting: true` a produccion en `ads.js` (auditoria 2026-06-28)
- [ ] **[JUAN]** En Google Play Console: crear suscripcion "sobres_pro_anual" ($120 MXN/año)

#### Fase C5 — Feedback y bugs de usuarios (EN PROGRESO)

- [x] **[CC]** Boton "Reportar problema" en Ajustes (abre correo con info del dispositivo)
- [x] **[CC]** Boton "Sugerir mejora" en Ajustes (abre correo prellenado)
- [ ] **[JUAN]** Crear correo soporte@sobressemanales.com (puede ser alias de Gmail)
- [ ] **[JUAN]** Crear correo privacidad@sobressemanales.com (puede ser alias de Gmail)
- [x] **[CC]** Integrar Firebase Crashlytics (`src/lib/crashlytics.js`, gradle configurado)
- [x] **[CC]** Prompt de resena en Google Play (`src/lib/review.js`, despues de 14 dias, 1 vez)
- [x] **[JUAN]** Crear proyecto Firebase y descargar `google-services.json` a `android/app/`

#### Fase C6 — Landing page y presencia

- [x] **[CC]** Landing page integrada (`src/components/Landing.jsx`)
- [x] **[CC]** Hero con logo, titulo y subtitulo
- [x] **[CC]** Seccion "Como funciona" (3 pasos visuales)
- [x] **[CC]** Grid de 6 features (sobres, libreta, ahorro, analisis, sync, seguridad)
- [x] **[CC]** Comparacion Gratis vs Pro (solo version publica)
- [x] **[CC]** Boton de descarga a Play Store + CTA "Comenzar gratis"
- [x] **[CC]** Footer con links a terminos, privacidad y contacto
- [ ] **[JUAN]** Comprar dominio (ej: sobressemanales.com, ~$200 MXN/ano)

#### Fase C7 — Crecimiento organico (continuo desde mes 3)

- [ ] Contenido en TikTok/Reels: tips de finanzas usando la app
- [ ] SEO del landing: "app para controlar gastos semanal", "sobres de presupuesto Mexico"
- [ ] Pedir resenas en Play Store despues de 2 semanas de uso
- [ ] Referidos: "Invita a tu pareja/roommate" (la app ya soporta 2 usuarios)

#### Fase C8 — Publicidad personalizada (mes 6-12)

- [ ] **[CC]** Implementar `perfilParaAds()`: categoria top, nivel gasto, uso tarjetas
- [ ] **[CC]** Enviar custom signals a AdMob (anonimizados, sin datos personales)
- [ ] A/B testing de formatos y frecuencia
- [ ] Medir eCPM real vs generico

#### Fase C8b — Analytics y metricas (mes 3-6)

- [ ] **[CC]** Integrar Firebase Analytics o similar para medir retencion y conversion
- [ ] **[CC]** Eventos clave: registro, primer gasto, cierre de semana, compra Pro
- [ ] **[JUAN]** Revisar dashboard de metricas mensualmente

#### Fase C9 — Expansion hispanoamerica (ano 2-3)

- [ ] Adaptar landing y assets de tienda por pais
- [ ] Marketing en redes por pais
- [ ] Considerar partnerships con influencers de finanzas

---

## Calidad y deuda tecnica

### Tests (2026-07-01)
- [x] **[CC]** Extraer logica pura de cierres a `src/lib/cierres.js` (separada de Supabase)
- [x] **[CC]** Suite Vitest: 26 tests de cierres semanales y helpers de semana (`npm test`)
- [x] **[CC]** Tests para logica de MSI y pagos recurrentes: extraida a `src/lib/pagos.js`, 20 tests
- [x] **[CC]** Smoke tests E2E con Playwright (`e2e/smoke.spec.js`, `npm run test:e2e`): login, credenciales invalidas, registrar/borrar gasto. Usuario de prueba: e2e-test-sobres@mailinator.com
- [ ] **[CC]** Seguir modularizando `App.jsx` (2,300+ lineas): extraer TabAnalisis, TabPagos, Ajustes

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

### Sobres y cierres (2026-06-20)
- [x] **[CC]** Arrastrar deficit de sobres ahorro entre semanas (`662156b`)
- [x] **[CC]** Mostrar saldo historico correcto en semanas cerradas (`37909fa`)
- [x] **[CC]** Analisis 2sem/4sem muestra semanas cerradas, no la actual (`8b25882`)
- [x] **[CC]** Sobre Ahorro muestra disponible real: saldo + aportacion - gastado (`0ec4a5a`)

### Bugs corregidos por Juan (2026-06-28)
- [x] **[JUAN]** Sobres no se acumulaban correctamente (fix directo)

### Bugs encontrados por los tests E2E (2026-07-01)
- [x] **[CC]** Gasto recien registrado no aparecia en la libreta si el canal realtime aun no conectaba (ej. primer gasto tras onboarding); addGasto ahora actualiza el estado local de inmediato
- [x] **[CC]** El OnboardingWizard aparecia por un instante al hacer login mientras cargaba el perfil; ahora se muestra "Cargando..." hasta resolver

---

> Backlog abierto:
> - [ ] Revisar regla de sobregiro tras el periodo de prueba
> - [ ] Respaldo automatico de la base (export periodico gratuito)

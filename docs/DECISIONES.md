# Bitácora de decisiones

Formato: fecha · decisión · alternativas consideradas · por qué.

---

## 2026-06-12 — Guardado temporal con `localStorage`

**Decisión:** mientras llega Supabase (Fase 2), la app guarda todo en `localStorage` del navegador.

**Alternativas:** IndexedDB, archivo JSON descargable.

**Por qué:** el prototipo usaba `window.storage`, una API del entorno donde se creó que no
existe en navegadores. `localStorage` es la traducción directa (mismo patrón llave→JSON),
no requiere librerías y se va a tirar completo en Fase 2, así que no vale la pena algo más
robusto. Limitación conocida: los datos viven solo en ese navegador/dispositivo.

## 2026-06-12 — Tailwind CSS 4 con plugin de Vite

**Decisión:** instalar `tailwindcss` + `@tailwindcss/vite` y un solo `@import "tailwindcss"` en `index.css`.

**Alternativas:** Tailwind 3 (con `tailwind.config.js` + PostCSS), CSS a mano.

**Por qué:** el prototipo ya está escrito con clases utilitarias de Tailwind (`flex`, `grid-cols-2`,
`rounded-xl`…), así que reescribir el CSS a mano sería trabajo perdido. La versión 4 elimina
los archivos de configuración: el plugin de Vite detecta las clases usadas automáticamente.

## 2026-06-12 — Estructura: Vite armado a mano, prototipo intacto en la raíz

**Decisión:** los archivos del scaffold (package.json, vite.config.js, index.html, src/) se
crearon directamente en la carpeta existente en vez de usar `npm create vite`. El prototipo
`SobresSemanales.jsx` queda en la raíz como referencia; la copia viva es `src/App.jsx`.

**Por qué:** `npm create vite` se rehúsa a escribir en carpetas no vacías (ya estaban CLAUDE.md
y ROADMAP.md) y además genera demo que habría que borrar. El prototipo original se conserva
porque es la referencia validada por Juan; se puede borrar cuando Fase 2 esté estable.

---

## 2026-06-13 — Supuestos v2.1 (ESPECIFICACIONES_V2.1.md seccion E)

Los siguientes supuestos fueron tomados al disenar el modelo v2.1. Juan debe corregir
cualquiera que no aplique.

1. **Sobres tipo `acumula` arrastran saldos negativos** a la siguiente semana.
   Si un sobre acumula queda en -$50, la semana siguiente su disponible sera
   `saldo_acumulado(-50) + aportacion_semanal - gastos_de_la_semana`.

2. **Cambios de aportacion semanal aplican de la semana en curso en adelante.**
   Nunca retroactivos al pasado.

3. **Recordatorios v1 son dentro de la app** (banner), no push notifications.

4. **"Ya pague" registra gasto con monto editable** antes de confirmar.
   El monto estimado del pago recurrente se pre-llena pero el usuario puede cambiarlo.

5. **El rastreador de MSI es informativo** (no genera gastos automaticos).
   Solo muestra estatus y carga mensual comprometida.

6. **El tema visual es preferencia por usuario**, no por cuenta.
   Cada usuario del hogar puede tener su propio tema.

7. **Las 6 categorias son fijas por ahora.**
   Si Juan necesita "Transporte" como categoria separada, se agrega en codigo.

8. **La categoria default de "Antojos" es "diversion"** (comer fuera por gusto).
   Juan puede cambiarla a "casa" si prefiere.

9. **Los presupuestos de los sobres son intencionalmente menores al gasto historico.**
   Objetivo: reduccion progresiva. Los datos historicos (~$4,700/sem promedio vs $3,000
   presupuestados) sirven como linea base para medir el progreso.

## 2026-06-13 — Modelo v2.1: categoria reemplaza categoria_libre

**Decision**: el campo `categoria_libre` (texto libre) de v2.0 se reemplaza por `categoria`
(enum obligatorio de 6 valores) en TODOS los gastos.

**Alternativas consideradas**:
- Mantener texto libre: mas flexible pero imposible de agregar/filtrar consistentemente.
- Enum + campo "otra": compromiso innecesario con solo 6 categorias bien definidas.

**Por que**: las estadisticas y graficas (F5) necesitan categorias consistentes para operar.
Texto libre produciria variantes ("casa", "Casa", "hogar") que rompen los agregados.

## 2026-06-13 — Tipo de cierre por sobre (ahorro vs acumula)

**Decision**: cada sobre define su comportamiento al cierre de semana: `ahorro` (sobrante
va al Ahorro y reinicia) o `acumula` (saldo se arrastra).

**Alternativas consideradas**:
- Todos los sobres se reinician (v1): no cubre pagos mensuales que necesitan acumular.
- Todos acumulan: pierde el mecanismo automatico de ahorro que es el objetivo del proyecto.

**Por que**: algunos gastos son semanales (tianguis, antojos) y otros mensuales (plataformas,
servicios). Dos tipos de cierre permiten que el mismo sistema cubra ambos patrones.

## 2026-06-16 — Tarjetas como entidad informativa, no como sobre

**Decision**: las tarjetas de credito no son sobres ni tienen presupuesto propio. Son una
entidad separada que muestra: MSI activos, dia de corte, dia de pago, y carga mensual
comprometida. El pago de la tarjeta se registra desde pagos recurrentes con "Ya pague".

**Alternativas consideradas**:
- Tarjetas como sobres con presupuesto: confuso porque el monto varia mes a mes segun MSI.
- Tarjetas con monto fijo en pagos recurrentes: no refleja la realidad cuando hay MSI que
  se van liquidando.

**Por que**: el monto a pagar de una tarjeta cambia cada mes segun los MSI activos. Calcular
el monto dinamicamente (sumando MSI activos al momento del pago) es mas preciso que un monto
fijo. Ademas, al marcar "Ya pague" los MSI avanzan un mes pagado automaticamente.

## 2026-06-16 — Frecuencias semanal y quincenal en pagos recurrentes

**Decision**: los pagos recurrentes soportan 3 frecuencias: semanal (con dia de la semana),
quincenal (con 2 dias del mes), y mensual (con 1 dia del mes).

**Por que**: algunos pagos como el tianguis o transporte son semanales, y otros como nomina
o servicios caen dos veces al mes. Sin estas frecuencias, los recordatorios no aplican bien.

## 2026-06-20 — Gastos en semanas pasadas

**Decision**: el boton "Registrar gasto" y el boton de borrar ahora estan disponibles en
todas las semanas, no solo en la semana actual.

**Alternativas consideradas**:
- Mantener restriccion a semana actual: mas seguro pero impide corregir olvidos.
- Permitir agregar pero no borrar en semanas pasadas: inconsistente.

**Por que**: en la practica es comun olvidar registrar un gasto del viernes y querer agregarlo
el sabado (ya en la semana siguiente). Bloquear la edicion de semanas pasadas obligaba a
registrar gastos con fecha incorrecta o perderlos.

## 2026-06-20 — Ahorro visible como sobre en vista semanal

**Decision**: el sobre de Ahorro aparece como card en la vista de semana, debajo de los
sobres normales, ocupando ancho completo con solapa verde.

**Alternativas consideradas**:
- Solo mostrarlo en la pestana Sobres: el usuario no ve su ahorro en el flujo principal.
- Mostrarlo como un sobre mas en el grid de 2 columnas: se pierde entre los demas.

**Por que**: Juan queria visibilidad del ahorro en su flujo diario (vista semanal) sin tener
que cambiar de pestana. El ancho completo y la solapa verde lo distinguen de los sobres
normales.

## 2026-06-28 — Sistema de pilares para onboarding progresivo

**Decision**: la version publica usa 4 pilares que desbloquean funcionalidad por logros
reales (no por tiempo). Pilar 1: Registrar (3 gastos). Pilar 2: Sobres (1 semana).
Pilar 3: Ahorro (1er cierre). Pilar 4: Dominio (2+ semanas). El usuario siempre puede
avanzar manualmente. Los anuncios escalan con los pilares (0 -> banner -> banner+interstitial).
La version personal ignora los pilares.

**Alternativas consideradas**:
- Desbloqueo por dias: no funciona porque el usuario puede no abrir la app diario.
- Desbloqueo solo manual: el usuario da clic sin leer y no aprende.
- Todo visible desde el inicio: abruma al usuario nuevo.

**Por que**: el usuario necesita demostrar que entendio cada paso antes de ver el siguiente.
Los logros reales (registrar gastos, completar una semana) son mejor indicador que el tiempo.
La opcion manual respeta al usuario que ya sabe que hacer. Ver `docs/PILARES_ONBOARDING.md`.

## 2026-06-28 — Look Material Design 3 para version publica

**Decision**: la version publica adopta el estilo visual Material Design 3 (Material You)
de Google para sentirse nativa en Android. La version personal mantiene el diseño actual.

**Alternativas consideradas**:
- Mantener el diseño actual para ambas: no se siente nativa en Android.
- Usar una libreria de componentes MD3 (ej: MUI): demasiado peso para una app Capacitor.
- Implementar MD3 manualmente con CSS: ligero, controlable, suficiente para el look.

**Por que**: los usuarios de Android esperan que las apps se vean como apps nativas de Google.
Material Design 3 tiene bordes redondeados, elevaciones sutiles, tipografia Roboto, y
una paleta derivada de un color semilla — el estilo que los usuarios de Android reconocen
y confian. No necesitamos una libreria completa, solo adoptar los tokens de diseno.

## 2026-06-28 — Dos versiones de la app: personal y publica

**Decision**: mantener dos versiones de la app desde el mismo codigo fuente:
- **Personal** (la actual): sin anuncios, sin suscripcion, para uso de Juan
- **Publica** (Google Play): con AdMob, suscripcion Pro, onboarding simplificado para nuevos usuarios

Se controla con variable de entorno `VITE_APP_MODE`:
- `personal` → sin ads, sin paywall, features completas
- `public` → con ads (usuarios gratis), suscripcion Pro, tour guiado mas detallado

**Alternativas consideradas**:
- Dos repos separados: duplica el trabajo de mantenimiento, los bug fixes hay que aplicarlos dos veces.
- Una sola version con suscripcion donde Juan sea admin: mas complejo de implementar y Juan perderia
  la version limpia sin anuncios.

**Por que**: Juan quiere seguir usando la app como esta (sin anuncios ni restricciones) mientras
la version publica tiene monetizacion. Un solo codigo con un flag de entorno es lo mas simple
de mantener — las features base son identicas, solo cambian los componentes de ads y paywall.

## 2026-06-28 — Google AdMob como plataforma de anuncios

**Decision**: usar Google AdMob para la monetizacion por publicidad. Plugin de Capacitor
(`@capacitor-community/admob`). Tres formatos: banner (fijo), interstitial (pantalla completa
en momentos naturales), rewarded (opcional, usuario decide ver).

**Por que**: AdMob es el estandar de facto para apps Android, se integra directamente con
Google Play, tiene el mayor inventario de anunciantes para LATAM, y hay plugin de Capacitor
mantenido. La alternativa (mediacion con redes como Unity Ads, Meta, etc.) se implementaria
en Fase C6 si el volumen lo justifica.

## 2026-08-05 — Regla de rescate: el Ahorro paga los sobregiros (v2.2)

**Decision**: cambiar la regla de cierre semanal. Antes, un sobre que cerraba en negativo
arrastraba su deficit a la siguiente semana (y el Ahorro nunca bajaba de 0). Ahora, cualquier
sobre (tipo `ahorro` o `acumula`) que cierre en negativo es **rescatado por el Ahorro**: el
deficit se descuenta del sobre Ahorro y el sobre reinicia en 0. El Ahorro **puede quedar
negativo** — interpretacion: "me debo a mi mismo" (dinero ya gastado que el plan semanal no
cubrio). El cierre guarda `sobrante` y `rescate` por sobre en el snapshot.

**Alternativas consideradas**:
- Mantener el arrastre (regla vieja): castiga la semana siguiente del sobre, pero el Ahorro
  "se salva solo" mientras hay deudas en sobres — ahorras dinero que realmente no tienes.
- Regla configurable por cuenta (`modo_cochinito`): descartada por Juan; regla global.
- Que los `acumula` devuelvan al Ahorro sus rescates con sobrantes futuros: descartada por
  ahora; los saldos positivos de `acumula` se leen como reservas etiquetadas.

**Por que**: Juan valido ambas reglas con una simulacion sobre sus 188 gastos reales (8 semanas).
Con la regla nueva todos los sobres amanecen usables cada sabado y la deuda real se concentra
en un solo numero honesto. La posicion neta del sistema es identica bajo ambas reglas; cambia
donde se visualiza el deficit y que conducta incentiva.

## 2026-11-13 — Se cancela la monetizacion y Google Play: la app es una PWA libre

**Decision**: Juan deja de publicar en Google Play (el ciclo AAB → revision → 12 testers x 14
dias resulto demasiado largo para el uso que se le da) y cancela la monetizacion. La app se usa
como PWA instalada desde el navegador. Se quitaron del codigo el plan Pro (modal, candados de
temas y de exportar CSV), los anuncios (AdMob), las compras (RevenueCat) y la peticion de
resena; los 8 temas y la exportacion quedan libres para todos. Tambien se desinstalaron esos
tres paquetes y se limpiaron terminos, privacidad y la portada.

**Lo que se conserva**: la carpeta `android/` y Capacitor (por si algun dia se retoma), los
pilares progresivos del modo publico y la columna `perfiles.es_pro` (ya nadie la lee).

**Consecuencia conocida**: los recordatorios de pago eran notificaciones locales de Android;
en la PWA no existen. Queda solo el banner dentro de la app (la seccion de notificaciones de
Ajustes se oculta en el navegador).

## 2026-11-13 — Quincena: modelo de flujo de efectivo

**Decision**: nueva vista "Quincena". El usuario captura su sueldo quincenal y sus dias de
cobro; la app muestra cuanto ya salio, cuanto esta comprometido y cuanto le va a quedar.
Logica pura en `src/lib/quincena.js` (27 tests). Reglas:

1. **La quincena** va del ultimo dia de cobro al dia anterior al siguiente (dias configurables;
   31 = fin de mes; si el mes no tiene el dia se usa el ultimo).
2. **El sueldo solo baja cuando el dinero sale**: gastos en efectivo, debito o transferencia,
   y los pagos de tarjeta (categoria `tarjetas`).
3. **Una compra a credito NO baja el sueldo de esta quincena**; se informa aparte. Sale cuando
   se paga la tarjeta. Asi no se cuenta dos veces (al comprar y al pagar).
4. **Por pagar** = pagos recurrentes y pagos de tarjeta con fecha dentro de la quincena que
   aun no tienen gasto registrado (misma convencion que los recordatorios: gasto con
   `nota === nombre del pago`, o `"Pago <tarjeta>"`).
5. **Estimado de la tarjeta** = MSI del mes + compras a credito del corte que se liquida
   (requiere `dia_corte`); si da 0 se usa el monto del pago recurrente ligado.
6. **Reservado para sobres** = lo que falta gastar del plan semanal de hoy al siguiente cobro,
   sin duplicar los pagos fijos que salen de un sobre. Se muestra como segundo paso
   ("Libre de verdad"), separado de "Te va a quedar".

**Alternativas consideradas**:
- *Devengado* (toda compra baja el sueldo al hacerla, sin importar el medio): mas simple de
  explicar, pero cuenta doble las compras a credito cuando despues se registra el pago de la
  tarjeta, y no responde "cuanto dinero me queda de verdad".
- Pestaña propia: descartada, ya hay 5 pestañas; va como tarjeta en Semana con detalle a
  pantalla completa (asi se ve cada vez que se registra un gasto).

**Datos**: `cuentas.sueldo_quincenal`, `dia_cobro_1`, `dia_cobro_2`
(`supabase/migracion_quincena.sql`). Mientras la migracion no se corra, la configuracion vive
en el dispositivo y se sube sola despues.

**Supuestos a validar con uso real**: (a) que Juan registra con `medio_pago = credito` y la
tarjeta correcta lo que paga con tarjeta de credito; (b) que los dias de cobro no se recorren
cuando caen en fin de semana.

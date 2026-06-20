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

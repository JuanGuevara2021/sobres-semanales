# ESPECIFICACIONES V2 — Sobres Semanales

> **Instrucción para Claude Code**: este documento actualiza el diseño del proyecto.
> 1. Actualiza `CLAUDE.md` (reglas de negocio y modelo de datos) según las secciones A y B.
> 2. Actualiza `ROADMAP.md`: la Fase 2 usa el modelo v2; la Fase 4 se reemplaza con las features F1–F6 en ese orden.
> 3. Registra en `docs/DECISIONES.md` los supuestos de la sección D.
> 4. Después ejecuta la Fase 2 (Supabase) con el modelo v2.
> Cualquier desviación de este documento debe avisarse explícitamente a Juan.

---

## A. Reglas de negocio v2 (reemplazan las reglas 3 y 5 anteriores)

1. La semana va de **sábado a viernes**; se calcula desde la fecha del gasto, nunca se almacena editable.
2. Cada sobre tiene un **tipo de cierre**:
   - `ahorro`: al cerrar la semana, el sobrante positivo pasa al sobre Ahorro y el sobre reinicia en cero. Si se sobregiró, el faltante NO se descuenta del Ahorro (solo se marca).
   - `acumula`: el saldo se arrastra entre semanas (positivo o negativo). Disponible de la semana = `saldo_acumulado + aportación_semanal − gastos_de_la_semana`.
3. El sobre **Ahorro** es tipo `acumula`, con aportación semanal propia, y además recibe los sobrantes de los sobres tipo `ahorro` en cada cierre. Sí se puede gastar de él.
4. **Cierre automático** de semanas pasadas con ≥1 gasto; cada cierre es un **snapshot** (saldos, aportaciones y gastado al momento). Cambiar aportaciones después no reescribe historia; los cambios de presupuesto aplican de la semana en curso en adelante.
5. Los **gastos fuera de sobres** (sobre_id nulo) se registran en la libreta con categoría libre, cuentan en totales y análisis, pero no descuentan de ningún sobre.
6. Medios de pago: Efectivo, Débito, Crédito, Transferencia. Moneda MXN, formato `es-MX`.

## B. Modelo de datos v2

```
cuentas   { id, nombre }
perfiles  { user_id (auth), cuenta_id, nombre, tema }
sobres    { id, cuenta_id, nombre, emoji, aportacion_semanal, tipo_cierre ('ahorro'|'acumula'),
            es_ahorro bool, saldo_acumulado (editable al crear/editar = saldo inicial), activo }
gastos    { id, cuenta_id, sobre_id NULL, usuario_id, fecha, monto, medio_pago,
            categoria_libre NULL (solo si sobre_id es nulo), nota, creado_en }
cierres   { id, cuenta_id, semana, detalle jsonb (snapshot por sobre: saldo_previo, aportacion,
            gastado, sobrante_a_ahorro, saldo_final), total_a_ahorro, cerrado_en }
pagos_recurrentes { id, cuenta_id, nombre, monto_estimado, dia_pago (1–31),
            destino_sobre_id NULL (nulo = fuera de sobres), activo,
            pospuesto_hasta NULL, ultimo_pago NULL }
compras_msi { id, cuenta_id, concepto, monto_total, tarjeta, num_meses,
            fecha_compra, mes_primer_pago, dia_corte NULL, activo }
```

Derivados de `compras_msi` (calculados, no almacenados): mensualidad = monto_total / num_meses;
meses pagados (desde mes_primer_pago hasta hoy); meses restantes; fecha del último pago;
carga mensual total = Σ mensualidades activas.

## C. Sobres iniciales (seed con datos reales de Juan)

| Sobre        | Aportación/sem | Tipo    |
|--------------|----------------|---------|
| Tianguis     | $500           | ahorro  |
| Casa         | $200           | ahorro  |
| Tienda UNAM  | $400           | ahorro  |
| Walmart      | $400           | ahorro  |
| Antojos      | $300           | ahorro  |
| Plataformas  | $500           | acumula |
| Servicios    | $200           | acumula |
| Diversión    | $200           | acumula |
| Escuela      | $100           | acumula |
| Salud        | $100           | acumula |
| Ahorro       | $100           | acumula + es_ahorro |

Al crearlos, la app debe permitir a Juan capturar el **saldo inicial** de cada sobre
(el dinero que ya tienen hoy) antes de la primera semana de uso.

---

## Features en orden de implementación (después de Fase 2 y Fase 3)

### F1 — Gastos fuera de sobres
En el formulario de gasto, opción "Fuera de sobres" junto a los sobres. Al elegirla,
aparece un campo de categoría libre (con sugerencias de las ya usadas: Veterinario,
Médico, Tarjetas…). Se muestran en la libreta con distintivo visual propio.
**Aceptación**: registrar un gasto fuera de sobres no altera el disponible de ningún sobre,
pero sí aparece en la libreta y en el total semanal.

### F2 — Vista semanal completa
En la pestaña Semana, el resumen muestra: total general gastado (sobres + fuera de sobres),
con desglose en dos renglones. La libreta lista todo junto, con filtro opcional
(Todos / Solo sobres / Solo fuera de sobres).
**Aceptación**: el total general de la semana = suma de absolutamente todos los gastos con fecha en esa semana.

### F3 — Pagos recurrentes con recordatorio
Nueva sección "Agenda de pagos": alta de pagos con nombre, monto estimado, día del mes
y destino (un sobre o fuera de sobres). Pagos iniciales de Juan: tarjetas Mercado Crédito,
Stori, BBVA Azul, BBVA Vive; préstamo BBVA (por terminar); suscripciones Spotify, HBO Max,
PlayStation, Claude (estas salen del sobre Plataformas; tarjetas y préstamo, fuera de sobres).
Recordatorio EN LA APP (banner en la pantalla principal) desde 3 días antes del día de pago,
con dos botones: **"Ya pagué"** (pide confirmar/ajustar el monto y registra el gasto
automáticamente en su destino con fecha de hoy) y **"Posponer"** (oculta el banner hasta mañana).
**Aceptación**: un pago vencido o próximo siempre es visible al abrir la app; "Ya pagué"
genera exactamente un gasto y reinicia el ciclo al mes siguiente.

### F4 — Compras a meses (MSI)
Nueva sección "A meses": alta con concepto, monto total, tarjeta, número de meses,
fecha de compra, mes del primer pago (mismo mes, +1, +2 o +3 — caso Buen Fin) y día de
corte de la tarjeta (opcional). Por cada compra mostrar: mensualidad, pagos realizados,
pagos restantes, mes en que termina, barra de progreso. Arriba, la **carga mensual
comprometida** (suma de mensualidades activas) — el dato clave para decidir si conviene
una compra nueva. Ejemplo de referencia: PlayStation, $12,000, BBVA Azul, 15 meses,
inicia en enero → mensualidad $800, termina marzo 2027.
**Aceptación**: el estatus se calcula solo a partir de la fecha actual; no requiere
capturar cada pago manualmente. (Integración con la Agenda de pagos: backlog.)

### F5 — Análisis (gráficas)
Nueva pestaña "Análisis" con: (a) gasto por día de la semana — barras, con toggle entre
suma de dinero y número de compras; (b) gasto por semana (últimas N) y por mes;
(c) gasto por categoría (sobres + categorías libres); (d) distribución porcentual por
categoría con selector de ventana: 2, 3 o 4 semanas; (e) toggle para incluir/excluir
gastos fuera de sobres en todas las vistas. Usar una librería de gráficas estándar (recharts).
**Aceptación**: todas las cifras cuadran contra la libreta del mismo periodo.

### F6 — Temas visuales
Selector de tema en ajustes, guardado por usuario (campo `tema` en perfiles, sincroniza
entre dispositivos): Claro (actual), Oscuro, Coquette (rosas, flores, moños), Periódico
(blanco y negro, tipografía serif, líneas finas), Mariposas. Implementar sobre las
variables CSS existentes + acentos decorativos por tema; la legibilidad de montos manda.

---

## D. Supuestos tomados (Juan: corrige aquí lo que no aplique)

1. Los sobres tipo `acumula` arrastran también saldos **negativos** (si te pasas, la
   siguiente semana inicia con menos).
2. Cambios de aportación semanal aplican de la semana en curso en adelante; nunca al pasado.
3. Recordatorios v1 son **dentro de la app** (banner al abrirla), no notificaciones push
   del celular; push queda en backlog para una fase posterior.
4. "Ya pagué" registra el gasto con el monto estimado, editable antes de confirmar.
5. El rastreador de MSI es informativo (no genera gastos); el pago real de la tarjeta se
   registra como gasto fuera de sobres o vía la Agenda de pagos.
6. El tema visual es preferencia por usuario, no por cuenta (cada quien su tema).

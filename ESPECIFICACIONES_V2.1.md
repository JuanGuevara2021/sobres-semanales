# ESPECIFICACIONES V2.1 — Sobres Semanales

> **Instrucción para Claude Code**: este documento REEMPLAZA ESPECIFICACIONES_V2.md completo.
> 1. Actualiza `CLAUDE.md` (reglas de negocio y modelo de datos) según las secciones A, B y C.
> 2. Actualiza `ROADMAP.md`: la Fase 2 usa el modelo v2.1; la Fase 4 se reemplaza con las features F1–F6 en ese orden.
> 3. Registra en `docs/DECISIONES.md` los supuestos de la sección E.
> 4. Después ejecuta la Fase 2 (Supabase) con el modelo v2.1.
> 5. El archivo `datos_historicos.csv` contiene ~293 gastos reales para seed; cárgalos tras crear las tablas.
> Cualquier desviación de este documento debe avisarse explícitamente a Juan.

---

## A. Concepto clave: dos dimensiones independientes

Cada gasto tiene DOS clasificaciones que no se mezclan:

| Dimensión   | Pregunta que responde              | Para qué sirve       | Obligatoria |
|-------------|-------------------------------------|----------------------|-------------|
| **Sobre**   | ¿De dónde sale el dinero?          | Controlar y limitar  | No (puede ser "fuera de sobres") |
| **Categoría** | ¿Qué tipo de gasto es?          | Analizar y entender  | Sí, siempre |

**Sobre** = mecanismo de presupuesto semanal. Puede ser un sobre específico o "fuera de sobres".
**Categoría** = clasificación analítica. Siempre presente. Las 6 categorías fijas son:

| Categoría   | Qué incluye |
|-------------|-------------|
| Casa        | Despensa, limpieza, servicios del hogar, agua, ropa, muebles |
| Renta       | Pago mensual de vivienda |
| Diversión   | Entretenimiento, salidas, suscripciones, comida fuera por gusto |
| Salud       | Médicos, medicamentos, psicólogos, laboratorios, suplementos |
| Escuela     | Colegiaturas, materiales, pasajes a escuela |
| Tarjetas    | Pagos de tarjetas de crédito, préstamos, deudas |

Estas 6 categorías son fijas (no editables por el usuario en v1). Si en el futuro se necesitan más, se agregan en código.

## B. Reglas de negocio v2.1

1. La semana va de **sábado a viernes**; se calcula desde la fecha del gasto.
2. Cada sobre tiene un **tipo de cierre**:
   - `ahorro`: al cerrar la semana, el sobrante positivo pasa al sobre Ahorro y el sobre reinicia. Sobregiro NO descuenta del Ahorro.
   - `acumula`: el saldo se arrastra entre semanas. Disponible = `saldo_acumulado + aportación_semanal − gastos_de_la_semana`.
3. El sobre **Ahorro** es tipo `acumula`, con aportación semanal propia, y además recibe sobrantes de sobres tipo `ahorro`.
4. **Cierre automático** de semanas pasadas con ≥1 gasto; cada cierre es un **snapshot**.
5. **Gastos fuera de sobres** (sobre_id nulo): no descuentan de ningún sobre. Siempre llevan categoría.
6. **Categoría es obligatoria** en todos los gastos (con sobre o sin sobre). Cada sobre tiene una categoría por defecto que se auto-llena pero se puede cambiar.
7. **Las estadísticas y gráficas operan sobre categoría**, no sobre sobres. Esto da visibilidad completa del gasto real.
8. Medios de pago: Efectivo, Débito, Crédito, Transferencia. Moneda MXN, formato `es-MX`.
9. Cambios de presupuesto aplican de la semana en curso en adelante; nunca al pasado.

## C. Modelo de datos v2.1

```
categorias (enum o tabla de referencia):
  'casa', 'renta', 'diversion', 'salud', 'escuela', 'tarjetas'

cuentas    { id, nombre }
perfiles   { user_id (auth), cuenta_id, nombre, tema }

sobres     { id, cuenta_id, nombre, emoji, aportacion_semanal,
             tipo_cierre ('ahorro'|'acumula'), es_ahorro bool,
             categoria_default (ref categorias),
             saldo_acumulado, activo }

gastos     { id, cuenta_id, sobre_id NULL, usuario_id,
             fecha, monto, medio_pago,
             categoria (ref categorias, NOT NULL),
             nota, creado_en }

cierres    { id, cuenta_id, semana,
             detalle jsonb (snapshot por sobre),
             total_a_ahorro, cerrado_en }

pagos_recurrentes  { id, cuenta_id, nombre, monto_estimado, dia_pago,
                     destino_sobre_id NULL, categoria (NOT NULL),
                     activo, pospuesto_hasta NULL, ultimo_pago NULL }

compras_msi  { id, cuenta_id, concepto, monto_total, tarjeta,
              num_meses, fecha_compra, mes_primer_pago,
              dia_corte NULL, activo }
```

**Cambio clave vs v2**: el campo `categoria_libre` (texto libre) se reemplaza por `categoria` (enum obligatorio) en TODOS los gastos. Ya no hay distinción de campos entre gastos con sobre y sin sobre — ambos siempre tienen categoría.

## D. Sobres iniciales con categoría por defecto

| Sobre        | Aportación/sem | Tipo    | Categoría default |
|--------------|----------------|---------|--------------------|
| Tianguis     | $500           | ahorro  | casa               |
| Casa         | $200           | ahorro  | casa               |
| Tienda UNAM  | $400           | ahorro  | casa               |
| Walmart      | $400           | ahorro  | casa               |
| Antojos      | $300           | ahorro  | diversion          |
| Plataformas  | $500           | acumula | diversion          |
| Servicios    | $200           | acumula | casa               |
| Diversión    | $200           | acumula | diversion          |
| Escuela      | $100           | acumula | escuela            |
| Salud        | $100           | acumula | salud              |
| Ahorro       | $100           | acumula + es_ahorro | casa    |

Al crearlos, permitir capturar **saldo inicial** de cada sobre.

Nota: los presupuestos son intencionalmente menores al gasto histórico — el objetivo es reducir gasto progresivamente. Los datos históricos ($4,700/sem promedio vs $3,000 presupuestados) sirven como línea base para medir el progreso de reducción.

---

## Features en orden de implementación (después de Fase 2 y Fase 3)

### F1 — Registro con doble dimensión (sobre + categoría)
En el formulario de gasto:
- Elegir sobre (chips como hoy) O marcar "Fuera de sobres" (chip especial).
- Al elegir un sobre, la categoría se auto-llena con su default. Aparece un selector secundario de categoría (6 opciones) que permite cambiarla.
- Al elegir "Fuera de sobres", el selector de categoría es obligatorio y visible.
- La categoría se muestra como badge de color en la libreta junto al sobre.
**Aceptación**: todo gasto registrado tiene categoría no nula. Un gasto con sobre auto-llena categoría. Un gasto fuera de sobres obliga a elegir categoría.

### F2 — Vista semanal completa
La pestaña Semana muestra:
- Resumen superior: total general (sobres + fuera) con desglose por categoría (barras o mini resumen).
- Sobres: las tarjetas de sobre como hoy (control de presupuesto).
- Libreta: todos los gastos juntos. Filtro: Todos / Solo sobres / Solo fuera de sobres. Cada entrada muestra sobre (si aplica) + categoría como badge.
**Aceptación**: total = suma de todos los gastos de la semana, sin importar si tienen sobre o no.

### F3 — Pagos recurrentes con recordatorio
Cada pago recurrente tiene: nombre, monto estimado, día del mes, destino sobre (o fuera), Y categoría.
Pagos iniciales:
- Psicóloga Clara: $200, transferencia, → Salud, sobre Salud
- Psicólogo Juan: $200, transferencia → Salud, sobre Salud
- Spotify: $189, tarjeta → Diversión, sobre Plataformas
- HBO Max: tarjeta → Diversión, sobre Plataformas
- PlayStation: tarjeta → Diversión, sobre Plataformas
- Claude: ~$355, tarjeta → Diversión, sobre Plataformas
- Mercado Crédito: variable → Tarjetas, fuera de sobres
- Stori: variable → Tarjetas, fuera de sobres
- BBVA Azul: variable → Tarjetas, fuera de sobres
- BBVA Vive: variable → Tarjetas, fuera de sobres
- Préstamo BBVA: variable → Tarjetas, fuera de sobres (por terminar)
- Teléfono: ~$506 → Casa, sobre Servicios

Recordatorio: banner 3 días antes del día de pago. Botones "Ya pagué" y "Posponer".
**Aceptación**: "Ya pagué" genera un gasto con sobre + categoría prellenados.

### F4 — Compras a meses (MSI)
Sin cambios vs v2. Concepto, monto total, tarjeta, meses, fecha compra, mes primer pago, día de corte. Estatus calculado. Carga mensual comprometida.
Ejemplo: PlayStation $12,000, BBVA Azul, 15 meses, compra Mar 28 2026.
**Aceptación**: estatus se calcula solo desde fecha actual.

### F5 — Análisis por categoría
Nueva pestaña "Análisis". TODAS las gráficas operan sobre **categoría** (no sobre):
- (a) Gasto por día de la semana (barras): toggle entre $ y # de compras.
- (b) Gasto por semana (últimas N semanas) y por mes.
- (c) Gasto por categoría: 6 barras/donas con las categorías.
- (d) Distribución porcentual por categoría con selector de ventana (2, 3, 4 semanas).
- (e) Tendencia de gasto semanal vs presupuesto total de sobres (línea de meta).
- (f) Toggle global: incluir/excluir pagos de tarjetas y renta del análisis (para ver el gasto "operativo" vs el total con deudas).
Usar recharts.
**Aceptación**: todas las cifras cuadran contra la libreta del mismo periodo.

### F6 — Temas visuales
Sin cambios vs v2: Claro, Oscuro, Coquette, Periódico, Mariposas.
Selector por usuario en ajustes.

---

## E. Supuestos tomados (Juan: corrige lo que no aplique)

1. Los sobres tipo `acumula` arrastran saldos negativos a la siguiente semana.
2. Cambios de aportación semanal aplican de la semana en curso en adelante.
3. Recordatorios v1 son dentro de la app (banner), no push notifications.
4. "Ya pagué" registra gasto con monto editable antes de confirmar.
5. El rastreador de MSI es informativo (no genera gastos automáticos).
6. El tema visual es preferencia por usuario, no por cuenta.
7. Las 6 categorías son fijas por ahora. Si Juan necesita "Transporte" como categoría separada, se agrega.
8. La categoría default de "Antojos" es "diversión" (comer fuera por gusto). Juan puede cambiarla a "casa" si prefiere.
9. Los presupuestos de los sobres son intencionalmente menores al gasto histórico: el objetivo es reducción progresiva.

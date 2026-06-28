# CLAUDE.md — Sobres Semanales

## Que es este proyecto

App de finanzas personales que une dos metodos: la **libreta de gastos** (registro diario
con categoria, medio de pago y monto) y la **cartera de sobres** (presupuesto semanal por
concepto). Registrar un gasto descuenta automaticamente de su sobre. Al cerrar la semana,
lo que sobra en sobres tipo `ahorro` pasa al sobre Ahorro; los tipo `acumula` arrastran saldo.

Objetivo: que el ahorro sea el resultado automatico del sistema, no de la fuerza de voluntad.

La app es multi-usuario (cada "cuenta" puede compartirse entre 2 personas del hogar),
multi-moneda (MXN, COP, ARS, PEN, CLP, USD), con categorias dinamicas y dia de inicio
de semana configurable. Incluye tour de bienvenida, onboarding por plantillas, y PIN opcional.

## Stack y arquitectura (decisiones ya tomadas — no reabrir sin consultar a Juan)

- **Frontend**: React + Vite. Punto de partida: `SobresSemanales.jsx` (prototipo funcional ya validado).
- **Backend/datos**: Supabase (Postgres + Auth + Realtime), plan gratuito.
- **Distribucion**: PWA desplegada en Vercel. Proxima fase: empaquetar con Capacitor para Google Play.
- **Multiusuario**: una "cuenta" (hogar) compartida; usuarios autenticados ven y editan los mismos datos desde dispositivos distintos, con sincronizacion en tiempo real.
- **Configuracion dinamica**: `CuentaContext` provee moneda, dia de inicio, categorias, funciones de formato. Todo configurable por cuenta.

## Concepto clave: dos dimensiones independientes

Cada gasto tiene DOS clasificaciones que no se mezclan:

| Dimension    | Pregunta que responde              | Para que sirve       | Obligatoria |
|--------------|-------------------------------------|----------------------|-------------|
| **Sobre**    | De donde sale el dinero?           | Controlar y limitar  | No (puede ser "fuera de sobres") |
| **Categoria**| Que tipo de gasto es?              | Analizar y entender  | Si, siempre |

**Sobre** = mecanismo de presupuesto semanal. Puede ser un sobre especifico o "fuera de sobres".
**Categoria** = clasificacion analitica. Siempre presente. Se crea un set de 6 categorias por defecto
al registrar la cuenta, pero el usuario puede agregar o quitar desde Configuracion.

Categorias default: casa, renta, diversion, salud, escuela, tarjetas. Se almacenan en tabla
`categorias` (dinamicas por cuenta), no como ENUM.

## Reglas de negocio v2.1 (criticas — cualquier cambio debe avisarse a Juan)

1. **El dia de inicio de semana es configurable** (sabado, lunes o domingo) por cuenta.
   Se calcula a partir de la fecha del gasto; nunca se almacena como campo editable.
2. Cada sobre tiene un **tipo de cierre**:
   - `ahorro`: al cerrar la semana, el sobrante positivo pasa al sobre Ahorro y el sobre reinicia. Si hubo sobregiro, el deficit se arrastra a la siguiente semana (reduce la aportacion disponible). Sobregiro NO descuenta del Ahorro.
   - `acumula`: el saldo se arrastra entre semanas (positivo o negativo).
   - Para ambos tipos: Disponible = `saldo_acumulado + aportacion_semanal - gastos_de_la_semana`.
3. El sobre **Ahorro** es tipo `acumula`, con aportacion semanal propia, y ademas recibe sobrantes de sobres tipo `ahorro`.
4. **Cierre automatico** de semanas pasadas con >=1 gasto; cada cierre es un **snapshot**.
   El cierre guarda presupuesto y gastado al momento; cambiar presupuestos despues no reescribe la historia.
   Semanas sin gastos NO se cierran (no inflar ahorro).
5. **Gastos fuera de sobres** (sobre_id nulo): no descuentan de ningun sobre. Siempre llevan categoria.
6. **Categoria es obligatoria** en todos los gastos (con sobre o sin sobre). Cada sobre tiene una categoria por defecto que se auto-llena pero se puede cambiar.
7. **Las estadisticas y graficas operan sobre categoria**, no sobre sobres. Esto da visibilidad completa del gasto real.
8. **Medios de pago**: Efectivo, Debito, Credito, Transferencia.
9. **Moneda**: configurable por cuenta (MXN, COP, ARS, PEN, CLP, USD). Formato via `Intl.NumberFormat`.
10. Cambios de presupuesto aplican de la semana en curso en adelante; nunca al pasado.

## Modelo de datos v3 (post Fase C1)

```
cuentas    { id, nombre, presupuesto_semanal, moneda (text, default 'MXN'),
             dia_inicio_semana (int 0-6, default 6), inicio_sobres }
perfiles   { user_id (auth), cuenta_id, nombre, tema }

categorias { id, cuenta_id, nombre, label, color, orden, activo }

sobres     { id, cuenta_id, nombre, emoji, aportacion_semanal,
             tipo_cierre ('ahorro'|'acumula'), es_ahorro bool,
             categoria_default (text, ref categorias.nombre),
             saldo_acumulado, activo }

tarjetas   { id, cuenta_id, nombre, banco, ultimos4,
             dia_corte, dia_pago, activo }

gastos     { id, cuenta_id, sobre_id NULL, usuario_id,
             fecha, monto, medio_pago,
             tarjeta_id NULL (ref tarjetas),
             categoria (text, NOT NULL),
             nota, creado_en }

cierres    { id, cuenta_id, semana,
             detalle jsonb (snapshot por sobre),
             total_a_ahorro, cerrado_en }

pagos_recurrentes  { id, cuenta_id, nombre, monto_estimado, dia_pago,
                     destino_sobre_id NULL, categoria (text, NOT NULL),
                     frecuencia ('semanal'|'quincenal'|'mensual'),
                     medio_pago, tarjeta_id NULL, activo,
                     pospuesto_hasta NULL, ultimo_pago NULL }

compras_msi  { id, cuenta_id, concepto, monto_total, tarjeta,
              tarjeta_id NULL, num_meses, fecha_compra,
              mes_primer_pago, dia_corte NULL, activo }

plantillas_sobres  { id, plantilla, nombre, emoji, aportacion_semanal,
                     tipo_cierre, es_ahorro, categoria_default, orden }
```

Nota: categorias pasaron de ENUM a tabla dinamica. La columna `categoria` en gastos/sobres/pagos
es text (ya no referencia un ENUM). Plantillas: hogar_mexicano, estudiante, basico.

## Plantillas de sobres (se eligen durante onboarding)

Los sobres iniciales vienen de la tabla `plantillas_sobres`. Hay 3 plantillas:
- **hogar_mexicano** (11 sobres) — para hogares con gastos variados
- **estudiante** (6 sobres) — para estudiantes con presupuesto reducido
- **basico** (4 sobres) — para quien quiere empezar simple

## Convenciones de trabajo

- Todo en **espanol**: UI, commits, comentarios, documentacion.
- Juan es Data Scientist (SQL Server, PySpark, Python) pero esta aprendiendo desarrollo
  web: explica brevemente el porque de cada decision tecnica, estilo mentoria, sin sobreexplicar.
- Mobile-first siempre (uso principal: celular). Probar mentalmente en ~380px de ancho.
- Validar logica empiricamente antes de comprometer diseno (tests o scripts de comprobacion
  para reglas de fechas/semanas/cierres).
- Commits pequenos y descriptivos. Una feature o fix por commit.
- Seguridad: las llaves de Supabase viven en `.env` (nunca en el codigo ni en git);
  Row Level Security activado: cada usuario solo accede a datos de su `cuenta_id`.

## Documentacion viva (mantener actualizada)

- `ROADMAP.md` — fases y backlog. Marcar tareas completadas; Juan agrega ideas nuevas ahi.
- `docs/DECISIONES.md` — bitacora de decisiones y supuestos.
- `README.md` — como correr el proyecto localmente (mantener al dia con cada cambio de setup).

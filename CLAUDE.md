# CLAUDE.md — Sobres Semanales

## Que es este proyecto

App de finanzas personales para 2 usuarios (Juan y una persona mas) que une dos metodos:
la **libreta de gastos** (registro diario con categoria, medio de pago y monto) y la
**cartera de sobres** (presupuesto semanal por concepto). Registrar un gasto descuenta
automaticamente de su sobre. Al cerrar la semana, lo que sobra en sobres tipo `ahorro`
pasa al sobre Ahorro; los sobres tipo `acumula` arrastran su saldo.

Objetivo del usuario: que el ahorro sea el resultado automatico del sistema, no de la
fuerza de voluntad a fin de mes.

## Stack y arquitectura (decisiones ya tomadas — no reabrir sin consultar a Juan)

- **Frontend**: React + Vite. Punto de partida: `SobresSemanales.jsx` (prototipo funcional ya validado).
- **Backend/datos**: Supabase (Postgres + Auth + Realtime), plan gratuito.
- **Distribucion**: PWA desplegada en Vercel. NO Google Play, NO APK (por ahora; el codigo debe quedar envolvible con Capacitor en el futuro).
- **Multiusuario**: una "cuenta" (hogar) compartida; 2 usuarios autenticados ven y editan los mismos datos desde dispositivos distintos, con sincronizacion en tiempo real.

## Concepto clave: dos dimensiones independientes

Cada gasto tiene DOS clasificaciones que no se mezclan:

| Dimension    | Pregunta que responde              | Para que sirve       | Obligatoria |
|--------------|-------------------------------------|----------------------|-------------|
| **Sobre**    | De donde sale el dinero?           | Controlar y limitar  | No (puede ser "fuera de sobres") |
| **Categoria**| Que tipo de gasto es?              | Analizar y entender  | Si, siempre |

**Sobre** = mecanismo de presupuesto semanal. Puede ser un sobre especifico o "fuera de sobres".
**Categoria** = clasificacion analitica. Siempre presente. Las 6 categorias fijas son:

| Categoria   | Que incluye |
|-------------|-------------|
| casa        | Despensa, limpieza, servicios del hogar, agua, ropa, muebles |
| renta       | Pago mensual de vivienda |
| diversion   | Entretenimiento, salidas, suscripciones, comida fuera por gusto |
| salud       | Medicos, medicamentos, psicologos, laboratorios, suplementos |
| escuela     | Colegiaturas, materiales, pasajes a escuela |
| tarjetas    | Pagos de tarjetas de credito, prestamos, deudas |

Estas 6 categorias son fijas (no editables por el usuario en v1). Si en el futuro se necesitan mas, se agregan en codigo.

## Reglas de negocio v2.1 (criticas — cualquier cambio debe avisarse a Juan)

1. **La semana va de sabado a viernes** y se calcula a partir de la fecha del gasto;
   nunca se almacena como campo editable. Inicio de semana = sabado anterior o igual.
2. Cada sobre tiene un **tipo de cierre**:
   - `ahorro`: al cerrar la semana, el sobrante positivo pasa al sobre Ahorro y el sobre reinicia. Sobregiro NO descuenta del Ahorro.
   - `acumula`: el saldo se arrastra entre semanas. Disponible = `saldo_acumulado + aportacion_semanal - gastos_de_la_semana`.
3. El sobre **Ahorro** es tipo `acumula`, con aportacion semanal propia, y ademas recibe sobrantes de sobres tipo `ahorro`.
4. **Cierre automatico** de semanas pasadas con >=1 gasto; cada cierre es un **snapshot**.
   El cierre guarda presupuesto y gastado al momento; cambiar presupuestos despues no reescribe la historia.
   Semanas sin gastos NO se cierran (no inflar ahorro).
5. **Gastos fuera de sobres** (sobre_id nulo): no descuentan de ningun sobre. Siempre llevan categoria.
6. **Categoria es obligatoria** en todos los gastos (con sobre o sin sobre). Cada sobre tiene una categoria por defecto que se auto-llena pero se puede cambiar.
7. **Las estadisticas y graficas operan sobre categoria**, no sobre sobres. Esto da visibilidad completa del gasto real.
8. **Medios de pago**: Efectivo, Debito, Credito, Transferencia.
9. **Moneda**: MXN, formato `es-MX`.
10. Cambios de presupuesto aplican de la semana en curso en adelante; nunca al pasado.

## Modelo de datos v2.1

```
categorias (enum):
  'casa', 'renta', 'diversion', 'salud', 'escuela', 'tarjetas'

cuentas    { id, nombre, presupuesto_semanal (default 3000) }
perfiles   { user_id (auth), cuenta_id, nombre, tema }

sobres     { id, cuenta_id, nombre, emoji, aportacion_semanal,
             tipo_cierre ('ahorro'|'acumula'), es_ahorro bool,
             categoria_default (ref categorias),
             saldo_acumulado, activo }

tarjetas   { id, cuenta_id, nombre, banco, ultimos4,
             dia_corte, dia_pago, activo }

gastos     { id, cuenta_id, sobre_id NULL, usuario_id,
             fecha, monto, medio_pago,
             tarjeta_id NULL (ref tarjetas),
             categoria (ref categorias, NOT NULL),
             nota, creado_en }

cierres    { id, cuenta_id, semana,
             detalle jsonb (snapshot por sobre),
             total_a_ahorro, cerrado_en }

pagos_recurrentes  { id, cuenta_id, nombre, monto_estimado, dia_pago,
                     destino_sobre_id NULL, categoria (NOT NULL),
                     frecuencia ('semanal'|'quincenal'|'mensual', default 'mensual'),
                     medio_pago (ref medio_pago_t, default 'debito'),
                     tarjeta_id NULL (ref tarjetas),
                     activo, pospuesto_hasta NULL, ultimo_pago NULL }

compras_msi  { id, cuenta_id, concepto, monto_total, tarjeta,
              tarjeta_id NULL (ref tarjetas),
              num_meses, fecha_compra, mes_primer_pago,
              dia_corte NULL, activo }
```

## Sobres iniciales con categoria por defecto

| Sobre        | Aportacion/sem | Tipo    | Categoria default |
|--------------|----------------|---------|--------------------|
| Tianguis     | $500           | ahorro  | casa               |
| Casa         | $200           | ahorro  | casa               |
| Tienda UNAM  | $400           | ahorro  | casa               |
| Walmart      | $400           | ahorro  | casa               |
| Antojos      | $300           | ahorro  | diversion          |
| Plataformas  | $500           | acumula | diversion          |
| Servicios    | $200           | acumula | casa               |
| Diversion    | $200           | acumula | diversion          |
| Escuela      | $100           | acumula | escuela            |
| Salud        | $100           | acumula | salud              |
| Ahorro       | $100           | acumula + es_ahorro | casa    |

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

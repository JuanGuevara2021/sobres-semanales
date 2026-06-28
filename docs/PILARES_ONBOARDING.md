# Sistema de Pilares — Onboarding Progresivo

Fecha: 2026-06-28
Autor: Juan + Claude Code

---

## El Goal de la app

**"Ahorra sin pensarlo — controla tus gastos semana a semana y lo que sobre se ahorra solo."**

Tres cosas que el usuario debe entender desde el minuto 1:

1. **Que**: repartes tu dinero en sobres cada semana
2. **Como**: registras lo que gastas y el sobre se descuenta solo
3. **Por que funciona**: lo que no gastas se ahorra automaticamente

---

## Los 4 Pilares

Cada pilar es un nivel de dominio de la app. Se desbloquean por **logros reales**
(el usuario demostro que entendio el paso anterior) con opcion de avanzar manualmente.

### Pilar 1 — REGISTRAR ("Anota lo que gastas")

El habito base. Sin esto, nada funciona.

| Aspecto | Detalle |
|---------|---------|
| **Disponible** | Desde el primer uso |
| **Tabs visibles** | Solo Semana |
| **Logro para avanzar** | Registrar 3 gastos |
| **Opcion manual** | Boton "Ya se como funciona" |
| **Anuncios** | CERO — el usuario se enamora sin distraccion |

Lo que el usuario ve:
- Card de resumen semanal (presupuesto restante)
- Sobres con su saldo
- Boton grande "Registrar gasto"
- Guia: "Registra tu primer gasto" con progreso (1/3, 2/3, 3/3)
- Al completar 3: celebracion + intro al Pilar 2

Lo que NO ve todavia:
- Tabs de Libreta, Sobres, Pagos, Analisis
- Recordatorios de pagos
- Configuracion avanzada de sobres

### Pilar 2 — SOBRES ("Divide tu dinero en sobres")

Entender que cada sobre tiene un limite semanal y que los gastos lo descuentan.

| Aspecto | Detalle |
|---------|---------|
| **Desbloqueo** | 3 gastos registrados o avance manual |
| **Tabs visibles** | Semana + Sobres |
| **Logro para avanzar** | Completar 1 semana con gastos (1er cierre) |
| **Opcion manual** | Boton "Ya entendi" |
| **Anuncios** | 1 banner discreto abajo (ya esta enganchado) |

Lo que se desbloquea:
- Tab Sobres (ver, editar, agregar sobres)
- Mini-tutorial: "mira como tu gasto desconto del sobre automaticamente"
- Presupuesto semanal editable
- Configurar saldos

Lo que NO ve todavia:
- Libreta, Pagos, Analisis
- Tarjetas y MSI

### Pilar 3 — AHORRO ("Lo que sobra, se guarda solo")

El cierre de semana y el cochinito. Aqui el usuario ve la magia del sistema.

| Aspecto | Detalle |
|---------|---------|
| **Desbloqueo** | 1er cierre de semana automatico o avance manual |
| **Tabs visibles** | Semana + Libreta + Sobres |
| **Logro para avanzar** | 2+ semanas de uso o avance manual |
| **Opcion manual** | Boton "Siguiente: analisis y mas" |
| **Anuncios** | Banner + 1 interstitial por dia (ya vio el valor) |

Lo que se desbloquea:
- Celebracion: "Tu primer ahorro! $XXX se fueron al cochinito"
- Tab Libreta (historial completo de gastos)
- Historial de cierres en tab Sobres
- Navegacion entre semanas pasadas

Lo que NO ve todavia:
- Pagos, Analisis, Tarjetas, MSI

### Pilar 4 — DOMINIO ("Entiende a donde se va tu dinero")

Herramientas avanzadas para optimizar finanzas. No todos los usuarios llegaran aqui
y eso esta bien — los pilares 1-3 ya dan valor completo.

| Aspecto | Detalle |
|---------|---------|
| **Desbloqueo** | 2+ semanas de uso o avance manual |
| **Tabs visibles** | TODAS (5 tabs) |
| **Logro** | (No hay siguiente pilar, el usuario ya domina la app) |
| **Anuncios** | Banner + interstitial normal + oferta de suscripcion Pro |

Lo que se desbloquea:
- Tab Analisis (graficas por categoria, dia, periodo, tendencia, medio de pago, tarjeta)
- Tab Pagos con sus 3 secciones:
  - Tarjetas de credito
  - Pagos recurrentes con recordatorios
  - Compras a MSI
- Mini-intro al abrir cada seccion por primera vez
- Oferta de suscripcion Pro ($120 MXN/ano)

**Nota sobre Pilar 4**: Analisis, Pagos y MSI son features que agregan mucho valor
a usuarios avanzados pero no son necesarias para el objetivo base de la app. Si un
usuario nunca llega al Pilar 4, los Pilares 1-3 ya le resuelven el problema principal
(controlar gastos y ahorrar). Monitorear en analytics que porcentaje de usuarios llega
y usa activamente el Pilar 4 para decidir si ajustar.

---

## Escala de anuncios (anti-churn)

Principio: **primero enganchas, despues monetizas**.

| Etapa | Anuncios | Por que |
|-------|----------|---------|
| Pilar 1 (0-3 gastos) | CERO | El usuario no conoce la app, cualquier anuncio causa desinstalacion |
| Pilar 2 (primera semana) | 1 banner | Ya esta enganchado, un banner no lo espanta |
| Pilar 3 (despues del 1er cierre) | Banner + 1 interstitial/dia | Ya vio el valor (ahorro automatico), tolera mas |
| Pilar 4 (uso establecido) | Banner + interstitial regular | Aqui aparece la oferta Pro |

La oferta de suscripcion ($120 MXN/ano) se presenta en Pilar 4 como:
"Te gusta la app? Por $10/mes quita los anuncios y exporta tus datos"

---

## Datos a guardar por usuario

Campos nuevos en la tabla `perfiles` (o tabla nueva `progreso_usuario`):

```
pilar_actual          int DEFAULT 1       -- 1, 2, 3, 4
gastos_count          int DEFAULT 0       -- para trigger pilar 1->2
primera_semana_cerrada boolean DEFAULT false -- para trigger pilar 2->3
semanas_con_gastos    int DEFAULT 0       -- para trigger pilar 3->4
fecha_registro        timestamp           -- para escalar anuncios
avanzo_manual         boolean DEFAULT false -- si el usuario salto pilares
```

---

## Transiciones entre pilares

### Pilar 1 -> 2 (automatico al 3er gasto)
```
Celebracion con animacion
"Ya llevas 3 gastos registrados!"
"Ahora te enseno como funcionan los sobres"
[Entendido] -> desbloquea Tab Sobres
```

### Pilar 2 -> 3 (automatico al 1er cierre de semana)
```
Celebracion con el cochinito
"Tu primer ahorro! $XXX al cochinito"
"Esto paso porque no gastaste todo de [sobre X]"
"Ahora tienes la Libreta para ver tu historial"
[Ver mi ahorro] -> desbloquea Tab Libreta
```

### Pilar 3 -> 4 (automatico a las 2 semanas)
```
"Ya dominas lo basico!"
"Ahora tienes acceso a herramientas avanzadas:"
"  Analisis — graficas de a donde se va tu dinero"
"  Pagos — nunca olvides un pago recurrente"
"  Tarjetas — controla tus MSI"
[Explorar] -> desbloquea Tabs Pagos + Analisis
```

---

## Notas de implementacion

- La version `personal` (VITE_APP_MODE=personal) ignora los pilares — todo visible siempre
- La version `public` (VITE_APP_MODE=public) activa el sistema de pilares
- El pilar se guarda en Supabase (persistente entre dispositivos)
- Si el usuario reinstala, su progreso se mantiene (esta en su perfil)
- Los mini-tutoriales de cada seccion usan `localStorage` (se muestran 1 vez)

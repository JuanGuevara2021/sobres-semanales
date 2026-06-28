# Plan Comercial — Sobres Semanales

Fecha: 2026-06-20
Autor: Juan + Claude Code

---

## 1. Analisis de competencia

### Apps similares en Android (metodo de sobres / envelope budgeting)

| App | Precio | Android | Idioma | Ciclo |
|-----|--------|:-------:|--------|-------|
| **Goodbudget** | Gratis (10 sobres) / $10 USD/mes ilimitado | Si | Ingles | Mensual |
| **YNAB** | $14.99 USD/mes ($109 USD/año) | Si | Ingles | Mensual |
| **Envelope** | $14.99 USD/mes ($109 USD/año) | Si | Ingles | Mensual |
| **Plan & Multiply** | Gratis | Si | Ingles | Mensual |
| **Monefy** | Gratis (basico) | Si | Multi | Mensual |

### Diferencias de Sobres Semanales vs competencia

| Aspecto | Sobres Semanales | Apps del mercado |
|---------|------------------|------------------|
| **Periodo** | Semanal (sab-vie) | Mensual casi todas |
| **Precio** | Gratis, sin limites | Gratis limitado o $10-15 USD/mes |
| **Dos dimensiones** | Sobre (presupuesto) + Categoria (analisis) separados | Envelope = categoria (mezclados) |
| **Tipo de cierre** | Ahorro (sobrante va al cochinito) vs Acumula (arrastra) | Solo arrastrar saldo, sin ahorro automatico |
| **Ahorro automatico** | Lo que sobra de sobres tipo "ahorro" se acumula solo | No existe, el ahorro es manual |
| **MSI / Tarjetas** | Rastreo integrado con carga mensual calculada | No incluido, o requiere plan de pago |
| **Sincronizacion** | Tiempo real entre 2 usuarios (hogar) gratis | Goodbudget lo tiene (plan pago), YNAB tambien |
| **Banco** | Sin conexion bancaria (registro manual) | YNAB conecta bancos, Goodbudget no |
| **Moneda/idioma** | MXN, espanol, pensado para Mexico | Ingles, USD por defecto |

### Ventaja competitiva principal

1. **Ahorro automatico** — el sobrante de sobres tipo "ahorro" cae solo al cochinito. Ninguna app del mercado hace esto.
2. **Ciclo semanal** — las apps mensuales no dan control real sobre gastos del dia a dia (tianguis, antojos, transporte).
3. **Gratis y en espanol** — sin limite de sobres, sin suscripcion obligatoria, pensado para Mexico.
4. **Sin datos bancarios** — en Mexico hay desconfianza con dar acceso al banco. El registro manual es ventaja, no limitacion.

---

## 2. Mercado potencial

### Mexico

| Segmento | Personas | Fuente |
|----------|----------|--------|
| Poblacion total Mexico | ~132 millones | Worldometer 2026 |
| Economicamente activos | ~61 millones | INEGI ENOE 2026 |
| Empleo informal (~55%) | ~33 millones | INEGI — cobran semanal o por dia |
| Con smartphone | ~55 millones de los activos (~90%) | DataReportal/Statista |

### Hispanoamerica

| Pais | Poblacion | Informalidad |
|------|----------:|:------------:|
| Mexico | 132M | ~55% |
| Colombia | 52M | ~58% |
| Argentina | 46M | ~45% |
| Peru | 34M | ~70% |
| Chile | 19M | ~27% |
| Ecuador | 18M | ~65% |
| Guatemala | 18M | ~70% |
| Resto Hispanoamerica | ~100M | Variable |
| **Total** | **~420M** | |

La informalidad importa porque esos trabajadores cobran semanal o quincenal — exactamente
el ciclo que la app maneja y que las apps mensuales no cubren.

### Embudo de mercado

| Nivel | Que es | Mexico | Hispanoamerica |
|-------|--------|-------:|---------------:|
| **TAM** (mercado total) | Adultos con smartphone que manejan dinero | ~55M | ~250M |
| **SAM** (mercado alcanzable) | Los que buscarian una app de presupuesto/gastos | ~5.5M (10%) | ~25M |
| **SOM** (mercado obtenible) | Los que la app podria captar realistamente | Año 1-2: 5,000-20,000 / Año 3-5: 50,000-200,000 | Año 3-5: 100,000-500,000 |

---

## 3. Modelo de negocio

### Estrategia: freemium + publicidad hibrido

| Tier | Que recibe el usuario | Ingreso para nosotros |
|------|----------------------|----------------------|
| **Gratis** | App completa + publicidad (banners/interstitials discretos) | Ads genericos → personalizados |
| **Pro ($120 MXN/año)** | Sin anuncios + features extra (exportar datos, mas temas, graficas avanzadas) | Suscripcion |

Precio de $120 MXN/año (~$6.60 USD) — **18x mas barato** que Goodbudget y **16x mas barato** que YNAB.
A ese precio la friccion para pagar es minima; conversion estimada: 5-10% (benchmark freemium: 2-5%).

### Supuestos base para proyecciones

| Dato | Valor | Fuente |
|------|-------|--------|
| Suscripcion anual | $120 MXN (~$6.60 USD) | Propuesta |
| Conversion free → pago | 8% (conservador para precio bajo) | Benchmark 2026 ajustado |
| DAU / MAU (apps finanzas) | ~25% | Promedio industria |
| eCPM banner LATAM Android | ~$0.15 USD | Benchmark 2026 |
| eCPM interstitial LATAM Android | ~$1.50-$1.90 USD | Benchmark 2026 |
| eCPM ads personalizados (fintech) | ~$3-5 USD | Estimado por datos de gasto |

---

## 4. Proyecciones de ingreso

### Solo suscripcion ($120 MXN/año, 8% conversion)

| Usuarios registrados | Pagan (8%) | Ingreso anual |
|---------------------:|----------:|--------------:|
| 1,000 | 80 | $9,600 MXN |
| 5,000 | 400 | $48,000 MXN |
| 10,000 | 800 | $96,000 MXN |
| 50,000 | 4,000 | $480,000 MXN |
| 100,000 | 8,000 | $960,000 MXN |

### Solo publicidad (usuarios gratis, eCPM interstitial LATAM ~$1.70, 25% DAU, 1.5 imp/dia)

| MAU | DAU (~25%) | Ingreso mensual | Ingreso anual |
|----:|-----------:|----------------:|--------------:|
| 1,000 | 250 | $200 - $400 MXN | $2,400 - $4,800 MXN |
| 5,000 | 1,250 | $1,000 - $2,000 MXN | $12,000 - $24,000 MXN |
| 10,000 | 2,500 | $2,000 - $4,000 MXN | $24,000 - $48,000 MXN |
| 50,000 | 12,500 | $10,000 - $20,000 MXN | $120,000 - $240,000 MXN |
| 100,000 | 25,000 | $20,000 - $40,000 MXN | $240,000 - $480,000 MXN |

### Modelo hibrido (suscripcion + publicidad combinados)

| Usuarios | Pagan (8%) | Gratis con ads | Ingreso suscripcion | Ingreso ads | **Total anual** |
|---------:|-----------:|---------------:|--------------------:|------------:|----------------:|
| 1,000 | 80 | 920 | $9,600 | $2,200 | **$11,800** |
| 3,000 | 240 | 2,760 | $28,800 | $6,600 | **$35,400** |
| 5,000 | 400 | 4,600 | $48,000 | $11,000 | **$59,000** |
| 10,000 | 800 | 9,200 | $96,000 | $22,000 | **$118,000** |
| 25,000 | 2,000 | 23,000 | $240,000 | $55,000 | **$295,000** |
| 50,000 | 4,000 | 46,000 | $480,000 | $110,000 | **$590,000** |
| 100,000 | 8,000 | 92,000 | $960,000 | $220,000 | **$1,180,000** |

*Montos en MXN. Ads calculados con eCPM interstitial LATAM (~$1.70), 25% DAU, 1.5 impressions/dia.*

### Hibrido con publicidad personalizada (despues de 6-12 meses con datos de gasto)

Con datos de gasto por categoria se pueden servir ads segmentados:
- Gasta mucho en **casa** → anuncios de supermercados, apps de delivery, productos de limpieza
- Gasta en **salud** → seguros, farmacias, suplementos
- Gasta en **diversion** → streaming, restaurantes, eventos
- Gasta en **tarjetas** → productos financieros, consolidacion de deuda

El eCPM sube a ~$3.50-$5 USD (2-3x sobre generico):

| Usuarios | Suscripcion | Ads personalizados | **Total anual** |
|---------:|------------:|-------------------:|----------------:|
| 10,000 | $96,000 | $45,000 - $65,000 | **$141,000 - $161,000** |
| 25,000 | $240,000 | $112,000 - $162,000 | **$352,000 - $402,000** |
| 50,000 | $480,000 | $225,000 - $325,000 | **$705,000 - $805,000** |
| 100,000 | $960,000 | $450,000 - $650,000 | **$1,410,000 - $1,610,000** |

### Proyeccion por año (escenario conservador, hibrido con ads genericos)

| Escenario | Usuarios | Ingreso anual estimado | Ingreso mensual |
|-----------|----------|----------------------:|-----------:|
| Año 1 — solo CDMX/Mexico organico | 5,000 | $59,000 MXN | ~$4,900 |
| Año 2 — Mexico con marketing basico | 20,000 | $236,000 MXN | ~$19,600 |
| Año 3 — Mexico consolidado | 50,000 | $590,000 MXN | ~$49,100 |
| Año 3-5 — expansion hispanoamerica | 200,000 | $2,360,000 MXN | ~$196,600 |
| Escenario optimista largo plazo | 500,000 | $5,900,000 MXN | ~$491,600 |

---

## 5. Roadmap de comercializacion

### Fase C1 — Preparar app para usuarios publicos (1-2 meses)

- [ ] Onboarding para nuevos usuarios: crear sobres desde cero (no hardcodeados)
- [ ] Flujo de primera vez: tutorial breve de como funciona el metodo de sobres
- [ ] Permitir personalizar el dia de inicio de semana (no todos quieren sab-vie)
- [ ] Soporte para multiples monedas (MXN default, pero permitir COP, ARS, PEN, etc.)
- [ ] Terminos de servicio y politica de privacidad
- [ ] Limpiar datos de prueba / seeds del codigo

### Fase C2 — Publicar en tiendas (2-4 semanas)

- [ ] Empaquetar como APK con Capacitor (el codigo ya esta preparado para esto)
- [ ] Crear cuenta de Google Play Developer ($25 USD, pago unico)
- [ ] Preparar assets para tienda: capturas, descripcion, icono, feature graphic
- [ ] Publicar en Google Play Store
- [ ] Mantener la PWA en Vercel como canal alternativo (web, iOS sin App Store)

### Fase C3 — Landing page y presencia (2-3 semanas)

- [ ] Landing page con propuesta de valor: "Ahorra sin pensarlo — controla tus gastos semana a semana"
- [ ] Seccion de como funciona (3-4 pasos visuales)
- [ ] Boton de descarga a Play Store + link a PWA
- [ ] Formulario de lista de espera / early adopters

### Fase C4 — Monetizacion base (2-4 semanas)

- [ ] Crear cuenta en Google AdMob (admob.google.com, gratis)
- [ ] Instalar plugin Capacitor para AdMob (`@capacitor-community/admob`)
- [ ] Configurar banner fijo (abajo de contenido, arriba de nav)
- [ ] Configurar interstitial en momentos naturales (despues de cerrar semana, al volver de ajustes)
- [ ] Implementar tier Pro: logica de suscripcion con Google Play Billing
- [ ] Features Pro: sin anuncios, exportar gastos a CSV/Excel, temas extra, graficas avanzadas
- [ ] Paywall suave: la app funciona completa gratis, Pro es mejora de experiencia
- [ ] Condicionar ads: `if (!usuario.esPro) { mostrar anuncios }`

#### Reglas de implementacion de anuncios (NO violar)

1. **Nunca mostrar interstitial mientras el usuario registra un gasto** — interrumpir la accion principal causa desinstalaciones
2. **Maximo 1 interstitial cada 2-3 minutos** — demasiados anuncios = mala resena = menos descargas
3. **Nunca hacer clic en tus propios anuncios** — Google banea la cuenta permanentemente
4. **No poner anuncios donde el usuario pueda hacer clic sin querer** — Google penaliza (ej: no poner un banner justo debajo de un boton frecuente)
5. **Usar ads de prueba (test IDs) durante desarrollo** — los ads reales en modo debug tambien causan ban

#### Detalles tecnicos de AdMob

| Concepto | Detalle |
|----------|---------|
| Comision de Google | ~32% (tu recibes ~68% del ingreso por anuncios) |
| Pago minimo | $100 USD acumulados para que Google te deposite |
| Frecuencia de pago | Mensual, por transferencia bancaria |
| eCPM banner LATAM | ~$0.15 USD por 1,000 impresiones |
| eCPM interstitial LATAM | ~$1.50-$1.90 USD por 1,000 impresiones |
| eCPM rewarded LATAM | ~$2-4 USD por 1,000 impresiones |

#### Formatos de anuncio a implementar

| Formato | Donde | Cuando | Pago |
|---------|-------|--------|------|
| **Banner** | Tira fija abajo del contenido, arriba de nav | Siempre visible (usuarios gratis) | Bajo pero constante |
| **Interstitial** | Pantalla completa | Despues de cerrar semana, al volver de ajustes | Medio, ~$1.70/1000 |
| **Rewarded** (fase 2) | El usuario elige verlo | "Mira un anuncio para probar analisis extendido" | Alto, ~$3/1000 |

### Fase C5 — Crecimiento organico (continuo desde mes 3)

- [ ] Contenido en TikTok/Reels: tips de finanzas personales usando la app (gratis, alto alcance en Mexico)
- [ ] SEO del landing: "app para controlar gastos semanal", "sobres de presupuesto Mexico"
- [ ] Pedir resenas en Play Store despues de 2 semanas de uso
- [ ] Referidos: "Invita a tu pareja/roommate" (la app ya soporta 2 usuarios por cuenta)

### Fase C6 — Publicidad personalizada (mes 6-12)

- [ ] Implementar `perfilParaAds()`: calcula categoria top, nivel de gasto, uso de tarjetas
- [ ] Enviar custom signals a AdMob en cada request de anuncio (categoria_top, nivel_gasto, tiene_tarjetas, pais)
- [ ] NUNCA enviar montos, notas, ni datos personales — solo señales anonimizadas
- [ ] Integrar red de ads que soporte segmentos (AdMob con mediacion o similar)
- [ ] A/B testing de formatos y frecuencia de ads para no afectar retencion
- [ ] Medir eCPM real vs generico y ajustar estrategia
- [ ] Con 50k+ usuarios: explorar venta directa de ads a marcas (Walmart, farmacias, etc.)

#### Estrategia de ads personalizados por contexto de gasto

La ventaja competitiva de Sobres Semanales es que sabe EN QUE gasta el usuario.
Esto permite enviar custom signals a AdMob para que muestre anuncios mas relevantes,
lo que sube el eCPM de ~$1.70 a ~$3.50 (2x).

**3 niveles de personalizacion:**

| Nivel | Que es | Cuando | eCPM estimado |
|-------|--------|--------|:-------------:|
| 1. AdMob generico | Google decide que mostrar por IP/historial | Desde el inicio | ~$1.70 |
| 2. Custom signals | Le mandamos categoria_top, nivel_gasto, tiene_tarjetas | Mes 6-12 | ~$3.50 |
| 3. Ads directos | Vender banners a marcas especificas por categoria | Con 50k+ usuarios | ~$8-15 |

**Señales que se envian (anonimizadas, sin datos personales):**

```
categoria_top: "casa"|"diversion"|"salud"|"tarjetas"|etc.  (donde mas gasta, ultimos 30 dias)
nivel_gasto:   "bajo"|"medio"|"alto"                       (< $4k / $4k-$8k / > $8k mensual)
tiene_tarjetas: "si"|"no"                                  (usa medio credito?)
pais:          "MX"|"CO"|"AR"|etc.                         (del perfil de moneda)
```

**Ejemplos de segmentacion:**

| Señal | Anuncios que aparecerian |
|-------|--------------------------|
| categoria_top: "casa" | Walmart, Soriana, productos de limpieza, apps de delivery |
| categoria_top: "diversion" | Uber Eats, Cinepolis, Spotify, streaming |
| categoria_top: "salud" | Farmacias, seguros medicos, GNP, suplementos |
| tiene_tarjetas: "si" | Nu, Rappi Card, consolidacion de deuda |
| nivel_gasto: "alto" | Inversiones, seguros premium, tarjetas de credito |
| nivel_gasto: "bajo" | Ofertas, descuentos, cashback, apps de ahorro |

**Funcion de calculo (se ejecuta en el telefono, no se sube nada):**

```javascript
function perfilParaAds(gastos, moneda) {
  const recientes = gastos.filter(g => esUltimos30Dias(g.fecha));
  const porCat = {};
  let total = 0;
  recientes.forEach(g => {
    porCat[g.categoria] = (porCat[g.categoria] || 0) + Number(g.monto);
    total += Number(g.monto);
  });
  const catTop = Object.entries(porCat).sort((a, b) => b[1] - a[1])[0]?.[0] || "casa";
  const nivel = total > 8000 ? "alto" : total > 4000 ? "medio" : "bajo";
  const usaCredito = recientes.some(g => g.medio_pago === "credito");
  return { categoria_top: catTop, nivel_gasto: nivel, tiene_tarjetas: usaCredito ? "si" : "no", pais: moneda === "MXN" ? "MX" : "LATAM" };
}
```

**Privacidad:** los montos y notas NUNCA salen del telefono. Solo se envian categorias
genericas como custom targeting a AdMob. Esto se declara en la politica de privacidad.

### Fase C7 — Expansion hispanoamerica (año 2-3)

- [ ] Localizar monedas: COP (Colombia), ARS (Argentina), PEN (Peru), CLP (Chile)
- [ ] Adaptar landing y assets de tienda por pais
- [ ] Marketing en redes por pais (el contenido de finanzas es universal en espanol)
- [ ] Considerar partnerships con influencers de finanzas en cada mercado

---

## 6. Costos estimados de operacion

| Concepto | Costo | Frecuencia | Cuando aplica |
|----------|------:|-----------|---------------|
| Supabase (plan gratuito hasta 50k MAU) | $0 | — | Siempre gratis bajo 50k |
| Vercel (plan gratuito) | $0 | — | Siempre gratis bajo limites |
| Google Play Developer | $25 USD (~$450 MXN) | Unico | Al publicar |
| Dominio web (landing page) | ~$200 MXN | Anual | Desde fase C3 |
| Supabase Pro (si superas 50k MAU) | ~$25 USD/mes (~$450 MXN) | Mensual | Solo si > 50k usuarios |
| Vercel Pro (si necesitas mas capacidad) | ~$20 USD/mes (~$360 MXN) | Mensual | Solo si > 50k usuarios |

| Escenario | Costos | Notas |
|-----------|-------:|-------|
| **Año 1 (< 50k usuarios)** | **~$650 MXN total** | $450 Google (unico) + $200 dominio (anual) |
| **Año 2 (< 50k usuarios)** | **~$200 MXN total** | Solo renovacion de dominio |
| **Cuando superes 50k usuarios** | **~$9,920 MXN/año** | Supabase Pro $450/mes + Vercel Pro $360/mes + dominio $200 |

Los costos son extremadamente bajos porque Supabase y Vercel tienen planes gratuitos
generosos que cubren hasta 50,000 usuarios. Hasta ese punto, el unico gasto real es
el pago unico de Google Play ($450 MXN) y el dominio anual ($200 MXN). El margen de
ganancia es altisimo comparado con apps que pagan servidores dedicados.

---

## 7. Fuentes

- [Subscription App Trends & Benchmarks 2026 — RevenueCat](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026/)
- [App Ad Revenue Benchmarks 2026 — RevenueFlex](https://revenueflex.com/blog/app-ad-revenue-benchmarks-2026/)
- [How Much Ad Revenue Can Apps Make 2026 — MonetizeMore](https://www.monetizemore.com/blog/how-much-ad-revenue-can-apps-generate/)
- [Free Trial Conversion Rates 2026 — Adapty](https://adapty.io/blog/trial-conversion-rates-for-in-app-subscriptions/)
- [eCPMs by Format and Region — Udonis](https://www.blog.udonis.co/mobile-marketing/mobile-apps/ecpms)
- [Ad Monetization Benchmark 2026 — Tenjin](https://tenjin.com/blog/ad-mon-gaming-2026/)
- [Digital 2026: Mexico — DataReportal](https://datareportal.com/reports/digital-2026-mexico)
- [ENOE 2026 — INEGI](https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2026/iooe/IOE2026_04.pdf)
- [Smartphone penetration Mexico — Statista](https://www.statista.com/statistics/625424/smartphone-user-penetration-in-mexico/)
- [Poblacion por pais 2026 — Worldometer](https://www.worldometers.info/es/poblacion-mundial/poblacion-por-pais/)
- [Ecosistema Fintech Latam 2026 — Boomit](https://boomit.us/fintech-latam/)
- [Personal Finance Apps Market — Verified Market Research](https://www.verifiedmarketresearch.com/product/personal-finance-apps-market/)
- [Goodbudget](https://goodbudget.com/)
- [Best Budgeting Apps 2026 — envelopebudgeting.com](https://envelopebudgeting.com/articles/best-budgeting-apps)

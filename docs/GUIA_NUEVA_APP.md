# Guia para crear y publicar una app Android desde cero

Basada en la experiencia de Sobres Semanales (junio 2026).
Stack: React + Vite + Supabase + Capacitor + Google Play.

---

## Indice

1. [Antes de escribir codigo](#1-antes-de-escribir-codigo)
2. [Fase 1 — App web funcionando local](#2-fase-1--app-web-funcionando-local)
3. [Fase 2 — Backend con Supabase](#3-fase-2--backend-con-supabase)
4. [Fase 3 — PWA desplegada](#4-fase-3--pwa-desplegada)
5. [Fase 4 — Empaquetar con Capacitor (Android)](#5-fase-4--empaquetar-con-capacitor-android)
6. [Fase 5 — Monetizacion](#6-fase-5--monetizacion)
7. [Fase 6 — Publicar en Google Play](#7-fase-6--publicar-en-google-play)
8. [Cuentas necesarias](#8-cuentas-necesarias)
9. [Checklist pre-publicacion](#9-checklist-pre-publicacion)
10. [Errores que cometimos y como evitarlos](#10-errores-que-cometimos-y-como-evitarlos)
11. [Estructura de archivos recomendada](#11-estructura-de-archivos-recomendada)
12. [Reusar vs empezar de cero](#12-reusar-vs-empezar-de-cero)

---

## 1. Antes de escribir codigo

### 1.1 Define tu app en 3 oraciones
Antes de tocar codigo, responde:
- Que problema resuelve?
- Quien lo va a usar?
- Por que es diferente a lo que ya existe?

### 1.2 Crea la carpeta del proyecto con estos archivos
```
MI_APP/
  CLAUDE.md      ← instrucciones para Claude Code (reglas, stack, decisiones)
  ROADMAP.md     ← fases con checkboxes [JUAN] vs [CC]
```

### 1.3 Leccion aprendida
> CLAUDE.md es el archivo mas importante del proyecto. Invierte tiempo en definir
> bien las reglas de negocio, el stack, y las convenciones ANTES de empezar a
> programar. Claude Code lo lee en cada sesion y sigue lo que dice ahi.

---

## 2. Fase 1 — App web funcionando local

### 2.1 Crear proyecto
```bash
# En la carpeta del proyecto (con CLAUDE.md ya dentro)
npm create vite@latest . -- --template react
npm install
npm install tailwindcss @tailwindcss/vite
```

O pedirle a Claude Code: "Crea un proyecto Vite + React con Tailwind en esta carpeta"

### 2.2 Estructura basica
```
src/
  main.jsx          ← punto de entrada
  App.jsx           ← componente principal
  index.css         ← @import "tailwindcss"
  lib/              ← logica de negocio (supabase.js, config.js, etc.)
  components/       ← componentes reutilizables
  contexts/         ← React Context (auth, config global)
```

### 2.3 Tips
- Mobile-first siempre (380px de ancho como referencia)
- Empieza con datos hardcodeados o localStorage — conecta backend despues
- Valida la idea con un prototipo funcional antes de agregar complejidad
- Usa `npm run dev` para desarrollar con hot reload

---

## 3. Fase 2 — Backend con Supabase

### 3.1 Crear proyecto en Supabase
1. Ir a supabase.com → New Project
2. Guardar: Project URL y anon public key
3. Crear archivo `.env` en la raiz:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 3.2 Instalar y conectar
```bash
npm install @supabase/supabase-js
```

Crear `src/lib/supabase.js`:
```js
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 3.3 Esquema SQL
- Escribir el schema en `supabase/schema.sql`
- Ejecutarlo en Supabase → SQL Editor
- Activar RLS (Row Level Security) desde el inicio — cada usuario solo ve sus datos
- Las migraciones futuras van en archivos separados: `supabase/migration_xxx.sql`

### 3.4 Autenticacion
Supabase Auth incluye login con correo/contrasena gratis. Crear componente `Login.jsx`.

### 3.5 Leccion aprendida
> Escribir el esquema SQL completo ANTES de conectar la app. Cambiar tablas
> despues genera migraciones y bugs. En Sobres tuvimos 8 migraciones que
> pudieron ser 2 si hubieramos definido mejor el modelo desde el inicio.

---

## 4. Fase 3 — PWA desplegada

### 4.1 Archivos necesarios
```
public/
  manifest.json     ← nombre, iconos, theme_color
  icon-192.png      ← icono 192x192
  icon-512.png      ← icono 512x512
  sw.js             ← service worker (cache basico)
```

### 4.2 manifest.json minimo
```json
{
  "name": "Mi App",
  "short_name": "MiApp",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0B7A4B",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 4.3 Desplegar en Vercel
1. Subir codigo a GitHub
2. Ir a vercel.com → Add New Project → importar el repo
3. Agregar variables de entorno (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
4. Deploy — cada push a main se despliega automaticamente

### 4.4 Leccion aprendida
> La PWA funciona como app instalable en el celular (menu → "Agregar a pantalla
> de inicio"). Usala asi unas semanas antes de empaquetar con Capacitor —
> valida que la app realmente sirve antes de invertir en Google Play.

---

## 5. Fase 4 — Empaquetar con Capacitor (Android)

### 5.1 Instalar Capacitor
```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Mi App" com.midominio.miapp --web-dir dist
npx cap add android
```

### 5.2 Build y sincronizar
```bash
npm run build          # genera dist/
npx cap sync android   # copia dist/ al proyecto Android
```

### 5.3 Generar keystore de firma (UNA SOLA VEZ)
```bash
keytool -genkeypair -v -keystore mi-app.jks -keyalg RSA -keysize 2048 \
  -validity 10000 -alias mi-app
```
Guardar el keystore y contrasena en lugar seguro FUERA del repo.

### 5.4 Configurar firma en android/
Crear `android/keystore.properties`:
```
storeFile=C:\\ruta\\al\\mi-app.jks
storePassword=MiContrasena
keyAlias=mi-app
keyPassword=MiContrasena
```

Agregar en `android/app/build.gradle` (seccion signingConfigs).

### 5.5 Generar AAB firmado
```bash
cd android
./gradlew bundleRelease
```
El AAB queda en `android/app/build/outputs/bundle/release/app-release.aab`

### 5.6 Leccion aprendida
> El keystore es IRREEMPLAZABLE. Si lo pierdes, no puedes actualizar tu app
> en Google Play — tendrias que publicar una app nueva. Haz backup del .jks
> y guarda la contrasena en tu archivo de credenciales.

---

## 6. Fase 5 — Monetizacion

### 6.1 Anuncios con AdMob

**Instalar:**
```bash
npm install @capacitor-community/admob
```

**Crear ad units en admob.google.com:**
- Banner (rectangulo fijo abajo)
- Interstitial (pantalla completa, usar con moderacion)

**Logica en `src/lib/ads.js`:**
- Centralizar toda la logica de ads en un modulo
- Respetar tiempos entre interstitials (min 3 minutos)
- NO poner `isTesting: true` en produccion (nos paso)

**AndroidManifest.xml:**
```xml
<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID"
           android:value="ca-app-pub-XXXXXXX~YYYYYYY"/>
```

### 6.2 Suscripcion Pro con RevenueCat

**Instalar:**
```bash
npm install @revenuecat/purchases-capacitor
```

**Configurar en revenucat.com:**
1. Crear app Android
2. Crear entitlement (ej: "pro")
3. Crear producto (ej: "mi_app_pro_anual")
4. Copiar API key publica (empieza con `goog_`)

**Logica en `src/lib/pro.js`:**
- `checkProStatus()` — verificar si es Pro
- `purchasePro()` — iniciar compra
- `restorePurchases()` — restaurar compra anterior

**En Google Play Console:**
- Crear suscripcion con el mismo ID del producto de RevenueCat

### 6.3 Leccion aprendida
> RevenueCat es gratis hasta $2,500 USD/mes de revenue. Maneja toda la
> complejidad de suscripciones (renovaciones, cancelaciones, reembolsos).
> Sin el, tendrias que implementar Google Play Billing directamente — mucho
> mas complejo.

---

## 7. Fase 6 — Publicar en Google Play

### 7.1 Prerequisitos
- [ ] Cuenta Google Play Developer ($25 USD, pago unico) — ya la tienes
- [ ] AAB firmado
- [ ] Icono 512x512 PNG
- [ ] Feature graphic 1024x500 PNG
- [ ] 5-8 capturas de pantalla
- [ ] Textos: titulo, descripcion breve (80 chars), descripcion completa
- [ ] Politica de privacidad (URL publica)
- [ ] Correo de contacto

### 7.2 En Google Play Console
1. Crear nueva app
2. Subir AAB en "Produccion" → "Crear nueva version"
3. Subir icono, feature graphic y capturas en "Presencia en Play Store"
4. Llenar textos (titulo, descripciones)
5. Llenar formularios:
   - Clasificacion de contenido (cuestionario IARC)
   - Declaracion de datos (Data Safety) — que datos recopilas y compartes
   - Ads declaration — si tiene anuncios
6. Pegar URLs de privacidad y terminos
7. Seleccionar paises
8. Enviar a revision (1-7 dias para apps nuevas)

### 7.3 Documentos legales
Necesitas tener publicados en una URL:
- **Politica de privacidad** — que datos recopilas, como los usas, como eliminarlos
- **Terminos de servicio** — reglas de uso de la app

Se pueden servir como paginas estaticas desde Vercel (`/privacidad.html`, `/terminos.html`).

### 7.4 Leccion aprendida
> Prepara los textos de la tienda y los formularios ANTES de subir el AAB.
> Google rechaza apps por falta de politica de privacidad o clasificacion
> incompleta. Tener todo listo de antemano evita rechazos.

---

## 8. Cuentas necesarias

Todas se pueden crear con la misma cuenta de Google.

| Servicio | Para que | Costo | URL |
|----------|----------|-------|-----|
| Google Play Developer | Publicar apps | $25 USD (unico) | play.google.com/console |
| Supabase | Base de datos + Auth | Gratis (hasta 500MB) | supabase.com |
| Vercel | Hosting web/PWA | Gratis | vercel.com |
| GitHub | Repositorio de codigo | Gratis | github.com |
| Google AdMob | Anuncios | Gratis | admob.google.com |
| RevenueCat | Suscripciones in-app | Gratis (hasta $2.5k/mes) | revenuecat.com |
| Firebase | Crashlytics + Analytics | Gratis (plan Spark) | console.firebase.google.com |

**Total para arrancar: $25 USD** (la cuenta de developer). Todo lo demas es gratis.

**Tip:** la cuenta de Play Developer sirve para TODAS tus apps — no pagas de nuevo.

---

## 9. Checklist pre-publicacion

### Codigo
- [ ] `isTesting: false` en ads (o quitado)
- [ ] API keys reales (AdMob, RevenueCat), no de prueba
- [ ] `.env` con variables correctas, nunca commiteado a git
- [ ] Build exitoso (`npm run build`)
- [ ] Sin comillas sueltas, dead code, ni console.log olvidados
- [ ] Ortografia correcta en textos visibles al usuario
- [ ] Meta tags SEO y Open Graph en index.html
- [ ] Politica de privacidad y terminos accesibles por URL

### Android
- [ ] `google-services.json` en `android/app/`
- [ ] Keystore configurado y respaldado
- [ ] AAB firmado generado
- [ ] Version correcta en `build.gradle` (versionCode + versionName)

### Google Play Console
- [ ] Icono 512x512
- [ ] Feature graphic 1024x500
- [ ] 5-8 capturas de pantalla
- [ ] Titulo y descripciones
- [ ] Clasificacion de contenido completada
- [ ] Data Safety completada
- [ ] Politica de privacidad URL pegada
- [ ] Correo de contacto configurado
- [ ] Paises seleccionados

### Credenciales
- [ ] Archivo de credenciales FUERA del repo con todas las keys y contrasenas
- [ ] Keystore respaldado en lugar seguro

---

## 10. Errores que cometimos y como evitarlos

### 1. `isTesting: true` en produccion
**Que paso:** los anuncios de AdMob tenian la flag de prueba activada. Funcionaban
pero no generaban revenue.
**Como evitarlo:** en tu checklist pre-publicacion, grep por `isTesting` antes de
generar el AAB.

### 2. Comillas sueltas en className
**Que paso:** al usar template literals con clases CSS, quedaron `"` sueltas en
14 lugares. No rompia nada visible pero generaba HTML invalido.
**Como evitarlo:** buscar `className={` + `"` con regex antes de publicar.

### 3. Demasiadas migraciones SQL
**Que paso:** el esquema se fue definiendo sobre la marcha. Terminamos con 8
archivos de migracion cuando con mejor planeacion hubieran sido 2.
**Como evitarlo:** define el modelo de datos completo en CLAUDE.md ANTES de
crear las tablas. Es mas facil cambiar texto que ALTER TABLE.

### 4. Un solo archivo de 2,500 lineas
**Que paso:** App.jsx crecio hasta tener todo (tabs, modales, forms, settings).
Funciona pero es dificil de mantener.
**Como evitarlo:** desde el inicio, cada tab/modal en su propio archivo. Un
componente no deberia pasar de 300 lineas.

### 5. Precio hardcodeado en 3 lugares
**Que paso:** "$120 MXN/ano" escrito en 3 archivos distintos. Si cambia, hay
que acordarse de todos.
**Como evitarlo:** constantes en un solo archivo (`pro.js`), importar donde se usen.

### 6. Afirmaciones exageradas ("encriptados")
**Que paso:** la landing decia "datos encriptados" cuando Supabase solo usa TLS
en transito, no cifrado end-to-end.
**Como evitarlo:** no prometas mas de lo que tu stack realmente hace. "Conexion
segura" es correcto; "encriptado" implica E2E.

### 7. Version hardcodeada en multiples archivos
**Que paso:** "v1.0.0" en Landing, Settings y "Reportar problema".
**Como evitarlo:** importar version de `package.json` y usarla en todos lados.

### 8. Boton de Play Store antes de publicar
**Que paso:** el boton "Descargar en Google Play" llevaba a una URL 404.
**Como evitarlo:** mostrar "Proximamente" hasta que la app este publicada.

---

## 11. Estructura de archivos recomendada

```
MI_APP/
├── CLAUDE.md                    ← reglas para Claude Code
├── ROADMAP.md                   ← fases con checkboxes
├── package.json
├── vite.config.js
├── index.html                   ← meta tags SEO, OG, manifest
├── .env                         ← keys de Supabase (NO commitear)
├── .gitignore
│
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon.svg
│   ├── feature-graphic.png
│   ├── privacidad.html
│   └── terminos.html
│
├── src/
│   ├── main.jsx
│   ├── App.jsx                  ← componente raiz (< 200 lineas)
│   ├── index.css
│   │
│   ├── components/              ← un archivo por componente/tab/modal
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── TabPrincipal.jsx
│   │   ├── Settings.jsx
│   │   └── ...
│   │
│   ├── contexts/                ← React Context
│   │   ├── AuthContext.jsx
│   │   └── AppContext.jsx
│   │
│   └── lib/                     ← logica sin UI
│       ├── supabase.js
│       ├── config.js            ← constantes, helpers
│       ├── ads.js               ← AdMob
│       ├── pro.js               ← RevenueCat, precio, version
│       ├── crashlytics.js       ← Firebase Crashlytics
│       └── appMode.js           ← personal vs public
│
├── supabase/
│   ├── schema.sql               ← esquema completo
│   └── migration_xxx.sql        ← migraciones futuras
│
├── android/                     ← generado por Capacitor
│   └── app/
│       ├── google-services.json ← Firebase (NO commitear)
│       └── build.gradle
│
├── store-assets/                ← capturas para Play Store
│
└── docs/
    ├── DECISIONES.md            ← bitacora de decisiones
    ├── GOOGLE_PLAY_LISTING.md   ← textos de la tienda
    ├── POLITICA_DE_PRIVACIDAD.md
    └── TERMINOS_DE_SERVICIO.md
```

---

## 12. Reusar vs empezar de cero

### Lo que puedes copiar de Sobres Semanales a cualquier app nueva

**Copiar tal cual (solo cambiar IDs/nombres):**
- `src/lib/ads.js` — logica de AdMob (banner + interstitial)
- `src/lib/pro.js` — logica de RevenueCat (checkPro, purchase, restore, precio)
- `src/lib/crashlytics.js` — Firebase Crashlytics
- `src/lib/review.js` — prompt de resena en Play Store
- `src/lib/appMode.js` — flag personal vs public
- `src/components/Login.jsx` — login con Supabase Auth
- `src/contexts/AuthContext.jsx` — contexto de autenticacion
- `android/app/build.gradle` — configuracion de firma y plugins
- `docs/POLITICA_DE_PRIVACIDAD.md` — plantilla (cambiar nombre de app)
- `docs/TERMINOS_DE_SERVICIO.md` — plantilla (cambiar nombre de app)
- Estructura de `index.html` con meta tags

**Copiar la logica pero adaptar:**
- `src/lib/supabase.js` — mismo patron, diferentes tablas
- `vite.config.js` — mismo setup
- `public/manifest.json` — cambiar nombre, colores, iconos
- `CLAUDE.md` — misma estructura, diferentes reglas de negocio

**NO copiar (es especifico de Sobres):**
- App.jsx y todos los componentes de UI
- Schema SQL
- Seeds
- Logica de sobres, cierres, semanas, etc.

### Mi recomendacion

**Crea un template/boilerplate** con todo lo reutilizable:

```bash
# Crear carpeta template
MI_TEMPLATE/
  src/lib/ads.js        ← con IDs placeholder
  src/lib/pro.js        ← con key placeholder
  src/lib/crashlytics.js
  src/lib/review.js
  src/lib/appMode.js
  src/lib/supabase.js
  src/components/Login.jsx
  src/contexts/AuthContext.jsx
  docs/POLITICA_DE_PRIVACIDAD_TEMPLATE.md
  docs/TERMINOS_DE_SERVICIO_TEMPLATE.md
  CLAUDE_TEMPLATE.md
  ROADMAP_TEMPLATE.md
```

Para cada app nueva:
1. Copia el template
2. Cambia nombres, IDs y keys
3. Escribe CLAUDE.md con las reglas de tu nueva app
4. Desarrolla la UI y logica especifica

**Esto te ahorra ~40% del trabajo** — toda la infraestructura de monetizacion,
auth, crash reporting y deploy ya esta resuelta. Solo te enfocas en la app.

### Cuentas que ya tienes y sirven para todas las apps
- Google Play Developer (la misma para publicar N apps)
- AdMob (creas nuevos ad units por app)
- RevenueCat (creas nueva app dentro de la misma cuenta)
- Firebase (creas nuevo proyecto por app)
- Supabase (creas nuevo proyecto por app, gratis cada uno)
- Vercel (creas nuevo proyecto por repo)
- GitHub (un repo por app)

---

> Documento creado el 2026-06-29 basado en la experiencia de Sobres Semanales.
> Actualizar conforme se publiquen mas apps.

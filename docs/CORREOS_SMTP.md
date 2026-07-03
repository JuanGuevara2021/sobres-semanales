# Correos transaccionales — SMTP propio

Contexto (2026-07-03): Supabase mando aviso de bounces y su servicio integrado de correo
es solo para desarrollo (~2-4 correos/hora). Con la confirmacion de correo activa, los
testers dependen de estos correos para entrar. Plan en dos etapas:

- **Etapa 1 (ahora, gratis)**: SMTP de Gmail con la cuenta `sobressemanalesapp@gmail.com`.
  Alcanza para prueba cerrada y lanzamiento suave (~100-500 correos/dia).
- **Etapa 2 (al lanzar en serio)**: comprar `sobressemanales.com` (~$11 USD/año en Vercel,
  disponible al 2026-07-03) + Resend gratis (3,000/mes) con el dominio verificado.

---

## Etapa 1 — SMTP de Gmail (pasos de Juan, ~15 min)

### A. Crear contraseña de aplicacion en Google

1. Inicia sesion en `sobressemanalesapp@gmail.com`
2. Ve a https://myaccount.google.com → **Seguridad**
3. Activa **Verificacion en 2 pasos** si no esta activa (obligatoria para el paso siguiente)
4. Busca **Contraseñas de aplicaciones** (o entra directo: https://myaccount.google.com/apppasswords)
5. Nombre de la app: `Supabase Sobres` → **Crear**
6. Google muestra una contraseña de 16 letras — **copiala** (solo se ve una vez)

### B. Conectar el SMTP en Supabase

1. https://supabase.com/dashboard → proyecto `sobres-semanales`
2. **Project Settings** (engrane) → **Authentication** → seccion **SMTP Settings**
3. Activa **Enable Custom SMTP** y llena:
   - Sender email: `sobressemanalesapp@gmail.com`
   - Sender name: `Sobres Semanales`
   - Host: `smtp.gmail.com`
   - Port: `465`
   - Username: `sobressemanalesapp@gmail.com`
   - Password: la contraseña de aplicacion de 16 letras
4. **Save**
5. En **Authentication → Rate Limits**, sube el limite de correos (ej. 30/hora)

### C. Probar

1. Registrarse en la app con un alias real: `juan.baltazar1949+smtp1@gmail.com`
2. Verificar que el correo de confirmacion llega y viene DE `sobressemanalesapp@gmail.com`
3. Avisar a Claude Code para borrar la cuenta de prueba

---

## Plantillas en español (Supabase → Authentication → Email Templates)

Los correos default estan en ingles. Pegar estos textos:

### Confirm signup — Asunto: `Confirma tu correo — Sobres Semanales`

```html
<h2>¡Bienvenido a Sobres Semanales! 💌</h2>
<p>Estas a un paso de empezar a controlar tus gastos. Confirma tu correo con el boton:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar mi correo</a></p>
<p>Si tu no creaste esta cuenta, ignora este mensaje.</p>
```

### Reset password — Asunto: `Recupera tu contraseña — Sobres Semanales`

```html
<h2>Recuperar contraseña</h2>
<p>Recibimos una solicitud para cambiar tu contraseña. Usa este enlace:</p>
<p><a href="{{ .ConfirmationURL }}">Cambiar mi contraseña</a></p>
<p>Si tu no lo pediste, ignora este mensaje — tu cuenta sigue segura.</p>
```

### Magic link — Asunto: `Tu enlace de acceso — Sobres Semanales`

```html
<h2>Tu enlace de acceso</h2>
<p>Entra a Sobres Semanales con un clic:</p>
<p><a href="{{ .ConfirmationURL }}">Entrar a mi cuenta</a></p>
<p>Si tu no lo pediste, ignora este mensaje.</p>
```

---

## Etapa 2 — Dominio + Resend (al preparar el lanzamiento publico)

1. **[JUAN]** Comprar `sobressemanales.com` en https://vercel.com/domains/search?q=sobressemanales.com (~$11.25 USD/año; disponible al 2026-07-03)
2. **[JUAN]** Asignar el dominio al proyecto `sobres-semanales` en Vercel (la landing queda en https://sobressemanales.com)
3. **[JUAN]** Crear cuenta gratis en https://resend.com → Domains → Add Domain → `sobressemanales.com`
4. **[JUAN/CC]** Resend da 2-3 registros DNS (SPF/DKIM) → agregarlos en Vercel → proyecto → Domains → DNS
5. **[JUAN]** En Resend: API Keys → crear key
6. **[JUAN/CC]** En Supabase SMTP Settings cambiar a:
   - Sender: `no-reply@sobressemanales.com` · Host: `smtp.resend.com` · Port: `465`
   - Username: `resend` · Password: la API key
7. De paso quedan resueltos `soporte@` y `privacidad@` (forwarding gratis en Vercel/ImprovMX)

## Reglas permanentes

- NUNCA registrar cuentas de prueba con correos inventados — solo alias reales
  (`juan.baltazar1949+loquesea@gmail.com`). Los rebotes danan la reputacion de envio.
- Antes de campañas o mas testers, revisar el limite diario de Gmail (~100-500/dia);
  si se acerca, adelantar la Etapa 2.

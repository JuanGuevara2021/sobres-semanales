# Politica de Privacidad — Sobres Semanales

Ultima actualizacion: 28 de junio de 2026

---

## 1. Introduccion

Sobres Semanales ("la App", "nosotros") respeta tu privacidad. Esta Politica de Privacidad describe que datos recopilamos, como los usamos, con quien los compartimos y como puedes ejercer tus derechos. Al usar la App, aceptas las practicas descritas aqui.

## 2. Responsable del tratamiento de datos

Sobres Semanales
Ciudad de Mexico, Mexico
Correo de contacto: privacidad@sobressemanales.com

## 3. Datos que recopilamos

### 3.1 Datos que TU nos proporcionas

| Dato | Para que lo usamos | Obligatorio |
|------|-------------------|:-----------:|
| Correo electronico | Crear tu cuenta e iniciar sesion | Si |
| Nombre | Personalizar la App ("Hola, Juan") | Si |
| Contrasena | Autenticacion (se almacena encriptada, nunca la vemos en texto) | Si |
| Gastos (monto, nota, fecha, categoria, medio de pago) | Funcion principal de la App | Si |
| Sobres (nombre, presupuesto, tipo de cierre) | Organizacion del presupuesto | Si |
| Tarjetas de credito (nombre, banco, ultimos 4 digitos, dia corte/pago) | Rastreo informativo de pagos | No |
| Pagos recurrentes (nombre, monto, frecuencia) | Recordatorios de pagos | No |
| Compras a meses sin intereses (concepto, monto, meses) | Rastreo de deudas | No |
| Preferencia de tema visual | Personalizar la apariencia | No |
| Moneda (MXN, COP, ARS, etc.) | Formato de montos | Si |

### 3.2 Datos que recopilamos AUTOMATICAMENTE

| Dato | Como lo obtenemos | Para que |
|------|-------------------|---------|
| Pais y ciudad aproximada | Direccion IP (a traves de Google AdMob) | Mostrar anuncios relevantes por region |
| Modelo de dispositivo y version de Android | Google AdMob SDK | Compatibilidad y optimizacion de anuncios |
| Identificador de publicidad (GAID) | Google AdMob SDK | Personalizacion de anuncios (el usuario puede desactivarlo en Ajustes de Android) |
| Datos de uso de la App (pantallas visitadas, tiempo de sesion) | Google AdMob SDK | Optimizacion de anuncios |

### 3.3 Datos que NO recopilamos

- Ubicacion GPS exacta
- Contactos, fotos, mensajes o llamadas
- Numeros completos de tarjetas de credito o debito
- Datos bancarios (no conectamos a bancos)
- Informacion biometrica
- Datos de salud

## 4. Como usamos tus datos

| Uso | Base legal |
|-----|-----------|
| Operar la App (guardar gastos, calcular presupuestos, sincronizar) | Ejecucion del servicio |
| Mostrarte anuncios (version gratuita) | Interes legitimo / Consentimiento |
| Personalizar anuncios por categoria general de gasto | Interes legitimo |
| Enviarte notificaciones dentro de la App (recordatorios de pago) | Ejecucion del servicio |
| Mejorar la App (analisis de uso agregado y anonimizado) | Interes legitimo |

### 4.1 Personalizacion de anuncios

Para mostrarte anuncios mas relevantes, enviamos las siguientes **senales anonimizadas** a Google AdMob al solicitar un anuncio:

- **Categoria general de gasto** (ejemplo: "casa", "diversion", "salud") — la categoria en la que mas gastas, no los montos.
- **Nivel de gasto** ("bajo", "medio", "alto") — un rango general, no cifras.
- **Si usas tarjetas de credito** ("si" o "no").
- **Pais** (derivado de tu moneda configurada).

**Nunca compartimos con AdMob ni con ningun tercero:**
- Montos especificos de tus gastos
- Notas o descripciones de gastos
- Nombres de sobres o configuraciones personales
- Tu nombre o correo electronico

## 5. Con quien compartimos tus datos

| Tercero | Que datos recibe | Para que |
|---------|-----------------|---------|
| **Supabase** (backend/base de datos) | Todos los datos de tu cuenta (encriptados en transito y en reposo) | Almacenamiento y sincronizacion |
| **Google AdMob** (publicidad) | Senales anonimizadas de categoria/nivel, GAID, IP, datos del dispositivo | Mostrar anuncios relevantes |
| **Google Play** (pagos) | Datos de transaccion de suscripcion | Procesar pagos de Plan Pro |
| **Vercel** (alojamiento web) | Solicitudes HTTP (version web/PWA) | Servir la aplicacion web |

**No vendemos tus datos personales a terceros.**

## 6. Almacenamiento y seguridad

- Tus datos se almacenan en servidores de Supabase con encriptacion en transito (TLS) y en reposo.
- Las contrasenas se almacenan con hash seguro (bcrypt); nunca las vemos en texto plano.
- Aplicamos Row Level Security (RLS): cada usuario solo puede acceder a los datos de su propia cuenta.
- Los datos de la version web (tema, fondo custom) se almacenan localmente en tu navegador (localStorage) y no se envian a ningun servidor.

## 7. Retencion de datos

- Tus datos se conservan mientras tu cuenta este activa.
- Si solicitas la eliminacion de tu cuenta, todos tus datos personales seran borrados dentro de 30 dias.
- Los datos anonimizados y agregados (estadisticas generales de uso) pueden conservarse indefinidamente.
- Los respaldos automaticos se eliminan dentro de 90 dias despues de la solicitud de borrado.

## 8. Tus derechos

De acuerdo con la Ley Federal de Proteccion de Datos Personales en Posesion de los Particulares (LFPDPPP) de Mexico y normativas aplicables, tienes derecho a:

| Derecho | Como ejercerlo |
|---------|---------------|
| **Acceso** — saber que datos tenemos de ti | Escribe a privacidad@sobressemanales.com |
| **Rectificacion** — corregir datos inexactos | Desde la App (nombre, moneda) o por correo |
| **Cancelacion** — eliminar tu cuenta y datos | Escribe a privacidad@sobressemanales.com |
| **Oposicion** — oponerte al uso de tus datos | Escribe a privacidad@sobressemanales.com |
| **Revocar consentimiento** — retirar permisos | Desinstalar la App o escribir a privacidad@sobressemanales.com |
| **Desactivar anuncios personalizados** | Ajustes de Android > Google > Anuncios > Desactivar personalizacion |

Responderemos a tu solicitud dentro de 20 dias habiles.

## 9. Menores de edad

La App no esta dirigida a menores de 13 anos. No recopilamos intencionalmente datos de menores. Si descubrimos que un menor ha creado una cuenta, la eliminaremos.

## 10. Cookies y tecnologias similares

- La version web (PWA) utiliza localStorage para almacenar preferencias visuales (tema, fondo). No usamos cookies de rastreo propias.
- Google AdMob puede usar cookies o identificadores para personalizar anuncios. Puedes gestionar esto en los ajustes de privacidad de tu dispositivo Android.

## 11. Transferencias internacionales de datos

Tus datos pueden almacenarse en servidores ubicados fuera de Mexico (Supabase utiliza infraestructura en la nube). Al usar la App, consientes esta transferencia. Los proveedores que utilizamos cumplen con estandares de seguridad internacionales.

## 12. Cambios a esta politica

- Podemos actualizar esta Politica de Privacidad periodicamente.
- Te notificaremos de cambios significativos a traves de la App.
- La fecha de "ultima actualizacion" al inicio de este documento refleja la version vigente.

## 13. Contacto

Para dudas o solicitudes sobre privacidad:

- Correo: privacidad@sobressemanales.com
- Dentro de la App: Ajustes > Privacidad

---

Sobres Semanales
Ciudad de Mexico, Mexico

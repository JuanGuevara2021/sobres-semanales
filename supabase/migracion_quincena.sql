-- Migracion: quincena (sueldo y dias de cobro por cuenta)
-- Fecha: 2026-11-13
-- Ejecutar en Supabase SQL Editor. Es aditiva: no toca datos existentes.
--
-- sueldo_quincenal: NULL = nunca configurado · 0 = el usuario la desactivo
-- dia_cobro_1/2:    dias del mes en que llega el sueldo (31 = fin de mes)
--
-- Mientras no se corra, la app guarda el sueldo solo en el dispositivo
-- (ver src/lib/quincenaConfig.js) y lo sube sola cuando existan las columnas.

ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS sueldo_quincenal numeric;
ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS dia_cobro_1 integer DEFAULT 15;
ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS dia_cobro_2 integer DEFAULT 30;

-- Migration v2.1e: soporte para semanal (dia de semana) y quincenal (2 dias)

-- 1. Quitar constraint viejo de dia_pago y poner uno que acepte 0-31
--    (0-6 = dia de semana para pagos semanales, 1-31 = dia del mes para mensual/quincenal)
ALTER TABLE pagos_recurrentes DROP CONSTRAINT IF EXISTS pagos_recurrentes_dia_pago_check;
ALTER TABLE pagos_recurrentes ADD CONSTRAINT pagos_recurrentes_dia_pago_check
  CHECK (dia_pago BETWEEN 0 AND 31);

-- 2. Agregar dia_pago_2 para pagos quincenales (segundo dia del mes)
ALTER TABLE pagos_recurrentes ADD COLUMN IF NOT EXISTS dia_pago_2 int
  CHECK (dia_pago_2 BETWEEN 1 AND 31);

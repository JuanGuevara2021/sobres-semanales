-- Migration v2.1b: presupuesto semanal + pagos recurrentes + frecuencia

-- 1. Presupuesto semanal editable (independiente de la suma de sobres)
ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS presupuesto_semanal numeric(10,2) DEFAULT 3000;
UPDATE cuentas SET presupuesto_semanal = 3000 WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- 2. Policy de UPDATE para cuentas
DO $$ BEGIN
  CREATE POLICY upd ON cuentas FOR UPDATE USING (id = cuenta_id_del_usuario());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Campos adicionales en pagos_recurrentes
ALTER TABLE pagos_recurrentes ADD COLUMN IF NOT EXISTS frecuencia text DEFAULT 'mensual';
ALTER TABLE pagos_recurrentes ADD COLUMN IF NOT EXISTS medio_pago medio_pago_t DEFAULT 'debito';

-- 4. Seed: 12 pagos recurrentes iniciales
INSERT INTO pagos_recurrentes (cuenta_id, nombre, monto_estimado, dia_pago, destino_sobre_id, categoria, frecuencia, medio_pago, activo) VALUES
  ('a0000000-0000-0000-0000-000000000001', E'Psicóloga Clara', 200, NULL, 'b0000000-0000-0000-0000-000000000010', 'salud', 'semanal', 'transferencia', true),
  ('a0000000-0000-0000-0000-000000000001', E'Psicólogo Juan', 200, NULL, 'b0000000-0000-0000-0000-000000000010', 'salud', 'semanal', 'transferencia', true),
  ('a0000000-0000-0000-0000-000000000001', 'Spotify', 189, 15, 'b0000000-0000-0000-0000-000000000006', 'diversion', 'mensual', 'debito', true),
  ('a0000000-0000-0000-0000-000000000001', 'HBO Max', 200, 15, 'b0000000-0000-0000-0000-000000000006', 'diversion', 'mensual', 'debito', true),
  ('a0000000-0000-0000-0000-000000000001', 'PlayStation Plus', 200, 15, 'b0000000-0000-0000-0000-000000000006', 'diversion', 'mensual', 'debito', true),
  ('a0000000-0000-0000-0000-000000000001', 'Claude', 355, 15, 'b0000000-0000-0000-0000-000000000006', 'diversion', 'mensual', 'debito', true),
  ('a0000000-0000-0000-0000-000000000001', E'Mercado Crédito', 1907, 15, NULL, 'tarjetas', 'mensual', 'debito', true),
  ('a0000000-0000-0000-0000-000000000001', 'Stori', 1335, 15, NULL, 'tarjetas', 'mensual', 'debito', true),
  ('a0000000-0000-0000-0000-000000000001', 'BBVA Azul', 2017, 15, NULL, 'tarjetas', 'mensual', 'debito', true),
  ('a0000000-0000-0000-0000-000000000001', 'BBVA Vive', 3000, 15, NULL, 'tarjetas', 'mensual', 'debito', true),
  ('a0000000-0000-0000-0000-000000000001', E'Préstamo BBVA', 927, 15, NULL, 'tarjetas', 'mensual', 'debito', true),
  ('a0000000-0000-0000-0000-000000000001', E'Teléfono', 506, 15, 'b0000000-0000-0000-0000-000000000007', 'casa', 'mensual', 'debito', true);

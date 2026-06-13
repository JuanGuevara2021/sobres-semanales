-- Migration v2.1c: Tarjetas de credito

-- 1. Tabla tarjetas
CREATE TABLE IF NOT EXISTS tarjetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id uuid NOT NULL REFERENCES cuentas(id),
  nombre text NOT NULL,
  banco text,
  ultimos4 text,
  dia_corte int,
  dia_pago int,
  activo boolean DEFAULT true,
  creado_en timestamptz DEFAULT now()
);

ALTER TABLE tarjetas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY sel_tarjetas ON tarjetas FOR SELECT USING (cuenta_id = cuenta_id_del_usuario()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY ins_tarjetas ON tarjetas FOR INSERT WITH CHECK (cuenta_id = cuenta_id_del_usuario()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY upd_tarjetas ON tarjetas FOR UPDATE USING (cuenta_id = cuenta_id_del_usuario()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY del_tarjetas ON tarjetas FOR DELETE USING (cuenta_id = cuenta_id_del_usuario()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. tarjeta_id en gastos, compras_msi y pagos_recurrentes
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS tarjeta_id uuid REFERENCES tarjetas(id);
ALTER TABLE compras_msi ADD COLUMN IF NOT EXISTS tarjeta_id uuid REFERENCES tarjetas(id);
ALTER TABLE pagos_recurrentes ADD COLUMN IF NOT EXISTS tarjeta_id uuid REFERENCES tarjetas(id);

-- 3. Seed: 4 tarjetas del usuario
INSERT INTO tarjetas (id, cuenta_id, nombre, banco, dia_corte, dia_pago) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'BBVA Azul', 'BBVA', 15, 5),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'BBVA Vive', 'BBVA', 15, 5),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Stori', 'Stori', 15, 5),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Mercado Credito', 'Mercado Libre', 15, 5)
ON CONFLICT (id) DO NOTHING;

-- 4. Vincular MSI existentes a tarjeta
UPDATE compras_msi SET tarjeta_id = 'c0000000-0000-0000-0000-000000000001' WHERE tarjeta = 'BBVA Azul' AND tarjeta_id IS NULL;

-- 5. Vincular pagos recurrentes de tarjetas
UPDATE pagos_recurrentes SET tarjeta_id = 'c0000000-0000-0000-0000-000000000001' WHERE nombre = 'BBVA Azul' AND categoria = 'tarjetas' AND tarjeta_id IS NULL;
UPDATE pagos_recurrentes SET tarjeta_id = 'c0000000-0000-0000-0000-000000000002' WHERE nombre = 'BBVA Vive' AND categoria = 'tarjetas' AND tarjeta_id IS NULL;
UPDATE pagos_recurrentes SET tarjeta_id = 'c0000000-0000-0000-0000-000000000003' WHERE nombre = 'Stori' AND categoria = 'tarjetas' AND tarjeta_id IS NULL;
UPDATE pagos_recurrentes SET tarjeta_id = 'c0000000-0000-0000-0000-000000000004' WHERE nombre LIKE 'Mercado%' AND categoria = 'tarjetas' AND tarjeta_id IS NULL;

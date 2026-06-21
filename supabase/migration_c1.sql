-- ==========================================================================
-- Migration C1: Generalizar app para usuarios publicos
-- Multi-moneda, categorias dinamicas, plantillas de sobres, fix setup_usuario
-- ==========================================================================

-- 1. Nuevas columnas en cuentas
ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS moneda text NOT NULL DEFAULT 'MXN';
ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS dia_inicio_semana int NOT NULL DEFAULT 6
  CHECK (dia_inicio_semana BETWEEN 0 AND 6);

-- 2. Tabla categorias (reemplaza el ENUM categoria_t)
CREATE TABLE IF NOT EXISTS categorias (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id uuid NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  nombre    text NOT NULL,
  label     text NOT NULL,
  color     text NOT NULL DEFAULT '#666666',
  orden     int NOT NULL DEFAULT 0,
  activo    boolean NOT NULL DEFAULT true,
  creado_en timestamptz DEFAULT now(),
  UNIQUE(cuenta_id, nombre)
);

CREATE INDEX IF NOT EXISTS idx_categorias_cuenta ON categorias(cuenta_id);

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY cats_sel ON categorias FOR SELECT USING (cuenta_id = cuenta_id_del_usuario()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY cats_ins ON categorias FOR INSERT WITH CHECK (cuenta_id = cuenta_id_del_usuario()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY cats_upd ON categorias FOR UPDATE USING (cuenta_id = cuenta_id_del_usuario()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY cats_del ON categorias FOR DELETE USING (cuenta_id = cuenta_id_del_usuario()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE categorias;

-- 3. Migrar categorias de Juan a la tabla nueva
INSERT INTO categorias (cuenta_id, nombre, label, color, orden)
SELECT 'a0000000-0000-0000-0000-000000000001', nombre, label, color, orden
FROM (VALUES
  ('casa',      'Casa',      '#2563eb', 1),
  ('renta',     'Renta',     '#7c3aed', 2),
  ('diversion', 'Diversion', '#db2777', 3),
  ('salud',     'Salud',     '#059669', 4),
  ('escuela',   'Escuela',   '#d97706', 5),
  ('tarjetas',  'Tarjetas',  '#dc2626', 6)
) AS t(nombre, label, color, orden)
ON CONFLICT (cuenta_id, nombre) DO NOTHING;

-- 4. Columnas texto paralelas (dual-write: ENUM queda intacto por ahora)
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS categoria_nombre text;
ALTER TABLE sobres ADD COLUMN IF NOT EXISTS categoria_default_nombre text;
ALTER TABLE pagos_recurrentes ADD COLUMN IF NOT EXISTS categoria_nombre text;

UPDATE gastos SET categoria_nombre = categoria::text WHERE categoria_nombre IS NULL;
UPDATE sobres SET categoria_default_nombre = categoria_default::text WHERE categoria_default_nombre IS NULL;
UPDATE pagos_recurrentes SET categoria_nombre = categoria::text WHERE categoria_nombre IS NULL;

-- 5. Tabla de plantillas de sobres (datos de sistema, sin RLS)
CREATE TABLE IF NOT EXISTS plantillas_sobres (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla           text NOT NULL,
  nombre              text NOT NULL,
  emoji               text DEFAULT '',
  aportacion_semanal  numeric(10,2) NOT NULL DEFAULT 0,
  tipo_cierre         tipo_cierre_t NOT NULL DEFAULT 'ahorro',
  es_ahorro           boolean NOT NULL DEFAULT false,
  categoria_default   text NOT NULL DEFAULT 'casa',
  orden               int NOT NULL DEFAULT 0
);

DELETE FROM plantillas_sobres;
INSERT INTO plantillas_sobres (plantilla, nombre, emoji, aportacion_semanal, tipo_cierre, es_ahorro, categoria_default, orden) VALUES
  -- Hogar mexicano (11 sobres)
  ('hogar_mexicano', 'Tianguis',    '🛒', 500, 'ahorro',  false, 'casa',      1),
  ('hogar_mexicano', 'Casa',        '🏠', 200, 'ahorro',  false, 'casa',      2),
  ('hogar_mexicano', 'Tienda',      '🏪', 400, 'ahorro',  false, 'casa',      3),
  ('hogar_mexicano', 'Super',       '🛍️', 400, 'ahorro',  false, 'casa',      4),
  ('hogar_mexicano', 'Antojos',     '🍕', 300, 'ahorro',  false, 'diversion', 5),
  ('hogar_mexicano', 'Plataformas', '📱', 500, 'acumula', false, 'diversion', 6),
  ('hogar_mexicano', 'Servicios',   '📞', 200, 'acumula', false, 'casa',      7),
  ('hogar_mexicano', 'Diversion',   '🎉', 200, 'acumula', false, 'diversion', 8),
  ('hogar_mexicano', 'Escuela',     '📚', 100, 'acumula', false, 'escuela',   9),
  ('hogar_mexicano', 'Salud',       '💊', 100, 'acumula', false, 'salud',     10),
  ('hogar_mexicano', 'Ahorro',      '🐷', 100, 'acumula', true,  'casa',      11),
  -- Estudiante (6 sobres)
  ('estudiante', 'Comida',       '🍽️', 400, 'ahorro',  false, 'casa',      1),
  ('estudiante', 'Transporte',   '🚇', 200, 'ahorro',  false, 'casa',      2),
  ('estudiante', 'Escuela',      '📚', 300, 'acumula', false, 'escuela',   3),
  ('estudiante', 'Diversion',    '🎮', 200, 'ahorro',  false, 'diversion', 4),
  ('estudiante', 'Extras',       '🎁', 150, 'ahorro',  false, 'diversion', 5),
  ('estudiante', 'Ahorro',       '🐷', 100, 'acumula', true,  'casa',      6),
  -- Basico (4 sobres)
  ('basico', 'Necesidades',   '🛒', 500, 'ahorro',  false, 'casa',      1),
  ('basico', 'Gustos',        '🎉', 300, 'ahorro',  false, 'diversion', 2),
  ('basico', 'Emergencias',   '🚨', 200, 'acumula', false, 'salud',     3),
  ('basico', 'Ahorro',        '🐷', 100, 'acumula', true,  'casa',      4);

-- 6. Reescribir setup_usuario: siempre crea cuenta nueva
CREATE OR REPLACE FUNCTION setup_usuario(
  p_nombre text,
  p_moneda text DEFAULT 'MXN',
  p_plantilla text DEFAULT 'basico',
  p_dia_inicio int DEFAULT 6
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cuenta_id uuid;
  v_perfil perfiles%ROWTYPE;
BEGIN
  SELECT * INTO v_perfil FROM perfiles WHERE user_id = auth.uid();
  IF v_perfil.user_id IS NOT NULL THEN
    RETURN jsonb_build_object('cuenta_id', v_perfil.cuenta_id, 'nombre', v_perfil.nombre, 'nuevo', false);
  END IF;

  INSERT INTO cuentas (nombre, moneda, dia_inicio_semana, presupuesto_semanal, inicio_sobres)
  VALUES (p_nombre, p_moneda, p_dia_inicio, 3000, CURRENT_DATE)
  RETURNING id INTO v_cuenta_id;

  INSERT INTO perfiles (user_id, cuenta_id, nombre)
  VALUES (auth.uid(), v_cuenta_id, p_nombre);

  INSERT INTO categorias (cuenta_id, nombre, label, color, orden) VALUES
    (v_cuenta_id, 'casa',      'Casa',      '#2563eb', 1),
    (v_cuenta_id, 'renta',     'Renta',     '#7c3aed', 2),
    (v_cuenta_id, 'diversion', 'Diversion', '#db2777', 3),
    (v_cuenta_id, 'salud',     'Salud',     '#059669', 4),
    (v_cuenta_id, 'escuela',   'Escuela',   '#d97706', 5),
    (v_cuenta_id, 'tarjetas',  'Tarjetas',  '#dc2626', 6);

  INSERT INTO sobres (cuenta_id, nombre, emoji, aportacion_semanal, tipo_cierre, es_ahorro, categoria_default_nombre, orden)
  SELECT v_cuenta_id, nombre, emoji, aportacion_semanal, tipo_cierre, es_ahorro, categoria_default, orden
  FROM plantillas_sobres WHERE plantilla = p_plantilla ORDER BY orden;

  RETURN jsonb_build_object('cuenta_id', v_cuenta_id, 'nombre', p_nombre, 'nuevo', true);
END;
$$;

-- 7. Policy INSERT para cuentas (setup_usuario es SECURITY DEFINER, pero por si acaso)
DO $$ BEGIN
  CREATE POLICY ins_cuentas ON cuentas FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

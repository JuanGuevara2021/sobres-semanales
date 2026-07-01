-- Fix: setup_usuario usa columna 'categoria_default_nombre' que ya no existe
-- (fue renombrada a 'categoria_default' por migration_c1_cleanup.sql)

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

  INSERT INTO sobres (cuenta_id, nombre, emoji, aportacion_semanal, tipo_cierre, es_ahorro, categoria_default, orden)
  SELECT v_cuenta_id, nombre, emoji, aportacion_semanal, tipo_cierre, es_ahorro, categoria_default, orden
  FROM plantillas_sobres WHERE plantilla = p_plantilla ORDER BY orden;

  RETURN jsonb_build_object('cuenta_id', v_cuenta_id, 'nombre', p_nombre, 'nuevo', true);
END;
$$;

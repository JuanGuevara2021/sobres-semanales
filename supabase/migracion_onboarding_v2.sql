-- Migracion: onboarding v2 (2026-07-03)
-- 1. Renombrar sobres de plantillas con terminos neutros para LATAM
--    (caso Franco: "Tianguis" no significa nada fuera de Mexico)
-- 2. setup_usuario acepta p_sobres jsonb (lista editada en el onboarding) y
--    p_presupuesto (gasto semanal declarado). Si p_sobres es NULL, copia la
--    plantilla como antes (compatibilidad con versiones viejas de la app).

-- 1. Terminos neutros
UPDATE plantillas_sobres SET nombre = 'Mercado' WHERE plantilla = 'hogar_mexicano' AND nombre = 'Tianguis';

-- 2. setup_usuario v2
-- Se eliminan las firmas viejas: agregar parametros con CREATE OR REPLACE crea una
-- sobrecarga y las llamadas con 4 args quedarian ambiguas. La firma nueva tiene
-- defaults, asi que la app desplegada (que llama con 4 args nombrados) sigue funcionando.
DROP FUNCTION IF EXISTS setup_usuario(text);
DROP FUNCTION IF EXISTS setup_usuario(text, text, text, integer);

CREATE OR REPLACE FUNCTION setup_usuario(
  p_nombre text,
  p_moneda text DEFAULT 'MXN',
  p_plantilla text DEFAULT 'basico',
  p_dia_inicio int DEFAULT 6,
  p_sobres jsonb DEFAULT NULL,
  p_presupuesto numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cuenta_id uuid;
  v_perfil perfiles%ROWTYPE;
  v_presupuesto numeric;
BEGIN
  SELECT * INTO v_perfil FROM perfiles WHERE user_id = auth.uid();
  IF v_perfil.user_id IS NOT NULL THEN
    RETURN jsonb_build_object('cuenta_id', v_perfil.cuenta_id, 'nombre', v_perfil.nombre, 'nuevo', false);
  END IF;

  -- presupuesto: el declarado, o la suma de los sobres elegidos, o el default historico
  IF p_presupuesto IS NOT NULL AND p_presupuesto > 0 THEN
    v_presupuesto := p_presupuesto;
  ELSIF p_sobres IS NOT NULL THEN
    SELECT COALESCE(SUM((s->>'aportacion_semanal')::numeric), 3000)
    INTO v_presupuesto FROM jsonb_array_elements(p_sobres) s;
  ELSE
    v_presupuesto := 3000;
  END IF;

  INSERT INTO cuentas (nombre, moneda, dia_inicio_semana, presupuesto_semanal, inicio_sobres)
  VALUES (p_nombre, p_moneda, p_dia_inicio, v_presupuesto, CURRENT_DATE)
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

  IF p_sobres IS NOT NULL THEN
    -- sobres editados en el onboarding; categoria_default se valida contra las
    -- categorias recien creadas para no dejar referencias rotas
    INSERT INTO sobres (cuenta_id, nombre, emoji, aportacion_semanal, tipo_cierre, es_ahorro, categoria_default, orden)
    SELECT
      v_cuenta_id,
      LEFT(TRIM(s->>'nombre'), 40),
      COALESCE(NULLIF(s->>'emoji', ''), '📦'),
      GREATEST(COALESCE((s->>'aportacion_semanal')::numeric, 0), 0),
      (CASE WHEN s->>'tipo_cierre' = 'acumula' THEN 'acumula' ELSE 'ahorro' END)::tipo_cierre_t,
      COALESCE((s->>'es_ahorro')::boolean, false),
      CASE WHEN s->>'categoria_default' IN ('casa','renta','diversion','salud','escuela','tarjetas')
           THEN s->>'categoria_default' ELSE 'casa' END,
      ROW_NUMBER() OVER ()
    FROM jsonb_array_elements(p_sobres) s
    WHERE TRIM(COALESCE(s->>'nombre', '')) <> '';
  ELSE
    INSERT INTO sobres (cuenta_id, nombre, emoji, aportacion_semanal, tipo_cierre, es_ahorro, categoria_default, orden)
    SELECT v_cuenta_id, nombre, emoji, aportacion_semanal, tipo_cierre, es_ahorro, categoria_default, orden
    FROM plantillas_sobres WHERE plantilla = p_plantilla ORDER BY orden;
  END IF;

  RETURN jsonb_build_object('cuenta_id', v_cuenta_id, 'nombre', p_nombre, 'nuevo', true);
END;
$$;

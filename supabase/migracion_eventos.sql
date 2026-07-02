-- Migracion: tabla de eventos para embudo de activacion (2026-07-02)
-- Registra pasos clave del usuario: onboarding, abrir formulario, guardar gasto.
-- Sin datos sensibles (no montos, no notas). Aplicada directo a la base el 2026-07-02.

CREATE TABLE IF NOT EXISTS eventos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id uuid NOT NULL DEFAULT auth.uid(),
  evento text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  plataforma text,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_usuario ON eventos (usuario_id, creado_en);
CREATE INDEX IF NOT EXISTS idx_eventos_evento ON eventos (evento, creado_en);

ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden INSERTAR sus propios eventos; nadie los lee desde el cliente
-- (la lectura es solo para analytics via conexion directa)
DROP POLICY IF EXISTS "eventos insert propio" ON eventos;
CREATE POLICY "eventos insert propio" ON eventos
  FOR INSERT WITH CHECK (usuario_id = auth.uid());

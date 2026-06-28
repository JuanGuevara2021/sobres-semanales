-- Migracion: sistema de pilares para onboarding progresivo
-- Fecha: 2026-06-28
-- Ejecutar en Supabase SQL Editor

ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS pilar_actual integer DEFAULT 1;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS pilar_avanzado_manual boolean DEFAULT false;

-- Usuarios existentes van directo al pilar 4 (ya conocen la app)
UPDATE perfiles SET pilar_actual = 4 WHERE pilar_actual = 1;

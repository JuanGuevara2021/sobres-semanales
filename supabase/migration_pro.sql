-- Agregar campo Pro a perfiles
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS es_pro boolean DEFAULT false;

-- Usuarios existentes no son Pro
UPDATE perfiles SET es_pro = false WHERE es_pro IS NULL;

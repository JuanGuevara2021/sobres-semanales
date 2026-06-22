-- ==========================================================================
-- Migration C1 Cleanup: eliminar columnas ENUM, renombrar columnas texto
-- EJECUTAR SOLO despues de verificar que la app funciona con columnas texto
-- ==========================================================================

-- 0. Sincronizar: copiar ENUM → texto para registros creados post-migracion
UPDATE gastos SET categoria_nombre = categoria::text WHERE categoria_nombre IS NULL;
UPDATE sobres SET categoria_default_nombre = categoria_default::text WHERE categoria_default_nombre IS NULL;
UPDATE pagos_recurrentes SET categoria_nombre = categoria::text WHERE categoria_nombre IS NULL;

-- 1. Eliminar columnas ENUM viejas
ALTER TABLE gastos DROP COLUMN IF EXISTS categoria;
ALTER TABLE sobres DROP COLUMN IF EXISTS categoria_default;
ALTER TABLE pagos_recurrentes DROP COLUMN IF EXISTS categoria;

-- 2. Renombrar columnas texto a nombres limpios
ALTER TABLE gastos RENAME COLUMN categoria_nombre TO categoria;
ALTER TABLE sobres RENAME COLUMN categoria_default_nombre TO categoria_default;
ALTER TABLE pagos_recurrentes RENAME COLUMN categoria_nombre TO categoria;

-- 3. Agregar NOT NULL constraints donde aplica
ALTER TABLE gastos ALTER COLUMN categoria SET NOT NULL;
ALTER TABLE gastos ALTER COLUMN categoria SET DEFAULT 'casa';
ALTER TABLE sobres ALTER COLUMN categoria_default SET DEFAULT 'casa';
ALTER TABLE pagos_recurrentes ALTER COLUMN categoria SET DEFAULT 'casa';

-- 4. Eliminar el ENUM type (ya no se usa en ninguna tabla)
DROP TYPE IF EXISTS categoria_t;

-- 5. Verificacion
DO $$
BEGIN
  RAISE NOTICE 'Cleanup completado. Columnas ENUM eliminadas, texto renombrado.';
  RAISE NOTICE 'Tipos restantes:';
  PERFORM typname FROM pg_type WHERE typname = 'categoria_t';
  IF NOT FOUND THEN
    RAISE NOTICE '  categoria_t: ELIMINADO OK';
  ELSE
    RAISE NOTICE '  categoria_t: AUN EXISTE — revisar';
  END IF;
END $$;

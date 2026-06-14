-- Migration v2.1d: Reset ahorro, inicio_sobres, permitir gastos desde ahorro

-- 1. Campo para saber cuando empezo a usar sobres (para graficas de tendencia)
ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS inicio_sobres date DEFAULT CURRENT_DATE;
UPDATE cuentas SET inicio_sobres = CURRENT_DATE WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- 2. Reset: borrar cierres historicos y saldos (el usuario empieza de cero con sobres)
DELETE FROM cierres WHERE cuenta_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE sobres SET saldo_acumulado = 0 WHERE cuenta_id = 'a0000000-0000-0000-0000-000000000001';

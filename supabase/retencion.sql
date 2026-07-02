-- Retencion — Sobres Semanales
-- Para pegar en Supabase → SQL Editor (una consulta a la vez).
-- Version terminal: npm run retencion
-- "Activo" = creo un gasto ese dia (gastos.creado_en, no la fecha del gasto).
-- Excluye cuentas internas: e2e y revisor de Google.

-- 1) TABLERO POR USUARIO — a quien perseguir durante los 14 dias de prueba
SELECT u.email,
       u.created_at::date AS registro,
       COUNT(g.id) AS gastos,
       COUNT(DISTINCT g.creado_en::date) AS dias_activos,
       MAX(g.creado_en)::date AS ultima_actividad,
       CASE WHEN COUNT(g.id) = 0 THEN 'nunca registro'
            WHEN CURRENT_DATE - MAX(g.creado_en)::date <= 3 THEN 'activo'
            WHEN CURRENT_DATE - MAX(g.creado_en)::date <= 7 THEN 'enfriandose'
            ELSE 'inactivo' END AS estado
FROM auth.users u
LEFT JOIN gastos g ON g.usuario_id = u.id
WHERE u.email NOT IN ('e2e-test-sobres@mailinator.com', 'sobressemanalesapp+revisor@gmail.com', 'alie.suarez1301@gmail.com', 'franco.iglesiias2@gmail.com')
GROUP BY u.email, u.created_at
ORDER BY u.created_at;

-- 2) ACTIVACION — % con primer gasto dentro de las 24h del registro (meta >60%)
WITH primer AS (
  SELECT u.id, u.created_at, MIN(g.creado_en) AS primer_gasto
  FROM auth.users u LEFT JOIN gastos g ON g.usuario_id = u.id
  WHERE u.email NOT IN ('e2e-test-sobres@mailinator.com', 'sobressemanalesapp+revisor@gmail.com', 'alie.suarez1301@gmail.com', 'franco.iglesiias2@gmail.com')
  GROUP BY u.id, u.created_at)
SELECT COUNT(*) AS usuarios,
       COUNT(primer_gasto) AS con_gasto,
       ROUND(100.0 * COUNT(*) FILTER (WHERE primer_gasto <= created_at + interval '1 day') / COUNT(*), 0) AS pct_activados_24h
FROM primer;

-- 3) RETENCION POR VENTANAS — S1 dias 1-7 (meta >40%), M1 dias 15-30 (meta >20%)
WITH base AS (
  SELECT u.id, u.created_at::date AS reg
  FROM auth.users u
  WHERE u.email NOT IN ('e2e-test-sobres@mailinator.com', 'sobressemanalesapp+revisor@gmail.com', 'alie.suarez1301@gmail.com', 'franco.iglesiias2@gmail.com')),
act AS (SELECT usuario_id, creado_en::date AS dia FROM gastos GROUP BY 1, 2)
SELECT
  COUNT(*) FILTER (WHERE CURRENT_DATE >= reg + 7) AS elegibles_s1,
  COUNT(*) FILTER (WHERE CURRENT_DATE >= reg + 7
    AND EXISTS (SELECT 1 FROM act WHERE act.usuario_id = base.id AND dia BETWEEN reg + 1 AND reg + 7)) AS retenidos_s1,
  COUNT(*) FILTER (WHERE CURRENT_DATE >= reg + 30) AS elegibles_m1,
  COUNT(*) FILTER (WHERE CURRENT_DATE >= reg + 30
    AND EXISTS (SELECT 1 FROM act WHERE act.usuario_id = base.id AND dia BETWEEN reg + 15 AND reg + 30)) AS retenidos_m1
FROM base;

-- 4) ACTIVOS POR SEMANA — tendencia
SELECT date_trunc('week', g.creado_en)::date AS semana,
       COUNT(DISTINCT g.usuario_id) AS usuarios_activos,
       COUNT(*) AS gastos
FROM gastos g JOIN auth.users u ON u.id = g.usuario_id
WHERE u.email NOT IN ('e2e-test-sobres@mailinator.com', 'sobressemanalesapp+revisor@gmail.com', 'alie.suarez1301@gmail.com', 'franco.iglesiias2@gmail.com')
GROUP BY 1 ORDER BY 1 DESC;

-- 5) CIERRES POR CUENTA — quien completa el ciclo del habito
SELECT c.nombre AS cuenta, COUNT(ci.id) AS cierres, MAX(ci.semana) AS ultima_semana
FROM cuentas c LEFT JOIN cierres ci ON ci.cuenta_id = c.id
GROUP BY c.nombre ORDER BY cierres DESC;

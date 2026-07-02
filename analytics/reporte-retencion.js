/* Reporte de retencion — Sobres Semanales
   Uso: npm run retencion
   Lee SUPABASE_DB_URL del .env (conexion directa a Postgres, fuera del repo).
   "Activo" = creo al menos un gasto ese dia (gastos.creado_en, no la fecha del gasto). */
import pg from "pg";

// cuentas internas que no cuentan como usuarios reales:
// e2e = tests automatizados; revisor = cuenta para Google Play;
// alie = novia de Juan, su uso real es en la cuenta compartida original;
// franco = cuenta de prueba manual
const EXCLUIR = [
  "e2e-test-sobres@mailinator.com",
  "sobressemanalesapp+revisor@gmail.com",
  "alie.suarez1301@gmail.com",
  "franco.iglesiias2@gmail.com",
];

const db = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await db.connect();

const excluirSql = EXCLUIR.map((e) => `'${e}'`).join(",");

/* ---------- 1. Tablero por usuario (para perseguir testers) ---------- */
const tablero = await db.query(`
  SELECT u.email,
         u.created_at::date AS registro,
         COUNT(g.id)::int AS gastos,
         COUNT(DISTINCT g.creado_en::date)::int AS dias_activos,
         MAX(g.creado_en)::date AS ultima_actividad,
         (CURRENT_DATE - MAX(g.creado_en)::date)::int AS dias_sin_actividad
  FROM auth.users u
  LEFT JOIN gastos g ON g.usuario_id = u.id
  WHERE u.email NOT IN (${excluirSql})
  GROUP BY u.email, u.created_at
  ORDER BY u.created_at`);

/* ---------- 2. Activacion: primer gasto dentro de las 24h del registro ---------- */
const activacion = await db.query(`
  WITH primer AS (
    SELECT u.id, u.created_at, MIN(g.creado_en) AS primer_gasto
    FROM auth.users u LEFT JOIN gastos g ON g.usuario_id = u.id
    WHERE u.email NOT IN (${excluirSql})
    GROUP BY u.id, u.created_at)
  SELECT COUNT(*)::int AS usuarios,
         COUNT(primer_gasto)::int AS con_gasto,
         COUNT(*) FILTER (WHERE primer_gasto <= created_at + interval '1 day')::int AS activados_24h
  FROM primer`);

/* ---------- 3. Retencion por ventanas desde el registro ---------- */
const retencion = await db.query(`
  WITH base AS (
    SELECT u.id, u.created_at::date AS reg
    FROM auth.users u WHERE u.email NOT IN (${excluirSql})),
  act AS (SELECT usuario_id, creado_en::date AS dia FROM gastos GROUP BY 1, 2)
  SELECT
    COUNT(*)::int AS usuarios,
    COUNT(*) FILTER (WHERE CURRENT_DATE >= reg + 1)::int  AS eleg_d1,
    COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM act WHERE act.usuario_id = base.id AND dia = reg + 1))::int AS d1,
    COUNT(*) FILTER (WHERE CURRENT_DATE >= reg + 7)::int  AS eleg_s1,
    COUNT(*) FILTER (WHERE CURRENT_DATE >= reg + 7 AND EXISTS (SELECT 1 FROM act WHERE act.usuario_id = base.id AND dia BETWEEN reg + 1 AND reg + 7))::int AS s1,
    COUNT(*) FILTER (WHERE CURRENT_DATE >= reg + 14)::int AS eleg_s2,
    COUNT(*) FILTER (WHERE CURRENT_DATE >= reg + 14 AND EXISTS (SELECT 1 FROM act WHERE act.usuario_id = base.id AND dia BETWEEN reg + 8 AND reg + 14))::int AS s2,
    COUNT(*) FILTER (WHERE CURRENT_DATE >= reg + 30)::int AS eleg_m1,
    COUNT(*) FILTER (WHERE CURRENT_DATE >= reg + 30 AND EXISTS (SELECT 1 FROM act WHERE act.usuario_id = base.id AND dia BETWEEN reg + 15 AND reg + 30))::int AS m1
  FROM base`);

/* ---------- 4. Usuarios activos por semana (tendencia) ---------- */
const wau = await db.query(`
  SELECT date_trunc('week', g.creado_en)::date AS semana,
         COUNT(DISTINCT g.usuario_id)::int AS usuarios_activos,
         COUNT(*)::int AS gastos
  FROM gastos g JOIN auth.users u ON u.id = g.usuario_id
  WHERE u.email NOT IN (${excluirSql})
  GROUP BY 1 ORDER BY 1 DESC LIMIT 8`);

/* ---------- 5. Habito profundo: cierres de semana por cuenta ---------- */
const cierres = await db.query(`
  SELECT c.nombre AS cuenta, COUNT(ci.id)::int AS cierres, MAX(ci.semana) AS ultima_semana
  FROM cuentas c LEFT JOIN cierres ci ON ci.cuenta_id = c.id
  GROUP BY c.nombre ORDER BY cierres DESC`);

await db.end();

/* ---------- Render ---------- */
const pct = (n, d) => (d ? `${Math.round((100 * n) / d)}% (${n}/${d})` : "—");
const semaforo = (r) => (r.gastos === 0 ? "🔴 nunca registro" : r.dias_sin_actividad <= 3 ? "🟢 activo" : r.dias_sin_actividad <= 7 ? "🟡 enfriandose" : "🔴 inactivo");

console.log(`\n📊 RETENCION — SOBRES SEMANALES · ${new Date().toISOString().slice(0, 10)}`);
console.log("═".repeat(64));

console.log("\n👥 TABLERO POR USUARIO (persigue a los 🔴 durante los 14 dias)\n");
console.table(tablero.rows.map((r) => ({
  email: r.email, registro: r.registro.toISOString().slice(0, 10), gastos: r.gastos,
  "dias activos": r.dias_activos,
  "ultima act.": r.ultima_actividad ? r.ultima_actividad.toISOString().slice(0, 10) : "—",
  estado: semaforo(r),
})));

const a = activacion.rows[0];
console.log(`⚡ ACTIVACION\n   Con al menos 1 gasto:        ${pct(a.con_gasto, a.usuarios)}\n   Primer gasto en <24h:        ${pct(a.activados_24h, a.usuarios)}   ← meta: >60%`);

const r = retencion.rows[0];
console.log(`\n🔁 RETENCION (ventanas desde el registro; solo usuarios elegibles)\n   D1  (dia siguiente):         ${pct(r.d1, r.eleg_d1)}\n   S1  (dias 1-7):              ${pct(r.s1, r.eleg_s1)}   ← meta: >40%\n   S2  (dias 8-14):             ${pct(r.s2, r.eleg_s2)}\n   M1  (dias 15-30):            ${pct(r.m1, r.eleg_m1)}   ← meta: >20%; si <10%, arreglar producto antes de promover`);

console.log("\n📈 ACTIVOS POR SEMANA\n");
console.table(wau.rows.map((w) => ({ semana: w.semana.toISOString().slice(0, 10), "usuarios activos": w.usuarios_activos, gastos: w.gastos })));

console.log("✉️  CIERRES DE SEMANA POR CUENTA (habito completo)\n");
console.table(cierres.rows.map((c) => ({ cuenta: c.cuenta, cierres: c.cierres, "ultima semana": c.ultima_semana ? new Date(c.ultima_semana).toISOString().slice(0, 10) : "—" })));

console.log("Nota: excluidas cuentas internas:", EXCLUIR.join(", "), "\n");

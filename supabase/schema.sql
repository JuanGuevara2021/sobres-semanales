-- ==========================================================================
-- Sobres Semanales — Esquema v2.1
-- Ejecutar en Supabase → SQL Editor (todo de una vez)
-- ==========================================================================

-- 1. Tipo enum para categorias
CREATE TYPE categoria_t AS ENUM (
  'casa', 'renta', 'diversion', 'salud', 'escuela', 'tarjetas'
);

-- 2. Tipo enum para medio de pago
CREATE TYPE medio_pago_t AS ENUM (
  'efectivo', 'debito', 'credito', 'transferencia'
);

-- 3. Tipo enum para cierre de sobre
CREATE TYPE tipo_cierre_t AS ENUM ('ahorro', 'acumula');

-- ==========================================================================
-- TABLAS
-- ==========================================================================

-- Cuenta = hogar compartido
CREATE TABLE cuentas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text NOT NULL,
  creado_en  timestamptz DEFAULT now()
);

-- Perfil de usuario (liga auth.users con la cuenta)
CREATE TABLE perfiles (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cuenta_id  uuid NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  nombre     text NOT NULL,
  tema       text DEFAULT 'claro',
  creado_en  timestamptz DEFAULT now()
);

-- Sobres de presupuesto semanal
CREATE TABLE sobres (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id           uuid NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  nombre              text NOT NULL,
  emoji               text DEFAULT '',
  aportacion_semanal  numeric(10,2) NOT NULL DEFAULT 0,
  tipo_cierre         tipo_cierre_t NOT NULL DEFAULT 'ahorro',
  es_ahorro           boolean NOT NULL DEFAULT false,
  categoria_default   categoria_t NOT NULL DEFAULT 'casa',
  saldo_acumulado     numeric(10,2) NOT NULL DEFAULT 0,
  activo              boolean NOT NULL DEFAULT true,
  orden               int NOT NULL DEFAULT 0,
  creado_en           timestamptz DEFAULT now()
);

-- Gastos (el corazon de la app)
CREATE TABLE gastos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id   uuid NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  sobre_id    uuid REFERENCES sobres(id) ON DELETE SET NULL,
  usuario_id  uuid NOT NULL REFERENCES auth.users(id),
  fecha       date NOT NULL,
  monto       numeric(10,2) NOT NULL CHECK (monto > 0),
  medio_pago  medio_pago_t NOT NULL DEFAULT 'efectivo',
  categoria   categoria_t NOT NULL,
  nota        text DEFAULT '',
  creado_en   timestamptz DEFAULT now()
);

-- Cierres semanales (snapshots)
CREATE TABLE cierres (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id       uuid NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  semana          date NOT NULL,
  detalle         jsonb NOT NULL DEFAULT '[]',
  total_a_ahorro  numeric(10,2) NOT NULL DEFAULT 0,
  cerrado_en      timestamptz DEFAULT now(),
  UNIQUE(cuenta_id, semana)
);

-- Pagos recurrentes (para feature F3, tabla lista desde ahora)
CREATE TABLE pagos_recurrentes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id         uuid NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  nombre            text NOT NULL,
  monto_estimado    numeric(10,2),
  dia_pago          int CHECK (dia_pago BETWEEN 1 AND 31),
  destino_sobre_id  uuid REFERENCES sobres(id) ON DELETE SET NULL,
  categoria         categoria_t NOT NULL,
  activo            boolean NOT NULL DEFAULT true,
  pospuesto_hasta   date,
  ultimo_pago       date,
  creado_en         timestamptz DEFAULT now()
);

-- Compras a meses sin intereses (para feature F4, tabla lista desde ahora)
CREATE TABLE compras_msi (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id       uuid NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  concepto        text NOT NULL,
  monto_total     numeric(10,2) NOT NULL,
  tarjeta         text NOT NULL,
  num_meses       int NOT NULL,
  fecha_compra    date NOT NULL,
  mes_primer_pago date NOT NULL,
  dia_corte       int CHECK (dia_corte BETWEEN 1 AND 31),
  activo          boolean NOT NULL DEFAULT true,
  creado_en       timestamptz DEFAULT now()
);

-- ==========================================================================
-- INDICES
-- ==========================================================================

CREATE INDEX idx_gastos_cuenta_fecha ON gastos(cuenta_id, fecha DESC);
CREATE INDEX idx_gastos_sobre ON gastos(sobre_id) WHERE sobre_id IS NOT NULL;
CREATE INDEX idx_gastos_categoria ON gastos(cuenta_id, categoria);
CREATE INDEX idx_sobres_cuenta ON sobres(cuenta_id);
CREATE INDEX idx_cierres_cuenta_semana ON cierres(cuenta_id, semana);

-- ==========================================================================
-- ROW LEVEL SECURITY
-- ==========================================================================

ALTER TABLE cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sobres ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cierres ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_recurrentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras_msi ENABLE ROW LEVEL SECURITY;

-- Funcion auxiliar: obtener cuenta_id del usuario actual
CREATE OR REPLACE FUNCTION cuenta_id_del_usuario()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT cuenta_id FROM perfiles WHERE user_id = auth.uid()
$$;

-- Perfiles: el usuario ve y edita solo su propio perfil
CREATE POLICY "perfil propio select" ON perfiles
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "perfil propio update" ON perfiles
  FOR UPDATE USING (user_id = auth.uid());

-- Cuentas: el usuario ve solo su cuenta
CREATE POLICY "cuenta propia" ON cuentas
  FOR SELECT USING (id = cuenta_id_del_usuario());

-- Sobres: CRUD solo para la cuenta del usuario
CREATE POLICY "sobres de mi cuenta select" ON sobres
  FOR SELECT USING (cuenta_id = cuenta_id_del_usuario());
CREATE POLICY "sobres de mi cuenta insert" ON sobres
  FOR INSERT WITH CHECK (cuenta_id = cuenta_id_del_usuario());
CREATE POLICY "sobres de mi cuenta update" ON sobres
  FOR UPDATE USING (cuenta_id = cuenta_id_del_usuario());
CREATE POLICY "sobres de mi cuenta delete" ON sobres
  FOR DELETE USING (cuenta_id = cuenta_id_del_usuario());

-- Gastos: CRUD solo para la cuenta del usuario
CREATE POLICY "gastos de mi cuenta select" ON gastos
  FOR SELECT USING (cuenta_id = cuenta_id_del_usuario());
CREATE POLICY "gastos de mi cuenta insert" ON gastos
  FOR INSERT WITH CHECK (cuenta_id = cuenta_id_del_usuario());
CREATE POLICY "gastos de mi cuenta update" ON gastos
  FOR UPDATE USING (cuenta_id = cuenta_id_del_usuario());
CREATE POLICY "gastos de mi cuenta delete" ON gastos
  FOR DELETE USING (cuenta_id = cuenta_id_del_usuario());

-- Cierres: CRUD solo para la cuenta del usuario
CREATE POLICY "cierres de mi cuenta select" ON cierres
  FOR SELECT USING (cuenta_id = cuenta_id_del_usuario());
CREATE POLICY "cierres de mi cuenta insert" ON cierres
  FOR INSERT WITH CHECK (cuenta_id = cuenta_id_del_usuario());
CREATE POLICY "cierres de mi cuenta update" ON cierres
  FOR UPDATE USING (cuenta_id = cuenta_id_del_usuario());

-- Pagos recurrentes: CRUD solo para la cuenta del usuario
CREATE POLICY "pagos_rec de mi cuenta select" ON pagos_recurrentes
  FOR SELECT USING (cuenta_id = cuenta_id_del_usuario());
CREATE POLICY "pagos_rec de mi cuenta insert" ON pagos_recurrentes
  FOR INSERT WITH CHECK (cuenta_id = cuenta_id_del_usuario());
CREATE POLICY "pagos_rec de mi cuenta update" ON pagos_recurrentes
  FOR UPDATE USING (cuenta_id = cuenta_id_del_usuario());
CREATE POLICY "pagos_rec de mi cuenta delete" ON pagos_recurrentes
  FOR DELETE USING (cuenta_id = cuenta_id_del_usuario());

-- Compras MSI: CRUD solo para la cuenta del usuario
CREATE POLICY "msi de mi cuenta select" ON compras_msi
  FOR SELECT USING (cuenta_id = cuenta_id_del_usuario());
CREATE POLICY "msi de mi cuenta insert" ON compras_msi
  FOR INSERT WITH CHECK (cuenta_id = cuenta_id_del_usuario());
CREATE POLICY "msi de mi cuenta update" ON compras_msi
  FOR UPDATE USING (cuenta_id = cuenta_id_del_usuario());
CREATE POLICY "msi de mi cuenta delete" ON compras_msi
  FOR DELETE USING (cuenta_id = cuenta_id_del_usuario());

-- ==========================================================================
-- FUNCION: setup de usuario (primera vez que inicia sesion)
-- Busca si ya tiene perfil; si no, lo crea y lo liga a la cuenta existente
-- (o crea una cuenta nueva si no hay ninguna).
-- SECURITY DEFINER para poder insertar sin que RLS lo bloquee.
-- ==========================================================================

CREATE OR REPLACE FUNCTION setup_usuario(p_nombre text)
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

  SELECT id INTO v_cuenta_id FROM cuentas LIMIT 1;
  IF v_cuenta_id IS NULL THEN
    INSERT INTO cuentas (nombre) VALUES ('Mi hogar') RETURNING id INTO v_cuenta_id;
  END IF;

  INSERT INTO perfiles (user_id, cuenta_id, nombre)
  VALUES (auth.uid(), v_cuenta_id, p_nombre);

  RETURN jsonb_build_object('cuenta_id', v_cuenta_id, 'nombre', p_nombre, 'nuevo', true);
END;
$$;

-- ==========================================================================
-- REALTIME: habilitar publicacion para las tablas principales
-- ==========================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE sobres;
ALTER PUBLICATION supabase_realtime ADD TABLE gastos;
ALTER PUBLICATION supabase_realtime ADD TABLE cierres;

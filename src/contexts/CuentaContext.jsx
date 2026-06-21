import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { createMoneyFormatter, createWeekHelpers, CATEGORIAS_DEFAULT } from "../lib/config";

const CuentaContext = createContext(null);

export function CuentaProvider({ cuentaId, children }) {
  const [moneda, setMoneda] = useState("MXN");
  const [diaInicio, setDiaInicio] = useState(6);
  const [categorias, setCategorias] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const cargarConfig = useCallback(async () => {
    if (!cuentaId) return;
    const [cuentaRes, catsRes] = await Promise.all([
      supabase.from("cuentas").select("moneda, dia_inicio_semana").eq("id", cuentaId).single(),
      supabase.from("categorias").select("*").eq("cuenta_id", cuentaId).eq("activo", true).order("orden"),
    ]);
    if (cuentaRes.data) {
      setMoneda(cuentaRes.data.moneda || "MXN");
      setDiaInicio(cuentaRes.data.dia_inicio_semana ?? 6);
    }
    if (catsRes.data && catsRes.data.length > 0) {
      setCategorias(catsRes.data);
    } else {
      setCategorias(CATEGORIAS_DEFAULT.map((c, i) => ({ ...c, orden: i + 1 })));
    }
    setLoaded(true);
  }, [cuentaId]);

  useEffect(() => { cargarConfig(); }, [cargarConfig]);

  const money = useMemo(() => createMoneyFormatter(moneda), [moneda]);
  const week = useMemo(() => createWeekHelpers(diaInicio), [diaInicio]);

  const catLabel = useMemo(() => {
    const m = {};
    categorias.forEach((c) => { m[c.nombre] = c.label; });
    return m;
  }, [categorias]);

  const catColor = useMemo(() => {
    const m = {};
    categorias.forEach((c) => { m[c.nombre] = c.color; });
    return m;
  }, [categorias]);

  const updateMoneda = useCallback(async (val) => {
    setMoneda(val);
    await supabase.from("cuentas").update({ moneda: val }).eq("id", cuentaId);
  }, [cuentaId]);

  const updateDiaInicio = useCallback(async (val) => {
    setDiaInicio(val);
    await supabase.from("cuentas").update({ dia_inicio_semana: val }).eq("id", cuentaId);
  }, [cuentaId]);

  const addCategoria = useCallback(async (cat) => {
    const { data, error } = await supabase
      .from("categorias")
      .insert({ cuenta_id: cuentaId, ...cat })
      .select()
      .single();
    if (!error && data) setCategorias((prev) => [...prev, data]);
    return { data, error };
  }, [cuentaId]);

  const removeCategoria = useCallback(async (nombre) => {
    await supabase
      .from("categorias")
      .update({ activo: false })
      .eq("cuenta_id", cuentaId)
      .eq("nombre", nombre);
    setCategorias((prev) => prev.filter((c) => c.nombre !== nombre));
  }, [cuentaId]);

  const reloadCategorias = useCallback(async () => {
    const { data } = await supabase.from("categorias").select("*").eq("cuenta_id", cuentaId).eq("activo", true).order("orden");
    if (data) setCategorias(data);
  }, [cuentaId]);

  const value = useMemo(() => ({
    moneda, diaInicio, categorias, catLabel, catColor, loaded,
    money, ...week,
    updateMoneda, updateDiaInicio,
    addCategoria, removeCategoria, reloadCategorias,
  }), [moneda, diaInicio, categorias, catLabel, catColor, loaded, money, week, updateMoneda, updateDiaInicio, addCategoria, removeCategoria, reloadCategorias]);

  return <CuentaContext.Provider value={value}>{children}</CuentaContext.Provider>;
}

export function useCuenta() {
  const ctx = useContext(CuentaContext);
  if (!ctx) throw new Error("useCuenta debe usarse dentro de CuentaProvider");
  return ctx;
}

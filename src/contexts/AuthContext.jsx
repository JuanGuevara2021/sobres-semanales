import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [perfil, setPerfilState] = useState(null)
  const [cargando, setCargando] = useState(true)
  // ref espejo de perfil: permite saber dentro del callback de auth
  // si el perfil aun no se resuelve, sin problemas de closure
  const perfilRef = useRef(null)
  const setPerfil = (p) => { perfilRef.current = p; setPerfilState(p) }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) cargarPerfil(session.user)
      else setCargando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        // mientras el perfil no se resuelva, mostrar "Cargando..." en vez
        // de dejar que aparezca el onboarding por un instante tras el login
        if (!perfilRef.current) setCargando(true)
        cargarPerfil(session.user)
      } else {
        setPerfil(null)
        setCargando(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function cargarPerfil(user) {
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    setPerfil(data)
    setCargando(false)
  }

  async function setupPerfil(nombre, moneda = 'MXN', plantilla = 'basico', diaInicio = 6) {
    const { data, error } = await supabase.rpc('setup_usuario', {
      p_nombre: nombre, p_moneda: moneda, p_plantilla: plantilla, p_dia_inicio: diaInicio,
    })
    if (error) throw error
    setPerfil({ user_id: session.user.id, cuenta_id: data.cuenta_id, nombre: data.nombre })
    return data
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function registro(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  async function logout() {
    await supabase.auth.signOut()
    setPerfil(null)
  }

  return (
    <AuthContext.Provider value={{
      session, perfil, cargando,
      login, registro, logout, setupPerfil
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

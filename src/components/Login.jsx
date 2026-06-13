import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login, registro } = useAuth()
  const [modo, setModo] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [msgRegistro, setMsgRegistro] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMsgRegistro('')
    setCargando(true)
    try {
      if (modo === 'login') {
        await login(email, password)
      } else {
        await registro(email, password)
        setMsgRegistro('Revisa tu correo para confirmar la cuenta.')
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--paper)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✉️</div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>
            Sobres Semanales
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--ink-soft)' }}>
            Tu libreta + tu cartera de sobres
          </p>
        </div>

        <form onSubmit={submit} className="rounded-2xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>

          <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--ink)' }}>
            {modo === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
          </h2>

          <label className="block text-xs font-semibold mb-1"
            style={{ color: 'var(--ink-soft)' }}>Correo</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
            className="w-full rounded-xl px-3 py-2 text-sm mb-3 outline-none"
            style={{ border: '1px solid var(--line)', color: 'var(--ink)', background: 'var(--paper)' }}
          />

          <label className="block text-xs font-semibold mb-1"
            style={{ color: 'var(--ink-soft)' }}>Contrasena</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            required
            minLength={6}
            className="w-full rounded-xl px-3 py-2 text-sm mb-4 outline-none"
            style={{ border: '1px solid var(--line)', color: 'var(--ink)', background: 'var(--paper)' }}
          />

          {error && (
            <div className="text-xs mb-3 rounded-xl px-3 py-2"
              style={{ background: '#FBEAE5', color: 'var(--red)' }}>{error}</div>
          )}
          {msgRegistro && (
            <div className="text-xs mb-3 rounded-xl px-3 py-2"
              style={{ background: '#E7F3EC', color: 'var(--green)' }}>{msgRegistro}</div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl py-3 font-bold text-sm"
            style={{ background: 'var(--green)', color: '#fff', opacity: cargando ? 0.6 : 1 }}
          >
            {cargando ? 'Cargando...' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>

          <button
            type="button"
            onClick={() => { setModo(modo === 'login' ? 'registro' : 'login'); setError(''); setMsgRegistro('') }}
            className="w-full text-xs font-semibold mt-3 py-1"
            style={{ color: 'var(--ink-soft)' }}
          >
            {modo === 'login' ? 'No tengo cuenta — registrarme' : 'Ya tengo cuenta — entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

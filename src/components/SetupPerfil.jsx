import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function SetupPerfil() {
  const { setupPerfil, logout } = useAuth()
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return setError('Escribe tu nombre.')
    setError('')
    setCargando(true)
    try {
      await setupPerfil(nombre.trim())
    } catch (err) {
      setError(err.message)
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--paper)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">👋</div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>
            Bienvenido
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--ink-soft)' }}>
            Es tu primera vez — dinos como te llamas
          </p>
        </div>

        <form onSubmit={submit} className="rounded-2xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>

          <label className="block text-xs font-semibold mb-1"
            style={{ color: 'var(--ink-soft)' }}>Tu nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Juan"
            autoFocus
            className="w-full rounded-xl px-3 py-2 text-sm mb-4 outline-none"
            style={{ border: '1px solid var(--line)', color: 'var(--ink)', background: 'var(--paper)' }}
          />

          {error && (
            <div className="text-xs mb-3 rounded-xl px-3 py-2"
              style={{ background: '#FBEAE5', color: 'var(--red)' }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl py-3 font-bold text-sm"
            style={{ background: 'var(--green)', color: '#fff', opacity: cargando ? 0.6 : 1 }}
          >
            {cargando ? 'Preparando...' : 'Empezar'}
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full text-xs font-semibold mt-3 py-1"
            style={{ color: 'var(--ink-soft)' }}
          >
            Cerrar sesion
          </button>
        </form>
      </div>
    </div>
  )
}

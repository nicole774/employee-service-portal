import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../AuthContext.jsx'
import Toast from '../Toast.jsx'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState('error')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (error) {
      setToastType('error')
      setToast(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <div className="form-card">
        <h1>Connexion</h1>
        <p className="hint">Portail interne : les comptes sont créés par l'administrateur du service.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label htmlFor="password">Mot de passe</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        </form>
        <p className="hint">Pas de compte ? Demandez-le à l'administrateur du service.</p>
      </div>
      <Toast message={toast} type={toastType} onClose={setToast} />
    </main>
  )
}

export default Login

import { useEffect, useState } from 'react'
import { api } from '../api.js'
import Toast from '../Toast.jsx'
import { formatDateTime, CATEGORY_LABELS } from '../format.js'

// Gestion des comptes (ADMIN) : liste et création. Pas d'inscription publique :
// c'est ici qu'un EMPLOYEE ou un AGENT (avec son équipe) est créé.
function Users() {
  const [users, setUsers] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState('error')
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'EMPLOYEE', team: 'IT' })

  function load() {
    api('/admin/users').then(setUsers).catch((error) => {
      setToastType('error')
      setToast(error.message)
    })
  }

  useEffect(load, [])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await api('/admin/users', { method: 'POST', body: JSON.stringify(form) })
      setDialogOpen(false)
      setForm({ email: '', name: '', password: '', role: 'EMPLOYEE', team: 'IT' })
      setToastType('success')
      setToast('Compte créé')
      load()
    } catch (error) {
      setToastType('error')
      setToast(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <div className="page-header">
        <h1>Comptes</h1>
        <button type="button" className="btn btn-primary" onClick={() => setDialogOpen(true)}>+ Créer un compte</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Équipe</th><th>Créé le</th></tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.team ? CATEGORY_LABELS[user.team] : '—'}</td>
                <td>{formatDateTime(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialogOpen && (
        <div className="dialog" role="dialog" aria-modal="true">
          <form onSubmit={handleSubmit}>
            <div className="dialog-header">
              <h2>Créer un compte</h2>
              <button type="button" className="dialog-close" aria-label="Fermer" onClick={() => setDialogOpen(false)}>×</button>
            </div>
            <label htmlFor="u-name">Nom *</label>
            <input id="u-name" value={form.name} onChange={(e) => update('name', e.target.value)} required minLength={2} />
            <label htmlFor="u-email">Email *</label>
            <input id="u-email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
            <label htmlFor="u-password">Mot de passe provisoire *</label>
            <input id="u-password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={8} />
            <div className="form-grid">
              <div>
                <label htmlFor="u-role">Rôle *</label>
                <select id="u-role" value={form.role} onChange={(e) => update('role', e.target.value)}>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="AGENT">AGENT</option>
                </select>
              </div>
              {form.role === 'AGENT' && (
                <div>
                  <label htmlFor="u-team">Équipe *</label>
                  <select id="u-team" value={form.team} onChange={(e) => update('team', e.target.value)}>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <p className="form-note">Un AGENT doit être rattaché à une équipe : c'est ce qui détermine les demandes qu'il voit.</p>
            <div className="dialog-actions">
              <button type="button" className="btn" onClick={() => setDialogOpen(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Création…' : 'Créer'}</button>
            </div>
          </form>
        </div>
      )}

      <Toast message={toast} type={toastType} onClose={setToast} />
    </section>
  )
}

export default Users

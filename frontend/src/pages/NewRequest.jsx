import { useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../api.js'
import Toast from '../Toast.jsx'
import { SLA_HOURS, CATEGORY_LABELS, PRIORITY_LABELS } from '../format.js'

// Formulaire de création (EMPLOYEE uniquement). L'échéance SLA est calculée par le
// backend : ici on se contente d'annoncer le délai correspondant à la priorité choisie.
function NewRequest() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('IT')
  const [priority, setPriority] = useState('NORMAL')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState('error')

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const request = await api('/requests', {
        method: 'POST',
        body: JSON.stringify({ title, description, category, priority }),
      })
      navigate(`/demandes/${request.id}`)
    } catch (error) {
      setToastType('error')
      setToast(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <div className="form-card">
        <h1>Nouvelle demande</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Titre *</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            maxLength={100}
            placeholder="Résumé en une phrase"
          />

          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={5}
            maxLength={1000}
            rows={5}
            placeholder="Décrivez le problème ou la demande"
          />

          <div className="form-grid">
            <div>
              <label htmlFor="category">Catégorie *</label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="priority">Priorité *</label>
              <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="form-note">
            Priorité « {PRIORITY_LABELS[priority]} » : demande traitée sous {SLA_HOURS[priority]} h maximum
            selon le délai de service en vigueur.
          </p>

          <button type="submit" disabled={busy}>{busy ? 'Envoi…' : 'Envoyer la demande'}</button>
        </form>
      </div>
      <Toast message={toast} type={toastType} onClose={setToast} />
    </section>
  )
}

export default NewRequest

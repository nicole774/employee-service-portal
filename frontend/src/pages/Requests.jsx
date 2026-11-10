import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api.js'
import { useAuth } from '../AuthContext.jsx'
import Toast from '../Toast.jsx'
import Pagination from '../Pagination.jsx'
import { formatDateTime, slaLabel, STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS } from '../format.js'

// La même liste sert aux trois rôles : le backend filtre déjà selon le rôle,
// ici on ne fait que poser les filtres de lecture (statut, catégorie, retards).
function Requests() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [data, setData] = useState({ data: [], meta: { pages: 0 } })
  // La requête correspondant aux filtres actuels, et la dernière requête terminée :
  // tant qu'elles diffèrent, on est en train de charger (pas de setState dans l'effet)
  const [loadedQuery, setLoadedQuery] = useState(null)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState('error')

  const params = new URLSearchParams({ page: String(page), limit: '20' })
  if (status) params.set('status', status)
  if (category) params.set('category', category)
  if (overdueOnly) params.set('overdue', 'true')
  const query = params.toString()
  const loading = loadedQuery !== query

  useEffect(() => {
    let ignore = false
    api(`/requests?${query}`)
      .then((result) => { if (!ignore) setData(result) })
      .catch((error) => {
        if (ignore) return
        setToastType('error')
        setToast(error.message)
      })
      .finally(() => { if (!ignore) setLoadedQuery(query) })
    // Si les filtres changent avant la réponse, on ignore l'ancienne réponse
    return () => { ignore = true }
  }, [query])

  return (
    <section>
      <div className="page-header">
        <h1>
          {user.role === 'EMPLOYEE' && 'Mes demandes'}
          {user.role === 'AGENT' && `Demandes ${CATEGORY_LABELS[user.team] || user.team}`}
          {user.role === 'ADMIN' && 'Toutes les demandes'}
        </h1>
        {user.role === 'EMPLOYEE' && (
          <Link to="/nouvelle" className="btn btn-primary">+ Nouvelle demande</Link>
        )}
      </div>

      <div className="filters">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {user.role === 'ADMIN' && (
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}>
            <option value="">Toutes les équipes</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        )}
        <label className="filter">
          <input type="checkbox" checked={overdueOnly} onChange={(e) => { setOverdueOnly(e.target.checked); setPage(1) }} />
          En retard seulement
        </label>
      </div>

      {loading && <p>Chargement…</p>}

      {!loading && data.data.length === 0 && (
        <div className="card"><p>Aucune demande ne correspond.</p></div>
      )}

      {!loading && data.data.map((request) => (
        <Link to={`/demandes/${request.id}`} key={request.id} className="card request-card">
          <div className="request-title">
            <strong>#{request.id} — {request.title}</strong>
            <span className={`status-chip status-${request.status}`}>{STATUS_LABELS[request.status]}</span>
            {request.overdue && <span className="badge badge-out">En retard · {slaLabel(request.dueAt, true)}</span>}
          </div>
          <div className="chip-row">
            <span className="chip">{CATEGORY_LABELS[request.category]}</span>
            <span className={`chip chip-${request.priority}`}>Priorité {PRIORITY_LABELS[request.priority]}</span>
          </div>
          <p className="request-meta">
            Créée par {request.createdBy?.name} le {formatDateTime(request.createdAt)}
            {' · '}Échéance : {formatDateTime(request.dueAt)} ({slaLabel(request.dueAt, request.overdue)})
            {' · '}
            {request.assignedTo
              ? `Assignée à ${request.assignedTo.name}`
              : 'Non assignée'}
          </p>
        </Link>
      ))}

      <Pagination page={page} pages={data.meta.pages} onChange={setPage} />
      <Toast message={toast} type={toastType} onClose={setToast} />
    </section>
  )
}

export default Requests

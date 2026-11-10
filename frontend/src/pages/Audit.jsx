import { useEffect, useState } from 'react'
import { api } from '../api.js'
import Pagination from '../Pagination.jsx'
import { formatDateTime } from '../format.js'

// Journal d'audit (ADMIN) : filtres par email et par action, pagination sans
// total connu (une page pleine de 30 lignes annonce une page suivante possible).
function Audit() {
  const [email, setEmail] = useState('')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const [logs, setLogs] = useState([])
  const [hasNext, setHasNext] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: '30' })
    if (email) params.set('email', email)
    if (action) params.set('action', action)
    api(`/admin/audit-logs?${params}`)
      .then((data) => {
        setLogs(data)
        setHasNext(data.length === 30)
      })
      .catch(() => setLogs([]))
  }, [page, email, action])

  return (
    <section>
      <div className="page-header">
        <h1>Journal d'audit</h1>
      </div>

      <div className="filters">
        <input
          placeholder="Filtrer par email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setPage(1) }}
        />
        <input
          placeholder="Filtrer par action (ex. CREATE_REQUEST)"
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1) }}
        />
      </div>

      <div className="card">
        {logs.length === 0 && <p style={{ margin: 0 }}>Aucune entrée ne correspond.</p>}
        {logs.map((log) => (
          <p key={log.id} className="audit-line">
            <strong>{log.action}</strong> sur {log.entity}#{log.entityId ?? '—'}
            {' — '}{log.user?.name || 'utilisateur supprimé'}
            {' — '}{formatDateTime(log.createdAt)}
          </p>
        ))}
      </div>

      <Pagination page={page} hasNext={hasNext} onChange={setPage} />
    </section>
  )
}

export default Audit

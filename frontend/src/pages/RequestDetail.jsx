import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { api } from '../api.js'
import { useAuth } from '../AuthContext.jsx'
import Toast from '../Toast.jsx'
import { formatDateTime, slaLabel, STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS } from '../format.js'

// Boutons de transition autorisés selon le statut actuel — le même cycle que le
// tableau ALLOWED_TRANSITIONS du backend, ici pour l'affichage. Le backend reste
// la vraie protection : une transition impossible renverra 400.
const NEXT_STATUS = {
  OPEN: [{ value: 'IN_PROGRESS', label: 'Prendre en charge' }, { value: 'REJECTED', label: 'Refuser', danger: true }],
  IN_PROGRESS: [{ value: 'RESOLVED', label: 'Marquer résolue' }, { value: 'REJECTED', label: 'Refuser', danger: true }],
  RESOLVED: [{ value: 'CLOSED', label: 'Clôturer' }],
  CLOSED: [],
  REJECTED: [],
}

function RequestDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [request, setRequest] = useState(null)
  const [agents, setAgents] = useState([])
  const [commentBody, setCommentBody] = useState('')
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState('error')
  const [busy, setBusy] = useState(false)

  // Récupère la demande et, pour l'admin, les agents de l'équipe concernée
  // (pour pouvoir l'assigner). Ne touche pas au state : l'appelant s'en charge.
  async function fetchData() {
    const data = await api(`/requests/${id}`)
    let teamAgents = []
    if (user.role === 'ADMIN') {
      const users = await api('/admin/users')
      teamAgents = users.filter((u) => u.role === 'AGENT' && u.team === data.category)
    }
    return { data, teamAgents }
  }

  function showError(error) {
    setToastType('error')
    setToast(error.message)
  }

  async function load() {
    try {
      const { data, teamAgents } = await fetchData()
      setRequest(data)
      setAgents(teamAgents)
    } catch (error) {
      showError(error)
    }
  }

  useEffect(() => {
    let ignore = false
    fetchData()
      .then(({ data, teamAgents }) => {
        if (ignore) return
        setRequest(data)
        setAgents(teamAgents)
      })
      .catch((error) => { if (!ignore) showError(error) })
    return () => { ignore = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function changeStatus(status) {
    setBusy(true)
    try {
      setRequest(await api(`/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }))
      setToastType('success')
      setToast(`Statut mis à jour : ${STATUS_LABELS[status]}`)
    } catch (error) {
      setToastType('error')
      setToast(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function assign(assignedToId) {
    setBusy(true)
    try {
      const body = assignedToId ? { assignedToId } : {}
      setRequest(await api(`/requests/${id}/assign`, { method: 'PATCH', body: JSON.stringify(body) }))
      setToastType('success')
      setToast('Demande assignée')
    } catch (error) {
      setToastType('error')
      setToast(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function addComment(event) {
    event.preventDefault()
    if (!commentBody.trim()) return
    setBusy(true)
    try {
      await api(`/requests/${id}/comments`, { method: 'POST', body: JSON.stringify({ body: commentBody }) })
      setCommentBody('')
      await load()
    } catch (error) {
      setToastType('error')
      setToast(error.message)
    } finally {
      setBusy(false)
    }
  }

  if (!request) {
    return <section><p>{toast ? toast : 'Chargement…'}</p></section>
  }

  const canAct = user.role === 'ADMIN' || (user.role === 'AGENT' && request.category === user.team)

  return (
    <section>
      <div className="page-header">
        <h1>#{request.id} — {request.title}</h1>
        <Link to="/" className="link-button">← Retour à la liste</Link>
      </div>

      <div className="card">
        <div className="chip-row">
          <span className={`status-chip status-${request.status}`}>{STATUS_LABELS[request.status]}</span>
          <span className="chip">{CATEGORY_LABELS[request.category]}</span>
          <span className={`chip chip-${request.priority}`}>Priorité {PRIORITY_LABELS[request.priority]}</span>
          {request.overdue && <span className="badge badge-out">En retard · {slaLabel(request.dueAt, true)}</span>}
        </div>
        <p className="description">{request.description}</p>
        <div className="details">
          <p>Créée par <strong>{request.createdBy?.name}</strong> le {formatDateTime(request.createdAt)}</p>
          <p>
            Échéance SLA : <strong>{formatDateTime(request.dueAt)}</strong>
            {' '}({slaLabel(request.dueAt, request.overdue)})
          </p>
          {request.resolvedAt && <p>Résolue le {formatDateTime(request.resolvedAt)} — {request.resolvedAt <= request.dueAt ? 'dans les délais ✅' : 'hors délais ⚠️'}</p>}
          {request.closedAt && <p>Clôturée le {formatDateTime(request.closedAt)}</p>}
          <p>
            Assignée à : <strong>{request.assignedTo ? `${request.assignedTo.name} (${CATEGORY_LABELS[request.assignedTo.team] || request.assignedTo.team})` : 'personne pour le moment'}</strong>
          </p>
        </div>

        {canAct && NEXT_STATUS[request.status].length > 0 && (
          <div className="actions">
            {NEXT_STATUS[request.status].map((transition) => (
              <button
                key={transition.value}
                type="button"
                className={transition.danger ? 'button-danger' : 'button-accent'}
                disabled={busy}
                onClick={() => changeStatus(transition.value)}
              >
                {transition.label}
              </button>
            ))}
          </div>
        )}

        {user.role === 'ADMIN' && !request.assignedToId && agents.length > 0 && (
          <div className="actions">
            <span>Router vers :</span>
            {agents.map((agent) => (
              <button key={agent.id} type="button" disabled={busy} onClick={() => assign(agent.id)}>
                {agent.name}
              </button>
            ))}
          </div>
        )}
        {user.role === 'AGENT' && !request.assignedToId && request.category === user.team && (
          <div className="actions">
            <button type="button" disabled={busy} onClick={() => assign()}>M'assigner cette demande</button>
          </div>
        )}
      </div>

      <h2>Commentaires ({request.comments.length})</h2>
      {request.comments.map((comment) => (
        <div key={comment.id} className="comment">
          <p>{comment.body}</p>
          <p className="comment-meta">
            {comment.author.name} ({comment.author.role === 'AGENT' ? `agent ${CATEGORY_LABELS[comment.author.team] || comment.author.team}` : comment.author.role === 'ADMIN' ? 'admin' : 'demandeur'})
            {' — '}{formatDateTime(comment.createdAt)}
          </p>
        </div>
      ))}

      <form className="form-card" onSubmit={addComment}>
        <label htmlFor="comment">Ajouter un commentaire</label>
        <textarea
          id="comment"
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Votre message"
        />
        <button type="submit" disabled={busy || !commentBody.trim()}>Commenter</button>
      </form>

      <Toast message={toast} type={toastType} onClose={setToast} />
    </section>
  )
}

export default RequestDetail

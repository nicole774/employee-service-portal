import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api.js'
import Toast from '../Toast.jsx'
import { formatDateTime, STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS } from '../format.js'

// Les colonnes : les trois états actifs du cycle de vie, plus « Terminées »
// pour les demandes CLOSED et REJECTED — comme ça, une demande vient tout juste
// clôturée reste visible au lieu de sembler avoir disparu.
const COLUMNS = [
  { status: 'OPEN', label: 'Ouvertes' },
  { status: 'IN_PROGRESS', label: 'En cours' },
  { status: 'RESOLVED', label: 'Résolues' },
  { status: 'DONE', label: 'Terminées', isTerminal: true },
]

// Nombre de demandes terminées affichées tant que la colonne n'est pas dépliée
const DONE_VISIBLE = 3

// Glisser une carte d'une colonne à l'autre change son statut via l'API.
// Le backend valide la transition : un mouvement interdit renvoie un 400 affiché en toast.
function Kanban() {
  const [cards, setCards] = useState([])
  const [draggedId, setDraggedId] = useState(null)
  const [dropColumn, setDropColumn] = useState(null)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState('error')
  // La colonne « Terminées » se remplit vite : par défaut on n'y montre que les
  // plus récentes. Rien n'est supprimé, les autres restent dans la liste « Demandes ».
  const [showAllDone, setShowAllDone] = useState(false)

  // Le backend renvoie au plus 50 demandes par page : on parcourt toutes les pages
  // pour que le tableau montre bien toutes les demandes de l'équipe
  async function fetchAllCards() {
    const first = await api('/requests?limit=50&page=1')
    let all = first.data
    for (let page = 2; page <= first.meta.pages; page++) {
      const next = await api(`/requests?limit=50&page=${page}`)
      all = all.concat(next.data)
    }
    return all
  }

  function load() {
    fetchAllCards()
      .then(setCards)
      .catch((error) => {
        setToastType('error')
        setToast(error.message)
      })
  }

  // Chargement initial + rafraîchissement au retour sur l'onglet : si une demande
  // a changé de statut ailleurs (page détail, autre onglet), le Kanban se met à jour
  useEffect(() => {
    load()
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  async function moveTo(requestId, newStatus, currentStatus) {
    if (requestId === null || newStatus === currentStatus) return
    try {
      await api(`/requests/${requestId}/status`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
      setToastType('success')
      setToast(`Demande #${requestId} → ${STATUS_LABELS[newStatus]}`)
      load()
    } catch (error) {
      setToastType('error')
      setToast(error.message)
    } finally {
      setDraggedId(null)
      setDropColumn(null)
    }
  }

  return (
    <section>
      <div className="page-header">
        <h1>Kanban de l'équipe</h1>
      </div>
      <p className="kanban-hint">
        Glissez une carte vers une autre colonne pour faire avancer la demande — les
        transitions interdites sont refusées par l'API (ex. : directement à Terminées).
        La colonne « Terminées » ne montre que les {DONE_VISIBLE} plus récentes ; les autres
        restent consultables dans la liste des demandes.
      </p>

      <div className="kanban">
        {COLUMNS.map((column) => {
          const allColumnCards =
            column.isTerminal
              ? cards
                  .filter((card) => card.status === 'CLOSED' || card.status === 'REJECTED')
                  // Les plus récemment terminées d'abord (une demande refusée n'a pas
                  // de closedAt : on se rabat sur sa date de création)
                  .sort((a, b) => new Date(b.closedAt || b.createdAt) - new Date(a.closedAt || a.createdAt))
              : cards.filter((card) => card.status === column.status)
          const hiddenCount = column.isTerminal && !showAllDone
            ? Math.max(0, allColumnCards.length - DONE_VISIBLE)
            : 0
          const columnCards = hiddenCount > 0 ? allColumnCards.slice(0, DONE_VISIBLE) : allColumnCards
          const targetStatus = column.isTerminal ? 'CLOSED' : column.status
          return (
            <section
              key={column.status}
              className={`kanban-col${dropColumn === column.status ? ' drop-target' : ''}`}
              aria-label={`${column.label} : ${columnCards.length} demandes`}
              onDragOver={(event) => { event.preventDefault(); setDropColumn(column.status) }}
              onDragLeave={() => setDropColumn(null)}
              onDrop={() => moveTo(draggedId, targetStatus, cards.find((c) => c.id === draggedId)?.status)}
            >
              <h3>{column.label} <span className="col-count">{allColumnCards.length}</span></h3>

              {columnCards.map((card) => (
                <div
                  key={card.id}
                  className={`kanban-card${draggedId === card.id ? ' dragging' : ''}`}
                  draggable
                  onDragStart={() => setDraggedId(card.id)}
                  onDragEnd={() => { setDraggedId(null); setDropColumn(null) }}
                >
                  <span className="kanban-id">#{card.id} · {formatDateTime(card.createdAt)}</span>
                  <Link to={`/demandes/${card.id}`} className="kanban-title">{card.title}</Link>
                  <div className="chip-row">
                    <span className={`chip chip-${card.priority}`}>{PRIORITY_LABELS[card.priority]}</span>
                    <span className="chip">{CATEGORY_LABELS[card.category]}</span>
                    {column.isTerminal && (
                      <span className={`status-chip status-${card.status}`}>{STATUS_LABELS[card.status]}</span>
                    )}
                  </div>
                  <span className={card.overdue ? 'badge badge-out' : 'sla-ok'}>
                    {card.overdue ? `En retard · ${formatDateTime(card.dueAt)}` : `Échéance : ${formatDateTime(card.dueAt)}`}
                  </span>
                  {card.assignedTo && <span className="kanban-id">Assignée à {card.assignedTo.name}</span>}
                </div>
              ))}

              {columnCards.length === 0 && <p className="kanban-hint">Aucune demande ici.</p>}

              {column.isTerminal && allColumnCards.length > DONE_VISIBLE && (
                <button type="button" className="kanban-toggle" onClick={() => setShowAllDone(!showAllDone)}>
                  {showAllDone ? 'Réduire' : `Afficher les ${hiddenCount} plus anciennes`}
                </button>
              )}
            </section>
          )
        })}
      </div>

      <Toast message={toast} type={toastType} onClose={setToast} />
    </section>
  )
}

export default Kanban

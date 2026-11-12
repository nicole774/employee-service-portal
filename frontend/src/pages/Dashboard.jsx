import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api.js'
import { CATEGORY_LABELS, PRIORITY_LABELS, formatDateTime } from '../format.js'

// Pilotage (ADMIN) : jauge de SLA, volumes, charge par équipe et liste des retards.
// Toutes les données viennent de GET /api/admin/dashboard.
function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/admin/dashboard')
      .then(setData)
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <section><div className="alert">{error}</div></section>
  if (!data) return <section><p>Chargement…</p></section>

  // La jauge : un cercle SVG dont la portion colorée représente le taux de SLA
  // Tant qu'aucune demande n'est résolue, l'API renvoie rate = null : il n'y a
  // rien à mesurer, donc on affiche « — » plutôt qu'un 0 % trompeur
  const rate = data.sla.rate
  const hasRate = rate !== null && rate !== undefined
  const circumference = 2 * Math.PI * 50
  const filled = hasRate ? (rate / 100) * circumference : 0

  const open = data.byStatus.find((s) => s.status === 'OPEN')?.count ?? 0
  const inProgress = data.byStatus.find((s) => s.status === 'IN_PROGRESS')?.count ?? 0
  const resolved = data.byStatus.find((s) => s.status === 'RESOLVED')?.count ?? 0
  const closed = data.byStatus.find((s) => s.status === 'CLOSED')?.count ?? 0

  return (
    <section>
      <div className="page-header">
        <h1>Tableau de bord</h1>
      </div>

      <div className="stat-grid">
        <div className="sla-card">
          <svg
            className="donut" viewBox="0 0 120 120" role="img"
            aria-label={hasRate ? `Taux de SLA respectés : ${rate} %` : 'Taux de SLA : aucune demande résolue pour le moment'}
          >
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
            {/* Pas d'arc à 0 : avec des bouts arrondis, il laisserait un point isolé */}
            {filled > 0 && (
              <circle
                cx="60" cy="60" r="50" fill="none" stroke="#4f46e5" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${filled} ${circumference}`} transform="rotate(-90 60 60)"
              />
            )}
            <text x="60" y="58" textAnchor="middle" className="donut-value">{hasRate ? `${rate} %` : '—'}</text>
            <text x="60" y="76" textAnchor="middle" className="donut-label">SLA respectés</text>
          </svg>
          <p className="sla-note">
            {hasRate ? (
              <>
                {data.sla.resolvedInTime} résolues dans les délais<br />
                sur {data.sla.resolved} résolues au total
              </>
            ) : (
              <>Aucune demande résolue pour le moment :<br />le taux s'affichera dès la première.</>
            )}
          </p>
        </div>
        <div className="stat-tile tile-amber"><span className="stat-value">{open}</span><span className="stat-label">Ouvertes</span></div>
        <div className="stat-tile tile-indigo"><span className="stat-value">{inProgress}</span><span className="stat-label">En cours</span></div>
        <div className="stat-tile tile-green"><span className="stat-value">{resolved + closed}</span><span className="stat-label">Terminées</span></div>
        <div className="stat-tile tile-red"><span className="stat-value">{data.overdue.length}</span><span className="stat-label">En retard</span></div>
      </div>

      <h2 className="section-title">Charge par équipe (demandes actives)</h2>
      <div className="card">
        {data.byTeam.length === 0 && <p style={{ margin: 0 }}>Aucune demande active.</p>}
        {data.byTeam.map((team) => (
          <div key={team.team} className="team-row">
            <span>{CATEGORY_LABELS[team.team] || team.team}</span>
            <div className="bar"><div className="bar-fill" style={{ width: `${Math.min(100, team.count * 10)}%` }} /></div>
            <b>{team.count}</b>
          </div>
        ))}
      </div>

      <h2 className="section-title">Demandes en retard <span className="count-badge">{data.overdue.length}</span></h2>
      {data.overdue.length === 0 && <div className="card"><p style={{ margin: 0 }}>Aucune demande en retard 🎉</p></div>}
      {data.overdue.map((request) => (
        <Link to={`/demandes/${request.id}`} key={request.id} className="card request-card">
          <div className="request-title">
            <strong>#{request.id} — {request.title}</strong>
            <span className={`chip chip-${request.priority}`}>{PRIORITY_LABELS[request.priority]}</span>
            <span className="badge badge-out">Échéance passée : {formatDateTime(request.dueAt)}</span>
          </div>
          <p className="request-meta">
            {CATEGORY_LABELS[request.category]}
            {request.assignedTo ? ` · assignée à ${request.assignedTo.name}` : ' · non assignée — à router'}
          </p>
        </Link>
      ))}
    </section>
  )
}

export default Dashboard

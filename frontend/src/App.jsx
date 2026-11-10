import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router'
import { useAuth } from './AuthContext.jsx'
import RequireRole from './RequireRole.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Requests from './pages/Requests.jsx'
import NewRequest from './pages/NewRequest.jsx'
import RequestDetail from './pages/RequestDetail.jsx'
import Kanban from './pages/Kanban.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Users from './pages/Users.jsx'
import Audit from './pages/Audit.jsx'
import { CATEGORY_LABELS } from './format.js'

// La coque « helpdesk » : barre latérale sombre + zone de contenu.
// Sans utilisateur connecté : la page d'accueil publique et la connexion.
function App() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  if (loading) return <div className="main"><p>Chargement…</p></div>

  // Visiteur : uniquement l'accueil public et la connexion
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  const initials = user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

  function signOut() {
    logout()
    navigate('/connexion')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo"><span className="logo-mark">◆</span> Portail demandes</div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
            📥 Demandes
          </NavLink>
          {user.role === 'EMPLOYEE' && (
            <NavLink to="/nouvelle" className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
              ➕ Nouvelle demande
            </NavLink>
          )}
          {user.role === 'AGENT' && (
            <NavLink to="/kanban" className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
              🗂️ Kanban
            </NavLink>
          )}
          {user.role === 'ADMIN' && (
            <>
              <NavLink to="/admin" end className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
                📊 Tableau de bord
              </NavLink>
              <NavLink to="/admin/comptes" className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
                👥 Comptes
              </NavLink>
              <NavLink to="/admin/journal" className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}>
                📜 Journal
              </NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-user">
          <span className="avatar">{initials}</span>
          <div>
            <strong>{user.name}</strong>
            <span className="role-badge">
              {user.role}{user.team ? ` · ${CATEGORY_LABELS[user.team] || user.team}` : ''}
            </span>
          </div>
          <button type="button" className="logout-button" onClick={signOut} aria-label="Déconnexion">⏻</button>
        </div>
      </aside>

      <main className="main">
        <Routes>
          {/* Accueil selon le rôle : l'admin atterrit sur son tableau de bord,
              les autres sur la liste de leurs demandes */}
          <Route path="/" element={user.role === 'ADMIN' ? <Navigate to="/admin" replace /> : <Requests />} />
          <Route path="/connexion" element={<Navigate to="/" replace />} />
          <Route path="/nouvelle" element={<RequireRole role="EMPLOYEE"><NewRequest /></RequireRole>} />
          <Route path="/demandes/:id" element={<RequestDetail />} />
          <Route path="/kanban" element={<RequireRole role="AGENT"><Kanban /></RequireRole>} />
          <Route path="/admin" element={<RequireRole role="ADMIN"><Dashboard /></RequireRole>} />
          <Route path="/admin/comptes" element={<RequireRole role="ADMIN"><Users /></RequireRole>} />
          <Route path="/admin/journal" element={<RequireRole role="ADMIN"><Audit /></RequireRole>} />
          <Route path="*" element={<p>Page introuvable</p>} />
        </Routes>
      </main>
    </div>
  )
}

export default App

import { Navigate } from 'react-router'
import { useAuth } from './AuthContext.jsx'

// Protège une page : il faut être connecté, et avoir le bon rôle si `role` est donné
function RequireRole({ role, children }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/connexion" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

export default RequireRole

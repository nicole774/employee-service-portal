import { Link } from 'react-router'
import { useAuth } from '../AuthContext.jsx'

// Page d'accueil publique : présente le portail à un visiteur non connecté et
// mène vers la connexion. Le contenu parle aux trois publics (employé, agent, admin).
function Landing() {
  const { user } = useAuth()

  return (
    <div className="landing">
      <header className="landing-bar">
        <span className="landing-logo"><span className="logo-mark">◆</span> Portail demandes</span>
        {user ? (
          <Link to="/" className="btn btn-primary">Ouvrir le portail</Link>
        ) : (
          <Link to="/connexion" className="btn btn-primary">Se connecter</Link>
        )}
      </header>

      <section className="landing-hero">
        <h1>Les demandes internes, enfin claires.</h1>
        <p>
          Informatique, RH, locaux : chaque demande est déposée une fois, routée vers la
          bonne équipe, et suit un délai de service (SLA) connu de tout le monde — de son
          dépôt jusqu'à sa clôture.
        </p>
        <Link to="/connexion" className="btn btn-primary">Accéder au portail</Link>
      </section>

      <section className="landing-roles">
        <div className="landing-card">
          <h3>💼 Employé</h3>
          <p>Déposez une demande en deux minutes, avec une priorité et une échéance affichées. Suivez son avancement et échangez avec l'agent dans le fil de commentaires.</p>
        </div>
        <div className="landing-card">
          <h3>🛠️ Agent</h3>
          <p>Une file claire pour votre équipe, et une vue Kanban : vous glissez une demande de « Ouverte » vers « En cours », puis « Résolue ». Les échéances sont toujours visibles.</p>
        </div>
        <div className="landing-card">
          <h3>📋 Administrateur</h3>
          <p>Créez les comptes, routez les demandes non assignées vers le bon agent, et pilotez : charge par équipe, retards en rouge, taux de SLA respectés.</p>
        </div>
      </section>

      <section className="landing-steps">
        <h2>Comment ça marche</h2>
        <ol>
          <li><strong>Dépôt</strong> — l'employé décrit sa demande et choisit sa priorité ; l'échéance SLA se calcule automatiquement.</li>
          <li><strong>Routage</strong> — l'administrateur l'assigne à un agent de l'équipe concernée (ou l'agent se l'assigne).</li>
          <li><strong>Suivi</strong> — statuts contrôlés, échéances visibles, retards détectés à la volée.</li>
          <li><strong>Clôture</strong> — résolue dans les délais ? Le tableau de bord le mesure.</li>
        </ol>
      </section>

      <footer className="landing-footer">
        Portail interne — accès sur compte uniquement. Pour obtenir vos identifiants,
        contactez l'administrateur du service.
      </footer>
    </div>
  )
}

export default Landing

// Données de démonstration : 1 admin, 3 agents (une par équipe), 2 employés,
// et 5 demandes dont 2 pour tester les cas limites du SLA.
require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient, Priority, Category } = require('@prisma/client');

const prisma = new PrismaClient();

// Délais de SLA en heures, identiques à ce que l'API utilisera (src/lib/sla.js)
const SLA_HOURS = { URGENT: 4, HIGH: 8, NORMAL: 24, LOW: 72 };

// [titre, description, catégorie, priorité, heures écoulées depuis la création]
const requests = [
  ['Écran qui clignote', 'Mon second écran clignote par intermittence depuis ce matin.', 'IT', 'HIGH', 2],
  ['Badge d\'accès perdu', 'J\'ai perdu mon badge, je ne peux plus accéder au bâtiment B.', 'FACILITY', 'URGENT', 30],
  ['Attestation de salaire', 'Besoin d\'une attestation de salaire pour mon dossier de prêt.', 'HR', 'NORMAL', 5],
  ['Clavier défectueux', 'La touche Entrée de mon clavier reste bloquée.', 'IT', 'LOW', 1],
  ['Demande de télétravail', 'Je souhaiterais 2 jours de télétravail la semaine prochaine.', 'HR', 'NORMAL', 0],
];

async function main() {
  const passwordHash = async (password) => bcrypt.hash(password, 10);

  // upsert = « crée s'il n'existe pas » : on peut relancer le seed sans doublons
  const users = [
    { email: 'admin@portal.test', name: 'Admin Service', password: 'Admin123!', role: 'ADMIN', team: null },
    { email: 'agent.it@portal.test', name: 'Agent IT', password: 'Agent123!', role: 'AGENT', team: 'IT' },
    { email: 'agent.hr@portal.test', name: 'Agent RH', password: 'Agent123!', role: 'AGENT', team: 'HR' },
    { email: 'agent.facility@portal.test', name: 'Agent Locaux', password: 'Agent123!', role: 'AGENT', team: 'FACILITY' },
    { email: 'employee@portal.test', name: ' Employé Démo', password: 'Employee123!', role: 'EMPLOYEE', team: null },
    { email: 'employee2@portal.test', name: 'Autre Employé', password: 'Employee123!', role: 'EMPLOYEE', team: null },
  ];

  const created = {};
  for (const u of users) {
    created[u.email] = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, name: u.name.trim(), passwordHash: await passwordHash(u.password), role: u.role, team: u.team },
    });
  }

  const employee = created['employee@portal.test'];
  const employee2 = created['employee2@portal.test'];

  for (const [title, description, category, priority, hoursAgo] of requests) {
    // La demande est datée dans le passé pour créer volontairement :
    //  - « Badge d'accès perdu » (URGENT, 30h) → en retard (SLA 4h), pour CT-07
    //  - « Écran qui clignote » (HIGH, 2h) → encore dans les temps (SLA 8h)
    const createdAt = new Date(Date.now() - hoursAgo * 3600 * 1000);
    const dueAt = new Date(createdAt.getTime() + SLA_HOURS[priority] * 3600 * 1000);

    const exists = await prisma.request.findFirst({ where: { title } });
    if (!exists) {
      await prisma.request.create({
        data: {
          title, description,
          category: Category[category],
          priority: Priority[priority],
          dueAt, createdAt,
          createdById: hoursAgo === 5 ? employee2.id : employee.id,
        },
      });
    }
  }

  console.log(`Seed terminé : ${users.length} utilisateurs, ${requests.length} demandes (dont 1 en retard de SLA)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

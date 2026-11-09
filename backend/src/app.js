const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const requestRoutes = require('./routes/requests.routes');
const adminRoutes = require('./routes/admin.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Autorise le frontend (autre port) à appeler l'API — même approche que le projet 1 (D10)
app.use(cors());
// Permet de lire le JSON envoyé dans le corps des requêtes
app.use(express.json());

// Route de test : vérifie que l'API répond
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);

// Aucune route ne correspond → 404 en JSON
app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

// Toujours en dernier : attrape les erreurs de toutes les routes au-dessus
app.use(errorHandler);

module.exports = app;

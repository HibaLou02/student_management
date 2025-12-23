require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

// Initialisation de l'application
const app = express();
const port = process.env.PORT || 3001;

// Configuration CORS
const corsOptions = {
  origin: '*', // À remplacer par votre URL frontend en production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Middleware pour logger les requêtes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Connexion à MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student_management';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur de connexion à MongoDB:', err));

// Modèle Étudiant
const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

// Routes de base
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP' });
});

// Route de test pour vérifier le préfixe
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test réussi !' });
});

// GET /api/etudiants - Récupérer tous les étudiants
app.get('/api/etudiants', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/etudiants - Créer un nouvel étudiant
app.post('/api/etudiants', async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Le prénom et le nom sont requis' });
    }

    const student = new Student({ firstName, lastName });
    const savedStudent = await student.save();
    
    res.status(201).json(savedStudent);
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ error: 'Erreur lors de la création de l\'étudiant' });
  }
});

// Gestion des routes non trouvées
app.use((req, res) => {
  console.log(`Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Ressource non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({ error: 'Une erreur est survenue sur le serveur' });
});

// Démarrer le serveur
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
  console.log(`📊 Base de données: ${mongoURI}`);
});

// Gestion des arrêts propres
process.on('SIGTERM', () => {
  console.log('Arrêt du serveur...');
  server.close(() => {
    console.log('Serveur arrêté');
    process.exit(0);
  });
});

module.exports = { app, server };

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

// Import des modèles (schemas centralisés)
const { Student, Course, Grade } = require('./model/schemas');

// Initialisation de l'application
const app = express();
const port = process.env.PORT || 3001;

// Configuration CORS
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200
};

// Logs des requêtes (debug TD)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Middlewares globaux
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Connexion à MongoDB
const mongoURI = 'mongodb://127.0.0.1:27017/student_management';
// const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student_management';

mongoose
  .connect(mongoURI)
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch((err) =>
    console.error('❌ Erreur de connexion à MongoDB:', err)
  );

// =====================
// ROUTES
// =====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP' });
});

// Test API
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test réussi !' });
});

// =====================
// ÉTUDIANTS
// =====================

// GET /api/etudiants
app.get('/api/etudiants', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    console.error(err);
    const fs = require('fs');
    fs.appendFileSync('server_error.log', new Date().toISOString() + ' ERROR /api/etudiants: ' + err.stack + '\n');
    res.status(500).json({ error: 'Erreur serveur: ' + err.message });
  }
});

// GET /api/etudiants/:id
app.get('/api/etudiants/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Étudiant non trouvé' });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur: ' + err.message });
  }
});

// POST /api/etudiants
app.post('/api/etudiants', async (req, res) => {
  try {
    // Support both naming conventions
    const firstName = req.body.firstName || req.body.prenom;
    const lastName = req.body.lastName || req.body.nom;
    const email = req.body.email;
    const dateNaissance = req.body.dateNaissance;

    if (!firstName || !lastName || !email || !dateNaissance) {
      return res
        .status(400)
        .json({ error: 'Tous les champs (prénom, nom, email, date de naissance) sont requis' });
    }

    const student = new Student({ firstName, lastName, email, dateNaissance });
    const savedStudent = await student.save();

    res.status(201).json(savedStudent);
  } catch (err) {
    console.error(err);
    const fs = require('fs');
    fs.appendFileSync('server_error.log', new Date().toISOString() + ' ERROR POST /api/etudiants: ' + err.stack + '\n');
    res
      .status(500)
      .json({ error: 'Erreur lors de la création de l’étudiant: ' + err.message });
  }
});

// PUT /api/etudiants/:id
app.put('/api/etudiants/:id', async (req, res) => {
  try {
    const firstName = req.body.firstName || req.body.prenom;
    const lastName = req.body.lastName || req.body.nom;
    const email = req.body.email;
    const dateNaissance = req.body.dateNaissance;

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, dateNaissance },
      { new: true }
    );

    if (!updatedStudent) return res.status(404).json({ error: 'Étudiant non trouvé' });
    res.json(updatedStudent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la modification: ' + err.message });
  }
});

// DELETE /api/etudiants/:id
app.delete('/api/etudiants/:id', async (req, res) => {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);
    if (!deletedStudent) return res.status(404).json({ error: 'Étudiant non trouvé' });
    res.json({ message: 'Étudiant supprimé avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la suppression: ' + err.message });
  }
});

// =====================
// NOTES & MATIÈRES
// =====================
const {
  getAll: getAllGrades,
  create: createGrade,
  get: getGrade,
  update: updateGrade,
  remove: deleteGrade
} = require('./routes/grades');

const {
  getAll: getAllCourses,
  create: createCourse,
  get: getCourse,
  update: updateCourse,
  remove: deleteCourse
} = require('./routes/courses');

// Notes
app.get('/api/notes', getAllGrades);
app.get('/api/notes/:id', getGrade);
app.post('/api/notes', createGrade);
app.put('/api/notes/:id', updateGrade);
app.delete('/api/notes/:id', deleteGrade);

// Matières
app.get('/api/matieres', getAllCourses);
app.get('/api/matieres/:id', getCourse);
app.post('/api/matieres', createCourse);
app.put('/api/matieres/:id', updateCourse);
app.delete('/api/matieres/:id', deleteCourse);

// =====================
// GESTION DES ERREURS
// =====================

// Routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    error: 'Ressource non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// Erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur globale:', err);
  res.status(500).json({
    error: 'Une erreur est survenue sur le serveur'
  });
});

// =====================
// DÉMARRAGE SERVEUR
// =====================
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
  console.log(`📊 MongoDB: ${mongoURI}`);
});

// Arrêt propre
process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté');
    process.exit(0);
  });
});

module.exports = { app, server };

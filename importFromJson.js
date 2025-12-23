const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { Student, Course, Grade } = require('./model/schemas');

// Connexion à la base de données
const uri = 'mongodb+srv://hibaelbakkouri_db_user:fkWEdqNUqngtAbzm@hibslou.ceadxm4.mongodb.net/student_management?appName=HibsLou&retryWrites=true&w=majority';

const options = {};

async function importData() {
    try {
        // Se connecter à MongoDB
        await mongoose.connect(uri, options);
        console.log('Connected to MongoDB');

        // Lire le fichier data.json
        const dataPath = path.join(__dirname, '..', 'public', 'data.json');
        const rawData = fs.readFileSync(dataPath);
        const gradesData = JSON.parse(rawData);

        // Nettoyer la base de données
        console.log('Cleaning database...');
        await Promise.all([
            Student.deleteMany({}),
            Course.deleteMany({}),
            Grade.deleteMany({})
        ]);

        // Créer des ensembles pour éviter les doublons
        const uniqueStudents = new Map();
        const uniqueCourses = new Map();

        // Préparer les données
        const gradesToInsert = [];

        for (const item of gradesData) {
            // Gérer les étudiants
            const studentKey = `${item.student.firstname}_${item.student.lastname}_${item.student.id}`;
            if (!uniqueStudents.has(studentKey)) {
                uniqueStudents.set(studentKey, {
                    firstName: item.student.firstname,
                    lastName: item.student.lastname,
                    studentId: item.student.id
                });
            }

            // Gérer les cours
            if (!uniqueCourses.has(item.course)) {
                uniqueCourses.set(item.course, {
                    name: item.course,
                    code: item.course.replace(/\s+/g, '_').toUpperCase()
                });
            }
        }

        // Insérer les étudiants
        console.log('Inserting students...');
        const studentDocs = await Student.insertMany(Array.from(uniqueStudents.values()));
        
        // Créer une map pour retrouver les étudiants par leur identifiant
        const studentMap = new Map();
        studentDocs.forEach(doc => {
            const key = `${doc.firstName}_${doc.lastName}_${doc.studentId}`;
            studentMap.set(key, doc._id);
        });

        // Insérer les cours
        console.log('Inserting courses...');
        const courseDocs = await Course.insertMany(Array.from(uniqueCourses.values()));
        
        // Créer une map pour retrouver les cours par leur nom
        const courseMap = new Map();
        courseDocs.forEach(doc => {
            courseMap.set(doc.name, doc._id);
        });

        // Préparer les notes
        console.log('Preparing grades...');
        for (const item of gradesData) {
            const studentKey = `${item.student.firstname}_${item.student.lastname}_${item.student.id}`;
            const studentId = studentMap.get(studentKey);
            const courseId = courseMap.get(item.course);

            if (studentId && courseId) {
                gradesToInsert.push({
                    student: studentId,
                    course: courseId,
                    grade: item.grade,
                    date: new Date(item.date)
                });
            }
        }

        // Insérer les notes
        console.log('Inserting grades...');
        await Grade.insertMany(gradesToInsert);

        console.log('Data imported successfully!');
        console.log(`- ${studentDocs.length} students inserted`);
        console.log(`- ${courseDocs.length} courses inserted`);
        console.log(`- ${gradesToInsert.length} grades inserted`);

        process.exit(0);
    } catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
}

importData();

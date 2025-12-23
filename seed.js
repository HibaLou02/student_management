const mongoose = require('mongoose');
const { Student, Course, Grade } = require('./model/schemas');

// Connexion à la base de données
const uri = 'mongodb+srv://hibaelbakkouri_db_user:fkWEdqNUqngtAbzm@hibslou.ceadxm4.mongodb.net/student_management?appName=HibsLou&retryWrites=true&w=majority';

const options = {};

async function seedDatabase() {
    try {
        await mongoose.connect(uri, options);
        console.log('Connected to MongoDB');

        // Nettoyer la base de données
        await Promise.all([
            Student.deleteMany({}),
            Course.deleteMany({}),
            Grade.deleteMany({})
        ]);
        console.log('Database cleaned');

        // Créer des étudiants
        const students = await Student.insertMany([
            { firstName: 'Jean', lastName: 'Dupont' },
            { firstName: 'Marie', lastName: 'Martin' },
            { firstName: 'Pierre', lastName: 'Durand' }
        ]);
        console.log('Students created');

        // Créer des cours
        const courses = await Course.insertMany([
            { name: 'Mathématiques', code: 'MATH101' },
            { name: 'Informatique', code: 'INFO101' },
            { name: 'Physique', code: 'PHYS101' }
        ]);
        console.log('Courses created');

        // Créer des notes
        const grades = [];
        for (let student of students) {
            for (let course of courses) {
                grades.push({
                    student: student._id,
                    course: course._id,
                    grade: Math.floor(Math.random() * 10) + 10, // Note entre 10 et 20
                    date: new Date()
                });
            }
        }
        await Grade.insertMany(grades);
        console.log('Grades created');

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();

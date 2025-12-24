const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { Student, Course, Grade } = require('./model/schemas');

const mongoURI = 'mongodb://127.0.0.1:27017/student_management';

async function seedData() {
    try {
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');

        // Read JSON file
        const dataPath = path.join(__dirname, '../public/data.json');
        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const jsonData = JSON.parse(rawData);

        console.log(`📂 Found ${jsonData.length} records to process.`);

        // 1. Process Students
        const studentMap = new Map(); // Map<studentId, StudentDoc>

        console.log('👤 Processing Students...');
        for (const item of jsonData) {
            const s = item.student;
            if (!studentMap.has(s.id)) {
                // Create student if not exists in our map
                // Check if exists in DB first by some unique field? 
                // For simplicity, we will trust the JSON ID as unique for this batch.
                // We need to generate email and dob as they are required by schema
                let student = await Student.findOne({ firstName: s.firstname, lastName: s.lastname });

                if (!student) {
                    student = new Student({
                        firstName: s.firstname,
                        lastName: s.lastname,
                        email: `${s.firstname.toLowerCase()}.${s.lastname.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
                        dateNaissance: new Date('2000-01-01') // Default date
                    });
                    await student.save();
                }
                studentMap.set(s.id, student);
            }
        }
        console.log(`✅ Processed ${studentMap.size} unique students.`);

        // 2. Process Courses
        const courseMap = new Map(); // Map<courseString, CourseDoc>

        console.log('📚 Processing Courses...');
        for (const item of jsonData) {
            const courseName = item.course;
            if (!courseMap.has(courseName)) {
                let course = await Course.findOne({ name: courseName });
                if (!course) {
                    // "Math 101" -> Name: "Math 101", Code: "101" (Last part)
                    const parts = courseName.split(' ');
                    const code = parts.length > 1 ? parts[parts.length - 1] : 'GEN';

                    course = new Course({
                        name: courseName,
                        code: code
                    });
                    await course.save();
                }
                courseMap.set(courseName, course);
            }
        }
        console.log(`✅ Processed ${courseMap.size} unique courses.`);

        // 3. Process Grades
        console.log('📝 Processing Grades...');
        let gradeCount = 0;
        for (const item of jsonData) {
            const student = studentMap.get(item.student.id);
            const course = courseMap.get(item.course);

            if (student && course) {
                // Check if grade already exists to avoid duplicates
                const existingGrade = await Grade.findOne({
                    student: student._id,
                    course: course._id,
                    date: new Date(item.date),
                    grade: item.grade
                });

                if (!existingGrade) {
                    const grade = new Grade({
                        student: student._id,
                        course: course._id,
                        grade: item.grade / 5,
                        date: new Date(item.date),
                        appreciation: 'Imported'
                    });
                    await grade.save();
                    gradeCount++;
                }
            }
        }
        console.log(`✅ Inserted ${gradeCount} new grades.`);

        console.log('🎉 Import completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during seeding:', err);
        if (err.errors) {
            Object.keys(err.errors).forEach(key => {
                console.error(`Field: ${key}, Message: ${err.errors[key].message}, Value: ${err.errors[key].value}`);
            });
        }
        process.exit(1);
    }
}

seedData();

const { Grade } = require('../model/schemas');

function getAll(req, res) {
    Grade.find()
        .populate('student')
        .populate('course')
        .then((grades) => {
            res.send(grades);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
}

function get(req, res) {
    Grade.findById(req.params.id)
        .populate('student')
        .populate('course')
        .then((grade) => {
            if (!grade) return res.status(404).send('Grade not found');
            res.send(grade);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
}

function create(req, res) {
    let grade = new Grade();

    grade.student = req.body.student;
    grade.course = req.body.course;
    grade.grade = req.body.grade;
    grade.date = req.body.date;
    grade.appreciation = req.body.appreciation; // Included new field if schema allows

    grade.save()
        .then((savedGrade) => {
            res.status(201).json({ message: 'Grade created', grade: savedGrade });
        })
        .catch((err) => {
            console.log(err);
            res.status(400).send({ message: 'Error creating grade', error: err.message });
        });
}

function update(req, res) {
    Grade.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .then((grade) => {
            if (!grade) return res.status(404).send('Grade not found');
            res.send(grade);
        })
        .catch((err) => {
            res.status(500).send({ message: 'Error updating grade', error: err.message });
        });
}

function remove(req, res) {
    Grade.findByIdAndDelete(req.params.id)
        .then((grade) => {
            if (!grade) return res.status(404).send('Grade not found');
            res.send({ message: 'Grade deleted' });
        })
        .catch((err) => {
            res.status(500).send({ message: 'Error deleting grade', error: err.message });
        });
}

module.exports = { getAll, get, create, update, remove };

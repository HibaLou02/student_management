const { Course } = require('../model/schemas');

function getAll(req, res) {
    Course.find()
        .then((classes) => {
            res.send(classes);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
}

function get(req, res) {
    Course.findById(req.params.id)
        .then((course) => {
            if (!course) return res.status(404).send('Course not found');
            res.send(course);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
}

function create(req, res) {
    let course = new Course();
    course.name = req.body.name;
    course.code = req.body.code;

    course.save()
        .then((savedCourse) => {
            res.status(201).json({ message: 'Course created', course: savedCourse });
        })
        .catch((err) => {
            res.status(400).send({ message: 'Error creating course', error: err.message });
        });
}

function update(req, res) {
    Course.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .then((course) => {
            if (!course) return res.status(404).send('Course not found');
            res.send(course);
        })
        .catch((err) => {
            res.status(500).send({ message: 'Error updating course', error: err.message });
        });
}

function remove(req, res) {
    Course.findByIdAndDelete(req.params.id)
        .then((course) => {
            if (!course) return res.status(404).send('Course not found');
            res.send({ message: 'Course deleted' });
        })
        .catch((err) => {
            res.status(500).send({ message: 'Error deleting course', error: err.message });
        });
}

module.exports = { getAll, get, create, update, remove };

// models/schemas.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Student Schema
 */
const StudentSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  dateNaissance: { type: Date, required: true }
});

/**
 * Course Schema
 */
const CourseSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String },
});

/**
 * Grade Schema
 */
const GradeSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  grade: { type: Number, required: true, min: 0, max: 20 },
  date: { type: Date, default: Date.now },
});

/**
 * Prevent OverwriteModelError
 */
const Student =
  mongoose.models.Student || mongoose.model('Student', StudentSchema);

const Course =
  mongoose.models.Course || mongoose.model('Course', CourseSchema);

const Grade =
  mongoose.models.Grade || mongoose.model('Grade', GradeSchema);

/**
 * Export models
 */
module.exports = { Student, Course, Grade };

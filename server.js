// PART 1 - SERVER AND ROUTES
// PART 3 - REST ENDPOINTS (CRUD + join)
// PART 4 - VALIDATION AND SEARCH
// PART 5 - TWIST RULE (return flow)
const express = require('express');
const { q } = require('./db');

const app = express();
app.use(express.json());

// ---------- PART 4: validation helpers ----------
const isText = (v, max = 60) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;
const isId = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

function validateCarrel(body) {
  if (!body || !isText(body.name)) return 'name is required (1-60 characters)';
  if (!isText(body.zone, 30)) return 'zone is required (1-30 characters, e.g. Quiet or Group)';
  return null;
}

function validateStudent(body) {
  if (!body || !isText(body.name)) return 'name is required (1-60 characters)';
  if (!isText(body.email, 100) || !/^\S+@\S+\.\S+$/.test(body.email.trim()))
    return 'a valid email is required';
  return null;
}

app.get('/', (req, res) => res.json({ message: 'StudySpot Cafe API is running' }));

// ================= STUDENTS =================
app.get('/students', (req, res) => res.json(q.allStudents.all()));

app.get('/students/:id', (req, res) => {
  const student = q.oneStudent.get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
});

app.post('/students', (req, res) => {
  const err = validateStudent(req.body);
  if (err) return res.status(400).json({ error: err });
  if (q.studentByEmail.get(req.body.email.trim()))
    return res.status(409).json({ error: 'A student with this email already exists' });
  const info = q.addStudent.run(req.body.name.trim(), req.body.email.trim());
  res.status(201).json(q.oneStudent.get(info.lastInsertRowid));
});

app.put('/students/:id', (req, res) => {
  if (!q.oneStudent.get(req.params.id)) return res.status(404).json({ error: 'Student not found' });
  const err = validateStudent(req.body);
  if (err) return res.status(400).json({ error: err });
  const other = q.studentByEmail.get(req.body.email.trim());
  if (other && other.id !== Number(req.params.id))
    return res.status(409).json({ error: 'A student with this email already exists' });
  q.updateStudent.run(req.body.name.trim(), req.body.email.trim(), req.params.id);
  res.json(q.oneStudent.get(req.params.id));
});

app.delete('/students/:id', (req, res) => {
  if (!q.oneStudent.get(req.params.id)) return res.status(404).json({ error: 'Student not found' });
  if (q.studentHasBookings.get(req.params.id))
    return res.status(409).json({ error: 'Student has bookings and cannot be deleted' });
  q.deleteStudent.run(req.params.id);
  res.json({ message: 'Student deleted' });
});

// PART 5 (twist): history of a student's RETURNED bookings
app.get('/students/:id/history', (req, res) => {
  if (!q.oneStudent.get(req.params.id)) return res.status(404).json({ error: 'Student not found' });
  res.json(q.historyForStudent.all(req.params.id));
});

// ================= CARRELS =================
// Search by query parameter:
//   GET /carrels?zone=Quiet     carrels in a zone
//   GET /carrels?name=A1        carrels whose name contains the text
//   GET /carrels?available=true carrels that are free right now
app.get('/carrels', (req, res) => {
  const { zone, name, available } = req.query;
  let rows;
  if (zone) rows = q.carrelsByZone.all(zone);
  else if (name) rows = q.carrelsByName.all(`%${name}%`);
  else if (available === 'true') rows = q.freeCarrels.all();
  else rows = q.allCarrels.all();
  res.json(rows);
});

app.get('/carrels/:id', (req, res) => {
  const carrel = q.oneCarrel.get(req.params.id);
  if (!carrel) return res.status(404).json({ error: 'Carrel not found' });
  res.json(carrel);
});

app.post('/carrels', (req, res) => {
  const err = validateCarrel(req.body);
  if (err) return res.status(400).json({ error: err });
  const info = q.addCarrel.run(req.body.name.trim(), req.body.zone.trim());
  res.status(201).json(q.oneCarrel.get(info.lastInsertRowid));
});

app.put('/carrels/:id', (req, res) => {
  if (!q.oneCarrel.get(req.params.id)) return res.status(404).json({ error: 'Carrel not found' });
  const err = validateCarrel(req.body);
  if (err) return res.status(400).json({ error: err });
  q.updateCarrel.run(req.body.name.trim(), req.body.zone.trim(), req.params.id);
  res.json(q.oneCarrel.get(req.params.id));
});

app.delete('/carrels/:id', (req, res) => {
  if (!q.oneCarrel.get(req.params.id)) return res.status(404).json({ error: 'Carrel not found' });
  if (q.carrelHasBookings.get(req.params.id))
    return res.status(409).json({ error: 'Carrel has bookings and cannot be deleted' });
  q.deleteCarrel.run(req.params.id);
  res.json({ message: 'Carrel deleted' });
});

// ================= BOOKINGS =================
// JOIN endpoint: bookings with the student name and the carrel name
app.get('/bookings', (req, res) => res.json(q.allBookingsJoined.all()));

app.get('/bookings/:id', (req, res) => {
  const booking = q.oneBookingJoined.get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json(booking);
});

app.post('/bookings', (req, res) => {
  const { student_id, carrel_id } = req.body || {};
  if (!isId(student_id)) return res.status(400).json({ error: 'student_id is required (positive number)' });
  if (!isId(carrel_id)) return res.status(400).json({ error: 'carrel_id is required (positive number)' });
  if (!q.oneStudent.get(student_id)) return res.status(404).json({ error: 'Student not found' });
  if (!q.oneCarrel.get(carrel_id)) return res.status(404).json({ error: 'Carrel not found' });
  if (q.activeBookingForCarrel.get(carrel_id))
    return res.status(409).json({ error: 'Carrel is already booked' });
  const info = q.addBooking.run(student_id, carrel_id);
  res.status(201).json(q.oneBookingJoined.get(info.lastInsertRowid));
});

app.delete('/bookings/:id', (req, res) => {
  if (!q.oneBookingRaw.get(req.params.id)) return res.status(404).json({ error: 'Booking not found' });
  q.deleteBooking.run(req.params.id);
  res.json({ message: 'Booking deleted' });
});

// PART 5 - TWIST: return flow
// POST /bookings/:id/return sets a return date. Returning twice gives 409 "Already returned".
app.post('/bookings/:id/return', (req, res) => {
  const booking = q.oneBookingRaw.get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.return_date) return res.status(409).json({ error: 'Already returned' });
  q.returnBooking.run(req.params.id);
  res.status(200).json(q.oneBookingJoined.get(req.params.id));
});

// Bad JSON body -> 400 instead of a crash page
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`StudySpot Cafe API running on http://localhost:${PORT}`));
}

module.exports = app;

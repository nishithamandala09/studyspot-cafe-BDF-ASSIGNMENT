// PART 2 - DATABASE: 3 related tables (students, carrels, bookings) and the queries
const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(process.env.DB_FILE || 'studyspot.db');
db.exec('PRAGMA foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS carrels (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    zone TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id   INTEGER NOT NULL REFERENCES students(id),
    carrel_id    INTEGER NOT NULL REFERENCES carrels(id),
    booking_date TEXT NOT NULL DEFAULT (datetime('now')),
    return_date  TEXT
  );
`);

// Sample data so the 3 twist tests work straight away (student 1, booking 1)
if (db.prepare('SELECT COUNT(*) AS n FROM students').get().n === 0) {
  const addStudent = db.prepare('INSERT INTO students (name, email) VALUES (?, ?)');
  addStudent.run('Asha Rao', 'asha@example.com');
  addStudent.run('Ravi Kumar', 'ravi@example.com');

  const addCarrel = db.prepare('INSERT INTO carrels (name, zone) VALUES (?, ?)');
  addCarrel.run('Carrel A1', 'Quiet');
  addCarrel.run('Carrel A2', 'Quiet');
  addCarrel.run('Carrel B1', 'Group');

  db.prepare('INSERT INTO bookings (student_id, carrel_id) VALUES (1, 1)').run();
}

// ---- Queries ----
const q = {
  // students
  allStudents: db.prepare('SELECT * FROM students'),
  oneStudent: db.prepare('SELECT * FROM students WHERE id = ?'),
  studentByEmail: db.prepare('SELECT * FROM students WHERE email = ?'),
  addStudent: db.prepare('INSERT INTO students (name, email) VALUES (?, ?)'),
  updateStudent: db.prepare('UPDATE students SET name = ?, email = ? WHERE id = ?'),
  deleteStudent: db.prepare('DELETE FROM students WHERE id = ?'),

  // carrels
  allCarrels: db.prepare('SELECT * FROM carrels'),
  carrelsByZone: db.prepare('SELECT * FROM carrels WHERE zone = ? COLLATE NOCASE'),
  carrelsByName: db.prepare("SELECT * FROM carrels WHERE name LIKE ?"),
  freeCarrels: db.prepare(`
    SELECT * FROM carrels c
    WHERE NOT EXISTS (
      SELECT 1 FROM bookings b WHERE b.carrel_id = c.id AND b.return_date IS NULL
    )`),
  oneCarrel: db.prepare('SELECT * FROM carrels WHERE id = ?'),
  addCarrel: db.prepare('INSERT INTO carrels (name, zone) VALUES (?, ?)'),
  updateCarrel: db.prepare('UPDATE carrels SET name = ?, zone = ? WHERE id = ?'),
  deleteCarrel: db.prepare('DELETE FROM carrels WHERE id = ?'),
  carrelHasBookings: db.prepare('SELECT 1 FROM bookings WHERE carrel_id = ? LIMIT 1'),
  studentHasBookings: db.prepare('SELECT 1 FROM bookings WHERE student_id = ? LIMIT 1'),

  // bookings (JOIN: student name + carrel name)
  joinSelect: `
    SELECT b.id, b.student_id, s.name AS student_name,
           b.carrel_id, c.name AS carrel_name, c.zone,
           b.booking_date, b.return_date
    FROM bookings b
    JOIN students s ON s.id = b.student_id
    JOIN carrels  c ON c.id = b.carrel_id`,
  oneBookingRaw: db.prepare('SELECT * FROM bookings WHERE id = ?'),
  activeBookingForCarrel: db.prepare(
    'SELECT 1 FROM bookings WHERE carrel_id = ? AND return_date IS NULL'
  ),
  addBooking: db.prepare('INSERT INTO bookings (student_id, carrel_id) VALUES (?, ?)'),
  deleteBooking: db.prepare('DELETE FROM bookings WHERE id = ?'),

  // twist: return flow
  returnBooking: db.prepare("UPDATE bookings SET return_date = datetime('now') WHERE id = ?"),
};

q.allBookingsJoined = db.prepare(q.joinSelect + ' ORDER BY b.id');
q.oneBookingJoined = db.prepare(q.joinSelect + ' WHERE b.id = ?');
q.historyForStudent = db.prepare(
  q.joinSelect + ' WHERE b.student_id = ? AND b.return_date IS NOT NULL ORDER BY b.return_date DESC'
);

module.exports = { db, q };

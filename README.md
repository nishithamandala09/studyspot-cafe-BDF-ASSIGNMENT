# StudySpot Cafe - Study Carrel Booking API

Theme 4 of 30: Study carrels. Students can see which carrels are free, book one,
and return it. Built with **Express** and **SQLite**.

## Group members and parts

| # | Part | Member |
|---|------|--------|
| 1 | Server and routes (`server.js`) | Member 1 |
| 2 | Database (`db.js`) | Member 2 |
| 3 | REST endpoints (CRUD + join) | Member 3 |
| 4 | Validation and search | Member 4 |
| 5 | Twist rule (return flow) | Member 5 |
| 6 | Postman and README | Member 6 |

## How to run

You need Node.js 22.5 or newer.

```bash
npm install
npm start
```

The server runs at `http://localhost:3000`. The SQLite file `studyspot.db` is created on
the first run, with 2 students, 3 carrels and 1 booking as sample data.

## Database (3 related tables)

- `students (id, name, email)`
- `carrels (id, name, zone)`
- `bookings (id, student_id -> students, carrel_id -> carrels, booking_date, return_date)`

A booking with `return_date = NULL` is still active.

## Endpoints

### Carrels
| Method | URL | Success | Errors |
|--------|-----|---------|--------|
| GET | `/carrels` | 200 | |
| GET | `/carrels?zone=Quiet` | 200 | search by zone |
| GET | `/carrels?name=A1` | 200 | search by name |
| GET | `/carrels?available=true` | 200 | carrels that are free now |
| GET | `/carrels/:id` | 200 | 404 |
| POST | `/carrels` `{name, zone}` | 201 | 400 |
| PUT | `/carrels/:id` `{name, zone}` | 200 | 400, 404 |
| DELETE | `/carrels/:id` | 200 | 404, 409 if it has bookings |

### Students
| Method | URL | Success | Errors |
|--------|-----|---------|--------|
| GET | `/students` | 200 | |
| GET | `/students/:id` | 200 | 404 |
| POST | `/students` `{name, email}` | 201 | 400, 409 duplicate email |
| PUT | `/students/:id` | 200 | 400, 404, 409 |
| DELETE | `/students/:id` | 200 | 404, 409 if it has bookings |
| GET | `/students/:id/history` | 200 | 404 |

### Bookings
| Method | URL | Success | Errors |
|--------|-----|---------|--------|
| GET | `/bookings` | 200 | **join**: student name and carrel name |
| GET | `/bookings/:id` | 200 | 404 |
| POST | `/bookings` `{student_id, carrel_id}` | 201 | 400, 404, 409 carrel already booked |
| DELETE | `/bookings/:id` | 200 | 404 |
| POST | `/bookings/:id/return` | 200 | 404, **409 "Already returned"** |

## Twist: Return flow

- `POST /bookings/:id/return` sets the return date.
- Returning the same booking twice gives **409** with `{"error": "Already returned"}`.
- `GET /students/:id/history` lists that student's returned bookings.

The 3 tests:

1. Return a booking: `POST /bookings/1/return` -> **200**
2. Return it again: `POST /bookings/1/return` -> **409**
3. `GET /students/1/history` -> **200**, booking 1 is listed

Run them in Postman (import `StudySpot.postman_collection.json`, then run the
**TWIST TESTS** folder in order), or with the server running:

```bash
npm test
```

Note: the twist tests need a fresh database. To reset, stop the server and delete `studyspot.db`.

## Test screenshots (final version)

![Test 1 - return a booking, 200](screenshots/test1-return-200.png)

![Test 2 - return again, 409](screenshots/test2-return-again-409.png)

![Test 3 - student history, 200](screenshots/test3-history-200.png)

## Work done by each part (Postman proof)

Postman screenshots taken on 14-11-2026 while testing the project, grouped by part.
Wording of some responses differs slightly from the final version above.

### Part 1 - Server and routes (Member 1)

Express server running on `http://localhost:3000` with routes for students, carrels and
bookings. Every request in the screenshots below is answered by this server.

### Part 2 - Database (Member 2)

SQLite database with 3 related tables (students, carrels, bookings). The bookings join
screenshot in Part 3 shows rows linked across the tables.

### Part 3 - REST endpoints, CRUD and join (Member 3)

**Add a student - 201 Created**

![POST /students 201](proofs/part3-01-post-student-201.jpg)

**Add a carrel - 201 Created**

![POST /carrels 201](proofs/part3-02-post-carrel-201.jpg)

**Get all students - 200 OK**

![GET /students 200](proofs/part3-03-get-students-200.jpg)

**Get all carrels - 200 OK**

![GET /carrels 200](proofs/part3-04-get-carrels-200.jpg)

**Add a booking - 201 Created**

![POST /bookings 201](proofs/part3-05-post-booking-201.jpg)

**Add a second carrel - 201 Created**

![POST /carrels 201 second](proofs/part3-06-post-carrel-201-second.jpg)

**Students list - 200 OK**

![GET /students list 200](proofs/part3-07-get-students-list-200.jpg)

**Carrels list - 200 OK**

![GET /carrels list 200](proofs/part3-08-get-carrels-list-200.jpg)

**Join endpoint: bookings with student name and carrel name - 200 OK**

![GET /bookings join 200](proofs/part3-09-get-bookings-join-200.jpg)

**Update a carrel - 200 OK**

![PUT /carrels/2 200](proofs/part3-10-put-carrel-200.jpg)

**Delete a carrel that has bookings - 409 Conflict**

![DELETE /carrels/7 409](proofs/part3-11-delete-carrel-409.jpg)

### Part 4 - Validation and search (Member 4)

**Validation: empty body gives 400 with a clear message**

![POST /carrels 400](proofs/part4-01-validation-400.jpg)

**Search by query parameter: `/carrels?zone=A`**

![GET /carrels?zone=A 200](proofs/part4-02-search-zone-200.jpg)

### Part 5 - Twist rule, return flow (Member 5)

**Test 1: return a booking - 200 OK**

![Return 200](proofs/part5-01-return-200.jpg)

**Test 2: return it again - 409 Already returned**

![Return again 409](proofs/part5-02-return-again-409.jpg)

**Test 3: student history - 200 OK, booking is listed**

![History 200](proofs/part5-03-history-200.jpg)

**Second run: return - 200 OK**

![Return 200 second run](proofs/part5-04-return-200-second-run.jpg)

**Second run: return again - 409 Already returned**

![Return again 409 second run](proofs/part5-05-return-again-409-second-run.jpg)

**Second run: student history - 200 OK**

![History 200 second run](proofs/part5-06-history-200-second-run.jpg)

### Part 6 - Postman and README (Member 6)

All the screenshots above were taken in Postman. The Postman collection
`StudySpot.postman_collection.json`, this README and the final test screenshots are in
this repository.

## Validation

- Carrel: `name` and `zone` are required text (not empty, within the length limit) -> 400 with a clear message.
- Student: `name` and a valid `email` are required.
- Booking: `student_id` and `carrel_id` must be positive numbers and must exist, and a carrel cannot be booked twice at once.

## Push to GitHub

```bash
git init
git add .
git commit -m "StudySpot Cafe API"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

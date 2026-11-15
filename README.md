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

## Test screenshots

![Test 1 - return a booking, 200](screenshots/test1-return-200.png)

![Test 2 - return again, 409](screenshots/test2-return-again-409.png)

![Test 3 - student history, 200](screenshots/test3-history-200.png)

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
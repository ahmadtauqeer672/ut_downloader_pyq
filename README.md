# PYQ Website (Node.js + Angular)

This project has:
- `backend` (Node.js + Express + SQLite + Multer)
- `frontend` (Angular standalone app)

## 1. Run Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Backend runs on `http://localhost:3000`.

## 2. Run Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:4200`.

## Frontend Pages
- `http://localhost:4200/` -> Student page (university/course menu + search + download)
- `http://localhost:4200/upload` -> Developer upload page

## Data Model
Each paper now includes:
- title
- university
- course
- department (for BTECH)
- semester 1-8 (for BTECH)
- subject
- year
- examType
- file

## Features
- Developer uploads PYQ with admin key
- Student browses by university and course
- For BTECH: student can filter by department and semester
- Download papers from list

## Important
- Change `ADMIN_UPLOAD_KEY` in `backend/.env` before production.

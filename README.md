# PYQ Website

Previous year question paper platform with:
- `frontend`: Angular standalone app for students and admins
- `backend`: Node.js + Express API
- `database`: PostgreSQL
- `file storage`: Cloudinary or Google Drive links

## Features

- Browse academic papers by university and course
- Filter BTECH papers by department and semester
- Browse competitive exam papers year-wise
- Admin upload for academic and competitive papers
- Admin edit and delete support after login
- Download papers from Cloudinary, Google Drive, or local fallback storage
- Shared academic dropdown options between developer and student UI
- Admin-only in-browser watermark tool for PDFs

## Tech Stack

- Frontend: Angular 18
- Backend: Express
- Database: PostgreSQL
- Upload handling: Multer
- File hosting: Cloudinary

## Project Structure

```text
backend/   Express API, database setup, upload logic
frontend/  Angular app
README.md
```

## Local Setup

### 1. Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Backend runs on `http://localhost:3000`.

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:4200`.

## Backend Environment

Create `backend/.env` from `backend/.env.example`.

Required values:

```env
PORT=3000
ADMIN_USER_ID=your_admin_id
ADMIN_PASSWORD=your_admin_password
ADMIN_SESSION_SECRET=strong_random_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=pyq-papers

POSTGRES_URL=postgres://user:password@host:5432/dbname
POSTGRES_SSL=true
```

## Frontend Pages

- `/` student paper browsing page
- `/admin` admin login page
- `/upload` admin upload and manage page
- `/watermark-tool` admin-only PDF watermark tool

## Main Workflows

### Academic Papers

- Students filter by university, course, department, and semester
- Papers are grouped semester-wise
- Admin can upload, edit, and delete papers after login

Academic paper fields:
- `title`
- `university`
- `course`
- `department`
- `semester`
- `subject`
- `year`
- `examType`
- `driveUrl` or uploaded file

### Competitive Papers

- Students select an exam and browse papers year-wise
- Admin can upload, edit, and delete competitive papers after login

Competitive paper fields:
- `examName`
- `title`
- `year`
- `driveUrl` or uploaded file

## API Overview

Academic:
- `GET /api/papers`
- `POST /api/papers`
- `PUT /api/papers/:id`
- `DELETE /api/papers/:id`
- `GET /api/papers/:id/preview`
- `GET /api/papers/:id/download`

Competitive:
- `GET /api/competitive-exams`
- `GET /api/competitive-papers`
- `POST /api/competitive-papers`
- `PUT /api/competitive-papers/:id`
- `DELETE /api/competitive-papers/:id`
- `GET /api/competitive-papers/:id/preview`
- `GET /api/competitive-papers/:id/download`

Health:
- `GET /api/health`

Admin:
- `POST /api/admin/login`

## Notes

- Only PDF uploads are accepted by the backend uploader.
- Google Drive file links are also supported.
- Set `ADMIN_USER_ID`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` before production use.
- The backend creates required PostgreSQL tables automatically on startup.

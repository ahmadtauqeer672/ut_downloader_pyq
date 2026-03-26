# PYQ Website

Previous year question paper platform with a Next.js frontend and an Express backend. Students can browse academic and competitive papers, while admins can log in to upload, edit, delete, and watermark files.

## Features

- Browse academic papers by university and course
- Filter BTECH papers by department and semester
- Browse competitive exam papers year-wise
- Admin login with upload, edit, and delete flows
- PDF download and preview support
- Cloudinary and Google Drive link support
- Admin-only in-browser PDF watermark tool

## Tech Stack

- Frontend: Next.js 15, React 18, TypeScript
- Backend: Node.js, Express
- Database: PostgreSQL
- File handling: Multer, Cloudinary
- PDF tools: `pdf-lib`

## Project Structure

```text
backend/        Express API, database setup, upload handling
next-frontend/  Next.js app for the public site and admin flows
README.md
```

## Main Routes

Frontend pages:

- `/` home page
- `/about` about page
- `/disclaimer` disclaimer page
- `/admin` admin login
- `/upload` admin upload and management
- `/watermark-tool` admin PDF watermark tool
- `/question-papers/[university]`
- `/question-papers/[university]/[course]`
- `/competitive-exams/[exam]`

Frontend also includes route handlers under `next-frontend/app/api/*` that proxy requests to the backend API.

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

Create `next-frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

Then start the Next.js app on port `4200` so it matches the backend CORS allowlist:

```bash
cd next-frontend
npm install
npm run dev -- --port 4200
```

Frontend runs on `http://localhost:4200`.

## Environment Variables

### Backend

Create `backend/.env` from `backend/.env.example`.

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

### Frontend

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

If this variable is not set, the frontend falls back to the production API URL.

## API Overview

Academic papers:

- `GET /api/papers`
- `POST /api/papers`
- `PUT /api/papers/:id`
- `DELETE /api/papers/:id`
- `GET /api/papers/:id/preview`
- `GET /api/papers/:id/download`

Competitive papers:

- `GET /api/competitive-exams`
- `GET /api/competitive-papers`
- `POST /api/competitive-papers`
- `PUT /api/competitive-papers/:id`
- `DELETE /api/competitive-papers/:id`
- `GET /api/competitive-papers/:id/preview`
- `GET /api/competitive-papers/:id/download`

Admin:

- `POST /api/admin/login`

Health:

- `GET /api/health`

## Notes

- Only PDF uploads are accepted by the backend uploader.
- PostgreSQL tables are created automatically on backend startup.
- Google Drive file links are supported alongside uploaded files.
- Cloudinary is required for the current upload flow.
- The backend currently allows local frontend requests from `http://localhost:4200`.

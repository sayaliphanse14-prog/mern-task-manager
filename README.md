# Experiment 20 – Deploy MERN Task Manager (Cloud)

**TaskFlow** – a Kanban-style task manager built with the MERN stack and ready for cloud deployment.

| Layer    | Tech                  | Cloud platform (free) |
|----------|-----------------------|-----------------------|
| Frontend | React (Vite)          | Vercel (or Netlify)   |
| Backend  | Node.js + Express     | Render                |
| Database | MongoDB + Mongoose    | MongoDB Atlas         |

Features
- Kanban board: To Do / In Progress / Done (drag & drop, or use the arrow buttons)
- Create, update, delete tasks
- Priority (Low / Medium / High), due dates, overdue highlighting
- Live dashboard: total, in progress, completed, overdue + progress bar
- Search and priority filter
- API status indicator in the footer
- Automatic light / dark theme

## Run locally
    cd backend  && npm install && cp .env.example .env && npm start
    cd frontend && npm install && cp .env.example .env && npm run dev
Open http://localhost:5173

## Environment variables
Backend (`backend/.env` locally, Render dashboard in the cloud)
- `MONGO_URI`  – MongoDB Atlas connection string
- `CLIENT_URL` – deployed frontend URL(s), comma separated (CORS)
- `PORT`       – set automatically by Render

Frontend (`frontend/.env` locally, Vercel dashboard in the cloud)
- `VITE_API_URL` – deployed backend URL

## Deploy
Follow **DEPLOYMENT.md** (Atlas -> Render -> Vercel -> connect -> test).

## API
| Method | Route                | Purpose                         |
|--------|----------------------|---------------------------------|
| GET    | /api/health          | Health check                    |
| GET    | /api/tasks           | List tasks                      |
| GET    | /api/tasks/stats     | Dashboard numbers               |
| POST   | /api/tasks           | Create a task                   |
| PUT    | /api/tasks/:id       | Update a task (edit / move)     |
| DELETE | /api/tasks/:id       | Delete a task                   |

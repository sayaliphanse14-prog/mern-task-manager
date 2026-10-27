# Deployment Guide – TaskFlow (Atlas + Render + Vercel)

Push the whole project to a GitHub repository first:
`git init` -> `git add .` -> `git commit -m "taskflow"` -> create a repo on GitHub -> `git remote add origin <url>` -> `git push -u origin main`

## Step 1 – Database (MongoDB Atlas)
1. Sign up at https://www.mongodb.com/atlas and create a free **M0** cluster.
2. **Database Access** -> Add New Database User (username + password; save them).
3. **Network Access** -> Add IP Address -> **Allow Access From Anywhere (0.0.0.0/0)**.
4. **Connect -> Drivers** -> copy the connection string:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority`
   Replace `<user>` / `<password>` (if the password has special characters, URL-encode them). Keep `/taskflow` as the database name.

## Step 2 – Backend (Render)
1. https://render.com -> New + -> **Web Service** -> connect the GitHub repo.
2. Settings:
   - Root Directory: `backend`
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free
3. Environment variables (Environment tab):
   - `MONGO_URI` = Atlas string from Step 1
   - `CLIENT_URL` = `http://localhost:5173` (temporary)
4. Click **Create Web Service** and wait for "Live".
5. Open `https://<your-service>.onrender.com/api/health`
   Expected: `{"status":"ok","database":"connected"}`

## Step 3 – Frontend (Vercel)
1. https://vercel.com -> Add New -> Project -> import the same repo.
2. Settings:
   - Root Directory: `frontend`
   - Framework Preset: Vite
3. Environment variable:
   - `VITE_API_URL` = your Render URL (no trailing slash)
4. Deploy and copy the Vercel URL (e.g. `https://taskflow-xyz.vercel.app`).

## Step 4 – Connect the two
Render -> your service -> Environment -> set `CLIENT_URL` to the Vercel URL (no trailing slash) -> Save. Render redeploys automatically.

## Step 5 – Test the live application (screenshots for your record)
1. Open the Vercel URL. Footer should show a green **API online** dot.
2. **Create:** click "+ New task", fill the form, save -> card appears in *To Do*.
3. **Update:** click *Edit*, change title/priority/due date -> saved. Drag a card to *In Progress* and *Done* -> dashboard numbers and progress bar update.
4. **Delete:** click *Delete* on a task and confirm -> it disappears.
5. Refresh the browser -> tasks persist (stored in Atlas).
6. Atlas -> Browse Collections -> `taskflow.tasks` shows the documents.
7. Optional: test the API in Postman with GET/POST/PUT/DELETE on `https://<your-service>.onrender.com/api/tasks`.

## Troubleshooting
| Problem | Fix |
|---------|-----|
| First load takes 30–60 s | Render free tier sleeps when idle; wait and retry |
| CORS error in console | `CLIENT_URL` on Render must exactly match the Vercel URL |
| Footer shows "API offline" | Wrong `VITE_API_URL`; fix it in Vercel and **redeploy** (Vite reads env at build time) |
| Backend logs "MongoDB connection failed" | Wrong password in `MONGO_URI`, or Atlas network access not 0.0.0.0/0 |
| Deploy fails with "Cannot find package.json" | Root Directory not set to `backend` / `frontend` |

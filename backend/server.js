require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const taskRoutes = require("./routes/tasks");

const app = express();

// Only the frontend URL(s) in CLIENT_URL may call this API
const allowed = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((u) => u.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS: " + origin));
    },
  })
);
app.use(express.json());

app.get("/", (req, res) => res.send("TaskFlow API is running"));
app.get("/api/health", (req, res) => {
  const ok = mongoose.connection.readyState === 1;
  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "degraded",
    database: ok ? "connected" : "disconnected",
  });
});
app.use("/api/tasks", taskRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/taskflow";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

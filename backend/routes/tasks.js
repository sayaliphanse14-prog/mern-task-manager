const express = require("express");
const Task = require("../models/Task");
const router = express.Router();

// GET /api/tasks/stats  (must be before "/:id")
router.get("/stats", async (req, res) => {
  try {
    const [total, doing, done, overdue] = await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ status: "doing" }),
      Task.countDocuments({ status: "done" }),
      Task.countDocuments({ status: { $ne: "done" }, dueDate: { $lt: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    ]);
    res.json({ total, todo: total - doing - done, doing, done, overdue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
router.post("/", async (req, res) => {
  try {
    const task = await Task.create(req.body);
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/tasks/:id
router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

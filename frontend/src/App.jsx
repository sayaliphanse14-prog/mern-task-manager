import { useEffect, useMemo, useState } from "react";
import { api, API_URL } from "./api";

const COLUMNS = [
  { key: "todo", title: "To Do", hint: "Things waiting to start" },
  { key: "doing", title: "In Progress", hint: "Currently being worked on" },
  { key: "done", title: "Done", hint: "Finished tasks" },
];
const ORDER = ["todo", "doing", "done"];
const blank = { title: "", description: "", status: "todo", priority: "medium", dueDate: "" };

const startOfToday = () => new Date(new Date().setHours(0, 0, 0, 0));
const isOverdue = (t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < startOfToday();
const fmtDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(null);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [editor, setEditor] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [toast, setToast] = useState("");

  const flash = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2400);
  };

  const load = async () => {
    try {
      setTasks(await api.list());
      setOnline(true);
    } catch {
      setOnline(false);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.status === "done").length;
    return {
      total: tasks.length,
      doing: tasks.filter((t) => t.status === "doing").length,
      done,
      overdue: tasks.filter(isOverdue).length,
      pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    };
  }, [tasks]);

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return tasks.filter(
      (t) =>
        (priority === "all" || t.priority === priority) &&
        (t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q))
    );
  }, [tasks, query, priority]);

  const move = async (task, status) => {
    if (task.status === status) return;
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status } : t))); // instant UI
    try {
      await api.update(task._id, { status });
    } catch (err) {
      flash("Error: " + err.message);
      load();
    }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const { _id, createdAt, updatedAt, __v, ...rest } = editor;
      const payload = { ...rest, dueDate: rest.dueDate || null };
      if (_id) await api.update(_id, payload);
      else await api.create(payload);
      setEditor(null);
      flash(_id ? "Task updated" : "Task created");
      load();
    } catch (err) {
      flash("Error: " + err.message);
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete "${t.title}"?`)) return;
    try {
      await api.remove(t._id);
      flash("Task deleted");
      load();
    } catch (err) {
      flash("Error: " + err.message);
    }
  };

  const openEdit = (t) =>
    setEditor({ ...t, dueDate: t.dueDate ? t.dueDate.slice(0, 10) : "" });

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="logo">✓</span>
          <div>
            <h1>TaskFlow</h1>
            <p>Plan it. Move it. Finish it.</p>
          </div>
        </div>
        <button className="btn primary" onClick={() => setEditor({ ...blank })}>+ New task</button>
      </header>

      <section className="stats">
        <div className="stat"><span>Total</span><b>{stats.total}</b></div>
        <div className="stat"><span>In progress</span><b>{stats.doing}</b></div>
        <div className="stat good"><span>Completed</span><b>{stats.done}</b></div>
        <div className="stat warn"><span>Overdue</span><b>{stats.overdue}</b></div>
        <div className="stat wide">
          <span>Overall progress</span>
          <div className="bar" role="progressbar" aria-valuenow={stats.pct} aria-valuemin="0" aria-valuemax="100">
            <i style={{ width: stats.pct + "%" }} />
          </div>
          <b>{stats.pct}%</b>
        </div>
      </section>

      <div className="filters">
        <input
          type="search"
          placeholder="Search tasks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search tasks"
        />
        <div className="chips" role="group" aria-label="Priority filter">
          {["all", "high", "medium", "low"].map((p) => (
            <button key={p} className={`chip ${priority === p ? "on" : ""}`} onClick={() => setPriority(p)}>
              {p === "all" ? "All" : p[0].toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="notice">Connecting to the server… free cloud servers can take a few seconds to wake up.</p>}
      {!loading && online === false && (
        <p className="notice error">
          Cannot reach the API at <code>{API_URL}</code>. Check <code>VITE_API_URL</code> and the backend.
        </p>
      )}

      <main className="board">
        {COLUMNS.map((col) => {
          const items = visible.filter((t) => t.status === col.key);
          return (
            <section
              key={col.key}
              className={`col ${col.key} ${dragOver === col.key ? "over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(col.key);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const task = tasks.find((t) => t._id === e.dataTransfer.getData("id"));
                if (task) move(task, col.key);
              }}
            >
              <header>
                <h2><i className="pip" />{col.title}</h2>
                <span className="badge">{items.length}</span>
              </header>
              {items.length === 0 && <p className="drop-hint">{col.hint}<br />Drop a task here</p>}
              {items.map((t) => {
                const idx = ORDER.indexOf(t.status);
                return (
                  <article
                    key={t._id}
                    className={`card p-${t.priority}`}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("id", t._id)}
                  >
                    <div className="card-top">
                      <span className={`pri ${t.priority}`}>{t.priority}</span>
                      {t.dueDate && (
                        <span className={`due ${isOverdue(t) ? "late" : ""}`}>
                          {isOverdue(t) ? "Overdue · " : "Due "}
                          {fmtDate(t.dueDate)}
                        </span>
                      )}
                    </div>
                    <h3 className={t.status === "done" ? "struck" : ""}>{t.title}</h3>
                    {t.description && <p>{t.description}</p>}
                    <footer>
                      <div className="move">
                        <button disabled={idx === 0} onClick={() => move(t, ORDER[idx - 1])} aria-label="Move left" title="Move back">←</button>
                        <button disabled={idx === 2} onClick={() => move(t, ORDER[idx + 1])} aria-label="Move right" title="Move forward">→</button>
                      </div>
                      <div className="acts">
                        <button className="link" onClick={() => openEdit(t)}>Edit</button>
                        <button className="link danger" onClick={() => remove(t)}>Delete</button>
                      </div>
                    </footer>
                  </article>
                );
              })}
            </section>
          );
        })}
      </main>

      <footer className="status">
        <span className={`dot ${online === null ? "" : online ? "ok" : "bad"}`} />
        {online === null ? "Checking API…" : online ? "API online" : "API offline"}
        <span>·</span>
        <code>{API_URL.replace(/^https?:\/\//, "")}</code>
      </footer>

      {editor && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setEditor(null)}>
          <form className="modal" onSubmit={save}>
            <h2>{editor._id ? "Edit task" : "New task"}</h2>
            <label>Title
              <input
                autoFocus
                required
                maxLength={120}
                value={editor.title}
                onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                placeholder="e.g. Finish lab report"
              />
            </label>
            <label>Description
              <textarea
                rows="3"
                value={editor.description}
                onChange={(e) => setEditor({ ...editor, description: e.target.value })}
                placeholder="Optional details"
              />
            </label>
            <div className="row">
              <label>Priority
                <select value={editor.priority} onChange={(e) => setEditor({ ...editor, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label>Status
                <select value={editor.status} onChange={(e) => setEditor({ ...editor, status: e.target.value })}>
                  <option value="todo">To Do</option>
                  <option value="doing">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </label>
              <label>Due date
                <input type="date" value={editor.dueDate} onChange={(e) => setEditor({ ...editor, dueDate: e.target.value })} />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setEditor(null)}>Cancel</button>
              <button type="submit" className="btn primary">Save task</button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

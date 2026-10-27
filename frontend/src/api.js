// The backend URL comes from the environment (set in Vercel / .env)
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function request(path, options = {}) {
  const res = await fetch(API_URL + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  list: () => request("/api/tasks"),
  create: (t) => request("/api/tasks", { method: "POST", body: JSON.stringify(t) }),
  update: (id, t) => request(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(t) }),
  remove: (id) => request(`/api/tasks/${id}`, { method: "DELETE" }),
};

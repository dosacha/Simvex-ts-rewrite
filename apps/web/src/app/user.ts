const KEY = "simvex_user_id";

export function getUserId(): string {
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;

  const created = crypto.randomUUID();
  localStorage.setItem(KEY, created);
  return created;
}

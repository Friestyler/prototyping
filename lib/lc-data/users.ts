export interface User {
  name: string;
  initials: string;
  color: string;
}

const userMap: Record<string, User> = {
  "User 1": { name: "User 1", initials: "U1", color: "#5B5BD6" },
  "User 2": { name: "User 2", initials: "U2", color: "#059669" },
  "User 3": { name: "User 3", initials: "U3", color: "#D97706" },
};

export function getOwnerMeta(name?: string): User | null {
  if (!name) return null;
  if (userMap[name]) return userMap[name];
  const initials = name
    .split(/\s+/)
    .map((s) => s[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return { name, initials, color: "#6B7280" };
}

export const users = Object.values(userMap);

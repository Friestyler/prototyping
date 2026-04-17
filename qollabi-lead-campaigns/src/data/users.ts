export interface User {
  name: string;
  initials: string;
  color: string;
}

const userMap: Record<string, User> = {
  "Kevin Kools": { name: "Kevin Kools", initials: "KK", color: "#5B5BD6" },
  "Raciel Rodriguez": { name: "Raciel Rodriguez", initials: "RR", color: "#059669" },
  "Lena Vermeersch": { name: "Lena Vermeersch", initials: "LV", color: "#D97706" },
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

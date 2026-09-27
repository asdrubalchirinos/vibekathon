import type { EventStatus, Visibility } from "./types";

export function eventStatus(startsAt: string, endsAt: string, now = new Date()): EventStatus {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (now < start) return "upcoming";
  if (now > end) return "finished";
  return "active";
}

export function statusLabel(status: EventStatus): string {
  if (status === "upcoming") return "Próximo";
  if (status === "active") return "En curso";
  return "Finalizado";
}

export function visibilityLabel(visibility: Visibility): string {
  return visibility === "private" ? "Privado" : "Público";
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-419", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatDateOnly(iso: string): string {
  return new Intl.DateTimeFormat("es-419", {
    dateStyle: "medium",
  }).format(new Date(iso));
}

// Valor para <input type="datetime-local">
export function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isLikelyGithubRepoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
      return false;
    }
    // github.com/usuario/repo
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.length >= 2;
  } catch {
    return false;
  }
}

export function displayName(profile: { github_username: string | null } | null): string {
  return profile?.github_username || "alguien";
}

export function newInviteToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

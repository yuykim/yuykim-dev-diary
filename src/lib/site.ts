import type { CollectionEntry } from "astro:content";

export type DevlogEntry = CollectionEntry<"devlog">;
export type ProjectEntry = CollectionEntry<"projects">;

export const siteTitle = "yuykim14 Dev Diary";
export const siteDescription = "Write code. Save logs. Continue tomorrow.";

export function sitePath(path: string) {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}${normalizedPath}`;
}

export function getDiaryUrl(entry: DevlogEntry) {
  return sitePath(`/diary/${entry.id}/`);
}

export function getProjectUrl(slug: string) {
  return sitePath(`/projects/${slug}/`);
}

export function getTagUrl(tag: string) {
  return sitePath(`/tags/${encodeURIComponent(tag)}/`);
}

export function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(date);
}

export function toDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

export function sortByDateDesc<T extends { data: { date: Date } }>(entries: T[]) {
  return [...entries].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function isPublicDevlog(entry: DevlogEntry) {
  return entry.data.visibility !== "private";
}

export function excerptFromBody(body = "", maxLength = 140) {
  const text = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

export function groupEntriesByDate(entries: DevlogEntry[]) {
  const groups = new Map<string, DevlogEntry[]>();

  for (const entry of entries) {
    const key = toDateKey(entry.data.date);
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }

  return [...groups.entries()].map(([date, items]) => ({ date, entries: items }));
}

export function collectImages(entries: DevlogEntry[]) {
  const images = new Map<string, { src: string; alt: string; title: string }>();

  for (const entry of entries) {
    if (entry.data.thumbnail) {
      images.set(entry.data.thumbnail, {
        src: entry.data.thumbnail,
        alt: entry.data.title,
        title: entry.data.title,
      });
    }

    const matches = entry.body?.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g) ?? [];
    for (const match of matches) {
      const alt = match[1] || entry.data.title;
      const src = match[2];
      if (src.startsWith("http") || src.startsWith("/")) {
        images.set(src, { src, alt, title: entry.data.title });
      }
    }
  }

  return [...images.values()];
}

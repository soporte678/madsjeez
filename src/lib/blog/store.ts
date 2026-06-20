import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

export type DynamicPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  coverImage?: string;
  readingTime: number;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_PATH = path.join(DATA_DIR, "blog.json");

export function getAllPosts(): DynamicPost[] {
  if (!existsSync(DATA_PATH)) return [];
  try {
    const raw = readFileSync(DATA_PATH, "utf-8");
    const posts = JSON.parse(raw) as DynamicPost[];
    return posts.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  } catch {
    return [];
  }
}

export function getPost(slug: string): DynamicPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function publishPost(data: {
  title: string;
  excerpt: string;
  content: string;
  author?: string;
  tags?: string[];
  coverImage?: string;
}): DynamicPost {
  const posts = getAllPosts();
  const now = new Date().toISOString();
  const post: DynamicPost = {
    slug: slugify(data.title),
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
    author: data.author ?? "Madsjeez",
    tags: data.tags ?? [],
    coverImage: data.coverImage,
    readingTime: calcReadingTime(data.content),
    publishedAt: now,
    updatedAt: now,
  };
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  posts.unshift(post);
  writeFileSync(DATA_PATH, JSON.stringify(posts, null, 2), "utf-8");
  return post;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);
}

export function calcReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

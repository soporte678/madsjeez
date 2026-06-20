import { NextRequest, NextResponse } from "next/server";
import { getAllPosts, publishPost } from "@/lib/blog/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = getAllPosts();
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-publish-secret");
  if (!secret || secret !== process.env.BLOG_PUBLISH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, content, excerpt, author, tags, coverImage } = body;

  if (!title || typeof title !== "string" || !content || typeof content !== "string") {
    return NextResponse.json({ error: "title and content are required" }, { status: 400 });
  }

  const post = publishPost({
    title,
    content,
    excerpt: typeof excerpt === "string" ? excerpt : title,
    author: typeof author === "string" ? author : undefined,
    tags: Array.isArray(tags) ? tags.filter((t): t is string => typeof t === "string") : [],
    coverImage: typeof coverImage === "string" ? coverImage : undefined,
  });

  return NextResponse.json(post, { status: 201 });
}

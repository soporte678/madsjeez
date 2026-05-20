import fs from "node:fs/promises";

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ApiDocMarkdown } from "@/components/docs/ApiDocMarkdown";
import {
  API_DOC_PAGE_TITLE,
  API_DOC_SLUGS,
  apiDocKeyToFsPath,
  slugSegmentsToKey,
} from "@/lib/api-docs";
import { canonicalMeta } from "@/lib/seo/canonical";

export const dynamic = "force-static";

type PageProps = { params: Promise<{ slug?: string[] }> };

export async function generateStaticParams() {
  return API_DOC_SLUGS.map((key) => ({
    slug: key === "README" ? [] : key.split("/"),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const key = slugSegmentsToKey(slug);
  if (!key) {
    return { title: "API | Madsjeez" };
  }
  const path = key === "README" ? "/docs/api" : `/docs/api/${key}`;
  return {
    title: `${API_DOC_PAGE_TITLE[key]} | Madsjeez Developers`,
    description:
      "Documentación de la API REST del marketplace: autenticación, productos, pedidos, Mercado Libre, webhooks y más.",
    ...canonicalMeta(path),
    openGraph: {
      title: `${API_DOC_PAGE_TITLE[key]} — API Madsjeez`,
      type: "article",
    },
  };
}

export default async function ApiDocsPage({ params }: PageProps) {
  const { slug } = await params;
  const key = slugSegmentsToKey(slug);
  if (!key) {
    notFound();
  }

  const fsPath = apiDocKeyToFsPath(key);
  let markdown: string;
  try {
    markdown = await fs.readFile(fsPath, "utf8");
  } catch {
    notFound();
  }

  return (
    <>
      <nav className="mb-6 text-sm text-slate-600" aria-label="Migas de pan">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/docs/api" className="font-medium text-blue-600 hover:underline">
              API
            </Link>
          </li>
          {key !== "README" && (
            <>
              <li className="text-slate-400" aria-hidden>
                /
              </li>
              <li className="truncate text-slate-800">{API_DOC_PAGE_TITLE[key]}</li>
            </>
          )}
        </ol>
      </nav>
      <ApiDocMarkdown markdown={markdown} />
    </>
  );
}

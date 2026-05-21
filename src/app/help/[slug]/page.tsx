import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HelpArticleView } from "@/components/help/HelpArticleView";
import { HELP_BY_SLUG, HELP_SLUGS } from "@/lib/help-articles";
import { canonicalMeta } from "@/lib/seo/canonical";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return HELP_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = HELP_BY_SLUG[slug];
  if (!article) {
    return { title: "Ayuda | MadsJeez" };
  }
  return {
    title: `${article.title} | Ayuda MadsJeez`,
    description: article.description,
    ...canonicalMeta(`/help/${slug}`),
  };
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = HELP_BY_SLUG[slug];
  if (!article) notFound();
  return <HelpArticleView article={article} />;
}

/** Evita que Next omita rutas no listadas en build estático. */
export const dynamicParams = false;

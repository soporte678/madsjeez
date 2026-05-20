import Link from "next/link";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HelpArticle } from "@/lib/help-articles";
import { HELP_BY_SLUG } from "@/lib/help-articles";

type Props = {
  article: HelpArticle;
};

export function HelpArticleView({ article }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={null} />
      <main className="flex-1 bg-[#EBEBEB]">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <nav className="mb-6 text-sm text-gray-600">
            <Link href="/help" className="text-[#3483FA] hover:underline inline-flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Centro de ayuda
            </Link>
            <span className="mx-2">/</span>
            <span>{article.category}</span>
          </nav>

          <Card>
            <CardContent className="p-8">
              <p className="text-xs font-bold uppercase tracking-wider text-[#3483FA] mb-2">
                {article.category}
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
              <p className="text-gray-600 mb-8 leading-relaxed">{article.description}</p>

              <div className="space-y-8">
                {article.sections.map((section) => (
                  <section key={section.heading}>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{section.heading}</h2>
                    <p className="text-gray-700 leading-relaxed">{section.body}</p>
                  </section>
                ))}
              </div>
            </CardContent>
          </Card>

          {article.relatedSlugs && article.relatedSlugs.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Artículos relacionados</h2>
              <ul className="space-y-2">
                {article.relatedSlugs.map((slug) => {
                  const related = HELP_BY_SLUG[slug];
                  if (!related) return null;
                  return (
                    <li key={slug}>
                      <Link
                        href={`/help/${slug}`}
                        className="text-[#3483FA] hover:underline inline-flex items-center gap-1"
                      >
                        {related.title}
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

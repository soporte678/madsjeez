"use client";

import Link from "next/link";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function fixInternalHref(href: string | undefined): string {
  if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) return href ?? "#";
  if (href.startsWith("/")) return href;
  if (href.endsWith(".md")) {
    const noMd = href.replace(/\.md$/i, "").replace(/^\.\//, "").replace(/^\.\.\//, "");
    return `/docs/api/${noMd}`;
  }
  return href;
}

const components: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="scroll-mt-24 border-b border-slate-200 pb-3 text-2xl font-bold tracking-tight text-slate-900" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mt-10 scroll-mt-24 text-xl font-semibold text-slate-900" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-6 scroll-mt-24 text-lg font-semibold text-slate-800" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mt-3 text-[15px] leading-relaxed text-slate-700" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] text-slate-700" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px] text-slate-700" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="mt-4 border-l-4 border-amber-400 bg-amber-50/80 px-4 py-3 text-[14px] text-slate-800"
      {...props}
    >
      {children}
    </blockquote>
  ),
  a: ({ href, children, ...props }) => {
    const to = fixInternalHref(typeof href === "string" ? href : undefined);
    const isExternal = to.startsWith("http");
    if (isExternal) {
      return (
        <a href={to} className="font-medium text-blue-600 underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    }
    return (
      <Link href={to} className="font-medium text-blue-600 underline-offset-2 hover:underline" {...props}>
        {children}
      </Link>
    );
  },
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className?.includes("language-"));
    if (isBlock) {
      return (
        <code className={`font-mono text-[13px] text-slate-100 ${className ?? ""}`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-slate-800" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre
      className="my-4 overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-4 text-[13px] text-slate-100"
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="my-5 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left text-[13px]" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => <thead className="bg-slate-50" {...props}>{children}</thead>,
  th: ({ children, ...props }) => (
    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border-t border-slate-100 px-3 py-2.5 text-slate-700" {...props}>
      {children}
    </td>
  ),
  tr: ({ children, ...props }) => <tr className="hover:bg-slate-50/80" {...props}>{children}</tr>,
  hr: () => <hr className="my-8 border-slate-200" />,
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-slate-900" {...props}>
      {children}
    </strong>
  ),
};

export function ApiDocMarkdown({ markdown }: { markdown: string }) {
  return (
    <article className="api-doc-markdown max-w-[860px] pb-16">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </article>
  );
}

/**
 * Serializes data for use in <script type="application/ld+json"> tags.
 * JSON.stringify does not escape < > & by default; the HTML parser closes
 * the script tag on </script> even inside JSON, enabling XSS via user-supplied
 * content (product titles, descriptions, store names, etc.).
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/'/g, "\\u0027");
}

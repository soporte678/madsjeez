import type { ReactNode } from "react";

/** Contenedor mínimo para toda la sección /docs (API y futuras guías). */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

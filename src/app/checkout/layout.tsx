import type { Metadata } from "next";
import { noindexPageMeta } from "@/lib/seo/robots-meta";

export const metadata: Metadata = noindexPageMeta("Checkout", {
  canonical: "/checkout",
});

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}

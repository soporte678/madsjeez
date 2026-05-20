import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";
import { canonicalMeta } from "@/lib/seo/canonical";

export const metadata: Metadata = {
  ...canonicalMeta("/"),
};

export default function HomePage() {
  return <HomePageClient />;
}

import type { Metadata } from "next";
import { SellerLanding } from "@/components/seller/SellerLanding";
import { sellerLandingMetadata } from "@/lib/seo/seller-landing-meta";

export const metadata: Metadata = sellerLandingMetadata("vender-sin-pagina-web");
export const revalidate = 86400;

export default function Page() {
  return <SellerLanding slug="vender-sin-pagina-web" />;
}

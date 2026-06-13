import type { Metadata } from "next";
import { SellerLanding } from "@/components/seller/SellerLanding";
import { sellerLandingMetadata } from "@/lib/seo/seller-landing-meta";

export const metadata: Metadata = sellerLandingMetadata("vender-en-madsjeez");
export const revalidate = 86400;

export default function Page() {
  return <SellerLanding slug="vender-en-madsjeez" />;
}

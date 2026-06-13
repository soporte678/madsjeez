import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicStoreByHandle, getStoreBranding } from "@/lib/public-store";
import { canonicalMeta } from "@/lib/seo/canonical";
import { SITE_URL } from "@/lib/seo/site";
import { StorefrontView } from "@/components/storefront/StorefrontView";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getPublicStoreByHandle(slug);
  if (!store) return { title: "Tienda no encontrada | MadsJeez" };
  const branding = await getStoreBranding(store.id);

  // Canonical siempre al slug interno real (consolida subdominio + path).
  const path = `/tienda/${store.storeSlug}`;
  const title = branding?.seoTitle || `${branding?.name || store.displayName} | Tienda online en Madsjeez`;
  const description =
    branding?.seoDescription ||
    store.description?.slice(0, 160) ||
    `Comprá en la tienda ${store.displayName} en Madsjeez. ${store.productCount} productos publicados.`;
  const ogImage = branding?.ogImageUrl || branding?.bannerUrl || branding?.logoUrl || store.image || undefined;

  return {
    ...canonicalMeta(path),
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

export default async function TiendaPublicaPage({ params }: Props) {
  const { slug } = await params;
  const store = await getPublicStoreByHandle(slug);
  if (!store) notFound();
  const branding = await getStoreBranding(store.id);

  const name = branding?.name || store.displayName;
  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name,
    url: `${SITE_URL}/tienda/${store.storeSlug}`,
    description: branding?.description || store.description || undefined,
    image: branding?.logoUrl || store.image || `${SITE_URL}/brand/madsjeez-logo.png`,
    ...(branding?.city || branding?.province
      ? { address: { "@type": "PostalAddress", addressLocality: branding?.city || undefined, addressRegion: branding?.province || undefined, addressCountry: "AR" } }
      : {}),
    parentOrganization: { "@type": "Organization", name: "MadsJeez Marketplace", url: SITE_URL },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }} />
      <StorefrontView store={store} branding={branding} />
    </>
  );
}

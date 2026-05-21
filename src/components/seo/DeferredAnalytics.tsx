"use client";

import Script from "next/script";

const GTM_ID = "GTM-PT9H3H6K";

/**
 * Solo GTM con lazyOnload — GA4 se configura dentro del contenedor GTM.
 * Cargar gtag/js directamente además de GTM duplica ~100 KiB de JS de analytics.
 * Se inicializa window.dataLayer/gtag stub para que trackEvent() funcione
 * antes de que el contenedor GTM cargue.
 */
export function DeferredAnalytics() {
  return (
    <>
      <Script id="gtag-stub" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=window.gtag||gtag;`}
      </Script>
      <Script id="google-tag-manager" strategy="lazyOnload">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
    </>
  );
}

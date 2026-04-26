import Script from 'next/script';

/**
 * Google Analytics 4 loader. Renders nothing when NEXT_PUBLIC_GA_ID is unset
 * (so local dev and previews stay clean) and uses next/script with
 * `strategy="afterInteractive"` to keep TBT/LCP unaffected.
 *
 * Usage: drop <GoogleAnalytics /> once in app/layout.tsx <body>.
 */
export default function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${id}', {
            anonymize_ip: true,
            send_page_view: true,
          });
        `}
      </Script>
    </>
  );
}

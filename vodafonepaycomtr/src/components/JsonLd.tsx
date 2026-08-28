const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

/**
 * schema.org structured data. The RFP never asked for this — §3.2 stops at
 * meta tags and OpenGraph — but the site's own content types map onto four
 * standard schemas almost exactly (an FAQ accordion, blog articles, campaign
 * offers, a breadcrumb trail), and without them none of that is eligible for
 * rich results.
 *
 * Rendered as a plain <script type="application/ld+json">, which is the format
 * Google documents; Next's Metadata API has no field for it.
 *
 * `dangerouslySetInnerHTML` is required — React escapes text children, which
 * would corrupt the JSON. The value is always JSON.stringify of an object we
 * built ourselves, never raw user input, and `<` is escaped so a string
 * containing `</script>` cannot close the tag early.
 */
function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Sitewide publisher identity — rendered once, in the root layout. */
export function OrganizationJsonLd() {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Vodafone Pay",
        url: SITE_URL,
        logo: `${SITE_URL}/images/vpay-logo.svg`,
      }}
    />
  );
}

/**
 * Marks up an FAQ accordion. Only emitted when there are questions — an empty
 * FAQPage is a structured-data error, not a neutral no-op.
 */
export function FaqJsonLd({ items }: { items: { question: string; answer: string }[] }) {
  if (items.length === 0) return null;
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((i) => ({
          "@type": "Question",
          name: i.question,
          acceptedAnswer: { "@type": "Answer", text: i.answer },
        })),
      }}
    />
  );
}

/** Blog post → Article. */
export function ArticleJsonLd({
  title,
  description,
  image,
  path,
  publishedDate,
}: {
  title: string;
  description?: string;
  image?: string;
  path: string;
  publishedDate?: string;
}) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        ...(description ? { description } : {}),
        ...(image ? { image: image.startsWith("http") ? image : `${SITE_URL}${image}` } : {}),
        ...(publishedDate ? { datePublished: publishedDate } : {}),
        mainEntityOfPage: `${SITE_URL}${path}`,
        publisher: { "@type": "Organization", name: "Vodafone Pay" },
      }}
    />
  );
}

/**
 * Breadcrumb trail. `trail` is ordered root-first and must NOT include the
 * current page — this appends it, so callers can't accidentally emit the
 * current page twice.
 */
export function BreadcrumbJsonLd({
  current,
  path,
  trail = [],
}: {
  current: string;
  path: string;
  trail?: { label: string; href: string }[];
}) {
  const items = [
    { label: "Ana Sayfa", href: "/" },
    ...trail,
    { label: current, href: path },
  ];
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.label,
          item: `${SITE_URL}${item.href}`,
        })),
      }}
    />
  );
}

import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  schema?: object | object[];
  noindex?: boolean;
  author?: string;
  datePublished?: string;
  dateModified?: string;
}

export function SEO({
  title,
  description,
  canonical,
  ogImage,
  ogType,
  schema,
  noindex,
  author,
  datePublished,
  dateModified,
}: SEOProps) {
  const fullTitle = title ? `${title} | AquaReport` : "AquaReport | Water Quality Report Software for Dealers";
  const defaultOgImage = "https://aquareport.org/og-image.png";
  const isArticle = ogType === "article";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow" />}
      {author && <meta name="author" content={author} />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType || "website"} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage || defaultOgImage} />
      <meta property="og:site_name" content="AquaReport" />

      {/* Article-specific OG tags */}
      {isArticle && datePublished && (
        <meta property="article:published_time" content={datePublished} />
      )}
      {isArticle && dateModified && (
        <meta property="article:modified_time" content={dateModified} />
      )}
      {isArticle && (
        <meta property="article:author" content="https://aquareport.org/about/jacob-lightsey" />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage || defaultOgImage} />

      {/* Schema.org Structured Data */}
      {schema &&
        (Array.isArray(schema)
          ? schema.map((s, i) => (
              <script key={i} type="application/ld+json">
                {JSON.stringify(s)}
              </script>
            ))
          : (
            <script type="application/ld+json">
              {JSON.stringify(schema)}
            </script>
          ))}
    </Helmet>
  );
}

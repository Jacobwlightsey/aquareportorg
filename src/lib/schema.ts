// Schema.org structured data helpers for SEO

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AquaReport",
  url: "https://aquareport.org",
  logo: "https://aquareport.org/favicon.png",
  description:
    "The sales operating system for water treatment dealers. 21-step Demo Wizard, AquaScore™ water grading, branded reports, and built-in rep coaching — designed to help dealers close more in-home consultations.",
  foundingDate: "2025",
  founder: {
    "@type": "Person",
    name: "Jacob Lightsey",
    url: "https://aquareport.org/about/jacob-lightsey",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    email: "support@aquareport.org",
    availableLanguage: "English",
  },
  areaServed: [
    { "@type": "Country", name: "United States" },
    { "@type": "Country", name: "Canada" },
  ],
  sameAs: [
    // Add platform URLs here as profiles are created:
    // "https://linkedin.com/company/aquareport",
    // "https://twitter.com/aquareport",
    // "https://crunchbase.com/organization/aquareport",
    // "https://www.producthunt.com/products/aquareport",
    // "https://www.g2.com/products/aquareport",
    // "https://www.capterra.com/p/aquareport",
    // "https://www.facebook.com/aquareport",
    // "https://www.youtube.com/@aquareport",
    "https://github.com/Jacobwlightsey/aquareportorg",
  ],
  knowsAbout: [
    "Water Quality Testing",
    "Water Treatment Sales",
    "Water Quality Reports",
    "AquaScore",
    "In-Home Water Testing",
    "Water Dealer Software",
  ],
};

export const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AquaReport",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://aquareport.org",
  description:
    "The sales operating system for water treatment dealers. 21-step Demo Wizard with AquaScore™ grading, built-in rep coaching, branded reports, and consumer delivery via myaquareport.com. Available in the US and Canada.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "0",
    highPrice: "599",
    offerCount: "4",
  },
  featureList: [
    "Professional water quality reports with AquaScore™",
    "Custom branding and white labeling",
    "Automated contaminant scoring algorithm",
    "Consumer report delivery portal (myaquareport.com)",
    "21-step interactive Demo Wizard for in-home sales",
    "Lead tracking and dealer analytics",
    "Real-time EPA & EWG contaminant data by ZIP code",
    "Interactive flipbook reports",
    "AI-powered sales summaries and talking points",
    "Team management for sales organizations",
  ],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AquaReport",
  alternateName: ["AquaReport.org", "Aqua Report"],
  url: "https://aquareport.org/",
  description:
    "The sales operating system for water treatment dealers. Demo Wizard, AquaScore™, branded reports, and rep coaching.",
  publisher: { "@type": "Organization", name: "AquaReport" },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://aquareport.org/blog?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export function articleSchema({
  title,
  description,
  url,
  datePublished,
  dateModified,
}: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    author: {
      "@type": "Person",
      name: "Jacob Lightsey",
      url: "https://aquareport.org/about/jacob-lightsey",
    },
    publisher: {
      "@type": "Organization",
      name: "AquaReport",
      logo: {
        "@type": "ImageObject",
        url: "https://aquareport.org/favicon.png",
      },
    },
    datePublished,
    dateModified,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function howToSchema({
  title,
  description,
  steps,
}: {
  title: string;
  description: string;
  steps: { name: string; text: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: title,
    description,
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function profilePageSchema({
  name,
  description,
  url,
  image,
  jobTitle,
  worksFor,
  sameAs = [],
}: {
  name: string;
  description: string;
  url: string;
  image?: string;
  jobTitle: string;
  worksFor: string;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name,
      description,
      url,
      image,
      jobTitle,
      worksFor: {
        "@type": "Organization",
        name: worksFor,
        url: "https://aquareport.org",
      },
      sameAs,
    },
  };
}

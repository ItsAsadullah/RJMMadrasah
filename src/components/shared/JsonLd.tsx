export default function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": "https://rjmm.edu.bd/#organization",
        "name": "রহিমা জান্নাত মহিলা মাদ্রাসা",
        "alternateName": "Rahima Jannat Mahila Madrasa",
        "url": "https://rjmm.edu.bd",
        "logo": {
          "@type": "ImageObject",
          "url": "https://rjmm.edu.bd/icon.png",
          "width": 512,
          "height": 512,
        },
        "image": "https://rjmm.edu.bd/images/og-image.png",
        "description":
          "ঝিনাইদহ জেলার হলিধানী ও চাঁন্দুয়ালীতে অবস্থিত একটি আদর্শ দ্বীনি শিক্ষা প্রতিষ্ঠান। নূরানী, হিফজুল কুরআন ও কিতাব বিভাগে ভর্তি চলছে।",
        "telephone": "+8801988214554",
        "address": [
          {
            "@type": "PostalAddress",
            "streetAddress": "হলিধানী বাজার",
            "addressLocality": "ঝিনাইদহ সদর",
            "addressRegion": "ঝিনাইদহ",
            "addressCountry": "BD",
          },
          {
            "@type": "PostalAddress",
            "streetAddress": "চাঁন্দুয়ালী",
            "addressLocality": "ঝিনাইদহ",
            "addressRegion": "ঝিনাইদহ",
            "addressCountry": "BD",
          },
        ],
        "sameAs": ["https://rjmm.edu.bd"],
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "বিভাগসমূহ",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": { "@type": "Course", "name": "নূরানী ও মক্তব" },
            },
            {
              "@type": "Offer",
              "itemOffered": { "@type": "Course", "name": "হিফজুল কুরআন" },
            },
            {
              "@type": "Offer",
              "itemOffered": { "@type": "Course", "name": "কিতাব বিভাগ" },
            },
          ],
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://rjmm.edu.bd/#website",
        "url": "https://rjmm.edu.bd",
        "name": "রহিমা জান্নাত মহিলা মাদ্রাসা",
        "description":
          "ঝিনাইদহ জেলার আদর্শ দ্বীনি শিক্ষা প্রতিষ্ঠান — হলিধানী ও চাঁন্দুয়ালী শাখা",
        "publisher": { "@id": "https://rjmm.edu.bd/#organization" },
        "inLanguage": "bn",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

import type { MetadataRoute } from "next";

const BASE = "https://rjmm.edu.bd";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/about`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/admission`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/contact`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/notice`,    lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/gallery`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/result`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];
}

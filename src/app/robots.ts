import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/(admin)/", "/student/", "/teacher/", "/login/"],
      },
    ],
    sitemap: "https://rjmm.edu.bd/sitemap.xml",
    host: "https://rjmm.edu.bd",
  };
}

import type { Metadata, Viewport } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import JsonLd from "@/components/shared/JsonLd";
import { createClient } from "@/lib/supabase/server";

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-bengali",
});

const SITE_URL = "https://rjmm.edu.bd";
const SITE_NAME = "রহিমা জান্নাত মহিলা মাদ্রাসা";

const DEFAULT_TITLE = `${SITE_NAME} | দ্বীনি শিক্ষা প্রতিষ্ঠান, ঝিনাইদহ`;
const DEFAULT_DESC =
  "রহিমা জান্নাত মহিলা মাদ্রাসা — ঝিনাইদহ জেলার হলিধানী ও চাঁন্দুয়ালীতে অবস্থিত একটি আদর্শ দ্বীনি শিক্ষা প্রতিষ্ঠান। নূরানী, হিফজুল কুরআন ও কিতাব বিভাগে ভর্তি চলছে।";
const DEFAULT_IMG = `${SITE_URL}/og-image.png`;

export async function generateMetadata(): Promise<Metadata> {
  // Fetch dynamic SEO settings from Supabase
  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESC;
  let imageUrl = DEFAULT_IMG;
  let keywords: string[] = [
    "রহিমা জান্নাত মহিলা মাদ্রাসা", "মহিলা মাদ্রাসা ঝিনাইদহ",
    "হিফজুল কুরআন", "নূরানী মাদ্রাসা", "কিতাব বিভাগ",
    "হলিধানী মাদ্রাসা", "দ্বীনি শিক্ষা প্রতিষ্ঠান",
    "Rahima Jannat Mahila Madrasa", "madrasa Jhenaidah",
  ];

  let faviconUrl = "/images/logo.png";

  try {
    const supabase = await createClient();
    const [seoResult, brandingResult] = await Promise.all([
      supabase.from("seo_settings").select("og_title, og_description, og_image_url, site_keywords").eq("id", 1).single(),
      supabase.from("branding_settings").select("favicon_url").eq("id", 1).single(),
    ]);

    const seoData = seoResult.data;
    if (seoData) {
      if (seoData.og_title) title = seoData.og_title;
      if (seoData.og_description) description = seoData.og_description;
      if (seoData.og_image_url) imageUrl = seoData.og_image_url;
      if (seoData.site_keywords)
        keywords = seoData.site_keywords.split(",").map((k: string) => k.trim());
    }

    const brandingData = brandingResult.data;
    if (brandingData?.favicon_url) faviconUrl = brandingData.favicon_url;
  } catch {
    // Use defaults if Supabase unavailable
  }

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
    keywords,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "education",
    alternates: { canonical: SITE_URL },
    verification: { google: "VNGaBt1eMKylZ_IAUK-Tqtrb0FLO0sDdWHvmMooIrS0" },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "bn_BD",
      url: SITE_URL,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    manifest: "/manifest.json",
    icons: {
      icon: [{ url: faviconUrl, type: "image/png" }],
      apple: [{ url: faviconUrl, type: "image/png" }],
      shortcut: faviconUrl,
    },
    appleWebApp: { capable: true, statusBarStyle: "default", title: "রহিমা জান্নাত" },
  };
}

export const viewport: Viewport = {
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={notoSansBengali.variable} suppressHydrationWarning>
      <body className="font-bengali bg-white min-h-screen" suppressHydrationWarning>
        <JsonLd />
        {children}
      </body>
    </html>
  );
}

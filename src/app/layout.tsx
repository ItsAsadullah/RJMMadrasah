import type { Metadata, Viewport } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import JsonLd from "@/components/shared/JsonLd";

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-bengali",
});

const SITE_URL = "https://rjmm.edu.bd";
const SITE_NAME = "রহিমা জান্নাত মহিলা মাদ্রাসা";
const SITE_DESC =
  "রহিমা জান্নাত মহিলা মাদ্রাসা — ঝিনাইদহ জেলার হলিধানী ও চাঁন্দুয়ালীতে অবস্থিত একটি আদর্শ দ্বীনি শিক্ষা প্রতিষ্ঠান। নূরানী, হিফজুল কুরআন ও কিতাব বিভাগে ভর্তি চলছে।";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: `${SITE_NAME} | দ্বীনি শিক্ষা প্রতিষ্ঠান, ঝিনাইদহ`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords: [
    "রহিমা জান্নাত মহিলা মাদ্রাসা",
    "মহিলা মাদ্রাসা ঝিনাইদহ",
    "হিফজুল কুরআন",
    "নূরানী মাদ্রাসা",
    "কিতাব বিভাগ",
    "হলিধানী মাদ্রাসা",
    "দ্বীনি শিক্ষা প্রতিষ্ঠান",
    "মহিলা মাদ্রাসা বাংলাদেশ",
    "Rahima Jannat Mahila Madrasa",
    "madrasa Jhenaidah",
    "Islamic school Bangladesh",
    "rjmm.edu.bd",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "education",

  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: "VNGaBt1eMKylZ_IAUK-Tqtrb0FLO0sDdWHvmMooIrS0",
  },
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
    title: `${SITE_NAME} | দ্বীনি শিক্ষা প্রতিষ্ঠান, ঝিনাইদহ`,
    description: SITE_DESC,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "রহিমা জান্নাত মহিলা মাদ্রাসা",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | দ্বীনি শিক্ষা প্রতিষ্ঠান`,
    description: SITE_DESC,
    images: ["/og-image.png"],
  },

  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "রহিমা জান্নাত",
  },
};

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

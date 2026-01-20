import type { Metadata, Viewport } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-bengali",
});

export const metadata: Metadata = {
  title: "রহিমা জান্নাত মহিলা মাদ্রাসা",
  description: "একটি আদর্শ দ্বীনি শিক্ষা প্রতিষ্ঠান - হলিধানী ও চাঁন্দুয়ালী শাখা",
  manifest: "/manifest.json",
};

// সমাধান: Viewport কে আলাদা এক্সপোর্ট করা হয়েছে
export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={notoSansBengali.variable}>
      <body className="font-bengali bg-gray-50 min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
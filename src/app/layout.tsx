import type { Metadata, Viewport } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-bengali",
});

export const metadata: Metadata = {
  title: "রহিমা জান্নাত মহিলা মাদ্রাসা",
  description: "একটি আদর্শ দ্বীনি শিক্ষা প্রতিষ্ঠান",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={notoSansBengali.variable}>
      <body className="font-bengali bg-white min-h-screen">
        {/* এখানে কোনো ন্যাভবার নেই, তাই এটি এখন ড্যাশবোর্ড থেকে হাওয়া হয়ে যাবে */}
        {children}
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import ChairmanClient from "@/components/pages/ChairmanClient";

// ── Server-side metadata (dynamic from Supabase) ─────────────
export async function generateMetadata(): Promise<Metadata> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase
      .from("chairman_profiles")
      .select("name_bn, name_en, designation_bn, seo_title, seo_description, seo_image_url")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!data) {
      return defaultMeta();
    }

    const title =
      data.seo_title ||
      `${data.name_bn || data.name_en || "চেয়ারম্যান"} — রহিমা জান্নাত মহিলা মাদ্রাসা`;

    const description =
      data.seo_description ||
      `${data.name_bn || data.name_en || "চেয়ারম্যান"}, ${data.designation_bn || "চেয়ারম্যান"} — রহিমা জান্নাত মহিলা মাদ্রাসা, ঝিনাইদহ। অফিসিয়াল ডিজিটাল প্রোফাইল ও ই-ভিজিটিং কার্ড।`;

    const imageUrl = data.seo_image_url || "https://rjmm.edu.bd/og-image.png";

    return {
      title,
      description,
      alternates: { canonical: "https://rjmm.edu.bd/chairman" },
      openGraph: {
        type: "profile",
        title,
        description,
        url: "https://rjmm.edu.bd/chairman",
        images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
      other: {
        "og:locale": "bn_BD",
      },
    };
  } catch {
    return defaultMeta();
  }
}

function defaultMeta(): Metadata {
  return {
    title: "চেয়ারম্যান প্রোফাইল — রহিমা জান্নাত মহিলা মাদ্রাসা",
    description:
      "রহিমা জান্নাত মহিলা মাদ্রাসার চেয়ারম্যানের অফিসিয়াল ডিজিটাল প্রোফাইল ও ই-ভিজিটিং কার্ড।",
    alternates: { canonical: "https://rjmm.edu.bd/chairman" },
    openGraph: {
      type: "profile",
      title: "চেয়ারম্যান প্রোফাইল — রহিমা জান্নাত মহিলা মাদ্রাসা",
      description:
        "রহিমা জান্নাত মহিলা মাদ্রাসার চেয়ারম্যানের অফিসিয়াল ডিজিটাল প্রোফাইল।",
      url: "https://rjmm.edu.bd/chairman",
      images: [
        {
          url: "https://rjmm.edu.bd/og-image.png",
          width: 1200,
          height: 630,
          alt: "রহিমা জান্নাত মহিলা মাদ্রাসা",
        },
      ],
    },
  };
}

export default function ChairmanPage() {
  return <ChairmanClient />;
}

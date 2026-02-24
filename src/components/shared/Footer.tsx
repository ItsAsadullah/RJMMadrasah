"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Mail, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type FooterSettings = {
  school_name: string;
  branch1_name: string;
  branch1_address: string;
  branch2_name: string;
  branch2_address: string;
  phone: string;
  email: string;
  facebook_url: string;
  copyright_text: string;
};

const fallback: FooterSettings = {
  school_name: "রহিমা জান্নাত",
  branch1_name: "শাখা ১",
  branch1_address: "হলিধানী বাজার, ঝিনাইদহ সদর",
  branch2_name: "শাখা ২",
  branch2_address: "চাঁন্দুয়ালী বাজার, ঝিনাইদহ সদর",
  phone: "+৮৮০ ১৭XX-XXXXXX",
  email: "info@rahimajannat.com",
  facebook_url: "#",
  copyright_text: "রহিমা জান্নাত মহিলা মাদ্রাসা। সর্বস্বত্ব সংরক্ষিত।",
};

export default function Footer() {
  const [info, setInfo] = useState<FooterSettings>(fallback);

  useEffect(() => {
    supabase
      .from("footer_settings")
      .select("*")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setInfo(data as FooterSettings);
      });
  }, []);

  return (
    <footer className="bg-white border-t border-green-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-green-100">
                  <Image 
                    src="/images/logo.png" 
                    alt="Logo" 
                    fill
                    sizes="40px" 
                    className="object-cover"
                  />
              </div>
              <span className="text-lg font-bold text-primary">{info.school_name}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              একটি আদর্শ দ্বীনি শিক্ষা প্রতিষ্ঠান। <br />
              <span className="font-semibold">{info.branch1_name}:</span> {info.branch1_address} <br />
              <span className="font-semibold">{info.branch2_name}:</span> {info.branch2_address}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">গুরুত্বপূর্ণ লিংক</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/admission" className="hover:text-primary hover:underline">অনলাইন ভর্তি</Link></li>
              <li><Link href="/result" className="hover:text-primary hover:underline">ফলাফল দেখুন</Link></li>
              <li><Link href="/notice" className="hover:text-primary hover:underline">নোটিশ বোর্ড</Link></li>
              <li><Link href="/login" className="hover:text-primary hover:underline">স্টুডেন্ট লগইন</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">যোগাযোগ</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{info.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{info.email}</span>
              </li>
              <li className="flex items-center gap-2">
                <Facebook className="h-4 w-4 text-primary flex-shrink-0" />
                <Link href={info.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">ফেসবুক পেজ</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-8 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} {info.copyright_text}
          </p>
        </div>
      </div>
    </footer>
  );
}
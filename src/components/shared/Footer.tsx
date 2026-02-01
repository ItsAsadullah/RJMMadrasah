import Link from "next/link";
import Image from "next/image";
import { Facebook, Mail, Phone } from "lucide-react";

export default function Footer() {
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
              <span className="text-lg font-bold text-primary">রহিমা জান্নাত</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              একটি আদর্শ দ্বীনি শিক্ষা প্রতিষ্ঠান। <br />
              <span className="font-semibold">শাখা ১:</span> হলিধানী বাজার, ঝিনাইদহ সদর <br />
              <span className="font-semibold">শাখা ২:</span> চাঁন্দুয়ালী বাজার, ঝিনাইদহ সদর
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
                <Phone className="h-4 w-4 text-primary" />
                <span>+৮৮০ ১৭XX-XXXXXX</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>info@rahimajannat.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Facebook className="h-4 w-4 text-primary" />
                <Link href="#" className="hover:text-primary hover:underline">ফেসবুক পেজ</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-8 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} রহিমা জান্নাত মহিলা মাদ্রাসা। সর্বস্বত্ব সংরক্ষিত।
          </p>
        </div>
      </div>
    </footer>
  );
}
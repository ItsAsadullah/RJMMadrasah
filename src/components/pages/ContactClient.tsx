"use client";

import { MapPin, Phone, Mail, Send, Facebook, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type ContactSettings = {
  hero_title: string;
  hero_subtitle: string;
  branch1_name: string;
  branch1_address: string;
  branch1_map_url: string;
  branch2_name: string;
  branch2_address: string;
  branch2_map_url: string;
  phone1: string;
  phone2: string;
  email1: string;
  email2: string;
  facebook_url: string;
  website_url: string;
};

const fallback: ContactSettings = {
  hero_title: "যোগাযোগ করুন",
  hero_subtitle: "যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করতে পারেন। আমরা আপনার অপেক্ষায় আছি।",
  branch1_name: "শাখা ১: হলিধানী বাজার",
  branch1_address: "হলিধানী আলিম মাদ্রাসার সামনে, হলিধানী বাজার, ঝিনাইদহ সদর, ঝিনাইদহ - ৭৭০০",
  branch1_map_url: "https://maps.google.com/maps?q=Holidhani%20Bazar%2C%20Jhenaidah&t=&z=15&ie=UTF8&iwloc=&output=embed",
  branch2_name: "শাখা ২: চাঁন্দুয়ালী বাজার",
  branch2_address: "চাঁন্দুয়ালী বাজার, ঝিনাইদহ সদর, ঝিনাইদহ - ৭৭০০",
  branch2_map_url: "https://maps.google.com/maps?q=Chanduali%20Bazar%2C%20Jhenaidah&t=&z=15&ie=UTF8&iwloc=&output=embed",
  phone1: "+৮৮০ ১৭১২-৩৪৫৬৭৮",
  phone2: "+৮৮০ ১৮৯০-১২৩৪৫৬",
  email1: "info@rahimajannat.edu.bd",
  email2: "admin@rahimajannat.edu.bd",
  facebook_url: "#",
  website_url: "#",
};

export default function ContactPage() {
  const [info, setInfo] = useState<ContactSettings>(fallback);

  useEffect(() => {
    supabase
      .from("contact_settings")
      .select("*")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setInfo(data as ContactSettings);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-[Kalpurush]">
      {/* Hero Section */}
      <div className="bg-green-700 text-white py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">{info.hero_title}</h1>
        <p className="text-green-100 max-w-2xl mx-auto px-4 text-lg">
          {info.hero_subtitle}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 -mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            {/* Address Card */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-full text-green-700 shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2">ঠিকানা</h3>
                  
                  <div className="mb-4">
                    <p className="font-semibold text-green-700 text-sm">{info.branch1_name}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {info.branch1_address}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-green-700 text-sm">{info.branch2_name}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {info.branch2_address}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phone Card */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-full text-green-700">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 mb-1">ফোন</h3>
                  <p className="text-gray-600">{info.phone1}</p>
                  {info.phone2 && <p className="text-gray-600">{info.phone2}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Email Card */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-full text-green-700">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 mb-1">ইমেইল</h3>
                  <p className="text-gray-600">{info.email1}</p>
                  {info.email2 && <p className="text-gray-600">{info.email2}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <div className="flex gap-4 justify-center pt-4">
              <a href={info.facebook_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition shadow-md">
                <Facebook className="w-5 h-5" />
              </a>
              <a href={info.website_url} target="_blank" rel="noopener noreferrer" className="bg-pink-600 text-white p-3 rounded-full hover:bg-pink-700 transition shadow-md">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 h-full">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-2">
                  <Send className="w-6 h-6" /> বার্তা পাঠান
                </h2>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">আপনার নাম</label>
                      <Input placeholder="সম্পূর্ণ নাম লিখুন" className="border-gray-300 focus:border-green-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">মোবাইল নম্বর</label>
                      <Input placeholder="017xxxxxxxx" className="border-gray-300 focus:border-green-500" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">ইমেইল (ঐচ্ছিক)</label>
                    <Input type="email" placeholder="example@gmail.com" className="border-gray-300 focus:border-green-500" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">বিষয়</label>
                    <Input placeholder="কি বিষয়ে জানতে চান?" className="border-gray-300 focus:border-green-500" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">বার্তা</label>
                    <Textarea 
                      placeholder="আপনার প্রশ্ন বা মতামত বিস্তারিত লিখুন..." 
                      className="min-h-[150px] border-gray-300 focus:border-green-500" 
                    />
                  </div>

                  <Button className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-6 text-lg">
                    বার্তা প্রেরণ করুন
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Branch 1 Map */}
          <Card className="shadow-lg border-0 overflow-hidden">
            <div className="p-4 bg-white border-b">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" /> হলিধানী বাজার শাখা
              </h3>
            </div>
            <iframe 
              src="https://maps.google.com/maps?q=Holidhani%20Bazar%2C%20Jhenaidah&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%" 
              height="350" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full bg-gray-100"
            ></iframe>
          </Card>

          {/* Branch 2 Map */}
          <Card className="shadow-lg border-0 overflow-hidden">
             <div className="p-4 bg-white border-b">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" /> চাঁন্দুয়ালী বাজার শাখা
              </h3>
            </div>
            <iframe 
              src="https://maps.google.com/maps?q=Chanduali%20Bazar%2C%20Jhenaidah&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%" 
              height="350" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full bg-gray-100"
            ></iframe>
          </Card>
        </div>
      </div>
    </div>
  );
}

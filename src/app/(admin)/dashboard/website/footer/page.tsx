"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Facebook, Mail, Phone, MapPin, School, Copyright } from "lucide-react";

type FooterSettings = {
  id?: number;
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

const defaultSettings: FooterSettings = {
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

export default function FooterSettingsPage() {
  const [settings, setSettings] = useState<FooterSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("footer_settings")
      .select("*")
      .limit(1)
      .single();

    if (data) {
      setSettings(data);
    } else if (error && error.code !== "PGRST116") {
      console.error("Error fetching footer settings:", error);
    }
    setLoading(false);
  };

  const handleChange = (field: keyof FooterSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    const payload = {
      school_name: settings.school_name,
      branch1_name: settings.branch1_name,
      branch1_address: settings.branch1_address,
      branch2_name: settings.branch2_name,
      branch2_address: settings.branch2_address,
      phone: settings.phone,
      email: settings.email,
      facebook_url: settings.facebook_url,
      copyright_text: settings.copyright_text,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (settings.id) {
      const { error: updateError } = await supabase
        .from("footer_settings")
        .update(payload)
        .eq("id", settings.id);
      error = updateError;
    } else {
      const { data, error: insertError } = await supabase
        .from("footer_settings")
        .insert([payload])
        .select()
        .single();
      error = insertError;
      if (data) setSettings(data);
    }

    if (error) {
      setErrorMsg("সংরক্ষণ ব্যর্থ হয়েছে: " + error.message);
    } else {
      setSuccessMsg("ফুটার তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!");
      fetchSettings();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        <span className="ml-2 text-gray-500">লোড হচ্ছে...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* হেডার */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ফুটার সেটিংস</h1>
        <p className="text-sm text-gray-500 mt-1">
          ওয়েবসাইটের নিচের অংশের (ফুটার) তথ্য পরিবর্তন করুন।
        </p>
      </div>

      {/* সাফল্য / ত্রুটি বার্তা */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errorMsg}
        </div>
      )}

      {/* সেকশন ১: প্রতিষ্ঠানের তথ্য */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 mb-4">
          <School className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">প্রতিষ্ঠানের নাম</h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="school_name">মাদ্রাসার নাম</Label>
          <Input
            id="school_name"
            value={settings.school_name}
            onChange={(e) => handleChange("school_name", e.target.value)}
            placeholder="মাদ্রাসার নাম"
          />
        </div>
      </div>

      {/* সেকশন ২: শাখার ঠিকানা */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 mb-4">
          <MapPin className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">শাখার ঠিকানা</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="branch1_name">শাখা ১ নাম</Label>
            <Input
              id="branch1_name"
              value={settings.branch1_name}
              onChange={(e) => handleChange("branch1_name", e.target.value)}
              placeholder="শাখা ১ নাম"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch1_address">শাখা ১ ঠিকানা</Label>
            <Input
              id="branch1_address"
              value={settings.branch1_address}
              onChange={(e) => handleChange("branch1_address", e.target.value)}
              placeholder="শাখা ১ ঠিকানা"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch2_name">শাখা ২ নাম</Label>
            <Input
              id="branch2_name"
              value={settings.branch2_name}
              onChange={(e) => handleChange("branch2_name", e.target.value)}
              placeholder="শাখা ২ নাম"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch2_address">শাখা ২ ঠিকানা</Label>
            <Input
              id="branch2_address"
              value={settings.branch2_address}
              onChange={(e) => handleChange("branch2_address", e.target.value)}
              placeholder="শাখা ২ ঠিকানা"
            />
          </div>
        </div>
      </div>

      {/* সেকশন ৩: যোগাযোগ তথ্য */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 mb-4">
          <Phone className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">যোগাযোগ তথ্য</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> ফোন নম্বর
            </Label>
            <Input
              id="phone"
              value={settings.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+৮৮০ ১৭XX-XXXXXX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1">
              <Mail className="w-3 h-3" /> ইমেইল
            </Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="info@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook_url" className="flex items-center gap-1">
              <Facebook className="w-3 h-3" /> ফেসবুক পেজ লিংক
            </Label>
            <Input
              id="facebook_url"
              value={settings.facebook_url}
              onChange={(e) => handleChange("facebook_url", e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </div>
        </div>
      </div>

      {/* সেকশন ৪: কপিরাইট */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 mb-4">
          <Copyright className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">কপিরাইট টেক্সট</h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="copyright_text">
            কপিরাইট বার্তা{" "}
            <span className="text-xs text-gray-400">
              (বছর স্বয়ংক্রিয়ভাবে যোগ হবে)
            </span>
          </Label>
          <Input
            id="copyright_text"
            value={settings.copyright_text}
            onChange={(e) => handleChange("copyright_text", e.target.value)}
            placeholder="মাদ্রাসার নাম। সর্বস্বত্ব সংরক্ষিত।"
          />
          <p className="text-xs text-gray-400 mt-1">
            প্রিভিউ: © {new Date().getFullYear()} {settings.copyright_text}
          </p>
        </div>
      </div>

      {/* সংরক্ষণ বাটন */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 text-white px-8"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              সংরক্ষণ হচ্ছে...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              সংরক্ষণ করুন
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

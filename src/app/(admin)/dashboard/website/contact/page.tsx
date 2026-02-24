"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, Save, MapPin, Phone, Mail, Facebook,
  Globe, Map, Star,
} from "lucide-react";

type ContactSettings = {
  id?: number;
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

const defaultData: ContactSettings = {
  hero_title: "যোগাযোগ করুন",
  hero_subtitle: "যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করতে পারেন। আমরা আপনার অপেক্ষায় আছি।",
  branch1_name: "শাখা ১: হলিধানী বাজার",
  branch1_address: "হলিধানী আলিম মাদ্রাসার সামনে, হলিধানী বাজার, ঝিনাইদহ সদর, ঝিনাইদহ - ৭৩০০",
  branch1_map_url: "https://maps.google.com/maps?q=Holidhani%20Bazar%2C%20Jhenaidah&t=&z=15&ie=UTF8&iwloc=&output=embed",
  branch2_name: "শাখা ২: চাঁন্দুয়ালী বাজার",
  branch2_address: "চাঁন্দুয়ালী বাজার, ঝিনাইদহ সদর, ঝিনাইদহ - ৭৩০০",
  branch2_map_url: "https://maps.google.com/maps?q=Chanduali%20Bazar%2C%20Jhenaidah&t=&z=15&ie=UTF8&iwloc=&output=embed",
  phone1: "+৮৮০ ১৭১২-৩৪৫৬৭৮",
  phone2: "+৮৮০ ১৮৯০-১২৩৪৫৬",
  email1: "info@rahimajannat.edu.bd",
  email2: "admin@rahimajannat.edu.bd",
  facebook_url: "#",
  website_url: "#",
};

export default function ContactSettingsPage() {
  const [data, setData] = useState<ContactSettings>(defaultData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: row } = await supabase
      .from("contact_settings")
      .select("*")
      .limit(1)
      .single();
    if (row) setData(row as ContactSettings);
    setLoading(false);
  };

  const handleChange = (field: keyof ContactSettings, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    const payload = { ...data, updated_at: new Date().toISOString() };
    delete (payload as any).id;

    let error;
    if (data.id) {
      ({ error } = await supabase
        .from("contact_settings")
        .update(payload)
        .eq("id", data.id));
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("contact_settings")
        .insert([payload])
        .select()
        .single();
      error = insertError;
      if (inserted) setData(inserted as ContactSettings);
    }

    if (error) {
      setErrorMsg("সংরক্ষণ ব্যর্থ: " + error.message);
    } else {
      setSuccessMsg("যোগাযোগ পেজের তথ্য সফলভাবে সংরক্ষণ হয়েছে!");
      fetchData();
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
        <h1 className="text-2xl font-bold text-gray-900">যোগাযোগ পেজ সেটিংস</h1>
        <p className="text-sm text-gray-500 mt-1">
          ওয়েবসাইটের যোগাযোগ পেজের তথ্য এখান থেকে পরিবর্তন করুন।
        </p>
      </div>

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

      {/* হিরো সেকশন */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 mb-4">
          <Star className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">উপরের ব্যানার</h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hero_title">শিরোনাম</Label>
          <Input
            id="hero_title"
            value={data.hero_title}
            onChange={(e) => handleChange("hero_title", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hero_subtitle">উপশিরোনাম</Label>
          <Textarea
            id="hero_subtitle"
            value={data.hero_subtitle}
            onChange={(e) => handleChange("hero_subtitle", e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {/* শাখা ১ */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 mb-4">
          <MapPin className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">শাখা ১ তথ্য</h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch1_name">শাখার নাম</Label>
          <Input
            id="branch1_name"
            value={data.branch1_name}
            onChange={(e) => handleChange("branch1_name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch1_address">সম্পূর্ণ ঠিকানা</Label>
          <Textarea
            id="branch1_address"
            value={data.branch1_address}
            onChange={(e) => handleChange("branch1_address", e.target.value)}
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch1_map_url" className="flex items-center gap-1">
            <Map className="w-3 h-3" /> Google Maps Embed URL
          </Label>
          <Input
            id="branch1_map_url"
            value={data.branch1_map_url}
            onChange={(e) => handleChange("branch1_map_url", e.target.value)}
            placeholder="https://maps.google.com/maps?q=...&output=embed"
          />
          <p className="text-xs text-gray-400">
            Google Maps এ গিয়ে Share → Embed a map → HTML copy করুন। শুধু src="..." এর ভেতরের URL টুকু এখানে দিন।
          </p>
        </div>
      </div>

      {/* শাখা ২ */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 mb-4">
          <MapPin className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">শাখা ২ তথ্য</h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch2_name">শাখার নাম</Label>
          <Input
            id="branch2_name"
            value={data.branch2_name}
            onChange={(e) => handleChange("branch2_name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch2_address">সম্পূর্ণ ঠিকানা</Label>
          <Textarea
            id="branch2_address"
            value={data.branch2_address}
            onChange={(e) => handleChange("branch2_address", e.target.value)}
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch2_map_url" className="flex items-center gap-1">
            <Map className="w-3 h-3" /> Google Maps Embed URL
          </Label>
          <Input
            id="branch2_map_url"
            value={data.branch2_map_url}
            onChange={(e) => handleChange("branch2_map_url", e.target.value)}
            placeholder="https://maps.google.com/maps?q=...&output=embed"
          />
        </div>
      </div>

      {/* যোগাযোগ নম্বর ও ইমেইল */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 mb-4">
          <Phone className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">ফোন ও ইমেইল</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone1" className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> ফোন ১
            </Label>
            <Input
              id="phone1"
              value={data.phone1}
              onChange={(e) => handleChange("phone1", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone2" className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> ফোন ২
            </Label>
            <Input
              id="phone2"
              value={data.phone2}
              onChange={(e) => handleChange("phone2", e.target.value)}
              placeholder="খালি রাখলে দেখাবে না"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email1" className="flex items-center gap-1">
              <Mail className="w-3 h-3" /> ইমেইল ১
            </Label>
            <Input
              id="email1"
              value={data.email1}
              onChange={(e) => handleChange("email1", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email2" className="flex items-center gap-1">
              <Mail className="w-3 h-3" /> ইমেইল ২
            </Label>
            <Input
              id="email2"
              value={data.email2}
              onChange={(e) => handleChange("email2", e.target.value)}
              placeholder="খালি রাখলে দেখাবে না"
            />
          </div>
        </div>
      </div>

      {/* সোশ্যাল লিংক */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 mb-4">
          <Facebook className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">সোশ্যাল লিংক</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facebook_url" className="flex items-center gap-1">
              <Facebook className="w-3 h-3" /> ফেসবুক পেজ URL
            </Label>
            <Input
              id="facebook_url"
              value={data.facebook_url}
              onChange={(e) => handleChange("facebook_url", e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website_url" className="flex items-center gap-1">
              <Globe className="w-3 h-3" /> ওয়েবসাইট / অন্যান্য URL
            </Label>
            <Input
              id="website_url"
              value={data.website_url}
              onChange={(e) => handleChange("website_url", e.target.value)}
              placeholder="https://..."
            />
          </div>
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

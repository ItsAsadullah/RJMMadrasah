"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Search, Image as ImageIcon, Upload } from "lucide-react";

type SeoSettings = {
  id: number;
  og_title: string;
  og_description: string;
  og_image_url: string;
  site_keywords: string;
};

const defaults: SeoSettings = {
  id: 1,
  og_title: "রহিমা জান্নাত মহিলা মাদ্রাসা | দ্বীনি শিক্ষা প্রতিষ্ঠান, ঝিনাইদহ",
  og_description:
    "রহিমা জান্নাত মহিলা মাদ্রাসা — ঝিনাইদহ জেলার হলিধানী ও চাঁন্দুয়ালীতে অবস্থিত একটি আদর্শ দ্বীনি শিক্ষা প্রতিষ্ঠান। নূরানী, হিফজুল কুরআন ও কিতাব বিভাগে ভর্তি চলছে।",
  og_image_url: "https://rjmm.edu.bd/og-image.png",
  site_keywords:
    "রহিমা জান্নাত মহিলা মাদ্রাসা, মহিলা মাদ্রাসা ঝিনাইদহ, হিফজুল কুরআন, নূরানী মাদ্রাসা, কিতাব বিভাগ",
};

export default function SeoSettingsPage() {
  const [form, setForm] = useState<SeoSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from("seo_settings")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) setForm(data as SeoSettings);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("seo_settings").upsert({ ...form, id: 1 });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const fileName = `og-image-${Date.now()}.${file.name.split(".").pop()}`;
    const { data, error } = await supabase.storage
      .from("seo-assets")
      .upload(fileName, file, { upsert: true, contentType: file.type });

    if (!error && data) {
      const { data: urlData } = supabase.storage
        .from("seo-assets")
        .getPublicUrl(data.path);
      setForm((f) => ({ ...f, og_image_url: urlData.publicUrl }));
    }
    setUploading(false);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Search className="w-7 h-7 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">SEO সেটিংস</h1>
          <p className="text-sm text-gray-500">
            Google সার্চ ও সোশ্যাল মিডিয়া শেয়ারে সাইট কেমন দেখাবে তা নিয়ন্ত্রণ করুন
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">

        {/* OG Title */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            OG Title (Google ও Facebook-এ যে শিরোনাম দেখায়)
          </Label>
          <Input
            value={form.og_title}
            onChange={(e) => setForm((f) => ({ ...f, og_title: e.target.value }))}
            placeholder="রহিমা জান্নাত মহিলা মাদ্রাসা | ..."
          />
          <p className="text-xs text-gray-400">
            আদর্শ দৈর্ঘ্য: ৫০–৬০ অক্ষর। বর্তমান: {form.og_title.length} অক্ষর
          </p>
        </div>

        {/* OG Description */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            OG Description (Google সার্চ ফলাফলে ছোট বিবরণ)
          </Label>
          <Textarea
            value={form.og_description}
            onChange={(e) => setForm((f) => ({ ...f, og_description: e.target.value }))}
            className="min-h-[100px]"
            placeholder="মাদ্রাসার সংক্ষিপ্ত পরিচয়..."
          />
          <p className="text-xs text-gray-400">
            আদর্শ দৈর্ঘ্য: ১৫০–১৬০ অক্ষর। বর্তমান: {form.og_description.length} অক্ষর
          </p>
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            Keywords (কমা দিয়ে আলাদা করুন)
          </Label>
          <Textarea
            value={form.site_keywords}
            onChange={(e) => setForm((f) => ({ ...f, site_keywords: e.target.value }))}
            className="min-h-[80px]"
            placeholder="কীওয়ার্ড ১, কীওয়ার্ড ২, ..."
          />
        </div>

        {/* OG Image */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            OG Image (Facebook/WhatsApp শেয়ারে যে ছবি দেখায়)
          </Label>

          {/* Preview */}
          {form.og_image_url && (
            <div className="border rounded-lg overflow-hidden bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.og_image_url}
                alt="OG Image Preview"
                className="w-full max-h-64 object-cover"
              />
              <p className="text-xs text-gray-400 p-2 truncate">{form.og_image_url}</p>
            </div>
          )}

          {/* Upload button */}
          <div className="flex gap-3 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? "আপলোড হচ্ছে..." : "নতুন ছবি আপলোড করুন"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Manual URL input */}
          <div className="space-y-1">
            <Label className="text-sm text-gray-500">অথবা সরাসরি URL দিন</Label>
            <Input
              value={form.og_image_url}
              onChange={(e) => setForm((f) => ({ ...f, og_image_url: e.target.value }))}
              placeholder="https://rjmm.edu.bd/og-image.png"
            />
          </div>
          <p className="text-xs text-gray-400">
            আদর্শ সাইজ: ১২০০ × ৬৩০ পিক্সেল, ৩০০KB-এর কম
          </p>
        </div>
      </div>

      {/* Google Preview */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-3">
        <h2 className="font-semibold text-gray-700">Google সার্চ প্রিভিউ</h2>
        <div className="border rounded-lg p-4 bg-gray-50 space-y-1">
          <p className="text-blue-700 text-lg font-medium leading-tight line-clamp-1">
            {form.og_title || "পেজ শিরোনাম"}
          </p>
          <p className="text-green-700 text-sm">rjmm.edu.bd</p>
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
            {form.og_description || "বিবরণ..."}
          </p>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 text-base"
      >
        {saving ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> সংরক্ষণ হচ্ছে...</>
        ) : saved ? (
          "✅ সংরক্ষিত হয়েছে!"
        ) : (
          <><Save className="w-5 h-5 mr-2" /> সেটিংস সংরক্ষণ করুন</>
        )}
      </Button>
    </div>
  );
}

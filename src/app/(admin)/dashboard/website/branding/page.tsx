"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Upload, Image as ImageIcon, RefreshCw } from "lucide-react";
import Image from "next/image";

type BrandingSettings = {
  logo_url: string;
  long_logo_url: string;
  favicon_url: string;
};

const defaults: BrandingSettings = {
  logo_url: "/images/logo.png",
  long_logo_url: "/images/long_logo.svg",
  favicon_url: "/images/logo.png",
};

type UploadField = keyof BrandingSettings;

export default function BrandingSettingsPage() {
  const [form, setForm] = useState<BrandingSettings>(defaults);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<UploadField | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const longLogoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from("branding_settings")
      .select("logo_url, long_logo_url, favicon_url")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) setForm(data as BrandingSettings);
      });
  }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("branding_settings")
      .upsert({ ...form, id: 1 });
    setSaving(false);
    if (error) showToast("সংরক্ষণ ব্যর্থ হয়েছে: " + error.message, false);
    else showToast("সফলভাবে সংরক্ষিত হয়েছে! পরিবর্তন দেখতে পেজ রিলোড করুন।");
  };

  const CLOUD_NAME = "dfo1slmdy";
  const UPLOAD_PRESET = "rahima_preset";

  const handleUpload = async (field: UploadField, file: File) => {
    setUploading(field);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.secure_url) {
        setForm((prev) => ({ ...prev, [field]: data.secure_url }));
        showToast("ফাইল আপলোড হয়েছে। সংরক্ষণ করুন।");
      } else {
        showToast("আপলোড ব্যর্থ: " + (data.error?.message || "অজানা ত্রুটি"), false);
      }
    } catch (err) {
      showToast("ইন্টারনেট সংযোগ চেক করুন!", false);
    }
    setUploading(null);
  };

  const isExternal = (url: string) =>
    url.startsWith("http://") || url.startsWith("https://");

  const renderField = (
    field: UploadField,
    label: string,
    hint: string,
    ref: React.RefObject<HTMLInputElement | null>
  ) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">{label}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
        </div>
        {/* Preview */}
        <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
          {form[field] ? (
            isExternal(form[field]) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form[field]} alt={label} className="w-full h-full object-contain p-1" />
            ) : (
              <Image src={form[field]} alt={label} width={60} height={60} className="object-contain p-1" unoptimized />
            )
          ) : (
            <ImageIcon className="w-6 h-6 text-gray-300" />
          )}
        </div>
      </div>

      {/* URL input */}
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">সরাসরি URL</Label>
        <Input
          value={form[field]}
          onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
          placeholder="https://... অথবা /images/logo.png"
          className="text-sm"
        />
      </div>

      {/* File upload */}
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(field, f);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={uploading !== null}
          onClick={() => ref.current?.click()}
        >
          {uploading === field ? (
            <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> আপলোড হচ্ছে...</>
          ) : (
            <><Upload className="w-3 h-3 mr-2" /> ফাইল আপলোড করুন</>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ব্র্যান্ডিং সেটিংস</h1>
          <p className="text-sm text-gray-500 mt-1">লোগো ও ফেভিকন পরিবর্তন করুন</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          সংরক্ষণ করুন
        </Button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${toast.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {toast.msg}
        </div>
      )}

      {/* Fields */}
      {renderField("logo_url", "মূল লোগো (গোলাকার)", "Footer ও প্রোফাইলে ব্যবহৃত হয় • PNG/SVG • ন্যূনতম 192×192px", logoRef)}
      {renderField("long_logo_url", "লম্বা লোগো (Navbar)", "Navbar-এ ব্যবহৃত হয় • SVG বা PNG • প্রস্থ বেশি হওয়া ভালো", longLogoRef)}
      {renderField("favicon_url", "ফেভিকন (Browser Tab Icon)", "Browser ট্যাব ও Google সার্চে দেখায় • ICO/PNG • ন্যূনতম 48×48px", faviconRef)}

      {/* Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 space-y-1">
        <p className="font-semibold flex items-center gap-2"><RefreshCw className="w-4 h-4" /> পরিবর্তন দেখার জন্য</p>
        <ul className="list-disc list-inside space-y-0.5 text-amber-700">
          <li>সংরক্ষণের পর পেজ Hard Refresh করুন (Ctrl+Shift+R)</li>
          <li>Favicon পরিবর্তন Google-এ দেখাতে ২-৪ সপ্তাহ লাগতে পারে</li>
          <li>ছবি Cloudinary-তে আপলোড হয় (<strong>dfo1slmdy</strong> / preset: <strong>rahima_preset</strong>)</li>
        </ul>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, Save, Plus, Trash2, GraduationCap,
  FileText, BookOpen, Phone, Star, Bell, MapPin,
} from "lucide-react";

type FeeRow = { class: string; admission_fee: string; monthly_fee: string };
type Department = { title: string; desc: string };

type AdmissionSettings = {
  id?: number;
  hero_year: string;
  hero_subtitle: string;
  hero_badge: string;
  marquee_text: string;
  requirements: string[];
  fee_rows: FeeRow[];
  fee_note: string;
  departments: Department[];
  cta_title: string;
  cta_phone: string;
  cta_address: string;
};

const defaults: AdmissionSettings = {
  hero_year: "শিক্ষাবর্ষ ২০২৬",
  hero_subtitle: "রহিমা জান্নাত মহিলা মাদ্রাসায় নতুন শিক্ষাবর্ষে নূরানী, নাজেরা, হিফজ ও কিতাব বিভাগে ভর্তি চলছে।",
  hero_badge: "ভর্তি চলছে",
  marquee_text: "📢 সীমিত আসন সংখ্যা! দ্রুত আপনার সন্তানের ভর্তি নিশ্চিত করুন। বিশেষ প্রয়োজনে যোগাযোগ করুন: ০১৭XX-XXXXXX",
  requirements: [
    "জন্ম নিবন্ধন সনদের ফটোকপি (বাধ্যতামূলক)",
    "শিক্ষার্থীর ২ কপি পাসপোর্ট সাইজের রঙিন ছবি",
    "পিতা/মাতার এনআইডি কার্ডের ফটোকপি",
    "আগের মাদ্রাসার ছাড়পত্র (যদি থাকে)",
    "নির্ধারিত ভর্তি ফরম পূরণ ও ফি প্রদান",
  ],
  fee_rows: [
    { class: "নূরানী (শিশু - ৩য়)", admission_fee: "৩০০০", monthly_fee: "৮০০" },
    { class: "হিফজুল কুরআন", admission_fee: "৫০০০", monthly_fee: "১৫০০" },
    { class: "কিতাব বিভাগ", admission_fee: "৪০০০", monthly_fee: "১২০০" },
    { class: "আবাসিক চার্জ", admission_fee: "২০০০", monthly_fee: "২৫০০" },
  ],
  fee_note: "* এতিম ও গরিব শিক্ষার্থীদের জন্য বিশেষ ছাড়ের ব্যবস্থা রয়েছে।",
  departments: [
    { title: "নূরানী ও মক্তব", desc: "শিশুদের জন্য বুনিয়াদি শিক্ষা ও সহীহ কুরআন তেলাওয়াত।" },
    { title: "হিফজুল কুরআন", desc: "অভিজ্ঞ হাফেজ দ্বারা ৩ বছরে সম্পূর্ণ কুরআন হিফজ।" },
    { title: "কিতাব বিভাগ", desc: "মিজান থেকে দাওরায়ে হাদিস পর্যন্ত গভীর দ্বীনি শিক্ষা।" },
  ],
  cta_title: "আপনার সন্তানের উজ্জ্বল ভবিষ্যতের জন্য আজই যোগাযোগ করুন",
  cta_phone: "০১৯৮৮২১৪৫৫৪",
  cta_address: "হলিধানী বাজার, ঝিনাইদহ সদর",
};

export default function AdmissionSettingsPage() {
  const [data, setData] = useState<AdmissionSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function fetchData() {
    setLoading(true);
    const { data: row } = await supabase
      .from("admission_settings").select("*").limit(1).single();
    if (row) setData(row as AdmissionSettings);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const set = (field: keyof AdmissionSettings, value: any) =>
    setData((prev) => ({ ...prev, [field]: value }));

  // --- Requirements ---
  const setReq = (i: number, val: string) => {
    const arr = [...data.requirements];
    arr[i] = val;
    set("requirements", arr);
  };
  const addReq = () => set("requirements", [...data.requirements, ""]);
  const removeReq = (i: number) =>
    set("requirements", data.requirements.filter((_, idx) => idx !== i));

  // --- Fee rows ---
  const setFee = (i: number, field: keyof FeeRow, val: string) => {
    const arr = data.fee_rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
    set("fee_rows", arr);
  };
  const addFee = () =>
    set("fee_rows", [...data.fee_rows, { class: "", admission_fee: "", monthly_fee: "" }]);
  const removeFee = (i: number) =>
    set("fee_rows", data.fee_rows.filter((_, idx) => idx !== i));

  // --- Departments ---
  const setDept = (i: number, field: keyof Department, val: string) => {
    const arr = data.departments.map((d, idx) => idx === i ? { ...d, [field]: val } : d);
    set("departments", arr);
  };
  const addDept = () => set("departments", [...data.departments, { title: "", desc: "" }]);
  const removeDept = (i: number) =>
    set("departments", data.departments.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg(""); setErrorMsg("");
    const payload = { ...data, updated_at: new Date().toISOString() };
    delete (payload as any).id;

    let error;
    if (data.id) {
      ({ error } = await supabase.from("admission_settings").update(payload).eq("id", data.id));
    } else {
      const { data: ins, error: e } = await supabase
        .from("admission_settings").insert([payload]).select().single();
      error = e;
      if (ins) setData(ins as AdmissionSettings);
    }
    if (error) setErrorMsg("সংরক্ষণ ব্যর্থ: " + error.message);
    else { setSuccessMsg("ভর্তি পেজের তথ্য সফলভাবে সংরক্ষণ হয়েছে!"); fetchData(); }
    setSaving(false);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        <span className="ml-2 text-gray-500">লোড হচ্ছে...</span>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ভর্তি পেজ সেটিংস</h1>
        <p className="text-sm text-gray-500 mt-1">ওয়েবসাইটের ভর্তি পেজের সকল তথ্য এখান থেকে পরিবর্তন করুন।</p>
      </div>

      {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{successMsg}</div>}
      {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{errorMsg}</div>}

      {/* ১. হিরো সেকশন */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Star className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">উপরের ব্যানার</h2>
        </div>
        <div className="space-y-2">
          <Label>ব্যাজ লেখা (যেমন: ভর্তি চলছে)</Label>
          <Input value={data.hero_badge} onChange={(e) => set("hero_badge", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>শিরোনাম (যেমন: শিক্ষাবর্ষ ২০২৬)</Label>
          <Input value={data.hero_year} onChange={(e) => set("hero_year", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>উপশিরোনাম</Label>
          <Textarea value={data.hero_subtitle} onChange={(e) => set("hero_subtitle", e.target.value)} rows={3} />
        </div>
      </div>

      {/* ২. মার্কি নোটিস */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Bell className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">স্ক্রোলিং নোটিস (মার্কি)</h2>
        </div>
        <div className="space-y-2">
          <Label>নোটিস টেক্সট</Label>
          <Textarea value={data.marquee_text} onChange={(e) => set("marquee_text", e.target.value)} rows={2} />
        </div>
      </div>

      {/* ৩. ভর্তির শর্তাবলী */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <FileText className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">ভর্তির শর্তাবলী</h2>
        </div>
        <div className="space-y-3">
          {data.requirements.map((req, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-5 text-center font-bold">{i + 1}</span>
              <Input
                value={req}
                onChange={(e) => setReq(i, e.target.value)}
                placeholder="শর্তটি লিখুন"
                className="flex-1"
              />
              <Button
                size="sm" variant="ghost"
                onClick={() => removeReq(i)}
                className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={addReq} className="w-full mt-2 border-dashed">
            <Plus className="w-4 h-4 mr-1" /> নতুন শর্ত যোগ করুন
          </Button>
        </div>
      </div>

      {/* ৪. ফি তালিকা */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <BookOpen className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">ফি তালিকা</h2>
        </div>
        <div className="space-y-3">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_120px_120px_40px] gap-2 text-xs font-bold text-gray-500 px-1">
            <span>বিভাগ/শ্রেণি</span>
            <span>ভর্তি ফি (টাকা)</span>
            <span>মাসিক বেতন (টাকা)</span>
            <span></span>
          </div>
          {data.fee_rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_120px_120px_40px] gap-2 items-center">
              <Input
                value={row.class}
                onChange={(e) => setFee(i, "class", e.target.value)}
                placeholder="বিভাগ/শ্রেণি"
              />
              <Input
                value={row.admission_fee}
                onChange={(e) => setFee(i, "admission_fee", e.target.value)}
                placeholder="যেমন: ৩০০০"
              />
              <Input
                value={row.monthly_fee}
                onChange={(e) => setFee(i, "monthly_fee", e.target.value)}
                placeholder="যেমন: ৮০০"
              />
              <Button
                size="sm" variant="ghost"
                onClick={() => removeFee(i)}
                className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={addFee} className="w-full mt-2 border-dashed">
            <Plus className="w-4 h-4 mr-1" /> নতুন সারি যোগ করুন
          </Button>
        </div>
        <div className="space-y-2 pt-2">
          <Label>ফি সংক্রান্ত নোট (নিচে ছোট লেখা)</Label>
          <Input
            value={data.fee_note}
            onChange={(e) => set("fee_note", e.target.value)}
            placeholder="* বিশেষ ছাড়ের ব্যবস্থা আছে..."
          />
        </div>
      </div>

      {/* ৫. বিভাগসমূহ */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <GraduationCap className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">বিভাগসমূহ (কার্ড)</h2>
        </div>
        <div className="space-y-4">
          {data.departments.map((dept, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">বিভাগ {i + 1}</span>
                <Button
                  size="sm" variant="ghost"
                  onClick={() => removeDept(i)}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2 h-7"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <Input
                value={dept.title}
                onChange={(e) => setDept(i, "title", e.target.value)}
                placeholder="বিভাগের নাম"
              />
              <Textarea
                value={dept.desc}
                onChange={(e) => setDept(i, "desc", e.target.value)}
                placeholder="সংক্ষিপ্ত বিবরণ"
                rows={2}
              />
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={addDept} className="w-full border-dashed">
            <Plus className="w-4 h-4 mr-1" /> নতুন বিভাগ যোগ করুন
          </Button>
        </div>
      </div>

      {/* ৬. নিচের CTA সেকশন */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Phone className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">নিচের যোগাযোগ সেকশন</h2>
        </div>
        <div className="space-y-2">
          <Label>শিরোনাম</Label>
          <Textarea value={data.cta_title} onChange={(e) => set("cta_title", e.target.value)} rows={2} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Phone className="w-3 h-3" /> ফোন নম্বর</Label>
            <Input value={data.cta_phone} onChange={(e) => set("cta_phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><MapPin className="w-3 h-3" /> ঠিকানা</Label>
            <Input value={data.cta_address} onChange={(e) => set("cta_address", e.target.value)} />
          </div>
        </div>
      </div>

      {/* সংরক্ষণ */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-8">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />সংরক্ষণ হচ্ছে...</> : <><Save className="w-4 h-4 mr-2" />সংরক্ষণ করুন</>}
        </Button>
      </div>
    </div>
  );
}

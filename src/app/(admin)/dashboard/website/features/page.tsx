"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Plus, Trash2, Layers, Type } from "lucide-react";

type Feature = {
  icon: string;
  title: string;
  points: string[];
};

type FeaturesSettings = {
  id?: number;
  section_title: string;
  section_subtitle: string;
  features: Feature[];
};

const ICON_OPTIONS = [
  "BookOpen", "GraduationCap", "ShieldCheck", "HeartHandshake",
  "Star", "Award", "Users", "School", "BookMarked", "Lightbulb",
  "Globe", "Heart", "CheckCircle2", "Sparkles", "Trophy", "Mosque",
];

const defaults: FeaturesSettings = {
  section_title: "আমাদের বৈশিষ্ট্যসমূহ",
  section_subtitle: "কেন আপনার সন্তানের জন্য রহিমা জান্নাত মহিলা মাদ্রাসা সেরা? আমাদের অনন্য বৈশিষ্ট্যগুলো জানুন।",
  features: [
    { icon: "BookOpen", title: "সহীহ কুরআন শিক্ষা", points: ["আন্তর্জাতিক মানের কারিকুলাম অনুসরণ"] },
  ],
};

export default function FeaturesSettingsPage() {
  const [data, setData] = useState<FeaturesSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: row } = await supabase
      .from("features_settings").select("*").limit(1).single();
    if (row) setData(row as FeaturesSettings);
    setLoading(false);
  };

  const set = (field: keyof FeaturesSettings, value: any) =>
    setData((prev) => ({ ...prev, [field]: value }));

  // feature level
  const setFeature = (fi: number, field: keyof Feature, value: any) => {
    const arr = data.features.map((f, i) => i === fi ? { ...f, [field]: value } : f);
    set("features", arr);
  };
  const addFeature = () =>
    set("features", [...data.features, { icon: "BookOpen", title: "", points: [""] }]);
  const removeFeature = (fi: number) =>
    set("features", data.features.filter((_, i) => i !== fi));

  // point level
  const setPoint = (fi: number, pi: number, value: string) => {
    const arr = data.features.map((f, i) => {
      if (i !== fi) return f;
      const pts = f.points.map((p, j) => j === pi ? value : p);
      return { ...f, points: pts };
    });
    set("features", arr);
  };
  const addPoint = (fi: number) => {
    const arr = data.features.map((f, i) =>
      i === fi ? { ...f, points: [...f.points, ""] } : f
    );
    set("features", arr);
  };
  const removePoint = (fi: number, pi: number) => {
    const arr = data.features.map((f, i) =>
      i === fi ? { ...f, points: f.points.filter((_, j) => j !== pi) } : f
    );
    set("features", arr);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg(""); setErrorMsg("");
    const payload = { ...data, updated_at: new Date().toISOString() };
    delete (payload as any).id;

    let error;
    if (data.id) {
      ({ error } = await supabase.from("features_settings").update(payload).eq("id", data.id));
    } else {
      const { data: ins, error: e } = await supabase
        .from("features_settings").insert([payload]).select().single();
      error = e;
      if (ins) setData(ins as FeaturesSettings);
    }
    if (error) setErrorMsg("সংরক্ষণ ব্যর্থ: " + error.message);
    else { setSuccessMsg("বৈশিষ্ট্যসমূহ সফলভাবে সংরক্ষণ হয়েছে!"); fetchData(); }
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
        <h1 className="text-2xl font-bold text-gray-900">বৈশিষ্ট্যসমূহ সেকশন</h1>
        <p className="text-sm text-gray-500 mt-1">হোমপেজের "আমাদের বৈশিষ্ট্যসমূহ" অংশ সম্পাদনা করুন।</p>
      </div>

      {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{successMsg}</div>}
      {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{errorMsg}</div>}

      {/* সেকশন শিরোনাম */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Type className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">সেকশন শিরোনাম</h2>
        </div>
        <div className="space-y-2">
          <Label>শিরোনাম</Label>
          <Input value={data.section_title} onChange={(e) => set("section_title", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>উপশিরোনাম</Label>
          <Textarea value={data.section_subtitle} onChange={(e) => set("section_subtitle", e.target.value)} rows={2} />
        </div>
      </div>

      {/* বৈশিষ্ট্য কার্ডসমূহ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">বৈশিষ্ট্য কার্ডসমূহ</h2>
          <span className="text-xs text-gray-400 ml-1">({data.features.length}টি)</span>
        </div>

        {data.features.map((feature, fi) => (
          <div key={fi} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            {/* Card header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500 bg-green-50 text-green-700 px-2 py-0.5 rounded">কার্ড {fi + 1}</span>
              <Button
                size="sm" variant="ghost"
                onClick={() => removeFeature(fi)}
                className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 px-2"
              >
                <Trash2 className="w-4 h-4 mr-1" /> মুছুন
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* আইকন */}
              <div className="space-y-2">
                <Label>আইকন</Label>
                <select
                  value={feature.icon}
                  onChange={(e) => setFeature(fi, "icon", e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
              {/* শিরোনাম */}
              <div className="space-y-2">
                <Label>কার্ডের শিরোনাম</Label>
                <Input
                  value={feature.title}
                  onChange={(e) => setFeature(fi, "title", e.target.value)}
                  placeholder="যেমন: সহীহ কুরআন শিক্ষা"
                />
              </div>
            </div>

            {/* পয়েন্টসমূহ */}
            <div className="space-y-2">
              <Label>পয়েন্টসমূহ</Label>
              <div className="space-y-2">
                {feature.points.map((point, pi) => (
                  <div key={pi} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-4 text-center font-bold">{pi + 1}</span>
                    <Input
                      value={point}
                      onChange={(e) => setPoint(fi, pi, e.target.value)}
                      placeholder="পয়েন্ট লিখুন"
                      className="flex-1"
                    />
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => removePoint(fi, pi)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => addPoint(fi)} className="w-full border-dashed text-xs">
                  <Plus className="w-3 h-3 mr-1" /> পয়েন্ট যোগ করুন
                </Button>
              </div>
            </div>
          </div>
        ))}

        <Button size="sm" variant="outline" onClick={addFeature} className="w-full border-dashed border-green-300 text-green-700 hover:bg-green-50">
          <Plus className="w-4 h-4 mr-1" /> নতুন বৈশিষ্ট্য কার্ড যোগ করুন
        </Button>
      </div>

      {/* সংরক্ষণ */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-8">
          {saving
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />সংরক্ষণ হচ্ছে...</>
            : <><Save className="w-4 h-4 mr-2" />সংরক্ষণ করুন</>}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  ChairmanProfile,
  ChairmanEducation,
  ChairmanExperience,
  ChairmanAchievement,
  ChairmanDocument,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Plus, Trash2, Upload, Save, Eye, CheckCircle,
  AlertCircle, GraduationCap, Briefcase, Award, FileText,
  Link as LinkIcon, User, MessageSquare, Phone, Image as ImageIcon,
  Search, ArrowUp, ArrowDown, ExternalLink
} from "lucide-react";

// ── Cloudinary upload helper ─────────────────────────────────
const CLOUD_NAME = "dfo1slmdy";
const UPLOAD_PRESET = "rahima_preset";

async function uploadToCloudinary(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message || "Upload failed");
  return data.secure_url;
}

// ── Textarea component ────────────────────────────────────────
function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

// ── Reusable image uploader ──────────────────────────────────
function ImageUploader({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch (err) {
      alert("ছবি আপলোড ব্যর্থ: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2 items-center">
        <Input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="flex-1" />
        {uploading && <Loader2 className="animate-spin w-4 h-4 text-green-600" />}
      </div>
      {value && (
        <div className="relative inline-block">
          <img src={value} alt={label} className="w-28 h-28 object-cover rounded-lg border border-gray-200 shadow-sm" />
          <button
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
          >×</button>
        </div>
      )}
      <Input
        placeholder="অথবা URL সরাসরি দিন"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs"
      />
    </div>
  );
}

// ── Document uploader ─────────────────────────────────────────
function DocumentUploader({ onUrl }: { onUrl: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (data.secure_url) onUrl(data.secure_url);
      else alert("আপলোড ব্যর্থ");
    } catch {
      alert("আপলোড ব্যর্থ");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="flex gap-2 items-center">
      <Input type="file" accept=".pdf,.doc,.docx" onChange={handleFile} disabled={uploading} />
      {uploading && <Loader2 className="animate-spin w-4 h-4" />}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function ChairmanAdminPage() {
  const [profile, setProfile] = useState<Partial<ChairmanProfile>>({
    status: "draft",
    social_links: {},
  });
  const [education, setEducation] = useState<Partial<ChairmanEducation>[]>([]);
  const [experiences, setExperiences] = useState<Partial<ChairmanExperience>[]>([]);
  const [achievements, setAchievements] = useState<Partial<ChairmanAchievement>[]>([]);
  const [documents, setDocuments] = useState<Partial<ChairmanDocument>[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Load existing profile (if any)
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from("chairman_profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (profiles && profiles.length > 0) {
        const p = profiles[0];
        setProfile(p);
        setProfileId(p.id);

        const [edu, exp, ach, doc] = await Promise.all([
          supabase.from("chairman_education").select("*").eq("profile_id", p.id).order("sort_order"),
          supabase.from("chairman_experiences").select("*").eq("profile_id", p.id).order("sort_order"),
          supabase.from("chairman_achievements").select("*").eq("profile_id", p.id).order("sort_order"),
          supabase.from("chairman_documents").select("*").eq("profile_id", p.id).order("sort_order"),
        ]);

        setEducation(edu.data || []);
        setExperiences(exp.data || []);
        setAchievements(ach.data || []);
        setDocuments(doc.data || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── Save profile ──────────────────────────────────────────
  const saveProfile = async (newStatus?: "draft" | "published" | "unpublished") => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...profile,
        status: newStatus || profile.status || "draft",
        social_links: profile.social_links || {},
        updated_by: (await supabase.auth.getUser()).data.user?.email || "admin",
      };
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;

      let pid = profileId;

      if (pid) {
        const { error: updateError } = await supabase.from("chairman_profiles").update(payload).eq("id", pid);
        if (updateError) throw new Error("প্রোফাইল আপডেট ব্যর্থ: " + updateError.message);
      } else {
        const { data, error } = await supabase.from("chairman_profiles").insert([payload]).select("id").single();
        if (error) throw new Error("প্রোফাইল তৈরি ব্যর্থ: " + error.message);
        pid = data.id;
        setProfileId(pid);
      }

      // Save related records
      await saveRelated(pid!);
      
      // Reload from database to synchronize state with fresh data
      await loadProfile();

      showMsg("success", "✅ সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err) {
      console.error("Save profile error:", err);
      showMsg("error", "❌ ত্রুটি: " + (err as Error).message);
    }
    setSaving(false);
  };

  const saveRelated = async (pid: string) => {
    // 1. Education
    const cleanEducation = education
      .filter(e => (e.degree_bn && e.degree_bn.trim()) || (e.institution_bn && e.institution_bn.trim()) || (e.degree_en && e.degree_en.trim()))
      .map((e, i) => ({
        profile_id: pid,
        degree_bn: e.degree_bn?.trim() || null,
        degree_en: e.degree_en?.trim() || null,
        institution_bn: e.institution_bn?.trim() || null,
        institution_en: e.institution_en?.trim() || null,
        subject_bn: e.subject_bn?.trim() || null,
        subject_en: e.subject_en?.trim() || null,
        passing_year: e.passing_year?.trim() || null,
        description_bn: e.description_bn?.trim() || null,
        description_en: e.description_en?.trim() || null,
        sort_order: i,
      }));

    const { error: eduDelErr } = await supabase.from("chairman_education").delete().eq("profile_id", pid);
    if (eduDelErr) throw new Error("পূর্ববর্তী শিক্ষাগত তথ্য মোছা ব্যর্থ: " + eduDelErr.message);

    if (cleanEducation.length > 0) {
      const { error: eduInsErr } = await supabase.from("chairman_education").insert(cleanEducation);
      if (eduInsErr) throw new Error("শিক্ষাগত যোগ্যতা সংরক্ষণ ব্যর্থ: " + eduInsErr.message);
    }

    // 2. Experiences
    const cleanExperiences = experiences
      .filter(e => (e.position_bn && e.position_bn.trim()) || (e.organization_bn && e.organization_bn.trim()) || (e.position_en && e.position_en.trim()))
      .map((e, i) => ({
        profile_id: pid,
        position_bn: e.position_bn?.trim() || null,
        position_en: e.position_en?.trim() || null,
        organization_bn: e.organization_bn?.trim() || null,
        organization_en: e.organization_en?.trim() || null,
        start_date: e.start_date?.trim() || null,
        end_date: e.is_current ? null : (e.end_date?.trim() || null),
        is_current: !!e.is_current,
        responsibilities_bn: e.responsibilities_bn?.trim() || null,
        responsibilities_en: e.responsibilities_en?.trim() || null,
        experience_type: e.experience_type === "institutional" ? "institutional" : "career",
        sort_order: i,
      }));

    const { error: expDelErr } = await supabase.from("chairman_experiences").delete().eq("profile_id", pid);
    if (expDelErr) throw new Error("পূর্ববর্তী কর্মজীবন তথ্য মোছা ব্যর্থ: " + expDelErr.message);

    if (cleanExperiences.length > 0) {
      const { error: expInsErr } = await supabase.from("chairman_experiences").insert(cleanExperiences);
      if (expInsErr) throw new Error("কর্মজীবন ও দায়িত্ব সংরক্ষণ ব্যর্থ: " + expInsErr.message);
    }

    // 3. Achievements
    const cleanAchievements = achievements
      .filter(a => (a.title_bn && a.title_bn.trim()) || (a.title_en && a.title_en.trim()))
      .map((a, i) => ({
        profile_id: pid,
        title_bn: a.title_bn?.trim() || null,
        title_en: a.title_en?.trim() || null,
        description_bn: a.description_bn?.trim() || null,
        description_en: a.description_en?.trim() || null,
        year: a.year?.trim() || null,
        image_url: a.image_url?.trim() || null,
        sort_order: i,
      }));

    const { error: achDelErr } = await supabase.from("chairman_achievements").delete().eq("profile_id", pid);
    if (achDelErr) throw new Error("পূর্ববর্তী অর্জন মোছা ব্যর্থ: " + achDelErr.message);

    if (cleanAchievements.length > 0) {
      const { error: achInsErr } = await supabase.from("chairman_achievements").insert(cleanAchievements);
      if (achInsErr) throw new Error("অর্জন ও পুরস্কার সংরক্ষণ ব্যর্থ: " + achInsErr.message);
    }

    // 4. Documents
    const cleanDocuments = documents
      .filter((d): d is typeof d & { file_url: string } => !!d.file_url && d.file_url.trim().length > 0)
      .map((d, i) => ({
        profile_id: pid,
        title_bn: d.title_bn?.trim() || null,
        title_en: d.title_en?.trim() || null,
        file_url: d.file_url.trim(),
        file_type: d.file_type || null,
        is_public: d.is_public !== false,
        sort_order: i,
      }));

    const { error: docDelErr } = await supabase.from("chairman_documents").delete().eq("profile_id", pid);
    if (docDelErr) throw new Error("পূর্ববর্তী ডকুমেন্ট মোছা ব্যর্থ: " + docDelErr.message);

    if (cleanDocuments.length > 0) {
      const { error: docInsErr } = await supabase.from("chairman_documents").insert(cleanDocuments);
      if (docInsErr) throw new Error("ডকুমেন্ট সংরক্ষণ ব্যর্থ: " + docInsErr.message);
    }
  };

  const setSocialLink = (key: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      social_links: { ...(prev.social_links || {}), [key]: value },
    }));
  };

  // ── Repeatable list helpers ───────────────────────────────
  const moveItem = <T,>(list: T[], idx: number, dir: -1 | 1): T[] => {
    const copy = [...list];
    const target = idx + dir;
    if (target < 0 || target >= copy.length) return copy;
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    return copy;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 font-[Kalpurush]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">চেয়ারম্যান প্রোফাইল ব্যবস্থাপনা</h1>
          <p className="text-sm text-gray-500 mt-1">
            স্ট্যাটাস:{" "}
            <span className={`font-semibold ${profile.status === "published" ? "text-green-600" : profile.status === "draft" ? "text-yellow-600" : "text-gray-500"}`}>
              {profile.status === "published" ? "প্রকাশিত" : profile.status === "draft" ? "খসড়া" : "অপ্রকাশিত"}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open("/chairman", "_blank")}>
            <Eye className="w-4 h-4 mr-2" /> প্রিভিউ
          </Button>
          <Button variant="outline" size="sm" onClick={() => saveProfile("draft")} disabled={saving}>
            {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            খসড়া সংরক্ষণ
          </Button>
          {profile.status !== "published" ? (
            <Button size="sm" onClick={() => saveProfile("published")} disabled={saving} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" /> প্রকাশ করুন
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={() => saveProfile("unpublished")} disabled={saving}>
              অপ্রকাশিত করুন
            </Button>
          )}
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-9 h-auto gap-1 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="basic" className="text-xs py-1.5"><User className="w-3 h-3 mr-1" />পরিচিতি</TabsTrigger>
          <TabsTrigger value="images" className="text-xs py-1.5"><ImageIcon className="w-3 h-3 mr-1" />ছবি</TabsTrigger>
          <TabsTrigger value="message" className="text-xs py-1.5"><MessageSquare className="w-3 h-3 mr-1" />বাণী</TabsTrigger>
          <TabsTrigger value="education" className="text-xs py-1.5"><GraduationCap className="w-3 h-3 mr-1" />শিক্ষা</TabsTrigger>
          <TabsTrigger value="career" className="text-xs py-1.5"><Briefcase className="w-3 h-3 mr-1" />ক্যারিয়ার</TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs py-1.5"><Award className="w-3 h-3 mr-1" />অর্জন</TabsTrigger>
          <TabsTrigger value="contact" className="text-xs py-1.5"><Phone className="w-3 h-3 mr-1" />যোগাযোগ</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs py-1.5"><FileText className="w-3 h-3 mr-1" />ডকুমেন্ট</TabsTrigger>
          <TabsTrigger value="seo" className="text-xs py-1.5"><Search className="w-3 h-3 mr-1" />SEO</TabsTrigger>
        </TabsList>

        {/* ── Tab: Basic Info ─────────────────────────────── */}
        <TabsContent value="basic">
          <Card>
            <CardHeader><CardTitle>মৌলিক পরিচিতি</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>সম্মানজনক উপাধি (বাংলা)</Label>
                  <Input placeholder="যেমন: আলহাজ্ব" value={profile.honorific_bn || ""} onChange={e => setProfile(p => ({ ...p, honorific_bn: e.target.value }))} />
                </div>
                <div>
                  <Label>Honorific (English)</Label>
                  <Input placeholder="e.g. Alhaj" value={profile.honorific_en || ""} onChange={e => setProfile(p => ({ ...p, honorific_en: e.target.value }))} />
                </div>
                <div>
                  <Label>পূর্ণ নাম (বাংলা) *</Label>
                  <Input placeholder="চেয়ারম্যানের পূর্ণ নাম বাংলায়" value={profile.name_bn || ""} onChange={e => setProfile(p => ({ ...p, name_bn: e.target.value }))} />
                </div>
                <div>
                  <Label>Full Name (English) *</Label>
                  <Input placeholder="Chairman's full name in English" value={profile.name_en || ""} onChange={e => setProfile(p => ({ ...p, name_en: e.target.value }))} />
                </div>
                <div>
                  <Label>পদবী (বাংলা)</Label>
                  <Input placeholder="যেমন: চেয়ারম্যান" value={profile.designation_bn || ""} onChange={e => setProfile(p => ({ ...p, designation_bn: e.target.value }))} />
                </div>
                <div>
                  <Label>Designation (English)</Label>
                  <Input placeholder="e.g. Chairman" value={profile.designation_en || ""} onChange={e => setProfile(p => ({ ...p, designation_en: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>সংক্ষিপ্ত পরিচিতি (বাংলা)</Label>
                <Textarea placeholder="সংক্ষিপ্ত পেশাদার পরিচিতি বাংলায়..." rows={3} value={profile.introduction_bn || ""} onChange={e => setProfile(p => ({ ...p, introduction_bn: e.target.value }))} />
              </div>
              <div>
                <Label>Short Introduction (English)</Label>
                <Textarea placeholder="Short professional introduction in English..." rows={3} value={profile.introduction_en || ""} onChange={e => setProfile(p => ({ ...p, introduction_en: e.target.value }))} />
              </div>
              <div>
                <Label>বিস্তারিত জীবনী (বাংলা)</Label>
                <Textarea placeholder="বিস্তারিত জীবনবৃত্তান্ত বাংলায়..." rows={6} value={profile.biography_bn || ""} onChange={e => setProfile(p => ({ ...p, biography_bn: e.target.value }))} />
              </div>
              <div>
                <Label>Full Biography (English)</Label>
                <Textarea placeholder="Detailed biography in English..." rows={6} value={profile.biography_en || ""} onChange={e => setProfile(p => ({ ...p, biography_en: e.target.value }))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Images ──────────────────────────────────── */}
        <TabsContent value="images">
          <Card>
            <CardHeader><CardTitle>ছবি ও মিডিয়া</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <ImageUploader
                label="প্রোফাইল ফটো (Portrait)"
                value={profile.photo_url || ""}
                onChange={url => setProfile(p => ({ ...p, photo_url: url }))}
              />
              <ImageUploader
                label="কভার ছবি (Optional)"
                value={profile.cover_url || ""}
                onChange={url => setProfile(p => ({ ...p, cover_url: url }))}
              />
              <ImageUploader
                label="স্বাক্ষর ছবি (Signature, Optional)"
                value={profile.signature_url || ""}
                onChange={url => setProfile(p => ({ ...p, signature_url: url }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Message ─────────────────────────────────── */}
        <TabsContent value="message">
          <Card>
            <CardHeader><CardTitle>চেয়ারম্যানের বাণী ও দর্শন</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>চেয়ারম্যানের বাণী (বাংলা)</Label>
                <Textarea placeholder="চেয়ারম্যানের বাণী, দৃষ্টিভঙ্গি ও প্রাতিষ্ঠানিক আকাঙ্ক্ষা বাংলায়..." rows={8} value={profile.message_bn || ""} onChange={e => setProfile(p => ({ ...p, message_bn: e.target.value }))} />
              </div>
              <div>
                <Label>Chairman's Message (English)</Label>
                <Textarea placeholder="Chairman's message, vision and institutional aspirations in English..." rows={8} value={profile.message_en || ""} onChange={e => setProfile(p => ({ ...p, message_en: e.target.value }))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Education ───────────────────────────────── */}
        <TabsContent value="education">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>শিক্ষাগত যোগ্যতা</CardTitle>
              <Button size="sm" onClick={() => setEducation(prev => [...prev, { degree_bn: "", institution_bn: "", sort_order: prev.length }])}>
                <Plus className="w-4 h-4 mr-1" /> যোগ করুন
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {education.length === 0 && <p className="text-gray-400 text-sm text-center py-6">কোনো শিক্ষাগত যোগ্যতা যোগ করা হয়নি।</p>}
              {education.map((edu, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">শিক্ষাগত যোগ্যতা #{idx + 1}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setEducation(moveItem(education, idx, -1))} className="p-1 hover:bg-gray-200 rounded" title="উপরে"><ArrowUp className="w-3 h-3" /></button>
                      <button onClick={() => setEducation(moveItem(education, idx, 1))} className="p-1 hover:bg-gray-200 rounded" title="নিচে"><ArrowDown className="w-3 h-3" /></button>
                      <button onClick={() => setEducation(education.filter((_, i) => i !== idx))} className="p-1 hover:bg-red-100 rounded text-red-600" title="মুছুন"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="ডিগ্রি (বাংলা)" value={edu.degree_bn || ""} onChange={e => setEducation(ed => ed.map((x, i) => i === idx ? { ...x, degree_bn: e.target.value } : x))} />
                    <Input placeholder="Degree (English)" value={edu.degree_en || ""} onChange={e => setEducation(ed => ed.map((x, i) => i === idx ? { ...x, degree_en: e.target.value } : x))} />
                    <Input placeholder="প্রতিষ্ঠানের নাম (বাংলা)" value={edu.institution_bn || ""} onChange={e => setEducation(ed => ed.map((x, i) => i === idx ? { ...x, institution_bn: e.target.value } : x))} />
                    <Input placeholder="Institution (English)" value={edu.institution_en || ""} onChange={e => setEducation(ed => ed.map((x, i) => i === idx ? { ...x, institution_en: e.target.value } : x))} />
                    <Input placeholder="বিষয়/বিভাগ" value={edu.subject_bn || ""} onChange={e => setEducation(ed => ed.map((x, i) => i === idx ? { ...x, subject_bn: e.target.value } : x))} />
                    <Input placeholder="পাসের বছর" value={edu.passing_year || ""} onChange={e => setEducation(ed => ed.map((x, i) => i === idx ? { ...x, passing_year: e.target.value } : x))} />
                  </div>
                  <Textarea placeholder="অতিরিক্ত বিবরণ (ঐচ্ছিক)" rows={2} value={edu.description_bn || ""} onChange={e => setEducation(ed => ed.map((x, i) => i === idx ? { ...x, description_bn: e.target.value } : x))} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Career ──────────────────────────────────── */}
        <TabsContent value="career">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>কর্মজীবন ও দায়িত্ব</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setExperiences(prev => [...prev, { experience_type: "career", is_current: false }])}>
                  <Plus className="w-4 h-4 mr-1" /> কর্মজীবন
                </Button>
                <Button size="sm" variant="outline" onClick={() => setExperiences(prev => [...prev, { experience_type: "institutional", is_current: false }])}>
                  <Plus className="w-4 h-4 mr-1" /> প্রাতিষ্ঠানিক
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {experiences.length === 0 && <p className="text-gray-400 text-sm text-center py-6">কোনো কর্মজীবন যোগ করা হয়নি।</p>}
              {experiences.map((exp, idx) => (
                <div key={idx} className={`border rounded-lg p-4 space-y-3 ${exp.experience_type === "institutional" ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white border text-gray-600">
                      {exp.experience_type === "institutional" ? "প্রাতিষ্ঠানিক দায়িত্ব" : "কর্মজীবন"} #{idx + 1}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => setExperiences(moveItem(experiences, idx, -1))} className="p-1 hover:bg-gray-200 rounded"><ArrowUp className="w-3 h-3" /></button>
                      <button onClick={() => setExperiences(moveItem(experiences, idx, 1))} className="p-1 hover:bg-gray-200 rounded"><ArrowDown className="w-3 h-3" /></button>
                      <button onClick={() => setExperiences(experiences.filter((_, i) => i !== idx))} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="পদবী (বাংলা)" value={exp.position_bn || ""} onChange={e => setExperiences(ed => ed.map((x, i) => i === idx ? { ...x, position_bn: e.target.value } : x))} />
                    <Input placeholder="Position (English)" value={exp.position_en || ""} onChange={e => setExperiences(ed => ed.map((x, i) => i === idx ? { ...x, position_en: e.target.value } : x))} />
                    <Input placeholder="প্রতিষ্ঠানের নাম (বাংলা)" value={exp.organization_bn || ""} onChange={e => setExperiences(ed => ed.map((x, i) => i === idx ? { ...x, organization_bn: e.target.value } : x))} />
                    <Input placeholder="Organization (English)" value={exp.organization_en || ""} onChange={e => setExperiences(ed => ed.map((x, i) => i === idx ? { ...x, organization_en: e.target.value } : x))} />
                    <Input placeholder="শুরুর সময়" value={exp.start_date || ""} onChange={e => setExperiences(ed => ed.map((x, i) => i === idx ? { ...x, start_date: e.target.value } : x))} />
                    <Input placeholder="শেষের সময় (বর্তমান হলে খালি)" value={exp.end_date || ""} onChange={e => setExperiences(ed => ed.map((x, i) => i === idx ? { ...x, end_date: e.target.value } : x))} disabled={exp.is_current} />
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={!!exp.is_current} onChange={e => setExperiences(ed => ed.map((x, i) => i === idx ? { ...x, is_current: e.target.checked, end_date: e.target.checked ? "" : x.end_date } : x))} className="w-4 h-4 accent-green-600" />
                    বর্তমানে কর্মরত
                  </label>
                  <Textarea placeholder="দায়িত্ব ও অর্জন (বাংলা)" rows={3} value={exp.responsibilities_bn || ""} onChange={e => setExperiences(ed => ed.map((x, i) => i === idx ? { ...x, responsibilities_bn: e.target.value } : x))} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Achievements ────────────────────────────── */}
        <TabsContent value="achievements">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>অর্জন ও পুরস্কার</CardTitle>
              <Button size="sm" onClick={() => setAchievements(prev => [...prev, { title_bn: "" }])}>
                <Plus className="w-4 h-4 mr-1" /> যোগ করুন
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {achievements.length === 0 && <p className="text-gray-400 text-sm text-center py-6">কোনো অর্জন যোগ করা হয়নি।</p>}
              {achievements.map((ach, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">অর্জন #{idx + 1}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setAchievements(moveItem(achievements, idx, -1))} className="p-1 hover:bg-gray-200 rounded"><ArrowUp className="w-3 h-3" /></button>
                      <button onClick={() => setAchievements(moveItem(achievements, idx, 1))} className="p-1 hover:bg-gray-200 rounded"><ArrowDown className="w-3 h-3" /></button>
                      <button onClick={() => setAchievements(achievements.filter((_, i) => i !== idx))} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="শিরোনাম (বাংলা)" value={ach.title_bn || ""} onChange={e => setAchievements(a => a.map((x, i) => i === idx ? { ...x, title_bn: e.target.value } : x))} />
                    <Input placeholder="Title (English)" value={ach.title_en || ""} onChange={e => setAchievements(a => a.map((x, i) => i === idx ? { ...x, title_en: e.target.value } : x))} />
                    <Input placeholder="সাল/বছর" value={ach.year || ""} onChange={e => setAchievements(a => a.map((x, i) => i === idx ? { ...x, year: e.target.value } : x))} />
                    <div>
                      <ImageUploader label="সনদপত্র/ছবি (ঐচ্ছিক)" value={ach.image_url || ""} onChange={url => setAchievements(a => a.map((x, i) => i === idx ? { ...x, image_url: url } : x))} />
                    </div>
                  </div>
                  <Textarea placeholder="বিবরণ (বাংলা)" rows={2} value={ach.description_bn || ""} onChange={e => setAchievements(a => a.map((x, i) => i === idx ? { ...x, description_bn: e.target.value } : x))} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Contact & Social ────────────────────────── */}
        <TabsContent value="contact">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>যোগাযোগ তথ্য</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>প্রাথমিক মোবাইল নম্বর</Label>
                    <Input placeholder="+880..." value={profile.phone_primary || ""} onChange={e => setProfile(p => ({ ...p, phone_primary: e.target.value }))} />
                  </div>
                  <div>
                    <Label>দ্বিতীয় ফোন নম্বর</Label>
                    <Input placeholder="+880..." value={profile.phone_secondary || ""} onChange={e => setProfile(p => ({ ...p, phone_secondary: e.target.value }))} />
                  </div>
                  <div>
                    <Label>WhatsApp নম্বর</Label>
                    <Input placeholder="+880..." value={profile.whatsapp || ""} onChange={e => setProfile(p => ({ ...p, whatsapp: e.target.value }))} />
                  </div>
                  <div>
                    <Label>ইমেইল</Label>
                    <Input type="email" placeholder="chairman@rjmm.edu.bd" value={profile.email || ""} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <Label>অফিস সময়</Label>
                    <Input placeholder="যেমন: শনি–বৃহ, সকাল ৯টা–বিকাল ৫টা" value={profile.office_hours || ""} onChange={e => setProfile(p => ({ ...p, office_hours: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Google Maps লিংক</Label>
                    <Input placeholder="https://maps.google.com/..." value={profile.google_maps_link || ""} onChange={e => setProfile(p => ({ ...p, google_maps_link: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>অফিস ঠিকানা (বাংলা)</Label>
                  <Textarea placeholder="সম্পূর্ণ অফিস ঠিকানা বাংলায়..." rows={2} value={profile.office_address_bn || ""} onChange={e => setProfile(p => ({ ...p, office_address_bn: e.target.value }))} />
                </div>
                <div>
                  <Label>Office Address (English)</Label>
                  <Textarea placeholder="Full office address in English..." rows={2} value={profile.office_address_en || ""} onChange={e => setProfile(p => ({ ...p, office_address_en: e.target.value }))} />
                </div>
                <div>
                  <Label>ডাক ঠিকানা</Label>
                  <Textarea placeholder="পোস্টাল ঠিকানা..." rows={2} value={profile.postal_address || ""} onChange={e => setProfile(p => ({ ...p, postal_address: e.target.value }))} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>সোশ্যাল ও পেশাদার লিংক</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {["facebook", "youtube", "linkedin", "twitter", "website"].map(platform => (
                  <div key={platform} className="flex items-center gap-3">
                    <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <Label className="w-24 text-sm capitalize flex-shrink-0">{platform}</Label>
                    <Input
                      placeholder={`https://${platform}.com/...`}
                      value={(profile.social_links as Record<string, string>)?.[platform] || ""}
                      onChange={e => setSocialLink(platform, e.target.value)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab: Documents ───────────────────────────────── */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>পাবলিক ডকুমেন্ট</CardTitle>
              <Button size="sm" onClick={() => setDocuments(prev => [...prev, { title_bn: "", file_url: "", is_public: true }])}>
                <Plus className="w-4 h-4 mr-1" /> যোগ করুন
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                ⚠️ শুধুমাত্র অনুমোদিত পাবলিক ডকুমেন্ট আপলোড করুন। ব্যক্তিগত বা সংবেদনশীল নথি আপলোড করবেন না।
              </p>
              {documents.length === 0 && <p className="text-gray-400 text-sm text-center py-6">কোনো ডকুমেন্ট যোগ করা হয়নি।</p>}
              {documents.map((doc, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">ডকুমেন্ট #{idx + 1}</span>
                    <button onClick={() => setDocuments(documents.filter((_, i) => i !== idx))} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 className="w-3 h-3" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="শিরোনাম (বাংলা)" value={doc.title_bn || ""} onChange={e => setDocuments(d => d.map((x, i) => i === idx ? { ...x, title_bn: e.target.value } : x))} />
                    <Input placeholder="Title (English)" value={doc.title_en || ""} onChange={e => setDocuments(d => d.map((x, i) => i === idx ? { ...x, title_en: e.target.value } : x))} />
                  </div>
                  <DocumentUploader onUrl={url => setDocuments(d => d.map((x, i) => i === idx ? { ...x, file_url: url } : x))} />
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> ফাইল দেখুন
                    </a>
                  )}
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={!!doc.is_public} onChange={e => setDocuments(d => d.map((x, i) => i === idx ? { ...x, is_public: e.target.checked } : x))} className="w-4 h-4 accent-green-600" />
                    পাবলিকভাবে দৃশ্যমান
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: SEO ─────────────────────────────────────── */}
        <TabsContent value="seo">
          <Card>
            <CardHeader><CardTitle>SEO ও পাবলিশিং</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>SEO শিরোনাম</Label>
                <Input placeholder="পেজ টাইটেল — rjmm.edu.bd/chairman" value={profile.seo_title || ""} onChange={e => setProfile(p => ({ ...p, seo_title: e.target.value }))} />
                <p className="text-xs text-gray-400 mt-1">খালি রাখলে চেয়ারম্যানের নাম স্বয়ংক্রিয়ভাবে ব্যবহার হবে।</p>
              </div>
              <div>
                <Label>SEO বিবরণ</Label>
                <Textarea placeholder="মেটা ডেসক্রিপশন (১৫০-১৬০ অক্ষর)" rows={3} value={profile.seo_description || ""} onChange={e => setProfile(p => ({ ...p, seo_description: e.target.value }))} />
              </div>
              <ImageUploader
                label="সোশ্যাল শেয়ার ছবি (OG Image)"
                value={profile.seo_image_url || ""}
                onChange={url => setProfile(p => ({ ...p, seo_image_url: url }))}
              />
              <div className="border-t pt-4">
                <Label className="text-sm font-semibold">পাবলিক URL</Label>
                <p className="text-sm text-green-700 font-mono bg-green-50 p-2 rounded mt-1">https://rjmm.edu.bd/chairman</p>
              </div>
              {profile.updated_at && (
                <p className="text-xs text-gray-400">
                  সর্বশেষ আপডেট: {new Date(profile.updated_at).toLocaleString("bn-BD")} {profile.updated_by && `• ${profile.updated_by}`}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom Save Bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 print:hidden">
        <Button variant="outline" onClick={() => saveProfile("draft")} disabled={saving}>
          {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          খসড়া সংরক্ষণ
        </Button>
        {profile.status !== "published" ? (
          <Button onClick={() => saveProfile("published")} disabled={saving} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-4 h-4 mr-2" /> প্রকাশ করুন
          </Button>
        ) : (
          <Button onClick={() => saveProfile("published")} disabled={saving} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" /> আপডেট ও প্রকাশ
          </Button>
        )}
      </div>
    </div>
  );
}

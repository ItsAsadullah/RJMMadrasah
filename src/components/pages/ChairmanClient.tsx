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
import {
  Phone, Mail, MapPin, MessageCircle, Share2, Download,
  ExternalLink, QrCode, BookOpen, Briefcase, Award,
  FileText, Star, ChevronRight, Facebook, Youtube,
  Linkedin, Globe, Clock, Building, Copy, Check,
  GraduationCap, Calendar
} from "lucide-react";

// QR Code generation using free API
function QRCode({ url, size = 160 }: { url: string; size?: number }) {
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&format=png&margin=10&color=0c4a2b&bgcolor=ffffff`}
      alt="QR Code"
      width={size}
      height={size}
      className="rounded-lg"
    />
  );
}

// vCard generator
function generateVCard(profile: ChairmanProfile): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    profile.name_en ? `FN:${profile.name_en}` : "",
    profile.name_bn ? `NOTE:Bengali Name: ${profile.name_bn}` : "",
    profile.designation_en ? `TITLE:${profile.designation_en}` : "",
    "ORG:Rahima Jannat Mohila Madrasah",
    profile.phone_primary ? `TEL;TYPE=CELL:${profile.phone_primary}` : "",
    profile.phone_secondary ? `TEL;TYPE=WORK:${profile.phone_secondary}` : "",
    profile.email ? `EMAIL:${profile.email}` : "",
    profile.office_address_en ? `ADR:;;${profile.office_address_en};;;;` : "",
    "URL:https://rjmm.edu.bd/chairman",
    "END:VCARD",
  ];
  return lines.filter(Boolean).join("\r\n");
}

// Download vCard
function downloadVCard(profile: ChairmanProfile) {
  const vcf = generateVCard(profile);
  const blob = new Blob([vcf], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${profile.name_en || "chairman"}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}

// Share profile
async function shareProfile(profile: ChairmanProfile) {
  const url = "https://rjmm.edu.bd/chairman";
  const title = profile.name_bn || profile.name_en || "Chairman Profile";
  const text = `${profile.honorific_bn || ""} ${profile.name_bn || ""} — ${profile.designation_bn || "চেয়ারম্যান"}, রহিমা জান্নাত মহিলা মাদ্রাসা`;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch { /* fallback */ }
  }
  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch { /* */ }
}

// Social icon helper
function SocialIcon({ platform }: { platform: string }) {
  const icons: Record<string, React.ReactNode> = {
    facebook: <Facebook className="w-4 h-4" />,
    youtube: <Youtube className="w-4 h-4" />,
    linkedin: <Linkedin className="w-4 h-4" />,
    twitter: <Globe className="w-4 h-4" />,
    website: <Globe className="w-4 h-4" />,
  };
  return <>{icons[platform] || <Globe className="w-4 h-4" />}</>;
}

// Section wrapper with Islamic ornamental styling
function Section({ title, icon, children, id }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-emerald-900/10 border border-emerald-800/20 flex items-center justify-center text-emerald-800">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-emerald-900 font-[Hind_Siliguri,sans-serif]">{title}</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent" />
        <span className="text-amber-600 text-sm" aria-hidden="true">✦</span>
      </div>
      {children}
    </section>
  );
}

// Empty state
function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-20 text-gray-400">
      <div className="text-6xl mb-4">🌿</div>
      <p className="text-lg font-[Kalpurush,sans-serif]">{text}</p>
      <p className="text-sm mt-2">চেয়ারম্যান প্রোফাইল এখনও প্রকাশিত হয়নি।</p>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────
export default function ChairmanPageClient() {
  const [profile, setProfile] = useState<ChairmanProfile | null>(null);
  const [education, setEducation] = useState<ChairmanEducation[]>([]);
  const [experiences, setExperiences] = useState<ChairmanExperience[]>([]);
  const [achievements, setAchievements] = useState<ChairmanAchievement[]>([]);
  const [documents, setDocuments] = useState<ChairmanDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const CANONICAL_URL = "https://rjmm.edu.bd/chairman";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from("chairman_profiles")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(1);

      if (profiles && profiles.length > 0) {
        const p = profiles[0] as ChairmanProfile;
        setProfile(p);

        const [edu, exp, ach, doc] = await Promise.all([
          supabase.from("chairman_education").select("*").eq("profile_id", p.id).order("sort_order"),
          supabase.from("chairman_experiences").select("*").eq("profile_id", p.id).order("sort_order"),
          supabase.from("chairman_achievements").select("*").eq("profile_id", p.id).order("sort_order"),
          supabase.from("chairman_documents").select("*").eq("profile_id", p.id).eq("is_public", true).order("sort_order"),
        ]);
        setEducation(edu.data || []);
        setExperiences(exp.data || []);
        setAchievements(ach.data || []);
        setDocuments(doc.data || []);
      }
    } catch (err) {
      console.error("Error loading chairman profile:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleShare = async () => {
    const result = await shareProfile(profile!);
    if (result === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = async () => {
    if (typeof window === "undefined") return;
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5f0]">
        <div className="flex flex-col items-center gap-3 text-emerald-800">
          <div className="w-12 h-12 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin" />
          <p className="font-[Kalpurush,sans-serif] text-lg">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center">
        <EmptyState text="প্রোফাইল পাওয়া যায়নি" />
      </div>
    );
  }

  const socialLinks = (profile.social_links as Record<string, string>) || {};
  const careerExp = experiences.filter(e => e.experience_type === "career");
  const institutionalExp = experiences.filter(e => e.experience_type === "institutional");

  return (
    <div className="min-h-screen bg-[#f5f2ec] font-[Kalpurush,sans-serif] print:bg-white">

      {/* ═══ HERO / COVER ═══════════════════════════════════ */}
      {profile.cover_url && (
        <div className="relative h-40 md:h-56 overflow-hidden print:hidden">
          <img
            src={profile.cover_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 to-emerald-950/80" />
          {/* Islamic geometric overlay */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
        </div>
      )}

      {/* ═══ IDENTITY HERO CARD ══════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        <div className={`bg-white rounded-2xl shadow-xl border border-emerald-100/60 overflow-hidden ${profile.cover_url ? "-mt-16 relative z-10" : "mt-8"}`}>

          {/* Top accent line */}
          <div className="h-1 bg-gradient-to-r from-emerald-700 via-amber-500 to-emerald-700" />

          {/* Bismillah */}
          <div className="text-center pt-6 pb-2">
            <p className="text-emerald-800 text-xl font-semibold tracking-widest" dir="rtl" lang="ar">
              بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
            </p>
          </div>

          {/* Profile area */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">

              {/* ── Portrait ── */}
              <div className="flex-shrink-0 flex flex-col items-center gap-3 md:w-52">
                <div className="relative group">
                  {/* Decorative ring */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-emerald-600 via-amber-400 to-emerald-800 opacity-70 blur-[2px]" />
                  <div className="relative w-44 h-44 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                    {profile.photo_url ? (
                      <img
                        src={profile.photo_url}
                        alt={profile.name_bn || profile.name_en || "Chairman"}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                        <span className="text-white text-6xl font-bold opacity-30">চে</span>
                      </div>
                    )}
                  </div>
                  {/* Official badge */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white text-[10px] font-semibold px-3 py-1 rounded-full shadow-lg whitespace-nowrap border border-amber-400/30">
                    ✦ চেয়ারম্যান ✦
                  </div>
                </div>

                {/* Institution badge */}
                <div className="flex items-center gap-2 text-center">
                  <Building className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <p className="text-xs text-emerald-700 font-semibold leading-snug">
                    রহিমা জান্নাত মহিলা মাদ্রাসা
                  </p>
                </div>

                {/* QR for desktop */}
                <div className="hidden md:flex flex-col items-center gap-2 mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <QRCode url={CANONICAL_URL} size={100} />
                  <p className="text-[10px] text-gray-400 text-center">প্রোফাইল স্ক্যান করুন</p>
                </div>
              </div>

              {/* ── Identity info ── */}
              <div className="flex-1 min-w-0">
                {/* Honorific */}
                {profile.honorific_bn && (
                  <p className="text-amber-600 text-sm font-semibold mb-1 tracking-wide">{profile.honorific_bn}</p>
                )}

                {/* Name (Bengali) */}
                {profile.name_bn && (
                  <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-900 leading-tight tracking-wide" style={{ fontFamily: "'Hind Siliguri', 'Kalpurush', sans-serif" }}>
                    {profile.name_bn}
                  </h1>
                )}

                {/* Name (English) */}
                {profile.name_en && (
                  <p className="text-lg text-emerald-700 font-medium mt-1" style={{ fontFamily: "Georgia, serif" }}>
                    {profile.honorific_en ? `${profile.honorific_en} ` : ""}{profile.name_en}
                  </p>
                )}

                {/* Designation */}
                {(profile.designation_bn || profile.designation_en) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.designation_bn && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-sm font-semibold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {profile.designation_bn}
                      </span>
                    )}
                    {profile.designation_en && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-sm font-medium">
                        {profile.designation_en}
                      </span>
                    )}
                  </div>
                )}

                {/* Introduction */}
                {profile.introduction_bn && (
                  <p className="mt-4 text-gray-600 text-base leading-relaxed border-l-4 border-emerald-200 pl-4">
                    {profile.introduction_bn}
                  </p>
                )}

                {/* Signature */}
                {profile.signature_url && (
                  <div className="mt-4">
                    <img
                      src={profile.signature_url}
                      alt="স্বাক্ষর"
                      className="h-12 object-contain opacity-80"
                    />
                    <p className="text-xs text-gray-400 mt-1">স্বাক্ষর</p>
                  </div>
                )}

                {/* ── Action Buttons ── */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {profile.phone_primary && (
                    <a
                      href={`tel:${profile.phone_primary}`}
                      id="btn-call"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                      <Phone className="w-4 h-4" /> কল করুন
                    </a>
                  )}
                  {profile.whatsapp && (
                    <a
                      href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      id="btn-whatsapp"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebe5b] text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                  )}
                  {profile.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      id="btn-email"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                      <Mail className="w-4 h-4" /> ইমেইল
                    </a>
                  )}
                  <button
                    onClick={() => downloadVCard(profile)}
                    id="btn-save-contact"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    <Download className="w-4 h-4" /> কন্টাক্ট সেভ
                  </button>
                  <button
                    onClick={handleShare}
                    id="btn-share"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    {copied ? "কপি হয়েছে!" : "শেয়ার"}
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    id="btn-print"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95 print:hidden"
                  >
                    <FileText className="w-4 h-4" /> পিডিএফ
                  </button>
                  {profile.google_maps_link && (
                    <a
                      href={profile.google_maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      id="btn-map"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                      <MapPin className="w-4 h-4" /> মানচিত্র
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom accent */}
          <div className="h-0.5 bg-gradient-to-r from-transparent via-emerald-200 to-transparent mx-8" />

          {/* Social links bar */}
          {Object.keys(socialLinks).some(k => socialLinks[k]) && (
            <div className="px-6 py-3 flex flex-wrap items-center justify-center gap-3 bg-emerald-900/3">
              {Object.entries(socialLinks).filter(([, url]) => url).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  id={`btn-social-${platform}`}
                  className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 hover:underline transition-colors capitalize"
                >
                  <SocialIcon platform={platform} />
                  {platform}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ═══ CONTENT SECTIONS ════════════════════════════════ */}
        <div className="mt-8 space-y-6">

          {/* ── Biography ── */}
          {profile.biography_bn && (
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/60 p-6 md:p-8">
              <Section title="জীবনী" icon={<BookOpen className="w-5 h-5" />} id="biography">
                <div className="prose prose-emerald max-w-none">
                  <p className="text-gray-700 leading-8 text-base whitespace-pre-wrap">{profile.biography_bn}</p>
                </div>
                {profile.biography_en && (
                  <details className="mt-4">
                    <summary className="text-sm text-emerald-700 cursor-pointer hover:text-emerald-900 font-medium">Read in English</summary>
                    <p className="mt-3 text-gray-600 leading-7 text-sm italic">{profile.biography_en}</p>
                  </details>
                )}
              </Section>
            </div>
          )}

          {/* ── Education ── */}
          {education.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/60 p-6 md:p-8">
              <Section title="শিক্ষাগত যোগ্যতা" icon={<GraduationCap className="w-5 h-5" />} id="education">
                <div className="space-y-4">
                  {education.map((edu, idx) => (
                    <div key={edu.id || idx} className="relative flex gap-4">
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-4 h-4 text-emerald-700" />
                        </div>
                        {idx < education.length - 1 && (
                          <div className="w-0.5 flex-1 bg-emerald-100 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                          {edu.passing_year && (
                            <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium mb-2">
                              <Calendar className="w-3 h-3" /> {edu.passing_year}
                            </span>
                          )}
                          <h3 className="text-base font-bold text-emerald-900">
                            {edu.degree_bn || edu.degree_en}
                          </h3>
                          {edu.degree_en && edu.degree_bn && (
                            <p className="text-xs text-gray-500 italic">{edu.degree_en}</p>
                          )}
                          {(edu.institution_bn || edu.institution_en) && (
                            <p className="text-sm text-emerald-700 font-medium mt-1 flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {edu.institution_bn || edu.institution_en}
                            </p>
                          )}
                          {edu.subject_bn && (
                            <p className="text-xs text-gray-500 mt-1">বিষয়: {edu.subject_bn}</p>
                          )}
                          {edu.description_bn && (
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{edu.description_bn}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* ── Career Experience ── */}
          {careerExp.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/60 p-6 md:p-8">
              <Section title="কর্মজীবন" icon={<Briefcase className="w-5 h-5" />} id="career">
                <div className="space-y-4">
                  {careerExp.map((exp, idx) => (
                    <div key={exp.id || idx} className="relative flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-4 h-4 text-blue-700" />
                        </div>
                        {idx < careerExp.length - 1 && <div className="w-0.5 flex-1 bg-blue-100 mt-2" />}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="bg-blue-50/40 rounded-xl p-4 border border-blue-100">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-bold text-gray-900">
                              {exp.position_bn || exp.position_en}
                            </h3>
                            {exp.is_current && (
                              <span className="flex-shrink-0 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold border border-green-200">বর্তমান</span>
                            )}
                          </div>
                          {(exp.organization_bn || exp.organization_en) && (
                            <p className="text-sm text-blue-700 font-medium mt-1 flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {exp.organization_bn || exp.organization_en}
                            </p>
                          )}
                          {(exp.start_date || exp.end_date) && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {exp.start_date}{exp.end_date ? ` — ${exp.end_date}` : exp.is_current ? " — বর্তমান" : ""}
                            </p>
                          )}
                          {exp.responsibilities_bn && (
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{exp.responsibilities_bn}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* ── Institutional Responsibilities ── */}
          {institutionalExp.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/60 p-6 md:p-8">
              <Section title="প্রাতিষ্ঠানিক দায়িত্ব" icon={<Building className="w-5 h-5" />} id="institutional">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {institutionalExp.map((exp, idx) => (
                    <div key={exp.id || idx} className="bg-gradient-to-br from-emerald-50 to-amber-50/30 rounded-xl p-4 border border-emerald-100">
                      <h3 className="text-sm font-bold text-emerald-900">
                        {exp.position_bn || exp.position_en}
                      </h3>
                      {(exp.organization_bn || exp.organization_en) && (
                        <p className="text-xs text-emerald-600 font-medium mt-1">
                          {exp.organization_bn || exp.organization_en}
                        </p>
                      )}
                      {(exp.start_date || exp.end_date || exp.is_current) && (
                        <p className="text-xs text-gray-400 mt-1">
                          {exp.start_date}{exp.end_date ? ` — ${exp.end_date}` : exp.is_current ? " — বর্তমান" : ""}
                        </p>
                      )}
                      {exp.responsibilities_bn && (
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed">{exp.responsibilities_bn}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* ── Achievements ── */}
          {achievements.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/60 p-6 md:p-8">
              <Section title="অর্জন ও পুরস্কার" icon={<Award className="w-5 h-5" />} id="achievements">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((ach, idx) => (
                    <div key={ach.id || idx} className="bg-gradient-to-br from-amber-50 to-yellow-50/50 rounded-xl p-4 border border-amber-100 text-center">
                      {ach.image_url && (
                        <img src={ach.image_url} alt={ach.title_bn || ""} className="w-16 h-16 object-cover rounded-lg mx-auto mb-3 shadow-sm" />
                      )}
                      {!ach.image_url && (
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                          <Award className="w-6 h-6 text-amber-600" />
                        </div>
                      )}
                      <h3 className="text-sm font-bold text-gray-900">{ach.title_bn || ach.title_en}</h3>
                      {ach.year && (
                        <p className="text-xs text-amber-600 font-medium mt-1">{ach.year}</p>
                      )}
                      {ach.description_bn && (
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed">{ach.description_bn}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* ── Chairman's Message ── */}
          {profile.message_bn && (
            <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-2xl shadow-xl p-6 md:p-8 text-white relative overflow-hidden">
              {/* Islamic pattern overlay */}
              <div className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
              />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-amber-400/30 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-amber-300" />
                  </div>
                  <h2 className="text-xl font-bold text-amber-300">চেয়ারম্যানের বাণী</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-amber-400/40 to-transparent" />
                </div>
                <blockquote className="relative">
                  <span className="absolute -top-3 -left-2 text-6xl text-amber-400/20 font-serif leading-none">&ldquo;</span>
                  <p className="text-white/90 leading-8 text-base pl-4 relative z-10 whitespace-pre-wrap">{profile.message_bn}</p>
                  <span className="absolute -bottom-8 right-2 text-6xl text-amber-400/20 font-serif leading-none">&rdquo;</span>
                </blockquote>
                {profile.signature_url && (
                  <div className="mt-8 flex justify-end">
                    <img src={profile.signature_url} alt="Signature" className="h-10 object-contain opacity-70 brightness-200" />
                  </div>
                )}
                <div className="mt-6 flex items-center gap-3">
                  {profile.photo_url && (
                    <img src={profile.photo_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-amber-400/30" />
                  )}
                  <div>
                    <p className="text-white font-semibold text-sm">{profile.name_bn || profile.name_en}</p>
                    <p className="text-amber-300/80 text-xs">{profile.designation_bn || "চেয়ারম্যান"} — রহিমা জান্নাত মহিলা মাদ্রাসা</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Contact Information ── */}
          {(profile.phone_primary || profile.email || profile.office_address_bn) && (
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/60 p-6 md:p-8">
              <Section title="যোগাযোগ" icon={<Phone className="w-5 h-5" />} id="contact">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.phone_primary && (
                    <a href={`tel:${profile.phone_primary}`} className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 hover:border-emerald-300 transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                        <Phone className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">প্রাথমিক মোবাইল</p>
                        <p className="text-sm font-bold text-emerald-900">{profile.phone_primary}</p>
                      </div>
                    </a>
                  )}
                  {profile.phone_secondary && (
                    <a href={`tel:${profile.phone_secondary}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">দ্বিতীয় ফোন</p>
                        <p className="text-sm font-bold text-gray-800">{profile.phone_secondary}</p>
                      </div>
                    </a>
                  )}
                  {profile.whatsapp && (
                    <a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100 hover:border-green-200 transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-green-700" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">WhatsApp</p>
                        <p className="text-sm font-bold text-green-900">{profile.whatsapp}</p>
                      </div>
                    </a>
                  )}
                  {profile.email && (
                    <a href={`mailto:${profile.email}`} className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">ইমেইল</p>
                        <p className="text-sm font-bold text-blue-900 break-all">{profile.email}</p>
                      </div>
                    </a>
                  )}
                  {profile.office_hours && (
                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">অফিস সময়</p>
                        <p className="text-sm font-semibold text-amber-900">{profile.office_hours}</p>
                      </div>
                    </div>
                  )}
                  {profile.office_address_bn && (
                    <div className="flex items-start gap-3 p-4 bg-teal-50 rounded-xl border border-teal-100 sm:col-span-2">
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-5 h-5 text-teal-700" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-400">অফিস ঠিকানা</p>
                        <p className="text-sm font-semibold text-teal-900">{profile.office_address_bn}</p>
                        {profile.google_maps_link && (
                          <a href={profile.google_maps_link} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline flex items-center gap-1 mt-1">
                            <ExternalLink className="w-3 h-3" /> Google Maps-এ দেখুন
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            </div>
          )}

          {/* ── Documents ── */}
          {documents.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/60 p-6 md:p-8">
              <Section title="পাবলিক ডকুমেন্ট" icon={<FileText className="w-5 h-5" />} id="documents">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documents.map((doc, idx) => (
                    <a
                      key={doc.id || idx}
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-emerald-50 rounded-xl border border-gray-200 hover:border-emerald-200 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                        <FileText className="w-5 h-5 text-red-600 group-hover:text-emerald-700 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{doc.title_bn || doc.title_en}</p>
                        {doc.title_en && doc.title_bn && <p className="text-xs text-gray-400 truncate">{doc.title_en}</p>}
                      </div>
                      <Download className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 transition-colors flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* ── QR + Visiting Card Footer ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/60 p-6 md:p-8 print:hidden">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* QR code */}
              <div className="flex flex-col items-center gap-3">
                <QRCode url={CANONICAL_URL} size={140} />
                <p className="text-xs text-gray-500 text-center">এই QR কোডটি স্ক্যান করুন বা শেয়ার করুন</p>
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(CANONICAL_URL)}&format=png&margin=10&color=0c4a2b`}
                  download="chairman-qr.png"
                  className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> QR কোড ডাউনলোড
                </a>
              </div>

              {/* Institution card */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-900 flex items-center justify-center text-white text-lg font-bold">র</div>
                  <div>
                    <p className="text-base font-bold text-emerald-900" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>রহিমা জান্নাত মহিলা মাদ্রাসা</p>
                    <p className="text-xs text-gray-500">Rahima Jannat Mohila Madrasah</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-1">🌐 <a href="https://rjmm.edu.bd" className="text-emerald-600 hover:underline">rjmm.edu.bd</a></p>
                {profile.office_address_bn && (
                  <p className="text-xs text-gray-500">📍 {profile.office_address_bn}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                  {profile.phone_primary && (
                    <a href={`tel:${profile.phone_primary}`} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors">
                      📞 {profile.phone_primary}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ PRINT STYLESHEET ════════════════════════════════ */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; font-size: 12px; }
          .rounded-2xl { border-radius: 8px !important; }
          .shadow-xl, .shadow-sm { box-shadow: none !important; }
          @page { size: A4; margin: 15mm; }
        }
      `}</style>
    </div>
  );
}

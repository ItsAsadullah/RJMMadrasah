"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Loader2, Save, School, UploadCloud, User, FileText, 
  RefreshCw, AlertTriangle, CheckCircle, Printer, Download, X, 
  MapPin, CheckCircle2, ChevronRight, GraduationCap, Users, Shield, ArrowLeft, Edit
} from "lucide-react";
import { divisions, districts, upazilas, unions } from "@/data/bangladesh-data";
import { differenceInYears, differenceInMonths, differenceInDays } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import StudentPrintProfile from "@/components/dashboard/StudentPrintProfile";

// --- কনফিগারেশন ---
const CLOUD_NAME = "dfo1slmdy"; 
const UPLOAD_PRESET = "rahima_preset"; 
const DRAFT_KEY = "admission_form_draft";

// --- কনস্ট্যান্টস ---
const occupations = ["শিক্ষক", "কৃষক", "ব্যবসায়ী", "চাকরিজীবী", "প্রবাসী", "গৃহিণী", "ডাক্তার", "ইঞ্জিনিয়ার", "ইমাম", "চালক", "শ্রমিক", "দিনমজুর", "অন্যান্য"];
const relations = ["পিতা", "মাতা", "চাচা", "চাচী", "মামা", "মামী", "খালা", "খালু", "ফুফা", "ফুফু", "দাদা", "দাদী", "নানা", "নানী", "ভাই", "বোন", "অন্যান্য"];
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const years = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i);

// --- কম্পোনেন্টস ---
const SectionHeader = ({ icon: Icon, title, step }: { icon: any, title: string, step: string }) => (
  <div className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-5">
    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 font-bold text-xs shadow-sm ring-2 ring-white">
      {step}
    </div>
    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
      <Icon className="w-4 h-4 text-green-600" /> {title}
    </h3>
  </div>
);

const InputGroup = ({ label, name, value, onChange, onBlur, type = "text", placeholder = "", required = false, readOnly = false, error, className = "" }: any) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="block text-sm font-semibold text-slate-700 flex justify-between">
      <span>{label} {required && <span className="text-red-500">*</span>}</span>
    </label>
    <div className="relative">
      <input 
        type={type} name={name} required={required} readOnly={readOnly}
        value={value || ""} onChange={onChange} onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full h-11 px-4 rounded-lg border text-sm transition-all duration-200 ease-in-out
          ${error 
            ? 'border-red-300 ring-1 ring-red-100 focus:border-red-500 focus:ring-red-200' 
            : 'border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-100'
          }
          ${readOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-900'}
        `} 
      />
    </div>
    {error && <p className="text-xs text-red-500 font-medium flex items-center gap-1 animate-in slide-in-from-top-1"><AlertTriangle className="w-3 h-3" /> {error}</p>}
  </div>
);

const SelectGroup = ({ label, name, value, onChange, options = [], required = false }: any) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-slate-700">{label} {required && <span className="text-red-500">*</span>}</label>
    <div className="relative">
      <select 
        name={name} value={value || ""} onChange={onChange} required={required} 
        className="w-full h-11 px-4 border border-slate-300 rounded-md bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 appearance-none cursor-pointer"
      >
        <option value="">নির্বাচন করুন</option>
        {Array.isArray(options) && options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <ChevronRight className="w-4 h-4 rotate-90" />
      </div>
    </div>
  </div>
);

const PhoneInput = ({ label, name, value, onChange, onBlur, required = false, error }: any) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-slate-700">{label} {required && <span className="text-red-500">*</span>}</label>
    <div className={`flex h-11 rounded-lg border overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-green-100 focus-within:border-green-500 bg-white
      ${error ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-300'}
    `}>
      <span className="bg-slate-100 px-3 flex items-center text-slate-600 font-bold border-r border-slate-300 text-sm">01</span>
      <input 
        type="text" name={name} required={required} maxLength={9}
        value={value || ""} onChange={onChange} onBlur={onBlur}
        placeholder="XXXXXXXXX"
        className="flex-1 px-3 border-none focus:ring-0 outline-none w-full bg-white text-slate-900 placeholder-slate-400 text-sm" 
      />
    </div>
    {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
  </div>
);

const compressImage = (file: File, quality = 0.7, width = 800): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement("img");
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const scaleFactor = width / img.width;
          canvas.width = width;
          canvas.height = img.height * scaleFactor;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
            else resolve(file);
          }, "image/jpeg", quality);
        };
      };
    });
  };

export default function PublicAdmissionPage() {
  const [viewState, setViewState] = useState<'form' | 'preview' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);
  const [generatedID, setGeneratedID] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [duplicateStudent, setDuplicateStudent] = useState<any>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);
  const [finalStudentData, setFinalStudentData] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  const [dobState, setDobState] = useState({ day: "", month: "", year: "" });

  // Academic Data States
  const [dbBranches, setDbBranches] = useState<any[]>([]);
  const [dbDepartments, setDbDepartments] = useState<any[]>([]);
  const [dbClasses, setDbClasses] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    branch_id: "1", department: "", class_name: "", academic_year: new Date().getFullYear().toString(),
    residential_status: "residential", status: "pending", guardian_type: "", 
    name_bn: "", name_en: "", dob: "", age_info: "", birth_reg_no: "", blood_group: "", photo_url: "", birth_cert_url: "",
    father_alive: "yes", father_name_bn: "", father_name_en: "", father_nid: "", father_occupation: "", father_mobile: "", father_nid_url: "", father_photo_url: "",
    mother_alive: "yes", mother_name_bn: "", mother_name_en: "", mother_nid: "", mother_occupation: "", mother_mobile: "", mother_nid_url: "", mother_photo_url: "",
    guardian_name: "", guardian_relation: "", guardian_mobile: "", guardian_nid: "", guardian_photo_url: "",
    present_division: "", present_district: "", present_upazila: "", present_union: "", present_village: "", present_postcode: "",
    perm_division: "", perm_district: "", perm_upazila: "", perm_union: "", perm_village: "", perm_postcode: "",
  });

  useEffect(() => { setIsClient(true); }, []);

  // --- একাডেমিক ডাটা ফেচ ---
  useEffect(() => {
    const fetchAcademicData = async () => {
      try {
        const { data: b } = await supabase.from("branches").select("id, name");
        const { data: d } = await supabase.from("departments").select("id, name, branch_id");
        const { data: c } = await supabase.from("academic_classes").select("id, name, branch_id, department_id, allow_residential");

        if (b) setDbBranches(b);
        if (d) setDbDepartments(d);
        if (c) setDbClasses(c);
      } catch (error) {
        console.error("Error fetching academic data:", error);
      }
    };
    fetchAcademicData();
  }, []);

  // --- ড্রাফট লোড ---
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
        try {
            const parsed = JSON.parse(savedDraft);
            setFormData(parsed);
            if (parsed.dob) {
                const [y, m, d] = parsed.dob.split('-');
                if (y && m && d) setDobState({ day: parseInt(d).toString(), month: months[parseInt(m) - 1], year: y });
            }
        } catch (e) { console.error("Draft load failed", e); }
    }
    // Initial fetch inside try-catch to avoid crashing on network error
    generateID().catch(e => console.error("ID gen error", e));
  }, []);

  // --- ড্রাফট সেভ ---
  useEffect(() => {
      if (viewState === 'form') {
          const timeout = setTimeout(() => { localStorage.setItem(DRAFT_KEY, JSON.stringify(formData)); }, 1000);
          return () => clearTimeout(timeout);
      }
  }, [formData, viewState]);

  const generateID = async (): Promise<string> => {
    const yearPrefix = formData.academic_year.slice(-2);
    try {
      const { data: maxIdData, error } = await supabase
        .from('students')
        .select('student_id')
        .eq('academic_year', parseInt(formData.academic_year))
        .order('student_id', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextSerial = 1;
      if (maxIdData && maxIdData.length > 0 && maxIdData[0].student_id) {
          const lastId = maxIdData[0].student_id;
          const lastSerial = parseInt(lastId.substring(2)); 
          if (!isNaN(lastSerial)) nextSerial = lastSerial + 1;
      }
      const newID = `${yearPrefix}${nextSerial.toString().padStart(4, '0')}`;
      setGeneratedID(newID);
      return newID;
    } catch (err) {
      console.error("Failed to generate ID:", err);
      // Fallback ID generation if DB fails (timestamp based to avoid conflict)
      const fallbackID = `${yearPrefix}${Math.floor(Math.random() * 9000) + 1000}`;
      setGeneratedID(fallbackID);
      return fallbackID;
    }
  };

  useEffect(() => { generateID().catch(e => console.error(e)); }, [formData.academic_year]);

  // স্মার্ট অটোফিল
  useEffect(() => {
    if (formData.guardian_type === 'father') {
      setFormData(prev => ({ ...prev, guardian_name: prev.father_name_bn, guardian_mobile: prev.father_mobile, guardian_relation: "পিতা", guardian_nid: prev.father_nid }));
    } else if (formData.guardian_type === 'mother') {
      setFormData(prev => ({ ...prev, guardian_name: prev.mother_name_bn, guardian_mobile: prev.mother_mobile, guardian_relation: "মাতা", guardian_nid: prev.mother_nid }));
    }
  }, [formData.guardian_type, formData.father_name_bn, formData.father_mobile, formData.father_nid, formData.mother_name_bn, formData.mother_mobile, formData.mother_nid]);

  useEffect(() => {
    if (dobState.day && dobState.month && dobState.year) {
      const monthIndex = months.indexOf(dobState.month);
      const dateObj = new Date(parseInt(dobState.year), monthIndex, parseInt(dobState.day));
      const formattedDate = `${dobState.year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dobState.day).padStart(2, '0')}`;
      const today = new Date();
      const diffYears = differenceInYears(today, dateObj);
      const diffMonths = differenceInMonths(today, dateObj) % 12;
      const diffDays = differenceInDays(today, dateObj) % 30;
      setFormData(prev => ({ ...prev, dob: formattedDate, age_info: `${diffYears} বছর ${diffMonths} মাস ${diffDays} দিন` }));
    }
  }, [dobState]);

  // --- Strict Validation ---
  const validateMobile = (e: React.FocusEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (!val) return;
      if (val.length !== 9 || !/^[3-9]\d{8}$/.test(val)) {
          setErrors(prev => ({...prev, [e.target.name]: "ইনভ্যালিড নম্বর (01 এর পর ৩-৯ দিয়ে শুরু)"}));
      } else {
          setErrors(prev => ({...prev, [e.target.name]: ""}));
      }
  };

  const validateNID = (e: React.FocusEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (!val) return;
      if (![10, 13, 17].includes(val.length)) {
          setErrors(prev => ({...prev, [e.target.name]: "এনআইডি ১০, ১৩ বা ১৭ ডিজিট হতে হবে"}));
      } else {
          setErrors(prev => ({...prev, [e.target.name]: ""}));
      }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if ((name.includes("mobile") || name.includes("nid") || name.includes("reg_no")) && isNaN(Number(value))) return;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (sameAddress && name.startsWith("present_")) updated[`perm_${name.replace("present_", "")}` as keyof typeof formData] = value;
      return updated;
    });

    if (name === "present_division") setFormData(prev => ({ ...prev, present_division: value, present_district: "", present_upazila: "", present_union: "" }));
    if (name === "present_district") setFormData(prev => ({ ...prev, present_district: value, present_upazila: "", present_union: "" }));
    if (name === "present_upazila") setFormData(prev => ({ ...prev, present_upazila: value, present_union: "" }));
    
    if (name === "perm_division") setFormData(prev => ({ ...prev, perm_division: value, perm_district: "", perm_upazila: "", perm_union: "" }));
    if (name === "perm_district") setFormData(prev => ({ ...prev, perm_district: value, perm_upazila: "", perm_union: "" }));
    if (name === "perm_upazila") setFormData(prev => ({ ...prev, perm_upazila: value, perm_union: "" }));

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSameAddressToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSameAddress(e.target.checked);
    if (e.target.checked) {
      setFormData(prev => ({ 
          ...prev, 
          perm_division: prev.present_division, perm_district: prev.present_district, perm_upazila: prev.present_upazila, 
          perm_union: prev.present_union, perm_village: prev.present_village, perm_postcode: prev.present_postcode 
      }));
    }
  };

  const handleCloudinaryUpload = async (file: File, fieldName: string) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.secure_url) setFormData(prev => ({ ...prev, [fieldName]: data.secure_url }));
    } catch (error) { alert("আপলোড ব্যর্থ হয়েছে!"); }
    setUploading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    let file = e.target.files[0];
    if (file.type.startsWith('image/')) {
       const size = fieldName === 'photo_url' ? 300 : 1000;
       file = await compressImage(file, 0.7, size); 
    }
    await handleCloudinaryUpload(file, fieldName);
  };

  const checkDuplicateStudent = async (e: React.FocusEvent<HTMLInputElement>) => {
    const regNo = e.target.value;
    if (regNo.length !== 17) {
        setErrors(prev => ({...prev, birth_reg_no: "জন্ম সনদ ১৭ ডিজিটের হতে হবে"}));
        return;
    }
    try {
      const { data } = await supabase.from('students').select('name_bn').eq('birth_reg_no', regNo).maybeSingle();
      if (data) {
          setDuplicateStudent(data);
          setErrors(prev => ({...prev, birth_reg_no: "এই নম্বর দিয়ে ইতিমধ্যে আবেদন করা হয়েছে!"}));
          setShowDuplicateModal(true);
      } else {
          setDuplicateStudent(null);
      }
    } catch(err) {
      console.error("Duplicate check failed", err);
    }
  };

  const getUnionOptions = (upazila: string) => {
      if (upazila && unions[upazila]) { return unions[upazila]; }
      return [];
  };

  const handleReview = (e: React.FormEvent) => {
      e.preventDefault();
      if (duplicateStudent) return alert("ডুপ্লিকেট শিক্ষার্থী!");
      if (Object.values(errors).some(e => e)) return alert("অনুগ্রহ করে এররগুলো সংশোধন করুন।");
      if (!formData.name_bn || !formData.guardian_mobile || !formData.dob) return alert("আবশ্যকীয় তথ্য দিন।");

      setViewState('preview');
      window.scrollTo(0, 0);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    let attempts = 0;
    let success = false;
    let finalID = "";

    while (!success && attempts < 3) {
      try {
        finalID = await generateID();
        const payload = {
          ...formData,
          dob: formData.dob || null, 
          student_id: finalID, 
          branch_id: parseInt(formData.branch_id),
          academic_year: parseInt(formData.academic_year),
          father_alive: formData.father_alive === "yes",
          mother_alive: formData.mother_alive === "yes",
          father_mobile: formData.father_mobile ? "01" + formData.father_mobile : "",
          mother_mobile: formData.mother_mobile ? "01" + formData.mother_mobile : "",
          guardian_mobile: formData.guardian_mobile ? "01" + formData.guardian_mobile : "",
          status: "pending" 
        };
        
        const { data, error } = await supabase.from("students").insert([payload]).select();
        
        if (error) {
           if (error.code === '23505') { 
               attempts++;
               continue; 
           }
           throw error;
        }

        setCreatedStudentId(data?.[0]?.id);
        setFinalStudentData({ ...payload, created_at: new Date().toISOString() });
        localStorage.removeItem(DRAFT_KEY); 
        success = true;
        setViewState('success');
        setShowSuccessModal(true);
      } catch (e: any) {
        console.error("Submission error:", e);
        if (attempts === 2) alert("সার্ভারে সমস্যা হচ্ছে, অনুগ্রহ করে পরে চেষ্টা করুন।");
        break;
      }
    }
    setLoading(false);
  };

  // Download ID Card Image
  const downloadIDCard = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600; canvas.height = 360;
    const ctx = canvas.getContext("2d");
    if(ctx) {
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0,0, 600, 360);
        ctx.fillStyle = "#15803d"; ctx.fillRect(0,0, 600, 90);
        ctx.fillStyle = "#ffffff"; ctx.font = "bold 32px Arial"; ctx.textAlign = "center";
        ctx.fillText("Rahima Jannat Madrasa", 300, 45);
        ctx.font = "18px Arial"; 
        ctx.fillText(formData.branch_id === "1" ? "Holidhani Branch" : "Chanduali Branch", 300, 75);
        ctx.fillStyle = "#000000"; ctx.textAlign = "left"; ctx.font = "bold 22px Arial";
        ctx.fillText(`Name: ${formData.name_en || formData.name_bn}`, 30, 130);
        ctx.fillText(`Class: ${formData.class_name}`, 30, 165);
        ctx.fillStyle = "#f3f4f6"; ctx.fillRect(100, 190, 400, 100);
        ctx.strokeStyle = "#166534"; ctx.strokeRect(100, 190, 400, 100);
        ctx.fillStyle = "#166534"; ctx.font = "bold 14px Arial";
        ctx.fillText("USER ID", 120, 220); ctx.fillText("PASSWORD", 120, 260);
        ctx.textAlign = "right"; ctx.fillStyle = "#000000"; ctx.font = "bold 24px Courier New";
        ctx.fillText(generatedID, 480, 220); ctx.fillText(`01${formData.guardian_mobile}`, 480, 260);
        const link = document.createElement('a'); link.download = `ID_${generatedID}.jpg`; link.href = canvas.toDataURL("image/jpeg"); link.click();
    }
  };

  const handlePrintCard = () => {
    document.body.classList.add('print-id-card');
    window.print();
    // Firefox often needs a small delay or manual removal
    setTimeout(() => {
       document.body.classList.remove('print-id-card');
    }, 1000);
  };

  const handlePrintFullForm = () => {
    document.body.classList.add('print-full-form');
    window.print();
    setTimeout(() => {
       document.body.classList.remove('print-full-form');
    }, 1000);
  };

  // --- RENDER LOGIC ---

  if (viewState === 'success' && finalStudentData) {
      return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 flex flex-col items-center justify-center">
             <div id="wrapper-no-print" className="bg-white p-8 text-center flex flex-col items-center rounded-2xl shadow-xl border border-green-200 mb-8 max-w-md w-full">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4"><CheckCircle className="w-8 h-8 text-green-600"/></div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">আবেদন সফল হয়েছে!</h2>
                
                {/* ID Card Display */}
                <div id="id-card-print-area" className="w-full bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200 mt-4 relative">
                    <div className="bg-green-700 text-white p-4">
                        <h3 className="text-lg font-bold">Rahima Jannat Madrasa</h3>
                        <div className="flex justify-between text-[10px] opacity-80 mt-1">
                            <span>{dbBranches.find(b => b.id.toString() === formData.branch_id)?.name}</span>
                            <span>PROVISIONAL ID</span>
                        </div>
                    </div>
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800">{formData.name_bn}</h3>
                        <p className="text-sm font-medium text-gray-500">{formData.class_name}</p>
                        <div className="mt-4 bg-slate-50 p-3 rounded text-left border border-slate-100">
                            <p className="text-xs text-gray-500 mb-1">USER ID: <span className="font-bold text-black text-sm">{generatedID}</span></p>
                            <p className="text-xs text-gray-500">PASSWORD: <span className="font-bold text-black text-sm">01{formData.guardian_mobile}</span></p>
                        </div>
                    </div>
                    <div className="p-2 bg-yellow-50 border-t border-yellow-100 text-[10px] text-yellow-800 font-bold text-center">
                        এটি সংরক্ষণ করে রাখুন। পরবর্তীতে স্টুডেন্ট প্যানেল এ লগইন এবং রেজাল্ট দেখতে এটি প্রয়োজন হবে।
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full mt-6">
                    <Button variant="outline" className="w-full border-green-600 text-green-700 hover:bg-green-50" onClick={downloadIDCard}>
                        <Download className="w-4 h-4 mr-2" /> ছবি সেভ
                    </Button>
                    <Button className="w-full bg-green-700 hover:bg-green-800 text-white" onClick={handlePrintCard}>
                        <Printer className="w-4 h-4 mr-2" /> কার্ড প্রিন্ট
                    </Button>
                </div>
                
                <div className="w-full mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 cursor-pointer hover:bg-blue-100 transition-colors group" onClick={handlePrintFullForm}>
                    <div className="flex flex-col items-center gap-1">
                        <div className="bg-white p-2 rounded-full shadow-sm text-blue-600 mb-1 group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6" />
                        </div>
                        <span className="text-blue-700 font-bold text-sm">আবেদন ফরম প্রিন্ট করুন</span>
                        <span className="text-[10px] text-blue-400">অথবা PDF হিসেবে সেভ করুন</span>
                    </div>
                </div>

                <Button variant="ghost" onClick={() => window.location.reload()} className="mt-4 text-gray-500 text-xs">হোম পেজে ফিরে যান</Button>
            </div>
            
            {/* Hidden Print Component */}
            <div id="full-form-print-area" className="fixed top-0 left-0 w-0 h-0 overflow-hidden print:static print:w-full print:h-auto print:overflow-visible">
                 <StudentPrintProfile student={finalStudentData} />
            </div>
        </div>
      );
  }

  if (viewState === 'preview') {
      return (
          <div className="min-h-screen bg-gray-100 py-10 flex flex-col items-center">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6 max-w-2xl text-center">
                  <h3 className="text-lg font-bold text-yellow-800 flex items-center justify-center gap-2"><AlertTriangle className="w-5 h-5"/> আবেদন যাচাই করুন</h3>
                  <p className="text-sm text-yellow-700">নিচে আপনার পূরণকৃত তথ্য দেখানো হচ্ছে। সব ঠিক থাকলে "চূড়ান্ত সাবমিট" করুন।</p>
              </div>
              <div className="scale-75 origin-top border shadow-2xl mb-8 bg-white"><StudentPrintProfile student={{...formData, created_at: new Date().toISOString()}} /></div>
              <div className="fixed bottom-0 left-0 w-full bg-white p-4 border-t shadow-lg flex justify-center gap-4 z-50">
                  <Button variant="outline" onClick={() => setViewState('form')} className="px-8 border-gray-400"><Edit className="w-4 h-4 mr-2"/> এডিট করুন</Button>
                  <Button onClick={handleFinalSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-8 font-bold">{loading ? <Loader2 className="animate-spin mr-2"/> : <><CheckCircle className="w-4 h-4 mr-2"/> চূড়ান্ত সাবমিট করুন</>}</Button>
              </div>
          </div>
      );
  }

  // --- FORM VIEW ---
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6 pb-10">
        
        <Link href="/admission" className="inline-flex items-center text-gray-500 hover:text-green-600 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> ফিরে যান
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-8 rounded-2xl shadow-lg border border-green-500 flex flex-col md:flex-row justify-between items-center gap-4 text-white">
            <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
                <School className="w-8 h-8 text-yellow-300" /> অনলাইন ভর্তি ফরম
            </h1>
            <p className="text-green-100 mt-2 opacity-90">সঠিক তথ্য দিয়ে ফরমটি পূরণ করুন। (* চিহ্নিত ঘরগুলো বাধ্যতামূলক)</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20 text-center">
            <p className="text-[10px] text-green-200 font-bold uppercase tracking-wider mb-1">শিক্ষাবর্ষ</p>
            <div className="text-3xl font-black">{formData.academic_year}</div>
            </div>
        </div>

        <form onSubmit={handleReview} className="space-y-8">
            {/* ১. একাডেমিক */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
                <SectionHeader icon={GraduationCap} title="একাডেমিক তথ্য" step="১" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">শাখা <span className="text-red-500">*</span></label>
                        <select name="branch_id" value={formData.branch_id} onChange={(e) => setFormData({...formData, branch_id: e.target.value, department: "", class_name: ""})} className="w-full h-11 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all">
                            <option value="">সিলেক্ট করুন</option>
                            {dbBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">বিভাগ <span className="text-red-500">*</span></label>
                        <select name="department" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value, class_name: ""})} required className="w-full h-11 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all">
                            <option value="">সিলেক্ট করুন</option>
                            {dbDepartments.filter(d => String(d.branch_id) === formData.branch_id).map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">শ্রেণি <span className="text-red-500">*</span></label>
                        <select name="class_name" value={formData.class_name} onChange={handleChange} required className="w-full h-11 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all">
                            <option value="">সিলেক্ট করুন</option>
                            {dbClasses.filter(c => {
                                const dept = dbDepartments.find(d => d.name === formData.department && String(d.branch_id) === formData.branch_id);
                                return String(c.branch_id) === formData.branch_id && c.department_id === dept?.id;
                            }).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">আবাসন <span className="text-red-500">*</span></label>
                        <select name="residential_status" value={formData.residential_status} onChange={handleChange} required className="w-full h-11 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all">
                            <option value="non_residential">অনাবাসিক</option>
                            {(() => {
                                const selectedClass = dbClasses.find(c => c.name === formData.class_name && String(c.branch_id) === formData.branch_id);
                                return selectedClass?.allow_residential ? <option value="residential">আবাসিক</option> : null;
                            })()}
                        </select>
                    </div>
                </div>
            </div>

            {/* ২. শিক্ষার্থী */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                <SectionHeader icon={User} title="শিক্ষার্থীর ব্যক্তিগত তথ্য" step="২" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="নাম (বাংলায়)" name="name_bn" value={formData.name_bn} onChange={handleChange} required placeholder="উদাঃ আয়েশা সিদ্দিকা" />
                        <InputGroup label="Name (English)" name="name_en" value={formData.name_en} onChange={handleChange} placeholder="e.g. Ayesha Siddika" />
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputGroup label="জন্ম সনদ (১৭ ডিজিট)" name="birth_reg_no" value={formData.birth_reg_no} onChange={handleChange} onBlur={checkDuplicateStudent} error={errors.birth_reg_no} required placeholder="জন্ম সনদ নম্বর দিন" />
                            <div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">জন্ম তারিখ</label><div className="flex gap-2"><select className="border border-slate-300 rounded-lg h-11 px-2 bg-white w-full focus:outline-none focus:ring-2 focus:ring-green-500" value={dobState.day} onChange={(e) => setDobState({...dobState, day: e.target.value})}><option>D</option>{days.map(d => <option key={d} value={d}>{d}</option>)}</select><select className="border border-slate-300 rounded-lg h-11 px-2 bg-white w-full focus:outline-none focus:ring-2 focus:ring-green-500" value={dobState.month} onChange={(e) => setDobState({...dobState, month: e.target.value})}><option>M</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select><select className="border border-slate-300 rounded-lg h-11 px-2 bg-white w-full focus:outline-none focus:ring-2 focus:ring-green-500" value={dobState.year} onChange={(e) => setDobState({...dobState, year: e.target.value})}><option>Y</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>
                            <SelectGroup label="রক্তের গ্রুপ" name="blood_group" value={formData.blood_group} onChange={handleChange} options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]} />
                        </div>
                    </div>
                    {/* ফটো আপলোড */}
                    <div className="lg:col-span-4 flex flex-row gap-4 h-32">
                        <div className="flex-1 w-[128px] h-[128px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center relative bg-slate-50 hover:bg-slate-100 cursor-pointer group overflow-hidden">
                            {formData.photo_url ? <Image src={formData.photo_url} alt="Profile" fill className="object-cover rounded-xl" /> : <div className="text-center text-xs text-slate-500"><User className="w-6 h-6 mx-auto mb-1 group-hover:text-blue-500" />ছবি দিন</div>}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'photo_url')} accept="image/*" />
                        </div>
                        <div className="flex-1 w-[128px] h-[128px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center relative bg-slate-50 hover:bg-slate-100 cursor-pointer group overflow-hidden">
                            {formData.birth_cert_url ? <div className="text-center text-green-600 text-xs font-bold">আপলোড আছে</div> : <div className="text-center text-xs text-slate-500"><FileText className="w-6 h-6 mx-auto mb-1 group-hover:text-green-500" />সনদ দিন</div>}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'birth_cert_url')} accept="image/*,.pdf" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ৩. পিতা-মাতা */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
                <SectionHeader icon={Users} title="পিতা ও মাতার তথ্য" step="৩" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* পিতা */}
                     <div className="space-y-4 p-5 bg-blue-50/30 rounded-2xl border border-blue-100">
                         <h4 className="font-bold text-blue-700 flex justify-between">পিতার তথ্য <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-blue-200 text-blue-600">Father</span></h4>
                         <div className="grid grid-cols-2 gap-4"><InputGroup label="নাম" name="father_name_bn" value={formData.father_name_bn} onChange={handleChange} /><InputGroup label="Name (En)" name="father_name_en" value={formData.father_name_en} onChange={handleChange} /></div>
                         <SelectGroup label="পেশা" name="father_occupation" value={formData.father_occupation} onChange={handleChange} options={occupations} />
                         <div className="grid grid-cols-2 gap-4"><PhoneInput label="মোবাইল" name="father_mobile" value={formData.father_mobile} onChange={handleChange} onBlur={validateMobile} error={errors.father_mobile} /><InputGroup label="NID" name="father_nid" value={formData.father_nid} onChange={handleChange} onBlur={validateNID} error={errors.father_nid} /></div>
                         <div className="grid grid-cols-2 gap-2 mt-2">
                             <div className="relative border bg-white rounded p-2 text-center h-10 flex items-center justify-center cursor-pointer hover:bg-slate-50 text-xs overflow-hidden">
                                 {formData.father_photo_url ? <Image src={formData.father_photo_url} alt="F" fill className="object-cover opacity-50" /> : <span className="font-bold flex gap-1"><User className="w-3 h-3"/> ছবি</span>}
                                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={(e) => handleFileUpload(e, 'father_photo_url')} accept="image/*" />
                                 {formData.father_photo_url && <CheckCircle2 className="w-4 h-4 text-green-600 absolute top-1 right-1 z-30"/>}
                             </div>
                             <div className="relative border bg-white rounded p-2 text-center h-10 flex items-center justify-center cursor-pointer hover:bg-slate-50 text-xs overflow-hidden">
                                 {formData.father_nid_url ? <Image src={formData.father_nid_url} alt="ID" fill className="object-cover opacity-50" /> : <span className="font-bold flex gap-1"><FileText className="w-3 h-3"/> আইডি</span>}
                                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'father_nid_url')} accept="image/*,.pdf" />
                                 {formData.father_nid_url && <CheckCircle2 className="w-4 h-4 text-green-600 absolute top-1 right-1 z-30"/>}
                             </div>
                         </div>
                     </div>
                     {/* মাতা */}
                     <div className="space-y-4 p-5 bg-pink-50/30 rounded-2xl border border-pink-100">
                         <h4 className="font-bold text-pink-700 flex justify-between">মাতার তথ্য <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-pink-200">Mother</span></h4>
                         <div className="grid grid-cols-2 gap-4"><InputGroup label="নাম" name="mother_name_bn" value={formData.mother_name_bn} onChange={handleChange} /><InputGroup label="Name (En)" name="mother_name_en" value={formData.mother_name_en} onChange={handleChange} /></div>
                         <SelectGroup label="পেশা" name="mother_occupation" value={formData.mother_occupation} onChange={handleChange} options={occupations} />
                         <div className="grid grid-cols-2 gap-4"><PhoneInput label="মোবাইল" name="mother_mobile" value={formData.mother_mobile} onChange={handleChange} onBlur={validateMobile} error={errors.mother_mobile} /><InputGroup label="NID" name="mother_nid" value={formData.mother_nid} onChange={handleChange} onBlur={validateNID} error={errors.mother_nid} /></div>
                         <div className="grid grid-cols-2 gap-2 mt-2">
                             <div className="relative border bg-white rounded p-2 text-center h-10 flex items-center justify-center cursor-pointer hover:bg-slate-50 text-xs overflow-hidden">
                                 {formData.mother_photo_url ? <Image src={formData.mother_photo_url} alt="M" fill className="object-cover opacity-50" /> : <span className="font-bold flex gap-1"><User className="w-3 h-3"/> ছবি</span>}
                                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={(e) => handleFileUpload(e, 'mother_photo_url')} accept="image/*" />
                                 {formData.mother_photo_url && <CheckCircle2 className="w-4 h-4 text-green-600 absolute top-1 right-1 z-30"/>}
                             </div>
                             <div className="relative border bg-white rounded p-2 text-center h-10 flex items-center justify-center cursor-pointer hover:bg-slate-50 text-xs overflow-hidden">
                                 {formData.mother_nid_url ? <Image src={formData.mother_nid_url} alt="ID" fill className="object-cover opacity-50" /> : <span className="font-bold flex gap-1"><FileText className="w-3 h-3"/> আইডি</span>}
                                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'mother_nid_url')} accept="image/*,.pdf" />
                                 {formData.mother_nid_url && <CheckCircle2 className="w-4 h-4 text-green-600 absolute top-1 right-1 z-30"/>}
                             </div>
                         </div>
                     </div>
                </div>
            </div>

            {/* ৪. অভিভাবক */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-yellow-200 ring-2 ring-yellow-50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-400"></div>
                <SectionHeader icon={Shield} title="অভিভাবক (জরুরি)" step="৪" />
                <div className="mb-6 max-w-md">
                    <label className="block text-sm font-bold text-slate-700 mb-2">অভিভাবক নির্বাচন করুন *</label>
                    <select name="guardian_type" value={formData.guardian_type} onChange={(e) => setFormData({...formData, guardian_type: e.target.value})} className="w-full h-11 px-4 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400" required>
                        <option value="">নির্বাচন করুন</option><option value="father">পিতা</option><option value="mother">মাতা</option><option value="other">অন্যান্য</option>
                    </select>
                </div>
                {(formData.guardian_type === 'father' || formData.guardian_type === 'mother') && (
                  <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 flex items-center gap-6 text-sm animate-in fade-in">
                      <div className="flex-1 border-r border-yellow-200 pr-6"><p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">অভিভাবকের নাম</p><p className="text-lg font-bold text-slate-800">{formData.guardian_name || "..."}</p></div>
                      <div className="flex-1 border-r border-yellow-200 pr-6"><p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">সম্পর্ক</p><p className="text-lg font-bold text-slate-800">{formData.guardian_relation}</p></div>
                      <div className="flex-1"><p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">মোবাইল (পাসওয়ার্ড)</p><p className="text-2xl font-mono font-bold text-green-600">01{formData.guardian_mobile || "..."}</p></div>
                  </div>
                )}
                {formData.guardian_type === 'other' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <InputGroup label="নাম" name="guardian_name" value={formData.guardian_name} onChange={handleChange} required />
                        <SelectGroup label="সম্পর্ক" name="guardian_relation" value={formData.guardian_relation} onChange={handleChange} options={relations} required />
                        <PhoneInput label="মোবাইল" name="guardian_mobile" value={formData.guardian_mobile} onChange={handleChange} required error={errors.guardian_mobile} />
                        <InputGroup label="NID" name="guardian_nid" value={formData.guardian_nid} onChange={handleChange} />
                    </div>
                )}
            </div>

            {/* ৫. ঠিকানা */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-500"></div>
                <SectionHeader icon={MapPin} title="ঠিকানা" step="৫" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* বর্তমান - ইউনিয়ন ড্রপডাউন সহ */}
                    <div className="space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-2 mb-2">বর্তমান ঠিকানা</h4>
                        <SelectGroup label="বিভাগ" name="present_division" value={formData.present_division} onChange={handleChange} options={divisions} />
                        <div className="grid grid-cols-2 gap-4"><SelectGroup label="জেলা" name="present_district" value={formData.present_district} onChange={handleChange} options={formData.present_division ? districts[formData.present_division] : []} /><SelectGroup label="উপজেলা" name="present_upazila" value={formData.present_upazila} onChange={handleChange} options={formData.present_district ? upazilas[formData.present_district] : []} /></div>
                        
                        {/* স্মার্ট ইউনিয়ন (বর্তমান) */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">ইউনিয়ন/ওয়ার্ড</label>
                            {getUnionOptions(formData.present_upazila).length > 0 ? (
                                <select name="present_union" value={formData.present_union} onChange={handleChange} className="w-full h-11 px-4 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                                    <option value="">নির্বাচন করুন</option>
                                    {getUnionOptions(formData.present_upazila).map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            ) : (
                                <input type="text" name="present_union" value={formData.present_union} onChange={handleChange} placeholder="টাইপ করুন" className="w-full h-11 px-4 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4"><InputGroup label="গ্রাম/মহল্লা" name="present_village" value={formData.present_village} onChange={handleChange} /><InputGroup label="পোস্ট কোড" name="present_postcode" value={formData.present_postcode} onChange={handleChange} /></div>
                    </div>
                    
                    {/* স্থায়ী */}
                    <div className={`space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 relative ${sameAddress ? 'opacity-70 pointer-events-none' : ''}`}>
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2"><h4 className="font-bold text-slate-700">স্থায়ী ঠিকানা</h4><label className="flex items-center gap-2 text-xs font-bold cursor-pointer bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200 hover:bg-slate-50 pointer-events-auto"><input type="checkbox" checked={sameAddress} onChange={handleSameAddressToggle} className="accent-green-600 w-4 h-4" /> একই</label></div>
                        <SelectGroup label="বিভাগ" name="perm_division" value={formData.perm_division} onChange={handleChange} options={divisions} />
                        <div className="grid grid-cols-2 gap-4"><SelectGroup label="জেলা" name="perm_district" value={formData.perm_district} onChange={handleChange} options={formData.perm_division ? districts[formData.perm_division] : []} /><SelectGroup label="উপজেলা" name="perm_upazila" value={formData.perm_upazila} onChange={handleChange} options={formData.perm_district ? upazilas[formData.perm_district] : []} /></div>
                        
                        {/* স্থায়ী ইউনিয়ন */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">ইউনিয়ন/ওয়ার্ড</label>
                            {getUnionOptions(formData.perm_upazila).length > 0 ? (
                                <select name="perm_union" value={formData.perm_union} onChange={handleChange} className="w-full h-11 px-4 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                                    <option value="">নির্বাচন করুন</option>
                                    {getUnionOptions(formData.perm_upazila).map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            ) : (
                                <input type="text" name="perm_union" value={formData.perm_union} onChange={handleChange} placeholder="টাইপ করুন" className="w-full h-11 px-4 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4"><InputGroup label="গ্রাম/মহল্লা" name="perm_village" value={formData.perm_village} onChange={handleChange} /><InputGroup label="পোস্ট কোড" name="perm_postcode" value={formData.perm_postcode} onChange={handleChange} /></div>
                    </div>
                </div>
            </div>

            {/* সাবমিট */}
            <div className="flex justify-end pt-6">
                <Button type="submit" disabled={loading || uploading || !!duplicateStudent} className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white h-14 text-xl font-bold shadow-xl rounded-xl">
                    {loading ? <><Loader2 className="animate-spin mr-2" /> প্রসেসিং...</> : <><Save className="mr-2" /> সাবমিট এবং প্রিভিউ</>}
                </Button>
            </div>
        </form>

        {/* --- MODALS --- */}
        <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader><DialogTitle className="text-red-600 flex items-center gap-2"><AlertTriangle className="w-6 h-6" /> ডুপ্লিকেট শিক্ষার্থী!</DialogTitle><DialogDescription>এই জন্ম নিবন্ধন নম্বর ({duplicateStudent?.birth_reg_no}) দিয়ে ইতিমধ্যে শিক্ষার্থী ভর্তি আছে।</DialogDescription></DialogHeader>
                {duplicateStudent && <div className="bg-red-50 p-4 rounded text-sm font-bold text-gray-700 space-y-1"><p>নাম: {duplicateStudent.name_bn}</p><p>শ্রেণি: {duplicateStudent.class_name}</p><p>আইডি: {duplicateStudent.student_id}</p></div>}
                <div className="flex justify-end"><Button variant="outline" onClick={() => setShowDuplicateModal(false)}>ঠিক আছে</Button></div>
            </DialogContent>
        </Dialog>
        
        {/* --- Print Styles --- */}
        <style jsx global>{`
            @media print { 
                body * { visibility: hidden; } 
                
                /* ID Card Print Mode */
                body.print-id-card #id-card-print-area, 
                body.print-id-card #id-card-print-area * { visibility: visible; } 
                body.print-id-card #id-card-print-area { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 350px; } 
                
                /* Full Form Print Mode */
                body.print-full-form #full-form-print-area,
                body.print-full-form #full-form-print-area * { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
            }
        `}</style>
      </div>
    </div>
  );
}
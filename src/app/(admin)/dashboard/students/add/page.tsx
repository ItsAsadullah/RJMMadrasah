"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Loader2, Save, School, UploadCloud, User, FileText, 
  RefreshCw, AlertTriangle, CheckCircle, Printer, Download, X, 
  MapPin, CheckCircle2, ChevronRight, GraduationCap, Users, Shield, Crop, ZoomIn, ZoomOut
} from "lucide-react";
import { divisions, districts, upazilas } from "@/data/bangladesh-data";
import { differenceInYears, differenceInMonths, differenceInDays } from "date-fns";
import Image from "next/image";
import Link from "next/link";

// --- কনফিগারেশন ---
const CLOUD_NAME = "dfo1slmdy"; 
const UPLOAD_PRESET = "rahima_preset"; 

// --- কনস্ট্যান্টস ---
const occupations = ["শিক্ষক", "কৃষক", "ব্যবসায়ী", "চাকরিজীবী", "প্রবাসী", "গৃহিণী", "ডাক্তার", "ইঞ্জিনিয়ার", "ইমাম", "চালক", "শ্রমিক", "দিনমজুর", "অন্যান্য"];
const relations = ["চাচা", "চাচী", "মামা", "মামী", "খালা", "খালু", "ফুফা", "ফুফু", "দাদা", "দাদী", "নানা", "নানী", "ভাই", "বোন", "অন্যান্য"];
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const years = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i);

// --- কাস্টম ইনপুট কম্পোনেন্ট ---
const InputGroup = ({ label, name, value, onChange, onBlur, type = "text", placeholder = "", required = false, readOnly = false, error, className = "" }: any) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="block text-sm font-semibold text-slate-700 flex justify-between">
      <span>{label} {required && <span className="text-red-500">*</span>}</span>
    </label>
    <div className="relative">
      <input 
        type={type} name={name} required={required} readOnly={readOnly}
        value={value} onChange={onChange} onBlur={onBlur}
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

const SelectGroup = ({ label, name, value, onChange, options, required = false }: any) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-slate-700">{label} {required && <span className="text-red-500">*</span>}</label>
    <div className="relative">
      <select 
        name={name} value={value} onChange={onChange} required={required} 
        className="w-full h-11 px-4 border border-slate-300 rounded-md bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 appearance-none cursor-pointer"
      >
        <option value="">নির্বাচন করুন</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
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
        value={value} onChange={onChange} onBlur={onBlur}
        placeholder="XXXXXXXXX"
        className="flex-1 px-3 border-none focus:ring-0 outline-none w-full bg-white text-slate-900 placeholder-slate-400 text-sm" 
      />
    </div>
    {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
  </div>
);

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

const compressImage = (file: File, quality = 0.7, width = 800, height?: number): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        if (height) {
            canvas.width = width;
            canvas.height = height;
        } else {
            const scaleFactor = width / img.width;
            canvas.width = width;
            canvas.height = img.height * scaleFactor;
        }
        
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
          } else {
            resolve(file);
          }
        }, "image/jpeg", quality);
      };
    };
  });
};

export default function AdminStudentAdd() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);
  const [generatedID, setGeneratedID] = useState("");
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [duplicateStudent, setDuplicateStudent] = useState<any>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);
  
  const [dobState, setDobState] = useState({ day: "", month: "", year: "" });

  // --- একাডেমিক ডাটা (DB থেকে) ---
  const [dbBranches, setDbBranches] = useState<any[]>([]);
  const [dbDepartments, setDbDepartments] = useState<any[]>([]);
  const [dbClasses, setDbClasses] = useState<any[]>([]);

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

  const [formData, setFormData] = useState({
    branch_id: "1", department: "", class_name: "", roll_number: "", academic_year: new Date().getFullYear().toString(),
    residential_status: "residential", status: "active", guardian_type: "", 
    name_bn: "", name_en: "", dob: "", age_info: "", birth_reg_no: "", blood_group: "", photo_url: "", birth_cert_url: "",
    father_alive: "yes", father_name_bn: "", father_name_en: "", father_nid: "", father_occupation: "", father_mobile: "", father_nid_url: "", father_photo_url: "",
    mother_alive: "yes", mother_name_bn: "", mother_name_en: "", mother_nid: "", mother_occupation: "", mother_mobile: "", mother_nid_url: "", mother_photo_url: "",
    guardian_name: "", guardian_relation: "", guardian_mobile: "", guardian_nid: "", guardian_photo_url: "",
    present_division: "", present_district: "", present_upazila: "", present_union: "", present_village: "", present_postcode: "",
    perm_division: "", perm_district: "", perm_upazila: "", perm_union: "", perm_village: "", perm_postcode: "",
  });

  const generateID = async () => {
    const yearPrefix = formData.academic_year.slice(-2);
    const { count, error } = await supabase.from('students').select('id', { count: 'exact', head: true }).eq('academic_year', parseInt(formData.academic_year));
    if (!error) {
      const serial = (count || 0) + 1;
      setGeneratedID(`${yearPrefix}${serial.toString().padStart(4, '0')}`);
    }
  };

  useEffect(() => { generateID(); }, [formData.academic_year]);

  useEffect(() => {
    if (formData.guardian_type === 'father') {
      setFormData(prev => ({ ...prev, guardian_name: prev.father_name_bn, guardian_mobile: prev.father_mobile, guardian_relation: "পিতা", guardian_nid: prev.father_nid }));
    } else if (formData.guardian_type === 'mother') {
      setFormData(prev => ({ ...prev, guardian_name: prev.mother_name_bn, guardian_mobile: prev.mother_mobile, guardian_relation: "মাতা", guardian_nid: prev.mother_nid }));
    } else if (formData.guardian_type === 'other') {
       if (formData.guardian_relation === 'পিতা' || formData.guardian_relation === 'মাতা') {
           setFormData(prev => ({ ...prev, guardian_name: "", guardian_mobile: "", guardian_relation: "", guardian_nid: "" }));
       }
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if ((name.includes("mobile") || name.includes("nid") || name.includes("reg_no")) && isNaN(Number(value))) return;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (sameAddress && name.startsWith("present_")) updated[`perm_${name.replace("present_", "")}` as keyof typeof formData] = value;
      return updated;
    });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSameAddressToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSameAddress(e.target.checked);
    if (e.target.checked) {
      setFormData(prev => ({ ...prev, perm_division: prev.present_division, perm_district: prev.present_district, perm_upazila: prev.present_upazila, perm_union: prev.present_union, perm_village: prev.present_village, perm_postcode: prev.present_postcode }));
    } else {
      setFormData(prev => ({ ...prev, perm_division: "", perm_district: "", perm_upazila: "", perm_union: "", perm_village: "", perm_postcode: "" }));
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
      if (data.secure_url) {
         setFormData(prev => ({ ...prev, [fieldName]: data.secure_url }));
      } else {
         console.error("Cloudinary Error:", data);
         alert("Image Upload Failed!");
      }
    } catch (error) {
      alert("ইন্টারনেট সংযোগ চেক করুন!");
    }
    setUploading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    let file = e.target.files[0];
    
    if (file.type.startsWith('image/')) {
       const isProfilePhoto = fieldName === 'photo_url';
       const size = isProfilePhoto ? 300 : 1000;
       const height = isProfilePhoto ? 300 : undefined;
       
       file = await compressImage(file, 0.7, size, height); 
    }
    await handleCloudinaryUpload(file, fieldName);
  };

  const checkDuplicateStudent = async (e: React.FocusEvent<HTMLInputElement>) => {
    const regNo = e.target.value;
    if (!regNo) return;
    
    if (regNo.length !== 17) {
        setErrors(prev => ({...prev, birth_reg_no: "জন্ম সনদ ১৭ ডিজিটের হতে হবে"}));
        return;
    }
    setErrors(prev => ({...prev, birth_reg_no: ""}));

    const { data, error } = await supabase
        .from('students')
        .select('name_bn, class_name, student_id, branch_id, birth_reg_no')
        .eq('birth_reg_no', regNo); 
    
    if (error) {
        console.error("Duplicate Check Error:", error.message);
        return;
    }

    if (data && data.length > 0) {
        setDuplicateStudent(data[0]);
        setErrors(prev => ({...prev, birth_reg_no: "এই নম্বর দিয়ে ইতিমধ্যে শিক্ষার্থী ভর্তি আছে!"}));
        setShowDuplicateModal(true);
    } else {
        setDuplicateStudent(null);
    }
  };

  const validateMobile = (e: React.FocusEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if(val && val.length !== 9) {
          setErrors(prev => ({...prev, [e.target.name]: "নম্বর ৯ ডিজিট হতে হবে (01 এর পর)"}));
      } else {
          setErrors(prev => ({...prev, [e.target.name]: ""}));
      }
  };

  const validateNID = (e: React.FocusEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (!val) return;
      if (![10, 13, 17].includes(val.length)) {
          setErrors(prev => ({...prev, [e.target.name]: "NID ১০, ১৩ অথবা ১৭ ডিজিট হতে হবে"}));
      } else {
          setErrors(prev => ({...prev, [e.target.name]: ""}));
      }
  };

  const downloadIDCard = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600; canvas.height = 350;
    const ctx = canvas.getContext("2d");
    if(ctx) {
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0,0, 600, 350);
        ctx.fillStyle = "#15803d"; ctx.fillRect(0,0, 600, 80);
        ctx.fillStyle = "#ffffff"; ctx.font = "bold 28px Arial"; ctx.textAlign = "center";
        ctx.fillText("Rahima Jannat Madrasa", 300, 50);
        ctx.fillStyle = "#000000"; ctx.textAlign = "left"; ctx.font = "bold 20px Arial";
        ctx.fillText(`Name: ${formData.name_en || formData.name_bn}`, 30, 130);
        ctx.fillText(`Class: ${formData.class_name}`, 30, 165);
        ctx.fillStyle = "#f3f4f6"; ctx.fillRect(350, 100, 220, 120);
        ctx.fillStyle = "#166534"; ctx.font = "bold 14px Arial"; ctx.fillText("USER ID", 370, 130);
        ctx.font = "bold 36px Courier New"; ctx.fillText(generatedID, 370, 170);
        ctx.fillStyle = "#000000"; ctx.font = "14px Arial"; ctx.fillText("PASS:", 370, 200);
        ctx.font = "bold 18px Arial"; ctx.fillText(`01${formData.guardian_mobile}`, 430, 200);
        const link = document.createElement('a'); link.download = `ID_${generatedID}.jpg`; link.href = canvas.toDataURL("image/jpeg"); link.click();
    }
  };

  const handlePrintCard = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #id-card-print-area, #id-card-print-area * { visibility: visible; }
        #id-card-print-area { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 350px; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateStudent) return alert("ডুপ্লিকেট শিক্ষার্থী! জন্ম নিবন্ধন নম্বর চেক করুন।");
    if (Object.values(errors).some(e => e)) return alert("অনুগ্রহ করে এররগুলো সংশোধন করুন।");
    if (!formData.name_bn || !formData.guardian_mobile) return alert("আবশ্যকীয় তথ্য দিন।");

    // ফিক্স: জন্ম তারিখ চেক (Date Check)
    if (!formData.dob) {
        return alert("শিক্ষার্থীর জন্ম তারিখ সিলেক্ট করুন (দিন, মাস, বছর)।");
    }

    setLoading(true);
    await generateID();
    const payload = {
      ...formData,
      // সেইফটি: খালি স্ট্রিং থাকলে null পাঠান (যদি ডাটাবেস এরর দেয়)
      dob: formData.dob || null, 
      student_id: generatedID,
      roll_number: formData.roll_number || null,
      branch_id: parseInt(formData.branch_id),
      academic_year: parseInt(formData.academic_year),
      father_alive: formData.father_alive === "yes",
      mother_alive: formData.mother_alive === "yes",
      father_mobile: formData.father_mobile ? "01" + formData.father_mobile : "",
      mother_mobile: formData.mother_mobile ? "01" + formData.mother_mobile : "",
      guardian_mobile: formData.guardian_mobile ? "01" + formData.guardian_mobile : "",
    };
    
    // এরর হ্যান্ডলিং (Database Constraint Error Check)
    const { data, error } = await supabase.from("students").insert([payload]).select();
    
    if (error) {
        if (error.code === '23505') { // Unique Violation Code
            alert("এই শিক্ষার্থী ইতিমধ্যে ডাটাবেসে আছে (জন্ম নিবন্ধন বা স্টুডেন্ট আইডি ডুপ্লিকেট)।");
        } else {
            alert("সেভ করা যায়নি: " + error.message);
        }
    } else {
        if(data) setCreatedStudentId(data[0].id);
        setShowSuccessModal(true);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      
      {/* Header Card */}
      <div className="bg-gradient-to-r from-green-50 to-white p-6 rounded-2xl shadow-sm border border-green-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <div className="p-2 bg-green-600 rounded-lg text-white"><School className="w-6 h-6" /></div>
            নতুন শিক্ষার্থী ভর্তি
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-12">সকল তথ্য নির্ভুলভাবে পূরণ করুন (অ্যাডমিন প্যানেল)</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-xl border border-green-100 shadow-sm text-center">
           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">স্টুডেন্ট আইডি (অটো)</p>
           <div className="text-3xl font-black text-green-600 flex items-center justify-center gap-3">
              {generatedID || <Loader2 className="animate-spin w-5 h-5 text-green-400" />}
              <Button variant="ghost" size="icon" onClick={generateID} className="h-8 w-8 hover:bg-green-50 rounded-full" title="নতুন আইডি তৈরি করুন"><RefreshCw className="w-4 h-4 text-green-600" /></Button>
           </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ১. একাডেমিক তথ্য */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:shadow-md">
           <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
           <SectionHeader icon={GraduationCap} title="একাডেমিক তথ্য" step="১" />
           
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
               <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">শাখা <span className="text-red-500">*</span></label>
                  <select name="branch_id" value={formData.branch_id} onChange={(e) => setFormData({...formData, branch_id: e.target.value, department: "", class_name: ""})} className="w-full h-11 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all">
                     <option value="">সিলেক্ট করুন</option>
                     {dbBranches.length > 0
                       ? dbBranches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)
                       : <><option value="1">হলিধানী বাজার</option><option value="2">চাঁন্দুয়ালী বাজার</option></>}
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
                       return !selectedClass || selectedClass?.allow_residential ? <option value="residential">আবাসিক</option> : null;
                     })()}
                  </select>
               </div>
               <InputGroup label="শিক্ষাবর্ষ" name="academic_year" value={formData.academic_year} onChange={handleChange} type="number" required />
               <InputGroup label="রোল নম্বর" name="roll_number" value={formData.roll_number} onChange={handleChange} placeholder="যেমন: ১২" />
            </div>
        </div>

        {/* ২. শিক্ষার্থী তথ্য */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
          <SectionHeader icon={User} title="শিক্ষার্থীর ব্যক্তিগত তথ্য" step="২" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
               <InputGroup label="নাম (বাংলায়)" name="name_bn" value={formData.name_bn} onChange={handleChange} required placeholder="উদাঃ আয়েশা সিদ্দিকা" />
               <InputGroup label="Name (English)" name="name_en" value={formData.name_en} onChange={handleChange} placeholder="e.g. Ayesha Siddika" />
               <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                 <InputGroup label="জন্ম সনদ (১৭ ডিজিট)" name="birth_reg_no" value={formData.birth_reg_no} onChange={handleChange} onBlur={checkDuplicateStudent} error={errors.birth_reg_no} required placeholder="জন্ম সনদ নম্বর দিন" />
                 <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">জন্ম তারিখ</label>
                    <div className="flex gap-2">
                        <select className="border border-slate-300 rounded-lg h-11 px-2 bg-white w-full focus:outline-none focus:ring-2 focus:ring-green-500" value={dobState.day} onChange={(e) => setDobState({...dobState, day: e.target.value})}><option>দিন</option>{days.map(d => <option key={d} value={d}>{d}</option>)}</select>
                        <select className="border border-slate-300 rounded-lg h-11 px-2 bg-white w-full focus:outline-none focus:ring-2 focus:ring-green-500" value={dobState.month} onChange={(e) => setDobState({...dobState, month: e.target.value})}><option>মাস</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select>
                        <select className="border border-slate-300 rounded-lg h-11 px-2 bg-white w-full focus:outline-none focus:ring-2 focus:ring-green-500" value={dobState.year} onChange={(e) => setDobState({...dobState, year: e.target.value})}><option>বছর</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                    </div>
                 </div>
                 <SelectGroup label="রক্তের গ্রুপ" name="blood_group" value={formData.blood_group} onChange={handleChange} options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]} />
               </div>
            </div>
            
            {/* ছোট প্রিভিউ বক্স (পাশাপাশি) */}
            <div className="lg:col-span-4 flex flex-row gap-4 h-32">
               {/* প্রোফাইল ফটো - ক্রপ ফিচার সহ */}
               <div className="flex-1 w-[128px] h-[128px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 relative overflow-hidden bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all group">
                  {formData.photo_url ? (
                    <Image 
                        src={formData.photo_url} 
                        alt="Profile" 
                        fill
                        className="object-cover" 
                        sizes="128px"
                        priority
                    />
                  ) : <div className="text-center"><User className="w-6 h-6 mx-auto mb-1 group-hover:text-blue-500" /><span className="text-[10px] block">ছবি দিন</span></div>}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'photo_url')} accept="image/*" title="ছবি নির্বাচন করুন" />
               </div>
               
               {/* জন্ম সনদ - ছোট প্রিভিউ */}
               <div className="flex-1 w-[128px] h-[128px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 relative overflow-hidden bg-slate-50 hover:bg-slate-100 hover:border-green-400 transition-all group">
                   {formData.birth_cert_url ? (
                       formData.birth_cert_url.endsWith('.pdf') ?
                       <div className="flex flex-col items-center gap-1 text-red-600"><FileText className="w-6 h-6" /><span className="text-[10px] font-bold">PDF ফাইল</span></div> :
                       <Image src={formData.birth_cert_url} alt="Cert" fill className="object-cover" sizes="128px" />
                   ) : <div className="text-center"><FileText className="w-6 h-6 mx-auto mb-1 group-hover:text-green-500" /><span className="text-[10px] block">সনদ দিন</span></div>}
                   <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'birth_cert_url')} accept="image/*,.pdf" />
               </div>
            </div>
          </div>
        </div>

        {/* ৩. পিতা-মাতা */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:shadow-md">
           <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
           <SectionHeader icon={Users} title="পিতা ও মাতার তথ্য" step="৩" />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* পিতা */}
              <div className="space-y-4 p-5 bg-blue-50/30 rounded-2xl border border-blue-100">
                 <h4 className="font-bold text-blue-700 flex items-center justify-between">
                    পিতার তথ্য <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-blue-200 text-blue-600 uppercase tracking-wider">Father</span>
                 </h4>
                 <div className="grid grid-cols-2 gap-4"><InputGroup label="নাম (বাংলা)" name="father_name_bn" value={formData.father_name_bn} onChange={handleChange} placeholder="পিতার নাম" /><InputGroup label="Name (English)" name="father_name_en" value={formData.father_name_en} onChange={handleChange} placeholder="Father Name" /></div>
                 <SelectGroup label="পেশা" name="father_occupation" value={formData.father_occupation} onChange={handleChange} options={occupations} />
                 <div className="grid grid-cols-2 gap-4">
                    <PhoneInput label="মোবাইল" name="father_mobile" value={formData.father_mobile} onChange={handleChange} onBlur={validateMobile} error={errors.father_mobile} />
                    <InputGroup label="NID" name="father_nid" value={formData.father_nid} onChange={handleChange} onBlur={validateNID} error={errors.father_nid} placeholder="NID No" />
                 </div>
                 <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="relative border bg-white rounded-lg p-2 text-center hover:bg-slate-50 transition cursor-pointer border-dashed border-blue-200 h-16 flex flex-col justify-center items-center overflow-hidden">
                        {formData.father_photo_url ? <Image src={formData.father_photo_url} alt="F" className="w-full h-full object-cover opacity-50" /> : null}
                        <span className="text-[10px] font-bold flex items-center justify-center gap-1 text-slate-600 relative z-10"><User className="w-3 h-3 text-blue-500"/> ছবি</span>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={(e) => handleFileUpload(e, 'father_photo_url')} accept="image/*" />
                        {formData.father_photo_url && <CheckCircle className="w-3 h-3 text-green-600 absolute top-1 right-1 z-30"/>}
                    </div>
                    <div className="relative border bg-white rounded-lg p-2 text-center hover:bg-slate-50 transition cursor-pointer border-dashed border-blue-200 h-16 flex flex-col justify-center items-center overflow-hidden">
                        {formData.father_nid_url ? <Image src={formData.father_nid_url} alt="NID" className="w-full h-full object-cover opacity-50" /> : null}
                        <span className="text-[10px] font-bold flex items-center justify-center gap-1 text-slate-600 relative z-10"><FileText className="w-3 h-3 text-blue-500"/> আইডি</span>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={(e) => handleFileUpload(e, 'father_nid_url')} accept="image/*" />
                        {formData.father_nid_url && <CheckCircle className="w-3 h-3 text-green-600 absolute top-1 right-1 z-30"/>}
                    </div>
                 </div>
              </div>

              {/* মাতা */}
              <div className="space-y-4 p-5 bg-pink-50/30 rounded-2xl border border-pink-100">
                 <h4 className="font-bold text-pink-700 flex items-center justify-between">
                    মাতার তথ্য <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-pink-200 text-pink-600 uppercase tracking-wider">Mother</span>
                 </h4>
                 <div className="grid grid-cols-2 gap-4"><InputGroup label="নাম (বাংলা)" name="mother_name_bn" value={formData.mother_name_bn} onChange={handleChange} placeholder="মাতার নাম" /><InputGroup label="Name (English)" name="mother_name_en" value={formData.mother_name_en} onChange={handleChange} placeholder="Mother Name" /></div>
                 <SelectGroup label="পেশা" name="mother_occupation" value={formData.mother_occupation} onChange={handleChange} options={occupations} />
                 <div className="grid grid-cols-2 gap-4">
                    <PhoneInput label="মোবাইল" name="mother_mobile" value={formData.mother_mobile} onChange={handleChange} onBlur={validateMobile} error={errors.mother_mobile} />
                    <InputGroup label="NID" name="mother_nid" value={formData.mother_nid} onChange={handleChange} onBlur={validateNID} error={errors.mother_nid} placeholder="NID No" />
                 </div>
                 <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="relative border bg-white rounded-lg p-2 text-center hover:bg-slate-50 transition cursor-pointer border-dashed border-pink-200 h-16 flex flex-col justify-center items-center overflow-hidden">
                        {formData.mother_photo_url ? <Image src={formData.mother_photo_url} alt="M" className="w-full h-full object-cover opacity-50" /> : null}
                        <span className="text-[10px] font-bold flex items-center justify-center gap-1 text-slate-600 relative z-10"><User className="w-3 h-3 text-pink-500"/> ছবি</span>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={(e) => handleFileUpload(e, 'mother_photo_url')} accept="image/*" />
                        {formData.mother_photo_url && <CheckCircle className="w-3 h-3 text-green-600 absolute top-1 right-1 z-30"/>}
                    </div>
                    <div className="relative border bg-white rounded-lg p-2 text-center hover:bg-slate-50 transition cursor-pointer border-dashed border-pink-200 h-16 flex flex-col justify-center items-center overflow-hidden">
                        {formData.mother_nid_url ? <Image src={formData.mother_nid_url} alt="NID" className="w-full h-full object-cover opacity-50" /> : null}
                        <span className="text-[10px] font-bold flex items-center justify-center gap-1 text-slate-600 relative z-10"><FileText className="w-3 h-3 text-pink-500"/> আইডি</span>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={(e) => handleFileUpload(e, 'mother_nid_url')} accept="image/*" />
                        {formData.mother_nid_url && <CheckCircle className="w-3 h-3 text-green-600 absolute top-1 right-1 z-30"/>}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* ৪. অভিভাবক */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-yellow-200 ring-2 ring-yellow-50 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-400"></div>
           <SectionHeader icon={Shield} title="অভিভাবক ও যোগাযোগ (জরুরি)" step="৪" />
           
           <div className="mb-6 max-w-md">
             <label className="block text-sm font-bold text-slate-700 mb-2">অভিভাবক নির্বাচন করুন *</label>
             <select name="guardian_type" value={formData.guardian_type} onChange={(e) => setFormData({...formData, guardian_type: e.target.value})} className="w-full h-11 px-4 border border-slate-200 rounded-lg bg-white focus:bg-white focus:ring-2 focus:ring-yellow-200 font-medium outline-none transition-all cursor-pointer" required>
                <option value="">নির্বাচন করুন</option><option value="father">পিতা</option><option value="mother">মাতা</option><option value="other">অন্যান্য</option>
             </select>
           </div>
           
           {(formData.guardian_type === 'father' || formData.guardian_type === 'mother') && (
              <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 flex items-center gap-6 text-sm animate-in fade-in">
                  <div className="flex-1 border-r border-yellow-200 pr-6">
                      <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">অভিভাবকের নাম</p>
                      <p className="text-lg font-bold text-slate-800">{formData.guardian_name || "..."}</p>
                  </div>
                  <div className="flex-1 border-r border-yellow-200 pr-6">
                      <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">সম্পর্ক</p>
                      <p className="text-lg font-bold text-slate-800">{formData.guardian_relation}</p>
                  </div>
                  <div className="flex-1">
                      <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">মোবাইল (পাসওয়ার্ড)</p>
                      <p className="text-2xl font-mono font-bold text-green-600">01{formData.guardian_mobile || "..."}</p>
                  </div>
              </div>
           )}

           {formData.guardian_type === 'other' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                 <InputGroup label="নাম *" name="guardian_name" value={formData.guardian_name} onChange={handleChange} required placeholder="অভিভাবকের নাম" />
                 <SelectGroup label="সম্পর্ক *" name="guardian_relation" value={formData.guardian_relation} onChange={handleChange} options={relations} required />
                 <PhoneInput label="মোবাইল *" name="guardian_mobile" value={formData.guardian_mobile} onChange={handleChange} required error={errors.guardian_mobile} />
                 <InputGroup label="NID (ঐচ্ছিক)" name="guardian_nid" value={formData.guardian_nid} onChange={handleChange} placeholder="NID No" />
              </div>
           )}
        </div>

        {/* ৫. ঠিকানা */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:shadow-md">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-500"></div>
            <SectionHeader icon={MapPin} title="ঠিকানা" step="৫" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* বর্তমান */}
               <div className="space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-2 mb-2">বর্তমান ঠিকানা</h4>
                  <SelectGroup label="বিভাগ" name="present_division" value={formData.present_division} onChange={handleChange} options={divisions} />
                  <div className="grid grid-cols-2 gap-4"><SelectGroup label="জেলা" name="present_district" value={formData.present_district} onChange={handleChange} options={formData.present_division ? districts[formData.present_division] : []} /><SelectGroup label="উপজেলা" name="present_upazila" value={formData.present_upazila} onChange={handleChange} options={formData.present_district ? upazilas[formData.present_district] : []} /></div>
                  <InputGroup label="ইউনিয়ন/ওয়ার্ড" name="present_union" value={formData.present_union} onChange={handleChange} placeholder="ইউনিয়ন বা ওয়ার্ডের নাম" />
                  <div className="grid grid-cols-2 gap-4"><InputGroup label="গ্রাম/মহল্লা" name="present_village" value={formData.present_village} onChange={handleChange} placeholder="গ্রামের নাম" /><InputGroup label="পোস্ট কোড" name="present_postcode" value={formData.present_postcode} onChange={handleChange} placeholder="Code" /></div>
               </div>
               
               {/* স্থায়ী */}
               <div className={`space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 relative ${sameAddress ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
                     <h4 className="font-bold text-slate-700">স্থায়ী ঠিকানা</h4>
                     <label className="flex items-center gap-2 text-xs font-bold cursor-pointer bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200 hover:bg-slate-50 pointer-events-auto">
                        <input type="checkbox" checked={sameAddress} onChange={handleSameAddressToggle} className="accent-green-600 w-4 h-4" /> একই ঠিকানা
                     </label>
                  </div>
                  <SelectGroup label="বিভাগ" name="perm_division" value={formData.perm_division} onChange={handleChange} options={divisions} />
                  <div className="grid grid-cols-2 gap-4"><SelectGroup label="জেলা" name="perm_district" value={formData.perm_district} onChange={handleChange} options={formData.perm_division ? districts[formData.perm_division] : []} /><SelectGroup label="উপজেলা" name="perm_upazila" value={formData.perm_upazila} onChange={handleChange} options={formData.perm_district ? upazilas[formData.perm_district] : []} /></div>
                  <InputGroup label="ইউনিয়ন/ওয়ার্ড" name="perm_union" value={formData.perm_union} onChange={handleChange} placeholder="ইউনিয়ন বা ওয়ার্ডের নাম" />
                  <div className="grid grid-cols-2 gap-4"><InputGroup label="গ্রাম/মহল্লা" name="perm_village" value={formData.perm_village} onChange={handleChange} placeholder="গ্রামের নাম" /><InputGroup label="পোস্ট কোড" name="perm_postcode" value={formData.perm_postcode} onChange={handleChange} placeholder="Code" /></div>
               </div>
            </div>
        </div>

        {/* সাবমিট বাটন */}
        <div className="flex justify-end pt-6">
           <Button 
             type="submit" 
             disabled={loading || uploading || !!duplicateStudent} 
             className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white h-14 px-10 text-lg font-bold shadow-xl shadow-green-200 transition-all hover:scale-105 active:scale-95 rounded-xl"
           >
              {loading ? <><Loader2 className="animate-spin mr-2" /> প্রসেসিং...</> : <><Save className="mr-2" /> ভর্তি সম্পন্ন করুন</>}
           </Button>
        </div>
      </form>

      {/* --- মডাল সেকশন (পূর্বের মতোই আছে, শুধু লুক ঠিক রাখার জন্য) --- */}
      <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle className="text-red-600 flex items-center gap-2"><AlertTriangle className="w-6 h-6" /> ডুপ্লিকেট শিক্ষার্থী!</DialogTitle>
                <DialogDescription>এই জন্ম নিবন্ধন নম্বর ({duplicateStudent?.birth_reg_no}) দিয়ে ইতিমধ্যে শিক্ষার্থী ভর্তি আছে।</DialogDescription>
            </DialogHeader>
            {duplicateStudent && <div className="bg-red-50 p-4 rounded text-sm font-bold text-gray-700 space-y-1"><p>নাম: {duplicateStudent.name_bn}</p><p>শ্রেণি: {duplicateStudent.class_name}</p><p>আইডি: {duplicateStudent.student_id}</p></div>}
            <div className="flex justify-end"><Button variant="outline" onClick={() => setShowDuplicateModal(false)}>ঠিক আছে</Button></div>
        </DialogContent>
      </Dialog>

      {/* SUCCESS ID CARD MODAL */}
      <Dialog open={showSuccessModal} onOpenChange={() => {}} > 
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white" showCloseButton={false}>
            {/* Hidden Title for Accessibility */}
            <DialogHeader className="sr-only">
               <DialogTitle>Registration Success</DialogTitle>
               <DialogDescription>Student ID Card</DialogDescription>
            </DialogHeader>

            <div className="absolute right-4 top-4 z-50">
                <Button variant="ghost" size="icon" onClick={() => window.location.reload()} className="h-8 w-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200"><X className="w-4 h-4" /></Button>
            </div>
            
            <div id="id-card-print-area" className="bg-white p-8 text-center flex flex-col items-center">
                <div className="w-full max-w-[320px] bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-200 relative">
                    <div className="bg-green-700 h-24 relative overflow-hidden flex flex-col items-center justify-center text-white">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent opacity-20"></div>
                        <div className="flex items-center gap-2 z-10">
                            <School className="w-6 h-6 text-yellow-300" />
                            <h2 className="text-lg font-bold tracking-wide">Rahima Jannat</h2>
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.2em] opacity-80 z-10 mt-1">Madrasa ID Card</p>
                    </div>
                    
                    <div className="px-6 pb-6 pt-0 relative">
                        <div className="w-24 h-24 mx-auto rounded-full border-4 border-white shadow-lg overflow-hidden -mt-12 bg-gray-100 relative z-10">
                            {formData.photo_url ? <img src={formData.photo_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-gray-400" />}
                        </div>
                        
                        <div className="mt-3 mb-5">
                            <h3 className="text-xl font-bold text-gray-800">{formData.name_bn}</h3>
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wide mt-1">{formData.class_name}</p>
                        </div>
                        
                        <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-100">
                            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">ID NO</span>
                                <span className="text-lg font-mono font-black text-slate-700">{generatedID}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">PIN</span>
                                <span className="text-sm font-mono font-bold text-slate-600 tracking-wider">01{formData.guardian_mobile}</span>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-red-400 bg-red-50 p-1.5 rounded">
                            <AlertTriangle className="w-3 h-3" /> 
                            <span>এই তথ্যটি সংরক্ষণ করে রাখুন</span>
                        </div>
                    </div>
                    <div className="bg-green-700 h-2 w-full"></div>
                </div>
            </div>

            <DialogFooter className="bg-slate-50 p-4 flex flex-row gap-3 justify-center border-t">
                <Button variant="outline" className="flex-1 gap-2 border-slate-300 text-slate-700 hover:bg-white hover:text-green-600" onClick={downloadIDCard}>
                    <Download className="w-4 h-4" /> Save Image
                </Button>
                <Button className="flex-1 gap-2 bg-green-700 hover:bg-green-800 text-white" onClick={handlePrintCard}>
                    <Printer className="w-4 h-4" /> Print ID
                </Button>
            </DialogFooter>
            
            {createdStudentId && (
                <div className="bg-blue-50 p-3 text-center border-t border-blue-100">
                    <Link href={`/dashboard/students/${createdStudentId}`} target="_blank">
                        <Button variant="link" className="text-blue-700 gap-2 font-bold no-underline hover:underline"><FileText className="w-4 h-4" /> সম্পূর্ণ ভর্তি ফরম প্রিন্ট করুন</Button>
                    </Link>
                </div>
            )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`@media print { body * { visibility: hidden; } #id-card-print-area, #id-card-print-area * { visibility: visible; } #id-card-print-area { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 350px; } }`}</style>
    </div>
  );
}

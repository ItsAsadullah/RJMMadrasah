"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, ArrowLeft, CheckCircle, XCircle, Phone, MapPin, 
  User, FileText, Printer, Trash2, Edit, Save, BookOpen, Wallet, 
  School, UploadCloud, AlertTriangle, CheckCircle2, ChevronRight, GraduationCap, Users, Shield, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import StudentPrintProfile from "@/components/dashboard/StudentPrintProfile";
import PaymentHistory from "@/components/dashboard/students/PaymentHistory";
import { divisions, districts, upazilas } from "@/data/bangladesh-data";
import { differenceInYears, differenceInMonths, differenceInDays } from "date-fns";

// --- কনফিগারেশন ---
const CLOUD_NAME = "dfo1slmdy"; 
const UPLOAD_PRESET = "rahima_preset"; 

const occupations = ["শিক্ষক", "কৃষক", "ব্যবসায়ী", "চাকরিজীবী", "প্রবাসী", "গৃহিণী", "ডাক্তার", "ইঞ্জিনিয়ার", "ইমাম", "চালক", "শ্রমিক", "দিনমজুর", "অন্যান্য"];
const relations = ["চাচা", "চাচী", "মামা", "মামী", "খালা", "খালু", "ফুফা", "ফুফু", "দাদা", "দাদী", "নানা", "নানী", "ভাই", "বোন", "অন্যান্য"];
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const years = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i);

// --- কম্পোনেন্ট ---

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

const SelectGroup = ({ label, name, value, onChange, options, required = false }: any) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-slate-700">{label} {required && <span className="text-red-500">*</span>}</label>
    <div className="relative">
      <select 
        name={name} value={value || ""} onChange={onChange} required={required} 
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

export default function StudentDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [student, setStudent] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);
  const [dobState, setDobState] = useState({ day: "", month: "", year: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // DB একাডেমিক ডাটা
  const [dbBranches, setDbBranches] = useState<any[]>([]);
  const [dbDepartments, setDbDepartments] = useState<any[]>([]);
  const [dbClasses, setDbClasses] = useState<any[]>([]);

  useEffect(() => {
    const fetchAcademicData = async () => {
      const { data: b } = await supabase.from("branches").select("id, name");
      const { data: d } = await supabase.from("departments").select("id, name, branch_id");
      const { data: c } = await supabase.from("academic_classes").select("id, name, branch_id, department_id, allow_residential");
      if (b) setDbBranches(b);
      if (d) setDbDepartments(d);
      if (c) setDbClasses(c);
    };
    fetchAcademicData();
  }, []);

  // Other Action Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [redirectAfterSuccess, setRedirectAfterSuccess] = useState(false);

  useEffect(() => {
    if (id) fetchAllData();
  }, [id]);

  const fetchAllData = async () => {
    setLoading(true);
    const { data: stu } = await supabase.from("students").select("*").eq("id", id).single();
    if (stu) {
        setStudent(stu);
        
        // Initialize Edit Form Data
        const initialDob = stu.dob ? new Date(stu.dob) : new Date();
        const formatMobile = (num: string) => num?.startsWith("01") ? num.substring(2) : num;

        setEditFormData({
            ...stu,
            branch_id: stu.branch_id?.toString(),
            academic_year: stu.academic_year?.toString(),
            father_mobile: formatMobile(stu.father_mobile),
            mother_mobile: formatMobile(stu.mother_mobile),
            guardian_mobile: formatMobile(stu.guardian_mobile),
            guardian_type: "other" 
        });

        // Initialize DOB State
        if (stu.dob) {
            setDobState({
                day: initialDob.getDate().toString(),
                month: months[initialDob.getMonth()],
                year: initialDob.getFullYear().toString()
            });
        }

        const { data: res } = await supabase.from("results").select("*").eq("student_id", stu.id).order("created_at", { ascending: false });
        if (res) setResults(res);

        const { data: pay } = await supabase.from("payments").select("*").eq("student_id", stu.student_id).order("payment_date", { ascending: false });
        if (pay) setPayments(pay);
    }
    setLoading(false);
  };

  // --- Validation Function ---
  const validateField = (name: string, value: string) => {
    let error = "";
    
    // Mobile Validation (9 digits)
    if (name.includes("mobile")) {
        if (value && !/^\d{9}$/.test(value)) {
            error = "নম্বরটি ৯ ডিজিটের হতে হবে (01 এর পর)";
        }
    }
    
    // Birth Reg No Validation
    if (name === "birth_reg_no" && value) {
        if (!/^\d{17}$/.test(value)) {
            error = "জন্ম সনদ নম্বর অবশ্যই ১৭ ডিজিটের হতে হবে";
        }
    }

    // NID Validation
    if (name.includes("nid") && value && !name.includes("url")) {
        const len = value.length;
        if (len !== 10 && len !== 13 && len !== 17) {
            error = `NID ১০, ১৩ অথবা ১৭ ডিজিট হতে হবে`;
        }
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  // --- Edit Logic ---
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      if ((name.includes("mobile") || name.includes("nid") || name.includes("reg_no")) && isNaN(Number(value))) return;

      setEditFormData((prev: any) => {
          const updated = { ...prev, [name]: value };
          if (sameAddress && name.startsWith("present_")) {
              updated[`perm_${name.replace("present_", "")}`] = value;
          }
          return updated;
      });

      // Real-time validation trigger
      validateField(name, value);

      if (name === "present_division") setEditFormData((prev:any) => ({ ...prev, present_division: value, present_district: "", present_upazila: "" }));
      if (name === "present_district") setEditFormData((prev:any) => ({ ...prev, present_district: value, present_upazila: "" }));
  };

  const handleSameAddressToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSameAddress(e.target.checked);
    if (e.target.checked) {
      setEditFormData((prev: any) => ({
        ...prev,
        perm_division: prev.present_division,
        perm_district: prev.present_district,
        perm_upazila: prev.present_upazila,
        perm_union: prev.present_union,
        perm_village: prev.present_village,
        perm_postcode: prev.present_postcode,
      }));
    }
  };

  // Date Change Sync
  useEffect(() => {
    if (isEditOpen && dobState.day && dobState.month && dobState.year) {
      const monthIndex = months.indexOf(dobState.month);
      const dateObj = new Date(parseInt(dobState.year), monthIndex, parseInt(dobState.day));
      const formattedDate = `${dobState.year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dobState.day).padStart(2, '0')}`;
      setEditFormData((prev: any) => ({ ...prev, dob: formattedDate }));
    }
  }, [dobState, isEditOpen]);

  // Guardian Auto Fill Logic
  useEffect(() => {
    if (isEditOpen) {
        if (editFormData.guardian_type === 'father') {
            setEditFormData((prev: any) => ({ ...prev, guardian_name: prev.father_name_bn, guardian_mobile: prev.father_mobile, guardian_relation: "পিতা", guardian_nid: prev.father_nid }));
        } else if (editFormData.guardian_type === 'mother') {
            setEditFormData((prev: any) => ({ ...prev, guardian_name: prev.mother_name_bn, guardian_mobile: prev.mother_mobile, guardian_relation: "মাতা", guardian_nid: prev.mother_nid }));
        }
    }
  }, [editFormData.guardian_type, isEditOpen]);

  // Image Upload Logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    let file = e.target.files[0];
    if (file.type.startsWith('image/')) {
       file = await compressImage(file, 0.7, 800); 
    }
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.secure_url) {
         setEditFormData((prev: any) => ({ ...prev, [fieldName]: data.secure_url }));
      }
    } catch (error) {
      alert("আপলোড ব্যর্থ হয়েছে");
    }
    setUploading(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Check for errors before confirm
      if (Object.values(errors).some(e => e)) return alert("অনুগ্রহ করে লাল রঙের এররগুলো সংশোধন করুন।");
      if (!editFormData.name_bn || !editFormData.guardian_mobile) return alert("আবশ্যকীয় তথ্য দিন।");
      
      setShowEditConfirmModal(true);
  };

  const confirmUpdate = async () => {
      setIsUpdating(true);
      const formatMobile = (num: string) => num ? (num.length === 9 ? "01" + num : num) : "";

      const { error } = await supabase.from("students").update({
          ...editFormData,
          branch_id: parseInt(editFormData.branch_id),
          academic_year: parseInt(editFormData.academic_year),
          father_mobile: formatMobile(editFormData.father_mobile),
          mother_mobile: formatMobile(editFormData.mother_mobile),
          guardian_mobile: formatMobile(editFormData.guardian_mobile),
      }).eq("id", id);

      setIsUpdating(false);
      setShowEditConfirmModal(false);

      if (error) {
          alert("আপডেট ব্যর্থ হয়েছে: " + error.message);
      } else {
          setSuccessMessage("শিক্ষার্থীর তথ্য সফলভাবে আপডেট হয়েছে!");
          setRedirectAfterSuccess(false);
          setIsEditOpen(false);
          setShowSuccessModal(true);
          fetchAllData();
      }
  };

  const handleDelete = async () => {
      if (!confirm("নিশ্চিত ডিলিট করবেন?")) return;
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (!error) router.push("/dashboard/students");
  };

  const handleConfirmAdmission = async () => {
    const { error } = await supabase.from("students").update({ status: 'active' }).eq("id", id);
    if (!error) {
        setSuccessMessage("ভর্তি কনফার্ম হয়েছে!");
        setShowSuccessModal(true);
        fetchAllData();
        router.refresh();
    }
  };

  const handleStatusChange = async (newStatus: string) => {
      const { error } = await supabase.from("students").update({ status: newStatus }).eq("id", id);
      if (!error) fetchAllData();
  };

  const handleSuccessClose = () => {
      setShowSuccessModal(false);
      if (redirectAfterSuccess) {
          router.push("/dashboard/students");
      }
  };

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-green-600" /></div>;
  if (!student) return <div className="text-center p-10">তথ্য পাওয়া যায়নি</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      
      {/* ১. হেডার ও অ্যাকশন */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-gray-100">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Button>
            <div>
                <h1 className="text-xl font-bold text-gray-800">{student.name_bn}</h1>
                <p className="text-sm text-gray-500 font-mono">ID: {student.student_id}</p>
            </div>
        </div>
        
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 hidden md:flex">
                <Printer className="w-4 h-4" /> প্রিন্ট প্রোফাইল
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200">
                <Edit className="w-4 h-4" /> তথ্য সংশোধন
            </Button>
            {student.status === 'active' ? (
                 <Button onClick={() => handleStatusChange('rejected')} variant="destructive" size="sm" className="gap-2">
                    <XCircle className="w-4 h-4" /> সাসপেন্ড
                 </Button>
             ) : (
                 <Button onClick={handleConfirmAdmission} className="bg-green-600 hover:bg-green-700 text-white gap-2" size="sm">
                    <CheckCircle className="w-4 h-4" /> ভর্তি কনফার্ম
                 </Button>
             )}
             <Button onClick={handleDelete} variant="ghost" size="icon" className="text-red-500 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
             </Button>
        </div>
      </div>

      {/* ২. প্রোফাইল কার্ড */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative print:hidden">
         <div className="h-32 bg-gradient-to-r from-green-600 to-emerald-500"></div>
         <div className="px-8 pb-8 flex flex-col md:flex-row gap-6 items-end -mt-12">
            <div className="p-1 bg-white rounded-2xl shadow-md">
                {student.photo_url ? (
                    <Image src={student.photo_url} alt="Student" width={140} height={140} className="w-36 h-36 rounded-xl object-cover bg-gray-100" />
                ) : (
                    <div className="w-36 h-36 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-bold text-4xl">{student.name_bn?.[0]}</div>
                )}
            </div>
            <div className="flex-1 space-y-2 mb-2">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">{student.name_bn}</h2>
                    <p className="text-gray-500 font-medium">{student.name_en || "English Name Not Set"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge label={`শাখা: ${student.branch_id === 1 ? 'হলিধানী' : 'চাঁন্দুয়ালী'}`} color="green" />
                    <Badge label={`ক্লাস: ${student.class_name}`} color="blue" />
                    <Badge label={`বিভাগ: ${student.department}`} color="purple" />
                    <Badge label={`সেশন: ${student.academic_year}`} color="orange" />
                    {student.roll_number && <Badge label={`রোল: ${student.roll_number}`} color="cyan" />}
                    <Badge label={student.status} color={student.status === 'active' ? 'green' : 'red'} />
                </div>
            </div>
         </div>
      </div>

      {/* ৩. ট্যাব সেকশন */}
      <Tabs defaultValue="details" className="w-full print:hidden">
        <TabsList className="grid w-full grid-cols-3 max-w-[500px] mb-6">
            <TabsTrigger value="details">বিবরণ</TabsTrigger>
            <TabsTrigger value="results">ফলাফল ({results.length})</TabsTrigger>
            <TabsTrigger value="payments">বেতন ও ফি ({payments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard title="ব্যক্তিগত তথ্য" icon={User}>
                    <InfoRow label="জন্ম তারিখ" value={student.dob ? new Date(student.dob).toLocaleDateString('bn-BD') : '-'} />
                    <InfoRow label="রক্তের গ্রুপ" value={student.blood_group} />
                    <InfoRow label="জন্ম নিবন্ধন" value={student.birth_reg_no} />
                    <div className="pt-2">
                        <p className="text-xs font-bold text-gray-500 mb-1">জন্ম সনদের কপি:</p>
                        <DocPreview url={student.birth_cert_url} label="Certificate" />
                    </div>
                </InfoCard>
                <InfoCard title="ঠিকানা" icon={MapPin}>
                    <div className="space-y-4">
                        <div><span className="text-xs font-bold text-gray-400 uppercase">বর্তমান</span><p className="font-medium text-gray-800">{student.present_village}, {student.present_union}, {student.present_upazila}, {student.present_district}</p></div>
                        <div><span className="text-xs font-bold text-gray-400 uppercase">স্থায়ী</span><p className="font-medium text-gray-800">{student.perm_village}, {student.perm_union}, {student.perm_upazila}, {student.perm_district}</p></div>
                    </div>
                </InfoCard>
            </div>
            

            <InfoCard title="একাডেমিক তথ্য" icon={GraduationCap}>
                <InfoRow label="শাখা" value={student.branch_id === 1 || student.branch_id === '1' ? 'হলিধানী বাজার' : 'চাঁন্দুয়ালী বাজার'} />
                <InfoRow label="বিভাগ" value={student.department} />
                <InfoRow label="শ্রেণি" value={student.class_name} />
                <InfoRow label="শিক্ষাবর্ষ" value={student.academic_year} />
                <InfoRow label="রোল নম্বর" value={student.roll_number || '-'} />
                <InfoRow label="আবাসিক" value={student.is_residential ? 'হ্যাঁ' : 'না'} />
            </InfoCard>
            <InfoCard title="অভিভাবকের তথ্য" icon={User} className="w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex gap-4">
                        <div className="w-20 h-20 rounded-lg bg-white p-1 border border-blue-200 flex-shrink-0">{student.father_photo_url ? <img src={student.father_photo_url} className="w-full h-full object-cover rounded" alt="Father" /> : <User className="w-full h-full text-blue-200" />}</div>
                        <div className="flex-1 space-y-1">
                            <h4 className="font-bold text-blue-800 border-b border-blue-200 pb-1 mb-1">পিতা</h4>
                            <p className="text-sm"><span className="font-bold">নাম:</span> {student.father_name_bn} / {student.father_name_en}</p>
                            <p className="text-sm"><span className="font-bold">পেশা:</span> {student.father_occupation}</p>
                            <p className="text-sm"><span className="font-bold">মোবাইল:</span> {student.father_mobile}</p>
                            <div className="pt-2 flex gap-2">
                                {student.father_nid_url && <a href={student.father_nid_url} target="_blank" className="text-xs text-blue-600 underline">NID দেখুন</a>}
                            </div>
                        </div>
                    </div>
                    <div className="bg-pink-50 p-5 rounded-xl border border-pink-100 flex gap-4">
                        <div className="w-20 h-20 rounded-lg bg-white p-1 border border-pink-200 flex-shrink-0">{student.mother_photo_url ? <img src={student.mother_photo_url} className="w-full h-full object-cover rounded" alt="Mother" /> : <User className="w-full h-full text-pink-200" />}</div>
                        <div className="flex-1 space-y-1">
                            <h4 className="font-bold text-pink-800 border-b border-pink-200 pb-1 mb-1">মাতা</h4>
                            <p className="text-sm"><span className="font-bold">নাম:</span> {student.mother_name_bn} / {student.mother_name_en}</p>
                            <p className="text-sm"><span className="font-bold">পেশা:</span> {student.mother_occupation}</p>
                            <p className="text-sm"><span className="font-bold">মোবাইল:</span> {student.mother_mobile}</p>
                            <div className="pt-2 flex gap-2">
                                {student.mother_nid_url && <a href={student.mother_nid_url} target="_blank" className="text-xs text-pink-600 underline">NID দেখুন</a>}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100"><p className="text-sm"><span className="font-bold text-gray-600">জরুরি যোগাযোগ (অভিভাবক):</span> {student.guardian_name} ({student.guardian_relation}) - <span className="font-mono text-green-600 font-bold">{student.guardian_mobile}</span></p></div>
            </InfoCard>
        </TabsContent>

        <TabsContent value="results">
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-center p-10 text-gray-400">রেজাল্ট টেবিল এখানে আসবে</div>
        </TabsContent>
        <TabsContent value="payments">
            <PaymentHistory studentId={student.student_id} />
        </TabsContent>
      </Tabs>

      {/* --- EDIT MODAL (Full Replicated Form) --- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>তথ্য সংশোধন করুন</DialogTitle></DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-8 py-4">
                
                {/* ১. একাডেমিক তথ্য */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
                   <SectionHeader icon={GraduationCap} title="একাডেমিক তথ্য" step="১" />
                   <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">শাখা</label>
                        <select name="branch_id" value={editFormData.branch_id || ""} onChange={(e) => setEditFormData({...editFormData, branch_id: e.target.value, department: "", class_name: ""})} className="w-full h-11 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                          <option value="">সিলেক্ট করুন</option>
                          {dbBranches.length > 0
                            ? dbBranches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)
                            : <><option value="1">হলিধানী বাজার</option><option value="2">চাঁন্দুয়ালী বাজার</option></>}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">বিভাগ</label>
                        <select name="department" value={editFormData.department || ""} onChange={(e) => setEditFormData({...editFormData, department: e.target.value, class_name: ""})} className="w-full h-11 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                          <option value="">সিলেক্ট করুন</option>
                          {dbDepartments.filter(d => String(d.branch_id) === String(editFormData.branch_id)).map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">শ্রেণি</label>
                        <select name="class_name" value={editFormData.class_name || ""} onChange={(e) => setEditFormData({...editFormData, class_name: e.target.value})} className="w-full h-11 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                          <option value="">সিলেক্ট করুন</option>
                          {dbClasses.filter(c => {
                            const dept = dbDepartments.find(d => d.name === editFormData.department && String(d.branch_id) === String(editFormData.branch_id));
                            return String(c.branch_id) === String(editFormData.branch_id) && c.department_id === dept?.id;
                          }).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <InputGroup label="শিক্ষাবর্ষ" name="academic_year" value={editFormData.academic_year} onChange={handleEditChange} type="number" />
                      <InputGroup label="রোল নম্বর" name="roll_number" value={editFormData.roll_number} onChange={handleEditChange} placeholder="যেমন: ১২" />
                   </div>
                </div>

                {/* ২. শিক্ষার্থী তথ্য */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                  <SectionHeader icon={User} title="শিক্ষার্থীর ব্যক্তিগত তথ্য" step="২" />
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                       <InputGroup label="নাম (বাংলায়)" name="name_bn" value={editFormData.name_bn} onChange={handleEditChange} />
                       <InputGroup label="Name (English)" name="name_en" value={editFormData.name_en} onChange={handleEditChange} />
                       <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                         <InputGroup 
                            label="জন্ম সনদ (১৭ ডিজিট)" 
                            name="birth_reg_no" 
                            value={editFormData.birth_reg_no} 
                            onChange={handleEditChange} 
                            onBlur={(e:any) => validateField("birth_reg_no", e.target.value)}
                            error={errors.birth_reg_no} 
                         />
                         <div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">জন্ম তারিখ</label><div className="flex gap-2"><select className="border border-slate-300 rounded-lg h-11 px-2 bg-white w-full" value={dobState.day} onChange={(e) => setDobState({...dobState, day: e.target.value})}>{days.map(d=><option key={d}>{d}</option>)}</select><select className="border border-slate-300 rounded-lg h-11 px-2 bg-white w-full" value={dobState.month} onChange={(e) => setDobState({...dobState, month: e.target.value})}>{months.map(m=><option key={m}>{m}</option>)}</select><select className="border border-slate-300 rounded-lg h-11 px-2 bg-white w-full" value={dobState.year} onChange={(e) => setDobState({...dobState, year: e.target.value})}>{years.map(y=><option key={y}>{y}</option>)}</select></div></div>
                         <SelectGroup label="রক্তের গ্রুপ" name="blood_group" value={editFormData.blood_group} onChange={handleEditChange} options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]} />
                       </div>
                    </div>
                    {/* ফটো আপলোড */}
                    <div className="lg:col-span-4 flex flex-row gap-4 h-32">
                       <div className="flex-1 w-[128px] h-[128px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center relative bg-slate-50 hover:bg-slate-100 cursor-pointer">
                          {editFormData.photo_url ? <img src={editFormData.photo_url} alt="Profile" className="w-full h-full object-cover rounded-xl" /> : <div className="text-center text-xs text-slate-500">ছবি পরিবর্তন</div>}
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'photo_url')} accept="image/*" />
                       </div>
                       <div className="flex-1 w-[128px] h-[128px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center relative bg-slate-50 hover:bg-slate-100 cursor-pointer">
                           {editFormData.birth_cert_url ? <div className="text-center text-green-600 text-xs font-bold">আপলোড আছে</div> : <div className="text-center text-xs text-slate-500">সনদ পরিবর্তন</div>}
                           <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'birth_cert_url')} accept="image/*,.pdf" />
                       </div>
                    </div>
                  </div>
                </div>

                {/* ৩. পিতা-মাতা */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
                   <SectionHeader icon={Users} title="পিতা ও মাতার তথ্য" step="৩" />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4 p-5 bg-blue-50/30 rounded-2xl border border-blue-100">
                         <h4 className="font-bold text-blue-700">পিতা</h4>
                         <div className="grid grid-cols-2 gap-4"><InputGroup label="নাম" name="father_name_bn" value={editFormData.father_name_bn} onChange={handleEditChange} /><InputGroup label="Name (En)" name="father_name_en" value={editFormData.father_name_en} onChange={handleEditChange} /></div>
                         <SelectGroup label="পেশা" name="father_occupation" value={editFormData.father_occupation} onChange={handleEditChange} options={occupations} />
                         <div className="grid grid-cols-2 gap-4"><PhoneInput label="মোবাইল" name="father_mobile" value={editFormData.father_mobile} onChange={handleEditChange} onBlur={(e:any) => validateField("father_mobile", e.target.value)} error={errors.father_mobile} /><InputGroup label="NID" name="father_nid" value={editFormData.father_nid} onChange={handleEditChange} onBlur={(e:any) => validateField("father_nid", e.target.value)} error={errors.father_nid} /></div>
                         <div className="grid grid-cols-2 gap-2 mt-2">
                             <div className="relative border bg-white rounded p-1 text-center h-12 flex items-center justify-center cursor-pointer"><span className="text-[10px] font-bold">ছবি আপডেট</span><input type="file" className="absolute inset-0 opacity-0" onChange={(e) => handleFileUpload(e, 'father_photo_url')} /></div>
                             <div className="relative border bg-white rounded p-1 text-center h-12 flex items-center justify-center cursor-pointer"><span className="text-[10px] font-bold">আইডি আপডেট</span><input type="file" className="absolute inset-0 opacity-0" onChange={(e) => handleFileUpload(e, 'father_nid_url')} /></div>
                         </div>
                      </div>
                      <div className="space-y-4 p-5 bg-pink-50/30 rounded-2xl border border-pink-100">
                         <h4 className="font-bold text-pink-700">মাতার তথ্য</h4>
                         <div className="grid grid-cols-2 gap-4"><InputGroup label="নাম" name="mother_name_bn" value={editFormData.mother_name_bn} onChange={handleEditChange} /><InputGroup label="Name (En)" name="mother_name_en" value={editFormData.mother_name_en} onChange={handleEditChange} /></div>
                         <SelectGroup label="পেশা" name="mother_occupation" value={editFormData.mother_occupation} onChange={handleEditChange} options={occupations} />
                         <div className="grid grid-cols-2 gap-4"><PhoneInput label="মোবাইল" name="mother_mobile" value={editFormData.mother_mobile} onChange={handleEditChange} onBlur={(e:any) => validateField("mother_mobile", e.target.value)} error={errors.mother_mobile} /><InputGroup label="NID" name="mother_nid" value={editFormData.mother_nid} onChange={handleEditChange} onBlur={(e:any) => validateField("mother_nid", e.target.value)} error={errors.mother_nid} /></div>
                         <div className="grid grid-cols-2 gap-2 mt-2">
                             <div className="relative border bg-white rounded p-1 text-center h-12 flex items-center justify-center cursor-pointer"><span className="text-[10px] font-bold">ছবি আপডেট</span><input type="file" className="absolute inset-0 opacity-0" onChange={(e) => handleFileUpload(e, 'mother_photo_url')} /></div>
                             <div className="relative border bg-white rounded p-1 text-center h-12 flex items-center justify-center cursor-pointer"><span className="text-[10px] font-bold">আইডি আপডেট</span><input type="file" className="absolute inset-0 opacity-0" onChange={(e) => handleFileUpload(e, 'mother_nid_url')} /></div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* ৪. অভিভাবক */}
                <div className="bg-white p-6 rounded-xl border border-yellow-200 ring-2 ring-yellow-50 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-400"></div>
                   <SectionHeader icon={Shield} title="অভিভাবক (জরুরি)" step="৪" />
                   <div className="mb-4 max-w-md">
                     <label className="block text-sm font-bold text-slate-700 mb-2">অভিভাবক নির্বাচন করুন</label>
                     <select name="guardian_type" value={editFormData.guardian_type} onChange={(e) => setEditFormData({...editFormData, guardian_type: e.target.value})} className="w-full h-11 px-4 border border-slate-300 rounded-lg bg-white">
                        <option value="father">পিতা</option><option value="mother">মাতা</option><option value="other">অন্যান্য</option>
                     </select>
                   </div>
                   {editFormData.guardian_type === 'other' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <InputGroup label="নাম" name="guardian_name" value={editFormData.guardian_name} onChange={handleEditChange} />
                         <SelectGroup label="সম্পর্ক" name="guardian_relation" value={editFormData.guardian_relation} onChange={handleEditChange} options={relations} />
                         <PhoneInput label="মোবাইল" name="guardian_mobile" value={editFormData.guardian_mobile} onChange={handleEditChange} onBlur={(e:any) => validateField("guardian_mobile", e.target.value)} error={errors.guardian_mobile} />
                      </div>
                   )}
                </div>

                {/* ৫. ঠিকানা */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-500"></div>
                    <SectionHeader icon={MapPin} title="ঠিকানা" step="৫" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                       <div className="space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-2 mb-2">বর্তমান ঠিকানা</h4>
                          <SelectGroup label="বিভাগ" name="present_division" value={editFormData.present_division} onChange={handleEditChange} options={divisions} />
                          <div className="grid grid-cols-2 gap-4"><SelectGroup label="জেলা" name="present_district" value={editFormData.present_district} onChange={handleEditChange} options={editFormData.present_division ? districts[editFormData.present_division] : []} /><SelectGroup label="উপজেলা" name="present_upazila" value={editFormData.present_upazila} onChange={handleEditChange} options={editFormData.present_district ? upazilas[editFormData.present_district] : []} /></div>
                          <InputGroup label="ইউনিয়ন" name="present_union" value={editFormData.present_union} onChange={handleEditChange} />
                          <div className="grid grid-cols-2 gap-4"><InputGroup label="গ্রাম" name="present_village" value={editFormData.present_village} onChange={handleEditChange} /><InputGroup label="কোড" name="present_postcode" value={editFormData.present_postcode} onChange={handleEditChange} /></div>
                       </div>
                       <div className="space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2"><h4 className="font-bold text-slate-700">স্থায়ী ঠিকানা</h4><label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="checkbox" checked={sameAddress} onChange={handleSameAddressToggle} className="accent-green-600 w-4 h-4" /> একই</label></div>
                          <SelectGroup label="বিভাগ" name="perm_division" value={editFormData.perm_division} onChange={handleEditChange} options={divisions} />
                          <div className="grid grid-cols-2 gap-4"><SelectGroup label="জেলা" name="perm_district" value={editFormData.perm_district} onChange={handleEditChange} options={editFormData.perm_division ? districts[editFormData.perm_division] : []} /><SelectGroup label="উপজেলা" name="perm_upazila" value={editFormData.perm_upazila} onChange={handleEditChange} options={editFormData.perm_district ? upazilas[editFormData.perm_district] : []} /></div>
                          <InputGroup label="ইউনিয়ন" name="perm_union" value={editFormData.perm_union} onChange={handleEditChange} />
                          <div className="grid grid-cols-2 gap-4"><InputGroup label="গ্রাম" name="perm_village" value={editFormData.perm_village} onChange={handleEditChange} /><InputGroup label="কোড" name="perm_postcode" value={editFormData.perm_postcode} onChange={handleEditChange} /></div>
                       </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" onClick={() => setIsEditOpen(false)} variant="outline">বাতিল</Button>
                    <Button type="submit" disabled={isUpdating || uploading} className="bg-green-600 hover:bg-green-700">{isUpdating ? "আপডেট হচ্ছে..." : "সংরক্ষণ করুন"}</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {/* Edit Confirmation Modal */}
      <Dialog open={showEditConfirmModal} onOpenChange={setShowEditConfirmModal}>
          <DialogContent className="sm:max-w-sm">
             <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-orange-600"><AlertCircle className="w-5 h-5"/> নিশ্চিতকরণ</DialogTitle>
                <DialogDescription>আপনি কি নিশ্চিত যে আপনি এই তথ্যগুলো পরিবর্তন করতে চান?</DialogDescription>
             </DialogHeader>
             <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditConfirmModal(false)}>না</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={confirmUpdate}>হ্যাঁ, নিশ্চিত</Button>
             </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Success Modal (Simple Message) */}
      <Dialog open={showSuccessModal} onOpenChange={handleSuccessClose}>
         <DialogContent className="sm:max-w-sm text-center">
            <DialogHeader className="sr-only"><DialogTitle>Success</DialogTitle></DialogHeader>
            <div className="mx-auto bg-green-100 p-3 rounded-full w-fit"><CheckCircle className="w-8 h-8 text-green-600"/></div>
            <div className="text-center text-xl mt-2 font-bold text-gray-800">সফল হয়েছে!</div>
            <div className="text-center text-gray-600 mt-1">{successMessage}</div>
            <Button className="mt-4 w-full bg-green-600" onClick={handleSuccessClose}>ঠিক আছে</Button>
         </DialogContent>
      </Dialog>

      <StudentPrintProfile student={student} />

    </div>
  );
}

// --- হেল্পার ---
const Badge = ({ label, color }: { label: string, color: string }) => <span className={`px-3 py-1 rounded-full text-xs font-bold border bg-${color}-50 text-${color}-700 border-${color}-100 capitalize`}>{label}</span>;
const InfoCard = ({ title, icon: Icon, children, className }: any) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4 ${className}`}>
        <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><Icon className="w-5 h-5 text-green-600" /> {title}</h3>
        <div className="space-y-3 text-sm">{children}</div>
    </div>
);
const InfoRow = ({ label, value }: any) => (
    <div className="grid grid-cols-3 py-1 border-b border-dashed border-gray-100 last:border-0">
        <span className="text-gray-500">{label}</span>
        <span className="col-span-2 font-medium text-gray-900">{value || '-'}</span>
    </div>
);
const DocPreview = ({ url, label }: any) => {
    if(!url) return <span className="text-xs text-gray-400 italic">নেই</span>;
    return url.endsWith('.pdf') 
      ? <a href={url} target="_blank" className="flex items-center gap-1 text-red-500 text-xs font-bold bg-red-50 p-2 rounded w-fit"><FileText className="w-4 h-4"/> PDF ফাইল</a>
      : <div className="w-20 h-20 relative border rounded overflow-hidden cursor-pointer hover:opacity-80"><Image src={url} alt={label} fill className="object-cover" /></div>
};
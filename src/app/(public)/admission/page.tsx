"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Send, CheckCircle2, School, UploadCloud, AlertCircle, MapPin } from "lucide-react";
import { divisions, districts, upazilas, unions, departments, classesByDept } from "@/data/bangladesh-data";
import { differenceInYears, differenceInMonths, differenceInDays } from "date-fns";

// পেশার তালিকা
const occupations = [
  "সিলেক্ট করুন", "শিক্ষক", "কৃষক", "ব্যবসায়ী", "চাকরিজীবী", "প্রবাসী", "গৃহিণী", "ডাক্তার", 
  "ইঞ্জিনিয়ার", "ইমাম", "চালক", "শ্রমিক", "আইনজীবী", "দিনমজুর", "অন্যান্য"
];

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];
const years = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i);

// --- কম্পোনেন্টগুলো ---

const InputGroup = ({ label, name, value, onChange, error, required = false, type = "text", placeholder = "", list = "" }: any) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>
    <input 
      type={type} name={name} required={required} 
      value={value} onChange={onChange} 
      placeholder={placeholder}
      className={`w-full h-10 px-3 rounded-md border ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-green-500`} 
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const PhoneInput = ({ label, name, value, onChange, error, required = false }: any) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>
    <div className={`flex h-10 rounded-md border ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} overflow-hidden focus-within:ring-2 focus-within:ring-green-500`}>
      <span className="bg-gray-100 px-3 flex items-center text-gray-600 font-medium border-r border-gray-300">01</span>
      <input 
        type="text" name={name} required={required} maxLength={9}
        value={value} onChange={onChange} 
        placeholder="7XXXXXXXX"
        className="flex-1 px-3 border-none focus:ring-0 outline-none w-full" 
      />
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const OccupationSelect = ({ label, name, value, onChange }: any) => (
  <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select 
          name={name} 
          value={value} 
          onChange={onChange} 
          className="w-full h-10 px-3 border rounded-md focus:ring-2 focus:ring-green-500 bg-white"
      >
          {occupations.map(o => <option key={o} value={o === "সিলেক্ট করুন" ? "" : o}>{o}</option>)}
      </select>
  </div>
);

export default function AdmissionPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);

  const [dobState, setDobState] = useState({ day: "", month: "", year: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    department: "",
    class_name: "",
    residential_status: "residential",
    branch_id: "",

    name_bn: "",
    name_en: "",
    dob: "",
    age_info: "",
    birth_reg_no: "",
    blood_group: "",
    photo_url: "",
    birth_cert_url: "",

    father_alive: "yes",
    father_name_bn: "",
    father_name_en: "",
    father_nid: "",
    father_occupation: "",
    father_mobile: "",
    father_nid_url: "",

    mother_alive: "yes",
    mother_name_bn: "",
    mother_name_en: "",
    mother_nid: "",
    mother_occupation: "",
    mother_mobile: "",
    mother_nid_url: "",

    guardian_name: "",
    guardian_relation: "",
    guardian_mobile: "",
    guardian_nid: "",
    guardian_photo_url: "",

    present_division: "",
    present_district: "",
    present_upazila: "",
    present_union: "",
    present_village: "",
    present_postcode: "",

    perm_division: "",
    perm_district: "",
    perm_upazila: "",
    perm_union: "",
    perm_village: "",
    perm_postcode: "",
  });

  const isGuardianMandatory = formData.father_alive === "no" && formData.mother_alive === "no";

  useEffect(() => {
    if (dobState.day && dobState.month && dobState.year) {
      const monthIndex = months.indexOf(dobState.month);
      const dateObj = new Date(parseInt(dobState.year), monthIndex, parseInt(dobState.day));
      
      if (dateObj.getDate() !== parseInt(dobState.day)) {
        setErrors(prev => ({ ...prev, dob: "তারিখ সঠিক নয়" }));
        setFormData(prev => ({ ...prev, dob: "", age_info: "" }));
        return;
      }

      const formattedDate = `${dobState.year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dobState.day).padStart(2, '0')}`;
      
      const today = new Date();
      const diffYears = differenceInYears(today, dateObj);
      const diffMonths = differenceInMonths(today, dateObj) % 12;
      const diffDays = differenceInDays(today, dateObj) % 30;

      setErrors(prev => ({ ...prev, dob: "" }));
      setFormData(prev => ({ 
        ...prev, 
        dob: formattedDate,
        age_info: `${diffYears} বছর ${diffMonths} মাস ${diffDays} দিন` 
      }));
    }
  }, [dobState]);

  const validateField = (name: string, value: string) => {
    let errorMsg = "";

    if (name.includes("mobile") && value.length > 0) {
      if (!/^\d{9}$/.test(value)) errorMsg = "বাকি ৯ ডিজিট দিন";
    }
    
    if (name === "birth_reg_no" && value.length > 0) {
      if (!/^\d{17}$/.test(value)) errorMsg = "অবশ্যই ১৭ ডিজিট হতে হবে";
    }

    if (name.includes("nid") && !name.includes("url") && value.length > 0) {
      if (!/^(?:\d{10}|\d{13}|\d{17})$/.test(value)) errorMsg = "এনআইডি ১০, ১৩ বা ১৭ ডিজিট হতে হবে";
    }

    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if ((name.includes("mobile") || name.includes("nid") || name.includes("reg_no")) && isNaN(Number(value))) return;

    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (sameAddress && name.startsWith("present_")) {
        const fieldSuffix = name.replace("present_", "");
        // @ts-ignore
        updated[`perm_${fieldSuffix}`] = value;
      }
      return updated;
    });

    validateField(name, value);

    if (name === "present_division") setFormData(prev => ({ ...prev, present_division: value, present_district: "", present_upazila: "", present_union: "" }));
    if (name === "present_district") setFormData(prev => ({ ...prev, present_district: value, present_upazila: "", present_union: "" }));
    if (name === "present_upazila") setFormData(prev => ({ ...prev, present_upazila: value, present_union: "" }));

    if (name === "perm_division") setFormData(prev => ({ ...prev, perm_division: value, perm_district: "", perm_upazila: "", perm_union: "" }));
    if (name === "perm_district") setFormData(prev => ({ ...prev, perm_district: value, perm_upazila: "", perm_union: "" }));
    if (name === "perm_upazila") setFormData(prev => ({ ...prev, perm_upazila: value, perm_union: "" }));
  };

  const handleSameAddressToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSameAddress(e.target.checked);
    if (e.target.checked) {
      setFormData(prev => ({
        ...prev,
        perm_division: prev.present_division,
        perm_district: prev.present_district,
        perm_upazila: prev.present_upazila,
        perm_union: prev.present_union,
        perm_village: prev.present_village,
        perm_postcode: prev.present_postcode,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        perm_division: "", perm_district: "", perm_upazila: "", perm_union: "", perm_village: "", perm_postcode: ""
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const file = e.target.files[0];
    const fileName = `${Date.now()}_${Math.random()}.${file.name.split('.').pop()}`;
    const filePath = `documents/${fileName}`;

    try {
      const { error } = await supabase.storage.from('images').upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, [fieldName]: data.publicUrl }));
    } catch (error) {
      alert("আপলোড ব্যর্থ হয়েছে।");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasErrors = Object.values(errors).some(msg => msg !== "");
    if (hasErrors) {
      alert("ফর্মে লাল দাগ দেওয়া ভুলগুলো সংশোধন করুন।");
      return;
    }
    
    if (!formData.dob) {
      alert("জন্ম তারিখ সঠিকভাবে সিলেক্ট করুন।");
      return;
    }

    if (!formData.branch_id) {
        alert("দয়া করে শাখা নির্বাচন করুন।");
        return;
    }

    if (isGuardianMandatory && (!formData.guardian_name || !formData.guardian_mobile)) {
      alert("পিতা-মাতা মৃত হওয়ায় অভিভাবকের তথ্য বাধ্যতামূলক।");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        branch_id: parseInt(formData.branch_id),
        father_alive: formData.father_alive === "yes",
        mother_alive: formData.mother_alive === "yes",
        father_mobile: formData.father_mobile ? "01" + formData.father_mobile : "",
        mother_mobile: formData.mother_mobile ? "01" + formData.mother_mobile : "",
        guardian_mobile: formData.guardian_mobile ? "01" + formData.guardian_mobile : "",
      };

      const { error } = await supabase.from('students').insert([payload]);
      if (error) throw error;
      setSuccess(true);
      window.scrollTo(0, 0);
    } catch (error) {
      alert("সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 bg-green-50 rounded-xl m-4 text-center">
        <CheckCircle2 className="w-20 h-20 text-green-600 mb-4" />
        <h2 className="text-3xl font-bold text-gray-800">আবেদন সফল হয়েছে!</h2>
        <p className="text-gray-600 mt-2">আপনার তথ্য আমাদের ডাটাবেসে জমা হয়েছে।</p>
        <Button onClick={() => window.location.reload()} className="mt-6 bg-green-600">নতুন আবেদন</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto my-8 bg-white rounded-xl shadow-lg border border-green-100 overflow-hidden">
      <div className="bg-green-700 p-6 md:p-8 text-center text-white">
        <School className="w-12 h-12 mx-auto mb-2 opacity-90" />
        <h1 className="text-2xl md:text-3xl font-bold">শিক্ষার্থী ভর্তি ফরম</h1>
        <p className="text-green-100 text-sm mt-1">সঠিক তথ্য দিয়ে ফরমটি পূরণ করুন (ইংরেজিতে নাম বড় হাতের অক্ষরে লিখবেন)</p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-10">

        {/* ১. একাডেমিক */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-green-800 border-b pb-2 flex items-center gap-2">
            <span className="bg-green-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">১</span> একাডেমিক তথ্য
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1">
               <label className="text-sm font-medium">শাখা *</label>
               <select name="branch_id" value={formData.branch_id} onChange={handleChange} className="w-full h-10 px-3 border rounded-md" required>
                 <option value="">শাখা নির্বাচন করুন</option>
                 <option value="1">হলিধানী বাজার শাখা</option>
                 <option value="2">চাঁন্দুয়ালী বাজার শাখা</option>
               </select>
            </div>

            <div className="space-y-1">
               <label className="text-sm font-medium">বিভাগ *</label>
               <select name="department" required value={formData.department} onChange={handleChange} className="w-full h-10 px-3 border rounded-md">
                 <option value="">সিলেক্ট করুন</option>
                 {departments.map(d => <option key={d} value={d}>{d}</option>)}
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-sm font-medium">জামাত/শ্রেণি *</label>
               <select name="class_name" required value={formData.class_name} onChange={handleChange} className="w-full h-10 px-3 border rounded-md">
                 <option value="">--</option>
                 {formData.department && classesByDept[formData.department]?.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">আবাসন</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2"><input type="radio" name="residential_status" value="residential" checked={formData.residential_status === "residential"} onChange={handleChange} className="accent-green-600" /> আবাসিক</label>
                <label className="flex items-center gap-2"><input type="radio" name="residential_status" value="non_residential" checked={formData.residential_status === "non_residential"} onChange={handleChange} className="accent-green-600" /> ডে-কেয়ার/অনাবাসিক</label>
              </div>
            </div>
          </div>
        </section>

        {/* ২. শিক্ষার্থী */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-green-800 border-b pb-2 flex items-center gap-2">
            <span className="bg-green-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">২</span> শিক্ষার্থীর তথ্য
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup 
              label="পূর্ণ নাম (বাংলায়)" name="name_bn" required placeholder="উদাঃ আয়েশা সিদ্দিকা" 
              value={formData.name_bn} onChange={handleChange} error={errors.name_bn}
            />
            <InputGroup 
              label="Full Name (English)" name="name_en" required placeholder="e.g. AYESHA SIDDIKA" 
              value={formData.name_en} onChange={handleChange} error={errors.name_en}
            />
          </div>
          
          {/* জন্ম তারিখ, জন্ম নিবন্ধন এবং রক্তের গ্রুপ একই লাইনে */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* জন্ম তারিখ (৫ কলাম) */}
              <div className="md:col-span-5 space-y-1">
                  <label className="text-sm font-medium">জন্ম তারিখ *</label>
                  <div className="grid grid-cols-3 gap-2">
                      <select 
                          value={dobState.day} 
                          onChange={(e) => setDobState({...dobState, day: e.target.value})} 
                          className="h-10 px-1 border rounded-md bg-white text-sm"
                      >
                          <option value="">দিন</option>
                          {days.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>

                      <select 
                          value={dobState.month} 
                          onChange={(e) => setDobState({...dobState, month: e.target.value})} 
                          className="h-10 px-1 border rounded-md bg-white text-sm"
                      >
                          <option value="">মাস</option>
                          {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>

                      <select 
                          value={dobState.year} 
                          onChange={(e) => setDobState({...dobState, year: e.target.value})} 
                          className="h-10 px-1 border rounded-md bg-white text-sm"
                      >
                          <option value="">বছর</option>
                          {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                  </div>
                  
                  <div className="flex items-center gap-2 min-h-[20px]">
                      {errors.dob && <span className="text-xs text-red-500 font-medium">{errors.dob}</span>}
                      {formData.age_info && !errors.dob && (
                          <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                          বয়স: {formData.age_info}
                          </span>
                      )}
                  </div>
              </div>

              {/* জন্ম নিবন্ধন (৪ কলাম) */}
              <div className="md:col-span-4">
                 <InputGroup 
                   label="জন্ম নিবন্ধন (১৭ ডিজিট)" name="birth_reg_no" required placeholder="শুধুমাত্র সংখ্যা" 
                   value={formData.birth_reg_no} onChange={handleChange} error={errors.birth_reg_no}
                 />
              </div>

              {/* রক্তের গ্রুপ (৩ কলাম) */}
              <div className="md:col-span-3 space-y-1">
                  <label className="text-sm font-medium">রক্তের গ্রুপ</label>
                  <select name="blood_group" value={formData.blood_group} onChange={handleChange} className="w-full h-10 px-2 border rounded-md bg-white text-sm">
                      <option value="">অজানা</option>
                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
              </div>

          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="border border-dashed border-gray-300 p-4 rounded-lg flex items-center justify-between bg-gray-50">
               <div>
                  <p className="text-sm font-medium text-gray-700">শিক্ষার্থীর ছবি *</p>
               </div>
               <div className="flex items-center gap-2">
                  {formData.photo_url && <img src={formData.photo_url} className="w-10 h-10 rounded object-cover border" alt="preview" />}
                  <input type="file" id="stu_photo" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'photo_url')} />
                  <label htmlFor="stu_photo" className="cursor-pointer bg-white border px-3 py-1.5 rounded text-sm hover:bg-gray-100 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4" /> আপলোড
                  </label>
               </div>
            </div>

            <div className="border border-dashed border-gray-300 p-4 rounded-lg flex items-center justify-between bg-gray-50">
               <div>
                  <p className="text-sm font-medium text-gray-700">জন্ম সনদ কপি *</p>
               </div>
               <div className="flex items-center gap-2">
                  {formData.birth_cert_url && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  <input type="file" id="stu_cert" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'birth_cert_url')} />
                  <label htmlFor="stu_cert" className="cursor-pointer bg-white border px-3 py-1.5 rounded text-sm hover:bg-gray-100 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4" /> আপলোড
                  </label>
               </div>
            </div>
          </div>
        </section>

        {/* ৩. পিতা ও মাতা */}
        <section className="space-y-6">
          <h3 className="text-lg font-bold text-green-800 border-b pb-2 flex items-center gap-2">
            <span className="bg-green-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">৩</span> পিতা ও মাতার তথ্য
          </h3>

          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
             <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-gray-700 flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> পিতার তথ্য</h4>
                <div className="flex gap-3 text-sm">
                  <span>জীবিত?</span>
                  <label className="flex gap-1"><input type="radio" name="father_alive" value="yes" checked={formData.father_alive === "yes"} onChange={handleChange}/> হ্যাঁ</label>
                  <label className="flex gap-1"><input type="radio" name="father_alive" value="no" checked={formData.father_alive === "no"} onChange={handleChange}/> না</label>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputGroup label="নাম (বাংলায়)" name="father_name_bn" required value={formData.father_name_bn} onChange={handleChange} error={errors.father_name_bn} />
                <InputGroup label="Name (English)" name="father_name_en" required value={formData.father_name_en} onChange={handleChange} error={errors.father_name_en} />
                
                <OccupationSelect label="পেশা" name="father_occupation" value={formData.father_occupation} onChange={handleChange} />

                <PhoneInput label="মোবাইল নম্বর" name="father_mobile" required value={formData.father_mobile} onChange={handleChange} error={errors.father_mobile} />
                <InputGroup label="এনআইডি/জন্ম নিবন্ধন" name="father_nid" placeholder="১০/১৩/১৭ ডিজিট" value={formData.father_nid} onChange={handleChange} error={errors.father_nid} />
                <div className="border border-dashed border-gray-300 p-3 rounded bg-white flex items-center justify-between">
                   <span className="text-sm text-gray-600">আইডি কার্ডের ছবি</span>
                   <div className="flex items-center gap-2">
                      {formData.father_nid_url && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                      <input type="file" id="f_nid" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'father_nid_url')} />
                      <label htmlFor="f_nid" className="cursor-pointer text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">আপলোড</label>
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-pink-50/50 p-5 rounded-xl border border-pink-100">
             <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-gray-700 flex items-center gap-2"><div className="w-2 h-2 bg-pink-500 rounded-full"></div> মাতার তথ্য</h4>
                <div className="flex gap-3 text-sm">
                  <span>জীবিত?</span>
                  <label className="flex gap-1"><input type="radio" name="mother_alive" value="yes" checked={formData.mother_alive === "yes"} onChange={handleChange}/> হ্যাঁ</label>
                  <label className="flex gap-1"><input type="radio" name="mother_alive" value="no" checked={formData.mother_alive === "no"} onChange={handleChange}/> না</label>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputGroup label="নাম (বাংলায়)" name="mother_name_bn" required value={formData.mother_name_bn} onChange={handleChange} error={errors.mother_name_bn} />
                <InputGroup label="Name (English)" name="mother_name_en" required value={formData.mother_name_en} onChange={handleChange} error={errors.mother_name_en} />
                
                <OccupationSelect label="পেশা" name="mother_occupation" value={formData.mother_occupation} onChange={handleChange} />

                <PhoneInput label="মোবাইল নম্বর" name="mother_mobile" required value={formData.mother_mobile} onChange={handleChange} error={errors.mother_mobile} />
                <InputGroup label="এনআইডি/জন্ম নিবন্ধন" name="mother_nid" value={formData.mother_nid} onChange={handleChange} error={errors.mother_nid} />
                <div className="border border-dashed border-gray-300 p-3 rounded bg-white flex items-center justify-between">
                   <span className="text-sm text-gray-600">আইডি কার্ডের ছবি</span>
                   <div className="flex items-center gap-2">
                      {formData.mother_nid_url && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                      <input type="file" id="m_nid" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'mother_nid_url')} />
                      <label htmlFor="m_nid" className="cursor-pointer text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">আপলোড</label>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* ৪. স্থানীয় অভিভাবক */}
        {isGuardianMandatory && (
           <section className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-bold text-yellow-800 mb-4 flex gap-2"><AlertCircle className="w-5 h-5"/> স্থানীয় অভিভাবক (বাধ্যতামূলক)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <InputGroup label="নাম" name="guardian_name" required value={formData.guardian_name} onChange={handleChange} error={errors.guardian_name} />
                 <InputGroup label="সম্পর্ক" name="guardian_relation" placeholder="যেমনঃ দাদা/চাচা" value={formData.guardian_relation} onChange={handleChange} error={errors.guardian_relation} />
                 <PhoneInput label="মোবাইল নম্বর" name="guardian_mobile" required value={formData.guardian_mobile} onChange={handleChange} error={errors.guardian_mobile} />
                 <div className="border border-dashed border-yellow-300 p-3 rounded bg-white">
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'guardian_photo_url')} />
                 </div>
              </div>
           </section>
        )}

        {/* ৫. ঠিকানা */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-green-800 border-b pb-2 flex items-center gap-2">
            <span className="bg-green-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">৫</span> ঠিকানা
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* বর্তমান ঠিকানা */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
               <h4 className="font-bold text-gray-700 flex items-center gap-2"><MapPin className="w-4 h-4"/> বর্তমান ঠিকানা</h4>
               
               <div className="space-y-1">
                 <label className="text-sm font-medium">বিভাগ</label>
                 <select name="present_division" value={formData.present_division} onChange={handleChange} className="w-full h-10 px-2 border rounded bg-white">
                   <option value="">সিলেক্ট করুন</option>
                   {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
               </div>
               
               <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">জেলা</label>
                    <select name="present_district" value={formData.present_district} onChange={handleChange} className="w-full h-10 px-2 border rounded bg-white">
                      <option value="">--</option>
                      {formData.present_division && districts[formData.present_division]?.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">উপজেলা</label>
                    {formData.present_district && upazilas[formData.present_district] ? (
                        <select name="present_upazila" value={formData.present_upazila} onChange={handleChange} className="w-full h-10 px-2 border rounded bg-white">
                            <option value="">--</option>
                            {upazilas[formData.present_district].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    ) : (
                        <input type="text" name="present_upazila" value={formData.present_upazila} onChange={handleChange} placeholder="উপজেলার নাম" className="w-full h-10 px-3 border rounded-md" />
                    )}
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-sm font-medium">ইউনিয়ন/ওয়ার্ড</label>
                  {formData.present_upazila && unions[formData.present_upazila] ? (
                    <select name="present_union" value={formData.present_union} onChange={handleChange} className="w-full h-10 px-2 border rounded bg-white">
                        <option value="">সিলেক্ট করুন</option>
                        {unions[formData.present_upazila].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  ) : (
                    <input type="text" name="present_union" value={formData.present_union} onChange={handleChange} placeholder="ইউনিয়নের নাম" className="w-full h-10 px-3 border rounded-md" />
                  )}
               </div>

               <InputGroup label="গ্রাম/মহল্লা ও বাড়ি" name="present_village" placeholder="বিস্তারিত লিখুন" value={formData.present_village} onChange={handleChange} error={errors.present_village} />
               <InputGroup label="পোস্ট কোড" name="present_postcode" placeholder="উদাঃ ৭৩০০" value={formData.present_postcode} onChange={handleChange} error={errors.present_postcode} />
            </div>

            {/* স্থায়ী ঠিকানা */}
            <div className={`bg-gray-50 p-4 rounded-lg space-y-3 relative ${sameAddress ? 'opacity-70 pointer-events-none' : ''}`}>
               <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gray-700 flex items-center gap-2"><MapPin className="w-4 h-4"/> স্থায়ী ঠিকানা</h4>
                  <label className="flex items-center gap-2 text-xs cursor-pointer bg-white px-2 py-1 rounded border shadow-sm select-none pointer-events-auto">
                    <input type="checkbox" checked={sameAddress} onChange={handleSameAddressToggle} className="accent-green-600" />
                    সেম এড্রেস
                  </label>
               </div>

               <div className="space-y-1">
                 <label className="text-sm font-medium">বিভাগ</label>
                 <select name="perm_division" value={formData.perm_division} onChange={handleChange} className="w-full h-10 px-2 border rounded bg-white">
                   <option value="">সিলেক্ট করুন</option>
                   {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
               </div>

               <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">জেলা</label>
                    <select name="perm_district" value={formData.perm_district} onChange={handleChange} className="w-full h-10 px-2 border rounded bg-white">
                      <option value="">--</option>
                      {formData.perm_division && districts[formData.perm_division]?.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">উপজেলা</label>
                    {formData.perm_district && upazilas[formData.perm_district] ? (
                        <select name="perm_upazila" value={formData.perm_upazila} onChange={handleChange} className="w-full h-10 px-2 border rounded bg-white">
                            <option value="">--</option>
                            {upazilas[formData.perm_district].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    ) : (
                        <input type="text" name="perm_upazila" value={formData.perm_upazila} onChange={handleChange} placeholder="উপজেলার নাম" className="w-full h-10 px-3 border rounded-md" />
                    )}
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-sm font-medium">ইউনিয়ন/ওয়ার্ড</label>
                  {formData.perm_upazila && unions[formData.perm_upazila] ? (
                    <select name="perm_union" value={formData.perm_union} onChange={handleChange} className="w-full h-10 px-2 border rounded bg-white">
                        <option value="">সিলেক্ট করুন</option>
                        {unions[formData.perm_upazila].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  ) : (
                    <input type="text" name="perm_union" value={formData.perm_union} onChange={handleChange} placeholder="ইউনিয়নের নাম" className="w-full h-10 px-3 border rounded-md" />
                  )}
               </div>

               <InputGroup label="গ্রাম/মহল্লা ও বাড়ি" name="perm_village" value={formData.perm_village} onChange={handleChange} error={errors.perm_village} />
               <InputGroup label="পোস্ট কোড" name="perm_postcode" value={formData.perm_postcode} onChange={handleChange} error={errors.perm_postcode} />
            </div>
          </div>
        </section>

        {/* সাবমিট */}
        <div className="pt-4">
          <Button type="submit" disabled={loading || uploading} className="w-full bg-green-700 hover:bg-green-800 text-white h-14 text-lg font-bold shadow-lg transition-transform active:scale-95">
            {loading ? <><Loader2 className="mr-2 animate-spin" /> জমা হচ্ছে...</> : <><Send className="mr-2" /> আবেদন সম্পন্ন করুন</>}
          </Button>
          <p className="text-center text-xs text-gray-500 mt-4">সাবমিট করার আগে সব তথ্য ভালো করে যাচাই করে নিন।</p>
        </div>

      </form>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Loader2, User, Phone, BookOpen, School, Upload } from "lucide-react";

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("all");
  
  // Alert Dialog State
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({ title: "", description: "", action: async () => {} });

  // Form State
  const [formData, setFormData] = useState({ 
    id: "", 
    name: "", 
    phone: "", 
    designation: "", 
    subject_specialty: "", 
    user_id: "", 
    password: "",
    branch_id: "",
    image_url: ""
  });
  const [isEdit, setIsEdit] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Cloudinary Config
  const CLOUD_NAME = "dfo1slmdy"; 
  const UPLOAD_PRESET = "rahima_preset"; 

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [selectedBranch]);

  const fetchBranches = async () => {
    const { data } = await supabase.from("branches").select("*");
    if (data) setBranches(data);
  };

  const fetchTeachers = async () => {
    setLoading(true);
    let query = supabase.from("teachers").select(`
      *,
      branches (
        name
      )
    `).order("created_at", { ascending: false });

    if (selectedBranch !== "all") {
      query = query.eq("branch_id", selectedBranch);
    }

    const { data, error } = await query;
    if (data) setTeachers(data);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);

    const file = e.target.files[0];
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("upload_preset", UPLOAD_PRESET);

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, { 
            method: "POST", 
            body: formDataUpload 
        });
        const data = await res.json();
        
        if (data.secure_url) {
            setFormData(prev => ({ ...prev, image_url: data.secure_url }));
        } else {
            console.error("Cloudinary Error:", data);
            alert("আপলোড ব্যর্থ হয়েছে! আবার চেষ্টা করুন।");
        }
    } catch (error) {
        console.error("Upload error:", error);
        alert("ইন্টারনেট সংযোগ চেক করুন!");
    }
    setUploading(false);
  };

  const confirmAction = (title: string, description: string, action: () => Promise<void>) => {
    setAlertConfig({ title, description, action });
    setAlertOpen(true);
  };

  const handleAlertConfirm = async () => {
    await alertConfig.action();
    setAlertOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false); // Close modal first

    confirmAction(
        isEdit ? "শিক্ষক তথ্য আপডেট" : "নতুন শিক্ষক যোগ",
        isEdit ? "আপনি কি নিশ্চিত এই শিক্ষকের তথ্য আপডেট করতে চান?" : "আপনি কি নিশ্চিত এই নতুন শিক্ষককে যুক্ত করতে চান?",
        async () => {
            setIsSubmitting(true);

            const payload = {
                name: formData.name,
                phone: formData.phone,
                designation: formData.designation,
                subject_specialty: formData.subject_specialty,
                user_id: formData.user_id,
                password: formData.password,
                branch_id: formData.branch_id ? parseInt(formData.branch_id) : null,
                image_url: formData.image_url
            };
        
            let error;
            if (isEdit && formData.id) {
                const { error: err } = await supabase.from("teachers").update(payload).eq("id", formData.id);
                error = err;
            } else {
                const { error: err } = await supabase.from("teachers").insert([payload]);
                error = err;
            }
        
            if (error) {
                alert("সমস্যা হয়েছে: " + error.message);
                setIsOpen(true); // Re-open modal on error
            } else {
                resetForm();
                fetchTeachers();
            }
            setIsSubmitting(false);
        }
    );
  };

  const resetForm = () => {
    setFormData({ 
      id: "", 
      name: "", 
      phone: "", 
      designation: "", 
      subject_specialty: "", 
      user_id: "", 
      password: "",
      branch_id: "",
      image_url: ""
    });
  };

  const handleDelete = async (id: string) => {
    confirmAction(
        "শিক্ষক মুছে ফেলা",
        "আপনি কি নিশ্চিত এই শিক্ষককে ডিলিট করতে চান? এই অ্যাকশনটি ফিরিয়ে নেওয়া যাবে না।",
        async () => {
            const { error } = await supabase.from("teachers").delete().eq("id", id);
            if (error) {
                alert("ডিলেট করতে সমস্যা হয়েছে: " + error.message);
            } else {
                fetchTeachers();
            }
        }
    );
  };

  const openEdit = (teacher: any) => {
      setFormData({
        id: teacher.id || "",
        name: teacher.name || "",
        phone: teacher.phone || "",
        designation: teacher.designation || "",
        subject_specialty: teacher.subject_specialty || "",
        user_id: teacher.user_id || "",
        password: teacher.password || "",
        branch_id: teacher.branch_id ? String(teacher.branch_id) : "",
        image_url: teacher.image_url || ""
      });
      setIsEdit(true);
      setIsOpen(true);
  };

  const openAdd = () => {
      resetForm();
      setIsEdit(false);
      setIsOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl border shadow-sm gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600"/> শিক্ষক তালিকা
            </h1>
            <p className="text-sm text-gray-500">মাদ্রাসার সকল শিক্ষকদের তালিকা ও তথ্য</p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2"/> নতুন শিক্ষক
        </Button>
      </div>

      {/* Branch Tabs */}
      <div className="w-full">
        <Tabs defaultValue="all" value={selectedBranch} onValueChange={setSelectedBranch} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 h-auto p-1 bg-gray-100 rounded-lg gap-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              সকল শাখা
            </TabsTrigger>
            {branches.map((branch) => (
              <TabsTrigger key={branch.id} value={String(branch.id)} className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                {branch.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
            <TableHeader className="bg-gray-50">
                <TableRow>
                    <TableHead>নাম</TableHead>
                    <TableHead>পদবী</TableHead>
                    <TableHead>শাখা</TableHead>
                    <TableHead>মোবাইল</TableHead>
                    <TableHead>বিষয় দক্ষতা</TableHead>
                    <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600"/></TableCell></TableRow>
                ) : teachers.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-400">কোনো তথ্য নেই</TableCell></TableRow>
                ) : (
                    teachers.map((t) => (
                        <TableRow key={t.id}>
                            <TableCell className="font-bold text-gray-700">{t.name}</TableCell>
                            <TableCell>{t.designation}</TableCell>
                            <TableCell>
                              {t.branches ? (
                                <span className="flex items-center gap-1 text-gray-600 text-sm">
                                  <School className="w-3 h-3" /> {t.branches.name}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs italic">নির্ধারিত নেই</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono">{t.phone}</TableCell>
                            <TableCell><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs">{t.subject_specialty}</span></TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Edit className="w-4 h-4 text-gray-500"/></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="w-4 h-4 text-red-400"/></Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle>{isEdit ? "শিক্ষক তথ্য সংশোধন" : "নতুন শিক্ষক যোগ করুন"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-600">শাখা নির্বাচন করুন</label>
                    <Select 
                      value={formData.branch_id} 
                      onValueChange={(value) => setFormData({...formData, branch_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="শাখা নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={String(branch.id)}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1"><label className="text-sm font-bold text-gray-600">নাম</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="শিক্ষকের নাম" /></div>
                  <div className="space-y-1"><label className="text-sm font-bold text-gray-600">পদবী</label><Input value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} placeholder="উদাঃ সহকারী শিক্ষক" /></div>
                  <div className="space-y-1"><label className="text-sm font-bold text-gray-600">মোবাইল</label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="01XXXXXXXXX" /></div>
                  <div className="space-y-1"><label className="text-sm font-bold text-gray-600">বিষয় দক্ষতা</label><Input value={formData.subject_specialty} onChange={e => setFormData({...formData, subject_specialty: e.target.value})} placeholder="উদাঃ আরবি, বাংলা" /></div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-600">শিক্ষকের ছবি (ঐচ্ছিক)</label>
                    <div className="flex gap-2 items-center">
                        <Input 
                            value={formData.image_url || ""} 
                            onChange={(e) => setFormData({...formData, image_url: e.target.value})} 
                            placeholder="ছবির লিংক অথবা আপলোড করুন" 
                            className="flex-1"
                        />
                        <div className="relative">
                            <input 
                                type="file" 
                                id="teacher-photo" 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                            <label 
                                htmlFor="teacher-photo" 
                                className={`flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md cursor-pointer border border-gray-300 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {uploading ? "আপলোড..." : "আপলোড"}
                            </label>
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="col-span-2 text-xs font-bold text-gray-500 uppercase">লগইন তথ্য</div>
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-600">ইউজার আইডি</label>
                        <Input value={formData.user_id} onChange={e => setFormData({...formData, user_id: e.target.value})} placeholder="teacher123" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-600">পাসওয়ার্ড</label>
                        <Input value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="******" type="text" />
                    </div>
                  </div>

                  <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>বাতিল</Button>
                      <Button type="submit" disabled={isSubmitting} className="bg-blue-600">{isSubmitting ? <Loader2 className="animate-spin"/> : "সংরক্ষণ করুন"}</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleAlertConfirm} className="bg-red-600 hover:bg-red-700">
              নিশ্চিত করুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

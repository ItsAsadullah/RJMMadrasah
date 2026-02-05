"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Upload, User, Info, Target, Layers, BookOpen, Eye } from "lucide-react";
import Image from "next/image";

type HomeSection = {
  id?: number;
  section_key: string;
  title: string;
  subtitle?: string;
  content: string;
  image_url?: string;
  additional_data?: any;
  is_active: boolean;
};

export default function HomeContentManagement() {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<Record<string, HomeSection>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("home_sections").select("*");
    
    if (error) {
      console.error("Error fetching sections:", error);
    } else if (data) {
      const sectionMap: Record<string, HomeSection> = {};
      data.forEach((section: HomeSection) => {
        sectionMap[section.section_key] = section;
      });
      setSections(sectionMap);
    }
    setLoading(false);
  };

  const handleSave = async (sectionKey: string, data: Partial<HomeSection>) => {
    setSaving(true);
    const existing = sections[sectionKey];
    
    const payload = {
      section_key: sectionKey,
      title: data.title || "",
      subtitle: data.subtitle || "",
      content: data.content || "",
      image_url: data.image_url || "",
      additional_data: data.additional_data || {},
      is_active: data.is_active !== undefined ? data.is_active : true,
    };

    let error;
    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("home_sections")
        .update(payload)
        .eq("id", existing.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("home_sections")
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      alert("সংরক্ষণ করা যায়নি: " + error.message);
    } else {
      alert("সফলভাবে সংরক্ষণ করা হয়েছে!");
      fetchSections();
    }
    setSaving(false);
  };

  const SectionForm = ({ sectionKey, title, defaultTitle }: { sectionKey: string, title: string, defaultTitle: string }) => {
    const section = sections[sectionKey] || { title: defaultTitle, content: "", image_url: "" };
    const [formData, setFormData] = useState(section);
    const [uploading, setUploading] = useState(false);
    
    // Cloudinary Config
    const CLOUD_NAME = "dfo1slmdy"; 
    const UPLOAD_PRESET = "rahima_preset"; 

    useEffect(() => {
        setFormData(sections[sectionKey] || { title: defaultTitle, content: "", image_url: "" });
    }, [sections, sectionKey, defaultTitle]);

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

    return (
      <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">স্ট্যাটাস:</label>
                <input 
                    type="checkbox" 
                    checked={formData.is_active !== false} 
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="toggle-checkbox"
                />
            </div>
        </div>

        <div className="grid gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">শিরোনাম</label>
            <Input 
                value={formData.title || ""} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                placeholder="শিরোনাম দিন" 
            />
          </div>

          {sectionKey === "director" && (
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">পদবী / সাব-টাইটেল</label>
                <Input 
                    value={formData.subtitle || ""} 
                    onChange={(e) => setFormData({...formData, subtitle: e.target.value})} 
                    placeholder="উদাঃ পরিচালক" 
                />
             </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">বিস্তারিত বিবরণ</label>
            <Textarea 
                value={formData.content || ""} 
                onChange={(e) => setFormData({...formData, content: e.target.value})} 
                placeholder="বিস্তারিত লিখুন..." 
                className="min-h-[200px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">ছবি URL</label>
            <div className="flex gap-2 items-center">
                <Input 
                    value={formData.image_url || ""} 
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})} 
                    placeholder="ছবির লিংক দিন অথবা আপলোড করুন" 
                    className="flex-1"
                />
                <div className="relative">
                    <input 
                        type="file" 
                        id={`file-${sectionKey}`} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                    />
                    <label 
                        htmlFor={`file-${sectionKey}`} 
                        className={`flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md cursor-pointer border border-gray-300 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? "আপলোড হচ্ছে..." : "আপলোড"}
                    </label>
                </div>
            </div>
            {formData.image_url && (
                <div className="mt-2 relative w-32 h-32 border rounded overflow-hidden">
                    <Image src={formData.image_url} alt="Preview" fill className="object-cover" />
                </div>
            )}
          </div>

          <Button 
            onClick={() => handleSave(sectionKey, formData)} 
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
          >
            {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />}
            সংরক্ষণ করুন
          </Button>
        </div>
      </div>
    );
  };

  const DepartmentsForm = () => {
      const sectionKey = "departments";
      const section = sections[sectionKey] || { title: "বিভাগসমূহ", additional_data: { items: [] } };
      const [items, setItems] = useState<string[]>(section.additional_data?.items || []);
      const [newItem, setNewItem] = useState("");

      useEffect(() => {
          if (sections[sectionKey]?.additional_data?.items) {
              setItems(sections[sectionKey].additional_data.items);
          }
      }, [sections]);

      const addItem = () => {
          if (newItem) {
              const updated = [...items, newItem];
              setItems(updated);
              setNewItem("");
          }
      };

      const removeItem = (index: number) => {
          const updated = items.filter((_, i) => i !== index);
          setItems(updated);
      };

      const saveDepartments = () => {
          handleSave(sectionKey, {
              ...section,
              title: section.title || "বিভাগসমূহ",
              additional_data: { items }
          });
      };

      return (
        <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-4">বিভাগসমূহ ম্যানেজমেন্ট</h2>
            
            <div className="space-y-4">
                <div className="flex gap-2">
                    <Input 
                        value={newItem} 
                        onChange={(e) => setNewItem(e.target.value)} 
                        placeholder="নতুন বিভাগের নাম লিখুন..." 
                    />
                    <Button onClick={addItem} type="button">যোগ করুন</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                    {items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                            <span>{item}</span>
                            <Button variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">
                                ডিলিট
                            </Button>
                        </div>
                    ))}
                </div>

                <Button 
                    onClick={saveDepartments} 
                    disabled={saving}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold mt-6"
                >
                    {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />}
                    সংরক্ষণ করুন
                </Button>
            </div>
        </div>
      );
  }

  const QuotesForm = () => {
    const sectionKey = "islamic_quotes";
    const section = sections[sectionKey] || { 
        title: "কুরআন ও হাদিসের বাণী", 
        additional_data: { type: 'quran', quran: {}, hadith: {}, other: {} } 
    };
    const [formData, setFormData] = useState(section);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setFormData(sections[sectionKey] || { 
            title: "কুরআন ও হাদিসের বাণী", 
            additional_data: { type: 'quran', quran: {}, hadith: {}, other: {} } 
        });
    }, [sections]);

    const handleDataChange = (field: string, value: string, category?: string) => {
        setFormData(prev => {
            const newData = { ...prev };
            if (!newData.additional_data) newData.additional_data = { type: 'quran', quran: {}, hadith: {}, other: {} };
            
            if (category) {
                newData.additional_data[category] = {
                    ...newData.additional_data[category],
                    [field]: value
                };
            } else {
                if (field === 'type') newData.additional_data.type = value;
                else (newData as any)[field] = value;
            }
            return newData;
        });
    };

    const saveQuotes = async () => {
        setSaving(true);
        const payload = {
            section_key: sectionKey,
            title: formData.title,
            additional_data: formData.additional_data,
            is_active: true
        };

        const existing = sections[sectionKey];
        let error;
        
        if (existing?.id) {
            const { error: err } = await supabase.from("home_sections").update(payload).eq("id", existing.id);
            error = err;
        } else {
            const { error: err } = await supabase.from("home_sections").insert([payload]);
            error = err;
        }

        if (error) alert("সেভ করা যায়নি: " + error.message);
        else {
            alert("সফলভাবে সেভ হয়েছে!");
            fetchSections();
        }
        setSaving(false);
    };

    const type = formData.additional_data?.type || 'quran';

    return (
      <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-4">বাণী ম্যানেজমেন্ট</h2>
        
        <div className="grid gap-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">বাণীর ধরন</label>
                <select 
                    value={type}
                    onChange={(e) => handleDataChange('type', e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                >
                    <option value="quran">আল-কুরআন</option>
                    <option value="hadith">আল-হাদিস</option>
                    <option value="other">অন্যান্য</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">হেডিং / শিরোনাম</label>
                <Input 
                    value={formData.title} 
                    onChange={(e) => handleDataChange('title', e.target.value)} 
                />
            </div>

            {type === 'quran' && (
                <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-green-700">সূরা</label>
                            <Input 
                                placeholder="উদাঃ সূরা আল-ফাতিহা"
                                value={formData.additional_data?.quran?.surah || ""}
                                onChange={(e) => handleDataChange('surah', e.target.value, 'quran')}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-green-700">আয়াত নং</label>
                            <Input 
                                placeholder="উদাঃ ৫"
                                value={formData.additional_data?.quran?.ayah || ""}
                                onChange={(e) => handleDataChange('ayah', e.target.value, 'quran')}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-green-700">আরবি টেক্সট</label>
                        <Textarea 
                            className="font-amiri text-right text-lg min-h-[80px]"
                            placeholder="আরবি আয়াত লিখুন..."
                            value={formData.additional_data?.quran?.arabic || ""}
                            onChange={(e) => handleDataChange('arabic', e.target.value, 'quran')}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-green-700">বাংলা অর্থ</label>
                        <Textarea 
                            placeholder="বাংলা অর্থ লিখুন..."
                            value={formData.additional_data?.quran?.bengali || ""}
                            onChange={(e) => handleDataChange('bengali', e.target.value, 'quran')}
                        />
                    </div>
                </div>
            )}

            {type === 'hadith' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-blue-700">হাদিস গ্রন্থ</label>
                            <Input 
                                placeholder="উদাঃ সহীহ বুখারী"
                                value={formData.additional_data?.hadith?.book || ""}
                                onChange={(e) => handleDataChange('book', e.target.value, 'hadith')}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-blue-700">হাদিস নং</label>
                            <Input 
                                placeholder="উদাঃ ১"
                                value={formData.additional_data?.hadith?.number || ""}
                                onChange={(e) => handleDataChange('number', e.target.value, 'hadith')}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-blue-700">আরবি টেক্সট (ঐচ্ছিক)</label>
                        <Textarea 
                            className="font-amiri text-right text-lg min-h-[80px]"
                            placeholder="আরবি হাদিস..."
                            value={formData.additional_data?.hadith?.arabic || ""}
                            onChange={(e) => handleDataChange('arabic', e.target.value, 'hadith')}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-blue-700">বাংলা অনুবাদ</label>
                        <Textarea 
                            placeholder="হাদিসের বাংলা অনুবাদ..."
                            value={formData.additional_data?.hadith?.bengali || ""}
                            onChange={(e) => handleDataChange('bengali', e.target.value, 'hadith')}
                        />
                    </div>
                </div>
            )}

            {type === 'other' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600">বাণী / উক্তি</label>
                        <Textarea 
                            placeholder="বাণী লিখুন..."
                            value={formData.additional_data?.other?.text || ""}
                            onChange={(e) => handleDataChange('text', e.target.value, 'other')}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600">উক্তিকারীর নাম / সূত্র</label>
                        <Input 
                            placeholder="উদাঃ আল্লামা ইকবাল"
                            value={formData.additional_data?.other?.source || ""}
                            onChange={(e) => handleDataChange('source', e.target.value, 'other')}
                        />
                    </div>
                </div>
            )}

            <Button onClick={saveQuotes} disabled={saving} className="w-full bg-green-600 hover:bg-green-700">
                {saving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 w-4 h-4"/>} সংরক্ষণ করুন
            </Button>
        </div>
      </div>
    );
  };

  const MissionVisionForm = () => {
    const sectionKey = "mission_vision";
    const section = sections[sectionKey] || { 
        title: "লক্ষ্য ও উদ্দেশ্য", 
        additional_data: { mission: "", vision: "" } 
    };
    const [formData, setFormData] = useState(section);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setFormData(sections[sectionKey] || { 
            title: "লক্ষ্য ও উদ্দেশ্য", 
            additional_data: { mission: "", vision: "" } 
        });
    }, [sections]);

    const handleDataChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            additional_data: {
                ...prev.additional_data,
                [field]: value
            }
        }));
    };

    const saveMissionVision = async () => {
        setSaving(true);
        const payload = {
            section_key: sectionKey,
            title: formData.title,
            additional_data: formData.additional_data,
            is_active: true
        };

        const existing = sections[sectionKey];
        let error;
        
        if (existing?.id) {
            const { error: err } = await supabase.from("home_sections").update(payload).eq("id", existing.id);
            error = err;
        } else {
            const { error: err } = await supabase.from("home_sections").insert([payload]);
            error = err;
        }

        if (error) alert("সেভ করা যায়নি: " + error.message);
        else {
            alert("সফলভাবে সেভ হয়েছে!");
            fetchSections();
        }
        setSaving(false);
    };

    return (
      <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-4">লক্ষ্য ও উদ্দেশ্য ম্যানেজমেন্ট</h2>
        
        <div className="grid gap-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">হেডিং / শিরোনাম</label>
                <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                />
            </div>

            <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-green-700 flex items-center gap-2">
                        <Target className="w-4 h-4"/> আমাদের লক্ষ্য (Mission)
                    </label>
                    <Textarea 
                        placeholder="আমাদের লক্ষ্য সম্পর্কে লিখুন..."
                        value={formData.additional_data?.mission || ""}
                        onChange={(e) => handleDataChange('mission', e.target.value)}
                        className="min-h-[120px]"
                    />
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-bold text-green-700 flex items-center gap-2">
                        <Eye className="w-4 h-4"/> আমাদের উদ্দেশ্য (Vision)
                    </label>
                    <Textarea 
                        placeholder="আমাদের উদ্দেশ্য সম্পর্কে লিখুন..."
                        value={formData.additional_data?.vision || ""}
                        onChange={(e) => handleDataChange('vision', e.target.value)}
                        className="min-h-[120px]"
                    />
                </div>
            </div>

            <Button onClick={saveMissionVision} disabled={saving} className="w-full bg-green-600 hover:bg-green-700">
                {saving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 w-4 h-4"/>} সংরক্ষণ করুন
            </Button>
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="w-10 h-10 animate-spin text-green-600" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">হোম পেজ কন্টেন্ট ম্যানেজমেন্ট</h1>
      
      <Tabs defaultValue="director" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="director"><User className="w-4 h-4 mr-2" /> পরিচালক</TabsTrigger>
          <TabsTrigger value="quotes"><BookOpen className="w-4 h-4 mr-2" /> বানী</TabsTrigger>
          <TabsTrigger value="about"><Info className="w-4 h-4 mr-2" /> সম্পর্কে</TabsTrigger>
          <TabsTrigger value="mission"><Target className="w-4 h-4 mr-2" /> লক্ষ্য</TabsTrigger>
          <TabsTrigger value="departments"><Layers className="w-4 h-4 mr-2" /> বিভাগ</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
            <TabsContent value="director">
                <SectionForm sectionKey="director" title="পরিচালকের বাণী" defaultTitle="পরিচালকের বাণী" />
            </TabsContent>
            <TabsContent value="quotes">
                <QuotesForm />
            </TabsContent>
            <TabsContent value="about">
                <SectionForm sectionKey="about" title="মাদ্রাসা পরিচিতি" defaultTitle="আমাদের সম্পর্কে" />
            </TabsContent>
            <TabsContent value="mission">
                <MissionVisionForm />
            </TabsContent>
            <TabsContent value="departments">
                <DepartmentsForm />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Image as ImageIcon, 
  PlayCircle,
  Pencil,
  Video,
  Link as LinkIcon,
  FolderOpen
} from "lucide-react";
import Image from "next/image";

type GalleryItem = {
  id: string;
  title: string;
  type: "image" | "video";
  url: string;
  thumbnail_url?: string;
  category: string;
  created_at: string;
};

export default function GalleryManagement() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  
  // Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    type: "image" as "image" | "video",
    url: "",
    thumbnail_url: "",
    category: "general"
  });
  
  // Upload Type State (Direct Upload vs Link)
  const [uploadType, setUploadType] = useState<"file" | "link">("file");

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  const fetchGalleryItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setItems(data as GalleryItem[] || []);
    setLoading(false);
  };

  // --- Handlers ---

  const handleCreateNew = () => {
    setFormData({ title: "", type: "image", url: "", thumbnail_url: "", category: "general" });
    setUploadType("file");
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: GalleryItem) => {
    setFormData({
      title: item.title,
      type: item.type,
      url: item.url,
      thumbnail_url: item.thumbnail_url || "",
      category: item.category || "general"
    });
    // Guess upload type based on URL
    if (item.url.startsWith("http")) {
       if (item.url.includes("supabase.co")) {
         setUploadType("file");
       } else {
         setUploadType("link");
       }
    }
    setEditingId(item.id);
    setIsFormOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isThumbnail: boolean = false) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    if (isThumbnail) setThumbUploading(true);
    else setUploading(true);

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `gallery/${Date.now()}_${Math.random()}.${fileExt}`;

    const { error } = await supabase.storage.from("images").upload(fileName, file);
    
    if (error) {
      console.error("Upload error:", error);
      alert("ফাইল আপলোড হয়নি! (নিশ্চিত করুন 'images' বাকেট তৈরি আছে)");
    } else {
      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      if (isThumbnail) {
        setFormData(prev => ({ ...prev, thumbnail_url: data.publicUrl }));
      } else {
        // If uploading main image, set URL and also set thumbnail if empty
        setFormData(prev => ({ 
            ...prev, 
            url: data.publicUrl,
            // If it's an image, we can use the same URL as thumbnail by default
            thumbnail_url: prev.type === 'image' && !prev.thumbnail_url ? data.publicUrl : prev.thumbnail_url 
        }));
      }
    }
    
    if (isThumbnail) setThumbUploading(false);
    else setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return alert("শিরোনাম দিন");
    if (!formData.url) return alert("লিংক বা ফাইল দিন");

    let error;
    
    if (editingId) {
      // আপডেট মোড
      const { error: updateError } = await supabase
        .from("gallery_items")
        .update(formData)
        .eq("id", editingId);
      error = updateError;
    } else {
      // নতুন তৈরি মোড
      const { error: insertError } = await supabase
        .from("gallery_items")
        .insert([formData]);
      error = insertError;
    }

    if (error) {
      console.error(error);
      alert("সেভ করা যায়নি!");
    } else {
      setIsFormOpen(false);
      fetchGalleryItems();
      alert(editingId ? "আপডেট সফল হয়েছে!" : "যুক্ত হয়েছে!");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত এটি ডিলিট করতে চান?")) return;
    const { error } = await supabase.from("gallery_items").delete().eq("id", id);
    if (!error) fetchGalleryItems();
    else alert("ডিলিট করা যায়নি!");
  };

  // Helper to extract Drive ID and construct direct image URL
  const getGoogleDriveImageUrl = (url: string) => {
    // Regex to match Drive File ID
    const driveRegex = /drive\.google\.com\/file\/d\/([-_\w]+)/;
    const match = url.match(driveRegex);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1920`;
    }
    return null;
  };

  // Helper to check if URL is external link (Drive/Photos)
  const isExternalLink = (url: string) => {
     return url.includes("drive.google.com") || url.includes("photos.google.com") || url.includes("goo.gl") || url.includes("photos.app.goo.gl");
  }

  return (
    <div className="space-y-6 font-[Kalpurush]">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">গ্যালারি ম্যানেজমেন্ট</h1>
          <p className="text-sm text-gray-500">ছবি ও ভিডিও আপলোড এবং নিয়ন্ত্রণ করুন</p>
        </div>
        
        <Button onClick={handleCreateNew} className="bg-green-600 hover:bg-green-700 gap-2 text-white">
          <Plus className="w-4 h-4" /> নতুন যোগ করুন
        </Button>
      </div>

      {/* --- লিস্ট --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-green-600 w-8 h-8" /></div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-gray-500 py-20 flex flex-col items-center gap-3">
            <ImageIcon className="w-10 h-10 text-gray-300" />
            <p>কোনো ছবি বা ভিডিও নেই</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[100px]">প্রিভিউ</TableHead>
                <TableHead>শিরোনাম</TableHead>
                <TableHead>ধরন</TableHead>
                <TableHead>সোর্স</TableHead>
                <TableHead className="text-right">পদক্ষেপ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="align-middle">
                    <div className="relative w-16 h-12 rounded overflow-hidden bg-gray-100 border">
                        {(item.type === 'image' || item.thumbnail_url) && (!isExternalLink(item.url) || getGoogleDriveImageUrl(item.url)) ? (
                            <Image 
                                src={item.thumbnail_url || getGoogleDriveImageUrl(item.url) || item.url} 
                                alt={item.title} 
                                fill 
                                className="object-cover" 
                                onError={(e) => {
                                    // Fallback if image fails to load
                                    (e.target as HTMLImageElement).src = "/placeholder.png"; 
                                }}
                            />
                        ) : (item.thumbnail_url ? (
                             <Image 
                                src={item.thumbnail_url} 
                                alt={item.title} 
                                fill 
                                className="object-cover" 
                             />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-gray-500">
                                {isExternalLink(item.url) ? <LinkIcon className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                            </div>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell className="align-middle">
                    <span className="font-medium text-gray-800">{item.title}</span>
                  </TableCell>
                  <TableCell className="align-middle">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.type === 'image' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {item.type === 'image' ? 'ছবি' : 'ভিডিও'}
                    </span>
                  </TableCell>
                  <TableCell className="align-middle text-xs text-gray-500 truncate max-w-[150px]">
                    {item.url}
                  </TableCell>
                  <TableCell className="text-right align-middle">
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="text-gray-500 hover:text-green-600 hover:bg-green-50">
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* --- ফর্ম মোডাল --- */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "এডিট করুন" : "নতুন যোগ করুন"}</DialogTitle>
            <DialogDescription>
              গ্যালারিতে নতুন ছবি বা ভিডিও যুক্ত করুন। গুগল ড্রাইভ বা ফটোজ লিংক ব্যবহার করতে পারবেন।
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            
            {/* Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ধরন</label>
              <Select 
                value={formData.type} 
                onValueChange={(val: "image" | "video") => setFormData({...formData, type: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ধরন নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="image">ছবি (Image)</SelectItem>
                  <SelectItem value="video">ভিডিও (Video)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Input Method Tabs */}
            <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as "file" | "link")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">ফাইল আপলোড</TabsTrigger>
                <TabsTrigger value="link">এক্সটার্নাল লিংক (Drive/Photos/YouTube)</TabsTrigger>
              </TabsList>
              
              {/* File Upload Content */}
              <TabsContent value="file" className="space-y-4 mt-4">
                {formData.type === 'image' ? (
                   <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-700">ছবি আপলোড করুন</label>
                     <div className="border-2 border-dashed border-gray-200 p-6 rounded-lg text-center hover:bg-gray-50 transition-colors">
                        <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, false)} className="hidden" id="gallery-file" />
                        <label htmlFor="gallery-file" className="cursor-pointer flex flex-col items-center gap-2 text-sm text-gray-500 hover:text-green-600 w-full">
                           <ImageIcon className={`w-8 h-8 ${formData.url ? 'text-green-600' : 'text-gray-400'}`} />
                           <span className="font-medium">
                              {uploading ? "আপলোড হচ্ছে..." : formData.url ? "ছবি সিলেক্ট হয়েছে (পরিবর্তন করতে ক্লিক করুন)" : "ছবি আপলোড করতে ক্লিক করুন"}
                           </span>
                        </label>
                     </div>
                   </div>
                ) : (
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                        ভিডিও সরাসরি আপলোড করার অপশন বন্ধ আছে। দয়া করে "এক্সটার্নাল লিংক" ট্যাব ব্যবহার করুন।
                    </div>
                )}
              </TabsContent>

              {/* External Link Content */}
              <TabsContent value="link" className="space-y-4 mt-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-blue-500" /> লিংক দিন
                    </label>
                    <Input 
                        value={formData.url} 
                        onChange={(e) => setFormData({...formData, url: e.target.value})} 
                        placeholder={formData.type === 'video' ? "https://youtube.com/..." : "https://drive.google.com/..."}
                    />
                    <p className="text-xs text-gray-500">
                        {formData.type === 'video' 
                            ? "YouTube ভিডিও বা Google Drive ভিডিও লিংক দিন" 
                            : "Google Drive ফোল্ডার বা Google Photos এলবাম লিংক দিন"}
                    </p>
                 </div>
              </TabsContent>
            </Tabs>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">শিরোনাম *</label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                required
                placeholder="শিরোনাম দিন"
              />
            </div>

            {/* Custom Thumbnail Upload (Optional but Recommended for Links) */}
            <div className="space-y-2 pt-2 border-t">
               <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> কভার ফটো / থাম্বনেইল (অপশনাল)
               </label>
               <div className="flex items-center gap-4">
                  <div className="relative w-24 h-16 bg-gray-100 rounded overflow-hidden border">
                      {(formData.thumbnail_url || (formData.type === 'image' && formData.url && (!isExternalLink(formData.url) || getGoogleDriveImageUrl(formData.url)))) ? (
                          <Image 
                             src={formData.thumbnail_url || getGoogleDriveImageUrl(formData.url) || formData.url} 
                             alt="Thumbnail" 
                             fill 
                             className="object-cover" 
                          />
                      ) : (
                          <div className="flex items-center justify-center w-full h-full text-gray-400">
                             <ImageIcon className="w-6 h-6" />
                          </div>
                      )}
                  </div>
                  <div className="flex-1">
                      <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, true)} className="text-sm" />
                      <p className="text-xs text-gray-500 mt-1">লিংক বা ভিডিওর জন্য একটি কভার ফটো আপলোড করুন (নতুবা ডিফল্ট আইকন দেখাবে)</p>
                  </div>
               </div>
            </div>

            <Button type="submit" disabled={uploading || thumbUploading} className="w-full bg-green-600 hover:bg-green-700 text-white mt-4">
              {uploading || thumbUploading ? <Loader2 className="animate-spin mr-2" /> : (editingId ? "আপডেট করুন" : "সেভ করুন")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

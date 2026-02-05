"use client";

import { useState, useEffect, useRef } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Trash2, 
  FileText, 
  Loader2, 
  Download, 
  Link as LinkIcon, 
  Bold, 
  Italic, 
  Underline,
  Heading1, 
  Heading2,
  Heading3,
  Highlighter, 
  List, 
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  RemoveFormatting,
  Eye,
  Pencil,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Building2
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

type Notice = {
  id: string;
  title: string;
  content: string;
  file_url: string;
  google_drive_link: string;
  created_at: string;
  branch_id: number | null; // null means all branches
};

// --- WhatsApp Helper (Free Version) ---
// This uses the "Click to Chat" feature which is 100% free.
// It opens WhatsApp Web/App with the message pre-filled.
function openWhatsAppShare(title: string, content: string, file_url?: string) {
    // Remove HTML tags for plain text message
    const plainContent = content.replace(/<[^>]+>/g, '').slice(0, 200) + (content.length > 200 ? '...' : '');
    
    const message = `📢 *নতুন নোটিশ: ${title}*

${plainContent}

📎 বিস্তারিত দেখুন ও ফাইল ডাউনলোড করুন:
${window.location.origin}/notice

(রহিমা জান্নাত মহিলা মাদ্রাসা)`;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/?text=${encodedMessage}`;
    
    // Open in new tab
    window.open(url, '_blank');
}

// --- Rich Text Editor Component (Unchanged) ---
const RichTextEditor = ({ value, onChange }: { value: string, onChange: (html: string) => void }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== value && document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  };

  const ToolbarButton = ({ onClick, icon: Icon, title }: { onClick: () => void, icon: any, title: string }) => (
    <Button 
      type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-200 text-gray-600" 
      onClick={onClick} title={title}
      onMouseDown={(e) => e.preventDefault()} 
    >
      <Icon className="w-4 h-4" />
    </Button>
  );

  return (
    <div className="border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-green-500 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-input">
        <div className="flex items-center border-r border-gray-300 pr-1 mr-1 space-x-1">
          <ToolbarButton onClick={() => execCommand('bold')} icon={Bold} title="Bold" />
          <ToolbarButton onClick={() => execCommand('italic')} icon={Italic} title="Italic" />
          <ToolbarButton onClick={() => execCommand('underline')} icon={Underline} title="Underline" />
          <ToolbarButton onClick={() => execCommand('hiliteColor', 'yellow')} icon={Highlighter} title="Highlight" />
          <ToolbarButton onClick={() => execCommand('removeFormat')} icon={RemoveFormatting} title="Clear Formatting" />
        </div>
        <div className="flex items-center border-r border-gray-300 pr-1 mr-1 space-x-1">
          <ToolbarButton onClick={() => execCommand('formatBlock', 'H1')} icon={Heading1} title="Heading 1" />
          <ToolbarButton onClick={() => execCommand('formatBlock', 'H2')} icon={Heading2} title="Heading 2" />
          <ToolbarButton onClick={() => execCommand('formatBlock', 'H3')} icon={Heading3} title="Heading 3" />
        </div>
        <div className="flex items-center border-r border-gray-300 pr-1 mr-1 space-x-1">
          <ToolbarButton onClick={() => execCommand('justifyLeft')} icon={AlignLeft} title="Align Left" />
          <ToolbarButton onClick={() => execCommand('justifyCenter')} icon={AlignCenter} title="Align Center" />
          <ToolbarButton onClick={() => execCommand('justifyRight')} icon={AlignRight} title="Align Right" />
          <ToolbarButton onClick={() => execCommand('justifyFull')} icon={AlignJustify} title="Justify" />
        </div>
        <div className="flex items-center space-x-1">
          <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={List} title="Bullet List" />
          <ToolbarButton onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} title="Numbered List" />
          <ToolbarButton onClick={() => execCommand('formatBlock', 'blockquote')} icon={Quote} title="Quote" />
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[150px] p-4 outline-none text-gray-700 cursor-text [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_li]:pl-1 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-3 [&_blockquote]:bg-gray-50 [&_blockquote]:py-1 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:my-3 [&_h1]:text-gray-900 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-2 [&_h2]:text-gray-800 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:my-2 [&_h3]:text-gray-800 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline"
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onBlur={(e) => onChange(e.currentTarget.innerHTML)}
      />
    </div>
  );
};

export default function NoticeManagement() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    file_url: "",
    google_drive_link: "",
    send_whatsapp: false,
    branch_id: "all" // "all" or specific ID
  });

  // Feedback & Confirm Modal States
  const [feedback, setFeedback] = useState<{ open: boolean, title: string, message: string, type: 'success' | 'error' | 'warning' }>({
    open: false, title: "", message: "", type: "success"
  });
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean, id: string | null }>({
    open: false, id: null
  });

  useEffect(() => {
    fetchBranches();
    fetchNotices();
  }, []);

  const fetchBranches = async () => {
    console.log("Fetching branches...");
    const { data, error } = await supabase.from("branches").select("id, name");
    if (error) {
        console.error("Error fetching branches:", error);
    } else {
        console.log("Branches fetched:", data);
        if (data) setBranches(data);
    }
  };

  const fetchNotices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setNotices(data || []);
    setLoading(false);
  };

  // --- Handlers ---

  const handleCreateNew = () => {
    setFormData({ title: "", content: "", file_url: "", google_drive_link: "", send_whatsapp: false, branch_id: "all" });
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (notice: Notice) => {
    setFormData({
      title: notice.title,
      content: notice.content || "",
      file_url: notice.file_url || "",
      google_drive_link: notice.google_drive_link || "",
      send_whatsapp: false,
      branch_id: notice.branch_id ? String(notice.branch_id) : "all"
    });
    setEditingId(notice.id);
    setIsFormOpen(true);
  };

  const handleView = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsViewOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `notice/${Date.now()}_${Math.random()}.${fileExt}`;

    const { error } = await supabase.storage.from("images").upload(fileName, file);
    
    if (error) {
      setFeedback({ open: true, title: "ত্রুটি", message: "ফাইল আপলোড করা যায়নি!", type: "error" });
    } else {
      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      setFormData({ ...formData, file_url: data.publicUrl });
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
        setFeedback({ open: true, title: "প্রয়োজনীয় তথ্য", message: "অনুগ্রহ করে নোটিশের শিরোনাম দিন", type: "warning" });
        return;
    }

    let error;
    
    // Prepare payload
    const payload = {
        title: formData.title,
        content: formData.content,
        file_url: formData.file_url,
        google_drive_link: formData.google_drive_link,
        branch_id: formData.branch_id === "all" ? null : parseInt(formData.branch_id)
    };

    if (editingId) {
      // আপডেট মোড
      const { error: updateError } = await supabase
        .from("notices")
        .update(payload)
        .eq("id", editingId);
      error = updateError;
    } else {
      // নতুন তৈরি মোড
      const { error: insertError } = await supabase
        .from("notices")
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      console.error(error);
      setFeedback({ open: true, title: "ত্রুটি", message: "তথ্য সেভ করা যায়নি। আবার চেষ্টা করুন।", type: "error" });
    } else {
      // Trigger WhatsApp if checked
      if (formData.send_whatsapp) {
          openWhatsAppShare(formData.title, formData.content, formData.file_url);
      }

      setIsFormOpen(false);
      fetchNotices();
      
      setFeedback({ 
          open: true, 
          title: "সফল!", 
          message: editingId ? "নোটিশ সফলভাবে আপডেট হয়েছে!" : "নোটিশ সফলভাবে প্রকাশিত হয়েছে!" + (formData.send_whatsapp ? " (হোয়াটসএ্যাপ ওপেন হচ্ছে...)" : ""), 
          type: "success" 
      });
    }
  };

  const handleDeleteClick = (id: string) => {
      setDeleteConfirm({ open: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    
    const { error } = await supabase.from("notices").delete().eq("id", deleteConfirm.id);
    setDeleteConfirm({ open: false, id: null });
    
    if (!error) {
        fetchNotices();
        setFeedback({ open: true, title: "সফল!", message: "নোটিশ ডিলিট করা হয়েছে।", type: "success" });
    } else {
        setFeedback({ open: true, title: "ত্রুটি", message: "ডিলিট করা যায়নি।", type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">নোটিশ বোর্ড</h1>
          <p className="text-sm text-gray-500">মাদ্রাসার সকল বিজ্ঞপ্তি নিয়ন্ত্রণ করুন</p>
        </div>
        
        <Button onClick={handleCreateNew} className="bg-green-600 hover:bg-green-700 gap-2 text-white">
          <Plus className="w-4 h-4" /> নতুন নোটিশ
        </Button>
      </div>

      {/* --- নোটিশ লিস্ট (শুধু টাইটেল ও একশন) --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-green-600 w-8 h-8" /></div>
        ) : notices.length === 0 ? (
          <div className="p-10 text-center text-gray-500 py-20 flex flex-col items-center gap-3">
            <FileText className="w-10 h-10 text-gray-300" />
            <p>কোনো বিজ্ঞপ্তি নেই</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[150px]">তারিখ</TableHead>
                <TableHead>শিরোনাম</TableHead>
                <TableHead>শাখা</TableHead>
                <TableHead className="text-right">পদক্ষেপ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notices.map((notice) => (
                <TableRow key={notice.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-600 align-middle">
                    {new Date(notice.created_at).toLocaleDateString('bn-BD')}
                  </TableCell>
                  <TableCell className="align-middle">
                    <span className="font-bold text-gray-800 text-base">{notice.title}</span>
                  </TableCell>
                  <TableCell className="align-middle">
                     {notice.branch_id ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                           <Building2 className="w-3 h-3 mr-1"/>
                           {branches.find(b => b.id === notice.branch_id)?.name || "নির্দিষ্ট শাখা"}
                        </span>
                     ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700">
                           <Building2 className="w-3 h-3 mr-1"/>
                           উভয় শাখা
                        </span>
                     )}
                  </TableCell>
                  <TableCell className="text-right align-middle">
                    <div className="flex justify-end gap-2">
                        {/* বিস্তারিত বাটন */}
                        <Button variant="ghost" size="sm" onClick={() => handleView(notice)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                            <Eye className="w-4 h-4 mr-1" /> বিস্তারিত
                        </Button>
                        {/* এডিট বাটন */}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(notice)} className="text-gray-500 hover:text-green-600 hover:bg-green-50">
                            <Pencil className="w-4 h-4" />
                        </Button>
                        {/* ডিলিট বাটন */}
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(notice.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
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

      {/* --- ১. ফর্ম মোডাল (Create/Edit) --- */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "বিজ্ঞপ্তি এডিট করুন" : "নতুন বিজ্ঞপ্তি প্রকাশ করুন"}</DialogTitle>
            <DialogDescription>
              নিচের ফর্মে তথ্য পূরণ করে {editingId ? "আপডেট" : "প্রকাশ"} করুন।
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">শিরোনাম *</label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                required
                className="focus-visible:ring-green-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">কোন শাখার জন্য প্রযোজ্য?</label>
              <Select value={formData.branch_id} onValueChange={(val) => setFormData({...formData, branch_id: val})}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="শাখা নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="all">উভয় শাখা (সকলের জন্য)</SelectItem>
                  {branches.length > 0 ? (
                    branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-400">শাখা লোড হচ্ছে...</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">বিস্তারিত বিবরণ</label>
              <RichTextEditor 
                value={formData.content} 
                onChange={(html) => setFormData({...formData, content: html})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-500" /> গুগল ড্রাইভ লিংক (অপশনাল)
              </label>
              <Input 
                value={formData.google_drive_link} 
                onChange={(e) => setFormData({...formData, google_drive_link: e.target.value})} 
                placeholder="https://drive.google.com/..." 
              />
            </div>
            
            <div className="flex items-center space-x-2 border p-3 rounded-lg bg-green-50 border-green-100">
                <Checkbox 
                    id="whatsapp" 
                    checked={formData.send_whatsapp}
                    onCheckedChange={(checked) => setFormData({...formData, send_whatsapp: checked as boolean})}
                />
                <label
                    htmlFor="whatsapp"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 text-green-800"
                >
                    <MessageCircle className="w-4 h-4" />
                    হোয়াটসএ্যাপ গ্রুপে শেয়ার করুন (স্বয়ংক্রিয়)
                </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ফাইল যুক্ত করুন</label>
              <div className="border-2 border-dashed border-gray-200 p-4 rounded-lg text-center hover:bg-gray-50 transition-colors">
                  <Input type="file" onChange={handleFileUpload} className="hidden" id="notice-file" />
                  <label htmlFor="notice-file" className="cursor-pointer flex flex-col items-center gap-2 text-sm text-gray-500 hover:text-green-600 w-full">
                    <FileText className={`w-8 h-8 ${formData.file_url ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="font-medium">
                      {uploading ? "আপলোড হচ্ছে..." : formData.file_url ? "ফাইল যুক্ত হয়েছে ✅" : "ফাইল আপলোড করতে ক্লিক করুন"}
                    </span>
                  </label>
              </div>
            </div>
            <Button type="submit" disabled={uploading} className="w-full bg-green-600 hover:bg-green-700 text-white">
              {uploading ? <Loader2 className="animate-spin mr-2" /> : (editingId ? "আপডেট করুন" : "প্রকাশ করুন")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- ২. বিস্তারিত দেখার মোডাল (View Details) --- */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        {/* ... (Existing View Details Content) ... */}
        <DialogContent className="sm:max-w-[700px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">{selectedNotice?.title}</DialogTitle>
            <DialogDescription className="text-gray-500">
              প্রকাশিত: {selectedNotice && new Date(selectedNotice.created_at).toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-6">
            {/* HTML কন্টেন্ট রেন্ডার */}
            <div 
              className="prose prose-sm max-w-none text-gray-700
                [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold
                [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic"
              dangerouslySetInnerHTML={{ __html: selectedNotice?.content || "<p>কোনো বিবরণ নেই</p>" }}
            />

            {/* এটাচমেন্ট সেকশন */}
            {(selectedNotice?.file_url || selectedNotice?.google_drive_link) && (
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-bold text-gray-700 mb-2">সংযুক্ত ফাইল ও লিংক:</h4>
                <div className="flex flex-wrap gap-3">
                  {selectedNotice.file_url && (
                    <a href={selectedNotice.file_url} target="_blank" className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                      <Download className="w-4 h-4" /> ডাউনলোড ফাইল
                    </a>
                  )}
                  {selectedNotice.google_drive_link && (
                    <a href={selectedNotice.google_drive_link} target="_blank" className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                      <LinkIcon className="w-4 h-4" /> গুগল ড্রাইভ
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>বন্ধ করুন</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- 3. Feedback Modal (Success/Error) --- */}
      <AlertDialog open={feedback.open} onOpenChange={(open) => setFeedback({ ...feedback, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {feedback.type === 'success' && <CheckCircle className="text-green-600 w-6 h-6" />}
              {feedback.type === 'error' && <XCircle className="text-red-600 w-6 h-6" />}
              {feedback.type === 'warning' && <AlertTriangle className="text-yellow-500 w-6 h-6" />}
              {feedback.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-600 pt-2">
              {feedback.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setFeedback({ ...feedback, open: false })}
              className={`${feedback.type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              ঠিক আছে
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- 4. Delete Confirmation Modal --- */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5"/> নিশ্চিতকরণ
            </AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত যে আপনি এই বিজ্ঞপ্তিটি ডিলিট করতে চান? এটি আর ফিরিয়ে আনা সম্ভব হবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              হ্যাঁ, ডিলিট করুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
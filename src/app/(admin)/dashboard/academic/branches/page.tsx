"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Plus, Edit, Trash2, GitBranch, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function BranchManagement() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", address: "", is_active: true });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => { fetchBranches(); }, []);

  const fetchBranches = async () => {
    setLoading(true);
    const { data } = await supabase.from("branches").select("*").order("id", { ascending: true });
    if (data) setBranches(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("শাখার নাম দিন");

    const payload = { ...formData };
    
    if (editingId) {
      await supabase.from("branches").update(payload).eq("id", editingId);
    } else {
      await supabase.from("branches").insert([payload]);
    }
    
    setIsOpen(false);
    setFormData({ name: "", address: "", is_active: true });
    setEditingId(null);
    fetchBranches();
  };

  const handleEdit = (branch: any) => {
    setFormData({ name: branch.name, address: branch.address, is_active: branch.is_active });
    setEditingId(branch.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("শাখা ডিলিট করলে এর সকল তথ্য মুছে যাবে। আপনি কি নিশ্চিত?")) return;
    const { error } = await supabase.from("branches").delete().eq("id", id);
    if (error) alert("এই শাখায় ক্লাস বা শিক্ষার্থী আছে, তাই ডিলিট করা যাবে না।");
    else fetchBranches();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-green-600" /> শাখা ব্যবস্থাপনা
          </h1>
          <p className="text-sm text-gray-500">সকল মাদ্রাসার শাখা এক জায়গা থেকে নিয়ন্ত্রণ করুন</p>
        </div>
        <Button onClick={() => { setIsOpen(true); setEditingId(null); setFormData({name:"", address:"", is_active: true}); }} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" /> নতুন শাখা
        </Button>
      </div>

      {/* Branch List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <div key={branch.id} className={`bg-white rounded-xl border p-6 transition-all hover:shadow-md ${branch.is_active ? 'border-gray-200' : 'border-red-100 bg-red-50/30'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="bg-green-50 p-3 rounded-full text-green-700 font-bold text-lg">
                {branch.name[0]}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(branch)} className="h-8 w-8 text-gray-500 hover:text-green-600">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(branch.id)} className="h-8 w-8 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-1">{branch.name}</h3>
            <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
              📍 {branch.address || "ঠিকানা নেই"}
            </p>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${branch.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {branch.is_active ? <CheckCircle className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}
                {branch.is_active ? "Active" : "Inactive"}
              </span>
              
              <Link href={`/dashboard/academic/branches/${branch.id}`}>
                <Button variant="outline" size="sm" className="hover:bg-green-50 hover:text-green-700 border-green-200">
                  ক্লাস দেখুন <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "শাখা আপডেট করুন" : "নতুন শাখা যোগ করুন"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">শাখার নাম</label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="উদাঃ হলিধানী শাখা" required />
            </div>
            <div>
              <label className="text-sm font-medium">ঠিকানা</label>
              <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="শাখার অবস্থান" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="status" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="accent-green-600 w-4 h-4" />
              <label htmlFor="status" className="text-sm font-medium cursor-pointer">এই শাখাটি চালু আছে (Active)</label>
            </div>
            <Button type="submit" className="w-full bg-green-600">{editingId ? "আপডেট" : "তৈরি করুন"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2 } from "lucide-react";

export default function FeeSetup() {
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    branch_id: "",
    class_name: "all",
    category_id: "",
    amount: "",
    frequency: "monthly"
  });

  useEffect(() => {
    fetchInitialData();
    fetchStructures();
  }, []);

  const fetchInitialData = async () => {
    const { data: b } = await supabase.from("branches").select("id, name");
    if(b) setBranches(b);
    
    const { data: c } = await supabase.from("categories").select("id, name").eq("type", "income");
    if(c) setCategories(c);
  };

  const fetchStructures = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fee_structures")
      .select("*, branches(name), categories(name)")
      .order("created_at", { ascending: false });
    
    if(data) setStructures(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if(!formData.branch_id || !formData.category_id || !formData.amount) return alert("সব তথ্য দিন");
    
    const payload = {
      branch_id: formData.branch_id === 'all' ? null : parseInt(formData.branch_id), // Handle 'all' logic carefully backend side or duplicate? For now explicit branch.
      class_name: formData.class_name,
      category_id: parseInt(formData.category_id),
      amount: parseInt(formData.amount),
      frequency: formData.frequency,
      academic_year: 2026
    };

    const { error } = await supabase.from("fee_structures").insert(payload);
    if(error) alert(error.message);
    else {
      alert("ফি স্ট্রাকচার তৈরি হয়েছে!");
      fetchStructures();
      setFormData({ ...formData, amount: "" });
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("মুছে ফেলতে চান?")) return;
    await supabase.from("fee_structures").delete().eq("id", id);
    fetchStructures();
  };

  // ... existing code ...
  const [genData, setGenData] = useState({ 
    structure_id: "", 
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });

  const handleGenerate = async () => {
      if(!genData.structure_id) return alert("ফি স্ট্রাকচার সিলেক্ট করুন");
      
      const structure = structures.find(s => s.id === genData.structure_id);
      if(!structure) return;

      const title = `${structure.categories.name} - ${new Date(2026, genData.month).toLocaleString('default', { month: 'long' })} 2026`;
      
      if(!confirm(`${title} জেনারেট করতে চান?`)) return;
      setLoading(true);

      // Find eligible students
      let query = supabase.from("students").select("id").eq("status", "active");
      if(structure.branch_id) query = query.eq("branch_id", structure.branch_id);
      // Add class filter if structure has specific class
      if(structure.class_name && structure.class_name !== 'all') query = query.eq("class_name", structure.class_name);

      const { data: students } = await query;
      
      if(students && students.length > 0) {
          const dues = students.map(s => ({
              student_id: s.id,
              fee_structure_id: structure.id,
              title: title,
              amount: structure.amount,
              status: 'pending'
          }));
          
          const { error } = await supabase.from("student_dues").insert(dues);
          if(error) alert(error.message);
          else alert(`${students.length} জনের ফি জেনারেট হয়েছে`);
      } else {
          alert("কোনো শিক্ষার্থী পাওয়া যায়নি");
      }
      setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Generate Section */}
      <Card className="border-l-4 border-l-green-600">
          <CardHeader><CardTitle>ফি জেনারেশন (মাসিক/বাৎসরিক)</CardTitle></CardHeader>
          <CardContent className="flex gap-4 items-end">
              <div className="space-y-2 w-full">
                  <label className="text-sm font-medium">ফি স্ট্রাকচার</label>
                  <Select value={genData.structure_id} onValueChange={v=>setGenData({...genData, structure_id: v})}>
                      <SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger>
                      <SelectContent>
                          {structures.map(s => (
                              <SelectItem key={s.id} value={s.id}>
                                  {s.branches?.name} - {s.categories?.name} ({s.amount}৳)
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2 w-32">
                  <label className="text-sm font-medium">বছর</label>
                  <Select value={String(genData.year)} onValueChange={v=>setGenData({...genData, year: parseInt(v)})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                          {[2024, 2025, 2026, 2027].map(y => (
                              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2 w-48">
                  <label className="text-sm font-medium">মাস</label>
                  <Select value={String(genData.month)} onValueChange={v=>setGenData({...genData, month: parseInt(v)})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                          {Array.from({length: 12}, (_, i) => (
                              <SelectItem key={i} value={String(i)}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
              <Button onClick={handleGenerate} disabled={loading} className="bg-green-600">জেনারেট করুন</Button>
          </CardContent>
      </Card>

      <Card>

        <CardHeader>
          <CardTitle>নতুন ফি নির্ধারণ করুন</CardTitle>
          <CardDescription>ক্লাস ও শাখা অনুযায়ী ফি সেট করুন</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="space-y-2">
             <label className="text-sm font-medium">শাখা</label>
             <Select value={formData.branch_id} onValueChange={v=>setFormData({...formData, branch_id: v})}>
               <SelectTrigger><SelectValue placeholder="শাখা নির্বাচন" /></SelectTrigger>
               <SelectContent>
                 {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
               </SelectContent>
             </Select>
           </div>
           
           <div className="space-y-2">
             <label className="text-sm font-medium">ফি এর ধরণ</label>
             <Select value={formData.category_id} onValueChange={v=>setFormData({...formData, category_id: v})}>
               <SelectTrigger><SelectValue placeholder="সিলেক্ট" /></SelectTrigger>
               <SelectContent>
                 {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
               </SelectContent>
             </Select>
           </div>

           <div className="space-y-2">
             <label className="text-sm font-medium">পরিমাণ</label>
             <Input type="number" value={formData.amount} onChange={e=>setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
           </div>

           <div className="space-y-2">
             <label className="text-sm font-medium">ফ্রিকোয়েন্সি</label>
             <Select value={formData.frequency} onValueChange={v=>setFormData({...formData, frequency: v})}>
               <SelectTrigger><SelectValue /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="monthly">মাসিক</SelectItem>
                 <SelectItem value="yearly">বাৎসরিক</SelectItem>
                 <SelectItem value="one_time">এককালীন</SelectItem>
               </SelectContent>
             </Select>
           </div>

           <div className="md:col-span-3">
             <Button onClick={handleSubmit} className="w-full md:w-auto bg-blue-600">সংরক্ষণ করুন</Button>
           </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>ফি স্ট্রাকচার তালিকা</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>শাখা</TableHead>
                <TableHead>ক্লাস</TableHead>
                <TableHead>ফি</TableHead>
                <TableHead>ধরণ</TableHead>
                <TableHead className="text-right">পরিমাণ</TableHead>
                <TableHead className="text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {structures.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.branches?.name}</TableCell>
                  <TableCell>{s.class_name === 'all' ? 'সকল শ্রেণি' : s.class_name}</TableCell>
                  <TableCell>{s.categories?.name}</TableCell>
                  <TableCell className="capitalize">{s.frequency}</TableCell>
                  <TableCell className="text-right font-bold">৳ {s.amount}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-red-500"><Trash2 className="w-4 h-4"/></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    amount: "",
    category_id: "",
    description: "",
    expense_date: new Date().toISOString().split('T')[0],
    fund_type: "general" // general or lillah
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Categories
    const { data: catData } = await supabase
        .from("expense_categories")
        .select("*")
        .eq("is_active", true);
    
    if (catData) setCategories(catData);

    // Fetch Expenses
    const { data: expData } = await supabase
        .from("transactions")
        .select("*, categories(name)")
        .eq("type", "expense")
        .order("transaction_date", { ascending: false })
        .limit(50);
        
    if (expData) setExpenses(expData);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category_id) return alert("টাকার পরিমাণ এবং খাত নির্বাচন করুন");
    
    setIsSubmitting(true);

    const payload = {
        amount: parseFloat(formData.amount),
        category_id: parseInt(formData.category_id),
        description: formData.description,
        transaction_date: formData.expense_date,
        type: "expense",
        fund_type: formData.fund_type
    };

    const { error } = await supabase.from("transactions").insert([payload]);

    if (error) {
        alert("খরচ যুক্ত করা যায়নি: " + error.message);
    } else {
        setIsOpen(false);
        setFormData({ ...formData, amount: "", description: "" });
        fetchData(); // Refresh list
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("আপনি কি নিশ্চিত এই খরচটি ডিলিট করতে চান?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600"/> খরচ ব্যবস্থাপনা
            </h2>
            <p className="text-sm text-gray-500">প্রতিদিনের খরচের হিসাব রাখুন</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="w-4 h-4 mr-2"/> নতুন খরচ
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>নতুন খরচ যুক্ত করুন</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">ফান্ড টাইপ</label>
                            <Select value={formData.fund_type} onValueChange={(v) => setFormData({...formData, fund_type: v})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">জেনারেল ফান্ড</SelectItem>
                                    <SelectItem value="lillah">লিল্লাহ ফান্ড</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">তারিখ</label>
                            <Input type="date" value={formData.expense_date} onChange={e => setFormData({...formData, expense_date: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">খরচের খাত</label>
                        <Select value={formData.category_id} onValueChange={(v) => setFormData({...formData, category_id: v})}>
                            <SelectTrigger><SelectValue placeholder="খাত নির্বাচন করুন"/></SelectTrigger>
                            <SelectContent>
                                {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">টাকার পরিমাণ</label>
                        <Input type="number" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">বিবরণ (ঐচ্ছিক)</label>
                        <Input placeholder="খরচের বিস্তারিত বিবরণ..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700">
                        {isSubmitting ? <Loader2 className="animate-spin"/> : "খরচ সেভ করুন"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>সাম্প্রতিক খরচসমূহ</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>তারিখ</TableHead>
                        <TableHead>খাত</TableHead>
                        <TableHead>বিবরণ</TableHead>
                        <TableHead>ফান্ড</TableHead>
                        <TableHead className="text-right">পরিমাণ</TableHead>
                        <TableHead className="text-right">অ্যাকশন</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="animate-spin mx-auto text-red-600"/></TableCell></TableRow>
                    ) : expenses.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">কোনো খরচের হিসাব নেই</TableCell></TableRow>
                    ) : (
                        expenses.map((expense) => (
                            <TableRow key={expense.id}>
                                <TableCell>{new Date(expense.transaction_date).toLocaleDateString('bn-BD')}</TableCell>
                                <TableCell className="font-medium">{expense.categories?.name || 'সাধারণ'}</TableCell>
                                <TableCell className="text-gray-500 text-sm">{expense.description || '-'}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded text-xs ${expense.fund_type === 'lillah' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {expense.fund_type === 'lillah' ? 'লিল্লাহ' : 'জেনারেল'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-bold text-red-600">৳ {expense.amount}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 className="w-4 h-4"/>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}

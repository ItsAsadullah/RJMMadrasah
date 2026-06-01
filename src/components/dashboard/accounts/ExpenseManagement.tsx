"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Wallet, Calendar, Tag, ArrowUpCircle, Building2, Settings, Edit2 } from "lucide-react";
import { format } from "date-fns";

const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);
const bengaliMonths = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

export default function ExpenseManagement() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Category Management State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categoryName, setCategoryName] = useState("");
    const [categoryFundType, setCategoryFundType] = useState("general");
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);

    // Filters
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterBranch, setFilterBranch] = useState("all");

    // Form State
    const [formData, setFormData] = useState({
        amount: "", category_id: "", description: "",
        expense_date: new Date().toISOString().split('T')[0],
        fund_type: "general", branch_id: ""
    });

    useEffect(() => {
        fetchInitial();
    }, []);

    useEffect(() => {
        fetchExpenses();
    }, [filterMonth, filterYear, filterCategory, filterBranch]);

    async function fetchInitial() {
        const [catRes, brRes] = await Promise.all([
            supabase.from("categories").select("id, name").eq("type", "expense"),
            supabase.from("branches").select("id, name")
        ]);
        if (catRes.data) setCategories(catRes.data);
        if (brRes.data) setBranches(brRes.data);
    }

    async function fetchExpenses() {
        setLoading(true);
        let query = supabase.from("transactions")
            .select("*, categories(name)")
            .eq("type", "expense")
            .order("transaction_date", { ascending: false });

        // Build date range for month
        const startDate = new Date(filterYear, filterMonth, 1).toISOString().split('T')[0];
        const endDate = new Date(filterYear, filterMonth + 1, 0).toISOString().split('T')[0];
        
        query = query.gte("transaction_date", startDate).lte("transaction_date", endDate);

        if (filterCategory !== "all") {
            query = query.eq("category_id", filterCategory);
        }
        if (filterBranch !== "all") {
            query = query.eq("branch_id", parseInt(filterBranch));
        }

        const { data } = await query;
        if (data) setExpenses(data);
        setLoading(false);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.category_id) return alert("টাকার পরিমাণ এবং খাত নির্বাচন করুন");
        
        setIsSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();

        const payload = {
            amount: parseFloat(formData.amount),
            category_id: parseInt(formData.category_id),
            description: formData.description,
            transaction_date: formData.expense_date,
            type: "expense",
            fund_type: formData.fund_type,
            branch_id: formData.branch_id ? parseInt(formData.branch_id) : null,
            created_by: user?.id
        };

        const { error } = await supabase.from("transactions").insert([payload]);

        if (error) {
            alert("খরচ যুক্ত করা যায়নি: " + error.message);
        } else {
            setIsOpen(false);
            setFormData({ ...formData, amount: "", description: "", branch_id: "" });
            fetchExpenses();
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("আপনি কি নিশ্চিত এই খরচটি ডিলিট করতে চান?")) return;
        const { error } = await supabase.from("transactions").delete().eq("id", id);
        if (!error) fetchExpenses();
    };

    // Category CRUD operations
    const fetchCategoriesOnly = async () => {
        const { data } = await supabase.from("categories").select("id, name").eq("type", "expense").order("id", { ascending: false });
        if (data) setCategories(data);
    };

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryName.trim()) return;
        
        setIsCategorySubmitting(true);
        if (editingCategory) {
            const { error } = await supabase.from("categories").update({ name: categoryName.trim() }).eq("id", editingCategory.id);
            if (error) alert("আপডেট করতে সমস্যা হয়েছে।");
            else {
                setEditingCategory(null);
                setCategoryName("");
                fetchCategoriesOnly();
            }
        } else {
            const { error } = await supabase.from("categories").insert([{ name: categoryName.trim(), type: "expense", fund_type: categoryFundType }]);
            if (error) alert("যুক্ত করতে সমস্যা হয়েছে: " + error.message);
            else {
                setCategoryName("");
                setCategoryFundType("general");
                fetchCategoriesOnly();
            }
        }
        setIsCategorySubmitting(false);
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("আপনি কি নিশ্চিত এই খাতটি ডিলিট করতে চান?")) return;
        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (error) {
            if (error.code === '23503') {
                alert("এই খাতের অধীনে খরচের রেকর্ড রয়েছে, তাই এটি ডিলিট করা যাবে না।");
            } else {
                alert("ডিলিট করতে সমস্যা হয়েছে: " + error.message);
            }
        } else {
            fetchCategoriesOnly();
        }
    };

    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-red-600" /> খরচ ব্যবস্থাপনা
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">প্রতিদিনের মাদ্রাসার খরচ হিসাব রাখুন</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <Select value={filterBranch} onValueChange={setFilterBranch}>
                        <SelectTrigger className="w-[140px] h-9"><Building2 className="w-4 h-4 mr-1 text-gray-400"/><SelectValue placeholder="সকল শাখা" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">সকল শাখা</SelectItem>
                            {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={String(filterMonth)} onValueChange={v => setFilterMonth(parseInt(v))}>
                        <SelectTrigger className="w-[110px] h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{bengaliMonths.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                    
                    <Select value={String(filterYear)} onValueChange={v => setFilterYear(parseInt(v))}>
                        <SelectTrigger className="w-[90px] h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{toBengaliNumber(y)}</SelectItem>)}</SelectContent>
                    </Select>
                    
                    <Button variant="outline" onClick={() => setIsCategoryModalOpen(true)} className="h-9 ml-auto md:ml-0 shadow-sm text-gray-700">
                        <Settings className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">খাত ব্যবস্থাপনা</span>
                    </Button>
                    
                    <Button onClick={() => setIsOpen(true)} className="bg-red-600 hover:bg-red-700 h-9 shadow-sm">
                        <Plus className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">নতুন খরচ</span>
                    </Button>
                </div>
            </div>

            {/* Summary */}
            <Card className="rounded-2xl border-l-[3px] border-l-red-500 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500">এই মাসের মোট খরচ</p>
                        <h3 className="text-xl sm:text-3xl font-bold text-red-700">৳ {toBengaliNumber(totalExpense)}</h3>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-full flex items-center justify-center">
                        <ArrowUpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                <p className="text-sm font-bold text-gray-600 pl-2">খরচের তালিকা</p>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[150px] h-8 text-xs bg-white border-transparent shadow-sm"><SelectValue placeholder="সকল খাত" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">সকল খাত</SelectItem>
                        {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Table/List View */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-red-600" /></div>
            ) : expenses.length === 0 ? (
                <Card className="rounded-2xl">
                    <CardContent className="text-center py-16 text-gray-400">
                        <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-bold">কোনো খরচ পাওয়া যায়নি</p>
                        <p className="text-sm">নতুন খরচ যোগ করতে 'নতুন খরচ' বাটনে ক্লিক করুন</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block rounded-2xl border shadow-sm overflow-hidden bg-white">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead>তারিখ</TableHead>
                                    <TableHead>ফান্ড</TableHead>
                                    <TableHead>খাত</TableHead>
                                    <TableHead>বিবরণ</TableHead>
                                    <TableHead className="text-right">পরিমাণ</TableHead>
                                    <TableHead className="text-right w-[80px]">অ্যাকশন</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.map(e => (
                                    <TableRow key={e.id} className="hover:bg-red-50/30">
                                        <TableCell className="text-sm font-medium">{format(new Date(e.transaction_date), 'dd MMM yyyy')}</TableCell>
                                        <TableCell>
                                            {e.fund_type === 'lillah' 
                                                ? <Badge className="bg-purple-50 text-purple-700 border-purple-200">লিল্লাহ</Badge> 
                                                : <Badge variant="outline" className="text-gray-500">জেনারেল</Badge>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <span className="flex items-center gap-1.5 text-sm text-gray-700">
                                                <Tag className="w-3.5 h-3.5 text-gray-400" /> {e.categories?.name}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">{e.description || '-'}</TableCell>
                                        <TableCell className="text-right font-bold text-red-600">৳ {toBengaliNumber(e.amount)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-50" onClick={() => handleDelete(e.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {expenses.map(e => (
                            <Card key={e.id} className="rounded-xl shadow-sm border-l-2 border-l-red-400">
                                <CardContent className="p-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                                                <Tag className="w-3.5 h-3.5 text-red-500" /> {e.categories?.name}
                                            </p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <Calendar className="w-3 h-3" /> {format(new Date(e.transaction_date), 'dd/MM/yyyy')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-red-600">৳ {toBengaliNumber(e.amount)}</p>
                                            {e.fund_type === 'lillah' && (
                                                <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[9px] px-1 py-0 h-4 mt-1">লিল্লাহ</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                        <p className="text-xs text-gray-600 truncate pr-2">{e.description || 'বিবরণ নেই'}</p>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400" onClick={() => handleDelete(e.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {/* Add Expense Modal */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Wallet className="w-5 h-5 text-red-600" /> নতুন খরচ যুক্ত করুন</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600">ফান্ড টাইপ</label>
                                <Select value={formData.fund_type} onValueChange={(v) => setFormData({...formData, fund_type: v})}>
                                    <SelectTrigger className="h-10"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">জেনারেল ফান্ড</SelectItem>
                                        <SelectItem value="lillah">লিল্লাহ ফান্ড</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600">শাখা (মাদ্রাসা)</label>
                                <Select value={formData.branch_id} onValueChange={(v) => setFormData({...formData, branch_id: v})}>
                                    <SelectTrigger className="h-10"><SelectValue placeholder="শাখা নির্বাচন করুন"/></SelectTrigger>
                                    <SelectContent>
                                        {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600">তারিখ *</label>
                                <Input type="date" className="h-10" value={formData.expense_date} onChange={e => setFormData({...formData, expense_date: e.target.value})} required />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">খরচের খাত *</label>
                            <Select value={formData.category_id} onValueChange={(v) => setFormData({...formData, category_id: v})}>
                                <SelectTrigger className="h-10"><SelectValue placeholder="খাত নির্বাচন করুন"/></SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">টাকার পরিমাণ *</label>
                            <Input type="number" className="h-10 text-lg font-bold" placeholder="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">বিবরণ (ঐচ্ছিক)</label>
                            <Input className="h-10" placeholder="খরচের বিস্তারিত বিবরণ..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>বাতিল</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Plus className="w-4 h-4 mr-2"/>}
                                সংরক্ষণ করুন
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Category Management Modal */}
            <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-gray-600" /> খরচের খাত ব্যবস্থাপনা</DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto pr-1">
                        <form onSubmit={handleSaveCategory} className="flex gap-2 mb-6 mt-2">
                            <Input 
                                placeholder="খাতের নাম লিখুন..." 
                                value={categoryName} 
                                onChange={e => setCategoryName(e.target.value)} 
                                required
                                className="flex-1"
                            />
                            <Select value={categoryFundType} onValueChange={setCategoryFundType}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="ফান্ড" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">জেনারেল</SelectItem>
                                    <SelectItem value="lillah">লিল্লাহ</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button type="submit" disabled={isCategorySubmitting} className="bg-gray-800 hover:bg-gray-900">
                                {isCategorySubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingCategory ? "আপডেট" : "যুক্ত করুন")}
                            </Button>
                            {editingCategory && (
                                <Button type="button" variant="outline" onClick={() => { setEditingCategory(null); setCategoryName(""); }}>
                                    বাতিল
                                </Button>
                            )}
                        </form>

                        <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">বিদ্যমান খাতসমূহ</p>
                            {categories.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">কোনো খাত নেই</p>
                            ) : (
                                categories.map(cat => (
                                    <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <span className="font-medium text-gray-700 text-sm">{cat.name}</span>
                                        <div className="flex gap-1">
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700" 
                                                onClick={() => { setEditingCategory(cat); setCategoryName(cat.name); }}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700" 
                                                onClick={() => handleDeleteCategory(cat.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

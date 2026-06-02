"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Heart, Printer, HandCoins, Plus, Calendar, Smartphone, MapPin, Building2, Download } from "lucide-react";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { toJpeg } from "html-to-image";

const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

const bengaliWords: { [key: number]: string } = {
    0: "শূন্য", 1: "এক", 2: "দুই", 3: "তিন", 4: "চার", 5: "পাঁচ", 6: "ছয়", 7: "সাত", 8: "আট", 9: "নয়",
    10: "দশ", 11: "এগারো", 12: "বারো", 13: "তেরো", 14: "চৌদ্দ", 15: "পনেরো", 16: "ষোলো", 17: "সতেরো", 18: "আঠারো", 19: "উনিশ",
    20: "বিশ", 21: "একুশ", 22: "বাইশ", 23: "তেইশ", 24: "চব্বিশ", 25: "পঁচিশ", 26: "ছাব্বিশ", 27: "সাতাশ", 28: "আঠাশ", 29: "উনত্রিশ",
    30: "ত্রিশ", 31: "একত্রিশ", 32: "বত্রিশ", 33: "তেত্রিশ", 34: "চৌত্রিশ", 35: "পঁয়ত্রিশ", 36: "ছত্রিশ", 37: "সাঁইত্রিশ", 38: "আটত্রিশ", 39: "উনচল্লিশ",
    40: "চল্লিশ", 41: "একচল্লিশ", 42: "বিয়াল্লিশ", 43: "তেতাল্লিশ", 44: "চুয়াল্লিশ", 45: "পঁয়তাল্লিশ", 46: "ছেচল্লিশ", 47: "সাতচল্লিশ", 48: "আটচল্লিশ", 49: "উনপঞ্চাশ",
    50: "পঞ্চাশ", 51: "একান্ন", 52: "বায়ান্ন", 53: "তিপ্পান্ন", 54: "চুয়ান্ন", 55: "পঞ্চান্ন", 56: "ছাপ্পান্ন", 57: "সাতান্ন", 58: "আটান্ন", 59: "উনষাট",
    60: "ষাট", 61: "একষট্টি", 62: "বাষট্টি", 63: "তেষট্টি", 64: "চৌষট্টি", 65: "পঁয়ষট্টি", 66: "ছেষট্টি", 67: "সাতষট্টি", 68: "আটষট্টি", 69: "উনসত্তর",
    70: "সত্তর", 71: "একাত্তর", 72: "বাহাত্তর", 73: "তিয়াত্তর", 74: "চুয়াত্তর", 75: "পঁচাত্তর", 76: "ছিয়াত্তর", 77: "সাতাত্তর", 78: "আটাত্তর", 79: "উনআশি",
    80: "আশি", 81: "একাশি", 82: "বিরাশি", 83: "তিরাশি", 84: "চুরাশি", 85: "পঁচাশি", 86: "ছিয়াশি", 87: "সাতাশি", 88: "অষ্টআশি", 89: "উননব্বই",
    90: "নব্বই", 91: "একানব্বই", 92: "বিরানব্বই", 93: "তিরানব্বই", 94: "চুরানব্বই", 95: "পঁচানব্বই", 96: "ছিয়ানব্বই", 97: "সাতানব্বই", 98: "আটানব্বই", 99: "নিরানব্বই"
};

function numberToBengaliWords(num: number): string {
    if (!num || isNaN(num)) return bengaliWords[0];
    if (num === 0) return bengaliWords[0];
    let words = '';

    let crore = Math.floor(num / 10000000);
    num %= 10000000;
    let lakh = Math.floor(num / 100000);
    num %= 100000;
    let thousand = Math.floor(num / 1000);
    num %= 1000;
    let hundred = Math.floor(num / 100);
    num %= 100;

    if (crore > 0) words += numberToBengaliWords(crore) + " কোটি ";
    if (lakh > 0) words += bengaliWords[lakh] + " লক্ষ ";
    if (thousand > 0) words += bengaliWords[thousand] + " হাজার ";
    if (hundred > 0) words += bengaliWords[hundred] + "শত ";
    if (num > 0) words += bengaliWords[num];

    return words.trim();
}

const DONATION_PREFIX = "Donation |";

const buildDonationDescription = (formData: {
    donor_name: string; donor_address: string; donor_mobile: string;
    purpose: string; payment_method: string;
}) => {
    const parts = [
        `${DONATION_PREFIX} donor=${formData.donor_name.trim()}`,
        `purpose=${formData.purpose}`,
        `method=${formData.payment_method}`,
    ];
    if (formData.donor_mobile.trim()) parts.push(`mobile=${formData.donor_mobile.trim()}`);
    if (formData.donor_address.trim()) parts.push(`address=${formData.donor_address.trim()}`);
    return parts.join(" | ");
};

const parseDonationTransaction = (transaction: any) => {
    const description = String(transaction.description || "");
    const fallbackPurpose = transaction.fund_type === "lillah" ? "lillah" : "general";
    const parsed = {
        id: transaction.id,
        amount: transaction.amount,
        created_at: transaction.created_at || transaction.transaction_date,
        transaction_date: transaction.transaction_date || transaction.created_at,
        donor_name: "অজানা দাতা",
        donor_address: "",
        donor_mobile: "",
        purpose: fallbackPurpose,
        payment_method: "cash",
    };

    if (description.startsWith(DONATION_PREFIX)) {
        const fields = description.split(" | ").slice(1).reduce((acc: Record<string, string>, item) => {
            const [key, ...rest] = item.split("=");
            if (key && rest.length > 0) acc[key.trim()] = rest.join("=").trim();
            return acc;
        }, {});
        return {
            ...parsed,
            donor_name: fields.donor || parsed.donor_name,
            donor_address: fields.address || "",
            donor_mobile: fields.mobile || "",
            purpose: fields.purpose || parsed.purpose,
            payment_method: fields.method || parsed.payment_method,
        };
    }

    const legacyMatch = description.match(/^Donation from\s+(.+?)\s+\((.+?)\)$/i);
    if (legacyMatch) {
        return { ...parsed, donor_name: legacyMatch[1], purpose: legacyMatch[2] };
    }

    return { ...parsed, donor_name: description || parsed.donor_name };
};

const purposeLabels: Record<string, string> = {
    general: "সাধারণ অনুদান",
    lillah: "লিল্লাহ ফান্ড",
    zakat: "যাকাত",
    fitra: "ফিতরা",
    sadaqah: "সদকাহ",
    building: "মসজিদ/মাদ্রাসা নির্মাণ",
    other: "অন্যান্য"
};

const methodLabels: Record<string, string> = {
    cash: "নগদ অর্থ",
    bkash: "বিকাশ",
    nagad: "নগদ",
    rocket: "রকেট",
    upay: "উপায়",
    ucash: "ইউক্যাশ",
    dbbl: "ডাচ-বাংলা ব্যাংক",
    bank_asia: "ব্যাংক এশিয়া",
    agrani_bank: "অগ্রণী ব্যাংক",
    bank: "অন্যান্য ব্যাংক"
};

export default function DonationCollection() {
    const [donations, setDonations] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [donationCategoryId, setDonationCategoryId] = useState<number | null>(null);
    const [filterBranch, setFilterBranch] = useState("all");

    // Receipt Modal
    const [receiptData, setReceiptData] = useState<any>(null);
    const printRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const [savingImage, setSavingImage] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Donation_Receipt_${String(receiptData?.id || '').slice(0, 6) || 'doc'}`,
    });

    const handleSaveImage = async () => {
        if (!previewRef.current) return;
        try {
            setSavingImage(true);
            const dataUrl = await toJpeg(previewRef.current, {
                quality: 1.0,
                pixelRatio: 3,
                backgroundColor: '#ffffff'
            });
            const link = document.createElement("a");
            link.download = `Donation_Receipt_DON-${String(receiptData?.id || '').padStart(4, '0')}.jpg`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("Error saving image:", error);
            alert("ছবি সেভ করতে সমস্যা হয়েছে।");
        } finally {
            setSavingImage(false);
        }
    };

    const [formData, setFormData] = useState({
        donor_name: "", donor_address: "", donor_mobile: "",
        amount: "", purpose: "general", payment_method: "cash", branch_id: "none"
    });

    useEffect(() => {
        fetchData();
    }, [filterBranch]);

    async function fetchData() {
        setLoading(true);
        // Fetch Categories & Branches
        const [catDataRes, brDataRes] = await Promise.all([
            supabase.from("categories").select("id, name").eq("type", "income"),
            supabase.from("branches").select("id, name, address")
        ]);

        if (catDataRes.data) {
            const matchedCategory = catDataRes.data.find((c: any) => /donation|দান|অনুদান/i.test(c.name || ""));
            if (matchedCategory) setDonationCategoryId(matchedCategory.id);
        }
        if (brDataRes.data) {
            setBranches(brDataRes.data);
        }

        // Fetch Donations
        let query = supabase.from("transactions")
            .select("*")
            .eq("type", "income")
            .ilike("description", "Donation%")
            .order("transaction_date", { ascending: false })
            .limit(50);

        if (filterBranch !== "all") {
            query = query.eq("branch_id", parseInt(filterBranch));
        }

        const { data } = await query;

        if (data) setDonations(data.map(parseDonationTransaction));
        setLoading(false);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.donor_name || !formData.amount) return alert("দাতার নাম এবং পরিমাণ আবশ্যক");
        setSaving(true);

        const { data: { user } } = await supabase.auth.getUser();

        const payload: Record<string, any> = {
            amount: parseFloat(formData.amount),
            description: buildDonationDescription(formData),
            type: "income",
            fund_type: formData.purpose === "lillah" || formData.purpose === "zakat" || formData.purpose === "fitra" ? "lillah" : "general",
            created_by: user?.id,
            transaction_date: new Date().toISOString().split("T")[0],
            branch_id: formData.branch_id === "none" || !formData.branch_id ? null : parseInt(formData.branch_id),
        };

        if (donationCategoryId) payload.category_id = donationCategoryId;

        const { data, error } = await supabase.from("transactions").insert([payload]).select().single();

        if (error) {
            alert("অনুদান গ্রহণ ব্যর্থ হয়েছে: " + error.message);
        } else {
            setModalOpen(false);
            setFormData({ donor_name: "", donor_address: "", donor_mobile: "", amount: "", purpose: "general", payment_method: "cash", branch_id: "none" });
            fetchData();

            // Show receipt for newly added donation
            if (data) setReceiptData(parseDonationTransaction(data));
        }
        setSaving(false);
    };

    const totalDonation = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-pink-600" /> দান-অনুদান গ্রহণ
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">মাদ্রাসার সকল অনুদান ও ফান্ডের হিসাব</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={filterBranch} onValueChange={setFilterBranch}>
                        <SelectTrigger className="w-[150px] h-9"><Building2 className="w-4 h-4 mr-1 text-gray-400" /><SelectValue placeholder="সকল শাখা" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">সকল শাখা</SelectItem>
                            {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button onClick={() => setModalOpen(true)} className="bg-pink-600 hover:bg-pink-700 shadow-sm flex-1 md:flex-none h-9">
                        <HandCoins className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">নতুন অনুদান</span>
                    </Button>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="rounded-2xl border-l-[3px] border-l-pink-500 shadow-sm col-span-2">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 mb-1">সর্বমোট অনুদান (সাম্প্রতিক)</p>
                            <h3 className="text-xl sm:text-3xl font-bold text-pink-700">৳ {toBengaliNumber(totalDonation)}</h3>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-50 rounded-full flex items-center justify-center">
                            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs font-bold text-gray-500 mb-1">সাধারণ ফান্ড</p>
                        <h3 className="text-lg font-bold text-blue-700">
                            ৳ {toBengaliNumber(donations.filter(d => !['lillah', 'zakat', 'fitra'].includes(d.purpose)).reduce((s, d) => s + d.amount, 0))}
                        </h3>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs font-bold text-gray-500 mb-1">লিল্লাহ/যাকাত ফান্ড</p>
                        <h3 className="text-lg font-bold text-purple-700">
                            ৳ {toBengaliNumber(donations.filter(d => ['lillah', 'zakat', 'fitra'].includes(d.purpose)).reduce((s, d) => s + d.amount, 0))}
                        </h3>
                    </CardContent>
                </Card>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-pink-600" /></div>
            ) : donations.length === 0 ? (
                <Card className="rounded-2xl">
                    <CardContent className="text-center py-16 text-gray-400">
                        <HandCoins className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-bold">কোনো অনুদান পাওয়া যায়নি</p>
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
                                    <TableHead>দাতার নাম ও ঠিকানা</TableHead>
                                    <TableHead>খাত/উদ্দেশ্য</TableHead>
                                    <TableHead>পেমেন্ট মেথড</TableHead>
                                    <TableHead className="text-right">পরিমাণ</TableHead>
                                    <TableHead className="text-center w-[80px]">রসিদ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {donations.map(d => (
                                    <TableRow key={d.id} className="hover:bg-pink-50/30">
                                        <TableCell className="text-sm">{format(new Date(d.transaction_date), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>
                                            <p className="font-bold text-gray-800">{d.donor_name}</p>
                                            {(d.donor_mobile || d.donor_address) && (
                                                <p className="text-xs text-gray-500">
                                                    {d.donor_mobile} {d.donor_mobile && d.donor_address && '| '} {d.donor_address}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={['lillah', 'zakat', 'fitra'].includes(d.purpose) ? "bg-purple-100 text-purple-700 hover:bg-purple-100 border-none" : "bg-blue-100 text-blue-700 hover:bg-blue-100 border-none"}>
                                                {purposeLabels[d.purpose] || d.purpose}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{methodLabels[d.payment_method] || d.payment_method}</TableCell>
                                        <TableCell className="text-right font-bold text-pink-600">৳ {toBengaliNumber(d.amount)}</TableCell>
                                        <TableCell className="text-center">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500 hover:bg-blue-50" onClick={() => setReceiptData(d)}>
                                                <Printer className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {donations.map(d => (
                            <Card key={d.id} className="rounded-xl shadow-sm border-l-2 border-l-pink-400">
                                <CardContent className="p-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 pr-2">
                                            <p className="font-bold text-gray-800 text-sm">{d.donor_name}</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {d.donor_mobile && <span className="text-[10px] text-gray-500 flex items-center gap-1"><Smartphone className="w-3 h-3" />{d.donor_mobile}</span>}
                                                {d.donor_address && <span className="text-[10px] text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{d.donor_address}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-pink-600">৳ {toBengaliNumber(d.amount)}</p>
                                            <p className="text-[10px] text-gray-400 flex items-center justify-end gap-1 mt-0.5"><Calendar className="w-3 h-3" /> {format(new Date(d.transaction_date), 'dd/MM/yy')}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                        <div className="flex gap-2">
                                            <Badge className={`text-[9px] px-1.5 py-0 h-4 border-none ${['lillah', 'zakat', 'fitra'].includes(d.purpose) ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                                                {purposeLabels[d.purpose] || d.purpose}
                                            </Badge>
                                            <span className="text-[10px] text-gray-500 border rounded px-1.5 bg-gray-50">{methodLabels[d.payment_method] || d.payment_method}</span>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-blue-500" onClick={() => setReceiptData(d)}>
                                            <Printer className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {/* Add Donation Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><HandCoins className="w-5 h-5 text-pink-600" /> নতুন অনুদান গ্রহণ</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">দাতার নাম *</label>
                            <Input className="h-10" placeholder="উদাঃ মোঃ আব্দুল্লাহ" value={formData.donor_name} onChange={e => setFormData({ ...formData, donor_name: e.target.value })} required />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">শাখা (মাদ্রাসা)</label>
                            <Select value={formData.branch_id} onValueChange={(v) => setFormData({ ...formData, branch_id: v })}>
                                <SelectTrigger className="h-10"><SelectValue placeholder="শাখা নির্বাচন করুন (ঐচ্ছিক)" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">সাধারণ (কোনো নির্দিষ্ট শাখা নয়)</SelectItem>
                                    {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600">মোবাইল নম্বর (ঐচ্ছিক)</label>
                                <Input className="h-10" placeholder="01XXXXXXXXX" value={formData.donor_mobile} onChange={e => setFormData({ ...formData, donor_mobile: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600">টাকার পরিমাণ *</label>
                                <Input className="h-10 text-lg font-bold" type="number" placeholder="0" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">ঠিকানা (ঐচ্ছিক)</label>
                            <Input className="h-10" placeholder="উদাঃ ঢাকা" value={formData.donor_address} onChange={e => setFormData({ ...formData, donor_address: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600">খাত/উদ্দেশ্য</label>
                                <Select value={formData.purpose} onValueChange={(v) => setFormData({ ...formData, purpose: v })}>
                                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">সাধারণ অনুদান (জেনারেল)</SelectItem>
                                        <SelectItem value="lillah">লিল্লাহ ফান্ড</SelectItem>
                                        <SelectItem value="zakat">যাকাত</SelectItem>
                                        <SelectItem value="fitra">ফিতরা</SelectItem>
                                        <SelectItem value="sadaqah">সদকাহ</SelectItem>
                                        <SelectItem value="building">নির্মাণ ফান্ড</SelectItem>
                                        <SelectItem value="other">অন্যান্য</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600">পেমেন্ট মেথড</label>
                                <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">নগদ অর্থ</SelectItem>
                                        <SelectItem value="bkash">বিকাশ</SelectItem>
                                        <SelectItem value="nagad">নগদ (Mobile Banking)</SelectItem>
                                        <SelectItem value="rocket">রকেট</SelectItem>
                                        <SelectItem value="upay">উপায়</SelectItem>
                                        <SelectItem value="ucash">ইউক্যাশ</SelectItem>
                                        <SelectItem value="dbbl">ডাচ-বাংলা ব্যাংক</SelectItem>
                                        <SelectItem value="bank_asia">ব্যাংক এশিয়া</SelectItem>
                                        <SelectItem value="agrani_bank">অগ্রণী ব্যাংক</SelectItem>
                                        <SelectItem value="bank">অন্যান্য ব্যাংক</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>বাতিল</Button>
                            <Button type="submit" disabled={saving} className="bg-pink-600 hover:bg-pink-700">
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <HandCoins className="w-4 h-4 mr-2" />}
                                গ্রহণ করুন
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Receipt Modal */}
            <Dialog open={!!receiptData} onOpenChange={(open) => !open && setReceiptData(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>অনুদান রসিদ</DialogTitle>
                    </DialogHeader>
                    {receiptData && (
                        <>
                            <div className="flex justify-end gap-2 mb-2">
                                <Button onClick={handleSaveImage} disabled={savingImage} variant="outline" size="sm" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                                    {savingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                    সেভ করুন (JPG)
                                </Button>
                                <Button onClick={() => handlePrint()} variant="outline" size="sm" className="text-blue-600 border-blue-200">
                                    <Printer className="w-4 h-4 mr-2" /> প্রিন্ট করুন
                                </Button>
                            </div>

                            <div ref={previewRef} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-black font-hind">
                                {/* Header Section */}
                                <div className="flex flex-col items-center border-b-2 border-emerald-700 pb-4 mb-6">
                                    <div className="mb-2">
                                        <img src="/images/bismillah.svg" alt="Bismillah" className="h-4 object-contain" />
                                    </div>
                                    <img src="/images/long_logo.svg" alt="Rahima Jannat Madrasa" className="h-12 object-contain mb-2" />
                                    <p className="text-xs text-gray-700 font-medium mb-4 text-center">
                                        {receiptData.branch_id
                                            ? (branches.find(b => b.id === receiptData.branch_id)?.address || "হলিধানী বাজার, ঝিনাইদহ")
                                            : (branches.find(b => b.name?.includes("হলিধানী"))?.address || "হলিধানী বাজার, ঝিনাইদহ")}
                                    </p>

                                    <div className="w-full flex justify-between items-end mt-2">
                                        <div className="text-xs text-gray-700 space-y-1">
                                            <p><span className="font-bold text-gray-500">রসিদ নং:</span> <span className="font-mono font-bold">DON-{String(receiptData.id || '').padStart(4, '0')}</span></p>
                                            <p><span className="font-bold text-gray-500">তারিখ:</span> <span className="font-bold">{format(new Date(receiptData.transaction_date), "dd/MM/yyyy")}</span></p>
                                        </div>
                                        <div className="bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-lg font-bold text-sm tracking-widest border border-emerald-200">মানি রসিদ (অনুদান)</div>
                                    </div>
                                </div>

                                {/* Donor Details Section */}
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-6 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>

                                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                                        <div className="col-span-2 flex items-baseline">
                                            <span className="w-32 font-bold text-gray-500 shrink-0">দাতার নাম:</span>
                                            <span className="flex-1 font-bold text-gray-900 border-b border-dashed border-gray-300 pb-1">{receiptData.donor_name}</span>
                                        </div>

                                        {receiptData.donor_mobile && (
                                            <div className="flex items-baseline">
                                                <span className="w-32 font-bold text-gray-500 shrink-0">মোবাইল:</span>
                                                <span className="flex-1 font-mono font-bold text-gray-800 border-b border-dashed border-gray-300 pb-1">{receiptData.donor_mobile}</span>
                                            </div>
                                        )}

                                        {receiptData.donor_address && (
                                            <div className="flex items-baseline col-span-2">
                                                <span className="w-32 font-bold text-gray-500 shrink-0">ঠিকানা:</span>
                                                <span className="flex-1 text-gray-800 border-b border-dashed border-gray-300 pb-1">{receiptData.donor_address}</span>
                                            </div>
                                        )}

                                        <div className="col-span-2 flex items-baseline">
                                            <span className="w-32 font-bold text-gray-500 shrink-0 whitespace-nowrap">খাত/উদ্দেশ্য:</span>
                                            <span className="flex-1 font-bold text-emerald-700 border-b border-dashed border-gray-300 pb-1">{purposeLabels[receiptData.purpose] || receiptData.purpose}</span>
                                        </div>
                                        <div className="col-span-2 flex items-baseline">
                                            <span className="w-32 font-bold text-gray-500 shrink-0 whitespace-nowrap">পেমেন্ট মাধ্যম:</span>
                                            <span className="flex-1 text-gray-800 border-b border-dashed border-gray-300 pb-1">{methodLabels[receiptData.payment_method] || receiptData.payment_method}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount Section */}
                                <div className="flex flex-col sm:flex-row items-center justify-between bg-emerald-50 rounded-lg border border-emerald-100 p-4 gap-4 mb-8">
                                    <div className="flex-1 text-center sm:text-left">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-bold text-emerald-700 block sm:inline mb-1 sm:mb-0 sm:mr-2">কথায়:</span>
                                            <span>{numberToBengaliWords(receiptData.amount)} টাকা মাত্র।</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 px-5 py-2.5 bg-emerald-600 text-white rounded-md shadow-sm">
                                        <span className="text-xs font-medium opacity-90">সর্বমোট</span>
                                        <span className="font-mono text-lg font-bold">৳ {toBengaliNumber(receiptData.amount)}/-</span>
                                    </div>
                                </div>

                                {/* Footer / Disclaimer */}
                                <div className="pt-4 text-center border-t border-dashed border-gray-200">
                                    <p className="text-[11px] text-gray-500 font-medium">এই অনুদান রসিদটি ইলেকট্রনিকভাবে তৈরি করা হয়েছে। কোনো স্বাক্ষরের প্রয়োজন নেই।</p>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Hidden Receipt for Printing */}
            <div className="hidden">
                {receiptData && (
                    <div id="printable-area" ref={printRef} className="bg-white p-[10mm] text-black w-[210mm] min-h-[297mm] mx-auto flex flex-col justify-start font-hind print:p-8">
                        {/* Header Section */}
                        <div className="flex flex-col items-center border-b-2 border-emerald-700 pb-4 mb-8">
                            <div className="mb-3">
                                <img src="/images/bismillah.svg" alt="Bismillah" className="h-5 object-contain" />
                            </div>
                            <img src="/images/long_logo.svg" alt="Rahima Jannat Madrasa" className="h-16 object-contain mb-2" />
                            <p className="text-sm text-gray-700 font-medium mb-6">
                                {receiptData.branch_id
                                    ? (branches.find(b => b.id === receiptData.branch_id)?.address || "হলিধানী বাজার, ঝিনাইদহ")
                                    : (branches.find(b => b.name?.includes("হলিধানী"))?.address || "হলিধানী বাজার, ঝিনাইদহ")}
                            </p>

                            <div className="w-full flex justify-between items-end mt-2">
                                <div className="text-sm text-gray-700 space-y-1">
                                    <p><span className="font-bold text-gray-500">রসিদ নং:</span> <span className="font-mono font-bold">DON-{String(receiptData.id || '').padStart(4, '0')}</span></p>
                                    <p><span className="font-bold text-gray-500">তারিখ:</span> <span className="font-bold">{format(new Date(receiptData.transaction_date), "dd/MM/yyyy")}</span></p>
                                </div>
                                <div className="bg-emerald-100 text-emerald-800 px-6 py-2 rounded-lg font-bold text-lg tracking-widest border border-emerald-200 shadow-sm">মানি রসিদ (অনুদান)</div>
                            </div>
                        </div>

                        {/* Donor Details Section */}
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm mb-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>

                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div className="col-span-2 flex items-baseline">
                                    <span className="w-32 font-bold text-gray-500 shrink-0">দাতার নাম:</span>
                                    <span className="flex-1 font-bold text-lg text-gray-900 border-b border-dashed border-gray-300 pb-1">{receiptData.donor_name}</span>
                                </div>

                                {receiptData.donor_mobile && (
                                    <div className="flex items-baseline">
                                        <span className="w-32 font-bold text-gray-500 shrink-0">মোবাইল:</span>
                                        <span className="flex-1 font-mono font-bold text-gray-800 border-b border-dashed border-gray-300 pb-1">{receiptData.donor_mobile}</span>
                                    </div>
                                )}

                                {receiptData.donor_address && (
                                    <div className="flex items-baseline col-span-2">
                                        <span className="w-32 font-bold text-gray-500 shrink-0">ঠিকানা:</span>
                                        <span className="flex-1 text-gray-800 border-b border-dashed border-gray-300 pb-1">{receiptData.donor_address}</span>
                                    </div>
                                )}

                                <div className="col-span-2 flex items-baseline">
                                    <span className="w-32 font-bold text-gray-500 shrink-0 whitespace-nowrap">খাত/উদ্দেশ্য:</span>
                                    <span className="flex-1 font-bold text-emerald-700 border-b border-dashed border-gray-300 pb-1">{purposeLabels[receiptData.purpose] || receiptData.purpose}</span>
                                </div>
                                <div className="col-span-2 flex items-baseline">
                                    <span className="w-32 font-bold text-gray-500 shrink-0 whitespace-nowrap">পেমেন্ট মাধ্যম:</span>
                                    <span className="flex-1 text-gray-800 border-b border-dashed border-gray-300 pb-1">{methodLabels[receiptData.payment_method] || receiptData.payment_method}</span>
                                </div>
                            </div>
                        </div>

                        {/* Amount Section */}
                        <div className="flex items-center justify-between bg-emerald-50 rounded-lg border border-emerald-100 p-4 mb-16">
                            <div className="flex-1 pr-4">
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <span className="font-bold text-emerald-700">কথায়:</span>
                                    <span>{numberToBengaliWords(receiptData.amount)} টাকা মাত্র।</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-4 shrink-0 px-6 py-3 bg-emerald-600 text-white rounded-md shadow-sm">
                                <span className="text-sm font-medium opacity-90">সর্বমোট</span>
                                <span className="font-mono text-xl font-bold">৳ {toBengaliNumber(receiptData.amount)}/-</span>
                            </div>
                        </div>

                        {/* Footer / Disclaimer */}
                        <div className="mt-auto pt-6 text-center border-t border-dashed border-gray-200">
                            <p className="text-[11px] text-gray-500 font-medium">এই অনুদান রসিদটি ইলেকট্রনিকভাবে তৈরি করা হয়েছে। কোনো স্বাক্ষরের প্রয়োজন নেই।</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

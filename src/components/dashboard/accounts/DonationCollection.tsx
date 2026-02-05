"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Heart, Printer } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";

export default function DonationCollection() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const [formData, setFormData] = useState({
    donor_name: "",
    donor_address: "",
    donor_mobile: "",
    amount: "",
    purpose: "general",
    payment_method: "cash"
  });

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    const { data } = await supabase.from("donations").select("*").order("created_at", { ascending: false }).limit(20);
    if(data) setDonations(data);
  };

  const handleSubmit = async () => {
    if(!formData.donor_name || !formData.amount) return alert("দাতার নাম এবং পরিমাণ আবশ্যক");
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    // 1. Insert into donations table
    const { data: donation, error } = await supabase.from("donations").insert({
        ...formData,
        amount: parseFloat(formData.amount),
        created_by: user?.id
    }).select().single();

    if(error) {
        alert("এরর: " + error.message);
    } else {
        // 2. Insert into transactions table for unified reporting
        await supabase.from("transactions").insert({
            amount: parseFloat(formData.amount),
            description: `Donation from ${formData.donor_name} (${formData.purpose})`,
            type: 'income',
            fund_type: formData.purpose === 'lillah' ? 'lillah' : 'general',
            created_by: user?.id,
            donation_id: donation.id,
            category_id: 2 // Assuming ID 2 is for Donations, or fetch dynamically
        });

        alert("দান গ্রহণ সফল হয়েছে!");
        setReceiptData(donation);
        setFormData({ donor_name: "", donor_address: "", donor_mobile: "", amount: "", purpose: "general", payment_method: "cash" });
        fetchDonations();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-purple-600">
          <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="text-purple-600"/> নতুন দান গ্রহণ</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <label className="text-sm font-medium">দাতার নাম</label>
                  <Input value={formData.donor_name} onChange={e=>setFormData({...formData, donor_name: e.target.value})} placeholder="নাম" />
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-medium">মোবাইল নম্বর</label>
                  <Input value={formData.donor_mobile} onChange={e=>setFormData({...formData, donor_mobile: e.target.value})} placeholder="017..." />
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-medium">ঠিকানা</label>
                  <Input value={formData.donor_address} onChange={e=>setFormData({...formData, donor_address: e.target.value})} placeholder="গ্রাম/মহল্লা" />
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-medium">পরিমাণ</label>
                  <Input type="number" value={formData.amount} onChange={e=>setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-medium">দানের উদ্দেশ্য</label>
                  <Select value={formData.purpose} onValueChange={v=>setFormData({...formData, purpose: v})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="general">সাধারণ দান</SelectItem>
                          <SelectItem value="lillah">লিল্লাহ ফান্ড</SelectItem>
                          <SelectItem value="zakat">যাকাত</SelectItem>
                          <SelectItem value="mosque">মসজিদ ফান্ড</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-medium">পেমেন্ট মেথড</label>
                  <Select value={formData.payment_method} onValueChange={v=>setFormData({...formData, payment_method: v})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="cash">নগদ</SelectItem>
                          <SelectItem value="bkash">বিকাশ</SelectItem>
                          <SelectItem value="bank">ব্যাংক</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <Button onClick={handleSubmit} disabled={loading} className="md:col-span-2 bg-purple-600 hover:bg-purple-700 h-12 text-lg">
                  {loading ? <Loader2 className="animate-spin"/> : "দান গ্রহণ করুন"}
              </Button>
          </CardContent>
      </Card>

      <Card>
          <CardHeader><CardTitle>সাম্প্রতিক দানসমূহ</CardTitle></CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>তারিখ</TableHead>
                          <TableHead>দাতার নাম</TableHead>
                          <TableHead>উদ্দেশ্য</TableHead>
                          <TableHead>মেথড</TableHead>
                          <TableHead className="text-right">পরিমাণ</TableHead>
                          <TableHead className="text-right">রসিদ</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {donations.map(d => (
                          <TableRow key={d.id}>
                              <TableCell>{format(new Date(d.created_at), 'dd MMM yyyy')}</TableCell>
                              <TableCell>
                                  <div className="font-bold">{d.donor_name}</div>
                                  <div className="text-xs text-gray-500">{d.donor_address}</div>
                              </TableCell>
                              <TableCell className="capitalize">{d.purpose}</TableCell>
                              <TableCell className="capitalize">{d.payment_method}</TableCell>
                              <TableCell className="text-right font-bold text-purple-600">৳ {d.amount}</TableCell>
                              <TableCell className="text-right">
                                  <Button size="sm" variant="ghost" onClick={() => setReceiptData(d)}><Printer className="w-4 h-4"/></Button>
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>

      {/* Donation Receipt Modal */}
      {receiptData && (
          <Dialog open={!!receiptData} onOpenChange={(o) => !o && setReceiptData(null)}>
              <DialogContent className="max-w-[600px] bg-white p-0">
                  <DialogTitle className="sr-only">Donation Receipt</DialogTitle>
                  <div className="p-8 border-4 border-double border-purple-200 m-4">
                      <div className="text-center mb-6">
                          <h2 className="text-2xl font-bold text-purple-800">রাহিমা জান্নাত মহিলা মাদ্রাসা</h2>
                          <p className="text-gray-500">দান রসিদ / Donation Receipt</p>
                      </div>
                      <div className="space-y-4 text-sm">
                          <div className="flex justify-between border-b pb-2">
                              <span>রসিদ নং: <span className="font-mono">{receiptData.id.slice(0,8)}</span></span>
                              <span>তারিখ: {format(new Date(receiptData.created_at), 'dd/MM/yyyy')}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <p className="text-gray-500">দাতার নাম</p>
                                  <p className="font-bold text-lg">{receiptData.donor_name}</p>
                              </div>
                              <div className="text-right">
                                  <p className="text-gray-500">মোবাইল</p>
                                  <p className="font-mono">{receiptData.donor_mobile || '-'}</p>
                              </div>
                          </div>
                          <div>
                              <p className="text-gray-500">ঠিকানা</p>
                              <p>{receiptData.donor_address || '-'}</p>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg flex justify-between items-center border border-purple-100">
                              <div>
                                  <p className="text-purple-600 font-bold capitalize">{receiptData.purpose} Fund</p>
                                  <p className="text-xs text-gray-500 capitalize">Method: {receiptData.payment_method}</p>
                              </div>
                              <p className="text-2xl font-bold text-purple-700">৳ {receiptData.amount}/-</p>
                          </div>
                          <div className="pt-8 flex justify-between text-xs text-gray-400">
                              <p>আদায়কারীর স্বাক্ষর</p>
                              <p>কর্তৃপক্ষ</p>
                          </div>
                      </div>
                  </div>
                  <DialogFooter className="p-4 bg-gray-50 border-t">
                      <Button onClick={() => window.print()} className="w-full gap-2"><Printer className="w-4 h-4"/> প্রিন্ট করুন</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}
    </div>
  );
}

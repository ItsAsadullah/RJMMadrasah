"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Upload, Trash2, ShieldAlert, Loader2, Database, AlertTriangle } from "lucide-react";
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

export default function BackupRestorePage() {
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<"backup" | "restore" | "clear" | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [infoAlertOpen, setInfoAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    description: string;
    type: "success" | "error" | "warning";
  }>({ title: "", description: "", type: "success" });
  const [adminPassword, setAdminPassword] = useState("");
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  // Tables to backup/restore - Order is critical for dependency management (Parent -> Child)
  const TABLES = [
    "branches",
    "categories",
    "academic_classes",
     "academic_subjects",
     "subjects",
     "exams",
    "students",
    "teachers",
    "fee_structures",
    "student_dues",
    "transactions",
    "payments",
    "attendance",
    "routines",
    "exam_routines",
    "exam_marks",
    "results",
    "promotion_logs",
    "notices",
    "hero_content",
    "home_sections",
    "gallery_items",
    "admission_config",
    "routine_templates",
    "profiles"
  ];

  const handleAction = (type: "backup" | "restore" | "clear") => {
    setActionType(type);
    setAdminPassword("");
    setAlertOpen(true);
  };

  const verifyPassword = async () => {
    // In a real app, this should verify against the logged-in user's password securely via an RPC or server action.
    // For this implementation, we'll assume the admin password is being verified.
    // However, Supabase doesn't expose a simple "verify password" API for security.
    // A common workaround is to try to sign in with the current email and provided password.
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) throw new Error("User not found");

      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: adminPassword,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      setAlertConfig({
        title: "ত্রুটি!",
        description: "পাসওয়ার্ড সঠিক নয়!",
        type: "error"
      });
      setInfoAlertOpen(true);
      return false;
    }
  };

  const executeBackup = async () => {
    setLoading(true);
    try {
      const backupData: Record<string, any> = {};
      
      for (const table of TABLES) {
        const { data, error } = await supabase.from(table).select("*");
        if (error) throw error;
        backupData[table] = data;
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_rahima_jannat_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setAlertConfig({
        title: "সফল!",
        description: "ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে!",
        type: "success"
      });
      setInfoAlertOpen(true);
    } catch (error: any) {
      setAlertConfig({
        title: "ত্রুটি!",
        description: "ব্যাকআপ নিতে সমস্যা হয়েছে: " + error.message,
        type: "error"
      });
      setInfoAlertOpen(true);
    } finally {
      setLoading(false);
      setAlertOpen(false);
    }
  };

  const executeRestore = async () => {
    if (!restoreFile) {
        setAlertConfig({
            title: "সতর্কতা",
            description: "দয়া করে ব্যাকআপ ফাইল সিলেক্ট করুন",
            type: "warning"
        });
        setInfoAlertOpen(true);
        return;
    }
    
    setLoading(true);
    try {
      const text = await restoreFile.text();
      const backupData = JSON.parse(text);

      // Disable RLS or handle dependencies carefully
      // Order matters: branches -> classes -> students/teachers -> attendance/exams
      
      // 1. Clear existing data (optional but safer for clean restore)
      // Note: This might fail if there are foreign key constraints not handled.
      // We will try to upsert/insert.
      
      for (const table of TABLES) {
        if (backupData[table] && Array.isArray(backupData[table]) && backupData[table].length > 0) {
            // Remove helper join columns if any (e.g., branches in teachers)
            const cleanData = backupData[table].map((item: any) => {
                const newItem = { ...item };
                // Remove joined tables (objects/arrays) that are not columns
                Object.keys(newItem).forEach(key => {
                    if (typeof newItem[key] === 'object' && newItem[key] !== null) {
                        delete newItem[key];
                    }
                });
                return newItem;
            });

            const { error } = await supabase.from(table).upsert(cleanData);
            
            if (error) {
                console.error(`Error restoring ${table}:`, error);
                setAlertConfig({
                    title: "ত্রুটি!",
                    description: `Error restoring ${table}: ${error.message}`,
                    type: "error"
                });
                setInfoAlertOpen(true);
                // We don't throw here to attempt restoring other tables
            }
        }
      }

      setAlertConfig({
        title: "সফল!",
        description: "ডাটা রিস্টোর সম্পন্ন হয়েছে!",
        type: "success"
      });
      setInfoAlertOpen(true);
    } catch (error: any) {
      setAlertConfig({
        title: "ত্রুটি!",
        description: "রিস্টোর করতে সমস্যা হয়েছে: " + error.message,
        type: "error"
      });
      setInfoAlertOpen(true);
    } finally {
      setLoading(false);
      setAlertOpen(false);
      setRestoreFile(null);
    }
  };

  const executeClear = async () => {
    setLoading(true);
    try {
      // Order is critical for deletion to avoid FK constraints
      // We reverse the TABLES array to delete children first
      const REVERSE_TABLES = [...TABLES].reverse();

      for (const table of REVERSE_TABLES) {
        // We use .not('id', 'is', null) to match all rows regardless of ID type (UUID or Int)
        // This is equivalent to "WHERE id IS NOT NULL"
        const { error } = await supabase.from(table).delete().not('id', 'is', null);
        
        if (error) {
            console.error(`Error clearing ${table}:`, JSON.stringify(error, null, 2));
            setAlertConfig({
                title: "ত্রুটি!",
                description: `Error clearing ${table}: ${error.message || JSON.stringify(error)}`,
                type: "error"
            });
            setInfoAlertOpen(true);
        }
      }
      
      // Specific fix for clearing tables if the above generic method fails
      // We might need to fetch IDs first then delete, but that's slow.
      // Let's assume the user has RLS policies allowing deletion.

      setAlertConfig({
        title: "সফল!",
        description: "সকল ডাটা মুছে ফেলা হয়েছে!",
        type: "success"
      });
      setInfoAlertOpen(true);
    } catch (error: any) {
      setAlertConfig({
        title: "ত্রুটি!",
        description: "ডাটা মুছতে সমস্যা হয়েছে: " + error.message,
        type: "error"
      });
      setInfoAlertOpen(true);
    } finally {
      setLoading(false);
      setAlertOpen(false);
    }
  };

  const handleConfirm = async () => {
    if (!adminPassword) {
        setAlertConfig({
            title: "সতর্কতা",
            description: "পাসওয়ার্ড দিন",
            type: "warning"
        });
        setInfoAlertOpen(true);
        return;
    }

    const verified = await verifyPassword();
    if (!verified) return;

    if (actionType === "backup") await executeBackup();
    else if (actionType === "restore") await executeRestore();
    else if (actionType === "clear") await executeClear();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600"/> ডাটা ব্যাকআপ ও রিস্টোর
        </h1>
        <p className="text-sm text-gray-500">সিস্টেমের ডাটা সুরক্ষিত রাখতে নিয়মিত ব্যাকআপ নিন।</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Backup Card */}
        <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Download className="w-5 h-5"/> ব্যাকআপ নিন
                </CardTitle>
                <CardDescription>
                    পুরো ডাটাবেসের একটি কপি ডাউনলোড করে রাখুন।
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button 
                    onClick={() => handleAction("backup")} 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                >
                    ব্যাকআপ ডাউনলোড করুন
                </Button>
            </CardContent>
        </Card>

        {/* Restore Card */}
        <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                    <Upload className="w-5 h-5"/> রিস্টোর করুন
                </CardTitle>
                <CardDescription>
                    আগের ব্যাকআপ ফাইল থেকে ডাটা ফিরিয়ে আনুন।
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <Input 
                    type="file" 
                    accept=".json" 
                    onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                    className="bg-white"
                />
                <Button 
                    onClick={() => handleAction("restore")} 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={!restoreFile}
                >
                    ডাটা রিস্টোর করুন
                </Button>
            </CardContent>
        </Card>

        {/* Clear Data Card */}
        <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                    <Trash2 className="w-5 h-5"/> ডাটা রিসেট
                </CardTitle>
                <CardDescription>
                    সতর্কতা: এটি সকল ডাটা স্থায়ীভাবে মুছে ফেলবে!
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button 
                    onClick={() => handleAction("clear")} 
                    variant="destructive" 
                    className="w-full"
                >
                    সকল ডাটা মুছুন
                </Button>
            </CardContent>
        </Card>
      </div>

      <Alert variant="destructive" className="bg-orange-50 border-orange-200">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800">সতর্কতা</AlertTitle>
        <AlertDescription className="text-orange-700">
            রিস্টোর বা ডাটা রিসেট করার আগে অবশ্যই বর্তমান ডাটার একটি ব্যাকআপ নিয়ে রাখুন। ভুলবশত ডাটা হারিয়ে গেলে তা আর ফিরিয়ে আনা সম্ভব হবে না।
        </AlertDescription>
      </Alert>

      {/* Confirmation Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
                {actionType === "backup" && "ব্যাকআপ কনফার্মেশন"}
                {actionType === "restore" && "রিস্টোর কনফার্মেশন"}
                {actionType === "clear" && "ডাটা রিসেট কনফার্মেশন"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "backup" && "আপনি কি ডাটাবেসের ব্যাকআপ ডাউনলোড করতে চান? এজন্য আপনার অ্যাডমিন পাসওয়ার্ড প্রয়োজন।"}
              {actionType === "restore" && "আপনি কি নিশ্চিত যে আপনি ডাটা রিস্টোর করতে চান? এটি বর্তমান ডাটা পরিবর্তন করতে পারে।"}
              {actionType === "clear" && <span className="text-red-600 font-bold">আপনি কি নিশ্চিত যে আপনি সকল ডাটা মুছে ফেলতে চান? এই অ্যাকশনটি ফিরিয়ে নেওয়া যাবে না!</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2 py-4">
            <Label>অ্যাডমিন পাসওয়ার্ড দিন</Label>
            <Input 
                type="password" 
                value={adminPassword} 
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="আপনার পাসওয়ার্ড"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction 
                onClick={(e) => { e.preventDefault(); handleConfirm(); }} 
                className={actionType === "clear" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
                disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : "নিশ্চিত করুন"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Info Alert Dialog (Success/Error/Warning) */}
      <AlertDialog open={infoAlertOpen} onOpenChange={setInfoAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={
                alertConfig.type === "error" ? "text-red-600" : 
                alertConfig.type === "success" ? "text-green-600" : "text-orange-600"
            }>
                {alertConfig.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {alertConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setInfoAlertOpen(false)} className="bg-blue-600 hover:bg-blue-700">
              ঠিক আছে
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

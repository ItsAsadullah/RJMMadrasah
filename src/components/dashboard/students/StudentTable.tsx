"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Edit, Trash2, Download, Printer, ArrowUpDown,
  ChevronLeft, ChevronRight, Eye, Columns3,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { CopyableId } from "@/components/ui/copyable-id";
import { getClassOrder } from "@/lib/classOrder";

// ─── Types ────────────────────────────────────────────────────────────────────
type Student = {
  id: string;
  name_bn: string;
  student_id: string;
  roll_number?: string;
  roll_no?: string;
  class_name: string;
  department: string;
  father_mobile: string;
  guardian_name?: string;
  guardian_mobile?: string;
  email?: string;
  status: string;
  created_at: string;
  branch_id: number;
  photo_url?: string;
  present_village?: string;
  present_union?: string;
  present_upazila?: string;
  present_district?: string;
  branches?: { name: string };
};

type StudentTableProps = {
  data: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const ROWS_OPTIONS = [10, 20, 30, 50, 100, 150, 200] as const;

type SortOption = { value: string; label: string; key?: string; dir?: "asc" | "desc" };

const SORT_OPTIONS: SortOption[] = [
  { value: "default",     label: "ডিফল্ট (সর্বশেষ যুক্ত)" },
  { value: "name_asc",    label: "নাম (ক → য)",            key: "name_bn",    dir: "asc"  },
  { value: "name_desc",   label: "নাম (য → ক)",            key: "name_bn",    dir: "desc" },
  { value: "class_asc",   label: "শ্রেণি (ছোট → বড়)",     key: "class_name", dir: "asc"  },
  { value: "class_desc",  label: "শ্রেণি (বড় → ছোট)",     key: "class_name", dir: "desc" },
  { value: "roll_asc",    label: "রোল (ছোট → বড়)",         key: "roll",       dir: "asc"  },
  { value: "roll_desc",   label: "রোল (বড় → ছোট)",         key: "roll",       dir: "desc" },
  { value: "branch_asc",  label: "শাখা (ক → য)",           key: "branch",     dir: "asc"  },
  { value: "branch_desc", label: "শাখা (য → ক)",           key: "branch",     dir: "desc" },
  { value: "id_asc",      label: "আইডি (পুরাতন → নতুন)",  key: "student_id", dir: "asc"  },
  { value: "id_desc",     label: "আইডি (নতুন → পুরাতন)",  key: "student_id", dir: "desc" },
  { value: "date_desc",   label: "তারিখ (নতুন → পুরাতন)", key: "created_at", dir: "desc" },
  { value: "date_asc",    label: "তারিখ (পুরাতন → নতুন)", key: "created_at", dir: "asc"  },
];

const BRANCH_PALETTE = [
  { bg: "bg-blue-100",   text: "text-blue-800",   dot: "bg-blue-500",   border: "border-blue-300"   },
  { bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-500", border: "border-purple-300" },
  { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500", border: "border-orange-300" },
  { bg: "bg-pink-100",   text: "text-pink-800",   dot: "bg-pink-500",   border: "border-pink-300"   },
  { bg: "bg-teal-100",   text: "text-teal-800",   dot: "bg-teal-500",   border: "border-teal-300"   },
  { bg: "bg-indigo-100", text: "text-indigo-800", dot: "bg-indigo-500", border: "border-indigo-300" },
  { bg: "bg-amber-100",  text: "text-amber-800",  dot: "bg-amber-500",  border: "border-amber-300"  },
  { bg: "bg-cyan-100",   text: "text-cyan-800",   dot: "bg-cyan-500",   border: "border-cyan-300"   },
];

// Bengali-aware text collator
const bnCollator = new Intl.Collator('bn', { sensitivity: 'base', numeric: true });
const toBengaliNumber = (num: any) => String(num).replace(/[0-9]/g, c => "০১২৩৪৫৬৭৮৯"[parseInt(c)]);

// ─── Default avatar (real photo) ──────────────────────────────────────────────
const HijabAvatar = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/images/default-avatar.png" alt="ডিফল্ট অ্যাভাটার" className="h-full w-full object-cover" />
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentTable({ data, onEdit, onDelete, onBulkDelete }: StudentTableProps) {
  type ExtraColumns = { guardianName: boolean; guardianMobile: boolean; address: boolean };

  const [searchTerm,           setSearchTerm]           = useState("");
  const [sortValue,            setSortValue]            = useState("default");
  const [currentPage,          setCurrentPage]          = useState(1);
  const [rowsPerPage,          setRowsPerPage]          = useState(10);
  const [selectedRows,         setSelectedRows]         = useState<Set<string>>(new Set());
  const [showExtraColumnOpts,  setShowExtraColumnOpts]  = useState(false);
  const [printSchoolName,      setPrintSchoolName]      = useState("রহিমা জান্নাত মহিলা মাদ্রাসা");
  const [printLongLogoUrl,     setPrintLongLogoUrl]     = useState("/images/long_logo.svg");
  const [extraColumns,         setExtraColumns]         = useState<ExtraColumns>({
    guardianName: true,
    guardianMobile: true,
    address: true,
  });

  // Branch → color mapping (stable per session)
  const branchColorMap = useMemo(() => {
    const map = new Map<number, (typeof BRANCH_PALETTE)[0]>();
    const ids = [...new Set(data.map((s) => s.branch_id).filter(Boolean))].sort((a, b) => a - b);
    ids.forEach((id, i) => map.set(id, BRANCH_PALETTE[i % BRANCH_PALETTE.length]));
    return map;
  }, [data]);

  const getBranchColor = (id: number) => branchColorMap.get(id) ?? BRANCH_PALETTE[0];

  useEffect(() => {
    supabase.from("footer_settings").select("school_name").limit(1).single().then(({ data }) => {
      if (data?.school_name) setPrintSchoolName(data.school_name);
    });
    supabase.from("branding_settings").select("long_logo_url, logo_url").eq("id", 1).single().then(({ data }) => {
      if (data?.long_logo_url) { setPrintLongLogoUrl(data.long_logo_url); return; }
      if (data?.logo_url) setPrintLongLogoUrl(data.logo_url);
    });
  }, []);

  // ── Filter + Sort ──────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let list = [...data];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((s) =>
        s.name_bn?.toLowerCase().includes(q)      ||
        s.guardian_name?.toLowerCase().includes(q)||
        s.student_id?.toLowerCase().includes(q)   ||
        s.father_mobile?.includes(q)              ||
        s.email?.toLowerCase().includes(q)        ||
        s.class_name?.toLowerCase().includes(q)   ||
        s.branches?.name?.toLowerCase().includes(q)
      );
    }

    const opt = SORT_OPTIONS.find((o) => o.value === sortValue);
    if (opt?.key) {
      list.sort((a, b) => {
        // Numeric roll sort
        if (opt.key === "roll") {
          const aR = parseInt((a.roll_number ?? a.roll_no) || "0", 10);
          const bR = parseInt((b.roll_number ?? b.roll_no) || "0", 10);
          return opt.dir === "asc" ? aR - bR : bR - aR;
        }
        // Class sort — custom Bengali class order
        if (opt.key === "class_name") {
          const aO = getClassOrder(a.class_name);
          const bO = getClassOrder(b.class_name);
          if (aO !== bO) return opt.dir === "asc" ? aO - bO : bO - aO;
          // same order bucket → alphabetical
          return opt.dir === "asc"
            ? bnCollator.compare(a.class_name ?? "", b.class_name ?? "")
            : bnCollator.compare(b.class_name ?? "", a.class_name ?? "");
        }
        // Branch name
        const aVal = opt.key === "branch"
          ? (a.branches?.name ?? "")
          : String((a as any)[opt.key!] ?? "");
        const bVal = opt.key === "branch"
          ? (b.branches?.name ?? "")
          : String((b as any)[opt.key!] ?? "");

        // Use Bengali-aware collator for name / other text fields
        const cmp = bnCollator.compare(aVal, bVal);
        return opt.dir === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [data, searchTerm, sortValue]);

  // Reset page when params change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, sortValue, rowsPerPage]);

  const totalPages    = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // ── Select handlers ────────────────────────────────────────────────────────
  const toggleSelectAll = () =>
    setSelectedRows(
      selectedRows.size === paginatedData.length
        ? new Set()
        : new Set(paginatedData.map((s) => s.id))
    );

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedRows);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedRows(next);
  };

  // Smart pagination numbers
  const pageNumbers = useMemo((): (number | "…")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const nums: (number | "…")[] = [1];
    if (currentPage > 3) nums.push("…");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) nums.push(i);
    if (currentPage < totalPages - 2) nums.push("…");
    nums.push(totalPages);
    return nums;
  }, [totalPages, currentPage]);

  // ── CSV Export (blob download — no popup needed) ───────────────────────────
  const exportCSV = () => {
    const rows = selectedRows.size > 0 ? filteredData.filter((s) => selectedRows.has(s.id)) : filteredData;
    const hdrs = [
      "আইডি", "নাম", "শ্রেণি", "রোল", "বিভাগ", "শাখা", "যোগাযোগ",
      ...(extraColumns.guardianName   ? ["অভিভাবকের নাম"]    : []),
      ...(extraColumns.guardianMobile ? ["অভিভাবকের মোবাইল"] : []),
      ...(extraColumns.address        ? ["ঠিকানা"]            : []),
      "স্ট্যাটাস",
    ];
    const body = rows.map((s) => {
      const addr = [s.present_village, s.present_union, s.present_upazila, s.present_district].filter(Boolean).join(", ");
      return [
        s.student_id ?? "", s.name_bn ?? "", s.class_name ?? "",
        s.roll_number ?? s.roll_no ?? "", s.department ?? "",
        s.branches?.name ?? "", s.father_mobile ?? "",
        ...(extraColumns.guardianName   ? [s.guardian_name   ?? ""] : []),
        ...(extraColumns.guardianMobile ? [s.guardian_mobile ?? ""] : []),
        ...(extraColumns.address        ? [addr]                     : []),
        s.status ?? "",
      ];
    });
    const csv = [hdrs, ...body]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), {
      href: url,
      download: `students_${new Date().toISOString().slice(0, 10)}.csv`,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Print (opens print-ready window) ─────────────────────────────────────
  const printList = () => {
    const esc = (v: string) =>
      v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const resolveLogo = (url: string) => {
      if (!url) return "";
      if (/^(https?:|data:|blob:)/.test(url)) return url;
      if (url.startsWith("//")) return `${window.location.protocol}${url}`;
      return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
    };

    const logoUrl   = resolveLogo(printLongLogoUrl);
    const printData = selectedRows.size > 0 ? filteredData.filter((s) => selectedRows.has(s.id)) : filteredData;

    const hdrs = [
      "#", "ID", "নাম", "শ্রেণি", "রোল", "বিভাগ", "শাখা", "যোগাযোগ",
      ...(extraColumns.guardianName   ? ["অভিভাবকের নাম"]    : []),
      ...(extraColumns.guardianMobile ? ["অভিভাবকের মোবাইল"] : []),
      ...(extraColumns.address        ? ["ঠিকানা"]            : []),
      "স্ট্যাটাস",
    ];

    const bodyRows = printData.map((s, idx) => {
      const addr = [s.present_village, s.present_union, s.present_upazila, s.present_district].filter(Boolean).join(", ");
      return [
        String(idx + 1), s.student_id ?? "", s.name_bn ?? "",
        s.class_name ?? "", s.roll_number ?? s.roll_no ?? "",
        s.department ?? "", s.branches?.name ?? "", s.father_mobile ?? "",
        ...(extraColumns.guardianName   ? [s.guardian_name   ?? ""] : []),
        ...(extraColumns.guardianMobile ? [s.guardian_mobile ?? ""] : []),
        ...(extraColumns.address        ? [addr]                     : []),
        s.status === "active" ? "সক্রিয়" : "অপেক্ষমাণ",
      ];
    });

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>শিক্ষার্থী তালিকা</title>
<style>
  body{font-family:Arial,sans-serif;padding:16px;font-size:11px;color:#111}
  .hdr{text-align:center;border-bottom:2px solid #16a34a;padding-bottom:10px;margin-bottom:8px}
  .hdr img{max-width:380px;height:auto}
  .hdr h1{margin:4px 0 0;font-size:17px;color:#166534}
  .subtitle{text-align:center;font-size:12px;color:#4b5563;margin:4px 0 8px}
  .meta{text-align:right;font-size:10px;color:#9ca3af;margin-bottom:8px}
  table{width:100%;border-collapse:collapse}
  th{background:#f0fdf4;color:#166534;font-weight:600;border:1px solid #d1fae5;padding:5px 7px;text-align:left;font-size:10px}
  td{border:1px solid #e5e7eb;padding:4px 7px}
  tr:nth-child(even) td{background:#f9fafb}
  @media print{body{padding:6px}}
</style></head><body>
<div class="hdr">
  ${logoUrl ? `<img src="${esc(logoUrl)}" alt="logo"/>` : `<h1>${esc(printSchoolName)}</h1>`}
</div>
<div class="subtitle">শিক্ষার্থী তথ্য তালিকা &mdash; মোট: ${printData.length} জন</div>
<div class="meta">প্রিন্ট তারিখ: ${new Date().toLocaleDateString("bn-BD")}</div>
<table>
  <thead><tr>${hdrs.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
  <tbody>${bodyRows.map((r) => `<tr>${r.map((c) => `<td>${esc(String(c))}</td>`).join("")}</tr>`).join("")}</tbody>
</table></body></html>`;

    const win = window.open("", "_blank", "width=1100,height=780");
    if (!win) {
      alert("পপআপ ব্লক করা আছে। অনুগ্রহ করে এই সাইটের জন্য পপআপ অনুমতি দিন এবং আবার চেষ্টা করুন।");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();

    const imgs = Array.from(win.document.images);
    const doPrint = () => { win.focus(); win.print(); };
    if (!imgs.length) { setTimeout(doPrint, 350); return; }
    let n = 0;
    imgs.forEach((img) => {
      const done = () => { if (++n >= imgs.length) setTimeout(doPrint, 200); };
      img.complete ? done() : (img.onload = img.onerror = done);
    });
  };

  const handleBulkDelete = () => {
    if (confirm(`${selectedRows.size} জন শিক্ষার্থী স্থায়ীভাবে মুছে ফেলবেন?`)) {
      onBulkDelete([...selectedRows]);
      setSelectedRows(new Set());
    }
  };

  const extraCount    = Object.values(extraColumns).filter(Boolean).length;
  const colSpanTotal  = 9 + extraCount; // checkbox+id+name+class+dept+branch+contact+status+actions

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* Controls Row */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">

        {/* Search */}
        <div className="relative w-full lg:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="নাম, আইডি, মোবাইল, শ্রেণি..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Right side controls */}
        <div className="flex flex-wrap items-center gap-2 relative">

          {/* Sort */}
          <Select value={sortValue} onValueChange={setSortValue}>
            <SelectTrigger className="h-9 text-sm w-52 bg-white shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-gray-500 shrink-0" />
              <SelectValue placeholder="সর্ট করুন" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Rows per page */}
          <Select value={String(rowsPerPage)} onValueChange={(v) => setRowsPerPage(Number(v))}>
            <SelectTrigger className="h-9 text-sm w-28 bg-white shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROWS_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>{n} জন</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Extra Columns toggle */}
          <div className="relative">
            <Button
              size="sm"
              variant={extraCount > 0 ? "default" : "outline"}
              onClick={() => setShowExtraColumnOpts((p) => !p)}
              className="h-9 text-xs sm:text-sm gap-1.5"
            >
              <Columns3 className="w-4 h-4" />
              <span className="hidden sm:inline">কলাম</span>
              {extraCount > 0 && (
                <span className="bg-white/30 text-[10px] px-1 rounded font-bold">{extraCount}</span>
              )}
            </Button>
            {showExtraColumnOpts && (
              <div className="absolute top-11 right-0 z-40 w-52 rounded-xl border bg-white p-4 shadow-2xl space-y-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">অতিরিক্ত কলাম</p>
                {(
                  [
                    ["guardianName",   "অভিভাবকের নাম"],
                    ["guardianMobile", "অভিভাবকের মোবাইল"],
                    ["address",        "ঠিকানা"],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2.5 text-sm cursor-pointer hover:text-green-700 transition-colors">
                    <Checkbox
                      checked={extraColumns[k]}
                      onCheckedChange={(c) =>
                        setExtraColumns((prev) => ({ ...prev, [k]: c === true }))
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Bulk delete */}
          {selectedRows.size > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg text-red-600 animate-in fade-in">
              <span className="text-xs font-bold whitespace-nowrap">{selectedRows.size} নির্বাচিত</span>
              <Button size="sm" variant="destructive" className="h-7 text-xs px-2" onClick={handleBulkDelete}>
                <Trash2 className="w-3 h-3 mr-1" /> মুছুন
              </Button>
            </div>
          )}

          {/* Export CSV */}
          <Button size="sm" variant="outline" onClick={exportCSV} title="CSV ফাইল ডাউনলোড করুন" className="h-9 text-xs sm:text-sm gap-1.5">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">সেভ CSV</span>
          </Button>

          {/* Print */}
          <Button size="sm" variant="outline" onClick={printList} title="প্রিন্ট করুন" className="h-9 text-xs sm:text-sm gap-1.5">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">প্রিন্ট</span>
          </Button>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-0.5">
        <span>
          মোট <strong className="text-gray-800">{filteredData.length}</strong> জন শিক্ষার্থী
          {searchTerm && <span className="ml-1.5 text-green-600 font-medium">(অনুসন্ধান ফলাফল)</span>}
        </span>
        {totalPages > 1 && <span>পৃষ্ঠা <strong>{currentPage}</strong> / {totalPages}</span>}
      </div>

      {/* ── Desktop Table ─────────────────────────────────────────────────── */}
      <div className="hidden md:block w-full rounded-xl border border-gray-200 shadow-sm overflow-x-auto bg-white">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-200">
              <TableHead className="w-10 pl-4">
                <Checkbox
                  checked={paginatedData.length > 0 && selectedRows.size === paginatedData.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">আইডি</TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap min-w-[180px]">শিক্ষার্থী</TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">শ্রেণি ও রোল</TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">বিভাগ</TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">শাখা</TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">যোগাযোগ</TableHead>
              {extraColumns.guardianName   && <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">অভিভাবকের নাম</TableHead>}
              {extraColumns.guardianMobile && <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">অভিভাবকের মোবাইল</TableHead>}
              {extraColumns.address        && <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide min-w-[150px]">ঠিকানা</TableHead>}
              <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">স্ট্যাটাস</TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide text-right pr-4 whitespace-nowrap">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpanTotal} className="py-20 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <Search className="w-10 h-10 opacity-20" />
                    <p className="text-sm">কোনো শিক্ষার্থী পাওয়া যায়নি।</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((student) => {
                const bc = getBranchColor(student.branch_id);
                return (
                  <TableRow
                    key={student.id}
                    className={`border-b border-gray-100 transition-colors ${
                      selectedRows.has(student.id)
                        ? "bg-blue-50 hover:bg-blue-50"
                        : "hover:bg-gray-50/70"
                    }`}
                  >
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selectedRows.has(student.id)}
                        onCheckedChange={() => toggleSelectRow(student.id)}
                      />
                    </TableCell>

                    <TableCell className="font-mono text-xs text-gray-500 whitespace-nowrap"><CopyableId id={student.student_id} /></TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm shrink-0 bg-gray-50">
                          {student.photo_url
                            ? <img src={student.photo_url} alt={student.name_bn} className="h-full w-full object-cover" />
                            : <HijabAvatar />
                          }
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/students/${student.id}`}
                            className="font-semibold text-sm text-gray-800 hover:text-green-700 hover:underline leading-tight block whitespace-nowrap"
                          >
                            {student.name_bn}
                          </Link>
                          {student.email && <p className="text-[11px] text-gray-400 truncate">{student.email}</p>}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      <span className="inline-block bg-green-50 text-green-800 border border-green-200 px-2 py-0.5 rounded text-xs font-medium">
                        {student.class_name || "—"}
                      </span>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        রোল: {student.roll_number ?? student.roll_no ?? "—"}
                      </p>
                    </TableCell>

                    <TableCell className="text-sm text-gray-700 whitespace-nowrap">{student.department || "—"}</TableCell>

                    <TableCell>
                      {student.branches?.name ? (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${bc.bg} ${bc.text} ${bc.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${bc.dot}`} />
                          {student.branches.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>

                    <TableCell className="font-mono text-sm text-gray-700 whitespace-nowrap">
                      {student.father_mobile ? <a href={`tel:${student.father_mobile}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:underline">{toBengaliNumber(student.father_mobile)}</a> : "—"}
                    </TableCell>

                    {extraColumns.guardianName   && <TableCell className="text-sm text-gray-700 whitespace-nowrap">{student.guardian_name   || "—"}</TableCell>}
                    {extraColumns.guardianMobile && <TableCell className="font-mono text-sm text-gray-700 whitespace-nowrap">
                      {student.guardian_mobile ? <a href={`tel:${student.guardian_mobile}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:underline">{toBengaliNumber(student.guardian_mobile)}</a> : "—"}
                    </TableCell>}
                    {extraColumns.address && (
                      <TableCell className="text-xs text-gray-600 min-w-[150px]">
                        {[student.present_village, student.present_union, student.present_upazila, student.present_district]
                          .filter(Boolean).join(", ") || "—"}
                      </TableCell>
                    )}

                    <TableCell>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                          student.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {student.status === "active" ? "সক্রিয়" : "অপেক্ষমাণ"}
                      </span>
                    </TableCell>

                    <TableCell className="text-right pr-4">
                      <div className="flex justify-end gap-1.5 whitespace-nowrap">
                        <Link href={`/dashboard/students/${student.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                            <Eye className="w-3 h-3 mr-1" /> প্রোফাইল
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => onEdit(student)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => onDelete(student.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile Cards ─────────────────────────────────────────────────── */}
      <div className="md:hidden space-y-2">
        {paginatedData.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center text-gray-400 text-sm">
            কোনো শিক্ষার্থী পাওয়া যায়নি।
          </div>
        ) : (
          paginatedData.map((student) => {
            const bc = getBranchColor(student.branch_id);
            return (
              <div
                key={student.id}
                className={`bg-white rounded-xl border p-3 space-y-2 shadow-sm transition-shadow ${
                  selectedRows.has(student.id) ? "ring-2 ring-blue-300 bg-blue-50/40" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Checkbox
                      checked={selectedRows.has(student.id)}
                      onCheckedChange={() => toggleSelectRow(student.id)}
                    />
                    <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-50 shrink-0">
                      {student.photo_url
                        ? <img src={student.photo_url} alt="" className="h-full w-full object-cover" />
                        : <HijabAvatar />
                      }
                    </div>
                    <div className="min-w-0">
                      <Link href={`/dashboard/students/${student.id}`} className="font-semibold text-sm text-gray-800 block truncate hover:text-green-700">
                        {student.name_bn || "—"}
                      </Link>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1">ID: {student.student_id ? <CopyableId id={student.student_id} /> : "—"}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 whitespace-nowrap ${
                    student.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {student.status === "active" ? "সক্রিয়" : "অপেক্ষমাণ"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-gray-600">
                  <p><span className="font-medium text-gray-700">শ্রেণি:</span> {student.class_name || "—"}</p>
                  <p><span className="font-medium text-gray-700">রোল:</span> {student.roll_number ?? student.roll_no ?? "—"}</p>
                  <p><span className="font-medium text-gray-700">বিভাগ:</span> {student.department || "—"}</p>
                  <p className="flex items-center gap-1 flex-wrap">
                    <span className="font-medium text-gray-700">শাখা:</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${bc.bg} ${bc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${bc.dot}`} />
                      {student.branches?.name || "—"}
                    </span>
                  </p>
                  <p className="col-span-2"><span className="font-medium text-gray-700">যোগাযোগ:</span> {student.father_mobile ? <a href={`tel:${student.father_mobile}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:underline font-mono">{toBengaliNumber(student.father_mobile)}</a> : "—"}</p>
                  {extraColumns.guardianName   && <p className="col-span-2"><span className="font-medium text-gray-700">অভিভাবক:</span> {student.guardian_name   || "—"}</p>}
                  {extraColumns.guardianMobile && <p className="col-span-2"><span className="font-medium text-gray-700">অভিভাবকের মোবাইল:</span> {student.guardian_mobile ? <a href={`tel:${student.guardian_mobile}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:underline font-mono">{toBengaliNumber(student.guardian_mobile)}</a> : "—"}</p>}
                  {extraColumns.address        && <p className="col-span-2"><span className="font-medium text-gray-700">ঠিকানা:</span> {[student.present_village, student.present_union, student.present_upazila, student.present_district].filter(Boolean).join(", ") || "—"}</p>}
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-gray-100">
                  <Link href={`/dashboard/students/${student.id}`}>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] bg-green-50 text-green-700 border-green-200">
                      <Eye className="w-3 h-3 mr-1" /> প্রোফাইল
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-50" onClick={() => onEdit(student)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => onDelete(student.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <p className="text-xs text-gray-500">
            দেখানো হচ্ছে{" "}
            <strong className="text-gray-800">{Math.min((currentPage - 1) * rowsPerPage + 1, filteredData.length)}</strong>
            {" – "}
            <strong className="text-gray-800">{Math.min(currentPage * rowsPerPage, filteredData.length)}</strong>
            {", "}মোট <strong className="text-gray-800">{filteredData.length}</strong> জন
          </p>
          <div className="flex items-center gap-1">
            {/* First page */}
            <Button
              variant="outline" size="sm" className="h-8 px-2 text-xs hidden sm:flex"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              title="প্রথম পৃষ্ঠা"
            >
              «
            </Button>
            {/* Prev */}
            <Button
              variant="outline" size="sm" className="h-8 w-8 p-0"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {pageNumbers.map((p, i) =>
                p === "…" ? (
                  <span key={`d-${i}`} className="w-8 text-center text-gray-400 text-sm select-none">…</span>
                ) : (
                  <Button
                    key={p}
                    size="sm"
                    variant={currentPage === p ? "default" : "outline"}
                    className={`h-8 w-8 p-0 text-xs ${currentPage === p ? "bg-green-600 border-green-600 hover:bg-green-700" : ""}`}
                    onClick={() => setCurrentPage(p as number)}
                  >
                    {p}
                  </Button>
                )
              )}
            </div>
            {/* Next */}
            <Button
              variant="outline" size="sm" className="h-8 w-8 p-0"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            {/* Last page */}
            <Button
              variant="outline" size="sm" className="h-8 px-2 text-xs hidden sm:flex"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="শেষ পৃষ্ঠা"
            >
              »
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

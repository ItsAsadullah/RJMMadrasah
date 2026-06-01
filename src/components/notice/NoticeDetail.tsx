"use client";

import { useRef } from "react";
import Image from "next/image";
import { 
  Download, 
  Printer, 
  Link as LinkIcon, 
  Calendar, 
  ArrowLeft,
  Share2,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type Notice = {
  id: string;
  title: string;
  content: string;
  file_url: string;
  google_drive_link: string;
  created_at: string;
};

const toBengaliNumber = (num: string | number) => {
  if (num === null || num === undefined) return "";
  const strNum = String(num);
  const english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const bengali = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let result = '';
  for (let i = 0; i < strNum.length; i++) {
    const char = strNum[i];
    const index = english.indexOf(char);
    result += index !== -1 ? bengali[index] : char;
  }
  return result;
};

export default function NoticeDetail({ notice, onBack, branchName }: { notice: Notice; onBack: () => void; branchName?: string }) {
  const printRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(notice.created_at).toLocaleDateString('bn-BD', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const shortDate = new Date(notice.created_at).toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    const plainContent = notice.content.replace(/<[^>]+>/g, '').slice(0, 200) + (notice.content.length > 200 ? '...' : '');
    const message = `📢 *${notice.title}*\n\n${plainContent}\n\n📎 বিস্তারিত: ${window.location.href}\n\n(রহিমা জান্নাত মহিলা মাদ্রাসা)`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <>
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4;
            margin: 12mm 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          #notice-print-area,
          #notice-print-area * {
            visibility: visible !important;
          }
          #notice-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .watermark-notice {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Action Bar — won't print */}
        <div className="no-print flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <Button 
            onClick={onBack} 
            variant="ghost" 
            className="text-gray-600 hover:text-green-700 hover:bg-green-50 gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> সকল নোটিশ
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              onClick={handlePrint} 
              variant="outline" 
              className="gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            >
              <Printer className="w-4 h-4" /> প্রিন্ট
            </Button>
            <Button 
              onClick={handlePrint} 
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Download className="w-4 h-4" /> PDF ডাউনলোড
            </Button>
            <Button 
              onClick={handleWhatsAppShare} 
              variant="outline" 
              className="gap-2 text-green-700 border-green-200 hover:bg-green-50"
            >
              <Share2 className="w-4 h-4" /> শেয়ার
            </Button>
            <Button 
              onClick={handleCopyLink} 
              variant="ghost" 
              size="icon"
              className="text-gray-500 hover:text-emerald-600"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* ===== PRINTABLE NOTICE AREA ===== */}
        <div 
          id="notice-print-area" 
          ref={printRef} 
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden print:shadow-none print:border-0 print:rounded-none"
        >
          {/* Main Content with Watermark */}
          <div className="relative p-6 sm:p-10 md:p-14">
            
            {/* Watermark Background */}
            <div className="watermark-notice absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.06]">
              <div className="relative w-[350px] h-[350px] sm:w-[450px] sm:h-[450px]">
                <Image 
                  src="/images/logo.png" 
                  alt="" 
                  fill 
                  className="object-contain grayscale" 
                  priority
                />
              </div>
            </div>

            {/* Content Layer */}
            <div className="relative z-10">

              {/* ====== MADRASA LETTERHEAD / PAD ====== */}
              <div className="text-center mb-8 pb-6 border-b-2 border-emerald-600">
                {/* বিসমিল্লাহ */}
                <div className="relative h-8 sm:h-10 mb-3">
                  <Image 
                    src="/images/bismillah.svg" 
                    alt="বিসমিল্লাহ" 
                    fill 
                    className="object-contain" 
                    priority 
                  />
                </div>

                {/* মাদ্রাসা লোগো */}
                <div className="relative h-14 sm:h-20 mb-3">
                  <Image 
                    src="/images/long_logo.svg" 
                    alt="রহিমা জান্নাত মহিলা মাদ্রাসা" 
                    fill 
                    className="object-contain" 
                    priority 
                  />
                </div>

                {/* ঠিকানা ও যোগাযোগ */}
                <p className="text-sm sm:text-base text-gray-600 font-medium">
                  হলিধানী বাজার, ঝিনাইদহ সদর, ঝিনাইদহ
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  ওয়েবসাইট: rjmm.edu.bd
                </p>

                {/* "বিজ্ঞপ্তি" ব্যাজ */}
                <div className="mt-4 inline-block">
                  <span className="inline-block bg-emerald-700 text-white px-8 sm:px-12 py-2 sm:py-2.5 rounded-full text-lg sm:text-xl font-bold tracking-widest shadow-md">
                    বিজ্ঞপ্তি
                  </span>
                </div>
              </div>

              {/* ====== NOTICE META ====== */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 text-sm text-gray-600 bg-emerald-50/50 p-3 sm:p-4 rounded-xl border border-emerald-100">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600 no-print" />
                    <span className="font-semibold text-gray-700">তারিখ:</span>
                    <span>{shortDate}</span>
                  </div>
                  {branchName && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-emerald-200 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-xs font-semibold text-emerald-800">{branchName}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">নোটিশ নং:</span>
                  <span className="bg-white px-3 py-0.5 rounded-full border border-emerald-200 text-emerald-800 font-bold text-xs">
                    #{toBengaliNumber(String(notice.id).slice(-6).toUpperCase())}
                  </span>
                </div>
              </div>

              {/* ====== NOTICE TITLE ====== */}
              <div className="mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
                  বিষয়: {notice.title}
                </h1>
                <div className="w-20 h-1 bg-emerald-500 rounded-full mt-3"></div>
              </div>

              {/* ====== NOTICE BODY CONTENT ====== */}
              <div 
                className="prose prose-sm sm:prose-base md:prose-lg max-w-none text-gray-700 leading-relaxed mb-10
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3
                  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3
                  [&_li]:mb-1 [&_li]:pl-1
                  [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-4 [&_h1]:text-gray-900
                  [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3 [&_h2]:text-gray-800
                  [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2 [&_h3]:text-gray-800
                  [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:bg-emerald-50/50 [&_blockquote]:py-2 [&_blockquote]:rounded-r-lg
                  [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline
                  [&_p]:mb-3 [&_p]:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: notice.content || "<p>কোনো বিবরণ নেই</p>" }}
              />

              {/* ====== ATTACHMENTS (visible in print too) ====== */}
              {(notice.file_url || notice.google_drive_link) && (
                <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200 mb-10">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Download className="w-4 h-4 no-print" /> সংযুক্ত ফাইল ও লিংক:
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {notice.file_url && (
                      <a 
                        href={notice.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white text-emerald-700 px-4 py-2.5 rounded-lg border border-emerald-200 hover:bg-emerald-50 hover:shadow-sm transition-all text-sm font-medium no-print"
                      >
                        <Download className="w-4 h-4" /> ফাইল ডাউনলোড করুন
                      </a>
                    )}
                    {notice.google_drive_link && (
                      <a 
                        href={notice.google_drive_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white text-blue-700 px-4 py-2.5 rounded-lg border border-blue-200 hover:bg-blue-50 hover:shadow-sm transition-all text-sm font-medium no-print"
                      >
                        <LinkIcon className="w-4 h-4" /> গুগল ড্রাইভ লিংক
                      </a>
                    )}
                  </div>
                  {/* Print-only link text */}
                  <div className="hidden print-only text-xs text-gray-500 mt-2 space-y-1">
                    {notice.file_url && <p>📎 ফাইল: {notice.file_url}</p>}
                    {notice.google_drive_link && <p>🔗 গুগল ড্রাইভ: {notice.google_drive_link}</p>}
                  </div>
                </div>
              )}

              {/* ====== SIGNATURE SECTION ====== */}
              <div className="flex flex-col sm:flex-row justify-between items-end mt-12 pt-8 border-t border-dashed border-gray-300">
                <div className="text-center order-2 sm:order-1 mt-6 sm:mt-0">
                  <div className="w-40 border-t-2 border-gray-400 mb-2"></div>
                  <p className="font-semibold text-sm text-gray-700">দায়িত্বপ্রাপ্ত শিক্ষক</p>
                </div>
                <div className="text-center order-1 sm:order-2">
                  <div className="w-40 border-t-2 border-gray-400 mb-2"></div>
                  <p className="font-bold text-sm text-gray-800">অধ্যক্ষ / পরিচালক</p>
                  <p className="text-xs text-gray-500 mt-0.5">রহিমা জান্নাত মহিলা মাদ্রাসা</p>
                </div>
              </div>

              {/* ====== FOOTER LINE ====== */}
              <div className="mt-10 pt-4 border-t-2 border-emerald-600 text-center">
                <p className="text-xs text-gray-400">
                  এই বিজ্ঞপ্তি রহিমা জান্নাত মহিলা মাদ্রাসা কর্তৃপক্ষ কর্তৃক প্রকাশিত। 
                  প্রকাশের তারিখ: {formattedDate}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Action Bar — no-print */}
        <div className="no-print flex flex-wrap items-center justify-center gap-3 pb-10">
          <Button 
            onClick={handlePrint} 
            size="lg"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
          >
            <Download className="w-5 h-5" /> PDF ডাউনলোড করুন
          </Button>
          <Button 
            onClick={handlePrint} 
            size="lg"
            variant="outline"
            className="gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          >
            <Printer className="w-5 h-5" /> সরাসরি প্রিন্ট করুন
          </Button>
        </div>
      </div>
    </>
  );
}

import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* পাবলিক ন্যাভবার */}
      <Navbar />
      
      {/* মেইন কন্টেন্ট: এখানে কন্টেইনার দেওয়া হয়নি যাতে ব্যানার পুরো স্ক্রিন নিতে পারে */}
      <main className="flex-grow">
        {children}
      </main>
      
      {/* ফুটার */}
      <Footer />
    </div>
  );
}
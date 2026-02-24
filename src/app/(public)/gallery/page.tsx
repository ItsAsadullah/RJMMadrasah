"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Image as ImageIcon, PlayCircle, X, ExternalLink, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type GalleryItem = {
  id: string;
  title: string;
  type: "image" | "video";
  url: string;
  thumbnail_url?: string;
  category: string;
  created_at: string;
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  const fetchGalleryItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching gallery items:", error);
    } else {
      setItems(data as GalleryItem[] || []);
    }
    setLoading(false);
  };

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  // Helper to extract Drive ID and construct direct image URL
  const getGoogleDriveImageUrl = (url: string) => {
    // Regex to match Drive File ID
    const driveRegex = /drive\.google\.com\/file\/d\/([-_\w]+)/;
    const match = url.match(driveRegex);
    if (match && match[1]) {
      // Use the thumbnail API which is reliable for previews
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1920`;
    }
    
    // Support for photos.google.com direct link if possible (rarely works directly without API, but keeping structure)
    // For now, return null for Photos to fallback to default placeholder
    return null;
  };

  const handleItemClick = (item: GalleryItem) => {
    // Check if it's a Drive folder or Photos album (still external)
    // But if it's a Drive FILE, we can preview it
    if (isExternalLink(item.url) && !getGoogleDriveImageUrl(item.url)) {
      window.open(item.url, '_blank');
    } else {
      setSelectedItem(item);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-[Kalpurush]">
      {/* Hero Section */}
      <section className="relative bg-green-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-gray-200"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-green-800/80 to-green-900/90"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            ফটো ও ভিডিও গ্যালারি
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-green-100 max-w-2xl mx-auto"
          >
            আমাদের মাদ্রাসার বিভিন্ন কার্যক্রম, অনুষ্ঠান এবং বিশেষ মুহূর্তের ছবি ও ভিডিও চিত্র
          </motion.p>
        </div>
      </section>

      {/* Gallery Content */}
      <section className="py-12 container mx-auto px-4">
        {/* Filters */}
        <div className="flex justify-center mb-10">
          <Tabs defaultValue="all" className="w-full max-w-md" onValueChange={setFilter}>
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm border p-1 rounded-full h-auto">
              <TabsTrigger value="all" className="rounded-full py-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                সব দেখুন
              </TabsTrigger>
              <TabsTrigger value="image" className="rounded-full py-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                <ImageIcon className="w-4 h-4 mr-2" /> ছবি
              </TabsTrigger>
              <TabsTrigger value="video" className="rounded-full py-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                <PlayCircle className="w-4 h-4 mr-2" /> ভিডিও
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-xl">কোনো গ্যালারি আইটেম পাওয়া যায়নি</p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {filteredItems.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  key={item.id}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-all cursor-pointer relative"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="relative aspect-video bg-gray-100 overflow-hidden">
                    {/* Render Content Based on Type */}
                    {item.type === "image" ? (
                       // Image Logic
                       item.thumbnail_url || (item.url && (!isExternalLink(item.url) || getGoogleDriveImageUrl(item.url))) ? (
                          <Image
                            src={item.thumbnail_url || getGoogleDriveImageUrl(item.url) || item.url}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                       ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                              <ImageIcon className="w-12 h-12 mb-2 text-green-200" />
                              <span className="text-xs text-gray-400">প্রিভিউ নেই</span>
                          </div>
                       )
                    ) : (
                      // Video Logic
                      <div className="w-full h-full flex items-center justify-center relative bg-black">
                         {item.thumbnail_url ? (
                             <Image
                                src={item.thumbnail_url}
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
                             />
                         ) : (item.url.includes("youtube") || item.url.includes("youtu.be")) ? (
                            <img 
                                src={`https://img.youtube.com/vi/${getYouTubeId(item.url)}/hqdefault.jpg`} 
                                alt={item.title} 
                                className="absolute inset-0 w-full h-full object-cover opacity-70"
                            />
                         ) : (
                             <div className="absolute inset-0 bg-gray-800 flex flex-col items-center justify-center">
                                 <PlayCircle className="w-12 h-12 text-white/50 mb-2" />
                                 <span className="text-xs text-white/50">ভিডিও প্রিভিউ নেই</span>
                             </div>
                         )}
                        
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10"></div>
                        <PlayCircle className="w-12 h-12 text-white opacity-90 group-hover:scale-110 transition-transform z-20" />
                      </div>
                    )}

                    {/* Overlay Title */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-20">
                      <p className="text-white font-medium truncate flex items-center gap-2">
                         {item.title}
                         {isExternalLink(item.url) && !getGoogleDriveImageUrl(item.url) && <ExternalLink className="w-3 h-3 text-gray-300" />}
                      </p>
                    </div>

                    {/* External Link Badge */}
                    {isExternalLink(item.url) && !getGoogleDriveImageUrl(item.url) && (
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full z-20 flex items-center gap-1 backdrop-blur-sm">
                            <LinkIcon className="w-3 h-3" /> লিংক
                        </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* Lightbox / Modal */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-[900px] p-0 bg-black overflow-hidden border-none text-white">
          <VisuallyHidden>
            <DialogTitle>গ্যালারি প্রিভিউ</DialogTitle>
            <DialogDescription>
                {selectedItem?.title || "গ্যালারি আইটেম প্রিভিউ"}
            </DialogDescription>
          </VisuallyHidden>
          
          <div className="relative w-full h-full flex flex-col">
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {selectedItem?.type === "image" ? (
                 <div className="relative w-full h-full">
                    <Image
                        src={selectedItem.thumbnail_url || getGoogleDriveImageUrl(selectedItem.url) || selectedItem.url}
                        alt={selectedItem.title}
                        fill
                        className="object-contain"
                    />
                 </div>
              ) : (
                selectedItem && (
                    <iframe
                        src={getEmbedUrl(selectedItem.url)}
                        title={selectedItem.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                )
              )}
            </div>
            <div className="p-4 bg-gray-900 flex justify-between items-center">
              <h3 className="text-lg font-medium">{selectedItem?.title}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)} className="text-white hover:bg-gray-800">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper to check if URL is external link (Drive/Photos)
function isExternalLink(url: string) {
    return url.includes("drive.google.com") || url.includes("photos.google.com") || url.includes("goo.gl") || url.includes("photos.app.goo.gl");
}

// Helper to extract YouTube ID
function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper to get Embed URL
function getEmbedUrl(url: string) {
  const videoId = getYouTubeId(url);
  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  }
  return url; // Fallback or direct video link
}

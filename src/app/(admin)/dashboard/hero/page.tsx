"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { HeroContent } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Upload, Loader2, Edit2 } from "lucide-react";

export default function HeroManagementPage() {
  const [items, setItems] = useState<HeroContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    section: 'main_slider' | 'promo_banner' | 'video';
    content_url: string;
    title: string;
    subtitle: string;
    link: string;
  }>({
    section: 'main_slider',
    content_url: '',
    title: '',
    subtitle: '',
    link: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('hero_content')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching hero content:', error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const CLOUD_NAME = "dfo1slmdy";
  const UPLOAD_PRESET = "rahima_preset";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);

    const file = e.target.files[0];
    const cloudinaryForm = new FormData();
    cloudinaryForm.append("file", file);
    cloudinaryForm.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: cloudinaryForm }
      );
      const data = await res.json();
      if (data.secure_url) {
        setFormData({ ...formData, content_url: data.secure_url });
      } else {
        alert("আপলোড ব্যর্থ: " + (data.error?.message || "অজানা ত্রুটি"));
      }
    } catch {
      alert("ইন্টারনেট সংযোগ চেক করুন!");
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content_url) {
      alert("Please provide content URL or upload an image/video thumbnail");
      return;
    }

    const payload = {
        section: formData.section,
        content_url: formData.content_url,
        title: formData.title,
        subtitle: formData.subtitle,
        link: formData.link,
        is_active: true
    };

    let error;

    if (editingId) {
        const { error: updateError } = await supabase
            .from('hero_content')
            .update(payload)
            .eq('id', editingId);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('hero_content')
            .insert([payload]);
        error = insertError;
    }

    if (error) {
      alert("Error saving: " + error.message);
    } else {
      fetchItems();
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData(prev => ({
        ...prev,
        content_url: '',
        title: '',
        subtitle: '',
        link: ''
    }));
    setEditingId(null);
  };

  const handleEdit = (item: HeroContent) => {
    setFormData({
        section: item.section,
        content_url: item.content_url,
        title: item.title || '',
        subtitle: item.subtitle || '',
        link: item.link || ''
    });
    setEditingId(item.id);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { error } = await supabase.from('hero_content').delete().eq('id', id);
    if (error) {
      alert("Error deleting: " + error.message);
    } else {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const renderForm = (section: 'main_slider' | 'promo_banner' | 'video') => (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8 p-4 border rounded-lg bg-gray-50">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">{editingId ? 'Edit Item' : `Add New ${section === 'main_slider' ? 'Slider Image' : section === 'promo_banner' ? 'Promo Banner' : 'Video'}`}</h3>
        {editingId && (
            <Button variant="outline" size="sm" onClick={resetForm}>Cancel Edit</Button>
        )}
      </div>
      
      {section !== 'video' && (
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="picture">Image Upload</Label>
          <div className="flex gap-2">
            <Input id="picture" type="file" onChange={handleFileUpload} disabled={uploading} />
            {uploading && <Loader2 className="animate-spin" />}
          </div>
        </div>
      )}

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="url">{section === 'video' ? 'Video Embed URL (YouTube)' : 'Image URL'}</Label>
        <Input 
          id="url" 
          value={formData.content_url} 
          onChange={(e) => setFormData({...formData, content_url: e.target.value})} 
          placeholder={section === 'video' ? 'https://www.youtube.com/embed/...' : 'https://...'}
          required 
        />
      </div>

      {(section === 'main_slider' || section === 'video') && (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input 
            id="title" 
            value={formData.title} 
            onChange={(e) => setFormData({...formData, title: e.target.value})} 
            placeholder="Enter title"
          />
        </div>
      )}

      {section === 'main_slider' && (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="subtitle">Subtitle (Green Color)</Label>
          <Input 
            id="subtitle" 
            value={formData.subtitle} 
            onChange={(e) => setFormData({...formData, subtitle: e.target.value})} 
            placeholder="Enter subtitle"
          />
        </div>
      )}

      {section === 'main_slider' && (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="desc">Description</Label>
          <Input 
            id="desc" 
            value={formData.link} 
            onChange={(e) => setFormData({...formData, link: e.target.value})} 
            placeholder="Enter short description"
          />
        </div>
      )}

      {section === 'promo_banner' && (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="link">Target Link (Optional)</Label>
          <Input 
            id="link" 
            value={formData.link} 
            onChange={(e) => setFormData({...formData, link: e.target.value})} 
            placeholder="/admission"
          />
        </div>
      )}

      <Button type="submit" disabled={uploading} className={editingId ? "bg-orange-500 hover:bg-orange-600" : ""}>
        {editingId ? <Edit2 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />} 
        {editingId ? "Update Item" : "Add Item"}
      </Button>
    </form>
  );

  const renderList = (section: string) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.filter(item => item.section === section).map(item => (
        <Card key={item.id} className="overflow-hidden">
          <div className="aspect-video relative bg-gray-100">
            {section === 'video' ? (
              <iframe 
                src={item.content_url} 
                className="w-full h-full" 
                allowFullScreen 
              />
            ) : (
              <img 
                src={item.content_url} 
                alt={item.title || 'Hero content'} 
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <CardContent className="p-4">
            {item.title && <h4 className="font-bold truncate">{item.title}</h4>}
            {item.subtitle && <p className="text-sm text-gray-500 truncate">{item.subtitle}</p>}
            <div className="flex gap-2 mt-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => handleEdit(item)}
                >
                    <Edit2 className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button 
                    variant="destructive" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleDelete(item.id)}
                >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {items.filter(item => item.section === section).length === 0 && (
        <p className="text-gray-500 col-span-full text-center py-8">No items found.</p>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Hero Section Management</h1>
      
      <Tabs defaultValue="main_slider" onValueChange={(v) => setFormData({...formData, section: v as any})}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="main_slider">Main Slider</TabsTrigger>
          <TabsTrigger value="promo_banner">Promo Banners</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
        </TabsList>

        <TabsContent value="main_slider">
          {renderForm('main_slider')}
          {renderList('main_slider')}
        </TabsContent>

        <TabsContent value="promo_banner">
          {renderForm('promo_banner')}
          {renderList('promo_banner')}
        </TabsContent>

        <TabsContent value="video">
          {renderForm('video')}
          {renderList('video')}
        </TabsContent>
      </Tabs>
    </div>
  );
}

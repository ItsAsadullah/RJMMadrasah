export interface HeroContent {
  id: string;
  section: 'main_slider' | 'promo_banner' | 'video';
  content_url: string;
  title?: string;
  subtitle?: string;
  link?: string;
  is_active: boolean;
  created_at: string;
}

// ── Chairman Profile Types ────────────────────────────────────

export interface ChairmanProfile {
  id: string;
  name_bn: string | null;
  name_en: string | null;
  designation_bn: string | null;
  designation_en: string | null;
  honorific_bn: string | null;
  honorific_en: string | null;
  introduction_bn: string | null;
  introduction_en: string | null;
  biography_bn: string | null;
  biography_en: string | null;
  message_bn: string | null;
  message_en: string | null;
  phone_primary: string | null;
  phone_secondary: string | null;
  whatsapp: string | null;
  email: string | null;
  office_address_bn: string | null;
  office_address_en: string | null;
  postal_address: string | null;
  google_maps_link: string | null;
  office_hours: string | null;
  photo_url: string | null;
  cover_url: string | null;
  signature_url: string | null;
  social_links: Record<string, string>;
  status: 'draft' | 'published' | 'unpublished';
  seo_title: string | null;
  seo_description: string | null;
  seo_image_url: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface ChairmanEducation {
  id: string;
  profile_id: string;
  degree_bn: string | null;
  degree_en: string | null;
  institution_bn: string | null;
  institution_en: string | null;
  subject_bn: string | null;
  subject_en: string | null;
  passing_year: string | null;
  description_bn: string | null;
  description_en: string | null;
  sort_order: number;
  created_at: string;
}

export interface ChairmanExperience {
  id: string;
  profile_id: string;
  position_bn: string | null;
  position_en: string | null;
  organization_bn: string | null;
  organization_en: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  responsibilities_bn: string | null;
  responsibilities_en: string | null;
  experience_type: 'career' | 'institutional';
  sort_order: number;
  created_at: string;
}

export interface ChairmanAchievement {
  id: string;
  profile_id: string;
  title_bn: string | null;
  title_en: string | null;
  description_bn: string | null;
  description_en: string | null;
  year: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface ChairmanDocument {
  id: string;
  profile_id: string;
  title_bn: string | null;
  title_en: string | null;
  file_url: string;
  file_type: string | null;
  is_public: boolean;
  sort_order: number;
  created_at: string;
}

export interface ChairmanFullProfile {
  profile: ChairmanProfile;
  education: ChairmanEducation[];
  experiences: ChairmanExperience[];
  achievements: ChairmanAchievement[];
  documents: ChairmanDocument[];
}

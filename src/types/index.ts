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

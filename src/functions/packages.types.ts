export type PublicPackage = {
  id: string;
  category: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  tagline: string | null;
  description: string | null;
  icon_name: string;
  features: any;
  best_for: string | null;
  is_popular: boolean;
  is_premium: boolean;
  is_visible: boolean;
  order_index: number;
  cta_text: string;
  cta_link: string;
};

-- Ensure timestamp trigger function exists
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'social_media',
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  tagline TEXT,
  description TEXT,
  icon_name TEXT NOT NULL DEFAULT 'Sparkles',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  best_for TEXT,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  cta_text TEXT NOT NULL DEFAULT 'Get Started',
  cta_link TEXT NOT NULL DEFAULT '/contact',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_packages_category ON public.packages(category);
CREATE INDEX idx_packages_visible_order ON public.packages(is_visible, order_index);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible packages are public"
ON public.packages FOR SELECT
USING (is_visible = true);

CREATE POLICY "Admins read all packages"
ON public.packages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert packages"
ON public.packages FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update packages"
ON public.packages FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete packages"
ON public.packages FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.packages;
ALTER TABLE public.packages REPLICA IDENTITY FULL;

INSERT INTO public.packages (category, name, slug, price_monthly, price_yearly, tagline, icon_name, best_for, is_popular, is_premium, order_index, cta_text, features) VALUES
('social_media', 'Starter Growth', 'starter-growth', 297, 2846,
 'Perfect for local businesses and startups wanting a professional presence',
 'Sprout',
 'Restaurants, Local Shops, Startups, Personal Brands, Barbershops, Salons',
 false, false, 1, 'Get Started',
 '[
   {"text":"15 Custom-Made Premium Image Posts","type":"feature"},
   {"text":"1 Social Media Platform Management","type":"feature"},
   {"text":"Professional Branded Post Design","type":"feature"},
   {"text":"Caption Writing Included","type":"feature"},
   {"text":"Basic Hashtag Research","type":"feature"},
   {"text":"Content Calendar Planning","type":"feature"},
   {"text":"HD Quality Creative Designs","type":"feature"},
   {"text":"Monthly Strategy Discussion","type":"feature"},
   {"text":"Basic Audience Engagement","type":"feature"},
   {"text":"Page Optimization Suggestions","type":"feature"},
   {"text":"Story Post Support (Up to 4 Stories)","type":"feature"},
   {"text":"Organic Reach Optimization","type":"feature"},
   {"text":"Competitor Monitoring","type":"feature"},
   {"text":"Basic Brand Consistency Setup","type":"feature"},
   {"text":"Basic CTA Optimization","type":"feature"},
   {"text":"Mobile-Friendly Visual Design","type":"feature"},
   {"text":"Monthly Performance Report","type":"feature"},
   {"text":"3 Business Days Delivery Time","type":"feature"},
   {"text":"Email Support","type":"feature"}
 ]'::jsonb),

('social_media', 'Business Growth', 'business-growth', 597, 5726,
 'For businesses serious about consistent growth and stronger engagement',
 'Rocket',
 'Ecommerce, Gyms, Fashion Brands, Service Businesses',
 true, false, 2, 'Most Popular — Get Started',
 '[
   {"text":"Facebook + Instagram Management","type":"feature"},
   {"text":"30 Custom-Made Image Posts","type":"feature"},
   {"text":"10 High-Engaging Text Posts","type":"feature"},
   {"text":"Professional Copywriting","type":"feature"},
   {"text":"High CTR Caption Writing","type":"feature"},
   {"text":"Content Strategy Planning","type":"feature"},
   {"text":"Viral Style Content Research","type":"feature"},
   {"text":"Story Designs Included","type":"feature"},
   {"text":"Basic Reel Content Ideas","type":"feature"},
   {"text":"Fast Support Response","type":"feature"},
   {"text":"Monthly Competitor Analysis","type":"feature"},
   {"text":"CTA Optimization","type":"feature"},
   {"text":"Engagement Optimization","type":"feature"},
   {"text":"Page Branding Improvements","type":"feature"},
   {"text":"Organic Growth Strategy","type":"feature"},
   {"text":"Scheduled Posting","type":"feature"},
   {"text":"Audience Behavior Analysis","type":"feature"},
   {"text":"Custom Branded Templates","type":"feature"},
   {"text":"Priority Support","type":"feature"},
   {"text":"Monthly Growth Report","type":"feature"},
   {"text":"Basic Ad Strategy Suggestions","type":"feature"},
   {"text":"Basic Funnel Suggestions","type":"feature"},
   {"text":"Profile Optimization","type":"feature"},
   {"text":"Comment Monitoring","type":"feature"},
   {"text":"Free Audit Every Month","type":"bonus"},
   {"text":"Trending Content Suggestions","type":"bonus"}
 ]'::jsonb),

('social_media', 'Full Management', 'full-management', 857, 8213,
 'Aggressive growth, premium management, and ad scaling support',
 'Shield',
 'Established Brands, Agencies, Online Stores, Coaches',
 false, false, 3, 'Get Started',
 '[
   {"text":"Multiple Platform Management","type":"feature"},
   {"text":"30 Custom-Made Image Posts","type":"feature"},
   {"text":"30 High-Engaging Text Posts","type":"feature"},
   {"text":"One Dedicated Account Manager","type":"feature"},
   {"text":"Run Up To 3 Meta Ads Campaigns","type":"feature"},
   {"text":"Manage Up To $2500 Ad Spend","type":"feature"},
   {"text":"Slack Support","type":"feature"},
   {"text":"Priority Fast Response","type":"feature"},
   {"text":"Advanced Audience Targeting","type":"feature"},
   {"text":"Conversion Focused Strategy","type":"feature"},
   {"text":"Advanced Content Planning","type":"feature"},
   {"text":"Viral Hook Optimization","type":"feature"},
   {"text":"Story + Feed Strategy","type":"feature"},
   {"text":"Brand Voice Development","type":"feature"},
   {"text":"Weekly Content Planning","type":"feature"},
   {"text":"Advanced Competitor Research","type":"feature"},
   {"text":"Monthly Creative Refresh","type":"feature"},
   {"text":"High-Engagement CTA Strategy","type":"feature"},
   {"text":"Community Management","type":"feature"},
   {"text":"Organic Growth Optimization","type":"feature"},
   {"text":"Retargeting Strategy Suggestions","type":"feature"},
   {"text":"Lead Generation Suggestions","type":"feature"},
   {"text":"Monthly Analytics Breakdown","type":"feature"},
   {"text":"Ad Performance Optimization","type":"feature"},
   {"text":"Creative Split Testing Suggestions","type":"feature"},
   {"text":"Landing Page Suggestions","type":"feature"},
   {"text":"Monthly Strategy Call","type":"feature"},
   {"text":"Trend Monitoring","type":"feature"},
   {"text":"AI Assisted Content Research","type":"feature"},
   {"text":"Premium Design Quality","type":"feature"},
   {"text":"Emergency Post Support","type":"bonus"},
   {"text":"Priority Queue Handling","type":"bonus"},
   {"text":"Premium Business Consultation","type":"bonus"}
 ]'::jsonb),

('social_media', 'Full Page Management', 'full-page-management', 1297, 12442,
 'Premium done-for-you solution with a full social media team experience',
 'Crown',
 'High-Growth Brands, Ecommerce, Real Estate, Law Firms, Med Spas',
 false, true, 4, 'Book a Strategy Call',
 '[
   {"text":"Instagram + Facebook Full Management","type":"feature"},
   {"text":"Everything in Full Management Package","type":"feature"},
   {"text":"Inbox & Message Replies","type":"feature"},
   {"text":"Comment Replies & Moderation","type":"feature"},
   {"text":"Customer Interaction Handling","type":"feature"},
   {"text":"Up To 5 Meta Ads Campaigns","type":"feature"},
   {"text":"Manage Up To $3500 Monthly Ad Spend","type":"feature"},
   {"text":"Weekly Performance Reports","type":"feature"},
   {"text":"Advanced Retargeting Strategy","type":"feature"},
   {"text":"Lead Funnel Optimization","type":"feature"},
   {"text":"One Dedicated Manager","type":"feature"},
   {"text":"Slack + Priority Support","type":"feature"},
   {"text":"Reputation Management","type":"feature"},
   {"text":"Advanced Audience Research","type":"feature"},
   {"text":"Daily Engagement Monitoring","type":"feature"},
   {"text":"Story Management","type":"feature"},
   {"text":"Content Publishing & Scheduling","type":"feature"},
   {"text":"Advanced Conversion Optimization","type":"feature"},
   {"text":"High-Performance Ad Strategy","type":"feature"},
   {"text":"Monthly Growth Planning","type":"feature"},
   {"text":"Custom Campaign Creation","type":"feature"},
   {"text":"Business Growth Consultation","type":"feature"},
   {"text":"Organic + Paid Growth Combination","type":"feature"},
   {"text":"Advanced Analytics Reporting","type":"feature"},
   {"text":"Crisis Response Support","type":"feature"},
   {"text":"Competitor Ad Monitoring","type":"feature"},
   {"text":"Advanced Brand Positioning","type":"feature"},
   {"text":"Conversion Focused Copywriting","type":"feature"},
   {"text":"Engagement Team Support","type":"feature"},
   {"text":"Trend Based Content Strategy","type":"feature"},
   {"text":"CTA Funnel Strategy","type":"feature"},
   {"text":"Lead Quality Optimization","type":"feature"},
   {"text":"High Priority Support Queue","type":"feature"},
   {"text":"Business Scaling Suggestions","type":"feature"},
   {"text":"Weekly Strategy Meetings","type":"bonus"},
   {"text":"Dedicated Priority Team","type":"bonus"},
   {"text":"Emergency Campaign Support","type":"bonus"},
   {"text":"Monthly Competitor Growth Analysis","type":"bonus"},
   {"text":"Premium Brand Growth Blueprint","type":"bonus"}
 ]'::jsonb);

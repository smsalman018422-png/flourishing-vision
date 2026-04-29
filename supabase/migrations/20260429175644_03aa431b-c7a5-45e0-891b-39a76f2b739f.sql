CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  category TEXT NOT NULL,
  is_founder BOOLEAN NOT NULL DEFAULT false,
  photo_url TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  linkedin_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members are viewable by everyone"
ON public.team_members FOR SELECT
USING (true);

CREATE POLICY "Admins can insert team members"
ON public.team_members FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update team members"
ON public.team_members FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete team members"
ON public.team_members FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_team_members_category ON public.team_members(category);
CREATE INDEX idx_team_members_founder ON public.team_members(is_founder);

-- Seed founders
INSERT INTO public.team_members (name, role, category, is_founder, photo_url, bio, skills, linkedin_url, sort_order) VALUES
('Alexandra Chen', 'Co-Founder & CEO', 'Strategy', true, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=600&fit=crop', 'Visionary leader with 15+ years scaling global brands across 40+ countries. Former VP Marketing at Fortune 500.', ARRAY['Brand Strategy','Leadership','Growth'], 'https://linkedin.com', 1),
('Marcus Rodriguez', 'Co-Founder & CCO', 'Creative Directors', true, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop', 'Award-winning creative director who has shaped campaigns for global icons. Cannes Lions winner x3.', ARRAY['Creative Direction','Storytelling','Art Direction'], 'https://linkedin.com', 2),
('Priya Sharma', 'Co-Founder & CGO', 'Paid Ads', true, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=600&fit=crop', 'Performance marketing genius. Managed $200M+ ad spend with consistent 4x+ ROAS across verticals.', ARRAY['Paid Media','Analytics','Growth Hacking'], 'https://linkedin.com', 3),
-- Team
('Sofia Martinelli', 'Senior Creative Director', 'Creative Directors', false, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop', 'Crafts brand worlds for fashion and lifestyle clients across Europe and APAC.', ARRAY['Branding','Campaigns'], 'https://linkedin.com', 10),
('James O''Brien', 'Creative Director', 'Creative Directors', false, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', 'Brings cinematic storytelling to digital-first campaigns.', ARRAY['Video','Storytelling'], 'https://linkedin.com', 11),
('Yuki Tanaka', 'Lead Designer', 'Designers', false, 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop', 'Minimalist design philosophy with maximum impact. Tokyo-based.', ARRAY['UI Design','Branding','Figma'], 'https://linkedin.com', 12),
('Emma Thompson', 'Senior Designer', 'Designers', false, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop', 'Motion and brand designer with a love for kinetic typography.', ARRAY['Motion','After Effects'], 'https://linkedin.com', 13),
('Rafael Costa', 'Visual Designer', 'Designers', false, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop', 'Crafts thumb-stopping social creative that converts.', ARRAY['Social Design','Illustration'], 'https://linkedin.com', 14),
('Lena Müller', 'Head of Content', 'Content Writers', false, 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop', 'Long-form storyteller turned brand content strategist.', ARRAY['Copywriting','SEO Content'], 'https://linkedin.com', 15),
('David Park', 'Senior Copywriter', 'Content Writers', false, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop', 'Punchy copy for performance ads and email funnels.', ARRAY['Direct Response','Email'], 'https://linkedin.com', 16),
('Aisha Khan', 'Social Media Lead', 'Social Media', false, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop', 'Builds communities of millions for lifestyle brands.', ARRAY['TikTok','Instagram','Community'], 'https://linkedin.com', 17),
('Tomás Silva', 'Social Media Manager', 'Social Media', false, 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop', 'Trend-spotter and short-form video strategist.', ARRAY['Reels','Shorts','Trends'], 'https://linkedin.com', 18),
('Isabella Rossi', 'Paid Media Lead', 'Paid Ads', false, 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400&h=400&fit=crop', 'Scales DTC brands from $10k to $1M+ monthly ad spend.', ARRAY['Meta Ads','Google Ads','TikTok Ads'], 'https://linkedin.com', 19),
('Hassan Ali', 'Performance Marketer', 'Paid Ads', false, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop', 'Bid strategy and creative testing specialist.', ARRAY['CRO','Testing'], 'https://linkedin.com', 20),
('Olivia Bennett', 'Senior Account Manager', 'Account Managers', false, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop', 'Trusted partner to enterprise clients across 12 markets.', ARRAY['Client Success','Strategy'], 'https://linkedin.com', 21),
('Noah Williams', 'Account Manager', 'Account Managers', false, 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop', 'Keeps growth pods in sync and clients delighted.', ARRAY['Project Management','Comms'], 'https://linkedin.com', 22),
('Mei Lin', 'Analytics Lead', 'Analytics', false, 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop', 'Turns dashboards into decisions. GA4, Mixpanel, Looker.', ARRAY['GA4','Looker','SQL'], 'https://linkedin.com', 23),
('Daniel Cohen', 'Data Analyst', 'Analytics', false, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', 'Attribution modeling and incrementality testing.', ARRAY['Attribution','Modeling'], 'https://linkedin.com', 24),
('Zara Ahmed', 'Brand Strategist', 'Strategy', false, 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&h=400&fit=crop', 'Positioning, naming, and category design.', ARRAY['Positioning','Research'], 'https://linkedin.com', 25),
('Lucas Fernandes', 'Growth Strategist', 'Strategy', false, 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop', 'Funnel architecture and lifecycle marketing.', ARRAY['Funnels','Lifecycle'], 'https://linkedin.com', 26),
('Hannah Becker', 'QC Lead', 'QC', false, 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=400&fit=crop', 'Last line of defense — every asset, perfect.', ARRAY['QA','Process'], 'https://linkedin.com', 27),
('Kenji Watanabe', 'QC Specialist', 'QC', false, 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&h=400&fit=crop', 'Pixel-perfect reviews for creative and copy.', ARRAY['QA','Detail'], 'https://linkedin.com', 28);
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  company TEXT NOT NULL,
  quote TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  photo_url TEXT,
  video_url TEXT,
  video_thumbnail_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Testimonials are viewable by everyone"
ON public.testimonials FOR SELECT USING (true);

CREATE POLICY "Admins can insert testimonials"
ON public.testimonials FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update testimonials"
ON public.testimonials FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete testimonials"
ON public.testimonials FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.testimonials (author_name, author_role, company, quote, rating, photo_url, video_url, video_thumbnail_url, sort_order) VALUES
('Sarah Mitchell', 'CEO', 'Bloom Beauty', 'They scaled our DTC brand from $50K to $500K monthly revenue in just 6 months. Their team feels like an extension of ours.', 5, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', NULL, NULL, 1),
('David Chen', 'Founder', 'Nimbus Tech', 'The ROI on our paid ads tripled within the first quarter. These guys actually understand performance marketing at scale.', 5, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop', 'https://www.w3schools.com/html/mov_bbb.mp4', 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=600&fit=crop', 2),
('Isabella Romano', 'CMO', 'Lumière Paris', 'Sophisticated, data-driven, and creative. They built our brand into a household name across three continents.', 5, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop', NULL, NULL, 3),
('Marcus Johnson', 'VP Growth', 'Velocity Fitness', 'Best agency partnership we''ve ever had. Period. They deliver on every promise and then some.', 5, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', 'https://www.w3schools.com/html/mov_bbb.mp4', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop', 4),
('Priya Patel', 'Head of Marketing', 'Saffron Foods', 'They transformed our social presence from invisible to industry-leading. Engagement up 800%, sales up 340%.', 5, 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop', NULL, NULL, 5),
('James O''Connor', 'Founder', 'Evergreen Outdoors', 'Their strategic thinking is unmatched. Every campaign feels intentional and every dollar is accounted for.', 5, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', NULL, NULL, 6),
('Yuki Nakamura', 'CEO', 'Origami Studios', 'Premium agency, premium results. Worth every yen. Our APAC expansion would not have happened without them.', 5, 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop', NULL, NULL, 7),
('Emma Larsson', 'Director', 'Nordic Home', 'Refined creative work paired with brutal performance discipline. The rare combo every brand needs.', 5, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop', NULL, NULL, 8);
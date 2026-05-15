-- Docs app tables (notepad, standards, groups, PDFs, flashcard daily, accoly)
-- Run in Supabase SQL editor after auth is enabled.

CREATE TABLE IF NOT EXISTS public.notepad_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject VARCHAR(100) DEFAULT 'General',
  image_data TEXT,
  preview_data_url TEXT,
  draw_data_url TEXT,
  bg_type VARCHAR(50) DEFAULT 'white',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  link TEXT,
  file_name VARCHAR(255),
  file_url TEXT,
  file_data TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(100),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  member_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.flashcard_daily (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject VARCHAR(50) NOT NULL,
  date_key VARCHAR(10) NOT NULL,
  reviewed INT DEFAULT 0,
  correct INT DEFAULT 0,
  incorrect INT DEFAULT 0,
  PRIMARY KEY (user_id, subject, date_key)
);

CREATE TABLE IF NOT EXISTS public.note_pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(100) DEFAULT 'General',
  storage_path TEXT NOT NULL,
  thumbnail TEXT,
  favorite BOOLEAN DEFAULT false,
  annotation_count INT DEFAULT 0,
  is_edited BOOLEAN DEFAULT false,
  last_opened_at TIMESTAMPTZ,
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pdf_annotations (
  file_id UUID PRIMARY KEY REFERENCES public.note_pdfs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pages JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.accoly_annotations (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pdf_name VARCHAR(512) NOT NULL,
  annotations JSONB DEFAULT '{}'::jsonb,
  saved_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, pdf_name)
);

-- user_stats (used by docs client; safe if already exists)
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_quizzes INT DEFAULT 0,
  total_xp INT DEFAULT 0,
  accuracy_percentage NUMERIC DEFAULT 0,
  average_accuracy NUMERIC DEFAULT 0,
  current_streak INT DEFAULT 0,
  best_score INT DEFAULT 0,
  level INT DEFAULT 1,
  last_attempt_date TIMESTAMPTZ
);

ALTER TABLE public.notepad_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accoly_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Notepad
CREATE POLICY "notepad_select_own" ON public.notepad_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notepad_insert_own" ON public.notepad_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notepad_update_own" ON public.notepad_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notepad_delete_own" ON public.notepad_entries FOR DELETE USING (auth.uid() = user_id);

-- Standards (readable by all authenticated; writable by owner)
CREATE POLICY "standards_select_auth" ON public.standards FOR SELECT TO authenticated USING (true);
CREATE POLICY "standards_insert_own" ON public.standards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "standards_update_own" ON public.standards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "standards_delete_own" ON public.standards FOR DELETE USING (auth.uid() = user_id);

-- Groups: members can read; creator can update members
CREATE POLICY "groups_select_member" ON public.groups FOR SELECT USING (auth.uid() = ANY(member_ids));
CREATE POLICY "groups_insert_auth" ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "groups_update_creator" ON public.groups FOR UPDATE USING (auth.uid() = created_by);

-- Group messages: members of the group
CREATE POLICY "group_messages_select" ON public.group_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND auth.uid() = ANY(g.member_ids))
);
CREATE POLICY "group_messages_insert" ON public.group_messages FOR INSERT WITH CHECK (
  auth.uid() = from_user_id AND
  EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND auth.uid() = ANY(g.member_ids))
);

-- Flashcard daily
CREATE POLICY "flash_daily_select_own" ON public.flashcard_daily FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "flash_daily_upsert_own" ON public.flashcard_daily FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Note PDFs
CREATE POLICY "note_pdfs_select_own" ON public.note_pdfs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "note_pdfs_insert_own" ON public.note_pdfs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "note_pdfs_update_own" ON public.note_pdfs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "note_pdfs_delete_own" ON public.note_pdfs FOR DELETE USING (auth.uid() = user_id);

-- PDF annotations
CREATE POLICY "pdf_ann_select_own" ON public.pdf_annotations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pdf_ann_upsert_own" ON public.pdf_annotations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Accoly workspace annotations
CREATE POLICY "accoly_ann_select_own" ON public.accoly_annotations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "accoly_ann_upsert_own" ON public.accoly_annotations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User stats
CREATE POLICY "user_stats_select_own" ON public.user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_stats_upsert_own" ON public.user_stats FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Storage bucket for note PDF binaries
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-pdfs', 'note-pdfs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "note_pdfs_storage_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'note-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "note_pdfs_storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'note-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "note_pdfs_storage_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'note-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "note_pdfs_storage_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'note-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
